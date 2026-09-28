import React, { useMemo } from 'react';
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
  LogOut,
  UserCheck,
  RotateCcw,
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
  onOpenResetModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateOrder,
  onOpenResetModal,
}) => {
  const { currentUser, logout } = useERP();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
  const isSales = currentUser.role === 'sales';

  const navGroups = useMemo(() => {
    const operationalItems: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
      {
        id: 'dashboard',
        label: isSales ? 'Dashboard Saya' : 'Dashboard & Analitik',
        icon: LayoutDashboard,
      },
      {
        id: 'orders',
        label: isSales ? 'Transaksi Saya (SO)' : 'Sales Orders',
        icon: FileText,
      },
      {
        id: 'payments',
        label: isSales ? 'Pembayaran Saya' : 'Pembayaran & Piutang',
        icon: CreditCard,
      },
    ];

    if (!isSales) {
      operationalItems.push({ id: 'reports', label: 'Laporan Konsolidasi', icon: BarChart3 });
    }

    const masterItems: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
      { id: 'products', label: 'Master Produk (Katalog)', icon: Package },
    ];

    if (isAdmin) {
      masterItems.push({ id: 'companies', label: 'Anak Perusahaan (PT)', icon: Building2 });
      masterItems.push({ id: 'sales-access', label: 'Tim Sales & Akses PT', icon: Users2 });
    }

    masterItems.push({ id: 'customers', label: 'Pelanggan & Termin', icon: Briefcase });
    masterItems.push({ id: 'price-lists', label: 'Daftar Harga Jual PT', icon: Tag });

    const groups: {
      title: string;
      items: { id: NavigationTab; label: string; icon: React.ElementType }[];
    }[] = [
      {
        title: 'Operasional',
        items: operationalItems,
      },
      {
        title: 'Master Data',
        items: masterItems,
      },
    ];

    if (isAdmin) {
      groups.push({
        title: 'Sistem & Keamanan',
        items: [{ id: 'audit', label: 'Audit Trail Aktivitas', icon: History }],
      });
    }

    return groups;
  }, [isAdmin, isSales]);

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

      {/* Bottom Session Box with Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 text-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200 text-[11px]">
              {isSuperAdmin ? 'Akses Superadmin' : 'Sesi Login Sales'}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isSuperAdmin
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
            }`}
          >
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 space-y-1">
          <div className="truncate">
            User:{' '}
            <strong className="text-white font-mono">
              {currentUser.username || currentUser.name}
            </strong>
          </div>
          {isSales && (
            <div className="text-[10px] text-amber-400/90">
              🔒 Terbatas: Hanya transaksi pribadi
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar (Logout)</span>
        </button>

        {isSuperAdmin && onOpenResetModal && (
          <button
            type="button"
            onClick={onOpenResetModal}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/50 hover:border-rose-700/70 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
            title="Reset data transaksi ke 0 untuk memulai sistem baru"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset Transaksi ke Nol</span>
          </button>
        )}
      </div>
    </aside>
  );
};
