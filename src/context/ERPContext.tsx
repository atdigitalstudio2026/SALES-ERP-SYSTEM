import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Company,
  SalesPerson,
  SalesCompanyAccess,
  Customer,
  CustomerCompany,
  Product,
  PriceList,
  SalesOrder,
  Payment,
  AuditLog,
  CurrentUser,
  UserRole,
} from '../types';
import { storage, USER_PERSONAS } from '../lib/storage';
import { firestoreSync } from '../lib/firestoreSync';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';

interface ERPContextType {
  // Master data
  companies: Company[];
  salesList: SalesPerson[];
  salesAccess: SalesCompanyAccess[];
  customers: Customer[];
  customerCompanies: CustomerCompany[];
  products: Product[];
  priceLists: PriceList[];
  orders: SalesOrder[];
  payments: Payment[];
  auditLogs: AuditLog[];

  // Firebase integration status
  isFirebaseConnected: boolean;
  firebaseProjectId: string;

  // App & Security State
  currentUser: CurrentUser;
  switchUserPersona: (userId: string) => void;
  allowMultiCompany: boolean;
  setAllowMultiCompany: (allowed: boolean) => void;

  // Multi-Company Filter (Requirement #13, #14)
  selectedCompanyId: string; // 'ALL' or UUID
  setSelectedCompanyId: (id: string) => void;
  selectedCompany: Company | null; // null if 'ALL'

  // Permitted Companies for Current User (RLS)
  permittedCompanies: Company[];
  defaultSalesCompany: Company | null;

  // Filtered Data based on RLS & Active Company Filter
  filteredOrders: SalesOrder[];
  filteredPayments: Payment[];
  filteredAuditLogs: AuditLog[];

  // Actions
  createOrUpdateOrder: (data: Parameters<typeof storage.saveSalesOrder>[0]) => SalesOrder;
  recordPayment: (data: Parameters<typeof storage.recordPayment>[0]) => Payment;
  saveCompany: (data: Parameters<typeof storage.saveCompany>[0]) => Company;
  toggleCompanyStatus: (id: string) => Company;
  saveSales: (data: Parameters<typeof storage.saveSales>[0]) => SalesPerson;
  deleteSales: (salesId: string) => void;
  updateSalesAccess: (salesId: string, companyAccessList: { company_id: string; is_default: boolean; has_access: boolean }[]) => void;
  saveCustomer: (data: Parameters<typeof storage.saveCustomer>[0]) => Customer;
  saveCustomerCompany: (data: Parameters<typeof storage.saveCustomerCompany>[0]) => CustomerCompany;
  savePriceList: (data: Parameters<typeof storage.savePriceList>[0]) => PriceList;
  resolvePrice: (companyId: string, productId: string, customerType?: string, customerId?: string, qty?: number) => number;
  resetAllData: () => void;
  refreshData: () => void;
}

