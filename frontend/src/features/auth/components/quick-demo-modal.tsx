import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Sparkles, ArrowRight, ShieldCheck, Copy, Check, ClipboardCopy } from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAuth } from "../auth-context";

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

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<DemoCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateDemo = async () => {
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

      if (res.data.status === "success") {
        setCreds(res.data.data.credentials);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Gagal membuat akun demo");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!creds) return;
    const textToCopy = `Outlet: ${creds.name}\nRole: ${creds.role}\nEmail: ${creds.email}\nPassword: ${creds.password}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEnterDashboard = async () => {
    await refreshUser();
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-surface-900/95 border border-surface-700/80 shadow-2xl backdrop-blur-md text-slate-100">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-dashed border-surface-700/60 pb-4">
          <div className="p-2.5 bg-gradient-to-br from-brand-500/20 to-emerald-500/20 text-brand-400 rounded-xl border border-brand-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
              Interactive Demo Mode
            </span>
            <h3 className="text-lg font-extrabold text-slate-100 tracking-tight leading-snug">
              ⚡ Akses Cepat Dapur Demo
            </h3>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {!creds && !loading && (
          <div className="space-y-4">
            <p className="text-slate-300 text-xs leading-relaxed">
              Ingin mencoba fitur lengkap RecipeScale tanpa perlu mengisi form pendaftaran?
            </p>
            <div className="p-3.5 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Dapur Resto Sampel Otomatis
              </div>
              <p className="text-[11px] leading-normal text-slate-400">
                Sistem akan membuatkan akun <span className="text-slate-200 font-semibold">Pemilik Resto (OWNER)</span> acak dan menginisialisasi 8 bahan baku, 3 bumbu dasar, serta 5 resep menu utama untuk Anda eksplorasi.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-surface-800 hover:bg-surface-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGenerateDemo}
                className="flex-[2] py-2.5 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-surface-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <ChefHat className="w-4 h-4" />
                Buat Dapur Demo Sekarang
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-400 animate-spin" />
              <ChefHat className="w-6 h-6 text-brand-400 absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Menyiapkan Dapur Demo...
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Menyusun bahan baku, meracik bumbu dasar, dan menyiapkan log HPP resep untuk Anda.
            </p>
          </div>
        )}

        {creds && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>🎉 Akun Dapur Demo Anda berhasil dibuat!</span>
            </div>

            <p className="text-slate-400 text-[11px]">
              Silakan salin atau simpan kredensial ini jika ingin login kembali nanti:
            </p>

            <div className="p-4 rounded-xl bg-surface-950/80 border border-surface-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Nama Outlet Demo</span>
                  <p className="font-bold text-slate-100 text-sm mt-0.5">{creds.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase">
                  {creds.role}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Email Demo</span>
                <div className="flex items-center justify-between gap-2 mt-1 p-2 rounded-lg bg-surface-900 border border-surface-700 font-mono text-xs overflow-hidden">
                  <span className="select-all truncate flex-1 min-w-0 text-brand-300">{creds.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(creds.email, "email")}
                    className="shrink-0 p-1.5 hover:text-white hover:bg-surface-800 rounded transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === "email" ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Tersalin</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Salin</span>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Password Demo</span>
                <div className="flex items-center justify-between gap-2 mt-1 p-2 rounded-lg bg-surface-900 border border-surface-700 font-mono text-xs overflow-hidden">
                  <span className="select-all truncate flex-1 min-w-0 text-red-400">{creds.password}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(creds.password, "password")}
                    className="shrink-0 p-1.5 hover:text-white hover:bg-surface-800 rounded transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === "password" ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Tersalin</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Salin</span>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAll}
                className="w-full py-2 bg-surface-900 hover:bg-surface-800 border border-surface-700 text-slate-300 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedField === "all" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Semua Kredensial Tersalin!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-3.5 h-3.5 text-brand-400" />
                    <span>Salin Semua Kredensial</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleEnterDashboard}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-surface-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              Masuk ke Dapur Utama
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
