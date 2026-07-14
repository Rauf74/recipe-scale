import React, { useEffect, useState } from "react";
import { Loader2, Settings, Save, CheckCircle2, AlertCircle, Trash2, Plus, Scale } from "lucide-react";
import { apiClient } from "../lib/api-client";

interface WorkspaceSettings {
  id: string;
  name: string;
  defaultTaxPercent: number;
  defaultServicePercent: number;
  defaultTargetFoodCost: number;
  roundPriceTo: number;
}

interface CustomUnit {
  id: string;
  name: string;
  baseUnit: string;
  conversionFactor: number;
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Settings form states
  const [name, setName] = useState("");
  const [tax, setTax] = useState("10");
  const [service, setService] = useState("5");
  const [foodCost, setFoodCost] = useState("30");
  const [roundTo, setRoundTo] = useState("100");

  // Custom units states
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [cuName, setCuName] = useState("");
  const [cuBaseUnit, setCuBaseUnit] = useState("g");
  const [cuFactor, setCuFactor] = useState("1");
  const [cuError, setCuError] = useState("");
  const [cuSuccess, setCuSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch workspace settings
      const settingsRes = await apiClient.get<{ success: boolean; data: { workspace: WorkspaceSettings } }>("/api/workspace");
      if (settingsRes.data.success) {
        const ws = settingsRes.data.data.workspace;
        setName(ws.name);
        setTax(ws.defaultTaxPercent.toString());
        setService(ws.defaultServicePercent.toString());
        setFoodCost(ws.defaultTargetFoodCost.toString());
        setRoundTo(ws.roundPriceTo.toString());
      }

      // 2. Fetch custom units
      const unitsRes = await apiClient.get<{ success: boolean; data: { customUnits: CustomUnit[] } }>("/api/custom-units");
      if (unitsRes.data.success) {
        setCustomUnits(unitsRes.data.data.customUnits);
      }
    } catch (err: any) {
      setError("Gagal memuat data pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
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

  const handleAddCustomUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCuError("");
    setCuSuccess("");

    const nameTrimmed = cuName.trim().toLowerCase();
    const factorVal = parseFloat(cuFactor);

    if (!nameTrimmed) {
      setCuError("Nama satuan tidak boleh kosong.");
      return;
    }
    if (isNaN(factorVal) || factorVal <= 0) {
      setCuError("Faktor konversi harus berupa angka lebih besar dari 0.");
      return;
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: { customUnit: CustomUnit } }>("/api/custom-units", {
        name: nameTrimmed,
        baseUnit: cuBaseUnit,
        conversionFactor: factorVal,
      });

      if (res.data.success) {
        setCustomUnits((prev) => [...prev, res.data.data.customUnit]);
        setCuName("");
        setCuFactor("1");
        setCuSuccess(`Satuan "${nameTrimmed}" berhasil ditambahkan.`);
        setTimeout(() => setCuSuccess(""), 4000);
      }
    } catch (err: any) {
      setCuError(err.response?.data?.error || "Gagal menambahkan satuan kustom.");
    }
  };

  const handleDeleteCustomUnit = async (id: string, nameToDelete: string) => {
    setCuError("");
    setCuSuccess("");
    try {
      const res = await apiClient.delete<{ success: boolean }>(`/api/custom-units/${id}`);
      if (res.data.success) {
        setCustomUnits((prev) => prev.filter((item) => item.id !== id));
        setCuSuccess(`Satuan "${nameToDelete}" berhasil dihapus.`);
        setTimeout(() => setCuSuccess(""), 4000);
      }
    } catch (err: any) {
      setCuError(err.response?.data?.error || "Gagal menghapus satuan kustom.");
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Konfigurasi</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">Pengaturan Workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Atur asumsi dasar perhitungan HPP, markup profit, pembulatan harga, serta satuan pembelian kustom Anda.
        </p>
      </header>

      {/* Workspace Settings Card */}
      <div className="space-y-4">
        {success && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
            {success}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-6 space-y-6">
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
              Asumsi di atas akan otomatis mengisi formulir simulasi harga resep baru Anda untuk mempercepat kalkulasi HPP.
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

      {/* Custom Units Section */}
      <div className="space-y-4">
        {cuSuccess && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
            {cuSuccess}
          </div>
        )}

        {cuError && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            {cuError}
          </div>
        )}

        <div className="rounded-3xl border border-surface-700/60 bg-surface-900/40 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-surface-700/60 pb-3 text-slate-100">
            <Scale className="h-5 w-5 text-brand-400" />
            <h2 className="font-bold">Kelola Satuan Pembelian Kustom</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Daftarkan satuan beli kustom grosir (contoh: dus, pack, ikat) lalu tentukan konversinya ke Satuan Dasar (g, kg, ml, L, pcs) agar resep Anda dapat dikonversi secara otomatis.
          </p>

          {/* Add Unit Form */}
          <form onSubmit={handleAddCustomUnit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 rounded-2xl bg-slate-950/20 border border-slate-800">
            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Nama Satuan Kustom
              </label>
              <input
                type="text"
                required
                value={cuName}
                onChange={(e) => setCuName(e.target.value)}
                className="input-sm w-full"
                placeholder="Contoh: dus, ikat"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Setara Satuan Dasar
              </label>
              <select
                value={cuBaseUnit}
                onChange={(e) => setCuBaseUnit(e.target.value)}
                className="select-sm w-full"
              >
                <option value="g">gram (g)</option>
                <option value="kg">kilogram (kg)</option>
                <option value="ml">mililiter (ml)</option>
                <option value="L">liter (L)</option>
                <option value="pcs">buah (pcs)</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Faktor Konversi (Pengali)
              </label>
              <input
                type="number"
                min="0.0001"
                step="any"
                required
                value={cuFactor}
                onChange={(e) => setCuFactor(e.target.value)}
                className="input-sm w-full font-mono"
                placeholder="Contoh: 10"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 px-4 py-2 text-xs font-bold cursor-pointer h-10 w-full transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </form>

          {/* List custom units */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Satuan Terdaftar</h4>
            {customUnits.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Belum ada satuan kustom terdaftar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customUnits.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-200 capitalize text-sm">{item.name}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Konversi: <span className="font-semibold font-mono text-brand-400">1 {item.name} = {item.conversionFactor} {item.baseUnit}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomUnit(item.id, item.name)}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                      title="Hapus Satuan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
