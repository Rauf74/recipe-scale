import React, { useState } from "react";
import { useAuth } from "../auth-context";
import { apiClient } from "../../../lib/api-client";
import {
  Sparkle,
  X,
  Copy,
  Check,
  CheckCircle,
  ArrowRight,
  UserCheck,
  Key,
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
  const { refreshUser } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null);

  if (!isOpen) return null;

  async function handleGenerateDemo() {
    setIsLoading(true);
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
        // IMPORTANT: Set credentials in modal state FIRST so user can view/copy them.
        // DO NOT call refreshUser() here, otherwise PublicRoute will immediately unmount LoginPage!
        setCredentials(res.data.data.credentials);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Gagal membuat akun demo"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEnterDashboard() {
    setIsLoading(true);
    try {
      // NOW update auth session and navigate to dashboard
      await refreshUser();
      onClose();
      window.location.href = "/";
    } catch (err) {
      window.location.href = "/";
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleCloseModal() {
    if (!isLoading) {
      if (credentials) {
        // If credentials were generated, enter dashboard on close
        handleEnterDashboard();
      } else {
        onClose();
        setTimeout(() => {
          setCredentials(null);
          setError("");
        }, 300);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-surface-900/95 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-slate-100 max-h-[90dvh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseModal}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" weight="bold" />
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: INITIAL CONFIRMATION & GENERATE DEMO BUTTON */}
        {!credentials ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-surface-800 pb-4">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20 shrink-0">
                <Sparkle className="w-6 h-6 text-brand-400" weight="fill" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 font-mono">
                  Interactive Demo Mode
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 tracking-tight leading-snug">
                  Coba Demo RecipeScale Instant
                </h3>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Ingin menguji aplikasi tanpa perlu mendaftar? Sistem akan membuatkan <strong className="text-slate-100">akun demo acak</strong> beserta data sampel (Bahan Baku, Bumbu Dasar, Resep, & Production Batch) agar Anda bisa langsung mencoba fitur RecipeScale.
            </p>

            <div className="rounded-2xl border border-surface-800 bg-surface-950/80 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" weight="bold" />
                <span>Akun otomatis ter-autentikasi via HTTP-only Cookie</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Key className="w-4 h-4 text-brand-400 shrink-0" weight="bold" />
                <span>Kredensial acak unik di-generate otomatis di server</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateDemo}
                disabled={isLoading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-[0.5px] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                    <span>Menyiapkan Data Sampel Dapur...</span>
                  </>
                ) : (
                  <>
                    <Sparkle className="w-4 h-4" weight="fill" />
                    <span>Buat Akun Demo Instant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: GENERATED CREDENTIALS SUCCESS DISPLAY SCREEN */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-surface-800 pb-4">
              <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-400" weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-100 tracking-tight">
                  🎉 Akun Demo Berhasil Dibuat!
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Sesi login Anda telah aktif. Kredensial berikut dapat Anda simpan untuk login kembali nanti:
                </p>
              </div>
            </div>

            {/* Credentials Display Box */}
            <div className="p-4 rounded-2xl bg-surface-950/90 border border-surface-800 space-y-3">
              {/* Username / Email Field */}
              <div className="flex items-center justify-between gap-2 border-b border-surface-800/80 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Username / Email</span>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs font-bold text-brand-300 bg-brand-500/10 px-2 py-1 rounded-lg font-mono truncate max-w-[200px] border border-brand-500/20 nums">
                    {credentials.email}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.email, "Username")}
                    className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Salin Username"
                  >
                    {copiedField === "Username" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" weight="bold" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" weight="bold" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">Password</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-mono border border-emerald-500/20 nums">
                    {credentials.password}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.password, "Password")}
                    className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Salin Password"
                  >
                    {copiedField === "Password" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" weight="bold" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" weight="bold" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400">
              Klik tombol di bawah ini untuk langsung menuju ke Dashboard.
            </p>

            <button
              type="button"
              onClick={handleEnterDashboard}
              disabled={isLoading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-[0.5px] active:scale-[0.98] group disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                  <span>Membuka Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
