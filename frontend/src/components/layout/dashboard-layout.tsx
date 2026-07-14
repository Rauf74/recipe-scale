import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import {
  ChefHat,
  LayoutDashboard,
  BookOpen,
  Package,
  Warehouse,
  Layers,
  ClipboardList,
  TrendingUp,
  Plus,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dasbor", icon: LayoutDashboard, end: true },
  { to: "/ingredients", label: "Bahan", icon: Package, end: false },
  { to: "/stock", label: "Stok", icon: Warehouse, end: false },
  { to: "/preps", label: "Bumbu Dasar", icon: Layers, end: false },
  { to: "/recipes", label: "Resep", icon: BookOpen, end: false },
  { to: "/production", label: "Produksi", icon: ClipboardList, end: false },
  { to: "/analysis", label: "Analisis", icon: TrendingUp, end: false },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Mobile Bottom Nav visibility splits:
  // Show Dasbor, Bahan, Stok, Resep directly. Group the rest into "Lainnya"
  const MOBILE_VISIBLE_KEYS = ["/", "/ingredients", "/stock", "/recipes"];
  const mobileVisibleNav = NAV.filter((item) => MOBILE_VISIBLE_KEYS.includes(item.to));
  const mobileOverflowNav = NAV.filter((item) => !MOBILE_VISIBLE_KEYS.includes(item.to));

  return (
    <div className="min-h-screen bg-surface-950 text-slate-200 font-sans print:bg-white print:text-slate-900">
      <div className="app-glow print:hidden" />
      <div className="app-grain print:hidden" />

      {/* ============ DESKTOP: top horizontal nav ============ */}
      <header className="relative z-10 sticky top-0 z-30 border-b border-surface-700/60 bg-surface-950/80 backdrop-blur-md print:hidden">
        <div className="mx-auto max-w-[1400px] px-4 h-16 flex items-center justify-between gap-4">
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
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-surface-900/60 border border-surface-700/60">
            {NAV.map((item) => {
              const active = isActive(item.to, item.end);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all ${
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
              Resep
            </button>
            
            {/* Relative wrapper for dropdown positioning */}
            <div className="relative">
              <button
                onClick={() => setSheetOpen(!sheetOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-surface-700/60 hover:bg-surface-800/60 transition-all cursor-pointer"
              >
                <span className="w-8 h-8 grid place-items-center rounded-full bg-brand-500/15 text-brand-400 font-extrabold text-sm">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span className="hidden md:block text-sm text-slate-300 max-w-[120px] truncate">
                  {user?.name}
                </span>
              </button>

              {/* USER POPUP DROPDOWN (aligned correctly below profile button) */}
              {sheetOpen && (
                <>
                  {/* Backdrop for click outside */}
                  <div
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setSheetOpen(false)}
                  />
                  {/* Dropdown Menu */}
                  <div
                    className="absolute right-0 mt-2 w-64 bg-surface-900 border border-surface-700 rounded-2xl p-4 shadow-2xl space-y-3 z-40"
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

                    <div className="space-y-1">
                      <Link
                        to="/settings"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-surface-800 transition-all text-xs font-semibold"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Pengaturan Workspace
                      </Link>

                      <button
                        onClick={() => { handleLogout(); setSheetOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all cursor-pointer text-xs font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="relative z-10 mx-auto max-w-[1400px] px-4 py-6 pb-24 lg:pb-6 print:p-0 print:m-0 print:max-w-full">
        <Outlet />
      </main>

      {/* ============ MOBILE: bottom tab bar ============ */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-surface-700/60 bg-surface-950/90 backdrop-blur-md print:hidden">
        <div className="flex px-1 justify-around items-center">
          {mobileVisibleNav.map((item) => {
            const active = isActive(item.to, item.end);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                  active ? "text-brand-400" : "text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          {/* 5th Slot: Overflow Lainnya */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors cursor-pointer ${
              mobileMenuOpen ? "text-brand-400" : "text-slate-500"
            }`}
          >
            <Menu className="w-5 h-5" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* ============ MOBILE: slide-up menu overlay ============ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity"
          />
          {/* Bottom Drawer */}
          <div className="absolute bottom-0 inset-x-0 bg-surface-900 border-t border-surface-700/60 rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl transform transition-transform">
            <div className="flex justify-between items-center pb-2 border-b border-surface-800">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Menu Lainnya</span>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="p-1 rounded-lg hover:bg-surface-800 text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mobileOverflowNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center ${
                      active
                        ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                        : "bg-surface-950/40 border-surface-800 hover:bg-surface-800/40 text-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
