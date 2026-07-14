import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  ArrowUpRight,
  TrendingUp,
  CircleAlert,
  Coins,
  ClipboardList,
  Plus,
} from "lucide-react";

interface PriceAlert {
  ingredientId: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  updatedAt: string;
}

interface MarginAlert {
  recipeId: string;
  name: string;
  unitCost: number;
  sellingPrice: number;
  currentFoodCostPercent: number;
  targetFoodCostPercent: number;
  status: "danger" | "warning" | "good";
}

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
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest">("highest");
  
  // Dashboard Alerts state
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [marginAlerts, setMarginAlerts] = useState<MarginAlert[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get<{ success: boolean; data: { recipes: Recipe[] } }>("/api/recipes"),
      apiClient.get<{ success: boolean; data: { ingredients: Ingredient[] } }>("/api/ingredients"),
      apiClient.get<{ success: boolean; data: { priceAlerts: PriceAlert[]; marginAlerts: MarginAlert[] } }>("/api/dashboard/alerts"),
    ])
      .then(async ([r, i, a]) => {
        if (r.data.success) setRecipes(r.data.data.recipes);
        if (i.data.success) setIngredients(i.data.data.ingredients);
        
        // Populate alerts if successful
        if (a.data.success) {
          setPriceAlerts(a.data.data.priceAlerts || []);
          setMarginAlerts(a.data.data.marginAlerts || []);
        }

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

  const baseRecipes = recipes.filter((r) => r.isBaseRecipe);
  const menuRecipes = recipes.filter((r) => !r.isBaseRecipe);

  // Ingredient with highest purchase price (proxy cost-risk)
  const topIngredient = [...ingredients].sort(
    (a, b) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0)
  )[0];

  // Calculate total inventory financial value
  const totalInventoryValue = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + (ing.currentStock * (ing.pricePerUnit || 0)), 0);
  }, [ingredients]);

  // Average component count per recipe
  const avgComponents =
    recipes.length > 0
      ? recipes.reduce((s, r) => s + (r.items?.length || 0), 0) / recipes.length
      : 0;

  // Top profit margin recipes vs low margin recipes (menu recipes only)
  const sortedRankings = useMemo(() => {
    const list = menuRecipes
      .map(r => {
        const cost = costs[r.id] || 0;
        const margin = r.sellingPrice > 0 ? ((r.sellingPrice - cost) / r.sellingPrice) * 100 : 0;
        const foodCostPct = r.sellingPrice > 0 ? (cost / r.sellingPrice) * 100 : 0;
        return { recipe: r, cost, margin, foodCostPct };
      })
      .filter(x => x.recipe.sellingPrice > 0);

    if (sortOrder === "highest") {
      return [...list].sort((a, b) => b.margin - a.margin).slice(0, 5);
    } else {
      return [...list].sort((a, b) => a.margin - b.margin).slice(0, 5);
    }
  }, [menuRecipes, costs, sortOrder]);

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
      <section className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
              Alur Biaya HPP
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1 font-sans">
              {getGreeting()}, pantau dapur Anda
            </h1>
          </div>
          <button
            onClick={() => navigate("/recipes")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-full transition-all hover:shadow-brand active:scale-[0.98] cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Resep Menu
          </button>
        </div>

        {/* Flow nodes */}
        <div className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-2">
          <FlowNode
            icon={<Package className="w-4 h-4" />}
            label="Bahan"
            value={String(ingredients.length)}
            tone="brand"
            onClick={() => navigate("/ingredients")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Warehouse className="w-4 h-4" />}
            label="Stok"
            value={`${ingredients.reduce((total, i) => total + i.currentStock, 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}`}
            tone="brand"
            onClick={() => navigate("/stock")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Layers className="w-4 h-4" />}
            label="Bumbu Dasar"
            value={String(baseRecipes.length)}
            tone="violet"
            onClick={() => navigate("/preps")}
          />
          <FlowArrow />
          <FlowNode
            icon={<ChefHat className="w-4 h-4" />}
            label="Resep Jadi"
            value={String(menuRecipes.length)}
            tone="warm"
            onClick={() => navigate("/recipes")}
          />
          <FlowArrow />
          <FlowNode
            icon={<Scale className="w-4 h-4" />}
            label="Rata-rata HPP"
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

      {/* ===== Dashboard Alerts Section (Risks & Margin Alerts) ===== */}
      {(priceAlerts.length > 0 || marginAlerts.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          
          {/* Margin Alerts Card */}
          {marginAlerts.length > 0 && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
              <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                Alarm Margin Terancam ({marginAlerts.length} Menu)
              </h2>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {marginAlerts.map((alert) => (
                  <div key={alert.recipeId} className="flex justify-between items-center bg-surface-950/40 p-2.5 rounded-xl border border-red-500/10 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{alert.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Harga Jual: {formatRupiah(alert.sellingPrice)} · Target FC: {alert.targetFoodCostPercent}%
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-red-400 font-extrabold text-xs">
                        FC: {alert.currentFoodCostPercent}%
                      </span>
                      <p className="text-[9px] text-red-500 font-semibold mt-0.5">Margin Susut</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Alerts Card */}
          {priceAlerts.length > 0 && (
            <div className="rounded-3xl border border-warm-500/20 bg-warm-500/5 p-5 space-y-3">
              <h2 className="text-sm font-bold text-warm-400 flex items-center gap-2">
                <CircleAlert className="w-4.5 h-4.5 shrink-0" />
                Deteksi Kenaikan Harga Bahan ({priceAlerts.length} Item)
              </h2>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {priceAlerts.map((alert) => (
                  <div key={alert.ingredientId} className="flex justify-between items-center bg-surface-950/40 p-2.5 rounded-xl border border-warm-500/10 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{alert.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Harga Lama: {formatRupiah(alert.previousPrice)}/unit
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-warm-400 font-extrabold text-xs flex items-center justify-end gap-1">
                        +{alert.changePercent}%
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Baru: {formatRupiah(alert.currentPrice)}/unit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== Kitchen KPIs ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Kerumitan Rata-rata"
          sub="komponen per resep"
          value={avgComponents.toFixed(1)}
          icon={<Layers className="w-5 h-5" />}
          tone="brand"
          status={recipes.length > 0 ? `${recipes.length} resep dianalisis` : "Belum ada resep"}
        />
        <MetricCard
          label="Nilai Aset Persediaan"
          sub="Total investasi stok gudang"
          value={formatRupiah(totalInventoryValue)}
          icon={<Coins className="w-5 h-5" />}
          tone="warm"
          status={`${ingredients.length} jenis bahan baku`}
        />
        <MetricCard
          label="Rasio Menu / Bumbu"
          sub="Struktur resep dapur"
          value={`${menuRecipes.length} : ${baseRecipes.length}`}
          icon={<ChefHat className="w-5 h-5" />}
          tone="violet"
          status="Siap disimulasikan HPP"
        />
      </section>

      {/* ===== Grid: Rankings & Shortcuts ===== */}
      <div className="grid gap-6 md:grid-cols-[1fr_380px]">
        
        {/* Left: Recipe Margins Analysis */}
        <section className="space-y-6">
          
          {/* Analisis Margin Menu */}
          {sortedRankings.length > 0 ? (
            <div className="rounded-3xl border border-surface-700/60 bg-surface-900/40 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/60 gap-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  {sortOrder === "highest" ? (
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-warm-500" />
                  )}
                  Peringkat Margin Menu
                </h2>
                
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "highest" | "lowest")}
                  className="select bg-surface-950 border border-surface-700/60 py-1 px-3 text-xs w-auto rounded-lg cursor-pointer text-slate-300 font-semibold focus:outline-none"
                  style={{ paddingRight: "2.25rem", height: "auto" }}
                >
                  <option value="highest">Margin Tertinggi</option>
                  <option value="lowest">Margin Terendah</option>
                </select>
              </div>

              <div className="divide-y divide-surface-800">
                {sortedRankings.map((item: { recipe: Recipe; cost: number; margin: number; foodCostPct: number }) => (
                  <div key={item.recipe.id} className="ledger-row grid-cols-[1fr_auto_auto]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 grid place-items-center rounded-lg font-extrabold text-xs shrink-0 ${
                        sortOrder === "highest" ? "bg-brand-500/10 text-brand-400" : "bg-warm-500/10 text-warm-400"
                      }`}>
                        {item.recipe.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="ledger-name font-semibold text-slate-200 truncate text-sm">
                        {item.recipe.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mr-2">
                      Food Cost: {item.foodCostPct.toFixed(1)}%
                    </span>
                    <span className={`nums text-sm font-extrabold ${
                      sortOrder === "highest" ? "text-brand-400" : "text-warm-400"
                    }`}>
                      Margin: {item.margin.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-8 text-center text-slate-500 text-sm italic">
              Belum ada resep menu dengan harga jual untuk dianalisis marginnya.
            </div>
          )}
        </section>

        {/* Right: Quick shortcuts and Risk-cost alerts */}
        <section className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              Pintasan Cepat Dapur
            </h3>
            <div className="grid grid-cols-2 gap-3.5">
              <ShortcutButton
                label="Tambah Bahan"
                to="/ingredients"
                desc="Input bahan baku"
              />
              <ShortcutButton
                label="Racik Resep"
                to="/recipes"
                desc="HPP resep baru"
              />
              <ShortcutButton
                label="Isi Stok Masuk"
                to="/stock"
                desc="Update persediaan"
              />
              <ShortcutButton
                label="Mulai Produksi"
                to="/production"
                desc="Potong stok bahan"
              />
            </div>
          </div>

          {/* Risk-cost Alert */}
          {topIngredient && (
            <div className="rounded-3xl border border-warm-500/20 bg-warm-500/5 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warm-500/10 text-warm-400 rounded-xl">
                  <TrendingDown className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Bahan Termahal (Risiko Cost)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Fluktuasi harga paling berdampak</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Item termahal saat ini adalah <span className="font-bold text-slate-200">{topIngredient.name}</span> seharga{" "}
                <span className="font-extrabold text-warm-400 font-mono">{formatRupiah(topIngredient.pricePerUnit || 0)}</span> per {topIngredient.unit}.
              </p>
            </div>
          )}
        </section>
      </div>

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
      <p className={`nums font-extrabold text-slate-100 ${big ? "text-sm" : "text-2xl"}`}>
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
      <p className="nums mt-6 text-2xl font-extrabold tracking-tight text-slate-100 truncate">{value}</p>
      <div className="mt-5 border-t border-surface-700/50 pt-3">
        <span className="inline-flex rounded-full bg-surface-800 px-2.5 py-1 text-[10px] font-medium text-slate-400">
          {status}
        </span>
      </div>
    </div>
  );
}

function ShortcutButton({
  label,
  to,
  desc,
}: {
  label: string;
  to: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col p-3 rounded-2xl bg-surface-950/40 border border-surface-800 hover:border-brand-500/30 hover:bg-surface-800/30 text-left transition-all active:scale-[0.98] group"
    >
      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
        <span>{label}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
      </div>
      <span className="text-[9px] text-slate-600 mt-1 font-light">{desc}</span>
    </Link>
  );
}
