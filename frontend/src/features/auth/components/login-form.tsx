import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";
import { Mail, Lock, Loader2, ChefHat, Sparkles } from "lucide-react";
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
      <div className="w-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-surface-900/80 border border-amber-500/25 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.06)]">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 via-brand-500/20 to-emerald-500/20 text-amber-400 rounded-2xl mb-3 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <ChefHat className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight text-center">
            Selamat Datang Kembali
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 text-center leading-relaxed max-w-sm">
            Masuk ke RecipeScale untuk mengelola resep dan memantau HPP dapur Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
              Email Bisnis
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-950/70 border border-surface-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-950/70 border border-surface-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 hover:from-amber-400 hover:to-brand-400 text-surface-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghubungkan...
              </>
            ) : (
              "Masuk ke Workspace"
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
            <span className="bg-surface-900/90 px-2 text-slate-500">
              atau coba tanpa daftar
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDemoModalOpen(true)}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          ⚡ Akses Cepat Dapur Demo
        </button>

        <div className="mt-6 text-center text-slate-400 text-xs">
          Belum punya akun workspace?{" "}
          <Link to="/register" className="text-amber-400 hover:underline font-semibold transition-all">
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
