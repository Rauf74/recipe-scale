import React, { useEffect, useState } from "react";
import { Loader2, Settings, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "../lib/api-client";

interface WorkspaceSettings {
  id: string;
  name: string;
  defaultTaxPercent: number;
  defaultServicePercent: number;
  defaultTargetFoodCost: number;
  roundPriceTo: number;
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [tax, setTax] = useState("10");
  const [service, setService] = useState("5");
  const [foodCost, setFoodCost] = useState("30");
  const [roundTo, setRoundTo] = useState("100");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: { workspace: WorkspaceSettings } }>("/api/workspace");
      if (res.data.success) {
        const ws = res.data.data.workspace;
        setName(ws.name);
        setTax(ws.defaultTaxPercent.toString());
        setService(ws.defaultServicePercent.toString());
        setFoodCost(ws.defaultTargetFoodCost.toString());
        setRoundTo(ws.roundPriceTo.toString());
      }
    } catch (err: any) {
      setError("Gagal memuat pengaturan workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const taxVal = parseFloat(tax);
    const serviceVal = parseFloat(service);
    const foodCostVal = parseFloat(foodCost);
    const roundToVal = parseFloat(roundTo);

    if (!name.trim()) {
      setError("Nama workspace tidak boleh kosong.");
      setSaving(false);
      return;
    }
    if (isNaN(taxVal) || taxVal < 0 || isNaN(serviceVal) || serviceVal < 0) {
      setError("Pajak dan Service Charge harus berupa angka positif.");
      setSaving(false);
      return;
    }
    if (isNaN(foodCostVal) || foodCostVal <= 0 || foodCostVal >= 100) {
      setError("Target Food Cost harus di antara 1% dan 99%.");
      setSaving(false);
      return;
    }

    try {
      const res = await apiClient.put<{ success: boolean; data: { workspace: WorkspaceSettings } }>("/api/workspace", {
        name: name.trim(),
        defaultTaxPercent: taxVal,
        defaultServicePercent: serviceVal,
        defaultTargetFoodCost: foodCostVal,
        roundPriceTo: roundToVal,
      });

      if (res.data.success) {
        setSuccess("Pengaturan workspace berhasil diperbarui.");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Konfigurasi</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Pengaturan Workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Atur asumsi dasar perhitungan HPP, markup profit, dan pembulatan harga untuk seluruh bisnis Anda.
        </p>
      </header>

      {/* Alert Success */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
          <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
          {success}
        </div>
      )}

      {/* Alert Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-surface-700/60 pb-3 text-slate-100">
          <Settings className="h-5 w-5 text-brand-400" />
          <h2 className="font-bold">Asumsi Operasional & Finansial</h2>
        </div>

        <div className="space-y-4">
          {/* Workspace Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Nama Outlet / Workspace
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Contoh: Dapur Pusat Mama"
            />
          </div>

          {/* Cost Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Pajak Default (%)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="input"
                placeholder="Contoh: 10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Service Charge (%)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="input"
                placeholder="Contoh: 5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Target Food Cost (%)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                required
                value={foodCost}
                onChange={(e) => setFoodCost(e.target.value)}
                className="input"
                placeholder="Contoh: 30"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Asumsi di atas akan otomatis mengisi formulir simulasi harga resep baru Anda untuk mempercepat kalkulasi.
          </p>

          {/* Pricing Rounding Rules */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Aturan Pembulatan Harga Jual
            </label>
            <select
              value={roundTo}
              onChange={(e) => setRoundTo(e.target.value)}
              className="select"
            >
              <option value="1">Tanpa Pembulatan (Desimal asli)</option>
              <option value="100">Bulatkan ke Rp 100 terdekat (Contoh: Rp 12.345 jadi Rp 12.300)</option>
              <option value="500">Bulatkan ke Rp 500 terdekat (Contoh: Rp 12.345 jadi Rp 12.500)</option>
              <option value="1000">Bulatkan ke Rp 1.000 terdekat (Contoh: Rp 12.345 jadi Rp 12.000)</option>
            </select>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Rekomendasi harga jual pada simulasi resep menu akan otomatis dibulatkan sesuai pilihan ini agar mempermudah kasir.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-surface-700/60 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-surface-950 transition-all hover:bg-brand-400 hover:shadow-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Setelan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
