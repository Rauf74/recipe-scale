import React from "react";
import { Trash2 } from "lucide-react";

interface Props {
  /** Nama item yang akan dihapus, ditampilkan dalam pesan konfirmasi */
  itemName: string;
  /** Judul modal, misal "Hapus Bahan Baku" atau "Hapus Resep" */
  title: string;
  /** Pesan tambahan di bawah nama item (opsional) */
  description?: string;
  /** Error message dari server jika penghapusan gagal */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal konfirmasi sebelum menghapus suatu item.
 * Digunakan secara konsisten di IngredientsPage dan RecipesPage
 * agar perilaku dan tampilan delete-flow seragam.
 */
export const ConfirmDeleteModal: React.FC<Props> = ({
  itemName,
  title,
  description,
  error,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-100 text-base">{title}</h3>
        </div>

        {/* Body */}
        <p className="text-sm text-slate-400 leading-relaxed">
          Yakin hapus{" "}
          <span className="text-slate-200 font-semibold">{itemName}</span>?{" "}
          {description}
        </p>

        {/* Error feedback (misal: item masih dipakai di resep lain) */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-surface-700 hover:bg-surface-800 text-slate-400 font-bold transition-all cursor-pointer text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-xs"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
