import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Loader2, ReceiptText, TrendingUp } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";

interface Recipe {
  id: string;
  name: string;
  isBaseRecipe: boolean;
  sellingPrice?: number | null;
  targetFoodCost?: number | null;
}

interface RecipeInsight {
  recipe: Recipe;
  totalCost: number;
  sellingPrice: number | null;
  foodCost: number | null;
  margin: number | null;
}

export function AnalysisPage() {
  const [insights, setInsights] = useState<RecipeInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: { menus: Array<{ recipe: Recipe; unitCost: number; sellingPrice: number; foodCostPercent: number; margin: number; hasSellingPrice: boolean }> } }>("/api/analytics/menu-performance");
        setInsights(response.data.data.menus.map((menu) => ({
          recipe: menu.recipe,
          totalCost: menu.unitCost,
          sellingPrice: menu.hasSellingPrice ? menu.sellingPrice : null,
          foodCost: menu.hasSellingPrice ? menu.foodCostPercent : null,
          margin: menu.hasSellingPrice ? menu.margin : null,
        })));
      } catch {
        setError("Data analisis belum dapat dimuat. Coba muat ulang halaman ini.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadInsights();
  }, []);

  const summary = useMemo(() => {
    const withoutPrice = insights.filter((item) => !item.sellingPrice).length;
    const needsAttention = insights.filter((item) => {
      const target = item.recipe.targetFoodCost ?? 35;
      return item.foodCost !== null && item.foodCost > target;
    }).length;
    const averageFoodCostItems = insights.filter((item) => item.foodCost !== null);
    const averageFoodCost = averageFoodCostItems.length
      ? averageFoodCostItems.reduce((total, item) => total + (item.foodCost ?? 0), 0) / averageFoodCostItems.length
      : null;
    return { withoutPrice, needsAttention, averageFoodCost };
  }, [insights]);

  if (isLoading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Kontrol Keuntungan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Analisis Menu</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Lihat menu yang sudah sehat, yang belum memiliki harga jual, dan yang perlu ditinjau sebelum dijual.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <AnalysisMetric icon={ReceiptText} label="Menu terhitung" value={`${insights.length} menu`} tone="brand" />
            <AnalysisMetric icon={AlertTriangle} label="Butuh perhatian" value={`${summary.needsAttention} menu`} tone="warm" />
            <AnalysisMetric icon={TrendingUp} label="Rata-rata food cost" value={summary.averageFoodCost === null ? "Belum ada data" : `${summary.averageFoodCost.toFixed(1)}%`} tone="green" />
          </section>

          {summary.withoutPrice > 0 && (
            <div className="flex gap-3 rounded-2xl border border-warm-500/25 bg-warm-500/10 px-4 py-3 text-sm text-warm-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm-400" />
              <p>{summary.withoutPrice} menu belum memiliki harga jual sehingga margin dan food cost belum bisa dievaluasi.</p>
            </div>
          )}

          <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40">
            <div className="flex items-center justify-between border-b border-surface-700/60 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-100">Ledger HPP & margin</h2>
                <p className="mt-1 text-xs text-slate-500">Ambang food cost mengikuti target per resep, atau 35% bila belum ditentukan.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-slate-500" />
            </div>

            {insights.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-slate-500">Belum ada resep menu yang dapat dianalisis.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-surface-700/60 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Menu</th>
                      <th className="px-4 py-3 font-semibold">HPP</th>
                      <th className="px-4 py-3 font-semibold">Harga jual</th>
                      <th className="px-4 py-3 font-semibold">Food cost</th>
                      <th className="px-5 py-3 text-right font-semibold">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700/50">
                    {insights.map((item) => {
                      const target = item.recipe.targetFoodCost ?? 35;
                      const needsAttention = item.foodCost !== null && item.foodCost > target;
                      return (
                        <tr key={item.recipe.id} className="text-slate-300">
                          <td className="px-5 py-4 font-semibold text-slate-100">{item.recipe.name}</td>
                          <td className="px-4 py-4 font-mono">{formatRupiah(item.totalCost)}</td>
                          <td className="px-4 py-4 font-mono">{item.sellingPrice ? formatRupiah(item.sellingPrice) : <span className="font-sans text-slate-500">Belum diatur</span>}</td>
                          <td className="px-4 py-4">
                            {item.foodCost === null ? (
                              <span className="text-slate-500">—</span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${needsAttention ? "bg-warm-500/15 text-warm-300" : "bg-brand-500/10 text-brand-300"}`}>
                                {item.foodCost.toFixed(1)}% / target {target}%
                              </span>
                            )}
                          </td>
                          <td className={`px-5 py-4 text-right font-mono font-bold ${needsAttention ? "text-warm-300" : "text-brand-300"}`}>
                            {item.margin === null ? "—" : formatRupiah(item.margin)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function AnalysisMetric({ icon: Icon, label, value, tone }: { icon: typeof ReceiptText; label: string; value: string; tone: "brand" | "warm" | "green" }) {
  const iconColor = tone === "warm" ? "text-warm-400" : "text-brand-400";
  return (
    <article className="rounded-2xl border border-surface-700/60 bg-surface-900/40 p-4">
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-100">{value}</p>
    </article>
  );
}
