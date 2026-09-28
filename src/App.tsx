import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { OrderListView } from './components/orders/OrderListView';
import { PaymentListView } from './components/payments/PaymentListView';
import { CompaniesView } from './components/master/CompaniesView';
import { SalesAccessView } from './components/master/SalesAccessView';
import { CustomersView } from './components/master/CustomersView';
import { PriceListsView } from './components/master/PriceListsView';
import { ProductsView } from './components/master/ProductsView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { CreateOrderModal } from './components/orders/CreateOrderModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';
import { InvoicePrintView } from './components/orders/InvoicePrintView';
import { LoginView } from './components/auth/LoginView';
import { ResetDataModal } from './components/admin/ResetDataModal';
import { SalesOrder } from './types';

const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<SalesOrder | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { orders, currentUser } = useERP();

  // If a sales user is active, ensure they cannot land on restricted Superadmin pages
  React.useEffect(() => {
    if (
      currentUser.role === 'sales' &&
      (currentTab === 'companies' ||
        currentTab === 'sales-access' ||
        currentTab === 'audit' ||
        currentTab === 'reports')
    ) {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  const handleSelectOrder = (order: SalesOrder) => {
    setSelectedOrderForDetail(order);
    setIsDetailOpen(true);
  };

  const handleSelectOrderById = (orderId: string) => {
    const found = orders.find((o) => o.so_id === orderId);
    if (found) {
      setSelectedOrderForDetail(found);
      setIsDetailOpen(true);
    }
  };

  const handleOpenRecordPayment = (order: SalesOrder) => {
    setSelectedOrderForPayment(order);
    setIsPaymentOpen(true);
  };

  const handleOpenPrintInvoice = (order: SalesOrder) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onSelectOrder={handleSelectOrder}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'orders' && (
            <OrderListView
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onSelectOrder={handleSelectOrder}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenPrintInvoice={handleOpenPrintInvoice}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentListView onSelectOrderById={handleSelectOrderById} />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'products' && <ProductsView onNavigateToTab={setCurrentTab} />}

          {currentTab === 'companies' && <CompaniesView />}

          {currentTab === 'sales-access' && <SalesAccessView />}

          {currentTab === 'customers' && <CustomersView />}

          {currentTab === 'price-lists' && <PriceListsView />}

          {currentTab === 'audit' && <AuditLogView />}
        </main>
      </div>

      {/* Global Modals */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onSuccess={(newOrderId) => {
          handleSelectOrderById(newOrderId);
        }}
      />

      <OrderDetailModal
        order={selectedOrderForDetail}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrderForDetail(null);
        }}
        onOpenRecordPayment={(order) => {
          setIsDetailOpen(false);
          handleOpenRecordPayment(order);
        }}
        onOpenPrintInvoice={(order) => {
          setIsDetailOpen(false);
          handleOpenPrintInvoice(order);
        }}
      />

      <RecordPaymentModal
        order={selectedOrderForPayment}
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedOrderForPayment(null);
        }}
        onSuccess={(payId) => {
          // If we had an open detail order, refresh it
          if (selectedOrderForPayment) {
            const refreshed = orders.find((o) => o.so_id === selectedOrderForPayment.so_id);
            if (refreshed) {
              setSelectedOrderForDetail(refreshed);
              setIsDetailOpen(true);
            }
          }
        }}
      />

      {isInvoiceOpen && (
        <InvoicePrintView
          order={selectedOrderForInvoice}
          onClose={() => {
            setIsInvoiceOpen(false);
            setSelectedOrderForInvoice(null);
          }}
        />
      )}

      {/* Global Superadmin Reset Modal */}
      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { isLoggedIn } = useERP();

  if (!isLoggedIn) {
    return <LoginView />;
  }

  return <MainAppContent />;
};

export default function App() {
  return (
    <ERPProvider>
      <AppRoot />
    </ERPProvider>
  );
}
