import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Building2, ShieldCheck, UserCheck, Layers, RotateCcw, Edit3, CheckCircle, X, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    userPersonas,
    switchUserPersona,
    updateUserPersona,
    permittedCompanies,
    selectedCompanyId,
    setSelectedCompanyId,
    allowMultiCompany,
    setAllowMultiCompany,
    isFirebaseConnected,
    firebaseProjectId,
    resetAllData,
  } = useERP();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleOpenEdit = () => {
    setEditName(currentUser.name);
    setEditEmail(currentUser.email);
    setSavedSuccess(false);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateUserPersona(currentUser.user_id, {
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setIsEditProfileOpen(false);
      setSavedSuccess(false);
    }, 900);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
          MC
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">
            Multi-Company Sales ERP
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Multi-Entity Enterprise System
          </span>
        </div>
      </div>

      {/* Zone 2 & 3: Global Company Filter, Role Switcher, Controls */}
      <div className="flex items-center gap-3">
        {/* Requirement #13 & #14: Global Company Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Entity Context
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer pr-4"
            >
              {currentUser.role !== 'sales' && (
                <option value="ALL">🏢 All Companies (Consolidated)</option>
              )}
              {permittedCompanies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Firebase Cloud Database Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50/80 border border-orange-200 text-xs text-orange-950 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-orange-700 tracking-wider leading-none">
              Cloud Database
            </span>
            <span className="font-mono text-[11px] font-semibold text-orange-900 mt-0.5">
              Firebase: {firebaseProjectId}
            </span>
          </div>
        </div>

        {/* ALLOW_MULTI_COMPANY Permission Toggle for Sales Testing */}
        {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
          <button
            type="button"
            onClick={() => setAllowMultiCompany(!allowMultiCompany)}
            title="Toggle ALLOW_MULTI_COMPANY permission for Sales"
            className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              allowMultiCompany
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Company Access: {allowMultiCompany ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* User Persona Switcher (For testing RLS & multi-company rules) */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
          <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Active Persona
              </span>
              <button
                type="button"
                onClick={handleOpenEdit}
                title="Ubah Nama Profil / Super Admin"
                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            <select
              value={currentUser.user_id}
              onChange={(e) => switchUserPersona(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer max-w-[210px] truncate"
            >
              {userPersonas.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={() => {
            if (confirm('Reset all demo data back to default initial state?')) {
              resetAllData();
            }
          }}
          title="Reset database seed data"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Modal: Edit Profil Pengguna / Super Admin */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Edit Profil Pengguna ({currentUser.role.toUpperCase()})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Role Akses
                </label>
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono font-bold text-[11px] uppercase">
                  {currentUser.role} (Semua Hak Akses Holding)
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ketik nama Super Admin baru..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@group.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-medium flex items-center gap-1.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Nama profil berhasil diperbarui!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
