import React, { useState, useEffect } from 'react';
import { SalesOrder, PaymentMethod } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatIDR, formatDate } from '../../lib/currency';
import { X, CreditCard, Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { companies, customers, recordPayment } = useERP();

  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('BCA');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setAmount(order.outstanding_amount);
      setReferenceNumber(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
      setError(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // REQUIREMENT #10: Inherited strictly from Sales Order!
  const company = companies.find((c) => c.company_id === order.company_id);
  const customer = customers.find((c) => c.customer_id === order.customer_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (amount > order.outstanding_amount) {
      setError(`Payment amount cannot exceed outstanding balance (${formatIDR(order.outstanding_amount)}).`);
      return;
    }

    try {
      const payment = recordPayment({
        so_id: order.so_id,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        bank_name: bankName,
        notes,
      });

      onSuccess(payment.payment_id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Record Customer Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* REQUIREMENT #10: STRICT INHERITED COMPANY BANNER */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Inherited Entity (Auto-Locked)</span>
            </div>
            <div className="text-sm font-bold text-emerald-950">
              {company?.company_name} ({company?.company_code})
            </div>
            <p className="text-[11px] text-emerald-700">
              Company is automatically bound to Sales Order <strong>{order.so_number}</strong>. No manual company selection needed.
            </p>
          </div>

          {/* Target SO & Customer Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer</span>
              <div className="font-semibold text-slate-900">{customer?.customer_name}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">SO Total</span>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {formatIDR(order.total_amount)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Already Paid</span>
              <div className="font-mono tabular-nums text-emerald-700 font-semibold">
                {formatIDR(order.paid_amount || 0)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining Due</span>
              <div className="font-mono tabular-nums text-amber-700 font-bold">
                {formatIDR(order.outstanding_amount)}
              </div>
            </div>
          </div>

          {/* Amount to pay */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Payment Amount (IDR) *
            </label>
            <input
              type="number"
              min="1"
              max={order.outstanding_amount}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(order.outstanding_amount)}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
              >
                Pay Full Balance ({formatIDR(order.outstanding_amount)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round(order.outstanding_amount / 2))}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
              >
                Pay 50%
              </button>
            </div>
          </div>

          {/* Date & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash / Tunai</option>
                <option value="giro">Bilyet Giro</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Reference and Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reference / Receipt No.
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TRF-123456"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank / Account
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. BCA, Mandiri, Cashier"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Down payment batch 1, Settlement in full..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
