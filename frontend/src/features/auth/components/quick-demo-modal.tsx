import React, { useState } from "react";
import { useAuth } from "../auth-context";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";
import {
  Sparkle,
  X,
  Copy,
  Check,
  LockKey,
  EnvelopeSimple,
  User,
  Buildings,
  CookingPot,
  ArrowRight,
  ShieldCheck,
  CircleNotch,
} from "@phosphor-icons/react";

interface QuickDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoCredentials {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<DemoCredentials | null>(null);
  const [loadingPresetEmail, setLoadingPresetEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoAccounts = [
    {
      role: "Owner / Head Chef",
      name: "Chef Rendy Utama",
      workspace: "Padang Sederhana Group",
      email: "owner@padangsederhana.com",
      desc: "Akses penuh owner: Kelola resep, pantau margin guard, dan atur timbangan dapur.",
      badge: "Full Admin",
    },
    {
      role: "Kitchen Staff / Cook",
      name: "Budi (Kru Dapur)",
      workspace: "Padang Sederhana Group",
      email: "staff@padangsederhana.com",
      desc: "Akses operasional: Lihat resep standar, timbang porsi saji katering, dan eksekusi batch.",
      badge: "Operational",
    },
  ];

  // 1. DYNAMIC DEMO WORKSPACE GENERATION VIA BACKEND API
  const handleGenerateFreshDemo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post<{
        status: string;
        message: string;
        data: {
          credentials: DemoCredentials;
        };
      }>("/api/auth/quick-demo");

      if (res.data.status === "success" || res.data.data?.credentials) {
        setCreds(res.data.data.credentials);
        await refreshUser();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Gagal membuat akun demo otomatis"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDirectLoginPreset = async (email: string) => {
    setLoadingPresetEmail(email);
    try {
      await login(email, "password123");
      onClose();
      navigate("/");
    } catch (err: any) {
      console.error("Quick login failed:", err);
      setError(err.message || "Gagal masuk ke akun preset demo");
    } finally {
      setLoadingPresetEmail(null);
    }
  };

  const handleEnterDashboard = () => {
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-surface-900/95 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-slate-100 max-h-[90dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-surface-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <Sparkle className="w-5 h-5" weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Akses Dapur Demo Instant
              </h3>
              <p className="text-slate-400 text-xs">
                Buat workspace demo baru atau pilih kredensial akun preset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* LOADING STATE FOR GENERATION */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <CircleNotch className="w-10 h-10 text-brand-400 animate-spin" weight="bold" />
              <CookingPot className="w-5 h-5 text-brand-400 absolute inset-0 m-auto" weight="bold" />
            </div>
            <p className="text-sm font-bold text-slate-100">
              Menyiapkan Dapur Demo Instant Baru...
            </p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Sistem sedang meracik 8 bahan baku mentah, 3 sub-resep bumbu dasar, dan 5 resep menu utama untuk outlet demo Anda.
            </p>
          </div>
        )}

        {/* SCREEN 1: FRESH CREATED CREDENTIALS (IF GENERATED) */}
        {!loading && creds && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
              <Sparkle className="w-4 h-4 shrink-0 text-emerald-400" weight="fill" />
              <span>🎉 Akun Dapur Demo Baru Anda Berhasil Dibuat!</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-950/90 border border-surface-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-surface-800 pb-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Nama Outlet Demo</span>
                  <p className="font-bold text-slate-100 text-sm mt-0.5">{creds.name}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-bold">
                  {creds.role}
                </span>
              </div>

              {/* Email Credentials Box */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Email Demo (Silakan Salin)</span>
                <div className="flex items-center justify-between mt-1 p-2.5 rounded-xl bg-surface-900 border border-surface-700 font-mono text-brand-300 text-xs">
                  <span className="truncate pr-2">{creds.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(creds.email, "email")}
                    className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-brand-400 text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedField === "email" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" weight="bold" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" weight="bold" />
                        <span>Salin Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Password Credentials Box */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Kata Sandi Demo (Silakan Salin)</span>
                <div className="flex items-center justify-between mt-1 p-2.5 rounded-xl bg-surface-900 border border-surface-700 font-mono text-amber-400 text-xs">
                  <span>{creds.password}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(creds.password, "password")}
                    className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-amber-400 text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedField === "password" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" weight="bold" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" weight="bold" />
                        <span>Salin Sandi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEnterDashboard}
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-[0.5px] active:scale-[0.98]"
            >
              <span>Masuk ke Dapur Utama</span>
              <ArrowRight className="w-4 h-4" weight="bold" />
            </button>
          </div>
        )}

        {/* SCREEN 2: INITIAL MENU CHOICE (GENERATION vs PRESETS) */}
        {!loading && !creds && (
          <div className="space-y-5">
            {/* Action Card 1: Generate Fresh Demo Account */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/15 via-emerald-500/10 to-surface-950 border border-brand-500/40 space-y-3">
              <div className="flex items-center gap-2.5 text-brand-400 font-bold text-xs uppercase font-mono">
                <ShieldCheck className="w-4 h-4 text-brand-400" weight="bold" />
                <span>Opsi 1: Buat Dapur Demo Baru (Rekomendasi)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem akan secara instan membuat <span className="text-brand-300 font-semibold">Workspace Dapur Baru</span> lengkap dengan data resep, bahan baku, dan kredensial unik yang bisa Anda salin.
              </p>
              <button
                type="button"
                onClick={handleGenerateFreshDemo}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-[0.5px] active:scale-[0.98]"
              >
                <CookingPot className="w-4 h-4" weight="bold" />
                ⚡ Buat Dapur Demo Instant Baru
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                <span className="bg-surface-900 px-2 text-slate-500">
                  atau gunakan akun preset terdaftar
                </span>
              </div>
            </div>

            {/* Action Card 2: Preset Demo Accounts */}
            <div className="space-y-3">
              {demoAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/30 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <CookingPot className="w-3.5 h-3.5" weight="bold" />
                      {acc.role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-800 text-slate-300 text-[10px] font-semibold border border-surface-700">
                      {acc.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" weight="bold" />
                      <span className="truncate">{acc.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Buildings className="w-3.5 h-3.5 text-slate-500 shrink-0" weight="bold" />
                      <span className="truncate">{acc.workspace}</span>
                    </div>
                  </div>

                  {/* Email & Password Box */}
                  <div className="p-2 rounded-xl bg-surface-900 border border-surface-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <EnvelopeSimple className="w-3.5 h-3.5 text-slate-500 shrink-0" weight="bold" />
                        <span className="text-slate-200 truncate">{acc.email}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(acc.email, `preset-email-${idx}`)}
                        className="px-2 py-0.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-brand-400 text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                      >
                        {copiedField === `preset-email-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" weight="bold" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" weight="bold" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-t border-surface-800/60 pt-1">
                      <LockKey className="w-3.5 h-3.5 text-slate-500 shrink-0" weight="bold" />
                      <span>Password: password123</span>
                    </div>
                  </div>

                  {/* Direct Login Button */}
                  <button
                    onClick={() => handleDirectLoginPreset(acc.email)}
                    disabled={loadingPresetEmail === acc.email}
                    className="w-full py-2 bg-surface-800 hover:bg-surface-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 hover:-translate-y-[0.5px] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {loadingPresetEmail === acc.email ? (
                      "Masuk Otomatis..."
                    ) : (
                      <>
                        <span>Masuk sebagai {acc.role.split("/")[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
