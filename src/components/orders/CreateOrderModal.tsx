import React, { useState, useEffect, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { storage } from '../../lib/storage';
import { formatIDR } from '../../lib/currency';
import {
  X,
  Building2,
  Calendar,
  User,
  Building,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
  CheckCircle,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { Customer, Product } from '../../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

interface OrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  notes?: string;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    companies,
    salesList,
    customers,
    customerCompanies,
    products,
    currentUser,
    allowMultiCompany,
    permittedCompanies,
    defaultSalesCompany,
    createOrUpdateOrder,
    resolvePrice,
  } = useERP();

  // Requirement #7: Determine available companies for this user
  // If Sales:
  // - default company is prefilled
  // - if multi-company allowed, can choose among assigned companies in permittedCompanies
  // - if only 1 company, prefilled and locked
  const isSales = currentUser.role === 'sales';

  // State for form
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [soNumber, setSoNumber] = useState<string>('');
  const [isManualSoNumber, setIsManualSoNumber] = useState<boolean>(false);
  const [selectedSalesId, setSelectedSalesId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('');
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(11);
  const [items, setItems] = useState<OrderItemInput[]>([
    { product_id: products[0]?.product_id || '', quantity: 100, unit_price: 25000, discount_percent: 0 },
  ]);

  const [error, setError] = useState<string | null>(null);

  // Initialize company on open or role change
  useEffect(() => {
    if (isOpen) {
      let initCompanyId = '';
      if (isSales && defaultSalesCompany) {
        initCompanyId = defaultSalesCompany.company_id;
        setSelectedCompanyId(initCompanyId);
        setSelectedSalesId(currentUser.sales_id || '');
      } else if (permittedCompanies.length > 0) {
        initCompanyId = permittedCompanies[0].company_id;
        setSelectedCompanyId(initCompanyId);
        setSelectedSalesId(salesList[0]?.sales_id || '');
      }
      setSelectedCustomerId(customers[0]?.customer_id || '');
      setIsManualSoNumber(false);
      setError(null);

      if (initCompanyId) {
        try {
          const nextSO = storage.generateNextSONumber(initCompanyId, orderDate);
          setSoNumber(nextSO);
        } catch {
          setSoNumber('');
        }
      }
    }
  }, [isOpen, currentUser, defaultSalesCompany, permittedCompanies, salesList, customers, isSales, orderDate]);

  // Keep SO number in sync when company or order date changes, unless manually modified
  useEffect(() => {
    if (selectedCompanyId && !isManualSoNumber) {
      try {
        const nextSO = storage.generateNextSONumber(selectedCompanyId, orderDate);
        setSoNumber(nextSO);
      } catch {
        setSoNumber('');
      }
    }
  }, [selectedCompanyId, orderDate, isManualSoNumber]);

  const handleRegenerateSONumber = () => {
    if (!selectedCompanyId) return;
    try {
      const nextSO = storage.generateNextSONumber(selectedCompanyId, orderDate);
      setSoNumber(nextSO);
      setIsManualSoNumber(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal generate nomor SO.');
    }
  };

  // Available companies for the dropdown
  const selectableCompanies = useMemo(() => {
    if (isSales) {
      if (allowMultiCompany) {
        return permittedCompanies;
      } else {
        return defaultSalesCompany ? [defaultSalesCompany] : [];
      }
    }
    return permittedCompanies;
  }, [isSales, allowMultiCompany, permittedCompanies, defaultSalesCompany]);

  // Selected company object
  const currentCompany = useMemo(() => {
    return companies.find((c) => c.company_id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Selected customer object & company-specific relationship (Requirement #11)
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.customer_id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const currentCustomerCompanyRelation = useMemo(() => {
    if (!selectedCustomerId || !selectedCompanyId) return null;
    return customerCompanies.find(
      (cc) => cc.customer_id === selectedCustomerId && cc.company_id === selectedCompanyId
    );
  }, [customerCompanies, selectedCustomerId, selectedCompanyId]);

  // When customer changes, auto-fill default payment terms from customer_companies relation
  useEffect(() => {
    if (currentCustomerCompanyRelation) {
      setPaymentTerms(currentCustomerCompanyRelation.payment_terms);
      // Auto calculate due date based on terms
      const days = currentCustomerCompanyRelation.payment_terms.includes('14')
        ? 14
        : currentCustomerCompanyRelation.payment_terms.includes('45')
        ? 45
        : currentCustomerCompanyRelation.payment_terms.includes('60')
        ? 60
        : currentCustomerCompanyRelation.payment_terms.includes('7')
        ? 7
        : 30;
      const d = new Date(orderDate);
      d.setDate(d.getDate() + days);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [currentCustomerCompanyRelation, orderDate]);

  // Auto recalculate prices for all items when company or customer changes (Requirement #12)
  useEffect(() => {
    if (selectedCompanyId && items.length > 0) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (!item.product_id) return item;
          const resolvedPrice = resolvePrice(
            selectedCompanyId,
            item.product_id,
            currentCustomer?.customer_type || 'all',
            selectedCustomerId,
            item.quantity
          );
          return {
            ...item,
            unit_price: resolvedPrice,
          };
        })
      );
    }
  }, [selectedCompanyId, selectedCustomerId, currentCustomer]);

  // Requirement #9: Real-time SO Number preview: [COMPANY CODE]-YYYYMMDD-XXXX
  const previewSONumber = useMemo(() => {
    if (!selectedCompanyId) return '---';
    try {
      return storage.generateNextSONumber(selectedCompanyId, orderDate);
    } catch {
      return '---';
    }
  }, [selectedCompanyId, orderDate]);

  // Calculated items and totals
  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const prod = products.find((p) => p.product_id === item.product_id);
      const sub = Math.round(item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100));
      return {
        ...item,
        product_code: prod?.product_code || '',
        product_name: prod?.product_name || '',
        unit: prod?.unit || 'Pcs',
        subtotal: sub,
      };
    });
  }, [items, products]);

  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const taxAmount = taxEnabled ? Math.round(subtotal * (taxRate / 100)) : 0;
  const totalAmount = subtotal + taxAmount;

  // Handlers for item rows
  const handleItemChange = (index: number, field: keyof OrderItemInput, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // If product changed, update price automatically from price lists
    if (field === 'product_id' && selectedCompanyId) {
      const newPrice = resolvePrice(
        selectedCompanyId,
        value,
        currentCustomer?.customer_type || 'all',
        selectedCustomerId,
        current.quantity
      );
      current.unit_price = newPrice;
    }

    // If quantity changed, check if tier discount applies
    if (field === 'quantity' && selectedCompanyId) {
      const newPrice = resolvePrice(
        selectedCompanyId,
        current.product_id,
        currentCustomer?.customer_type || 'all',
        selectedCustomerId,
        Number(value)
      );
      current.unit_price = newPrice;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    const unitPrice = defaultProd && selectedCompanyId
      ? resolvePrice(selectedCompanyId, defaultProd.product_id, currentCustomer?.customer_type || 'all', selectedCustomerId, 100)
      : 25000;

    setItems([
      ...items,
      {
        product_id: defaultProd?.product_id || '',
        quantity: 100,
        unit_price: unitPrice,
        discount_percent: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation requirement #4 & #21
    if (!selectedCompanyId) {
      setError('CRITICAL: Company selection is mandatory. company_id cannot be null.');
      return;
    }

    if (!soNumber.trim()) {
      setError('No. SO (Nomor Sales Order) wajib diisi.');
      return;
    }

    if (!selectedSalesId) {
      setError('Sales representative must be selected.');
      return;
    }

    if (!selectedCustomerId) {
      setError('Customer must be selected.');
      return;
    }

    if (items.length === 0 || items.some((i) => !i.product_id || i.quantity <= 0)) {
      setError('Please add at least one valid product line with quantity > 0.');
      return;
    }

    try {
      const newOrder = createOrUpdateOrder({
        company_id: selectedCompanyId, // NOT NULL FOREIGN KEY
        so_number: soNumber.trim(),
        sales_id: selectedSalesId,
        customer_id: selectedCustomerId,
        order_date: orderDate,
        payment_terms: paymentTerms,
        due_date: dueDate,
        delivery_date: deliveryDate,
        notes,
        tax_enabled: taxEnabled,
        tax_rate: taxEnabled ? taxRate : 0,
        status: 'confirmed',
        items: calculatedItems,
      });

      onSuccess(newOrder.so_id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save sales order.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wide">
              <span>NEW TRANSACTION</span>
              <span aria-hidden="true">·</span>
              <span>ENTITY ISOLATION ENFORCED</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Create Sales Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requirement #8: PROMINENT TRANSACTION HEADER PREVIEW */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Active Legal Entity Header
              </div>
              <div className="text-xl font-extrabold text-blue-950">
                {currentCompany?.company_name || 'Select Company'}
              </div>
              <div className="text-xs text-blue-800">
                {currentCompany?.legal_name} · NPWP: {currentCompany?.tax_number}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Assigned SO Number (Requirement #9)
              </div>
              <div className="font-mono text-lg font-bold text-blue-900 bg-white border border-blue-200 px-3 py-1 rounded-md inline-block shadow-2xs">
                {soNumber || previewSONumber}
              </div>
            </div>
          </div>

          {/* REQUIREMENT #3 & #7: COMPANY DROPDOWN PLACED BEFORE SALES / CUSTOMER + NO SO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {/* Field 1: COMPANY (Requirement #7: placed BEFORE Sales / Customer) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Perusahaan / Entity *</span>
                </span>
                {isSales && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    {allowMultiCompany ? 'Multi-PT' : 'Default'}
                  </span>
                )}
              </label>

              {/* Company selection UX handling for Sales & Admin */}
              {isSales && !allowMultiCompany ? (
                // Locked if sales only has 1 company or multi-company disabled (Req #7)
                <div className="w-full px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800">
                  {currentCompany?.company_name} ({currentCompany?.company_code})
                  <span className="block text-[10px] font-normal text-slate-500">
                    Locked to primary assigned company
                  </span>
                </div>
              ) : (
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                >
                  <option value="" disabled>
                    -- Pilih Perusahaan --
                  </option>
                  {selectableCompanies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_name} ({c.company_code})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                FK: <code className="font-mono text-[9px]">{selectedCompanyId || 'companies.company_id'}</code>
              </p>
            </div>

            {/* Field 2: NO SO (Nomor Sales Order) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. No. SO *</span>
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateSONumber}
                  title="Generate ulang format nomor SO otomatis"
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto Reset</span>
                </button>
              </label>
              <input
                type="text"
                value={soNumber}
                onChange={(e) => {
                  setSoNumber(e.target.value.toUpperCase());
                  setIsManualSoNumber(true);
                }}
                placeholder="EXA-YYYYMMDD-XXXX"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs uppercase tracking-wide"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>[KODE]-YYYYMMDD-XXXX</span>
                {isManualSoNumber ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">Custom</span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">Auto Sequence</span>
                )}
              </div>
            </div>

            {/* Field 3: SALES REP */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>3. Sales Representative *</span>
              </label>
              {isSales ? (
                <div className="w-full px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800">
                  {currentUser.name}
                  <span className="block text-[10px] font-normal text-slate-500">
                    Logged in sales officer
                  </span>
                </div>
              ) : (
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                >
                  <option value="" disabled>
                    -- Select Sales Rep --
                  </option>
                  {salesList.map((s) => (
                    <option key={s.sales_id} value={s.sales_id}>
                      {s.sales_name} ({s.sales_code}) - {s.area}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Field 4: CUSTOMER (Option A Global Customer) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>4. Customer *</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              >
                <option value="" disabled>
                  -- Select Customer --
                </option>
                {customers.map((cust) => {
                  const rel = customerCompanies.find(
                    (cc) => cc.customer_id === cust.customer_id && cc.company_id === selectedCompanyId
                  );
                  return (
                    <option key={cust.customer_id} value={cust.customer_id}>
                      {cust.customer_name} {rel ? `[Limit: ${formatIDR(rel.credit_limit)}]` : '[General]'}
                    </option>
                  );
                })}
              </select>

              {currentCustomerCompanyRelation && (
                <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                  {currentCompany?.company_code} Limit: {formatIDR(currentCustomerCompanyRelation.credit_limit)}
                </div>
              )}
            </div>
          </div>

          {/* Dates & Logistics Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30 Days, CBD"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line Items Table (Requirement #12: Price determined by Company!) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Order Line Items (Multi-Company Pricing Matrix)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Unit price is dynamically bound to <strong>{currentCompany?.company_name}</strong> price lists.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">
                      Price ({currentCompany?.company_code})
                    </th>
                    <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-blue-500"
                        >
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product_name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right font-mono tabular-nums focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right font-mono tabular-nums focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_percent}
                          onChange={(e) => handleItemChange(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right font-mono tabular-nums focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatIDR(
                          Math.round(
                            item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)
                          )
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes and Grand Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Notes & Logistics Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Warehouse address, shipping instructions, po reference..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatIDR(subtotal)}
                </span>
              </div>

              {/* PPN Switch & Settings */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxEnabled(!taxEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        taxEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          taxEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="font-bold text-slate-800">
                      Kenakan PPN:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        taxEnabled
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {taxEnabled ? `Aktif (${taxRate}%)` : 'Nonaktif (0%)'}
                    </span>
                  </div>

                  {taxEnabled && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Tarif:</span>
                      <select
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={11}>11% (Standar)</option>
                        <option value={12}>12%</option>
                        <option value={10}>10%</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2.5 text-slate-600">
                  <span>Nominal PPN:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {taxEnabled ? formatIDR(taxAmount) : 'Rp 0 (Bebas PPN)'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Tagihan:</span>
                <span className="font-mono tabular-nums text-blue-700 text-base">
                  {formatIDR(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirm & Create Sales Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
