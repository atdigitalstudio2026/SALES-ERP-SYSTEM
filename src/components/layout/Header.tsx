import React from 'react';
import { useERP } from '../../context/ERPContext';
import { USER_PERSONAS } from '../../lib/storage';
import { Building2, ShieldCheck, UserCheck, Layers, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchUserPersona,
    permittedCompanies,
    selectedCompanyId,
    setSelectedCompanyId,
    allowMultiCompany,
    setAllowMultiCompany,
    isFirebaseConnected,
    firebaseProjectId,
    resetAllData,
  } = useERP();

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
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Active Persona (RLS)
            </span>
            <select
              value={currentUser.user_id}
              onChange={(e) => switchUserPersona(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
            >
              {USER_PERSONAS.map((u) => (
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
    </header>
  );
};