const ERPContext = createContext<ERPContextType | null>(null);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [salesList, setSalesList] = useState<SalesPerson[]>([]);
  const [salesAccess, setSalesAccess] = useState<SalesCompanyAccess[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerCompanies, setCustomerCompanies] = useState<CustomerCompany[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [currentUser, setCurrentUserState] = useState<CurrentUser>(storage.getCurrentUser());
  const [allowMultiCompany, setAllowMultiCompanyState] = useState<boolean>(storage.getAllowMultiCompany());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const loadData = () => {
    setCompanies(storage.getCompanies());
    setSalesList(storage.getSales());
    setSalesAccess(storage.getSalesCompanyAccess());
    setCustomers(storage.getCustomers());
    setCustomerCompanies(storage.getCustomerCompanies());
    setProducts(storage.getProducts());
    setPriceLists(storage.getPriceLists());
    setOrders(storage.getSalesOrders());
    setPayments(storage.getPayments());
    setAuditLogs(storage.getAuditLogs());
    setAllowMultiCompanyState(storage.getAllowMultiCompany());
  };

  useEffect(() => {
    loadData();
    firestoreSync.init(() => {
      loadData();
    }).then((connected) => {
      setIsFirebaseConnected(connected);
    });
  }, []);

  const switchUserPersona = (userId: string) => {
    const found = USER_PERSONAS.find((u) => u.user_id === userId);
    if (found) {
      storage.setCurrentUser(found);
      setCurrentUserState(found);
      // If switching to sales, adjust company filter to their default or ALL if permitted
      if (found.role === 'sales') {
        const salesDefaultAccess = storage.getAccessForSales(found.sales_id || '').find((a) => a.is_default);
        if (salesDefaultAccess) {
          setSelectedCompanyId(salesDefaultAccess.company_id);
        } else if (found.company_id) {
          setSelectedCompanyId(found.company_id);
        }
      } else {
        setSelectedCompanyId('ALL');
      }
    }
  };

  const setAllowMultiCompany = (allowed: boolean) => {
    storage.setAllowMultiCompany(allowed);
    setAllowMultiCompanyState(allowed);
  };

  // Determine permitted companies for the active user (RLS Isolation)
  const permittedCompanies = useMemo(() => {
    const activeCompanies = companies.filter((c) => c.status === 'active');

    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      return activeCompanies;
    }

    if (currentUser.role === 'finance') {
      return activeCompanies.filter((c) => currentUser.allowed_company_ids.includes(c.company_id));
    }

    if (currentUser.role === 'sales' && currentUser.sales_id) {
      // Look up sales_company_access
      const myAccesses = salesAccess.filter((a) => a.sales_id === currentUser.sales_id && a.status === 'active');
      if (allowMultiCompany) {
        // Multi-company enabled: sales can access all assigned active companies
        const accessCompIds = myAccesses.map((a) => a.company_id);
        return activeCompanies.filter((c) => accessCompIds.includes(c.company_id));
      } else {
        // Multi-company disabled: restricted to default company only!
        const defaultAccess = myAccesses.find((a) => a.is_default);
        const targetId = defaultAccess ? defaultAccess.company_id : currentUser.company_id;
        return activeCompanies.filter((c) => c.company_id === targetId);
      }
    }

    return activeCompanies;
  }, [companies, currentUser, salesAccess, allowMultiCompany]);

  // Default company for current sales user
  const defaultSalesCompany = useMemo(() => {
    if (currentUser.role !== 'sales' || !currentUser.sales_id) return null;
    const defaultAccess = salesAccess.find(
      (a) => a.sales_id === currentUser.sales_id && a.is_default && a.status === 'active'
    );
    if (defaultAccess) {
      return companies.find((c) => c.company_id === defaultAccess.company_id) || null;
    }
    return companies.find((c) => c.company_id === currentUser.company_id) || null;
  }, [currentUser, salesAccess, companies]);

  // Current selected company object (if not ALL)
  const selectedCompany = useMemo(() => {
    if (selectedCompanyId === 'ALL') return null;
    return companies.find((c) => c.company_id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // RLS + Company Filter on Orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // 1. RLS enforcement
    if (currentUser.role === 'sales') {
      // Sales only sees orders they created and for companies they have access to
      const permittedIds = permittedCompanies.map((c) => c.company_id);
      result = result.filter(
        (o) => o.sales_id === currentUser.sales_id && permittedIds.includes(o.company_id)
      );
    } else if (currentUser.role === 'finance') {
      const permittedIds = permittedCompanies.map((c) => c.company_id);
      result = result.filter((o) => permittedIds.includes(o.company_id));
    }

    // 2. Selected Company filter
    if (selectedCompanyId !== 'ALL') {
      result = result.filter((o) => o.company_id === selectedCompanyId);
    }

    return result;
  }, [orders, currentUser, permittedCompanies, selectedCompanyId]);

  // RLS + Company Filter on Payments
  const filteredPayments = useMemo(() => {
    let result = payments;

    if (currentUser.role === 'sales') {
      // Sales only sees payments for their own orders
      const myOrderIds = orders.filter((o) => o.sales_id === currentUser.sales_id).map((o) => o.so_id);
      result = result.filter((p) => myOrderIds.includes(p.so_id));
    } else if (currentUser.role === 'finance') {
      const permittedIds = permittedCompanies.map((c) => c.company_id);
      result = result.filter((p) => permittedIds.includes(p.company_id));
    }

    if (selectedCompanyId !== 'ALL') {
      result = result.filter((p) => p.company_id === selectedCompanyId);
    }

    return result;
  }, [payments, orders, currentUser, permittedCompanies, selectedCompanyId]);

  // RLS + Company Filter on Audit Logs
  const filteredAuditLogs = useMemo(() => {
    let result = auditLogs;
    if (currentUser.role === 'sales') {
      const permittedIds = permittedCompanies.map((c) => c.company_id);
      result = result.filter((a) => permittedIds.includes(a.company_id) && a.user_id === currentUser.user_id);
    } else if (currentUser.role === 'finance') {
      const permittedIds = permittedCompanies.map((c) => c.company_id);
      result = result.filter((a) => permittedIds.includes(a.company_id));
    }

    if (selectedCompanyId !== 'ALL') {
      result = result.filter((a) => a.company_id === selectedCompanyId);
    }

    return result;
  }, [auditLogs, currentUser, permittedCompanies, selectedCompanyId]);

  // Action wrappers
  const createOrUpdateOrder = (data: Parameters<typeof storage.saveSalesOrder>[0]) => {
    const saved = storage.saveSalesOrder(data);
    loadData();
    return saved;
  };

  const recordPayment = (data: Parameters<typeof storage.recordPayment>[0]) => {
    const saved = storage.recordPayment(data);
    loadData();
    return saved;
  };

  const saveCompany = (data: Parameters<typeof storage.saveCompany>[0]) => {
    const saved = storage.saveCompany(data);
    loadData();
    return saved;
  };

  const toggleCompanyStatus = (id: string) => {
    const toggled = storage.toggleCompanyStatus(id);
    loadData();
    return toggled;
  };

  const saveSales = (data: Parameters<typeof storage.saveSales>[0]) => {
    const saved = storage.saveSales(data);
    loadData();
    return saved;
  };

  const updateSalesAccess = (
    salesId: string,
    companyAccessList: { company_id: string; is_default: boolean; has_access: boolean }[]
  ) => {
    storage.updateSalesAccess(salesId, companyAccessList);
    loadData();
  };

  const deleteSales = (salesId: string) => {
    storage.deleteSales(salesId);
    loadData();
  };

  const saveCustomer = (data: Parameters<typeof storage.saveCustomer>[0]) => {
    const saved = storage.saveCustomer(data);
    loadData();
    return saved;
  };

  const saveCustomerCompany = (data: Parameters<typeof storage.saveCustomerCompany>[0]) => {
    const saved = storage.saveCustomerCompany(data);
    loadData();
    return saved;
  };

  const savePriceList = (data: Parameters<typeof storage.savePriceList>[0]) => {
    const saved = storage.savePriceList(data);
    loadData();
    return saved;
  };

  const resolvePrice = (
    companyId: string,
    productId: string,
    customerType: string = 'all',
    customerId?: string,
    qty: number = 1
  ) => {
    return storage.resolveProductPrice(companyId, productId, customerType, customerId, qty);
  };

  const resetAllData = () => {
    storage.resetAllData();
    loadData();
  };

  return (
    <ERPContext.Provider
      value={{
        companies,
        salesList,
        salesAccess,
        customers,
        customerCompanies,
        products,
        priceLists,
        orders,
        payments,
        auditLogs,
        isFirebaseConnected,
        firebaseProjectId: FIREBASE_PROJECT_ID,
        currentUser,
        switchUserPersona,
        allowMultiCompany,
        setAllowMultiCompany,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompany,
        permittedCompanies,
        defaultSalesCompany,
        filteredOrders,
        filteredPayments,
        filteredAuditLogs,
        createOrUpdateOrder,
        recordPayment,
        saveCompany,
        toggleCompanyStatus,
        saveSales,
        deleteSales,
        updateSalesAccess,
        saveCustomer,
        saveCustomerCompany,
        savePriceList,
        resolvePrice,
        resetAllData,
        refreshData: loadData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
