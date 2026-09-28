import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatDateTime } from '../../lib/currency';
import { History, Building2, Search, Filter, Shield } from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const { filteredAuditLogs, companies, selectedCompanyId, setSelectedCompanyId, permittedCompanies, currentUser } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');

  const displayedLogs = useMemo(() => {
    return filteredAuditLogs.filter((log) => {
      if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          log.description.toLowerCase().includes(query) ||
          log.user_name.toLowerCase().includes(query) ||
          log.record_identifier.toLowerCase().includes(query) ||
          log.company_code.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [filteredAuditLogs, moduleFilter, actionFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Security & Traceability</span>
              <span aria-hidden="true">·</span>
              <span>Requirement #17: Structured Audit Protocol</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable activity records capturing user, action, module, company entity, and target records.
            </p>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Log Standard
              </span>
              <div className="font-mono text-xs font-bold text-slate-900">
                [USER] | [ACTION] | [MODULE] | [COMPANY] | [RECORD]
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, SO, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {currentUser.role !== 'sales' && (
                <option value="ALL">All Companies</option>
              )}
              {permittedCompanies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Modules</option>
              <option value="SALES_ORDER">Sales Orders</option>
              <option value="PAYMENT">Payments</option>
              <option value="CUSTOMER">Customers</option>
              <option value="COMPANY">Companies</option>
              <option value="PRICE_LIST">Price Lists</option>
              <option value="ACCESS_CONTROL">Access Control</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Recorded Events: <strong>{displayedLogs.length}</strong>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Audit Retention: Active Session
          </span>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No audit events match your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider font-sans">
                <tr>
                  <th className="py-2.5 px-4 w-44">Timestamp</th>
                  <th className="py-2.5 px-4">Requirement #17 Formatted Event Log</th>
                  <th className="py-2.5 px-4 text-center w-28">Entity Code</th>
                  <th className="py-2.5 px-4 text-center w-28">Action</th>
                  <th className="py-2.5 px-4 w-36">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLogs.map((log) => {
                  const comp = companies.find((c) => c.company_id === log.company_id);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-bold">
                        <span className="text-blue-700 font-bold">{log.description}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                          {log.company_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'PAYMENT'
                              ? 'bg-blue-100 text-blue-800'
                              : log.action === 'STATUS_CHANGE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans text-xs">
                        {log.module}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
