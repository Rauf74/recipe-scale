import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Loader2,
  PackagePlus,
  TriangleAlert,
  Package,
  History,
  Settings2,
  Plus,
  X,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import Swal from "sweetalert2";
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

export function StockPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Slide-over panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [panelTab, setPanelTab] = useState<"stock-in" | "reorder">("stock-in");

  // Form states
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [reorderValue, setReorderValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);

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

  // TanStack Table
  const columnHelper = createColumnHelper<Ingredient>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      id: "name",
      header: "Nama Bahan",
      enableSorting: true,
      cell: () => null,
    }),
    columnHelper.accessor(row => row.currentStock ?? 0, {
      id: "stock",
      header: "Stok",
      enableSorting: true,
      sortDescFirst: true,
      cell: () => null,
    }),
    columnHelper.accessor(row => row.reorderPoint ?? 0, {
      id: "reorderPoint",
      header: "Batas Min.",
      enableSorting: false,
      cell: () => null,
    }),
  ], []);

  const tableData = useMemo(() => ingredients, [ingredients]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter: searchQuery },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    autoResetPageIndex: true,
    globalFilterFn: (row, _colId, filterValue) =>
      (row.original.name as string).toLowerCase().includes((filterValue as string).toLowerCase()),
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ingRes, movRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
        apiClient.get<{ success: boolean; data: { movements: StockMovement[] } }>("/api/ingredients/stock-movements"),
      ]);
      if (ingRes.data.success) {
        setIngredients(ingRes.data.data.ingredients);
      }
      if (movRes.data.success) {
        setMovements(movRes.data.data.movements);
      }
    } catch (err) {
      console.error(err);
      setError("Data stok belum dapat dimuat. Coba muat ulang halaman.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openManagePanel = (ing: Ingredient, defaultTab: "stock-in" | "reorder") => {
    setSelectedIngredient(ing);
    setPanelTab(defaultTab);
    setQuantity("");
    setNote("");
    setReorderValue(ing.reorderPoint > 0 ? ing.reorderPoint.toString() : "");
    setError("");
    setPanelOpen(true);
  };

  // ── Handler: Stok Masuk ──
  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const res = await apiClient.post<{ success: boolean; data: { ingredient: Ingredient } }>(
        `/api/ingredients/${selectedIngredient.id}/stock-adjustments`,
        { quantity: amount, note },
      );
      if (res.data.success) {
        const updatedIng = res.data.data.ingredient;
        setIngredients(prev => prev.map(i => i.id === updatedIng.id ? updatedIng : i));
        
        // Tambah ke log lokal
        setMovements(prev => [{
          id: crypto.randomUUID(),
          ingredientId: updatedIng.id,
          quantity: amount,
          type: "IN",
          note,
          createdAt: new Date().toISOString(),
        }, ...prev]);

        setPanelOpen(false);
        void Toast.fire({
          icon: "success",
          title: `Stok ${updatedIng.name} berhasil ditambahkan!`,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Gagal menambah stok.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handler: Set Reorder Point ──
  const handleSaveReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    const value = parseFloat(reorderValue);
    if (!Number.isFinite(value) || value < 0) {
      setError("Masukkan batas minimum yang valid.");
      return;
    }
    setIsSavingReorder(true);
    setError("");
    try {
      const res = await apiClient.put<{ success: boolean; data: { ingredient: Ingredient } }>(
        `/api/ingredients/${selectedIngredient.id}`,
        {
          name: selectedIngredient.name,
          unit: selectedIngredient.unit,
          purchasePrice: selectedIngredient.purchasePrice,
          purchaseQuantity: selectedIngredient.purchaseQuantity,
          purchaseUnit: selectedIngredient.purchaseUnit,
          usableYield: selectedIngredient.usableYield,
          reorderPoint: value,
        },
      );
      if (res.data.success) {
        const updatedIng = res.data.data.ingredient;
        setIngredients(prev => prev.map(i => i.id === updatedIng.id ? updatedIng : i));
        setPanelOpen(false);
        void Toast.fire({
          icon: "success",
          title: `Batas minimum ${updatedIng.name} diperbarui!`,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Gagal menyimpan batas minimum.");
    } finally {
      setIsSavingReorder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Persediaan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 font-sans">Stok Bahan</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Kelola stok masuk, atur batas pengingat kritis, dan pantau mutasi persediaan secara langsung.
        </p>
      </header>

      {/* Low Stock Alert */}
      {lowStockIngredients.length > 0 && (
        <div className="rounded-2xl border border-warm-500/25 bg-warm-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-warm-300 font-bold text-sm">
            <TriangleAlert className="h-4 w-4 text-warm-400 shrink-0" />
            {lowStockIngredients.length} bahan baku di bawah batas minimum
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockIngredients.map(ing => (
              <span key={ing.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warm-500/15 text-warm-200 text-xs font-semibold">
                <AlertCircle className="h-3 w-3 text-warm-400" />
                {ing.name}
                <span className="text-warm-500 font-normal">
                  ({Number(ing.currentStock).toLocaleString("id-ID", { maximumFractionDigits: 2 })} / min {ing.reorderPoint} {ing.unit})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-stretch">
        
        {/* ── Ketersediaan Bahan (Table View) ── */}
        <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40 lg:flex lg:flex-col lg:h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-700/60 px-5 py-4 gap-3 bg-surface-900/20 shrink-0">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-slate-500" />
              <h2 className="font-bold text-slate-100 font-sans">Ketersediaan Bahan</h2>
              <span className="text-xs text-slate-500">
              ({table.getFilteredRowModel().rows.length} dari {ingredients.length} bahan)
              </span>
            </div>
            
            {/* Search Input Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input py-1 pr-3 text-xs w-full sm:w-48 bg-surface-950 border-surface-700/60 rounded-xl"
                style={{ paddingLeft: "2.25rem", paddingRight: "2rem", height: "auto" }}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {ingredients.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-600">
              Belum ada bahan baku. Tambahkan di tab <span className="text-brand-400 font-semibold font-bold">Bahan</span> terlebih dahulu.
            </div>
          ) : (
            <>
              {table.getRowModel().rows.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-slate-500 italic bg-surface-950/10">
                  Bahan baku &ldquo;{searchQuery}&rdquo; tidak ditemukan.
                </div>
              ) : (
                <div className="divide-y divide-surface-700/50 lg:flex-1 lg:overflow-y-auto">
                  {table.getRowModel().rows.map(row => {
                    const ing = row.original;
                    const isLow = (ing.reorderPoint ?? 0) > 0 && (ing.currentStock ?? 0) <= (ing.reorderPoint ?? 0);
                    const stockPct = ing.reorderPoint > 0
                      ? Math.min((ing.currentStock / ing.reorderPoint) * 100, 200)
                      : null;

                    return (
                      <div key={row.id} className="px-5 py-4 space-y-3 hover:bg-surface-800/10 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-200 truncate">{ing.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {ing.reorderPoint > 0
                                ? `Batas minimum: ${ing.reorderPoint} ${ing.unit}`
                                : <span className="text-slate-600 italic text-[10px]">Batas minimum belum diatur</span>
                              }
                            </p>
                          </div>
                          
                          {/* Current Stock Value */}
                          <div className="text-right shrink-0">
                            <span className={`font-mono text-sm font-bold ${isLow ? "text-warm-300" : "text-brand-300"}`}>
                              {Number(ing.currentStock ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ing.unit}
                            </span>
                            {isLow && (
                              <p className="text-[10px] text-warm-500 font-semibold mt-0.5">⚠ Stok rendah</p>
                            )}
                          </div>

                          {/* Direct Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <button
                              onClick={() => openManagePanel(ing, "stock-in")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
                              title="Tambah Stok Masuk"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Stok</span>
                            </button>
                            <button
                              onClick={() => openManagePanel(ing, "reorder")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-surface-700 hover:bg-surface-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                              title="Atur Batas Pengingat Kritis"
                            >
                              <Settings2 className="w-3 h-3 text-slate-500" />
                              <span>Batas</span>
                            </button>
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
            </>
          )}

          {/* Pagination Control */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-surface-700/40 bg-surface-900/10 text-xs text-slate-400 shrink-0">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-200">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>
                {" "}-{" "}
                <span className="font-semibold text-slate-200">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>
                {" "}dari{" "}
                <span className="font-semibold text-slate-200">{table.getFilteredRowModel().rows.length}</span> bahan
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1.5 rounded-lg border border-surface-700 hover:bg-surface-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 font-semibold cursor-pointer transition-all disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 text-slate-400 font-medium">
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1.5 rounded-lg border border-surface-700 hover:bg-surface-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 font-semibold cursor-pointer transition-all disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Riwayat Mutasi (Sidebar View - Stretches and Scrolls) ── */}
        <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40 lg:flex lg:flex-col lg:h-full">
          <div className="flex items-center gap-3 border-b border-surface-700/60 px-5 py-4 shrink-0">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-100 font-sans">Riwayat Mutasi</h2>
          </div>

          <div className="p-4 space-y-3 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <p className="text-[10px] text-slate-500 leading-relaxed shrink-0">
              Log mutasi (50 transaksi terakhir). Stok masuk (+) di-input manual, stok keluar (−) dikurangi otomatis saat produksi selesai.
            </p>

            {movements.length === 0 ? (
              <div className="py-16 text-center text-slate-600 text-xs italic shrink-0">
                Belum ada transaksi mutasi.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] lg:max-h-none lg:flex-1 lg:overflow-y-auto pr-0.5 min-h-0">
                {movements.map(m => {
                  const isIn = m.quantity > 0;
                  const typeLabel: Record<string, string> = {
                    IN: "Masuk",
                    ADJUSTMENT: "Manual",
                    PRODUCTION_OUT: "Produksi",
                  };
                  return (
                    <div key={m.id} className="flex items-start gap-2.5 rounded-xl border border-surface-700/40 bg-surface-950/20 p-2.5">
                      <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        isIn ? "bg-brand-500/10 text-brand-400" : "bg-warm-500/10 text-warm-400"
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
                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[9px] text-slate-600">
                          <span className="truncate">
                            {typeLabel[m.type] ?? m.type}{m.note ? ` · ${m.note}` : ""}
                          </span>
                          <span className="shrink-0 font-light">
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
        </section>
      </div>

      {/* ── Slide-Over Panel: Kelola Stok (Tambah / Batas) ── */}
      {panelOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop click outside to close */}
          <div 
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity" 
          />

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-surface-900 border-l border-surface-700/60 shadow-2xl flex flex-col">
              
              {/* Header Panel */}
              <div className="p-5 border-b border-surface-700/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kelola Persediaan</p>
                  <h3 className="text-lg font-bold text-slate-100 truncate mt-1">
                    {selectedIngredient.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector Inside Panel */}
              <div className="flex border-b border-surface-700/60 bg-surface-950/30">
                <button
                  onClick={() => { setPanelTab("stock-in"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold cursor-pointer transition-all border-b-2 ${
                    panelTab === "stock-in"
                      ? "border-brand-500 text-brand-400 bg-brand-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  Tambah Stok
                </button>
                <button
                  onClick={() => { setPanelTab("reorder"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold cursor-pointer transition-all border-b-2 ${
                    panelTab === "reorder"
                      ? "border-brand-500 text-brand-400 bg-brand-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Batas Minimum
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* Stock Context Info */}
                <div className="rounded-xl border border-surface-700/60 bg-surface-950/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stok Saat Ini</span>
                    <span className="font-bold font-mono text-slate-200">
                      {Number(selectedIngredient.currentStock).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {selectedIngredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batas Pengingat Saat Ini</span>
                    <span className="font-bold font-mono text-slate-400">
                      {selectedIngredient.reorderPoint > 0
                        ? `${selectedIngredient.reorderPoint} ${selectedIngredient.unit}`
                        : "Belum diatur"}
                    </span>
                  </div>
                </div>

                {/* Form: Tambah Stok */}
                {panelTab === "stock-in" && (
                  <form onSubmit={handleStockIn} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Jumlah Masuk ({selectedIngredient.unit})
                      </label>
                      <input
                        className="input"
                        type="number"
                        min="0.0001"
                        step="any"
                        required
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder={`Contoh: 1000`}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Catatan <span className="normal-case font-normal text-slate-500">(opsional)</span>
                      </label>
                      <input
                        className="input"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Contoh: Belanja pasar pagi / Kulakan agen"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><ArrowDownToLine className="w-4 h-4" /> Simpan Penerimaan</>
                      )}
                    </button>
                  </form>
                )}

                {/* Form: Batas Minimum */}
                {panelTab === "reorder" && (
                  <form onSubmit={handleSaveReorder} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Batas Minimum Baru ({selectedIngredient.unit})
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
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        Jika stok turun menyentuh atau berada di bawah nilai ini, sistem akan memicu alarm berwarna kuning di dasbor utama.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingReorder}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingReorder ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Settings2 className="w-4 h-4" /> Simpan Batas Minimum</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
