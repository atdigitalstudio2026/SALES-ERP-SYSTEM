import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatIDR } from '../../lib/currency';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Database,
  Building2,
  FileText,
  CreditCard,
  Layers,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResetMode = 'transactions_only' | 'total_clean' | 'restore_demo';

export const ResetDataModal: React.FC<ResetDataModalProps> = ({ isOpen, onClose }) => {
  const {
    orders,
    payments,
    companies,
    products,
    customers,
    resetTransactionsToZero,
    resetTotalToZero,
    restoreDemoData,
    currentUser,
  } = useERP();

  const [mode, setMode] = useState<ResetMode>('transactions_only');
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate current transaction volume
  const totalOrdersCount = orders.length;
  const totalPaymentsCount = payments.length;
  const totalRevenueAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const isConfirmed = confirmInput.trim().toUpperCase() === 'RESET';

  const handleExecuteReset = async () => {
    if (!isConfirmed) return;
    setLoading(true);

    try {
      if (mode === 'transactions_only') {
        const res = await resetTransactionsToZero();
        setSuccessMessage(
          `Berhasil! Seluruh ${res.ordersCount} pesanan penjualan dan ${res.paymentsCount} pembayaran telah dikosongkan menjadi 0. Nomor urut transaksi berikutnya otomatis dimulai dari 0001.`
        );
      } else if (mode === 'total_clean') {
        await resetTotalToZero();
        setSuccessMessage(
          'Reset total berhasil! Seluruh data transaksi, pelanggan, produk, dan harga telah dikosongkan menjadi 0.'
        );
      } else if (mode === 'restore_demo') {
        await restoreDemoData();
        setSuccessMessage('Data contoh demo transaksi dan katalog berhasil dipulihkan kembali.');
      }
      setConfirmInput('');
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses reset data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  Otorisasi Superadmin
                </span>
                <span className="px-1.5 py-0.2 bg-rose-500/30 text-rose-200 rounded text-[9px] font-mono">
                  KHUSUS SUPERADMIN
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Reset Data Sistem Menjadi Nol
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Pembersihan Data Berhasil
              </h4>
              <p className="text-slate-600 leading-relaxed max-w-md mx-auto text-xs">
                {successMessage}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Selesai & Buka Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Snapshot Current Status */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Status Data Transaksi Berjalan Saat Ini
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {totalOrdersCount}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Sales Orders</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {totalPaymentsCount}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Pembayaran</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold font-mono text-emerald-700 truncate mt-1">
                      {formatIDR(totalRevenueAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Total Omset</div>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block font-bold text-slate-900 mb-2">
                  Pilih Tindakan Reset:
                </label>
                <div className="space-y-2.5">
                  {/* Mode 1: Transactions Only (Recommended) */}
                  <div
                    onClick={() => setMode('transactions_only')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mode === 'transactions_only'
                        ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      checked={mode === 'transactions_only'}
                      onChange={() => setMode('transactions_only')}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          1. Kosongkan Seluruh Data Transaksi Menjadi Nol (0)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          DIREKOMENDASIKAN
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Mengosongkan 100% Sales Order dan Pembayaran menjadi <strong>0</strong>. Nomor SO berikutnya akan mulai dari nomor urut awal (<strong>0001</strong>).
                      </p>
                      <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Master Data Aman:</strong> 4 PT, Akun Sales & Password, Master Produk, Pelanggan, dan Daftar Harga tetap tersimpan agar siap langsung digunakan transaksi nyata.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode 2: Total Clean */}
                  <div
                    onClick={() => setMode('total_clean')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mode === 'total_clean'
                        ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      checked={mode === 'total_clean'}
                      onChange={() => setMode('total_clean')}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">
                        2. Reset Total (Kosongkan Transaksi + Produk & Pelanggan)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mengosongkan transaksi, katalog produk, daftar harga, dan data pelanggan menjadi kosong. Menyisakan entitas legal PT dan akun Superadmin.
                      </p>
                    </div>
                  </div>

                  {/* Mode 3: Restore Demo Data */}
                  <div
                    onClick={() => setMode('restore_demo')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mode === 'restore_demo'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      checked={mode === 'restore_demo'}
                      onChange={() => setMode('restore_demo')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>3. Kembalikan ke Data Contoh Demo Awal</span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Memulihkan data transaksi simulasi dan katalog contoh bawaan demo untuk presentasi atau uji coba.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Confirmation Input */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Konfirmasi Pengaman Superadmin</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Untuk mencegah penghapusan data yang tidak disengaja, silakan ketik kata{' '}
                  <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-900">
                    RESET
                  </strong>{' '}
                  pada kolom di bawah ini:
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Ketik RESET untuk konfirmasi..."
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 uppercase tracking-wider"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!isConfirmed || loading}
                  onClick={handleExecuteReset}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Sedang Memproses...'
                      : mode === 'restore_demo'
                      ? 'Pulihkan Data Demo'
                      : 'Ya, Kosongkan Transaksi Menjadi Nol (0)'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
