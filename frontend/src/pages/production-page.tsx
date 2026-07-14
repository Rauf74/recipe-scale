import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, Printer, Search, ClipboardList } from "lucide-react";
import type { Recipe } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "#0f172a",
  color: "#f1f5f9",
  customClass: {
    popup: "rounded-2xl border border-surface-700/60 shadow-lg",
  },
});

interface BatchItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

interface Batch {
  id: string;
  recipe?: Recipe;
  targetYield: number;
  yieldUnit: string;
  status: "PLANNED" | "COMPLETED";
  estimatedCost: number;
  notes: string;
  createdAt: string;
  items: BatchItem[];
}

export function ProductionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [targetYield, setTargetYield] = useState(1);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLANNED" | "COMPLETED">("ALL");

  const menus = useMemo(
    () => recipes.filter((recipe) => recipe.recipeType === "MENU" || (!recipe.recipeType && !recipe.isBaseRecipe)),
    [recipes]
  );
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
      if (firstMenu) {
        setRecipeId(firstMenu.id);
        setTargetYield(firstMenu.yieldQuantity);
      }
    } catch {
      setError("Rencana produksi belum dapat dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleRecipeChange = (id: string) => {
    const recipe = menus.find((item) => item.id === id);
    setRecipeId(id);
    setTargetYield(recipe?.yieldQuantity ?? 1);
  };

  const createBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipeId || targetYield <= 0) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await apiClient.post<{ success: boolean; data: { batch: Batch } }>("/api/production/batches", {
        recipeId,
        targetYield,
        notes,
      });
      setBatches((current) => [{ ...response.data.data.batch, recipe: selectedRecipe }, ...current]);
      setNotes("");
      void Toast.fire({
        icon: "success",
        title: `Batch baru untuk "${selectedRecipe?.name}" direncanakan!`,
      });
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Gagal membuat batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const completeBatch = async (batchId: string, recipeName: string) => {
    const result = await Swal.fire({
      title: "Selesaikan Produksi?",
      text: `Apakah Anda yakin ingin menyelesaikan batch produksi "${recipeName}"? Stok bahan baku akan dikurangi sesuai resep.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesaikan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981", // emerald
      cancelButtonColor: "#334155",  // slate-700
      background: "#0f172a",
      color: "#f1f5f9",
      customClass: {
        popup: "rounded-3xl border border-surface-700/60 shadow-lg font-sans",
      },
    });

    if (result.isConfirmed) {
      setIsSaving(true);
      setError("");
      try {
        const response = await apiClient.post<{ success: boolean; data: { batch: Batch } }>(
          `/api/production/batches/${batchId}/complete`
        );
        setBatches((current) =>
          current.map((batch) =>
            batch.id === batchId ? { ...response.data.data.batch, recipe: batch.recipe } : batch
          )
        );
        void Toast.fire({
          icon: "success",
          title: `Batch "${recipeName}" selesai & stok berhasil dipotong!`,
        });
      } catch (requestError: any) {
        const msg = requestError.response?.data?.error || "Stok bahan baku tidak mencukupi untuk menyelesaikan batch.";
        void Swal.fire({
          title: "Stok Tidak Cukup",
          text: msg,
          icon: "error",
          confirmButtonColor: "#10b981",
          background: "#0f172a",
          color: "#f1f5f9",
          customClass: {
            popup: "rounded-3xl border border-surface-700/60 shadow-lg font-sans",
          },
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Filter batches based on status and search query
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const recipeName = batch.recipe?.name || "Resep produksi";
      const matchSearch =
        recipeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || batch.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Operasional Dapur</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 font-sans">Rencana Produksi</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Buat rencana batch dari resep menu. Sistem menyimpan snapshot kebutuhan bahan baku dan memotong stok gudang hanya saat batch diselesaikan.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-surface-700/60 hover:bg-surface-800/60 px-4 py-2 text-sm font-bold text-slate-300 transition-all cursor-pointer print:hidden"
        >
          <Printer className="h-4 w-4" />
          Cetak Halaman
        </button>
      </header>

      {/* Form: Buat Batch Rencana Baru */}
      <form
        onSubmit={createBatch}
        className="grid gap-4 rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5 sm:grid-cols-[1fr_180px_auto] sm:items-end"
      >
        <div className="sm:col-span-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Menu Makanan / Minuman
          </label>
          <select
            value={recipeId}
            onChange={(event) => handleRecipeChange(event.target.value)}
            className="select w-full"
          >
            {menus.length === 0 && <option value="">-- Belum ada resep menu --</option>}
            {menus.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Target Hasil (Porsi)
          </label>
          <input
            value={targetYield}
            onChange={(event) => setTargetYield(Number(event.target.value))}
            type="number"
            min="0.1"
            step="0.1"
            className="input w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving || !selectedRecipe}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 px-5 py-2.5 text-sm font-bold transition-all hover:shadow-brand active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 h-[38px] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Batch
        </button>

        <div className="sm:col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contoh: Produksi untuk catering siang, ekstra es, dll."
            className="input w-full"
          />
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-surface-800 pb-4">
        {/* Status Filters */}
        <div className="flex rounded-full bg-surface-900/60 p-1 border border-surface-700/60 w-full sm:w-auto">
          {(["ALL", "PLANNED", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-surface-800 text-brand-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "ALL" ? "Semua" : tab === "PLANNED" ? "Direncanakan" : "Selesai"}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama menu / catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full py-1.5 pl-8 pr-3 text-xs bg-surface-900/50 border-surface-700/60 rounded-xl"
            style={{ height: "auto" }}
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List of Batches */}
      <section className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-surface-700/60 px-6 py-16 text-center text-sm text-slate-500 flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-slate-700" />
            <span>
              {batches.length === 0
                ? "Belum ada rencana batch. Buat rencana pertama Anda di atas."
                : "Rencana batch tidak ditemukan."}
            </span>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const isCompleted = batch.status === "COMPLETED";
            return (
              <article
                key={batch.id}
                className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40"
              >
                {/* Batch Header */}
                <div className="flex flex-col gap-3 border-b border-surface-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-surface-900/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-100">{batch.recipe?.name || "Resep produksi"}</p>
                      {batch.notes && (
                        <span className="text-[10px] bg-surface-800 text-slate-400 px-2 py-0.5 rounded-md border border-surface-700/40">
                          {batch.notes}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Target: {batch.targetYield} {batch.yieldUnit === "portions" ? "porsi" : batch.yieldUnit === "grams" ? "gram" : batch.yieldUnit} · Estimasi HPP total:{" "}
                      <span className="font-mono text-slate-300">{formatRupiah(batch.estimatedCost)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold border tracking-wider uppercase ${
                        isCompleted
                          ? "bg-brand-500/10 text-brand-300 border-brand-500/20"
                          : "bg-warm-500/10 text-warm-300 border-warm-500/20"
                      }`}
                    >
                      {isCompleted ? "Selesai" : "Direncanakan"}
                    </span>
                    {!isCompleted && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void completeBatch(batch.id, batch.recipe?.name || "Resep")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Selesaikan
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Items list */}
                <div className="grid divide-y divide-surface-700/50 sm:grid-cols-2 lg:grid-cols-3 sm:divide-x sm:divide-y-0 bg-surface-950/20">
                  {batch.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <span className="text-xs text-slate-300 font-semibold">{item.ingredientName}</span>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-surface-950/40 border border-surface-800 px-2 py-1 rounded-lg">
                        {item.quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
