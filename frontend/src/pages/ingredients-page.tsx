import React, { useEffect, useMemo, useState } from "react";
import type { Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  ShoppingBag,
  Calculator,
  PackageOpen,
  Scissors,
} from "lucide-react";

// Satuan resep yang didukung oleh sistem konversi backend
const RECIPE_UNITS = ["g", "kg", "ml", "L", "pcs"] as const;
type RecipeUnit = typeof RECIPE_UNITS[number];

// Satuan kemasan yang diizinkan per keluarga unit resep.
// Isi kemasan HARUS dalam keluarga yang sama agar konversi backend valid.
const PURCHASE_UNIT_OPTIONS: Record<RecipeUnit, string[]> = {
  g:   ["g", "kg"],
  kg:  ["kg", "g"],
  ml:  ["ml", "L"],
  L:   ["L", "ml"],
  pcs: ["pcs"],
};

// Form state yang mencerminkan cara input belanja nyata
interface IngredientForm {
  name: string;
  unit: RecipeUnit;           // satuan resep
  purchasePrice: string;      // harga kemasan (Rp) — string untuk input bebas
  purchaseQuantity: string;   // isi kemasan dalam satuan resep — string untuk input bebas
  purchaseUnit: string;       // label kemasan bebas: "kg", "pack", "ikat"
  usableYield: string;        // susut/trim %, default "100"
}

const EMPTY_FORM: IngredientForm = {
  name: "",
  unit: "kg",
  purchasePrice: "",
  purchaseQuantity: "",
  purchaseUnit: "",
  usableYield: "100",
};

