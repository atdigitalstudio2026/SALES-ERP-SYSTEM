import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatIDR, formatDate } from '../../lib/currency';
import {
  CreditCard,
  Building2,
  Search,
  Filter,
  ArrowUpRight,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { SalesOrder } from '../../types';

interface PaymentListViewProps {
  onSelectOrderById: (orderId: string) => void;
}

export const PaymentListView: React.FC<PaymentListViewProps> = ({
  onSelectOrderById,
}) => {
  const {
    filteredPayments,
    companies,
    orders,
    selectedCompanyId,
    setSelectedCompanyId,
    permittedCompanies,
    currentUser,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const displayedPayments = useMemo(() => {
    return filteredPayments.filter((p) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      const comp = companies.find((c) => c.company_id === p.company_id);
      return (
        p.payment_number.toLowerCase().includes(query) ||
        p.so_number.toLowerCase().includes(query) ||
        (p.reference_number && p.reference_number.toLowerCase().includes(query)) ||
        (comp && comp.company_name.toLowerCase().includes(query))
      );
    });
  }, [filteredPayments, searchTerm, companies]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Keuangan & Piutang Usaha</span>
              <span aria-hidden="true">·</span>
              <span>Buku Pembayaran & Kas Masuk</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Register Penerimaan Pembayaran
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pencatatan realisasi pelunasan piutang yang terikat langsung dengan nomor faktur dan badan usaha penerbit.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
              Total Recorded Payments
            </span>
            <div className="text-xl font-bold text-emerald-900 font-mono tabular-nums">
              {formatIDR(totalCollected)}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search payment number, SO number, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {currentUser.role !== 'sales' && (
                <option value="ALL">🏢 All Operating Entities</option>
              )}
              {permittedCompanies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{displayedPayments.length}</strong> collection entries
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            PAY-[COMPANY_CODE]-YYYYMMDD-XXXX
          </span>
        </div>

        {displayedPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No payment records found</p>
            <p className="mt-1">Payments are generated when recording collections against Sales Orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment Number</th>
                  <th className="py-3 px-4">Company Entity</th>
                  <th className="py-3 px-4">Sales Order</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Bank / Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPayments.map((p) => {
                  const comp = companies.find((c) => c.company_id === p.company_id);
                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.payment_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                            {comp?.company_code}
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[140px] hidden md:inline">
                            {comp?.company_name.replace('PT ', '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectOrderById(p.so_id)}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <span>{p.so_number}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{p.bank_name || '-'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.reference_number || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                        {formatIDR(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectOrderById(p.so_id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Order
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
