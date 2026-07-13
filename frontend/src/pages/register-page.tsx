import React from "react";
import { RegisterForm } from "../features/auth/components/register-form";
import { ChefHat, LayoutGrid, Scale, TrendingUp } from "lucide-react";
import heroImg from "../assets/hero.png";

export const RegisterPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex font-sans bg-surface-950 text-slate-200 overflow-hidden">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Brand panel (desktop only) */}
      <div className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="RecipeScale kitchen"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/80 via-surface-950/85 to-surface-950/95" />
        <div className="relative z-10 px-12 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/15 text-brand-300 rounded-xl border border-brand-500/25">
              <ChefHat className="w-7 h-7" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-100">RecipeScale</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Mulai kelola <span className="text-brand-400">HPP bisnis</span> Anda
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Satu workspace untuk bahan baku, resep, dan simulasi harga jual
              yang menguntungkan.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              { icon: LayoutGrid, t: "Racik resep & bumbu dasar" },
              { icon: Scale, t: "Simulasi skala porsi instan" },
              { icon: TrendingUp, t: "Pantau fluktuasi HPP bahan" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="p-1.5 bg-brand-500/10 text-brand-400 rounded-lg border border-brand-500/20">
                  <Icon className="w-4 h-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-100">RecipeScale</span>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};
