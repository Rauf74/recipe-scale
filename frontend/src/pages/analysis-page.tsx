import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Loader2, ReceiptText, TrendingUp, Search } from "lucide-react";
import type { Recipe } from "../types";
import { apiClient } from "../lib/api-client";
import { formatRupiah } from "../lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HEALTHY" | "ATTENTION">("ALL");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: {
            menus: Array<{
              recipe: Recipe;
              unitCost: number;
              sellingPrice: number;
              foodCostPercent: number;
              margin: number;
              hasSellingPrice: boolean;
            }>;
          };
        }>("/api/analytics/menu-performance");

        setInsights(
          response.data.data.menus.map((menu) => ({
            recipe: menu.recipe,
            totalCost: menu.unitCost,
            sellingPrice: menu.hasSellingPrice ? menu.sellingPrice : null,
            foodCost: menu.hasSellingPrice ? menu.foodCostPercent : null,
            margin: menu.hasSellingPrice ? menu.margin : null,
          }))
        );
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

  // Dynamically filter insights based on search query and status filter
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      const recipeName = item.recipe.name || "";
      const matchSearch = recipeName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const target = item.recipe.targetFoodCost ?? 35;
      const isAttention = item.foodCost !== null && item.foodCost > target;

      let matchStatus = true;
      if (statusFilter === "HEALTHY") {
        matchStatus = item.foodCost !== null && !isAttention;
      } else if (statusFilter === "ATTENTION") {
        matchStatus = isAttention;
      }

      return matchSearch && matchStatus;
    });
  }, [insights, searchQuery, statusFilter]);

  // Generate chart data reactively from the filtered insights list
  const chartData = useMemo(() => {
    return filteredInsights
      .filter((item) => item.sellingPrice !== null && item.sellingPrice > 0)
      .map((item) => {
        const cost = item.totalCost;
        const profit = (item.sellingPrice ?? 0) - cost;
        return {
          name: item.recipe.name,
          "Biaya (HPP)": Math.round(cost),
          "Keuntungan (Margin)": Math.round(profit),
        };
      })
      .slice(0, 8); // Display top 8 filtered items to prevent layout clutter
  }, [filteredInsights]);

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
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Kontrol Keuntungan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 font-sans">Analisis Menu</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Tinjau performa margin menu, pantau food cost terhadap target, dan evaluasi harga jual demi profitabilitas outlet.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <section className="grid gap-4 sm:grid-cols-3">
            <AnalysisMetric icon={ReceiptText} label="Menu Terhitung" value={`${insights.length} menu`} tone="brand" />
            <AnalysisMetric icon={AlertTriangle} label="Butuh Perhatian" value={`${summary.needsAttention} menu`} tone="warm" />
            <AnalysisMetric icon={TrendingUp} label="Rata-rata Food Cost" value={summary.averageFoodCost === null ? "Belum ada data" : `${summary.averageFoodCost.toFixed(1)}%`} tone="green" />
          </section>

          {summary.withoutPrice > 0 && (
            <div className="flex gap-3 rounded-2xl border border-warm-500/25 bg-warm-500/10 px-4 py-3 text-sm text-warm-100 print:hidden">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm-400" />
              <p>{summary.withoutPrice} menu belum memiliki harga jual sehingga margin dan food cost belum bisa dievaluasi.</p>
            </div>
          )}

          {/* Control Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-surface-800 pb-4 print:hidden">
            {/* Status Filters */}
            <div className="flex rounded-full bg-surface-900/60 p-1 border border-surface-700/60 w-full sm:w-auto">
              {(["ALL", "HEALTHY", "ATTENTION"] as const).map((tab) => (
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
                  {tab === "ALL" ? "Semua" : tab === "HEALTHY" ? "Margin Sehat" : "Butuh Perhatian"}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari resep menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full py-1.5 pr-3 text-xs bg-surface-900/50 border-surface-700/60 rounded-xl"
                style={{ paddingLeft: "2.25rem", height: "auto" }}
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

          {/* Stacked Bar Chart: HPP vs Profit Margin */}
          {chartData.length > 0 && (
            <section className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-5 space-y-4 print:hidden">
              <div>
                <h2 className="font-bold text-slate-100 font-sans">Komposisi HPP vs Keuntungan</h2>
                <p className="mt-1 text-xs text-slate-500">Visualisasi kontribusi biaya bahan baku (HPP) dibandingkan margin keuntungan kotor per menu (dalam Rupiah).</p>
              </div>

              <div className="h-[280px] w-full text-[10px] font-sans">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "16px",
                        color: "#f1f5f9",
                        fontSize: "11px",
                      }}
                      formatter={(value: any) => [`Rp ${value.toLocaleString("id-ID")}`]}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                    <Bar dataKey="Biaya (HPP)" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Keuntungan (Margin)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Ledger Table */}
          <section className="overflow-hidden rounded-3xl border border-surface-700/60 bg-surface-900/40 print:border-slate-300 print:bg-white print:text-slate-900">
            <div className="flex items-center justify-between border-b border-surface-700/60 px-5 py-4 bg-surface-900/10 print:bg-slate-100 print:border-slate-300">
              <div>
                <h2 className="font-bold text-slate-100 print:text-slate-900 font-sans">Ledger HPP & Margin</h2>
                <p className="mt-1 text-xs text-slate-500">Ambang food cost mengikuti target per resep, atau 35% bila belum ditentukan.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-slate-500 print:hidden" />
            </div>

            {filteredInsights.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-slate-500 italic">
                Menu tidak ditemukan atau tidak ada resep yang sesuai kriteria filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-surface-700/60 text-xs uppercase tracking-wider text-slate-500 print:text-slate-700 print:border-slate-300">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Menu</th>
                      <th className="px-4 py-3.5 font-semibold">HPP</th>
                      <th className="px-4 py-3.5 font-semibold">Harga Jual</th>
                      <th className="px-4 py-3.5 font-semibold">Food Cost (FC)</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Margin Kotor (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700/50 print:divide-slate-200">
                    {filteredInsights.map((item) => {
                      const target = item.recipe.targetFoodCost ?? 35;
                      const needsAttention = item.foodCost !== null && item.foodCost > target;
                      return (
                        <tr key={item.recipe.id} className="text-slate-300 hover:bg-surface-800/10 transition-colors print:text-slate-800">
                          <td className="px-5 py-4 font-semibold text-slate-100 print:text-slate-900">{item.recipe.name}</td>
                          <td className="px-4 py-4 font-mono text-sm">{formatRupiah(item.totalCost)}</td>
                          <td className="px-4 py-4 font-mono text-sm">
                            {item.sellingPrice ? (
                              formatRupiah(item.sellingPrice)
                            ) : (
                              <span className="font-sans text-slate-500 text-sm italic">Belum diatur</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {item.foodCost === null ? (
                              <span className="text-slate-500">—</span>
                            ) : (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border tracking-wider ${
                                  needsAttention
                                    ? "bg-warm-500/10 text-warm-300 border-warm-500/20 print:bg-red-50 print:text-red-700 print:border-red-200"
                                    : "bg-brand-500/10 text-brand-300 border-brand-500/20 print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200"
                                }`}
                              >
                                {item.foodCost.toFixed(1)}% / Target {target}%
                              </span>
                            )}
                          </td>
                          <td className={`px-5 py-4 text-right font-mono font-bold text-sm ${needsAttention ? "text-warm-300 print:text-red-700" : "text-brand-300 print:text-emerald-700"}`}>
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

function AnalysisMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  tone: "brand" | "warm" | "green";
}) {
  const iconColor = tone === "warm" ? "text-warm-400" : tone === "green" ? "text-brand-400" : "text-brand-400";
  const accentBorder = tone === "warm" ? "border-warm-500/20" : tone === "green" ? "border-brand-500/20" : "border-brand-500/20";
  return (
    <article className={`rounded-3xl border bg-surface-900/40 p-4 ${accentBorder} print:bg-slate-50 print:border-slate-200`}>
      <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
      <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-extrabold text-slate-100 print:text-slate-900">{value}</p>
    </article>
  );
}
