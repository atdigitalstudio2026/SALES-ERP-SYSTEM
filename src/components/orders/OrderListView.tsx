import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder } from '../../types';
import { formatIDR, formatDate } from '../../lib/currency';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Printer,
  CreditCard,
  Building2,
  Calendar,
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

  const displayedOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const customer = customers.find((c) => c.customer_id === order.customer_id);
        const sales = salesList.find((s) => s.sales_id === order.sales_id);
        const comp = companies.find((c) => c.company_id === order.company_id);

        const matchSO = order.so_number.toLowerCase().includes(query);
        const matchCustomer = customer?.customer_name.toLowerCase().includes(query);
        const matchSales = sales?.sales_name.toLowerCase().includes(query);
        const matchCompany = comp?.company_name.toLowerCase().includes(query) || comp?.company_code.toLowerCase().includes(query);

        return matchSO || matchCustomer || matchSales || matchCompany;
      }

      return true;
    });
  }, [filteredOrders, statusFilter, searchTerm, customers, salesList, companies]);

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sales Orders Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-entity transactions with strict database foreign keys and automated sequential numbering.
            </p>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Sales Order</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search SO number, customer, sales rep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Company filter */}
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

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{displayedOrders.length}</strong> orders
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Format: [COMPANY_CODE]-YYYYMMDD-XXXX
          </span>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Sales Orders found</p>
            <p className="mt-1">Try adjusting your search criteria or create a new sales order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Company Entity</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sales Officer</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding (AR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
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
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
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
                      <td className="py-3 px-4 font-semibold text-slate-800">
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
