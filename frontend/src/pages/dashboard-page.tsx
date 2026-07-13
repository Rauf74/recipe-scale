import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Recipe, Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  ShoppingBag,
  ChefHat,
  Scale,
  ArrowUpRight,
  Flame,
  TrendingUp,
  Loader2,
  FileText,
  Layers,
} from "lucide-react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [recRes, ingRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
        apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
      ]);
      if (recRes.data.success) setRecipes(recRes.data.data.recipes);
      if (ingRes.data.success) setIngredients(ingRes.data.data.ingredients);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const baseRecipesCount = recipes.filter((r) => r.isBaseRecipe).length;
  const menuRecipesCount = recipes.filter((r) => !r.isBaseRecipe).length;

  // Most expensive ingredients -> proxy for price-fluctuation risk (honest signal, no fake margin)
  const topIngredients = [...ingredients]
    .sort((a, b) => b.pricePerUnit - a.pricePerUnit)
    .slice(0, 5);
  const maxPrice = topIngredients[0]?.pricePerUnit ?? 1;

  // Recipes by component count (proxy: complexity / cost-leverage)
  const heaviestRecipes = [...recipes]
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <span className="text-sm">Memuat ringkasan bisnis Anda...</span>
        </div>
      ) : (
        <>
          {/* ── Bento grid ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero greeting panel (2 cols) */}
            <div className="lg:col-span-2 relative overflow-hidden p-7 rounded-2xl bg-gradient-to-br from-brand-600/20 via-surface-900 to-surface-900 border border-surface-700/60">
              <div className="absolute -top-16 -right-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
                  Ringkasan Bisnis
                </p>
                <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {greeting()},{" "}
                  <span className="text-brand-400">pantau HPP Anda</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
                  Total {recipes.length} resep terkalulasi dan {ingredients.length} bahan baku aktif.
                  Pantau bahan termahal dan resep paling kompleks untuk menjaga margin tetap sehat.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => navigate("/recipes")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all hover:shadow-brand active:scale-[0.98] cursor-pointer text-sm"
                  >
                    <ChefHat className="w-4 h-4" />
                    Kelola Resep
                  </button>
                  <button
                    onClick={() => navigate("/ingredients")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold rounded-xl border border-surface-700 transition-all active:scale-[0.98] cursor-pointer text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Atur Bahan
                  </button>
                </div>
              </div>
            </div>

            {/* Stat stack (1 col) */}
            <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard icon={ShoppingBag} label="Bahan Baku" value={ingredients.length} tone="brand" />
              <StatCard icon={Layers} label="Bumbu Dasar" value={baseRecipesCount} tone="brand" />
              <StatCard icon={Scale} label="Menu Akhir" value={menuRecipesCount} tone="brand" />
            </div>
          </div>

          {/* ── Lower grid: composition + watchlist ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost composition (replaces random-color bar chart) */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-surface-700/60 bg-surface-900/50 space-y-5">
              <div>
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-brand-400" />
                  Bahan Termahal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lima bahan dengan harga per unit tertinggi, berisiko fluktuasi HPP terbesar.
                </p>
              </div>

              {topIngredients.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Tambahkan bahan baku di menu Bahan Baku untuk melihat komposisi biaya.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topIngredients.map((ing) => {
                    const pct = Math.round((ing.pricePerUnit / maxPrice) * 100);
                    return (
                      <div key={ing.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300 truncate">{ing.name}</span>
                          <span className="nums text-slate-400 shrink-0 ml-3">
                            {formatRupiah(ing.pricePerUnit)}
                            <span className="text-slate-600">/{ing.unit}</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Watchlist: heaviest recipes (proxy for margin attention) */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-surface-700/60 bg-surface-900/50 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  Resep Paling Kompleks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Banyak komponen artinya leverage biaya tinggi, pantau saat harga bahan naik.
                </p>
                {heaviestRecipes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Belum ada resep.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {heaviestRecipes.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-950/40 border border-surface-700/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-500">{r.items.length} komponen</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={() => navigate("/recipes")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold border border-surface-700 transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Buka Kalkulator HPP
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

type Tone = "brand" | "amber" | "blue" | "rose";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: Tone;
}) {
  const toneMap: Record<Tone, string> = {
    brand: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <div className="p-5 rounded-2xl bg-surface-900/50 border border-surface-700/60 flex items-center gap-4">
      <div className={`p-3 rounded-xl border ${toneMap[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="nums text-xl font-black text-slate-200 mt-1">{value}</p>
      </div>
    </div>
  );
}
