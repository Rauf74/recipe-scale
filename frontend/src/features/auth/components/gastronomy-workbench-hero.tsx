import React, { useState } from "react";
import {
  CookingPot,
  Scales,
  ChartLineUp,
  Sparkle,
  Flame,
  SlidersHorizontal,
} from "@phosphor-icons/react";

interface RecipeSample {
  id: string;
  name: string;
  category: string;
  baseBeefGrams: number;
  baseSpiceGrams: number;
  baseHppRupiah: number;
  targetSellingPrice: number;
  yieldPercent: number;
}

const SAMPLE_RECIPES: RecipeSample[] = [
  {
    id: "rendang",
    name: "Rendang Sapi Prime Batch #04",
    category: "Menu Utama Katering",
    baseBeefGrams: 200,
    baseSpiceGrams: 45,
    baseHppRupiah: 42500,
    targetSellingPrice: 150000,
    yieldPercent: 88.5,
  },
  {
    id: "bumbu-merah",
    name: "Sub-Resep Bumbu Dasar Merah",
    category: "Formula Bumbu Inti",
    baseBeefGrams: 0,
    baseSpiceGrams: 250,
    baseHppRupiah: 18500,
    targetSellingPrice: 65000,
    yieldPercent: 94.2,
  },
  {
    id: "ayam-lengkuas",
    name: "Ayam Goreng Lengkuas Rempah",
    category: "Menu Unggulan Resto",
    baseBeefGrams: 180,
    baseSpiceGrams: 35,
    baseHppRupiah: 24000,
    targetSellingPrice: 85000,
    yieldPercent: 91.0,
  },
];

export const GastronomyWorkbenchHero: React.FC = () => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("rendang");
  const [portions, setPortions] = useState<number>(10);

  const activeRecipe =
    SAMPLE_RECIPES.find((r) => r.id === selectedRecipeId) || SAMPLE_RECIPES[0];

  const totalPrimaryIngredientKg = (
    ((activeRecipe.baseBeefGrams || activeRecipe.baseSpiceGrams) * portions) /
    1000
  ).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  const totalHppFormatted = (
    activeRecipe.baseHppRupiah * portions
  ).toLocaleString("id-ID");

  const foodCostPercentage = (
    (activeRecipe.baseHppRupiah / activeRecipe.targetSellingPrice) *
    100
  ).toFixed(1);

  return (
    <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-surface-950 border-r border-surface-800/80 h-full">
      {/* High-Resolution Gourmet Dark Culinary Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-luminosity"
        style={{
          backgroundImage: `url('https://picsum.photos/seed/recipe-scale-dark-kitchen/1920/1080')`,
        }}
      />
      
      {/* Ambient Radial Lighting Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-surface-950 via-surface-950/90 to-surface-950/95 pointer-events-none" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BRANDING BAR */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shadow-lg shadow-brand-500/10">
            <CookingPot className="w-7 h-7" weight="bold" />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tight text-slate-100">
              Recipe<span className="text-brand-400">Scale</span>
            </span>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Executive Culinary Gastronomy Workbench
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-semibold tracking-wide">
          <Sparkle className="w-3.5 h-3.5 text-brand-400 animate-pulse" weight="fill" />
          Interactive Recipe Simulator
        </div>
      </div>

      {/* MIDDLE: MAIN INTERACTIVE WORKBENCH */}
      <div className="relative z-10 my-auto py-6 space-y-6 max-w-xl">
        <div className="space-y-2">
          <span className="text-[11px] uppercase font-mono tracking-widest text-brand-400 font-bold">
            Standardisasi Resep & Presisi HPP Dapur
          </span>
          <h1 className="text-3xl xl:text-4xl font-black text-slate-100 tracking-tight leading-tight">
            Satu Ruang Kerja untuk Seluruh Formula & Timbangan Dapur F&B
          </h1>
          <p className="text-slate-400 text-xs xl:text-sm leading-relaxed">
            Uji coba simulasi timbangan resep interaktif di bawah ini. Pilih resep sampel dan geser porsi saji katering untuk mengamati kalkulasi gramatur serta HPP secara presisi.
          </p>
        </div>

        {/* CULINARY WORKBENCH CARD */}
        <div className="p-5 rounded-3xl bg-surface-900/80 border border-surface-700/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5">
          
          {/* Multi-Recipe Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-950/80 border border-surface-800">
            {SAMPLE_RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => setSelectedRecipeId(recipe.id)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-center truncate ${
                  selectedRecipeId === recipe.id
                    ? "bg-brand-500 text-surface-950 font-bold shadow-brand"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-800/50"
                }`}
              >
                {recipe.id === "rendang"
                  ? "Rendang Sapi"
                  : recipe.id === "bumbu-merah"
                  ? "Bumbu Merah"
                  : "Ayam Lengkuas"}
              </button>
            ))}
          </div>

          {/* Active Recipe Header */}
          <div className="flex items-center justify-between border-b border-surface-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <CookingPot className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  {activeRecipe.category}
                </span>
                <h2 className="text-sm font-bold text-slate-100">{activeRecipe.name}</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase nums font-mono">
                Food Cost: {foodCostPercentage}% (SAFE)
              </span>
            </div>
          </div>

          {/* Interactive Portion Slider & Preset Quick Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                Skala Porsi Saji Katering:
              </span>
              <span className="font-bold text-brand-400 font-mono text-sm nums">
                {portions} Porsi Saji
              </span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min={1}
              max={150}
              value={portions}
              onChange={(e) => setPortions(Number(e.target.value))}
              className="w-full h-2 bg-surface-950 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[1, 10, 50, 150].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPortions(p)}
                  className={`py-1 px-2 rounded-xl text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer border hover:-translate-y-[0.5px] active:scale-[0.98] ${
                    portions === p
                      ? "bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm"
                      : "bg-surface-950/60 text-slate-400 border-surface-800 hover:border-brand-500/30"
                  }`}
                >
                  {p === 1 ? "1 Porsi" : `${p} Porsi`}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Metrics Display (Tabular Figures) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-surface-950/80 border border-surface-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                {activeRecipe.baseBeefGrams > 0 ? "Bahan Utama" : "Bumbu Halus"}
              </span>
              <p className="font-bold text-slate-100 font-mono text-sm text-brand-300 nums">
                {totalPrimaryIngredientKg} <span className="text-[10px] font-sans text-slate-400">kg</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-950/80 border border-surface-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                Yield Usable %
              </span>
              <p className="font-bold text-slate-100 font-mono text-sm text-warm-400 nums">
                {activeRecipe.yieldPercent}%
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-950/80 border border-surface-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                HPP Total Resep
              </span>
              <p className="font-bold text-emerald-400 font-mono text-sm nums">
                Rp {totalHppFormatted}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM TRUST STRIP */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-surface-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Scales className="w-4 h-4 text-brand-400 shrink-0" weight="bold" />
          <span className="text-[11px]">Precision Portion Scale</span>
        </div>
        <div className="flex items-center gap-2">
          <ChartLineUp className="w-4 h-4 text-emerald-400 shrink-0" weight="bold" />
          <span className="text-[11px]">Real-Time Yield Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-warm-400 shrink-0" weight="bold" />
          <span className="text-[11px]">Sub-Recipe Batching</span>
        </div>
      </div>
    </div>
  );
};
