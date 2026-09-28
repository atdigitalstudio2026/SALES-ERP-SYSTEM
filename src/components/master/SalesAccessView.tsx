import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalesPerson, SalesStatus } from '../../types';
import {
  Users2,
  Building2,
  ShieldCheck,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Info,
  AlertCircle,
  Save,
  UserCheck,
  UserX,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

export const SalesAccessView: React.FC = () => {
  const {
    salesList,
    companies,
    salesAccess,
    orders,
    updateSalesAccess,
    saveSales,
    deleteSales,
    updateSalesCredentials,
    allowMultiCompany,
    setAllowMultiCompany,
    currentUser,
  } = useERP();

  const [selectedSalesId, setSelectedSalesId] = useState<string>(
    salesList[0]?.sales_id || ''
  );

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form States
  const [salesName, setSalesName] = useState('');
  const [salesCode, setSalesCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryCompanyId, setPrimaryCompanyId] = useState(companies[0]?.company_id || '');
  const [area, setArea] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<SalesStatus>('active');
  const [error, setError] = useState<string | null>(null);

  // Dedicated Credentials Modal States
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [targetSalesForCreds, setTargetSalesForCreds] = useState<SalesPerson | null>(null);
  const [editAccessCode, setEditAccessCode] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [revealedPasswordId, setRevealedPasswordId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const currentSales = salesList.find((s) => s.sales_id === selectedSalesId) || salesList[0];

  // Get current access list for selected sales
  const currentAccesses = currentSales
    ? salesAccess.filter((a) => a.sales_id === currentSales.sales_id)
    : [];

  // Count existing orders for safety check on deletion
  const existingOrdersCount = currentSales
    ? orders.filter((o) => o.sales_id === currentSales.sales_id).length
    : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextSeq = salesList.length + 1;
    const defCode = `SLS-${String(nextSeq).padStart(3, '0')}`;
    setSalesName('');
    setSalesCode(defCode);
    setAccessCode(defCode);
    setPassword(`sales${nextSeq}123`);
    setEmail('');
    setPhone('');
    setPrimaryCompanyId(companies[0]?.company_id || '');
    setArea('Jabodetabek');
    setPosition('Sales Executive');
    setStatus('active');
    setError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sales: SalesPerson) => {
    setSalesName(sales.sales_name);
    setSalesCode(sales.sales_code);
    setAccessCode(sales.access_code || sales.sales_code);
    setPassword(sales.password || 'sales123');
    setEmail(sales.email);
    setPhone(sales.phone);
    setPrimaryCompanyId(sales.company_id);
    setArea(sales.area);
    setPosition(sales.position);
    setStatus(sales.status);
    setError(null);
    setIsEditModalOpen(true);
  };

  // Open Credentials Quick Modal
  const handleOpenCredentialsModal = (sales: SalesPerson) => {
    setTargetSalesForCreds(sales);
    setEditAccessCode(sales.access_code || sales.sales_code);
    setEditPassword(sales.password || 'sales123');
    setIsCredentialsModalOpen(true);
  };

  const handleSaveCredentialsModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSalesForCreds) return;
    if (!editAccessCode.trim()) {
      alert('Kode Akses tidak boleh kosong.');
      return;
    }
    if (!editPassword.trim()) {
      alert('Password tidak boleh kosong.');
      return;
    }

    updateSalesCredentials(targetSalesForCreds.sales_id, editAccessCode, editPassword);
    setIsCredentialsModalOpen(false);
    setCopiedNotice(`Kredensial login untuk ${targetSalesForCreds.sales_name} berhasil diperbarui!`);
    setTimeout(() => setCopiedNotice(null), 3500);
  };

  const handleCopyCredentials = (sales: SalesPerson) => {
    const code = sales.access_code || sales.sales_code;
    const pwd = sales.password || 'sales123';
    const text = `Kredensial Login Sales ERP:\nNama: ${sales.sales_name}\nKode Akses (Username): ${code}\nPassword: ${pwd}`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(`Kredensial ${sales.sales_name} berhasil disalin!`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // Submit Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!salesName.trim() || !salesCode.trim() || !primaryCompanyId) {
      setError('Nama Sales, Kode Sales, dan Perusahaan Utama wajib diisi.');
      return;
    }

    try {
      const saved = saveSales({
        sales_name: salesName.trim(),
        sales_code: salesCode.trim().toUpperCase(),
        access_code: (accessCode.trim() || salesCode.trim()).toUpperCase(),
        password: password.trim() || 'sales123',
        email: email.trim(),
        phone: phone.trim(),
        company_id: primaryCompanyId,
        area: area.trim(),
        position: position.trim(),
        status,
      });

      setSelectedSalesId(saved.sales_id);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan sales baru.');
    }
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSales) return;
    setError(null);

    if (!salesName.trim() || !salesCode.trim() || !primaryCompanyId) {
      setError('Nama Sales, Kode Sales, dan Perusahaan Utama wajib diisi.');
      return;
    }

    try {
      saveSales({
        sales_id: currentSales.sales_id,
        sales_name: salesName.trim(),
        sales_code: salesCode.trim().toUpperCase(),
        access_code: (accessCode.trim() || salesCode.trim()).toUpperCase(),
        password: password.trim() || currentSales.password || 'sales123',
        email: email.trim(),
        phone: phone.trim(),
        company_id: primaryCompanyId,
        area: area.trim(),
        position: position.trim(),
        status,
      });

      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui sales.');
    }
  };

  // Submit Delete
  const handleConfirmDelete = () => {
    if (!currentSales) return;

    try {
      deleteSales(currentSales.sales_id);
      setIsDeleteModalOpen(false);
      // Select first available remaining sales
      const remaining = salesList.filter((s) => s.sales_id !== currentSales.sales_id);
      if (remaining.length > 0) {
        setSelectedSalesId(remaining[0].sales_id);
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus sales.');
    }
  };

  // Toggle Sales Active / Inactive Status
  const handleToggleSalesStatus = (sales: SalesPerson) => {
    const newStatus: SalesStatus = sales.status === 'active' ? 'inactive' : 'active';
    saveSales({
      ...sales,
      sales_id: sales.sales_id,
      status: newStatus,
    });
  };

  const handleToggleAccess = (companyId: string) => {
    if (!currentSales) return;
    const existing = currentAccesses.find((a) => a.company_id === companyId);
    const isCurrentlyActive = !!existing;

    // Build new list
    const updatedList = companies.map((c) => {
      const match = currentAccesses.find((a) => a.company_id === c.company_id);
      let hasAccess = match ? true : false;
      let isDefault = match?.is_default || false;

      if (c.company_id === companyId) {
        hasAccess = !isCurrentlyActive;
        if (!hasAccess && isDefault) {
          isDefault = false; // Cannot be default if access revoked
        }
      }

      return {
        company_id: c.company_id,
        is_default: isDefault,
        has_access: hasAccess,
      };
    });

    // Ensure at least one default company exists
    if (!updatedList.some((item) => item.has_access && item.is_default)) {
      const firstActive = updatedList.find((item) => item.has_access);
      if (firstActive) firstActive.is_default = true;
    }

    updateSalesAccess(currentSales.sales_id, updatedList);
  };

  const handleSetDefault = (companyId: string) => {
    if (!currentSales) return;

    const updatedList = companies.map((c) => {
      const match = currentAccesses.find((a) => a.company_id === c.company_id);
      const hasAccess = match ? true : false;

      return {
        company_id: c.company_id,
        is_default: c.company_id === companyId,
        has_access: c.company_id === companyId ? true : hasAccess,
      };
    });

    updateSalesAccess(currentSales.sales_id, updatedList);
  };

  return (
    <div className="space-y-6">
      {/* Toast / Notification Banner */}
      {copiedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copiedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCopiedNotice(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Manajemen Tim Sales & Akses Entitas</span>
              <span aria-hidden="true">·</span>
              <span>Otorisasi Penjualan Multi-PT</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Sales & Matriks Akses Perusahaan
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelola data sales (tambah, edit, hapus) serta izin akses transaksi antar anak perusahaan dalam satu tempat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* ALLOW_MULTI_COMPANY Permission Toggle */}
            {canManage && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>ALLOW_MULTI_COMPANY</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {allowMultiCompany ? 'Sales bebas pilih PT' : 'Sales dikunci ke PT default'}
                  </div>
                </div>

                <button
                  onClick={() => setAllowMultiCompany(!allowMultiCompany)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    allowMultiCompany
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {allowMultiCompany ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            )}

            {/* Tambah Sales Button */}
            {canManage && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Sales</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sales Reps List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs lg:col-span-1">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider">
              Daftar Sales ({salesList.length})
            </span>
            {canManage && (
              <button
                onClick={handleOpenAdd}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {salesList.map((sales) => {
              const primaryComp = companies.find((c) => c.company_id === sales.company_id);
              const accessCount = salesAccess.filter(
                (a) => a.sales_id === sales.sales_id && a.status === 'active'
              ).length;
              const isSelected = sales.sales_id === selectedSalesId;

              return (
                <button
                  key={sales.sales_id}
                  onClick={() => setSelectedSalesId(sales.sales_id)}
                  className={`w-full text-left p-4 transition-colors flex items-start justify-between ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>{sales.sales_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({sales.sales_code})</span>
                      {sales.status === 'inactive' && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sales.position} · {sales.area}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">
                      PT Utama: <span className="font-semibold text-slate-800">{primaryComp?.company_code}</span>
                    </div>
                    <div className="text-[10px] text-blue-700 bg-blue-50/80 border border-blue-100 px-1.5 py-0.5 rounded mt-1.5 inline-flex items-center gap-1 font-mono">
                      <KeyRound className="w-3 h-3 text-blue-600" />
                      <span>User: {sales.access_code || sales.sales_code}</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    {accessCount} {accessCount === 1 ? 'PT' : 'PTs'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Multi-Company Access Matrix Table (Requirement #6) & Management Actions */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs lg:col-span-2">
          {currentSales ? (
            <>
              {/* Sales Header & Action Buttons (Edit / Delete / Toggle Status) */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      Profil & Izin Akses Sales
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                        currentSales.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentSales.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentSales.sales_name}</span>
                    <span className="font-mono text-xs font-normal text-slate-500">
                      ({currentSales.sales_code})
                    </span>
                  </h2>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {currentSales.position} · Wilayah: <strong>{currentSales.area}</strong> · Tel: {currentSales.phone || '-'} · Email: {currentSales.email || '-'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Perusahaan Terdaftar (Primary PT):{' '}
                    <strong className="text-slate-800">
                      {companies.find((c) => c.company_id === currentSales.company_id)?.company_name} (
                      {companies.find((c) => c.company_id === currentSales.company_id)?.company_code})
                    </strong>
                  </div>
                </div>

                {/* Action Buttons for Edit & Delete */}
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(currentSales)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      title="Edit Nama dan Data Sales"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Sales</span>
                    </button>

                    <button
                      onClick={() => handleToggleSalesStatus(currentSales)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        currentSales.status === 'active'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={currentSales.status === 'active' ? 'Nonaktifkan Sales' : 'Aktifkan Sales'}
                    >
                      {currentSales.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors"
                      title="Hapus Sales"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dedicated Credentials Card given by Superadmin */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Kode Akses Login & Password Sales</span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded">
                          Dikelola Superadmin
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Kredensial login akun agar sales hanya dapat melihat transaksi miliknya sendiri.
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(currentSales)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Salin kredensial untuk dikirim ke sales"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Salin Kredensial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCredentialsModal(currentSales)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                        title="Beri atau ubah kode akses / password sales"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Beri / Ubah Password</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Kode Akses (Username)
                    </div>
                    <div className="font-mono font-bold text-sm text-blue-900 mt-1 flex items-center justify-between">
                      <span>{currentSales.access_code || currentSales.sales_code}</span>
                      <span className="text-[10px] font-normal text-slate-400">Login ID</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span>Password Akun</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedPasswordId(
                            revealedPasswordId === currentSales.sales_id ? null : currentSales.sales_id
                          )
                        }
                        className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {revealedPasswordId === currentSales.sales_id ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Sembunyikan</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-800 mt-1">
                      {revealedPasswordId === currentSales.sales_id
                        ? currentSales.password || 'sales123'
                        : '••••••••••••'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Hak Akses Sistem
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hanya Transaksi Sendiri</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Superadmin: Akses Penuh
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Section */}
              <div className="p-4 sm:p-5">
                <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Konfigurasi sales_company_access:</strong>
                    <p className="mt-0.5 text-[11px] text-blue-800">
                      Tentukan perusahaan (PT) mana saja yang diizinkan untuk dibuatkan transaksi oleh <strong>{currentSales.sales_name}</strong>. Satu sales bisa memiliki akses ke beberapa PT tanpa membuat akun duplikat.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Perusahaan / Legal Entity</th>
                        <th className="py-3 px-4 text-center">Kode PT</th>
                        <th className="py-3 px-4 text-center">Akses Diberikan</th>
                        <th className="py-3 px-4 text-center">PT Default (Primary)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {companies.map((comp) => {
                        const access = currentAccesses.find((a) => a.company_id === comp.company_id);
                        const hasAccess = !!access;
                        const isDefault = !!access?.is_default;

                        return (
                          <tr key={comp.company_id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{comp.company_name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                              {comp.company_code}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAccess(comp.company_id)}
                                  className={`px-3 py-1 rounded text-xs font-bold transition-colors inline-flex items-center gap-1 ${
                                    hasAccess
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  {hasAccess ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>YES</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3.5 h-3.5" />
                                      <span>NO</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span
                                  className={`px-2.5 py-0.5 rounded text-xs font-bold inline-block ${
                                    hasAccess
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {hasAccess ? 'YES' : 'NO'}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {canManage ? (
                                <button
                                  type="button"
                                  disabled={!hasAccess}
                                  onClick={() => handleSetDefault(comp.company_id)}
                                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                    isDefault
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {isDefault ? 'PRIMARY' : 'Set Primary'}
                                </button>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold inline-block ${
                                    isDefault
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isDefault ? 'YES' : '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Users2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Belum ada data sales.</p>
              <p className="mt-1">Klik tombol "+ Tambah Sales" untuk menambahkan tim sales pertama Anda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah Sales Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase">Master Sales</div>
                <h3 className="text-base font-bold text-white">Tambah Sales Representative Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">
                    Nama Lengkap Sales *
                  </label>
                  <input
                    type="text"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                    placeholder="e.g. Riko Pratama"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-bold text-slate-900 mb-1">
                    Kode Sales *
                  </label>
                  <input
                    type="text"
                    value={salesCode}
                    onChange={(e) => setSalesCode(e.target.value.toUpperCase())}
                    placeholder="SLS-005"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Perusahaan Tempat Terdaftar (Primary Company) *
                </label>
                <select
                  value={primaryCompanyId}
                  onChange={(e) => setPrimaryCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_code} - {c.company_name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Akan otomatis didaftarkan sebagai PT default di sales_company_access.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Sales
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@company.co.id"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wilayah / Area Kerja
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Jabodetabek, Jawa Timur"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Account Executive"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Credentials Configuration for Sales */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kredensial Login Sales (Diberikan Superadmin)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Kode Akses (Username) *
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="SLS-005"
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                    <span className="text-[10px] text-slate-500">Kode unik login sales</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Password Login *
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="sales123"
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500">Password akun sales</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SalesStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktif (Dapat Bertransaksi)</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Sales Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Sales */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase">Edit Sales</div>
                <h3 className="text-base font-bold text-white">Ubah Data: {currentSales?.sales_name}</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">
                    Nama Lengkap Sales *
                  </label>
                  <input
                    type="text"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-bold text-slate-900 mb-1">
                    Kode Sales *
                  </label>
                  <input
                    type="text"
                    value={salesCode}
                    onChange={(e) => setSalesCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Perusahaan Tempat Terdaftar (Primary Company) *
                </label>
                <select
                  value={primaryCompanyId}
                  onChange={(e) => setPrimaryCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_code} - {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Sales
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wilayah / Area Kerja
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Credentials Configuration for Sales */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kredensial Login Sales (Diberikan Superadmin)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Kode Akses (Username) *
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                    <span className="text-[10px] text-slate-500">Kode unik login sales</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Password Login *
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500">Password akun sales</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SalesStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Sales */}
      {isDeleteModalOpen && currentSales && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Sales</h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 text-red-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                Apakah Anda yakin ingin menghapus sales representative <strong>{currentSales.sales_name}</strong> ({currentSales.sales_code})?
              </p>

              {existingOrdersCount > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Perhatian: Ada {existingOrdersCount} Pesanan Terkait</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Sales ini telah membuat <strong>{existingOrdersCount} Sales Order</strong> di sistem. Disarankan untuk memilih opsi <strong>"Nonaktifkan"</strong> agar riwayat invoice & faktur tidak terganggu.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">
                  Sales ini belum memiliki riwayat transaksi, aman untuk dihapus secara permanen dari sistem.
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                {existingOrdersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleSalesStatus(currentSales);
                      setIsDeleteModalOpen(false);
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Nonaktifkan Saja
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Beri / Ubah Kode Akses & Password Sales */}
      {isCredentialsModalOpen && targetSalesForCreds && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    Otorisasi Superadmin
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Beri Kredensial Login Sales
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentialsModal} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900 text-sm">
                  {targetSalesForCreds.sales_name}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Kode Sales: <span className="font-mono font-bold text-slate-700">{targetSalesForCreds.sales_code}</span> · {targetSalesForCreds.position}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kode Akses Login (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={editAccessCode}
                  onChange={(e) => setEditAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SLS-001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Kode akses yang digunakan oleh sales untuk login ke sistem.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Password Baru *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.random().toString(36).slice(-6);
                      setEditPassword(`sales${rand}`);
                    }}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    + Generate Acak
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Password yang diberikan Superadmin kepada sales untuk masuk ke aplikasi.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Setelah disimpan, sales <strong>{targetSalesForCreds.sales_name}</strong> dapat langsung login menggunakan kode akses dan password ini, dan hanya akan dapat melihat transaksi penjualannya sendiri.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kredensial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
