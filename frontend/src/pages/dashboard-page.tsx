import React, { useEffect, useState } from "react";
import type { Recipe, Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  ShoppingBag,
  ChefHat,
  Scale,
  TrendingUp,
  Loader2,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export const DashboardPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<{ ingredientId: string; name: string; currentPrice: number; previousPrice: number; changePercent: number; updatedAt: string }[]>([]);
  const [marginAlerts, setMarginAlerts] = useState<{ recipeId: string; name: string; unitCost: number; sellingPrice: number; currentFoodCostPercent: number; targetFoodCostPercent: number; status: "danger" | "warning" }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [recRes, ingRes, alertRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
        apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
        apiClient.get<{ success: boolean; data: { priceAlerts: any[]; marginAlerts: any[] } }>("/api/dashboard/alerts")
      ]);
      if (recRes.data.success) setRecipes(recRes.data.data.recipes);
      if (ingRes.data.success) setIngredients(ingRes.data.data.ingredients);
      if (alertRes.data.success) {
        setPriceAlerts(alertRes.data.data.priceAlerts);
        setMarginAlerts(alertRes.data.data.marginAlerts);
      }
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const baseRecipesCount = recipes.filter(r => r.isBaseRecipe).length;
  const menuRecipesCount = recipes.filter(r => !r.isBaseRecipe).length;

  // Prepare chart data (ingredients by price)
  const chartData = ingredients
    .slice(0, 5) // Show top 5 ingredients
    .map(ing => ({
      name: ing.name,
      price: ing.pricePerUnit
    }));

  const COLORS = ["#10b981", "#6366f1", "#a855f7", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-sm">Memuat ringkasan bisnis Anda...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Bahan Baku</p>
                <p className="text-xl font-black text-slate-200 mt-1">{ingredients.length}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bumbu Dasar</p>
                <p className="text-xl font-black text-slate-200 mt-1">{baseRecipesCount}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
                <Scale className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Menu Akhir</p>
                <p className="text-xl font-black text-slate-200 mt-1">{menuRecipesCount}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status HPP</p>
                <p className="text-sm font-bold text-slate-200 mt-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Semua Terkalkulasi
                </p>
              </div>
            </div>
          </div>

          {/* Alerts and Warnings Row */}
          {(priceAlerts.length > 0 || marginAlerts.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Alerts Card */}
              {priceAlerts.length > 0 && (
                <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Kenaikan Harga Bahan Baku
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {priceAlerts.map((alert) => (
                      <div key={alert.ingredientId} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                        <span className="font-semibold text-slate-300">{alert.name}</span>
                        <div className="text-right">
                          <span className="text-red-400 font-bold block">+{alert.changePercent}%</span>
                          <span className="text-[10px] text-slate-500">
                            {formatRupiah(alert.previousPrice)} → {formatRupiah(alert.currentPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Margin Alerts Card */}
              {marginAlerts.length > 0 && (
                <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
                  <h3 className="font-bold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    🚨 Margin Menu Utama Terancam
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {marginAlerts.map((alert) => (
                      <div key={alert.recipeId} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                        <span className="font-semibold text-slate-300">{alert.name}</span>
                        <div className="text-right">
                          <span className="text-red-400 font-black block">FC: {alert.currentFoodCostPercent.toFixed(0)}%</span>
                          <span className="text-[9px] text-slate-500">
                            Target FC: {alert.targetFoodCostPercent}% (Harga Jual: {alert.sellingPrice > 0 ? formatRupiah(alert.sellingPrice) : "Belum Set"})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Double Column Section (Chart + Quick Tutorial) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
              <div>
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">5 Bahan Baku Termahal</h3>
                <p className="text-xs text-slate-500 mt-0.5">Membandingkan harga bahan per unit dasar</p>
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                  Tambahkan beberapa bahan baku di tab Bahan Baku untuk melihat visualisasi.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                        labelStyle={{ fontWeight: "bold", color: "#f1f5f9" }}
                        formatter={(value: any) => [formatRupiah(value), "Harga per Unit"]}
                      />
                      <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Quick Walkthrough Widget */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Alur Penggunaan Portofolio
                </h3>
                <ol className="space-y-3 text-xs text-slate-400 list-decimal pl-4 leading-relaxed">
                  <li>
                    Masuk ke menu <strong className="text-slate-300">Bahan Baku</strong> untuk memasukkan bahan baku dasar Anda beserta harga pasar terkininya.
                  </li>
                  <li>
                    Buat <strong className="text-slate-300">Bumbu Dasar</strong> (Base Recipe) terlebih dahulu jika menu masakan Anda menggunakan racikan pasta/bumbu bersama.
                  </li>
                  <li>
                    Racik <strong className="text-slate-300">Resep Menu Utama</strong>, lalu masukkan bumbu dasar dan bahan mentah lainnya ke dalam list komponen resep.
                  </li>
                  <li>
                    Gunakan penggeser <strong className="text-slate-300">Skala Porsi</strong> di sebelah kanan detail resep untuk mensimulasikan takaran saji dan memantau fluktuasi modal HPP secara instan.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
                🚀 Proyek portofolio ini dibangun menggunakan stack modern: **Golang (Fiber + GORM MySQL)** di backend dan **React + TypeScript (Vite 8 + Tailwind CSS v4)** di frontend.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
