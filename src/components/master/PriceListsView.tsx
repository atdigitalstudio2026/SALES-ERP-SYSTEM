import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { PriceList, CustomerType } from '../../types';
import { formatIDR, formatDate } from '../../lib/currency';
import {
  Tag,
  Building2,
  Plus,
  Edit2,
  Info,
  CheckCircle,
  X,
  AlertCircle,
  Save,
} from 'lucide-react';

export const PriceListsView: React.FC = () => {
  const {
    priceLists,
    products,
    companies,
    customers,
    savePriceList,
    currentUser,
  } = useERP();

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceList | null>(null);

  // Form State
  const [formCompanyId, setFormCompanyId] = useState<string>(companies[0]?.company_id || '');
  const [formProductId, setFormProductId] = useState<string>(products[0]?.product_id || '');
  const [formCustomerType, setFormCustomerType] = useState<CustomerType | 'all'>('all');
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formMinQty, setFormMinQty] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(25000);
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [error, setError] = useState<string | null>(null);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const displayedPriceLists = priceLists.filter((pl) => {
    if (selectedCompanyFilter !== 'ALL' && pl.company_id !== selectedCompanyFilter) {
      return false;
    }
    if (selectedProductId !== 'ALL' && pl.product_id !== selectedProductId) {
      return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingPrice(null);
    setFormCompanyId(companies[0]?.company_id || '');
    setFormProductId(products[0]?.product_id || '');
    setFormCustomerType('all');
    setFormCustomerId('');
    setFormMinQty(1);
    setFormUnitPrice(25000);
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pl: PriceList) => {
    setEditingPrice(pl);
    setFormCompanyId(pl.company_id);
    setFormProductId(pl.product_id);
    setFormCustomerType(pl.customer_type);
    setFormCustomerId(pl.customer_id || '');
    setFormMinQty(pl.min_quantity);
    setFormUnitPrice(pl.unit_price);
    setFormEffectiveDate(pl.effective_date);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formUnitPrice <= 0) {
      setError('Unit price must be greater than zero.');
      return;
    }

    try {
      savePriceList({
        id: editingPrice ? editingPrice.id : undefined,
        company_id: formCompanyId,
        product_id: formProductId,
        customer_type: formCustomerType,
        customer_id: formCustomerId || undefined,
        min_quantity: formMinQty,
        unit_price: formUnitPrice,
        effective_date: formEffectiveDate,
        status: 'active',
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save price list rule.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Strategi Harga Komersial</span>
              <span aria-hidden="true">·</span>
              <span>Katalog Harga Multi-Entitas</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Harga Jual per Entitas PT
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Atur diferensiasi harga jual produk yang sama di tiap anak perusahaan, tipe pelanggan, dan batas kuantitas minimum.
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Atur Aturan Harga Baru</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Filter Berdasarkan PT
            </label>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Perusahaan</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Filter Berdasarkan Produk
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Produk</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.product_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modern Informative Advisory Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Otomatisasi Harga Berdasarkan PT Penjual</span>
          <p className="mt-0.5 text-[11px] text-blue-800 leading-relaxed">
            Harga jual otomatis terisi sesuai badan usaha (PT) yang dipilih di header Sales Order. Setiap entitas dapat menetapkan marjin keuntungan atau harga acuan yang berbeda untuk barang yang sama.
          </p>
        </div>
      </div>

      {/* Price Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Active Pricing Rules: <strong>{displayedPriceLists.length}</strong>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Table: price_lists
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Operating Company</th>
                <th className="py-3 px-4">Product Code & Name</th>
                <th className="py-3 px-4">Applicable Customer Type</th>
                <th className="py-3 px-4 text-right">Min Qty</th>
                <th className="py-3 px-4 text-right">Unit Price (IDR)</th>
                <th className="py-3 px-4">Effective Date</th>
                {canManage && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPriceLists.map((pl) => {
                const comp = companies.find((c) => c.company_id === pl.company_id);
                const prod = products.find((p) => p.product_id === pl.product_id);
                const specificCust = customers.find((c) => c.customer_id === pl.customer_id);

                return (
                  <tr key={pl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono mr-2">
                        {comp?.company_code}
                      </span>
                      <span className="font-medium text-slate-800">{comp?.company_name.replace('PT ', '')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{prod?.product_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{prod?.product_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      {specificCust ? (
                        <span className="font-semibold text-blue-700">Specific: {specificCust.customer_name}</span>
                      ) : (
                        <span className="uppercase text-[11px] font-semibold text-slate-700">
                          {pl.customer_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {pl.min_quantity} {prod?.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                      {formatIDR(pl.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(pl.effective_date)}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(pl)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Price Rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Price List Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase">
                  Aturan Harga Produk
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingPrice ? 'Edit Aturan Harga' : 'Tambah Aturan Harga Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  1. Company Entity *
                </label>
                <select
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_code} - {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  2. Product *
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({p.product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Tier
                  </label>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tiers</option>
                    <option value="corporate">Corporate</option>
                    <option value="distributor">Distributor</option>
                    <option value="retail">Retail</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Unit Price (IDR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  value={formUnitPrice}
                  onChange={(e) => setFormUnitPrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={formEffectiveDate}
                  onChange={(e) => setFormEffectiveDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Price Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
