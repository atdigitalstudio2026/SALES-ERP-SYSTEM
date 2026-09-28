import React from 'react';
import { SalesOrder } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatIDR, formatDate } from '../../lib/currency';
import { Printer, ArrowLeft } from 'lucide-react';

interface InvoicePrintViewProps {
  order: SalesOrder | null;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ order, onClose }) => {
  const { companies, salesList, customers } = useERP();

  if (!order) return null;

  const company = companies.find((c) => c.company_id === order.company_id);
  const sales = salesList.find((s) => s.sales_id === order.sales_id);
  const customer = customers.find((c) => c.customer_id === order.customer_id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Control Toolbar */}
      <div className="no-print w-full max-w-4xl bg-white border border-slate-200 rounded-xl p-4 mb-4 flex items-center justify-between shadow-md">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ERP</span>
        </button>

        <div className="text-xs font-medium text-slate-500">
          Official Tax Invoice & Sales Order Document
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* A4 Printable Sheet */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8 sm:p-12 text-slate-900 border border-slate-200 min-h-[1050px] flex flex-col justify-between">
        <div>
          {/* Requirement #18: OFFICIAL COMPANY LETTERHEAD */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {company?.company_name}
              </h1>
              <div className="text-sm font-semibold text-slate-700">
                {company?.legal_name}
              </div>
              <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed">
                {company?.address}
              </p>
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span>Tel: <strong>{company?.phone}</strong></span>
                <span>Email: <strong>{company?.email}</strong></span>
                <span>NPWP: <strong>{company?.tax_number}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-xs font-extrabold px-3 py-1 uppercase tracking-wider mb-2">
                OFFICIAL SALES ORDER
              </span>
              <div className="font-mono text-xl font-bold text-slate-900">
                {order.so_number}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date: {formatDate(order.order_date)}
              </div>
              <div className="text-xs text-slate-500">
                Entity Code: <strong className="font-mono">{company?.company_code}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Transaction Meta */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                BILL TO / CUSTOMER:
              </div>
              <div className="text-sm font-bold text-slate-900">
                {customer?.customer_name}
              </div>
              <div className="text-slate-600 mt-1 leading-relaxed">
                {customer?.address}
              </div>
              <div className="text-slate-600 mt-1">
                Attn: {customer?.contact_person} ({customer?.phone})
              </div>
              <div className="text-slate-500">{customer?.email}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                ORDER TERMS & LOGISTICS:
              </div>
              <div className="space-y-1 mt-1 text-slate-700">
                <div>
                  Payment Terms: <strong>{order.payment_terms}</strong>
                </div>
                <div>
                  Due Date: <strong>{formatDate(order.due_date)}</strong>
                </div>
                <div>
                  Delivery Date: <strong>{formatDate(order.delivery_date)}</strong>
                </div>
                <div>
                  Sales Executive: <strong>{sales?.sales_name} ({sales?.sales_code})</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right w-24">Qty</th>
                  <th className="py-2.5 px-3 text-right w-32">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-20">Disc %</th>
                  <th className="py-2.5 px-3 text-right w-36">Subtotal (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.product_code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {formatIDR(item.unit_price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
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

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-80 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Net:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatIDR(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {order.tax_amount > 0
                    ? `PPN (${order.tax_rate ?? 11}%):`
                    : 'PPN (Bebas / Nonaktif):'}
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {order.tax_amount > 0 ? formatIDR(order.tax_amount) : 'Rp 0'}
                </span>
              </div>
              <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono tabular-nums text-blue-900 text-base">
                  {formatIDR(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold text-xs pt-1">
                <span>Paid / Deposited:</span>
                <span className="font-mono tabular-nums">
                  {formatIDR(order.paid_amount || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-amber-800 text-xs">
                <span>Balance Due:</span>
                <span className="font-mono tabular-nums">
                  {formatIDR(order.outstanding_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mb-8">
              <strong>Notes:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Signatures & Seal zone */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="text-slate-500 mb-16">Customer Acceptance</div>
            <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
              ( {customer?.contact_person || 'Authorized Signature'} )
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-16">Sales Officer</div>
            <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
              ( {sales?.sales_name} )
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-16">Authorized Management</div>
            <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
              {company?.company_name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
