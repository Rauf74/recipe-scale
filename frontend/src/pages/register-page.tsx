import React from "react";
import { RegisterForm } from "../features/auth/components/register-form";
import { ChefHat, ShieldCheck, Sparkles, CheckCircle2, Utensils, Award } from "lucide-react";

export const RegisterPage: React.FC = () => {
  return (
    <div className="relative min-h-screen lg:h-screen w-full font-sans bg-surface-950 text-slate-200 overflow-x-hidden lg:overflow-hidden flex items-center justify-center">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Grid container: 1-col on mobile, 12-col split-screen on desktop */}
      <div className="relative z-10 w-full min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT PANEL: Culinary Studio Workspace Onboarding (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900/95 to-surface-950 border-r border-surface-800/80 h-full">
          
          {/* Gourmet Ambient Glow Effect */}
          <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 via-brand-500/20 to-amber-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-slate-100">
                  Recipe<span className="text-emerald-400">Scale</span>
                </span>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Workspace Initialization
                </p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Multi-Outlet F&B Isolation
            </div>
          </div>

          {/* Middle Main Showcase Content */}
          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-3xl xl:text-4xl font-black text-slate-100 tracking-tight leading-tight">
                Mulai Digitalisasi Standardisasi Resep & HPP Dapur
              </h1>
              <p className="text-slate-400 text-xs xl:text-sm leading-relaxed">
                Buat workspace baru untuk usaha kuliner F&B, resto, bakery, atau katering Anda. Kelola stok bahan baku, racik formula bumbu dasar, dan bagikan resep standar secara aman.
              </p>
            </div>

            {/* 3 Feature Cards */}
            <div className="grid grid-cols-1 gap-3 max-w-xl">
              
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-surface-800 backdrop-blur-xl flex items-start gap-3.5 hover:border-emerald-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Ruang Kerja Terisolasi Berbasis PostgreSQL</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Setiap workspace memiliki data bahan dan resep terpisah yang terlindungi enkripsi database tingkat enterprise.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-surface-800 backdrop-blur-xl flex items-start gap-3.5 hover:border-amber-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Standardisasi Kitchen Scaling Sheet</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Chef dan kru dapur dapat mencetak lembar timbangan porsi saji katering instan tanpa takut salah takaran bumbu.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-surface-800 backdrop-blur-xl flex items-start gap-3.5 hover:border-brand-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 shrink-0 border border-brand-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Otomatisasi Potong Stok Production Batch</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Setiap kali rencana produksi diselesaikan, stok bahan baku di gudang terpotong otomatis secara transparan.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-surface-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px]">Enkripsi JWT Stateless & Database Security</span>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Gourmet Glass Form Container (Centered 100% viewport height, NO SCROLL) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-5 flex items-center justify-center p-4 sm:p-6 lg:p-8 h-full overflow-y-auto lg:overflow-y-visible">
          <div className="w-full max-w-md my-auto">
            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
};
