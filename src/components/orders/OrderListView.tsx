import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder } from '../../types';
import { formatIDR, formatDate } from '../../lib/currency';
import { exportOrdersToCSV } from '../../lib/csvExport';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  Download,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCw,
  X,
  ShieldCheck,
  Crown,
} from 'lucide-react';

interface OrderListViewProps {
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: SalesOrder) => void;
  onOpenRecordPayment: (order: SalesOrder) => void;
  onOpenPrintInvoice: (order: SalesOrder) => void;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  onOpenCreateOrder,
  onSelectOrder,
  onOpenRecordPayment,
  onOpenPrintInvoice,
}) => {
  const {
    filteredOrders,
    companies,
    salesList,
    customers,
    selectedCompanyId,
    setSelectedCompanyId,
    permittedCompanies,
    currentUser,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Status distribution breakdown for quick visual badges
  const statusCounts = useMemo(() => {
    const counts = {
      all: filteredOrders.length,
      pending: 0,
      paid: 0,
      partial: 0,
      cancelled: 0,
    };

    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled') {
        counts.cancelled++;
      } else if (o.status === 'completed' || o.outstanding_amount <= 0) {
        counts.paid++;
      } else if ((o.paid_amount || 0) > 0 && o.outstanding_amount > 0) {
        counts.partial++;
      } else {
        counts.pending++;
      }
    });

    return counts;
  }, [filteredOrders]);

  const displayedOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'paid') {
          if (order.status !== 'completed' && order.outstanding_amount > 0) return false;
        } else if (statusFilter === 'pending') {
          if (order.status === 'cancelled' || order.outstanding_amount <= 0 || (order.paid_amount || 0) > 0) return false;
        } else if (statusFilter === 'partial') {
          if ((order.paid_amount || 0) <= 0 || order.outstanding_amount <= 0) return false;
        } else if (statusFilter === 'cancelled') {
          if (order.status !== 'cancelled') return false;
        } else if (statusFilter === 'processing') {
          if (order.status !== 'processing') return false;
        } else if (statusFilter === 'draft') {
          if (order.status !== 'draft') return false;
        } else if (statusFilter === 'confirmed') {
          if (order.status !== 'confirmed') return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // Search term filter: SO ID, SO Number, Customer Name, Customer Code, Sales Name, Company
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const customer = customers.find((c) => c.customer_id === order.customer_id);
        const sales = salesList.find((s) => s.sales_id === order.sales_id);
        const comp = companies.find((c) => c.company_id === order.company_id);

        const matchSOId = order.so_id ? order.so_id.toLowerCase().includes(query) : false;
        const matchSONumber = order.so_number ? order.so_number.toLowerCase().includes(query) : false;
        const matchCustomerName = customer?.customer_name ? customer.customer_name.toLowerCase().includes(query) : false;
        const matchCustomerId = customer?.customer_id ? customer.customer_id.toLowerCase().includes(query) : false;
        const matchSales = sales?.sales_name ? sales.sales_name.toLowerCase().includes(query) : false;
        const matchCompany = comp
          ? comp.company_name.toLowerCase().includes(query) || comp.company_code.toLowerCase().includes(query)
          : false;

        return matchSOId || matchSONumber || matchCustomerName || matchCustomerId || matchSales || matchCompany;
      }

      return true;
    });
  }, [filteredOrders, statusFilter, searchTerm, customers, salesList, companies]);

  // Visual status badge helper for clear, glanceable order status
  const renderStatusBadge = (order: SalesOrder) => {
    // 1. Cancelled
    if (order.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Cancelled</span>
        </span>
      );
    }

    // 2. Paid (Completed or fully paid)
    if (order.status === 'completed' || order.outstanding_amount <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Paid</span>
        </span>
      );
    }

    // 3. Partially Paid
    if (order.paid_amount && order.paid_amount > 0 && order.outstanding_amount > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
          <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Partial</span>
        </span>
      );
    }

    // 4. Processing
    if (order.status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
          <RotateCw className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Processing</span>
        </span>
      );
    }

    // 5. Draft
    if (order.status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Draft</span>
        </span>
      );
    }

    // 6. Pending
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pending</span>
      </span>
    );
  };

  const handleExportOrders = () => {
    if (displayedOrders.length === 0) {
      alert('Tidak ada data pesanan untuk diekspor.');
      return;
    }

    const companyLookup = new Map(companies.map((c) => [c.company_id, c]));
    const customerLookup = new Map(customers.map((c) => [c.customer_id, c]));
    const salesLookup = new Map(salesList.map((s) => [s.sales_id, s]));

    const dateStr = new Date().toISOString().split('T')[0];
    const compCode =
      selectedCompanyId === 'ALL'
        ? 'SEMUA_PT'
        : companyLookup.get(selectedCompanyId)?.company_code || selectedCompanyId;
    const filename = `sales_orders_${compCode}_${dateStr}.csv`;

    const success = exportOrdersToCSV(
      displayedOrders,
      {
        getCompanyName: (id) => companyLookup.get(id)?.company_name || id,
        getCompanyCode: (id) => companyLookup.get(id)?.company_code || id,
        getCustomerName: (id) => customerLookup.get(id)?.customer_name || id,
        getSalesName: (id) => salesLookup.get(id)?.sales_name || id,
      },
      filename
    );

    if (success) {
      setExportNotice(`Berhasil mengekspor ${displayedOrders.length} baris pesanan ke file CSV!`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Top Bar Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {currentUser.role === 'sales' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    Transaksi Penjualan Saya
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Akses Pribadi Terisolasi</span>
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Daftar Sales Orders - {currentUser.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Hanya menampilkan transaksi penjualan milik Anda sendiri sesuai hak akses yang diberikan Superadmin.
                </p>
              </>
            ) : currentUser.role === 'super_admin' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                    Akses Penuh Superadmin
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 inline-flex items-center gap-1">
                    <Crown className="w-3 h-3 text-purple-600" />
                    <span>Semua Sales & Seluruh Entitas PT</span>
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Daftar Seluruh Sales Orders
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar seluruh transaksi penjualan dari seluruh tim sales lintas anak perusahaan (EXA, SRAM, IMR, PAS).
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Daftar Sales Orders
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar transaksi penjualan multi-entitas dengan penomoran otomatis dan validasi status pelunasan.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200/80"
              title="Unduh data tabel pesanan ke file CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={onOpenCreateOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Sales Order</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar: Filter by SO ID, SO Number, or Customer Name */}
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              aria-label="Cari No. SO, SO ID, atau Nama Pelanggan"
              placeholder="Cari berdasarkan No. SO / SO ID atau Nama Pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchTerm('');
              }}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Hapus pencarian (Esc)"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Company filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {currentUser.role !== 'sales' && (
                <option value="ALL">🏢 Semua Perusahaan</option>
              )}
              {permittedCompanies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Status (All Statuses)</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid (Lunas)</option>
              <option value="partial">Partial (Sebagian)</option>
              <option value="processing">Processing (Diproses)</option>
              <option value="confirmed">Confirmed (Disetujui)</option>
              <option value="draft">Draft (Konsep)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>
        </div>

        {/* Quick Visual Status Filter Badges (e.g. Pending, Paid, Partial, Cancelled) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] opacity-75 font-mono">({statusCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            <span className="text-[10px] font-mono opacity-85">({statusCounts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paid</span>
            <span className="text-[10px] font-mono opacity-85">({statusCounts.paid})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('partial')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
              statusFilter === 'partial'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200/80 hover:bg-indigo-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Partial</span>
            <span className="text-[10px] font-mono opacity-85">({statusCounts.partial})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
            <span className="text-[10px] font-mono opacity-85">({statusCounts.cancelled})</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Total <strong>{displayedOrders.length}</strong> transaksi terdata
            </span>
            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200/60">
                Pencarian: "{searchTerm}"
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-blue-900 ml-0.5"
                  title="Hapus filter pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Penomoran Resmi: [KODE_PT]-YYYYMMDD-XXXX
          </span>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">
              {searchTerm ? `Tidak ditemukan pesanan dengan kata kunci "${searchTerm}"` : 'Belum ada Sales Order yang cocok'}
            </p>
            <p className="mt-1 text-slate-500">
              {searchTerm
                ? 'Coba periksa kembali No. SO, SO ID, atau Nama Pelanggan yang dimasukkan.'
                : 'Silakan sesuaikan filter pencarian atau buat transaksi baru.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Pencarian</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Order (SO)</th>
                  <th className="py-3 px-4">Entitas PT</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Sales Officer</th>
                  <th className="py-3 px-4">Tgl Transaksi</th>
                  <th className="py-3 px-4 text-right">Nilai Pesanan</th>
                  <th className="py-3 px-4 text-right">Terbayar</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang (AR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map((order) => {
                  const comp = companies.find((c) => c.company_id === order.company_id);
                  const cust = customers.find((c) => c.customer_id === order.customer_id);
                  const sales = salesList.find((s) => s.sales_id === order.sales_id);

                  return (
                    <tr
                      key={order.so_id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {order.so_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {comp?.company_code}
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[130px] hidden md:inline">
                            {comp?.company_name.replace('PT ', '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {cust?.customer_name || 'Customer'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sales?.sales_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatIDR(order.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        {formatIDR(order.paid_amount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700 font-bold">
                        {formatIDR(order.outstanding_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(order)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectOrder(order)}
                            title="View SO Details"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenPrintInvoice(order)}
                            title="Print Official Invoice / PDF"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {order.outstanding_amount > 0 && (
                            <button
                              onClick={() => onOpenRecordPayment(order)}
                              title="Record Payment"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
