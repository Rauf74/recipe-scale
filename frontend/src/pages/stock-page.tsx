import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Loader2,
  PackagePlus,
  TriangleAlert,
  Package,
  History,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Ingredient } from "../types";
import { apiClient } from "../lib/api-client";

interface StockMovement {
  id: string;
  ingredientId: string;
  quantity: number;
  type: "IN" | "ADJUSTMENT" | "PRODUCTION_OUT";
  note: string;
  createdAt: string;
}

type ActiveTab = "stock-in" | "reorder" | "history";

export function StockPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form: Stok masuk
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form: Reorder point
  const [reorderId, setReorderId] = useState("");
  const [reorderValue, setReorderValue] = useState("");
  const [isSavingReorder, setIsSavingReorder] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("stock-in");

  const selectedIngredient = useMemo(
    () => ingredients.find(i => i.id === selectedId) ?? null,
    [ingredients, selectedId],
  );

  const reorderIngredient = useMemo(
    () => ingredients.find(i => i.id === reorderId) ?? null,
    [ingredients, reorderId],
  );

  // Bahan yang stoknya di bawah atau sama dengan reorder point (dan reorder point > 0)
  const lowStockIngredients = useMemo(
    () => ingredients.filter(i => (i.reorderPoint ?? 0) > 0 && (i.currentStock ?? 0) <= (i.reorderPoint ?? 0)),
    [ingredients],
  );

  // Nama bahan per ID untuk log riwayat
  const ingredientNameMap = useMemo(
    () => Object.fromEntries(ingredients.map(i => [i.id, i.name])),
    [ingredients],
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ingRes, movRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
        apiClient.get<{ success: boolean; data: { movements: StockMovement[] } }>("/api/ingredients/stock-movements"),
      ]);
      const ings = ingRes.data.data.ingredients;
      setIngredients(ings);
      if (movRes.data.success) setMovements(movRes.data.data.movements);
      // Auto-select bahan pertama
      setSelectedId(prev => prev || ings[0]?.id || "");
      setReorderId(prev => prev || ings[0]?.id || "");
    } catch {
      setError("Data stok belum dapat dimuat. Coba muat ulang halaman.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ── Handler: Stok Masuk ──
  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(quantity);
    if (!selectedId || !Number.isFinite(amount) || amount <= 0) {
      setError("Pilih bahan dan masukkan jumlah yang valid.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const res = await apiClient.post<{ success: boolean; data: { ingredient: Ingredient } }>(
        `/api/ingredients/${selectedId}/stock-adjustments`,
        { quantity: amount, note },
      );
      setIngredients(prev => prev.map(i => i.id === selectedId ? res.data.data.ingredient : i));
      // Tambah ke log lokal untuk update instan tanpa reload
      setMovements(prev => [{
        id: crypto.randomUUID(),
        ingredientId: selectedId,
        quantity: amount,
        type: "IN",
        note,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setQuantity("");
      setNote("");
      showSuccess(`Stok ${selectedIngredient?.name ?? "bahan"} berhasil ditambahkan.`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal menambah stok.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handler: Set Reorder Point ──
  const handleSaveReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(reorderValue);
    if (!reorderId || !Number.isFinite(value) || value < 0) {
      setError("Masukkan nilai batas minimum yang valid (≥ 0).");
      return;
    }
    setIsSavingReorder(true);
    setError("");
    try {
      // Reorder point disimpan via endpoint update ingredient
      const ing = ingredients.find(i => i.id === reorderId);
      if (!ing) throw new Error("Bahan tidak ditemukan");
      const res = await apiClient.put<{ success: boolean; data: { ingredient: Ingredient } }>(
        `/api/ingredients/${reorderId}`,
        {
          name: ing.name,
          unit: ing.unit,
          purchasePrice: ing.purchasePrice,
          purchaseQuantity: ing.purchaseQuantity,
          purchaseUnit: ing.purchaseUnit,
          usableYield: ing.usableYield,
          reorderPoint: value,
        },
      );
      setIngredients(prev => prev.map(i => i.id === reorderId ? res.data.data.ingredient : i));
      setReorderValue("");
      showSuccess(`Batas minimum ${reorderIngredient?.name ?? "bahan"} diperbarui ke ${value} ${reorderIngredient?.unit ?? ""}.`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal menyimpan batas minimum.");
    } finally {
      setIsSavingReorder(false);
    }
  };

  if (isLoading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>;
  }

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "stock-in", label: "Stok Masuk", icon: <PackagePlus className="h-4 w-4" /> },
    { id: "reorder", label: "Batas Minimum", icon: <Settings2 className="h-4 w-4" /> },
    { id: "history", label: "Riwayat Mutasi", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Persediaan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Stok Bahan</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Catat bahan masuk, atur batas minimum, dan pantau riwayat mutasi stok. Stok berkurang otomatis saat batch produksi diselesaikan.
        </p>
      </header>

      {/* Low Stock Alert — tampilkan nama-nama bahan */}
      {lowStockIngredients.length > 0 && (
        <div className="rounded-2xl border border-warm-500/25 bg-warm-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-warm-300 font-bold text-sm">
            <TriangleAlert className="h-4 w-4 text-warm-400 shrink-0" />
            {lowStockIngredients.length} bahan di bawah batas stok minimum
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockIngredients.map(ing => (
              <span key={ing.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warm-500/15 text-warm-200 text-xs font-semibold">
                <AlertCircle className="h-3 w-3 text-warm-400" />
                {ing.name}
                <span className="text-warm-500 font-normal">
                  {Number(ing.currentStock).toLocaleString("id-ID", { maximumFractionDigits: 2 })} / min {ing.reorderPoint} {ing.unit}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
          <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-500 hover:text-red-300 text-xs underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Form Panel kiri ── */}
        <div className="rounded-3xl border border-surface-700/60 bg-surface-900/40 overflow-hidden">
          {/* Tab nav */}
          <div className="flex border-b border-surface-700/60">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-400 bg-brand-500/5"
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-surface-800/40"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Tab 1: Stok Masuk ── */}
            {activeTab === "stock-in" && (
              <form onSubmit={handleStockIn} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tambahkan penerimaan belanja. Masukkan jumlah dalam satuan dasar bahan.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Bahan
                  </label>
                  {ingredients.length === 0 ? (
                    <p className="text-sm text-slate-600 py-2">Belum ada bahan. Tambahkan di tab Bahan terlebih dahulu.</p>
                  ) : (
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="select"
                    >
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Konteks stok saat ini */}
                {selectedIngredient && (
                  <div className="rounded-xl border border-surface-700/60 bg-surface-950/40 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Stok saat ini</span>
                    <span className={`font-bold font-mono ${
                      (selectedIngredient.reorderPoint ?? 0) > 0 && selectedIngredient.currentStock <= selectedIngredient.reorderPoint
                        ? "text-warm-300" : "text-brand-300"
                    }`}>
                      {Number(selectedIngredient.currentStock).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {selectedIngredient.unit}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Jumlah Masuk ({selectedIngredient?.unit ?? "—"})
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder={`Contoh: 5 (${selectedIngredient?.unit ?? "satuan"})`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Catatan <span className="normal-case font-normal text-slate-600">(opsional)</span>
                  </label>
                  <input
                    className="input"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Contoh: Belanja pasar Selasa pagi"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving || ingredients.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 hover:shadow-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                    : <><ArrowDownToLine className="h-4 w-4" /> Tambahkan Stok</>
                  }
                </button>
              </form>
            )}

            {/* ── Tab 2: Reorder Point ── */}
            {activeTab === "reorder" && (
              <form onSubmit={handleSaveReorder} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Atur batas minimum stok tiap bahan. Sistem akan memperingatkan saat stok menyentuh batas ini.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Bahan
                  </label>
                  <select
                    value={reorderId}
                    onChange={e => {
                      setReorderId(e.target.value);
                      const ing = ingredients.find(i => i.id === e.target.value);
                      setReorderValue(ing?.reorderPoint ? ing.reorderPoint.toString() : "");
                    }}
                    className="select"
                  >
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stok & reorder saat ini */}
                {reorderIngredient && (
                  <div className="rounded-xl border border-surface-700/60 bg-surface-950/40 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stok saat ini</span>
                      <span className="font-bold font-mono text-slate-200">
                        {Number(reorderIngredient.currentStock).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {reorderIngredient.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Batas minimum saat ini</span>
                      <span className="font-bold font-mono text-slate-400">
                        {reorderIngredient.reorderPoint > 0
                          ? `${reorderIngredient.reorderPoint} ${reorderIngredient.unit}`
                          : "Belum diatur"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Batas Minimum Baru ({reorderIngredient?.unit ?? "—"})
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={reorderValue}
                    onChange={e => setReorderValue(e.target.value)}
                    placeholder="Contoh: 500"
                  />
                  <p className="text-[10px] text-slate-600">Isi 0 untuk menonaktifkan peringatan batas minimum.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingReorder || ingredients.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 hover:shadow-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSavingReorder
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                    : <><Settings2 className="h-4 w-4" /> Simpan Batas Minimum</>
                  }
                </button>
              </form>
            )}

            {/* ── Tab 3: Riwayat Mutasi ── */}
            {activeTab === "history" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  50 mutasi terakhir. Stok masuk (+) dicatat manual, stok keluar (−) terjadi saat batch produksi selesai.
                </p>

                {movements.length === 0 ? (
                  <div className="py-10 text-center text-slate-600 text-sm">
                    Belum ada riwayat mutasi stok.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
                    {movements.map(m => {
                      const isIn = m.quantity > 0;
                      const typeLabel: Record<string, string> = {
                        IN: "Stok masuk",
                        ADJUSTMENT: "Penyesuaian",
                        PRODUCTION_OUT: "Produksi",
                      };
                      return (
                        <div key={m.id} className="flex items-start gap-3 rounded-xl border border-surface-700/50 bg-surface-950/40 p-3">
                          <div className={`mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isIn ? "bg-brand-500/15 text-brand-400" : "bg-warm-500/15 text-warm-400"
                          }`}>
                            {isIn ? "+" : "−"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-300 truncate">
                                {ingredientNameMap[m.ingredientId] ?? "Bahan dihapus"}
                              </span>
                              <span className={`font-mono text-xs font-bold shrink-0 ${isIn ? "text-brand-400" : "text-warm-400"}`}>
                                {isIn ? "+" : ""}{Number(m.quantity).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-600">
                                {typeLabel[m.type] ?? m.type}{m.note ? ` · ${m.note}` : ""}
                              </span>
                              <span className="text-[10px] text-slate-600 shrink-0">
                                {new Date(m.createdAt).toLocaleDateString("id-ID", {
                                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabel Ketersediaan Bahan ── */}
        <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40">
          <div className="flex items-center gap-3 border-b border-surface-700/60 px-5 py-4">
            <Package className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-100">Ketersediaan Bahan</h2>
            <span className="ml-auto text-xs text-slate-600">{ingredients.length} bahan</span>
          </div>

          {ingredients.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-600">
              Belum ada bahan baku. Tambahkan di tab <span className="text-brand-400 font-semibold">Bahan</span> terlebih dahulu.
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {ingredients.map(ing => {
                const isLow = (ing.reorderPoint ?? 0) > 0 && (ing.currentStock ?? 0) <= (ing.reorderPoint ?? 0);
                const stockPct = ing.reorderPoint > 0
                  ? Math.min((ing.currentStock / ing.reorderPoint) * 100, 200)
                  : null;

                return (
                  <div key={ing.id} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{ing.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ing.reorderPoint > 0
                            ? `Batas minimum: ${ing.reorderPoint} ${ing.unit}`
                            : <span className="text-slate-600 italic">Batas minimum belum diatur</span>
                          }
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono text-sm font-bold ${isLow ? "text-warm-300" : "text-brand-300"}`}>
                          {Number(ing.currentStock ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ing.unit}
                        </span>
                        {isLow && (
                          <p className="text-[10px] text-warm-500 font-semibold mt-0.5">⚠ Stok rendah</p>
                        )}
                      </div>
                    </div>

                    {/* Progress bar stok vs reorder point */}
                    {stockPct !== null && (
                      <div className="h-1 w-full rounded-full bg-surface-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isLow ? "bg-warm-500" : "bg-brand-500"}`}
                          style={{ width: `${Math.min(stockPct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
