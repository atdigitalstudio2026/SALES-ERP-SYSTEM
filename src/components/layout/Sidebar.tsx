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

  const navGroups: {
    title: string;
    items: { id: NavigationTab; label: string; icon: React.ElementType }[];
  }[] = [
    {
      title: 'Operasional',
      items: [
        { id: 'dashboard', label: 'Dashboard & Analitik', icon: LayoutDashboard },
        { id: 'orders', label: 'Sales Orders', icon: FileText },
        { id: 'payments', label: 'Pembayaran & Piutang', icon: CreditCard },
        { id: 'reports', label: 'Laporan Konsolidasi', icon: BarChart3 },
      ],
    },
    {
      title: 'Master Data',
      items: [
        { id: 'products', label: 'Master Produk (Katalog)', icon: Package },
        { id: 'companies', label: 'Anak Perusahaan (PT)', icon: Building2 },
        { id: 'sales-access', label: 'Tim Sales & Akses PT', icon: Users2 },
        { id: 'customers', label: 'Pelanggan & Termin', icon: Briefcase },
        { id: 'price-lists', label: 'Daftar Harga Jual PT', icon: Tag },
      ],
    },
    {
      title: 'Sistem & Keamanan',
      items: [{ id: 'audit', label: 'Audit Trail Aktivitas', icon: History }],
    },
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Primary Action Button */}
      <div className="p-4 border-b border-slate-800/80">
        <button
          onClick={onOpenCreateOrder}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Buat Sales Order</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Session Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200 text-[11px]">Sesi Login Aman</span>
        </div>
        <div className="text-[11px] text-slate-400 space-y-0.5">
          <div className="truncate">Nama: <span className="text-slate-200 font-medium">{currentUser.name}</span></div>
          <div>Role: <span className="capitalize text-blue-400 font-medium">{currentUser.role.replace('_', ' ')}</span></div>
        </div>
      </div>
    </aside>
  );
};
