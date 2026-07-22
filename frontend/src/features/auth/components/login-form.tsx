import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";
import {
  CookingPot,
  EnvelopeSimple,
  LockKey,
  CircleNotch,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import { QuickDemoModal } from "./quick-demo-modal";

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-surface-900/70 border border-emerald-500/25 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl mb-4 border border-brand-500/20 shadow-lg shadow-brand-500/10">
            <CookingPot className="w-9 h-9" weight="bold" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight text-center">
            Selamat Datang Kembali
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 text-center leading-relaxed max-w-sm">
            Masuk ke RecipeScale untuk mengelola resep dan memantau HPP dapur Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Bisnis
            </label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" weight="bold" />
              <input
                type="email"
                required
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-950/60 border border-surface-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-mono nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <LockKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" weight="bold" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-950/60 border border-surface-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm font-mono nums"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs whitespace-nowrap"
          >
            {loading ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                Menghubungkan...
              </>
            ) : (
              <>
                Masuk ke Workspace
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-700/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
            <span className="bg-surface-900 px-2 text-slate-500">
              atau coba tanpa daftar
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDemoModalOpen(true)}
          className="w-full py-2.5 bg-gradient-to-r from-brand-500/15 via-emerald-500/15 to-brand-500/15 hover:from-brand-500/25 hover:to-emerald-500/25 border border-brand-500/40 text-brand-300 font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-brand-500/10 hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          <Sparkle className="w-4 h-4 text-brand-400" weight="fill" />
          ⚡ Akses Cepat Dapur Demo
        </button>

        <div className="mt-6 text-center text-slate-400 text-xs">
          Belum punya akun workspace?{" "}
          <Link to="/register" className="text-brand-400 hover:underline font-semibold transition-all">
            Daftar Workspace Baru
          </Link>
        </div>
      </div>

      <QuickDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
};
