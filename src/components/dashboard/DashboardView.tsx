import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatIDR, formatCompactIDR, formatDate } from '../../lib/currency';
import {
  Building2,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { SalesOrder } from '../../types';
import { MonthlyRevenueChart } from './MonthlyRevenueChart';

interface DashboardViewProps {
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: SalesOrder) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCreateOrder,
  onSelectOrder,
  onNavigateToTab,
}) => {
  const {
    companies,
    filteredOrders,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompany,
    permittedCompanies,
    currentUser,
    orders,
  } = useERP();

  // Calculate dynamic KPIs based on selected company / filtered orders
  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = filteredOrders.length;
  const totalPaid = filteredOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const totalReceivable = filteredOrders.reduce((sum, o) => sum + (o.outstanding_amount || 0), 0);

  // Requirement #15: Company Breakdown Table
  // Calculate stats for all active companies (or permitted companies for this user)
  const companyBreakdown = permittedCompanies.map((comp) => {
    // Look up orders matching this company (and current sales rep if role === 'sales')
    let compOrders = orders.filter((o) => o.company_id === comp.company_id);
    if (currentUser.role === 'sales') {
      compOrders = compOrders.filter((o) => o.sales_id === currentUser.sales_id);
    }

    const cOrdersCount = compOrders.length;
    const cSales = compOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const cPaid = compOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
    const cOutstanding = compOrders.reduce((sum, o) => sum + (o.outstanding_amount || 0), 0);

    return {
      company_id: comp.company_id,
      company_code: comp.company_code,
      company_name: comp.company_name,
      ordersCount: cOrdersCount,
      sales: cSales,
      paid: cPaid,
      outstanding: cOutstanding,
    };
  });

  const breakdownTotalOrders = companyBreakdown.reduce((sum, c) => sum + c.ordersCount, 0);
  const breakdownTotalSales = companyBreakdown.reduce((sum, c) => sum + c.sales, 0);
  const breakdownTotalPaid = companyBreakdown.reduce((sum, c) => sum + c.paid, 0);
  const breakdownTotalOutstanding = companyBreakdown.reduce((sum, c) => sum + c.outstanding, 0);

  // Recent 5 orders in filtered view
  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Contextual Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Konsolidasi Penjualan Grup</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedCompanyId === 'ALL'
                  ? 'Seluruh Anak Perusahaan Holding'
                  : selectedCompany?.company_name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {selectedCompanyId === 'ALL'
                ? 'Dashboard Penjualan Konsolidasian'
                : `${selectedCompany?.company_name} (${selectedCompany?.company_code})`}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {selectedCompanyId === 'ALL'
                ? 'Pemantauan performa transaksi, realisasi pembayaran, dan saldo piutang berjalan across holding.'
                : `NPWP Resmi: ${selectedCompany?.tax_number} · Alamat: ${selectedCompany?.address}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pesanan Baru</span>
            </button>
          </div>
        </div>

        {/* Company Quick-Selector Segmented Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-2">Pilih Entitas:</span>
          {currentUser.role !== 'sales' && (
            <button
              onClick={() => setSelectedCompanyId('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedCompanyId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Perusahaan
            </button>
          )}

          {permittedCompanies.map((c) => (
            <button
              key={c.company_id}
              onClick={() => setSelectedCompanyId(c.company_id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                selectedCompanyId === c.company_id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
              <span>{c.company_code}</span>
              <span className="hidden sm:inline text-[11px] opacity-80">({c.company_name.replace('PT ', '')})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Cards (Requirement #14: Total Sales, Total Orders, Total Paid, Total Receivable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatIDR(totalSales)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-blue-600">{totalOrders}</span>
              <span>orders booked</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalOrders}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Avg per order:</span>
              <span className="font-mono tabular-nums font-medium text-slate-700">
                {totalOrders > 0 ? formatCompactIDR(totalSales / totalOrders) : 'Rp 0'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Paid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatIDR(totalPaid)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Collection rate:</span>
              <span className="font-mono tabular-nums font-semibold text-emerald-700">
                {totalSales > 0 ? `${Math.round((totalPaid / totalSales) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Receivable (Outstanding) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Receivable
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {formatIDR(totalReceivable)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Uncollected balance:</span>
              <span className="font-mono tabular-nums font-medium text-amber-700">
                {totalSales > 0 ? `${Math.round((totalReceivable / totalSales) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Revenue Chart (Bar & Line Visualization) */}
      <MonthlyRevenueChart
        orders={filteredOrders}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        selectedCompanyName={selectedCompany?.company_name}
      />

      {/* COMPANY BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Kinerja Penjualan per Anak Perusahaan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rangkuman omset, volume pesanan, penerimaan dana, dan saldo piutang tertagih per badan hukum.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('reports')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>Lihat Laporan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Badan Usaha / PT</th>
                <th className="py-3 px-4 text-center">Kode</th>
                <th className="py-3 px-4 text-right">Pesanan</th>
                <th className="py-3 px-4 text-right">Total Penjualan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Piutang (AR)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companyBreakdown.map((row) => (
                <tr
                  key={row.company_id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    selectedCompanyId === row.company_id ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{row.company_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {row.company_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 font-medium">
                    {row.ordersCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                    {formatIDR(row.sales)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    {formatIDR(row.paid)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-700 font-semibold">
                    {formatIDR(row.outstanding)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedCompanyId(row.company_id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      <span>Filter PT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-3.5 px-4 uppercase tracking-wider text-[11px]">
                  TOTAL KONSOLIDASI GRUP
                </td>
                <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                  4 ENTITAS
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                  {breakdownTotalOrders}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-900">
                  {formatIDR(breakdownTotalSales)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-800">
                  {formatIDR(breakdownTotalPaid)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-800">
                  {formatIDR(breakdownTotalOutstanding)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => setSelectedCompanyId('ALL')}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    View All
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Sales Orders ({selectedCompanyId === 'ALL' ? 'All Companies' : selectedCompany?.company_code})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live transactions recorded per legal entity format [COMPANY CODE]-YYYYMMDD-XXXX
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No sales orders found for this company view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const comp = companies.find((c) => c.company_id === order.company_id);
                  return (
                    <tr
                      key={order.so_id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.so_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{comp?.company_code}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5 hidden md:inline">
                          ({comp?.company_name.replace('PT ', '')})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {/* Customer lookup */}
                        Customer #{order.customer_id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatIDR(order.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-amber-700">
                        {formatIDR(order.outstanding_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'processing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          Details
                        </button>
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
