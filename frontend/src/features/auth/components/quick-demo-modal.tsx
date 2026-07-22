import React, { useState } from "react";
import { useAuth } from "../auth-context";
import { useNavigate } from "react-router-dom";
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
} from "@phosphor-icons/react";

interface QuickDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

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

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleDirectLogin = async (email: string) => {
    setLoadingEmail(email);
    try {
      await login(email, "password123");
      onClose();
      navigate("/");
    } catch (err) {
      console.error("Quick login failed:", err);
    } finally {
      setLoadingEmail(null);
    }
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
                Salin kredensial atau klik langsung untuk masuk tanpa pendaftaran
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

        {/* Demo Accounts List */}
        <div className="space-y-4">
          {demoAccounts.map((acc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/40 transition-all space-y-3"
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
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{acc.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Buildings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{acc.workspace}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {acc.desc}
              </p>

              {/* Email & Password Box */}
              <div className="p-2.5 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <EnvelopeSimple className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-200 truncate">{acc.email}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(acc.email)}
                    className="px-2 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-brand-400 text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedEmail === acc.email ? (
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

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-t border-surface-800/60 pt-1.5">
                  <LockKey className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Password: password123</span>
                </div>
              </div>

              {/* Direct Login Button */}
              <button
                onClick={() => handleDirectLogin(acc.email)}
                disabled={loadingEmail === acc.email}
                className="w-full py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-brand hover:-translate-y-[0.5px] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loadingEmail === acc.email ? (
                  "Masuk Otomatis..."
                ) : (
                  <>
                    <span>Langsung Masuk Akun Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
