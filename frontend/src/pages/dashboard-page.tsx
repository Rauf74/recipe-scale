import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Recipe, Ingredient } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  ChefHat,
  Package,
  Warehouse,
  Layers,
  Scale,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

function getGreeting(): string {
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
  const [costs, setCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
      apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
    ])
      .then(async ([r, i]) => {
        if (r.data.success) setRecipes(r.data.data.recipes);
        if (i.data.success) setIngredients(i.data.data.ingredients);
        // fetch per-recipe HPP (backend /cost)
        if (r.data.success) {
          const list = r.data.data.recipes;
          const entries = await Promise.all(
            list.map(async (rc) => {
              try {
                const c = await apiClient.get<{ success: boolean; data: { totalCost: number } }>(
                  `/api/recipes/${rc.id}/cost`
                );
                return [rc.id, c.data.success ? c.data.data.totalCost : 0] as const;
              } catch {
                return [rc.id, 0] as const;
              }
            })
          );
          setCosts(Object.fromEntries(entries));
        }
      })
      .catch((err) => console.error("Gagal memuat data dasbor:", err))
      .finally(() => setLoading(false));
  }, []);

  // ---- Signals (no fabricated margin — derived from available data) ----
  const baseRecipes = recipes.filter((r) => r.isBaseRecipe);
  const menuRecipes = recipes.filter((r) => !r.isBaseRecipe);

  // Ingredient with highest purchase price (proxy cost-risk)
  const topIngredient = [...ingredients].sort(
    (a, b) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0)
  )[0];

  // Recipe with most components = most complex to manage
  const complexRecipes = [...menuRecipes]
    .sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))
    .slice(0, 4);

  // Average component count per recipe
  const avgComponents =
    recipes.length > 0
      ? recipes.reduce((s, r) => s + (r.items?.length || 0), 0) / recipes.length
      : 0;

  if (loading) {
    return (
      <div className="py-24 grid place-items-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm">Menyusun dasbor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Cost Flow hero ===== */}
      <section className="rounded-2xl border border-surface-700/60 bg-surface-900/40 p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">
              Alur Biaya HPP
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
              {getGreeting()}, pantau dapur Anda
            </h1>
          </div>
          <button
            onClick={() => navigate(ingredients.length === 0 ? "/ingredients" : "/recipes")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-full transition-all hover:shadow-brand active:scale-[0.98] cursor-pointer text-sm"
          >
            <ChefHat className="w-4 h-4" />
            Racik Resep
          </button>
        </div>

        {/* Flow nodes */}
        <div className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-2">
          <FlowNode
            icon={<Package className="w-5 h-5" />}
            label="Bahan"
            value={String(ingredients.length)}
            tone="brand"
            onClick={() => navigate("/ingredients")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Warehouse className="w-5 h-5" />}
            label="Stok"
            value={`${ingredients.reduce((total, ingredient) => total + ingredient.currentStock, 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}`}
            tone="brand"
            onClick={() => navigate("/stock")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Layers className="w-5 h-5" />}
            label="Bumbu Dasar"
            value={String(baseRecipes.length)}
            tone="violet"
            onClick={() => navigate("/preps")}
          />
          <FlowArrow />
          <FlowNode
            icon={<ChefHat className="w-5 h-5" />}
            label="Resep Jadi"
            value={String(menuRecipes.length)}
            tone="warm"
            onClick={() => navigate("/recipes")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Scale className="w-5 h-5" />}
            label="Analisis HPP"
            value={formatRupiah(
              menuRecipes.reduce((s, r) => s + (costs[r.id] || 0), 0) /
                (menuRecipes.length || 1)
            )}
            tone="brand"
            big
            onClick={() => navigate("/analysis")}
          />
        </div>
      </section>

      {/* ===== Kitchen KPIs ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Kerumitan Rata-rata"
          sub="komponen per resep"
          value={avgComponents.toFixed(1)}
          icon={<Layers className="w-5 h-5" />}
          tone="brand"
          status={recipes.length > 0 ? `${recipes.length} resep dianalisis` : "Belum ada data resep"}
        />
        <MetricCard
          label="Bahan Terdaftar"
          sub={`${ingredients.length} item terdaftar`}
          value={String(ingredients.length)}
          icon={<Package className="w-5 h-5" />}
          tone="warm"
          status={ingredients.length > 0 ? "Siap dipakai di resep" : "Tambahkan bahan pertama"}
        />
        <MetricCard
          label="Resep Menu"
          sub={`${menuRecipes.length} menu siap dihitung`}
          value={String(menuRecipes.length)}
          icon={<ChefHat className="w-5 h-5" />}
          tone="violet"
          status={menuRecipes.length > 0 ? "Formula menu tersimpan" : "Mulai dari bahan atau prep"}
        />
      </section>

      {/* ===== Watchlist: resep butuh perhatian ===== */}
      <section className="rounded-2xl border border-surface-700/60 bg-surface-900/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warm-500" />
            Resep butuh perhatian
          </h2>
          <span className="text-[10px] text-slate-500">
            paling banyak komponen
          </span>
        </div>

        {complexRecipes.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500 text-sm">
            Belum ada resep. Racik pertama Anda untuk mulai memantau HPP.
          </div>
        ) : (
          <div>
            {complexRecipes.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate("/recipes")}
                className="ledger-row grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 grid place-items-center rounded-lg bg-brand-500/10 text-brand-400 font-extrabold text-sm shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="ledger-name font-semibold text-slate-200 truncate">
                    {r.name}
                  </span>
                </div>
                <span className="hidden sm:block text-xs text-slate-500">
                  {r.items?.length || 0} komponen
                </span>
                <span className="nums text-sm text-slate-300">
                  {formatRupiah(costs[r.id] || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Top ingredient cost-risk hint ===== */}
      {topIngredient && (
        <section className="flex items-center gap-3 rounded-2xl border border-warm-500/20 bg-warm-500/5 p-4">
          <div className="p-2.5 bg-warm-500/10 text-warm-400 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-300">
            Bahan dengan harga tertinggi:{" "}
            <span className="font-semibold text-slate-100">
              {topIngredient.name}
            </span>{" "}
            —{" "}
            <span className="nums text-warm-400">
              {formatRupiah(topIngredient.pricePerUnit || 0)}
            </span>{" "}
            per {topIngredient.unit}. Fluktuasi bahan ini paling berdampak ke HPP.
          </p>
        </section>
      )}
    </div>
  );
};

/* ---------------- sub-components ---------------- */

type Tone = "brand" | "warm" | "violet";
const TONE: Record<Tone, string> = {
  brand: "bg-brand-500/10 text-brand-400 border-brand-500/20",
  warm: "bg-warm-500/10 text-warm-400 border-warm-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function FlowNode({
  icon,
  label,
  value,
  tone,
  big,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
  big?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 min-w-[120px] rounded-xl border p-4 text-left flex flex-col gap-2 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${TONE[tone]}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <p className={`nums font-extrabold text-slate-100 ${big ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
    </button>
  );
}

function FlowArrow() {
  return (
    <div className="shrink-0 self-center text-surface-600">
      <ArrowRight className="w-5 h-5" />
    </div>
  );
}

function MetricCard({
  label,
  sub,
  value,
  icon,
  tone,
  status,
}: {
  label: string;
  sub: string;
  value: string;
  icon: React.ReactNode;
  tone: Tone;
  status: string;
}) {
  const accent = {
    brand: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    warm: "bg-warm-500/10 text-warm-400 border-warm-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  }[tone];
  const topAccent = {
    brand: "bg-brand-500",
    warm: "bg-warm-500",
    violet: "bg-violet-500",
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-700/60 bg-surface-900/40 p-5">
      <div className={`absolute inset-x-0 top-0 h-px ${topAccent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-300">{label}</p>
          <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl border ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="nums mt-6 text-4xl font-extrabold tracking-tight text-slate-100">{value}</p>
      <div className="mt-5 border-t border-surface-700/50 pt-3">
        <span className="inline-flex rounded-full bg-surface-800 px-2.5 py-1 text-[10px] font-medium text-slate-400">
          {status}
        </span>
      </div>
    </div>
  );
}
