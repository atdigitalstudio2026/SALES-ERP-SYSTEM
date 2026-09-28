import React from 'react';
import { SalesOrder } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatIDR, formatDate } from '../../lib/currency';
import {
  X,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  User,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  RotateCw,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (order: SalesOrder) => void;
  onOpenPrintInvoice: (order: SalesOrder) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenPrintInvoice,
}) => {
  const { companies, salesList, customers, payments } = useERP();

  if (!isOpen || !order) return null;

  const company = companies.find((c) => c.company_id === order.company_id);
  const sales = salesList.find((s) => s.sales_id === order.sales_id);
  const customer = customers.find((c) => c.customer_id === order.customer_id);

  // Payments tied to this SO
  const orderPayments = payments.filter((p) => p.so_id === order.so_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-xs">
              {company?.company_code || 'SO'}
            </div>
            <div>
              <div className="text-xs text-blue-400 font-semibold">
                SALES ORDER DETAILS
              </div>
              <h2 className="text-lg font-bold text-white font-mono">
                {order.so_number}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Requirement #8: PROMINENT COMPANY HEADER IN TRANSACTION DETAILS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                  Operating Subsidiary / Legal Entity
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {company?.company_name}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {company?.legal_name} · NPWP: {company?.tax_number}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {company?.address} · {company?.phone} · {company?.email}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5">
                {order.status === 'cancelled' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Cancelled</span>
                  </span>
                ) : order.status === 'completed' || order.outstanding_amount <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Paid (Lunas)</span>
                  </span>
                ) : order.paid_amount && order.paid_amount > 0 && order.outstanding_amount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Partial (Sebagian)</span>
                  </span>
                ) : order.status === 'processing' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
                    <RotateCw className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Processing</span>
                  </span>
                ) : order.status === 'draft' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Draft</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pending</span>
                  </span>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  Order Date: <span className="font-semibold text-slate-800">{formatDate(order.order_date)}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Due Date: <span className="font-semibold text-slate-800">{formatDate(order.due_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales & Customer Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Sales Representative
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {sales?.sales_name}
              </div>
              <div className="text-slate-600 mt-0.5">
                {sales?.position} · {sales?.area}
              </div>
              <div className="text-slate-500 mt-0.5">
                {sales?.email} · {sales?.phone}
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Customer Information
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {customer?.customer_name}
              </div>
              <div className="text-slate-600 mt-0.5">
                Contact: {customer?.contact_person} ({customer?.phone})
              </div>
              <div className="text-slate-500 mt-0.5">
                {customer?.address}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
              Ordered Products
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Disc %</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatIDR(item.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                        {item.discount_percent}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatIDR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="font-semibold text-slate-700 mb-1">Logistics & Notes</div>
              <p className="text-slate-600 whitespace-pre-wrap">
                {order.notes || 'No special notes.'}
              </p>
              <div className="mt-3 text-slate-500">
                Delivery Date: <span className="font-semibold text-slate-800">{formatDate(order.delivery_date)}</span>
              </div>
              <div className="text-slate-500">
                Payment Terms: <span className="font-semibold text-slate-800">{order.payment_terms}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Items:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">{formatIDR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {order.tax_amount > 0
                    ? `PPN (${order.tax_rate ?? 11}%):`
                    : 'PPN (Nonaktif / Bebas):'}
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {order.tax_amount > 0 ? formatIDR(order.tax_amount) : 'Rp 0'}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono tabular-nums text-blue-700">{formatIDR(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Paid Amount:</span>
                <span className="font-mono tabular-nums">{formatIDR(order.paid_amount || 0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-amber-700">
                <span>Outstanding (AR):</span>
                <span className="font-mono tabular-nums">{formatIDR(order.outstanding_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment History for this SO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Payment History (Strictly Company Bound: {company?.company_code})
              </h4>
              {order.outstanding_amount > 0 && (
                <button
                  onClick={() => onOpenRecordPayment(order)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>

            {orderPayments.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                No payments have been recorded yet for this sales order.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Payment No</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderPayments.map((p) => (
                      <tr key={p.payment_id}>
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{p.payment_number}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDate(p.payment_date)}</td>
                        <td className="py-2 px-3 uppercase text-[11px] font-semibold text-slate-700">{p.payment_method.replace('_', ' ')}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{p.reference_number || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                          {formatIDR(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => onOpenPrintInvoice(order)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Invoice / PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
