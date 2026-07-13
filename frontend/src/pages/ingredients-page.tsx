import React, { useEffect, useState } from "react";
import type { Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  ShoppingBag,
  Info
} from "lucide-react";

export const IngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form states
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"g" | "kg" | "ml" | "L" | "pcs">("kg");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Delete confirmation modal state (replaces window.confirm / alert)
  const [pendingDelete, setPendingDelete] = useState<Ingredient | null>(null);

  const [priceHistory, setPriceHistory] = useState<{ id: string; pricePerUnit: number; recordedAt: string }[]>([]);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients");
      if (res.data.success) {
        setIngredients(res.data.data.ingredients);
      }
    } catch (err) {
      console.error("Gagal memuat bahan baku:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (id: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { histories: any[] } }>(`/api/ingredients/${id}/history`);
      if (res.data.success) {
        setPriceHistory(res.data.data.histories);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat harga:", err);
    }
  };

  const handleEditClick = (ing: Ingredient) => {
    setEditingId(ing.id);
    setName(ing.name);
    setUnit(ing.unit);
    setPricePerUnit(ing.pricePerUnit.toString());
    setPriceHistory([]);
    fetchPriceHistory(ing.id);
    setError("");
    setPanelOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setName("");
    setUnit("kg");
    setPricePerUnit("");
    setPriceHistory([]);
    setError("");
    setPanelOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    const price = parseFloat(pricePerUnit);
    if (isNaN(price) || price < 0) {
      setError("Harga unit tidak valid");
      setActionLoading(false);
      return;
    }

    try {
      if (editingId) {
        // Edit Mode
        const res = await apiClient.put<{ success: boolean; data: { ingredient: Ingredient } }>(`/api/ingredients/${editingId}`, {
          name,
          unit,
          pricePerUnit: price,
        });
        if (res.data.success) {
          setIngredients(ingredients.map((ing) => (ing.id === editingId ? res.data.data.ingredient : ing)));
          setPanelOpen(false);
        }
      } else {
        // Create Mode
        const res = await apiClient.post<{ success: boolean; data: { ingredient: Ingredient } }>("/api/ingredients", {
          name,
          unit,
          pricePerUnit: price,
        });
        if (res.data.success) {
          setIngredients([res.data.data.ingredient, ...ingredients]);
          setPanelOpen(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menyimpan data bahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (ing: Ingredient) => {
    setPendingDelete(ing);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    try {
      await apiClient.delete(`/api/ingredients/${id}`);
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    } catch (err) {
      console.error("Gagal menghapus bahan baku:", err);
      setError("Gagal menghapus bahan baku. Pastikan bahan ini tidak sedang digunakan di dalam resep.");
    } finally {
      setPendingDelete(null);
    }
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-surface-900 border border-surface-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
          />
        </div>

        {/* Add Trigger */}
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan
        </button>
      </div>

      {/* Main Layout (Table & Panel overlay) */}
      <div className="relative flex items-start gap-6">
        {/* Ingredients Table Container */}
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
                {search ? "Pencarian tidak menemukan hasil." : "Tambahkan bahan baku dapur Anda (seperti Tepung, Gula, Bawang, Daging) beserta harga terbarunya."}
              </p>
              {!search && (
                <button
                  onClick={handleAddNewClick}
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
                  <th className="py-3.5 px-6">Harga / Unit</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {filteredIngredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-surface-900/20 transition-all group">
                    <td className="py-4 px-6 font-semibold text-slate-200">{ing.name}</td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="font-bold text-brand-400">{formatRupiah(ing.pricePerUnit)}</span>
                      <span className="text-slate-500 text-xs font-normal"> / {ing.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(ing)}
                          className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/10"
                          title="Edit Harga"
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

        {/* Slide-out Sidebar Form Panel */}
        {panelOpen && (
          <div className="w-full max-w-sm shrink-0 border border-surface-700 bg-surface-900/50 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-700/80 pb-3">
              <h3 className="font-bold text-slate-200 text-base">
                {editingId ? "Ubah Bahan Baku" : "Bahan Baku Baru"}
              </h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Nama Bahan Baku
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bawang Merah, Daging Sapi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-950/40 border border-surface-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Satuan Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-950/40 border border-surface-700 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500/50 text-sm transition-all cursor-pointer"
                  >
                    <option value="kg" className="bg-slate-950">kg (Kilogram)</option>
                    <option value="g" className="bg-slate-950">g (Gram)</option>
                    <option value="L" className="bg-slate-950">L (Liter)</option>
                    <option value="ml" className="bg-slate-950">ml (Mililiter)</option>
                    <option value="pcs" className="bg-slate-950">pcs (Butir/Biji)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Harga / Unit (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 15000"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-950/40 border border-surface-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-950/30 rounded-xl border border-surface-700 flex items-start gap-2.5 text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Perubahan harga bahan baku akan langsung memicu penghitungan ulang modal HPP untuk seluruh resep dasar (bumbu) dan resep akhir yang menggunakan bahan ini.
                </p>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/10"
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
            </form>

            {/* Price History Timeline */}
            {editingId && priceHistory.length > 0 && (
              <div className="pt-4 border-t border-surface-700/80 space-y-2">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  📈 Riwayat Perubahan Harga
                </h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {priceHistory.map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-surface-950/40 border border-surface-700/60">
                      <span className="text-brand-400 font-extrabold">
                        {formatRupiah(h.pricePerUnit)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {new Date(h.recordedAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-100 text-base">Hapus Bahan Baku</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Yakin hapus <span className="text-slate-200 font-semibold">{pendingDelete.name}</span>?
              Bahan yang dipakai di resep tidak bisa dihapus.
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => { setPendingDelete(null); setError(""); }}
                className="px-4 py-2 rounded-xl border border-surface-700 hover:bg-surface-800 text-slate-400 font-bold transition-all cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
