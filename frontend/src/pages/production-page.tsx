import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, Printer } from "lucide-react";
import type { Recipe } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";

interface BatchItem { id: string; ingredientName: string; quantity: number; unit: string; }
interface Batch { id: string; recipe?: Recipe; targetYield: number; yieldUnit: string; status: "PLANNED" | "COMPLETED"; estimatedCost: number; notes: string; createdAt: string; items: BatchItem[]; }

export function ProductionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [targetYield, setTargetYield] = useState(1);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const menus = useMemo(() => recipes.filter((recipe) => recipe.recipeType === "MENU" || (!recipe.recipeType && !recipe.isBaseRecipe)), [recipes]);
  const selectedRecipe = menus.find((recipe) => recipe.id === recipeId);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recipesResponse, batchesResponse] = await Promise.all([
        apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
        apiClient.get<{ success: boolean; data: { batches: Batch[] } }>("/api/production/batches"),
      ]);
      const nextRecipes = recipesResponse.data.data.recipes;
      setRecipes(nextRecipes);
      setBatches(batchesResponse.data.data.batches);
      const firstMenu = nextRecipes.find((recipe) => recipe.recipeType === "MENU" || (!recipe.recipeType && !recipe.isBaseRecipe));
      if (firstMenu) { setRecipeId(firstMenu.id); setTargetYield(firstMenu.yieldQuantity); }
    } catch { setError("Rencana produksi belum dapat dimuat."); } finally { setIsLoading(false); }
  };
  useEffect(() => { void loadData(); }, []);

  const handleRecipeChange = (id: string) => {
    const recipe = menus.find((item) => item.id === id);
    setRecipeId(id);
    setTargetYield(recipe?.yieldQuantity ?? 1);
  };
  const createBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipeId || targetYield <= 0) return;
    setIsSaving(true); setError("");
    try {
      const response = await apiClient.post<{ success: boolean; data: { batch: Batch } }>("/api/production/batches", { recipeId, targetYield, notes });
      setBatches((current) => [{ ...response.data.data.batch, recipe: selectedRecipe }, ...current]); setNotes("");
    } catch (requestError: unknown) { setError(requestError instanceof Error ? requestError.message : "Gagal membuat batch."); } finally { setIsSaving(false); }
  };
  const completeBatch = async (batchId: string) => {
    setIsSaving(true); setError("");
    try {
      const response = await apiClient.post<{ success: boolean; data: { batch: Batch } }>(`/api/production/batches/${batchId}/complete`);
      setBatches((current) => current.map((batch) => batch.id === batchId ? { ...response.data.data.batch, recipe: batch.recipe } : batch));
    } catch (requestError: unknown) { setError(requestError instanceof Error ? requestError.message : "Stok tidak cukup untuk menyelesaikan batch."); } finally { setIsSaving(false); }
  };
  if (isLoading) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>;

  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Operasional Dapur</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Rencana Produksi</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Buat batch dari resep menu. Sistem menyimpan kebutuhan bahan sebagai snapshot dan mengurangi stok hanya saat batch selesai.</p></div><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-surface-700 px-4 py-2 text-sm font-bold text-slate-300 print:hidden"><Printer className="h-4 w-4" /> Cetak</button></header>
    <form onSubmit={createBatch} className="grid gap-4 rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5 sm:grid-cols-[1fr_180px_auto] sm:items-end">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Menu
        <select value={recipeId} onChange={(event) => handleRecipeChange(event.target.value)} className="select mt-2 w-full">
          {menus.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
        </select>
      </label>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Target hasil
        <input value={targetYield} onChange={(event) => setTargetYield(Number(event.target.value))} type="number" min="0.1" step="0.1" className="input mt-2 w-full" />
      </label>
      <button disabled={isSaving || !selectedRecipe} className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 hover:shadow-brand active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
        <Plus className="h-4 w-4" /> Buat batch
      </button>
      <div className="sm:col-span-2">
        <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan batch (opsional)" className="input w-full" />
      </div>
    </form>
    {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <section className="space-y-4">{batches.length === 0 ? <div className="rounded-3xl border border-dashed border-surface-700 px-6 py-16 text-center text-sm text-slate-500">Belum ada batch. Buat rencana pertama dari resep menu.</div> : batches.map((batch) => <article key={batch.id} className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40"><div className="flex flex-col gap-3 border-b border-surface-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-100">{batch.recipe?.name ?? "Resep produksi"}</p><p className="mt-1 text-xs text-slate-500">{batch.targetYield} {batch.yieldUnit} · estimasi {formatRupiah(batch.estimatedCost)}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${batch.status === "COMPLETED" ? "bg-brand-500/10 text-brand-300" : "bg-warm-500/10 text-warm-300"}`}>{batch.status === "COMPLETED" ? "Selesai" : "Direncanakan"}</span>{batch.status === "PLANNED" && <button disabled={isSaving} onClick={() => void completeBatch(batch.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-surface-950 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Selesaikan</button>}</div></div><div className="grid divide-y divide-surface-700/50 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{batch.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3"><span className="text-sm text-slate-300">{item.ingredientName}</span><span className="font-mono text-sm font-bold text-brand-300">{item.quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {item.unit}</span></div>)}</div></article>)}</section>
  </div>;
}
