import React from "react";
import { RegisterForm } from "../features/auth/components/register-form";
import { GastronomyWorkbenchHero } from "../features/auth/components/gastronomy-workbench-hero";

export const RegisterPage: React.FC = () => {
  return (
    <div className="relative min-h-[100dvh] lg:h-screen w-full font-sans bg-surface-950 text-slate-200 overflow-x-hidden lg:overflow-hidden flex items-center justify-center">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Grid container: 1-col on mobile (min-h-100dvh), 12-col split-screen on desktop (Exact 100vh height on desktop) */}
      <div className="relative z-10 w-full min-h-[100dvh] lg:h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT PANEL: Executive Gastronomy Workbench Hero */}
        <GastronomyWorkbenchHero />

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
