import React from "react";
import { RegisterForm } from "../features/auth/components/register-form";
import { ChefHat, ShieldCheck, TrendingUp, Sparkles, Layers, CheckCircle2 } from "lucide-react";

export const RegisterPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full font-sans bg-surface-950 text-slate-200 overflow-x-hidden flex items-center justify-center p-4 lg:p-0">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Grid container: 1-col on mobile, 12-col split-screen on desktop */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANEL: Hero & Feature Showcase (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900/80 to-surface-950 border-r border-surface-800/60">
          
          {/* Subtle Ambient Glow Effect inside panel */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-brand-500/20 to-emerald-500/20 text-brand-400 rounded-2xl border border-brand-500/30 shadow-lg shadow-brand-500/10">
                <ChefHat className="w-7 h-7" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-100">
                Recipe<span className="text-brand-400">Scale</span>
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Pendaftaran Workspace Baru
            </div>
          </div>

          {/* Middle Main Showcase Content */}
          <div className="relative z-10 space-y-8 my-8">
            <div className="space-y-4 max-w-xl">
              <h1 className="text-3xl xl:text-4xl font-black text-slate-100 tracking-tight leading-tight">
                Mulai Digitalisasi Resep & HPP Dapur Resto Anda
              </h1>
              <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
                Buat workspace terisolasi untuk outlet kuliner Anda. Kelola persediaan stok bahan baku, racik formula bumbu dasar, dan bagikan resep standar secara aman ke seluruh tim dapur.
              </p>
            </div>

            {/* 3 Feature Showcase Cards */}
            <div className="grid grid-cols-1 gap-3.5 max-w-xl">
              
              <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-700/60 backdrop-blur-md flex items-start gap-3.5 hover:border-emerald-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Ruang Kerja Multi-Outlet Terisolasi</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Setiap workspace memiliki basis data independen yang aman, melindungi kerahasiaan racikan resep rahasia bisnis F&B Anda.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-700/60 backdrop-blur-md flex items-start gap-3.5 hover:border-brand-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 shrink-0 border border-brand-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Otomatisasi Margin Profit & Stock Log</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Setiap kali produksi selesai, sistem otomatis memotong stok bahan baku dan mencatat riwayat mutasi harga secara real-time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-700/60 backdrop-blur-md flex items-start gap-3.5 hover:border-purple-500/40 transition-all">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Cetak Laporan PDF Dapur HPP</h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Cetak lembar timbangan dapur dan rincian HPP resep langsung ke format PDF putih ramah lingkungan yang siap dibagikan ke chef.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Footer Trust Badge */}
          <div className="relative z-10 flex items-center gap-6 pt-4 border-t border-surface-800/60 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keamanan Enkripsi Pasca-Migrasi PostgreSQL</span>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Form Container (Spacious layout on desktop) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-5 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md my-auto">
            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
};
