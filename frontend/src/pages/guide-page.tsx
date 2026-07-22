import React from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Info,
  BookOpen,
  Package,
  Layers,
  TrendingUp,
  Printer,
  Sparkles,
  ChefHat,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

export const GuidePage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 text-slate-200 font-sans print:bg-white print:text-slate-900">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-surface-900/90 border border-surface-700/80 p-6 md:p-8 backdrop-blur-md shadow-2xl overflow-hidden print:border-slate-300 print:bg-slate-50 print:shadow-none">
        <div className="app-glow print:hidden" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider print:bg-slate-200 print:text-slate-700 print:border-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
              Pusat Panduan & Informasi
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight print:text-slate-900">
              Panduan Penggunaan Recipe<span className="text-brand-400">Scale</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed print:text-slate-600">
              Pelajari cara mengelola HPP, meracik bumbu dasar bertingkat, mensimulasikan timbangan porsi saji katering, dan memantau alarm margin profit dapur bisnis F&B Anda.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 shrink-0 print:hidden">
            <ChefHat className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Section 1: Overview / Ikhtisar */}
      <div className="rounded-2xl bg-surface-900/50 border border-surface-700/60 p-6 backdrop-blur-md space-y-4 print:border-slate-300 print:bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 print:bg-blue-50 print:text-blue-600">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 print:text-slate-900">
            1. Solusi Operasional F&B yang Diselesaikan
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
          Kalkulasi modal resep secara manual sering kali menimbulkan kerugian akibat penyusutan bahan mentah (trim loss) dan fluktuasi harga pasar yang tidak terdeteksi. RecipeScale memecahkan 3 masalah utama operasional dapur secara otomatis:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2 print:border-slate-200 print:bg-slate-50">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
              1. HPP Akurat
            </span>
            <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Kalkulasi Susut (Yield)</h3>
            <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
              Menghitung modal bersih per gram/ml secara presisi berdasarkan harga beli pasar dan persentase penyusutan bahan baku mentah.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2 print:border-slate-200 print:bg-slate-50">
            <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase border border-brand-500/20">
              2. Timbangan Dapur
            </span>
            <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Kitchen Scale Sheet</h3>
            <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
              Menghasilkan takaran timbangan bumbu secara instan saat pesanan katering dinaikkan (contoh: dari 1 porsi ke 150 porsi).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2 print:border-slate-200 print:bg-slate-50">
            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase border border-red-500/20">
              3. Alarm Profit
            </span>
            <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Margin Guard</h3>
            <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
              Mendeteksi secara *real-time* menu mana saja yang Food Cost aktualnya melampaui batas aman akibat kenaikan harga bahan baku.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Glosarium Istilah F&B */}
      <div className="rounded-2xl bg-surface-900/50 border border-surface-700/60 p-6 backdrop-blur-md space-y-4 print:border-slate-300 print:bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:bg-amber-50 print:text-amber-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 print:text-slate-900">
              2. Glosarium & Kamus Istilah F&B
            </h2>
            <p className="text-slate-400 text-xs print:text-slate-600">
              Pemetaan istilah teknis pemrograman ke dalam istilah bisnis kuliner awam.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-800 print:border-slate-300">
          <table className="w-full text-left text-xs text-slate-300 print:text-slate-800">
            <thead className="bg-surface-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-surface-800 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
              <tr>
                <th className="p-3.5">Istilah F&B</th>
                <th className="p-3.5">Padanan Teknis</th>
                <th className="p-3.5">Penjelasan & Cara Penggunaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60 print:divide-slate-200">
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-brand-400 print:text-brand-700">HPP (Harga Pokok Penjualan)</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Total Unit Cost</td>
                <td className="p-3.5">Modal bersih per porsi yang mencakup modal bahan baku + kemasan + overhead dapur.</td>
              </tr>
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-amber-400 print:text-amber-700">Usable Yield (%)</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Trim Loss Factor</td>
                <td className="p-3.5">Persentase bagian bahan mentah yang benar-benar terpakai setelah dibersihkan/dipotong (contoh: paha sapi 95%).</td>
              </tr>
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-purple-400 print:text-purple-700">Bumbu Dasar / Sub-Resep</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Base Recipe (Prep)</td>
                <td className="p-3.5">Formula setengah jadi (saus, kaldu, bumbu halus) yang diolah dalam batch besar lalu digunakan oleh resep menu utama.</td>
              </tr>
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-emerald-400 print:text-emerald-700">Target Food Cost (%)</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Target Margin Ratio</td>
                <td className="p-3.5">Batas persentase maksimal modal bahan dibanding harga jual (contoh: 30% dari harga jual).</td>
              </tr>
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-blue-400 print:text-blue-700">Biaya Kemasan & Overhead</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Packaging & Flat Overhead</td>
                <td className="p-3.5">Modal tambahan untuk wadah takeaway (box/cup) dan biaya operasional dapur flat (LPG, listrik) per batch.</td>
              </tr>
              <tr className="hover:bg-surface-800/30 transition-colors">
                <td className="p-3.5 font-bold text-cyan-400 print:text-cyan-700">Kitchen Scaling Sheet</td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">Portion Scale Calculator</td>
                <td className="p-3.5">Lembar kalkulasi takaran timbangan yang dikalikan secara otomatis saat memasak dalam porsi besar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Alur Kerja Dapur Step-by-Step */}
      <div className="rounded-2xl bg-surface-900/50 border border-surface-700/60 p-6 backdrop-blur-md space-y-6 print:border-slate-300 print:bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:bg-emerald-50 print:text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 print:text-slate-900">
              3. Alur Kerja Dapur Step-by-Step
            </h2>
            <p className="text-slate-400 text-xs print:text-slate-600">
              Ikuti 5 langkah mudah ini untuk membangun sistem costing resep yang sempurna di bisnis F&B Anda.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row md:items-start gap-4 print:border-slate-200 print:bg-slate-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-surface-950 font-bold text-sm shrink-0">
              1
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Input Bahan Baku & Harga Beli Pasar</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
                Buka menu <Link to="/ingredients" className="text-brand-400 hover:underline font-semibold">Bahan</Link>. Masukkan bahan baku mentah lengkap dengan harga beli pasar, isi kemasan (misal: 1 kg / 1000 g), dan % Usable Yield (bagian bersih terpakai).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row md:items-start gap-4 print:border-slate-200 print:bg-slate-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm shrink-0">
              2
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Racik Bumbu Dasar / Sub-Resep (Opsional)</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
                Jika resto Anda menggunakan bumbu halus (bumbu merah/putih) atau saus buatan sendiri, buka menu <Link to="/preps" className="text-purple-400 hover:underline font-semibold">Bumbu Dasar</Link> untuk meracik komponen setengah jadi dalam batch besar.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row md:items-start gap-4 print:border-slate-200 print:bg-slate-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-surface-950 font-bold text-sm shrink-0">
              3
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Susun Formula Resep Menu Utama</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
                Buka menu <Link to="/recipes" className="text-emerald-400 hover:underline font-semibold">Resep</Link>. Gabungkan bahan baku mentah dan bumbu dasar, atur harga jual, tambahkan biaya kemasan & overhead, lalu tentukan target food cost %.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row md:items-start gap-4 print:border-slate-200 print:bg-slate-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm shrink-0">
              4
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Pantau Alarm Dasbor & Nilai Aset Stok</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
                Buka halaman <Link to="/" className="text-red-400 hover:underline font-semibold">Dasbor</Link>. Amati kartu alert resep yang marginnya terancam (danger status) akibat kenaikan harga bahan baku, serta nilai uang aset stok aktif di gudang.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row md:items-start gap-4 print:border-slate-200 print:bg-slate-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm shrink-0">
              5
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 print:text-slate-900">Eksekusi Batch Rencana Produksi</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
                Saat ada pesanan besar, buka menu <Link to="/production" className="text-blue-400 hover:underline font-semibold">Produksi</Link>. Masukkan jumlah target porsi. Saat batch diselesaikan, sistem akan **otomatis memotong stok** bahan baku di gudang.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 4: Fitur Produktivitas & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="rounded-2xl bg-surface-900/50 border border-surface-700/60 p-6 backdrop-blur-md space-y-3 print:border-slate-300 print:bg-white">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Printer className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm print:text-slate-900">Cetak PDF Laporan Clean</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
            Gunakan tombol cetak di halaman **Analisis** atau **Resep**. Tampilan akan dikonversi menjadi laporan PDF putih bersih tanpa navigasi/header agar hemat tinta printer.
          </p>
        </div>

        <div className="rounded-2xl bg-surface-900/50 border border-surface-700/60 p-6 backdrop-blur-md space-y-3 print:border-slate-300 print:bg-white">
          <div className="flex items-center gap-2.5 text-brand-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm print:text-slate-900">Akses Cepat Demo Mode</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed print:text-slate-600">
            Ingin memperlihatkan ke mitra bisnis? Gunakan tombol <strong>⚡ Akses Cepat (Demo)</strong> di halaman login untuk membuatkan resto demo instan yang ter-seed otomatis.
          </p>
        </div>

      </div>

    </div>
  );
};
