import React, { useState } from "react";
import { LoginForm } from "../features/auth/components/login-form";
import { ChefHat, Sparkles, Scale, TrendingUp, UtensilsCrossed, Flame } from "lucide-react";

export const LoginPage: React.FC = () => {
  // Live Interactive Scale State inside Hero Banner
  const [portions, setPortions] = useState(1);

  // Sample recipe scaling calculations
  const baseBeefGrams = 200;
  const baseSpiceGrams = 45;
  const baseHppRupiah = 42500;
  const targetSellingPrice = 150000;

  const totalBeefKg = ((baseBeefGrams * portions) / 1000).toLocaleString("id-ID", {
    minimumFractionDigits: portions > 1 ? 1 : 1,
    maximumFractionDigits: 2,
  });

  const totalSpiceKg = ((baseSpiceGrams * portions) / 1000).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalHppFormatted = (baseHppRupiah * portions).toLocaleString("id-ID");
  const foodCostPercentage = ((baseHppRupiah / targetSellingPrice) * 100).toFixed(1);

  return (
    <div className="relative min-h-screen lg:h-screen w-full font-sans bg-surface-950 text-slate-200 overflow-x-hidden lg:overflow-hidden flex items-center justify-center">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Grid container: 1-col on mobile, 12-col split-screen on desktop (Exact 100vh height on desktop) */}
      <div className="relative z-10 w-full min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT PANEL: Interactive Culinary Scale Studio Hero (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900/95 to-surface-950 border-r border-surface-800/80 h-full">
          
          {/* Subtle Ambient Glow Effect matching index.css */}
          <div className="absolute top-10 left-10 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shadow-lg shadow-brand-500/10">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-slate-100">
                  Recipe<span className="text-brand-400">Scale</span>
                </span>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Culinary Gastronomy Studio
                </p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              Interactive Kitchen Simulator
            </div>
          </div>

          {/* Middle Content: Live Interactive Recipe Scale Preview */}
          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-3xl xl:text-4xl font-black text-slate-100 tracking-tight leading-tight">
                Simulasi Resep Dapur & Kalkulasi HPP Real-Time
              </h1>
              <p className="text-slate-400 text-xs xl:text-sm leading-relaxed">
                Coba simulasi penimbangan porsi saji di bawah ini. Geser porsi saji katering dan lihat bagaimana RecipeScale menghitung takaran bumbu serta HPP secara instan.
              </p>
            </div>

            {/* LIVE INTERACTIVE CULINARY SCALE CARD WIDGET */}
            <div className="p-5 rounded-2xl bg-surface-900/80 border border-surface-700/80 backdrop-blur-xl shadow-soft space-y-4 max-w-xl">
              
              {/* Recipe Header */}
              <div className="flex items-center justify-between border-b border-surface-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-brand-400 font-bold">
                      Resep Sampel Dapur Utama
                    </span>
                    <h2 className="text-sm font-bold text-slate-100">Rendang Sapi Prime Batch #04</h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                    Food Cost: {foodCostPercentage}% (SAFE)
                  </span>
                </div>
              </div>

              {/* Portion Scale Selector Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Ubah Porsi Saji Katering:</span>
                  <span className="font-bold text-brand-400 font-mono text-sm">{portions} Porsi Saji</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[1, 10, 50, 150].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPortions(p)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                        portions === p
                          ? "bg-brand-500 text-surface-950 border-brand-400 shadow-brand"
                          : "bg-surface-950/60 text-slate-300 border-surface-800 hover:border-brand-500/40"
                      }`}
                    >
                      {p === 1 ? "1 Porsi" : `${p} Porsi`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Ingredient Weights Display */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Daging Sapi Clean</span>
                  <p className="font-bold text-slate-100 font-mono text-sm text-brand-300">
                    {totalBeefKg} <span className="text-[10px] font-sans text-slate-400">kg</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Bumbu Halus Merah</span>
                  <p className="font-bold text-slate-100 font-mono text-sm text-warm-400">
                    {totalSpiceKg} <span className="text-[10px] font-sans text-slate-400">kg</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">HPP Total Resep</span>
                  <p className="font-bold text-emerald-400 font-mono text-sm">
                    Rp {totalHppFormatted}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Footer Trust Features */}
          <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-surface-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-[11px]">Precision Portion Scale</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Real-Time Yield Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-warm-400 shrink-0" />
              <span className="text-[11px]">Sub-Recipe Batching</span>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Gourmet Glass Form Container (Centered 100% viewport height, NO SCROLL) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-5 flex items-center justify-center p-4 sm:p-6 lg:p-8 h-full overflow-y-auto lg:overflow-y-visible">
          <div className="w-full max-w-md my-auto">
            <LoginForm />
          </div>
        </div>

      </div>
    </div>
  );
};
