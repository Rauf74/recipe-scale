import React, { useEffect, useState } from "react";
import type { Recipe, Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  ChefHat,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  Scale,
  PlusCircle,
  Eye,
  Layers,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface RecipeCostData {
  totalCost: number;
  unitCost: number;
  itemCosts: Record<string, number>;
}

export const RecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail / Cost state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCost, setSelectedCost] = useState<RecipeCostData | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [scaleInput, setScaleInput] = useState<number>(0);

  // Simulator state
  const [targetFoodCost, setTargetFoodCost] = useState<number>(30);
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [servicePercent, setServicePercent] = useState<number>(5);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("1");
  const [yieldUnit, setYieldUnit] = useState<"portions" | "kg" | "grams">("portions");
  const [isBaseRecipe, setIsBaseRecipe] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("0");
  const [items, setItems] = useState<{
    type: "ingredient" | "sub-recipe";
    id: string;
    quantity: number;
    unit: string;
  }[]>([]);

  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Delete confirmation modal state (replaces window.confirm / alert)
  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);

  // Deterministic per-recipe accent (on-brand palette, no random color drift)
  const ACCENTS = ["brand", "sky", "violet", "amber", "rose", "teal"] as const;
  const accentFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return ACCENTS[h % ACCENTS.length];
  };
  const accentBar: Record<string, string> = {
    brand: "bg-brand-500", sky: "bg-sky-500", violet: "bg-violet-500",
    amber: "bg-amber-500", rose: "bg-rose-500", teal: "bg-teal-500",
  };
  const accentAvatar: Record<string, string> = {
    brand: "bg-brand-500/15 text-brand-400", sky: "bg-sky-500/15 text-sky-400",
    violet: "bg-violet-500/15 text-violet-400", amber: "bg-amber-500/15 text-amber-400",
    rose: "bg-rose-500/15 text-rose-400", teal: "bg-teal-500/15 text-teal-400",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ingRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
        apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients")
      ]);
      if (recRes.data.success) setRecipes(recRes.data.data.recipes);
      if (ingRes.data.success) setIngredients(ingRes.data.data.ingredients);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeCost = async (recipe: Recipe) => {
    setCostLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: { totalCost: number; unitCost: number; itemCosts: Record<string, number> } }>(`/api/recipes/${recipe.id}/cost`);
      if (res.data.success) {
        setSelectedCost({
          totalCost: res.data.data.totalCost,
          unitCost: res.data.data.unitCost,
          itemCosts: res.data.data.itemCosts
        });
        setScaleInput(recipe.yieldQuantity);
      }
    } catch (err) {
      console.error("Gagal memuat biaya resep:", err);
    } finally {
      setCostLoading(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    loadRecipeCost(recipe);
    setTargetFoodCost(recipe.targetFoodCost || 30);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName("");
    setYieldQuantity("1");
    setYieldUnit("portions");
    setIsBaseRecipe(false);
    setSellingPrice("0");
    setTargetFoodCost(30);
    setItems([{ type: "ingredient", id: "", quantity: 1, unit: "g" }]);
    setError("");
    setFormOpen(true);
  };

  const handleEditClick = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(recipe.id);
    setName(recipe.name);
    setYieldQuantity(recipe.yieldQuantity.toString());
    setYieldUnit(recipe.yieldUnit);
    setIsBaseRecipe(recipe.isBaseRecipe);
    setSellingPrice(recipe.sellingPrice.toString());
    setTargetFoodCost(recipe.targetFoodCost || 30);
    setItems(recipe.items.map(item => ({
      type: item.ingredientId ? "ingredient" : "sub-recipe",
      id: (item.ingredientId || item.subRecipeId) || "",
      quantity: item.quantity,
      unit: item.unit
    })));
    setError("");
    setFormOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { type: "ingredient", id: "", quantity: 1, unit: "g" }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, key: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    // Auto-select unit matching the selection for user convenience
    if (key === "id") {
      if (updated[index].type === "ingredient") {
        const ing = ingredients.find(i => i.id === value);
        if (ing) updated[index].unit = ing.unit;
      } else {
        const sub = recipes.find(r => r.id === value);
        if (sub) updated[index].unit = sub.yieldUnit;
      }
    }
    setItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    const yieldQty = parseFloat(yieldQuantity);
    if (isNaN(yieldQty) || yieldQty <= 0) {
      setError("Jumlah porsi tidak valid");
      setActionLoading(false);
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.id) {
        setError("Semua baris bahan baku/resep harus dipilih");
        setActionLoading(false);
        return;
      }
    }

    const payloadItems = items.map(item => ({
      ingredientId: item.type === "ingredient" ? item.id : null,
      subRecipeId: item.type === "sub-recipe" ? item.id : null,
      quantity: item.quantity,
      unit: item.unit
    }));

    try {
      if (editingId) {
        const res = await apiClient.put<{ success: boolean; data: { recipe: Recipe } }>(`/api/recipes/${editingId}`, {
          name,
          yieldQuantity: yieldQty,
          yieldUnit,
          isBaseRecipe,
          sellingPrice: parseFloat(sellingPrice) || 0,
          targetFoodCost: parseFloat(targetFoodCost.toString()) || 30,
          items: payloadItems
        });
        if (res.data.success) {
          setRecipes(recipes.map(r => r.id === editingId ? res.data.data.recipe : r));
          if (selectedRecipe?.id === editingId) {
            setSelectedRecipe(res.data.data.recipe);
            loadRecipeCost(res.data.data.recipe);
          }
          setFormOpen(false);
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: { recipe: Recipe } }>("/api/recipes", {
          name,
          yieldQuantity: yieldQty,
          yieldUnit,
          isBaseRecipe,
          sellingPrice: parseFloat(sellingPrice) || 0,
          targetFoodCost: parseFloat(targetFoodCost.toString()) || 30,
          items: payloadItems
        });
        if (res.data.success) {
          setRecipes([res.data.data.recipe, ...recipes]);
          setFormOpen(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menyimpan resep");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDelete(recipe);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    try {
      await apiClient.delete(`/api/recipes/${id}`);
      setRecipes(recipes.filter((r) => r.id !== id));
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
        setSelectedCost(null);
      }
    } catch (err) {
      console.error("Gagal menghapus resep:", err);
      setError("Gagal menghapus resep. Pastikan resep ini tidak sedang digunakan sebagai bumbu dasar di resep lain.");
    } finally {
      setPendingDelete(null);
    }
  };

  // Base Recipes that can be used as sub-recipes (exclude current editing recipe to prevent circular reference!)
  const availableBaseRecipes = recipes.filter(r => r.isBaseRecipe && r.id !== editingId);

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={handleAddNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Racik Resep Baru
        </button>
      </div>

      {/* Main Double Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Recipe Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 bg-slate-900/10 border border-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-sm">Memuat daftar resep...</span>
            </div>
          ) : recipes.length === 0 ? (
            <div className="py-20 bg-slate-900/10 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-center px-4">
              <ChefHat className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="text-lg font-bold text-slate-300">Belum ada resep</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Mulailah meracik formula bumbu dasar atau menu akhir dengan menekan tombol &quot;Racik Resep Baru&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map(recipe => {
                const isSelected = selectedRecipe?.id === recipe.id;
                return (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    className={`relative overflow-hidden group p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-surface-900/70 border-brand-500/60 shadow-lg shadow-brand-500/5"
                        : "bg-surface-900/40 border-surface-700/60 hover:border-surface-600 hover:bg-surface-900/60"
                    }`}
                  >
                    {/* Identity accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${accentBar[accentFor(recipe.id)]}`} />

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${accentAvatar[accentFor(recipe.id)]}`}>
                          {recipe.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-slate-200 group-hover:text-brand-400 transition-colors text-base truncate pr-2">
                          {recipe.name}
                        </h3>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wide uppercase shrink-0 ${
                          recipe.isBaseRecipe
                            ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                            : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        }`}
                      >
                        {recipe.isBaseRecipe ? "Bumbu Dasar" : "Menu Utama"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Yield: <span className="text-slate-300 font-semibold">{recipe.yieldQuantity} {recipe.yieldUnit}</span>
                    </p>

                    <div className="flex items-center justify-between border-t border-surface-700/50 pt-3 text-[10px] text-slate-500">
                      <span>{recipe.items.length} Komponen</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditClick(recipe, e)}
                          className="p-1.5 hover:bg-surface-800 hover:text-brand-400 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(recipe, e)}
                          className="p-1.5 hover:bg-surface-800 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Cost Calc & Scaling Simulator Panel */}
        <div className="lg:col-span-1 space-y-4">
          {!selectedRecipe ? (
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/10 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
              <Eye className="w-8 h-8 text-slate-700 mb-2" />
              <h4 className="text-sm font-bold text-slate-400">Pilih Resep</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                Pilih salah satu resep di samping untuk melihat rincian kalkulasi modal HPP dan mensimulasikan skala porsi.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-6 shadow-xl">
              {/* Panel Header */}
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg tracking-tight">Kalkulator HPP & Skala</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRecipe.name}</p>
              </div>

              {costLoading || !selectedCost ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="text-xs">Menghitung biaya resep...</span>
                </div>
              ) : (
                <>
                  {/* Cost Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Total Modal (HPP)</p>
                      <p className="text-base font-black text-brand-400 mt-1 leading-none">
                        {formatRupiah(selectedCost.totalCost)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 leading-none">porsi asal ({selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit})</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Modal / Unit</p>
                      <p className="text-base font-black text-brand-400 mt-1 leading-none">
                        {formatRupiah(selectedCost.unitCost)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 leading-none">per {selectedRecipe.yieldUnit.slice(0, -1) || "unit"}</p>
                    </div>
                  </div>

                  {/* Cost composition — compact horizontal bars (no random-color pie) */}
                  {(() => {
                    const pieData = selectedRecipe.items
                      .map((item) => ({
                        name: item.ingredient
                          ? item.ingredient.name
                          : (item.subRecipe ? item.subRecipe.name : "Komponen"),
                        value: selectedCost.itemCosts[item.id] || 0,
                      }))
                      .filter((d) => d.value > 0)
                      .sort((a, b) => b.value - a.value);

                    const maxVal = pieData[0]?.value ?? 1;
                    if (pieData.length === 0) return null;

                    return (
                      <div className="p-4 bg-surface-950/20 border border-surface-700 rounded-xl space-y-3">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Komposisi Beban Biaya
                        </p>
                        <div className="space-y-2.5">
                          {pieData.slice(0, 6).map((entry) => {
                            const pct = Math.round((entry.value / maxVal) * 100);
                            const share = Math.round((entry.value / selectedCost.totalCost) * 100);
                            return (
                              <div key={entry.name} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-300 truncate pr-2">{entry.name}</span>
                                  <span className="nums text-slate-500 shrink-0">
                                    {formatRupiah(entry.value)} · {share}%
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {pieData.length > 6 && (
                          <p className="text-[9px] text-slate-500 font-semibold">
                            +{pieData.length - 6} komponen lainnya
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Scaling Simulator Slider/Input */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-brand-400" />
                        Simulasi Skala Porsi
                      </label>
                      <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                        Aktif
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={scaleInput || ""}
                        onChange={(e) => setScaleInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-500/50 text-center font-bold"
                      />
                      <span className="text-slate-400 text-xs truncate uppercase font-semibold">
                        {selectedRecipe.yieldUnit}
                      </span>
                    </div>

                    {/* Scale calculation preview */}
                    {scaleInput !== selectedRecipe.yieldQuantity && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Modal Skala Baru:</span>
                        <strong className="text-slate-300 font-bold text-xs">
                          {formatRupiah(selectedCost.unitCost * scaleInput)}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Markup & Food Cost Simulator */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 space-y-3 text-left">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                      Simulasi Harga & Margin
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Food Cost %</label>
                        <input
                          type="number"
                          min="5"
                          max="95"
                          value={targetFoodCost}
                          onChange={(e) => setTargetFoodCost(Math.max(5, Math.min(95, parseInt(e.target.value) || 30)))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-brand-500/50 text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pajak %</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-brand-500/50 text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Service %</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={servicePercent}
                          onChange={(e) => setServicePercent(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-brand-500/50 text-center"
                        />
                      </div>
                    </div>

                    {/* Calculations output */}
                    {(() => {
                      const recommendedPrice = selectedCost.unitCost / (targetFoodCost / 100);
                      const taxAndServiceMultiplier = 1 + (taxPercent / 100) + (servicePercent / 100);
                      const finalPrice = recommendedPrice * taxAndServiceMultiplier;
                      const estProfit = recommendedPrice - selectedCost.unitCost;
                      const grossMargin = (estProfit / recommendedPrice) * 100;

                      const activeSellingPrice = selectedRecipe.sellingPrice || 0;
                      const actualFoodCostPercent = activeSellingPrice > 0 ? (selectedCost.unitCost / activeSellingPrice) * 100 : 0;
                      const isDanger = activeSellingPrice > 0 && actualFoodCostPercent > targetFoodCost;

                      return (
                        <div className="pt-2 border-t border-slate-800/60 space-y-2 text-xs">
                          {activeSellingPrice > 0 && (
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-[10px] mb-1">
                              <span className="text-slate-400">Harga Jual Aktif:</span>
                              <div className="text-right">
                                <strong className="text-slate-200 block font-extrabold">{formatRupiah(activeSellingPrice)}</strong>
                                <span className={`text-[9px] font-bold ${isDanger ? "text-red-400" : "text-brand-400"}`}>
                                  FC Aktual: {actualFoodCostPercent.toFixed(0)}% {isDanger && "⚠️"}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Harga Jual Rekomendasi:</span>
                            <strong className="text-brand-400 font-bold">{formatRupiah(recommendedPrice)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Nett Jual (+Tax & Service):</span>
                            <strong className="text-slate-200 font-bold">{formatRupiah(finalPrice)}</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/40 pt-1.5 text-[10px]">
                            <span className="text-slate-500">Profit / Porsi:</span>
                            <span className="text-brand-400 font-bold">{formatRupiah(estProfit)} ({grossMargin.toFixed(0)}% Margin)</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Scaled Ingredients List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timbangan Bahan Dapur</h4>
                    <div className="divide-y divide-slate-800/40 border border-slate-800 rounded-xl bg-slate-950/20 overflow-hidden">
                      {selectedRecipe.items.map(item => {
                        const scaleFactor = scaleInput / selectedRecipe.yieldQuantity;
                        const scaledQty = item.quantity * scaleFactor;
                        const name = item.ingredient ? item.ingredient.name : (item.subRecipe ? item.subRecipe.name : "Komponen");
                        const isSub = !!item.subRecipeId;

                        return (
                          <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-300 truncate block">{name}</span>
                              <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                                {isSub ? (
                                  <>
                                    <Layers className="w-3 h-3 text-violet-400 shrink-0" />
                                    <span>Bumbu Dasar</span>
                                  </>
                                ) : (
                                  <span>Bahan Baku</span>
                                )}
                              </span>
                            </div>
                            <span className="font-bold text-slate-200 shrink-0 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                              {scaledQty.toFixed(1)} {item.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Overlay Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-slate-200 text-lg tracking-tight flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-brand-400" />
                {editingId ? "Ubah Formula Resep" : "Racik Formula Resep Baru"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {/* Recipe Meta Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Nama Resep / Menu
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rendang Daging, Bumbu Dasar Merah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Tipe Resep
                  </label>
                  <select
                    value={isBaseRecipe ? "true" : "false"}
                    onChange={(e) => setIsBaseRecipe(e.target.value === "true")}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500/50 text-sm transition-all cursor-pointer"
                  >
                    <option value="false" className="bg-slate-950">Menu Utama (Akhir)</option>
                    <option value="true" className="bg-slate-950">Bumbu Dasar (Sub-Resep)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Yield / Jumlah Porsi Asal
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="Contoh: 10"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Satuan Yield
                  </label>
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500/50 text-sm transition-all cursor-pointer"
                  >
                    <option value="portions" className="bg-slate-950">portions (Porsi)</option>
                    <option value="kg" className="bg-slate-950">kg (Kilogram)</option>
                    <option value="grams" className="bg-slate-950">grams (Gram)</option>
                  </select>
                </div>
              </div>

              {!isBaseRecipe && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Harga Jual Menu (Rp)
                    </label>
                    <input
                      type="number"
                      required={!isBaseRecipe}
                      min="0"
                      placeholder="Contoh: 45000"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Target Food Cost (%)
                    </label>
                    <input
                      type="number"
                      required={!isBaseRecipe}
                      min="5"
                      max="90"
                      placeholder="Contoh: 30"
                      value={targetFoodCost}
                      onChange={(e) => setTargetFoodCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 text-sm transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Items Builder Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    Komposisi Bahan & Bumbu
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-brand-400 hover:text-emerald-300 font-semibold cursor-pointer text-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Baris Baru
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-slate-950/20 border border-slate-800/60 relative group">
                      {/* Component Type select */}
                      <div className="w-full sm:w-28">
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(index, "type", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500/50 cursor-pointer"
                        >
                          <option value="ingredient">Bahan Baku</option>
                          <option value="sub-recipe">Bumbu Dasar</option>
                        </select>
                      </div>

                      {/* Dropdown selects matching the type chosen */}
                      <div className="flex-1 w-full">
                        {item.type === "ingredient" ? (
                          <select
                            value={item.id}
                            required
                            onChange={(e) => handleItemChange(index, "id", e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500/50 cursor-pointer"
                          >
                            <option value="">-- Pilih Bahan Baku --</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={item.id}
                            required
                            onChange={(e) => handleItemChange(index, "id", e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500/50 cursor-pointer"
                          >
                            <option value="">-- Pilih Bumbu Dasar --</option>
                            {availableBaseRecipes.map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.yieldQuantity} {r.yieldUnit})</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Quantity input */}
                      <div className="w-full sm:w-20">
                        <input
                          type="number"
                          required
                          min="0.001"
                          step="any"
                          placeholder="Jumlah"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500/50 text-center font-bold"
                        />
                      </div>

                      {/* Unit label or text input */}
                      <div className="w-full sm:w-16">
                        <input
                          type="text"
                          required
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs focus:outline-none text-center font-semibold"
                        />
                      </div>

                      {/* Remove item row button */}
                      <button
                        type="button"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 hover:text-slate-200 text-slate-400 font-bold transition-all cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-xs disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Resep"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-100 text-base">Hapus Resep</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Yakin hapus <span className="text-slate-200 font-semibold">{pendingDelete.name}</span>?
              Resep lain yang memakai ini sebagai bumbu dasar mungkin terpengaruh.
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
