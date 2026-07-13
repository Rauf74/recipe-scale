import React, { useEffect, useState } from "react";
import type { Recipe, Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus resep ini? Semua resep lain yang menggunakan sub-resep ini mungkin akan terpengaruh.")) {
      return;
    }

    try {
      await apiClient.delete(`/api/recipes/${id}`);
      setRecipes(recipes.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
        setSelectedCost(null);
      }
    } catch (err) {
      console.error("Gagal menghapus resep:", err);
      alert("Gagal menghapus resep. Pastikan resep ini tidak sedang digunakan sebagai bumbu dasar di resep lain.");
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
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-98 cursor-pointer text-sm shrink-0"
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
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-900/20 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors text-base truncate pr-16">
                        {recipe.name}
                      </h3>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wide uppercase shrink-0 ${
                          recipe.isBaseRecipe
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {recipe.isBaseRecipe ? "Bumbu Dasar" : "Menu Utama"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Yield: <span className="text-slate-300 font-semibold">{recipe.yieldQuantity} {recipe.yieldUnit}</span>
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                      <span>{recipe.items.length} Komponen</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditClick(recipe, e)}
                          className="p-1.5 hover:bg-slate-800 hover:text-emerald-400 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(recipe.id, e)}
                          className="p-1.5 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-all cursor-pointer"
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
                      <p className="text-base font-black text-emerald-400 mt-1 leading-none">
                        {formatRupiah(selectedCost.totalCost)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 leading-none">porsi asal ({selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit})</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Modal / Unit</p>
                      <p className="text-base font-black text-emerald-400 mt-1 leading-none">
                        {formatRupiah(selectedCost.unitCost)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 leading-none">per {selectedRecipe.yieldUnit.slice(0, -1) || "unit"}</p>
                    </div>
                  </div>

                  {/* Donut Chart visual cost composition */}
                  {(() => {
                    const pieData = selectedRecipe.items.map(item => ({
                      name: item.ingredient ? item.ingredient.name : (item.subRecipe ? item.subRecipe.name : "Komponen"),
                      value: selectedCost.itemCosts[item.id] || 0
                    })).filter(d => d.value > 0);

                    const CHART_COLORS = ["#10b981", "#6366f1", "#a855f7", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

                    if (pieData.length === 0) return null;

                    return (
                      <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-xl space-y-2">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center">Komposisi Beban Biaya</p>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={45}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {pieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", fontSize: "10px" }}
                                itemStyle={{ color: "#cbd5e1" }}
                                formatter={(value: any) => [formatRupiah(value), ""]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center mt-1">
                          {pieData.slice(0, 4).map((entry, index) => (
                            <span key={entry.name} className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                              <span className="truncate max-w-[70px]">{entry.name}</span>
                            </span>
                          ))}
                          {pieData.length > 4 && (
                            <span className="text-[9px] text-slate-500 font-semibold">+{pieData.length - 4} lainnya</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Scaling Simulator Slider/Input */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        Simulasi Skala Porsi
                      </label>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                        Aktif
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={scaleInput || ""}
                        onChange={(e) => setScaleInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 text-center font-bold"
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
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
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
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500/50 text-center"
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
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500/50 text-center"
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
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500/50 text-center"
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
                                <span className={`text-[9px] font-bold ${isDanger ? "text-red-400" : "text-emerald-400"}`}>
                                  FC Aktual: {actualFoodCostPercent.toFixed(0)}% {isDanger && "⚠️"}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Harga Jual Rekomendasi:</span>
                            <strong className="text-emerald-400 font-bold">{formatRupiah(recommendedPrice)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Nett Jual (+Tax & Service):</span>
                            <strong className="text-slate-200 font-bold">{formatRupiah(finalPrice)}</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/40 pt-1.5 text-[10px]">
                            <span className="text-slate-500">Profit / Porsi:</span>
                            <span className="text-emerald-400 font-bold">{formatRupiah(estProfit)} ({grossMargin.toFixed(0)}% Margin)</span>
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
                                    <Layers className="w-3 h-3 text-purple-400 shrink-0" />
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
                <ChefHat className="w-5 h-5 text-emerald-400" />
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
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Tipe Resep
                  </label>
                  <select
                    value={isBaseRecipe ? "true" : "false"}
                    onChange={(e) => setIsBaseRecipe(e.target.value === "true")}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 text-sm transition-all cursor-pointer"
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
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Satuan Yield
                  </label>
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 text-sm transition-all cursor-pointer"
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
                      className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm transition-all"
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
                      className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Items Builder Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Komposisi Bahan & Bumbu
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer text-xs"
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
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 text-center font-bold"
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-98 cursor-pointer text-xs disabled:opacity-50"
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
    </div>
  );
};
