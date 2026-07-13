import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Loader2, PackagePlus, TriangleAlert } from "lucide-react";
import type { Ingredient } from "../types";
import { apiClient } from "../lib/api-client";

export function StockPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedIngredient = useMemo(
    () => ingredients.find((ingredient) => ingredient.id === selectedId) ?? null,
    [ingredients, selectedId],
  );
  const lowStock = ingredients.filter((ingredient) => (ingredient.reorderPoint ?? 0) > 0 && (ingredient.currentStock ?? 0) <= (ingredient.reorderPoint ?? 0));

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients");
      setIngredients(response.data.data.ingredients);
      setSelectedId((current) => current || response.data.data.ingredients[0]?.id || "");
    } catch {
      setError("Stok bahan belum dapat dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadIngredients(); }, []);

  const handleStockIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!selectedId || !Number.isFinite(amount) || amount <= 0) {
      setError("Pilih bahan dan masukkan jumlah stok yang valid.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const response = await apiClient.post<{ success: boolean; data: { ingredient: Ingredient } }>(`/api/ingredients/${selectedId}/stock-adjustments`, { quantity: amount, note });
      setIngredients((items) => items.map((item) => item.id === selectedId ? response.data.data.ingredient : item));
      setQuantity("");
      setNote("");
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Gagal menambah stok.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Persediaan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Stok Bahan</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Catat bahan masuk. Stok akan berkurang otomatis hanya ketika batch produksi diselesaikan.</p>
      </header>

      {lowStock.length > 0 && <div className="flex gap-3 rounded-2xl border border-warm-500/25 bg-warm-500/10 p-4 text-sm text-warm-100"><TriangleAlert className="h-5 w-5 shrink-0 text-warm-400" /><p>{lowStock.length} bahan berada pada atau di bawah batas stok minimum.</p></div>}

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleStockIn} className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5">
          <div className="flex items-center gap-2 text-slate-100"><PackagePlus className="h-5 w-5 text-brand-400" /><h2 className="font-bold">Stok masuk</h2></div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Tambahkan penerimaan belanja dalam satuan dasar bahan.</p>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Bahan
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="input mt-2 w-full">
                {ingredients.map((ingredient) => <option value={ingredient.id} key={ingredient.id}>{ingredient.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah ({selectedIngredient?.unit ?? "-"})
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0.01" step="any" className="input mt-2 w-full" placeholder="Contoh: 5" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Catatan <span className="normal-case text-slate-600">(opsional)</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} className="input mt-2 w-full" placeholder="Contoh: Belanja pasar pagi" />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button disabled={isSaving || ingredients.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"><ArrowDownToLine className="h-4 w-4" />{isSaving ? "Menyimpan..." : "Tambahkan stok"}</button>
          </div>
        </form>

        <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40">
          <div className="border-b border-surface-700/60 px-5 py-4"><h2 className="font-bold text-slate-100">Ketersediaan bahan</h2></div>
          <div className="divide-y divide-surface-700/50">
            {ingredients.map((ingredient) => {
              const isLow = (ingredient.reorderPoint ?? 0) > 0 && (ingredient.currentStock ?? 0) <= (ingredient.reorderPoint ?? 0);
              return <div key={ingredient.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold text-slate-200">{ingredient.name}</p><p className="mt-1 text-xs text-slate-500">Batas minimum: {ingredient.reorderPoint || 0} {ingredient.unit}</p></div><span className={`font-mono text-sm font-bold ${isLow ? "text-warm-300" : "text-brand-300"}`}>{Number(ingredient.currentStock ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</span></div>;
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
