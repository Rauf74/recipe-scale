import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import {
  ChefHat,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  User,
  Store,
  Menu,
  X,
  ChevronRight,
  Plus,
} from "lucide-react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Bahan Baku", path: "/ingredients", icon: ShoppingBag },
    { name: "Resep & Bumbu", path: "/recipes", icon: ChefHat },
  ];

  const current = menuItems.find((m) => m.path === location.pathname) ?? menuItems[0];
  const firstName = user?.name?.split(" ")[0] ?? "Koki";

  // Contextual primary action per route (toolbar live-state)
  const primary = {
    "/": { label: "Racik Resep", to: "/recipes" },
    "/ingredients": { label: "Tambah Bahan", to: "/ingredients" },
    "/recipes": { label: "Racik Resep Baru", to: "/recipes" },
  }[current.path] ?? { label: "Racik Resep", to: "/recipes" };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-surface-950 text-slate-200 flex font-sans overflow-hidden">
      {/* Ambient depth */}
      <div className="app-glow" />
      <div className="app-grain" />

      {/* Sidebar Overlay (Mobile) */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-30 w-64 bg-surface-900 border-r border-surface-700/60 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarOpen ? "md:w-64" : "md:w-20"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-700/50">
          <div className="flex items-center gap-2.5 text-brand-400 overflow-hidden">
            <div className="p-1.5 bg-brand-500/10 rounded-lg border border-brand-500/20 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg tracking-tight text-slate-100 truncate">
                RecipeScale
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer hidden md:block"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Workspace Info */}
        {sidebarOpen && user && (
          <div className="p-4 mx-4 my-3 rounded-xl bg-surface-950/40 border border-surface-700/60 flex items-center gap-2.5">
            <Store className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">
                Workspace
              </p>
              <p className="text-sm font-bold text-slate-200 truncate mt-1 leading-none">
                {user.email.split("@")[0].toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-800/60 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
                {!sidebarOpen && (
                  <span className="absolute left-16 bg-surface-800 border border-surface-700 text-slate-200 text-xs px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile & Logout) */}
        <div className="p-4 border-t border-surface-700/50 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            {sidebarOpen && user && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 truncate mt-1 leading-none">{user.role}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-800 hover:bg-red-500/10 hover:text-red-400 text-slate-300 text-xs font-semibold border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Toolbar — live state, not a static title */}
        <header className="h-16 border-b border-surface-700/50 bg-surface-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 tracking-tight truncate">
                {greeting()}, <span className="text-brand-400">{firstName}</span>
              </h2>
              <p className="text-[11px] text-slate-500 truncate">{current.name}</p>
            </div>
          </div>

          <Link
            to={primary.to}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-xl transition-all hover:shadow-brand active:scale-[0.98] cursor-pointer text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{primary.label}</span>
          </Link>
        </header>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
