import React from "react";
import { LoginForm } from "../features/auth/components/login-form";

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Decorative blurred background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 w-full px-4 flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
};
