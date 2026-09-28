import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Customer, CustomerCompany } from '../../types';
import { formatIDR } from '../../lib/currency';
import {
  Briefcase,
  Building2,
  Plus,
  Edit2,
  Layers,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Save,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    customerCompanies,
    companies,
    saveCustomer,
    saveCustomerCompany,
    currentUser,
  } = useERP();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.customer_id || ''
  );

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Form state
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<Customer['customer_type']>('corporate');

  // PT Terms Edit Modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<{
    company_id: string;
    customer_code: string;
    payment_terms: string;
    credit_limit: number;
    status: 'active' | 'inactive';
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const currentCustomer = customers.find((c) => c.customer_id === selectedCustomerId);
  const canManage = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  // Open add/edit customer
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustContact('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');
    setCustType('corporate');
    setError(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.customer_name);
    setCustContact(cust.contact_person);
    setCustEmail(cust.email);
    setCustPhone(cust.phone);
    setCustAddress(cust.address);
    setCustType(cust.customer_type);
    setError(null);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      const saved = saveCustomer({
        customer_id: editingCustomer ? editingCustomer.customer_id : undefined,
        customer_name: custName.trim(),
        contact_person: custContact.trim(),
        email: custEmail.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim(),
        customer_type: custType,
      });

      setSelectedCustomerId(saved.customer_id);
      setIsCustomerModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save customer.');
    }
  };

  // Open edit PT Terms for selected customer
  const handleOpenEditTerms = (companyId: string) => {
    if (!currentCustomer) return;
    const existing = customerCompanies.find(
      (cc) => cc.customer_id === currentCustomer.customer_id && cc.company_id === companyId
    );
    const comp = companies.find((c) => c.company_id === companyId);

    setEditingRelation({
      company_id: companyId,
      customer_code: existing?.customer_code || `CUST-${comp?.company_code}-00${customers.indexOf(currentCustomer) + 1}`,
      payment_terms: existing?.payment_terms || 'Net 30 Days',
      credit_limit: existing?.credit_limit || 50_000_000,
      status: existing?.status || 'active',
    });
    setIsTermsModalOpen(true);
  };

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer || !editingRelation) return;

    try {
      const existing = customerCompanies.find(
        (cc) => cc.customer_id === currentCustomer.customer_id && cc.company_id === editingRelation.company_id
      );

      saveCustomerCompany({
        id: existing?.id,
        customer_id: currentCustomer.customer_id,
        company_id: editingRelation.company_id,
        customer_code: editingRelation.customer_code,
        payment_terms: editingRelation.payment_terms,
        credit_limit: editingRelation.credit_limit,
        status: editingRelation.status,
      });

      setIsTermsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save terms.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Manajemen Mitra & Pelanggan</span>
              <span aria-hidden="true">·</span>
              <span>Tata Kelola Multi-PT</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Pelanggan & Termin Kredit PT
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Satu data master pelanggan yang dapat bertransaksi ke berbagai anak perusahaan dengan limit kredit dan termin pembayaran (TOP) independen.
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenAddCustomer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pelanggan Baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs lg:col-span-1">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider">
              Customer Directory
            </span>
            <span className="text-slate-400 font-medium">{customers.length} clients</span>
          </div>

          <div className="divide-y divide-slate-100">
            {customers.map((cust) => {
              const activeRelations = customerCompanies.filter(
                (cc) => cc.customer_id === cust.customer_id && cc.status === 'active'
              );
              const isSelected = cust.customer_id === selectedCustomerId;

              return (
                <button
                  key={cust.customer_id}
                  onClick={() => setSelectedCustomerId(cust.customer_id)}
                  className={`w-full text-left p-4 transition-colors flex items-start justify-between ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {cust.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Contact: {cust.contact_person}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                      Type: {cust.customer_type}
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    {activeRelations.length} PTs
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Details & PT Terms Matrix (Requirement #11) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs lg:col-span-2 space-y-6 p-6">
          {currentCustomer ? (
            <>
              {/* Header with edit button */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    Global Customer Entity
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {currentCustomer.customer_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentCustomer.address} · {currentCustomer.phone} · {currentCustomer.email}
                  </p>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleOpenEditCustomer(currentCustomer)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* Requirement #11: customer_companies table matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sub-Entity Relations (<code className="font-mono text-[11px]">customer_companies</code>)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure company-specific customer code, credit limits, and payment terms for each PT.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Operating PT</th>
                        <th className="py-3 px-4">Customer Code</th>
                        <th className="py-3 px-4">Payment Terms</th>
                        <th className="py-3 px-4 text-right">Credit Limit</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        {canManage && <th className="py-3 px-4 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {companies.map((comp) => {
                        const rel = customerCompanies.find(
                          (cc) =>
                            cc.customer_id === currentCustomer.customer_id &&
                            cc.company_id === comp.company_id
                        );

                        return (
                          <tr key={comp.company_id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span>{comp.company_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-700">
                              {rel?.customer_code || '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {rel?.payment_terms || '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                              {rel ? formatIDR(rel.credit_limit) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  rel && rel.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {rel ? rel.status : 'Not Configured'}
                              </span>
                            </td>
                            {canManage && (
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleOpenEditTerms(comp.company_id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                  {rel ? 'Configure' : '+ Setup Terms'}
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
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a customer to view and manage company terms.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Setup / Edit PT Terms */}
      {isTermsModalOpen && editingRelation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase">
                  Pengaturan Termin PT
                </div>
                <h3 className="text-base font-bold text-white">
                  Atur Batas Kredit & Termin Pembayaran
                </h3>
              </div>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerms} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <div className="font-bold text-slate-900">{currentCustomer?.customer_name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operating PT: <strong>{companies.find((c) => c.company_id === editingRelation.company_id)?.company_name}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Customer Code in this PT *
                </label>
                <input
                  type="text"
                  value={editingRelation.customer_code}
                  onChange={(e) =>
                    setEditingRelation({ ...editingRelation, customer_code: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Payment Terms *
                </label>
                <input
                  type="text"
                  value={editingRelation.payment_terms}
                  onChange={(e) =>
                    setEditingRelation({ ...editingRelation, payment_terms: e.target.value })
                  }
                  placeholder="e.g. Net 30 Days, Net 14 Days, CBD"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Credit Limit (IDR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={editingRelation.credit_limit}
                  onChange={(e) =>
                    setEditingRelation({
                      ...editingRelation,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editingRelation.status}
                  onChange={(e) =>
                    setEditingRelation({
                      ...editingRelation,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save PT Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Global Customer */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase">
                  Option A Global Customer
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingCustomer ? 'Edit Customer' : 'Add Global Customer'}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Customer / Corporate Name *
                </label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. PT ABC Retailindo"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={custContact}
                    onChange={(e) => setCustContact(e.target.value)}
                    placeholder="e.g. Hendrawan Kusuma"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="corporate">Corporate</option>
                    <option value="distributor">Distributor</option>
                    <option value="retail">Retail</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+62 21 555 9988"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="procurement@client.co.id"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  rows={2}
                  placeholder="Billing / Delivery address..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Global Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
