import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Company, CompanyStatus } from '../../types';
import { formatDate } from '../../lib/currency';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  ShieldAlert,
  X,
  AlertCircle,
  Save,
} from 'lucide-react';

export const CompaniesView: React.FC = () => {
  const { companies, saveCompany, toggleCompanyStatus, currentUser } = useERP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form State
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [status, setStatus] = useState<CompanyStatus>('active');
  const [error, setError] = useState<string | null>(null);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setCompanyCode('');
    setCompanyName('');
    setLegalName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setTaxNumber('');
    setStatus('active');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setCompanyCode(comp.company_code);
    setCompanyName(comp.company_name);
    setLegalName(comp.legal_name);
    setAddress(comp.address);
    setPhone(comp.phone);
    setEmail(comp.email);
    setTaxNumber(comp.tax_number);
    setStatus(comp.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyCode.trim() || !companyName.trim() || !taxNumber.trim()) {
      setError('Company code, name, and NPWP are required fields.');
      return;
    }

    try {
      saveCompany({
        company_id: editingCompany ? editingCompany.company_id : undefined,
        company_code: companyCode.trim().toUpperCase(),
        company_name: companyName.trim(),
        legal_name: legalName.trim() || companyName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        tax_number: taxNumber.trim(),
        status,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save company.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Master Entity Configuration</span>
              <span aria-hidden="true">·</span>
              <span>Requirement #1 & #22: Multi-Entity Foundation</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Companies (Legal Entities)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Independent corporate subsidiaries within one unified ERP instance.
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Legal Entity (Req #22)</span>
            </button>
          )}
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Registered Entities: <strong>{companies.length}</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            Primary UUID Foreign Key Reference
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Entity Code</th>
                <th className="py-3 px-4">Company Name & Legal Title</th>
                <th className="py-3 px-4">NPWP / Tax Number</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManage && <th className="py-3 px-4 text-center">Admin Controls</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.company_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs border border-slate-200">
                      {c.company_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{c.company_name}</div>
                    <div className="text-[11px] text-slate-500">{c.legal_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      UUID: {c.company_id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                    {c.tax_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{c.phone}</div>
                    <div className="text-slate-500 text-[11px]">{c.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={c.address}>
                    {c.address}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        c.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Company Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleCompanyStatus(c.company_id)}
                          className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                            c.status === 'active'
                              ? 'text-red-700 bg-red-50 hover:bg-red-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title="Activate / Deactivate Company (Requirement #1)"
                        >
                          {c.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Legal Entity (Requirement #22: Extensibility) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  Requirement #1 & #22
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingCompany ? 'Edit Legal Entity' : 'Add New Legal Entity'}
                </h2>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-900 mb-1">
                    Entity Code *
                  </label>
                  <input
                    type="text"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Prefix for SO Number</p>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. PT ABC Indonesia"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Legal Corporate Name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. PT ABC Indonesia Makmur Tbk"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    NPWP / Tax Number *
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="01.234.567.8-012.000"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entity Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active (Operational)</option>
                    <option value="inactive">Inactive</option>
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 21 555 1234"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@company.co.id"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Legal Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Official office or warehouse address..."
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
                  <span>Save Legal Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
