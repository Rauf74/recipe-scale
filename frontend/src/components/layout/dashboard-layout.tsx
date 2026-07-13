import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import {
  ChefHat,
  LayoutDashboard,
  BookOpen,
  Package,
  Plus,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dasbor", icon: LayoutDashboard, end: true },
  { to: "/recipes", label: "Resep", icon: BookOpen, end: false },
  { to: "/ingredients", label: "Bahan", icon: Package, end: false },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-200 font-sans">
      <div className="app-glow" />
      <div className="app-grain" />

      {/* ============ DESKTOP: top horizontal nav ============ */}
      <header className="relative z-10 sticky top-0 z-30 border-b border-surface-700/60 bg-surface-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-100">
              Recipe<span className="text-brand-400">Scale</span>
            </span>
          </Link>

          {/* Center pill nav */}
          <nav className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-surface-900/60 border border-surface-700/60">
            {NAV.map((item) => {
              const active = isActive(item.to, item.end);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? "bg-brand-500 text-surface-950 shadow-brand"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: action + user */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/recipes")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-warm-500 hover:bg-warm-400 text-surface-950 font-bold rounded-full transition-all hover:shadow-warm active:scale-[0.98] cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              Racik
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-surface-700/60 hover:bg-surface-800/60 transition-all cursor-pointer"
            >
              <span className="w-8 h-8 grid place-items-center rounded-full bg-brand-500/15 text-brand-400 font-extrabold text-sm">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:block text-sm text-slate-300 max-w-[120px] truncate">
                {user?.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* ============ MOBILE: bottom tab bar ============ */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-surface-700/60 bg-surface-950/90 backdrop-blur-md">
        <div className="grid grid-cols-3">
          {NAV.map((item) => {
            const active = isActive(item.to, item.end);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors ${
                  active ? "text-brand-400" : "text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ============ USER SHEET (not dropdown) ============ */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-950/70 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute right-4 top-16 w-64 bg-surface-900 border border-surface-700 rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-surface-700/60">
              <span className="w-10 h-10 grid place-items-center rounded-full bg-brand-500/15 text-brand-400 font-extrabold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all cursor-pointer text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
