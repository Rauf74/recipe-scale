import React from "react";
import { RegisterForm } from "../features/auth/components/register-form";
import { ChefHat } from "lucide-react";

export const RegisterPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans bg-surface-950 text-slate-200 overflow-hidden px-4">
      <div className="app-glow" />
      <div className="app-grain" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Recipe card — centered, no sidebar/split */}
        <div className="rounded-2xl border border-surface-700/60 bg-surface-900/50 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="relative px-6 pt-6 pb-5 border-b border-dashed border-surface-700/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">
                  RecipeScale
                </p>
                <h1 className="text-lg font-extrabold text-slate-100 tracking-tight leading-tight">
                  Workspace Baru
                </h1>
              </div>
            </div>
            <span className="absolute top-3 right-4 text-[10px] font-mono text-slate-600">
              No. 002
            </span>
          </div>

          <div className="px-6 py-6">
            <RegisterForm />
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Satu ruang kerja untuk bahan, resep & simulasi harga
        </p>
      </div>
    </div>
  );
};