export const IngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [customUnits, setCustomUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Panel form state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<Ingredient | null>(null);

  // Price history untuk ditampilkan saat edit
  const [priceHistory, setPriceHistory] = useState<{
    id: string;
    pricePerUnit: number;
    purchasePrice: number;
    purchaseQuantity: number;
    purchaseUnit: string;
    usableYield: number;
    recordedAt: string;
  }[]>([]);

  // Conversion Helper
  const getConversionFactor = (purchaseUnit: string, recipeUnit: string, list: any[]): number => {
    if (purchaseUnit === recipeUnit) return 1;

    // Standard mass conversion:
    if (recipeUnit === "g" && purchaseUnit === "kg") return 1000;
    if (recipeUnit === "kg" && purchaseUnit === "g") return 0.001;

    // Standard volume conversion:
    if (recipeUnit === "ml" && purchaseUnit === "L") return 1000;
    if (recipeUnit === "L" && purchaseUnit === "ml") return 0.001;

    // Check custom unit:
    const found = list.find((cu) => cu.name.toLowerCase() === purchaseUnit.toLowerCase());
    if (found) {
      const baseFactor = found.conversionFactor;
      const baseToRecipe = getConversionFactor(found.baseUnit, recipeUnit, []);
      return baseFactor * baseToRecipe;
    }

    return 1;
  };

  const getPurchaseUnitOptions = (recipeUnit: string) => {
    const standard = PURCHASE_UNIT_OPTIONS[recipeUnit as RecipeUnit] || [recipeUnit];
    
    let familyUnits = [recipeUnit];
    if (recipeUnit === "g" || recipeUnit === "kg") {
      familyUnits = ["g", "kg"];
    } else if (recipeUnit === "ml" || recipeUnit === "L") {
      familyUnits = ["ml", "L"];
    } else if (recipeUnit === "pcs") {
      familyUnits = ["pcs"];
    }

    const custom = customUnits
      .filter((cu) => familyUnits.includes(cu.baseUnit))
      .map((cu) => cu.name);

    return Array.from(new Set([...standard, ...custom]));
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      // Fetch custom units first
      const cuRes = await apiClient.get<{ success: boolean; data: { customUnits: any[] } }>("/api/custom-units");
      let list: any[] = [];
      if (cuRes.data.success) {
        list = cuRes.data.data.customUnits;
        setCustomUnits(list);
      }

      // Fetch ingredients next
      const ingRes = await apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients");
      if (ingRes.data.success) {
        setIngredients(ingRes.data.data.ingredients);
      }
    } catch (err) {
      console.error("Gagal memuat data halaman:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (id: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { histories: typeof priceHistory } }>(`/api/ingredients/${id}/history`);
      if (res.data.success) setPriceHistory(res.data.data.histories);
    } catch (err) {
      console.error("Gagal memuat riwayat harga:", err);
    }
  };

  // --- Live preview: hitung costPerRecipeUnit langsung di client untuk feedback instan ---
  const previewCost = useMemo<number | null>(() => {
    const price = parseFloat(form.purchasePrice);
    const qtyInput = parseFloat(form.purchaseQuantity);
    const yield_ = parseFloat(form.usableYield) || 100;
    if (!isFinite(price) || price < 0) return null;
    if (!isFinite(qtyInput) || qtyInput <= 0) return null;

    const factor = getConversionFactor(form.purchaseUnit, form.unit, customUnits);
    const qty = qtyInput * factor;

    const raw = price / qty;
    return raw / (yield_ / 100);
  }, [form.purchasePrice, form.purchaseQuantity, form.usableYield, form.purchaseUnit, form.unit, customUnits]);

  // --- Handlers ---
  const openAddNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPriceHistory([]);
    setError("");
    setPanelOpen(true);
  };

  const openEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    const allowedUnits = getPurchaseUnitOptions(ing.unit);
    const savedUnit = ing.purchaseUnit && allowedUnits.includes(ing.purchaseUnit)
      ? ing.purchaseUnit
      : allowedUnits[0] || ing.unit;

    const factor = getConversionFactor(savedUnit, ing.unit, customUnits);
    const displayQty = ing.purchaseQuantity / factor;

    setForm({
      name: ing.name,
      unit: ing.unit,
      purchasePrice: ing.purchasePrice > 0 ? ing.purchasePrice.toString() : "",
      purchaseQuantity: ing.purchaseQuantity > 0 ? displayQty.toString() : "",
      purchaseUnit: savedUnit,
      usableYield: ing.usableYield > 0 ? ing.usableYield.toString() : "100",
    });
    setPriceHistory([]);
    fetchPriceHistory(ing.id);
    setError("");
    setPanelOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    const purchasePrice = parseFloat(form.purchasePrice);
    const qtyInput = parseFloat(form.purchaseQuantity);
    const usableYield = parseFloat(form.usableYield) || 100;

    if (!isFinite(purchasePrice) || purchasePrice < 0) {
      setError("Harga beli tidak valid");
      setActionLoading(false);
      return;
    }
    if (!isFinite(qtyInput) || qtyInput <= 0) {
      setError("Jumlah kemasan harus lebih dari nol");
      setActionLoading(false);
      return;
    }

    const factor = getConversionFactor(form.purchaseUnit, form.unit, customUnits);
    const purchaseQuantity = qtyInput * factor;

    const payload = {
      name: form.name.trim(),
      unit: form.unit,
      purchasePrice,
      purchaseQuantity,
      purchaseUnit: form.purchaseUnit.trim() || form.unit,
      usableYield,
    };

    try {
      if (editingId) {
        const res = await apiClient.put<{ success: boolean; data: { ingredient: Ingredient } }>(`/api/ingredients/${editingId}`, payload);
        if (res.data.success) {
          setIngredients(prev => prev.map(i => i.id === editingId ? res.data.data.ingredient : i));
          setPanelOpen(false);
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: { ingredient: Ingredient } }>("/api/ingredients", payload);
        if (res.data.success) {
          setIngredients(prev => [res.data.data.ingredient, ...prev]);
          setPanelOpen(false);
        }
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || "Gagal menyimpan data bahan baku");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (ing: Ingredient) => setPendingDelete(ing);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await apiClient.delete(`/api/ingredients/${pendingDelete.id}`);
      setIngredients(prev => prev.filter(i => i.id !== pendingDelete.id));
    } catch (err) {
      console.error("Gagal menghapus:", err);
      setError("Gagal menghapus bahan baku. Pastikan bahan ini tidak sedang digunakan di dalam resep.");
    } finally {
      setPendingDelete(null);
    }
  };

  const setField = <K extends keyof IngredientForm>(key: K, value: IngredientForm[K] | ((prev: IngredientForm[K]) => IngredientForm[K])) => {
    setForm(prev => {
      const nextValue = typeof value === "function" ? (value as Function)(prev[key]) : value;
      return { ...prev, [key]: nextValue };
    });
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari bahan baku..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-surface-900 border border-surface-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
          />
        </div>
        <button
          onClick={openAddNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-brand active:scale-[0.98] cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan
        </button>
      </div>

      {/* Main Layout: Table + Slide-out Panel */}
      <div className="relative flex items-start gap-6">
        {/* Ingredient Table */}
        <div className="flex-1 overflow-x-auto rounded-2xl bg-surface-900/40 border border-surface-700/60">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-sm">Memuat daftar bahan baku...</span>
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 max-w-md mx-auto text-center px-4">
              <div className="p-4 bg-surface-900 rounded-2xl border border-surface-700 text-slate-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">Belum ada bahan baku</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {search
                  ? "Pencarian tidak menemukan hasil."
                  : "Tambahkan bahan baku dapur Anda (seperti Tepung, Gula, Bawang, Daging) beserta cara belinya."}
              </p>
              {!search && (
                <button
                  onClick={openAddNew}
                  className="mt-4 px-4 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/25 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Buat Bahan Pertama
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-700/80 text-slate-400 font-semibold tracking-wide text-xs bg-surface-900/50 uppercase">
                  <th className="py-3.5 px-6">Nama Bahan</th>
                  <th className="py-3.5 px-6">Cara Beli</th>
                  <th className="py-3.5 px-6">Biaya / Satuan Resep</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-surface-900/20 transition-all group">
                    <td className="py-4 px-6 font-semibold text-slate-200">{ing.name}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {ing.purchasePrice > 0 ? (
                        <span>
                          {formatRupiah(ing.purchasePrice)}{" "}
                          <span className="text-slate-500">
                            / {ing.purchaseQuantity} {ing.purchaseUnit || ing.unit}
                            {ing.usableYield < 100 && ` · susut ${100 - ing.usableYield}%`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-brand-400">{formatRupiah(ing.costPerRecipeUnit || ing.pricePerUnit)}</span>
                      <span className="text-slate-500 text-xs font-normal"> / {ing.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(ing)}
                          className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-brand-500/10"
                          title="Edit Bahan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ing)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                          title="Hapus Bahan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Slide-out Form Panel */}
        {panelOpen && (
          <div className="w-full max-w-sm shrink-0 border border-surface-700 bg-surface-900/60 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/80">
              <h3 className="font-bold text-slate-200 text-sm">
                {editingId ? "Ubah Bahan Baku" : "Bahan Baku Baru"}
              </h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5" id="ingredient-form">
                {/* ── Section 1: Identitas ── */}
                <section className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identitas Bahan</p>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Nama Bahan Baku
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bawang Merah, Daging Sapi, Tepung Terigu"
                      value={form.name}
                      onChange={e => setField("name", e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Satuan Resep
                    </label>
                    <select
                      value={form.unit}
                      onChange={e => {
                        const newUnit = e.target.value as RecipeUnit;
                        const allowed = getPurchaseUnitOptions(newUnit);
                        setForm(prev => ({
                          ...prev,
                          unit: newUnit,
                          purchaseUnit: allowed[0] || newUnit,
                        }));
                      }}
                      className="select"
                    >
                      <option value="g">g — Gram (untuk berat kecil)</option>
                      <option value="kg">kg — Kilogram</option>
                      <option value="ml">ml — Mililiter (untuk cairan kecil)</option>
                      <option value="L">L — Liter</option>
                      <option value="pcs">pcs — Butir / Biji / Buah</option>
                    </select>
                    <p className="mt-1 text-[10px] text-slate-600">Satuan ini dipakai di form resep nanti.</p>
                  </div>
                </section>

                {/* ── Section 2: Cara Beli ── */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PackageOpen className="w-3.5 h-3.5 text-brand-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cara Beli (Kemasan)</p>
                  </div>

                  {/* Harga beli */}
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Harga Beli (Rp)
                    </label>
                    <CurrencyInput
                      required
                      placeholder="Contoh: 75000"
                      value={form.purchasePrice}
                      onChange={val => setField("purchasePrice", val)}
                    />
                    <p className="mt-1 text-[10px] text-slate-600">Harga total satu kemasan saat dibeli.</p>
                  </div>

                  {/* Isi kemasan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Isi Kemasan
                      </label>
                      <input
                        type="number"
                        required
                        min="0.0001"
                        step="any"
                        placeholder={`Contoh: 5000`}
                        value={form.purchaseQuantity}
                        onChange={e => setField("purchaseQuantity", e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Satuan Kemasan
                      </label>
                      <select
                        value={form.purchaseUnit}
                        onChange={e => setField("purchaseUnit", e.target.value)}
                        className="select"
                      >
                        {getPurchaseUnitOptions(form.unit).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Isi kemasan dalam satuan <span className="text-slate-400 font-semibold">{form.purchaseUnit}</span>,
                    dikonversi ke satuan resep <span className="text-slate-400 font-semibold">{form.unit}</span> secara otomatis.
                  </p>
                </section>

                {/* ── Section 3: Susut ── */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-warm-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Susut / Trim (Opsional)</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Usable Yield (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={form.usableYield}
                        onChange={e => setField("usableYield", e.target.value)}
                        className="flex-1 accent-brand-500 cursor-pointer"
                      />
                      <div className="w-14 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={form.usableYield}
                          onChange={e => setField("usableYield", e.target.value)}
                          className="w-full px-2 py-1.5 bg-surface-950/40 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500/50 text-sm text-center font-bold"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">
                      Default 100% (tidak ada susut). Contoh: bawang dikupas → 80%.
                    </p>
                  </div>
                </section>
              </form>

              {/* ── Live Preview Card ── */}
              <div className={`rounded-xl border p-4 space-y-2 transition-all ${
                previewCost !== null
                  ? "border-brand-500/30 bg-brand-500/5"
                  : "border-surface-700/60 bg-surface-900/30"
              }`}>
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-brand-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                    Preview Biaya
                  </p>
                </div>

                {previewCost !== null ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500">Biaya per satuan resep</span>
                      <span className="font-extrabold text-lg text-slate-100">
                        {formatRupiah(previewCost)}
                        <span className="text-xs font-normal text-slate-400"> / {form.unit}</span>
                      </span>
                    </div>
                    {parseFloat(form.usableYield) < 100 && (
                      <p className="text-[10px] text-slate-500">
                        Sudah memperhitungkan susut {100 - parseFloat(form.usableYield)}%
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-surface-700/50">
                      Nilai ini dipakai untuk menghitung HPP di semua resep yang memakai bahan ini.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">
                    Isi harga beli dan isi kemasan di atas untuk melihat biaya aktual per {form.unit}.
                  </p>
                )}
              </div>

              {/* Price History */}
              {editingId && priceHistory.length > 0 && (
                <div className="pt-1 border-t border-surface-700/60 space-y-2">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    📈 Riwayat Perubahan Biaya
                  </h4>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {priceHistory.map(h => (
                      <div key={h.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-surface-950/40 border border-surface-700/60">
                        <div className="space-y-0.5">
                          <span className="text-brand-400 font-extrabold block">
                            {formatRupiah(h.pricePerUnit)} / {form.unit}
                          </span>
                          {h.purchasePrice > 0 && (
                            <span className="text-[9px] text-slate-600">
                              {formatRupiah(h.purchasePrice)} / {h.purchaseQuantity} {h.purchaseUnit}
                              {h.usableYield < 100 && ` · yield ${h.usableYield}%`}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-semibold shrink-0 ml-2">
                          {new Date(h.recordedAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                form="ingredient-form"
                disabled={actionLoading}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow-lg hover:shadow-brand text-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Bahan"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <ConfirmDeleteModal
          title="Hapus Bahan Baku"
          itemName={pendingDelete.name}
          description="Bahan yang dipakai di resep tidak bisa dihapus."
          error={error}
          onConfirm={confirmDelete}
          onCancel={() => { setPendingDelete(null); setError(""); }}
        />
      )}
    </div>
  );
};
