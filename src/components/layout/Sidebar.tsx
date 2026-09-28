import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Building2,
  Users2,
  Briefcase,
  Tag,
  BarChart3,
  History,
  Shield,
  PlusCircle,
  Package,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'orders'
  | 'payments'
  | 'products'
  | 'companies'
  | 'sales-access'
  | 'customers'
  | 'price-lists'
  | 'reports'
  | 'audit';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenCreateOrder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateOrder,
}) => {
  const { currentUser } = useERP();

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard & KPI', icon: LayoutDashboard },
    { id: 'orders', label: 'Sales Orders', icon: FileText },
    { id: 'payments', label: 'Payments & AR', icon: CreditCard },
    { id: 'reports', label: 'Multi-Company Reports', icon: BarChart3 },
    { id: 'products', label: 'Master Produk (Katalog)', icon: Package },
    { id: 'companies', label: 'Master Companies', icon: Building2 },
    { id: 'sales-access', label: 'Sales Access Matrix', icon: Users2 },
    { id: 'customers', label: 'Customers & PT Terms', icon: Briefcase },
    { id: 'price-lists', label: 'Price Lists per PT', icon: Tag },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Primary Action Button */}
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onOpenCreateOrder}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Sales Order</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Sales Operations
        </div>
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Master & Governance
        </div>
        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Session Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">Session Security</span>
        </div>
        <div className="text-[11px] text-slate-400 space-y-0.5">
          <div>User: <span className="text-slate-200">{currentUser.name}</span></div>
          <div>Role: <span className="capitalize text-blue-400">{currentUser.role.replace('_', ' ')}</span></div>
        </div>
      </div>
    </aside>
  );
};
