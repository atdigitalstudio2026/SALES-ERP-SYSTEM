export type CompanyStatus = 'active' | 'inactive';

export interface Company {
  company_id: string; // UUID
  company_code: string; // e.g. EXA, SRAM, IMR, PAS
  company_name: string; // e.g. PT Exindokarsa Agung
  legal_name: string;
  address: string;
  phone: string;
  email: string;
  tax_number: string; // NPWP
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export type SalesStatus = 'active' | 'inactive';

export interface SalesPerson {
  sales_id: string; // UUID
  sales_code: string;
  sales_name: string;
  email: string;
  phone: string;
  company_id: string; // Primary registered company UUID
  area: string;
  position: string;
  status: SalesStatus;
  access_code?: string; // Login User / Kode Akses e.g. SLS-001 or custom username
  password?: string; // Login Password given by Superadmin
  created_at: string;
}

export interface SalesCompanyAccess {
  id: string; // UUID
  sales_id: string; // UUID
  company_id: string; // UUID
  is_default: boolean;
  status: 'active' | 'inactive';
  created_at: string;
}

export type CustomerType = 'general' | 'retail' | 'distributor' | 'corporate';

export interface Customer {
  customer_id: string; // UUID
  customer_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  customer_type: CustomerType;
  created_at: string;
}

export interface CustomerCompany {
  id: string; // UUID
  customer_id: string; // UUID
  company_id: string; // UUID
  customer_code: string; // e.g. CUST-EXA-001
  payment_terms: string; // e.g. Net 30, Net 14, CBD
  credit_limit: number;
  status: 'active' | 'inactive';
}

export interface Product {
  product_id: string; // UUID
  product_code: string;
  product_name: string;
  category: string;
  unit: string;
  base_cost: number;
  description?: string;
}

export interface PriceList {
  id: string; // UUID
  company_id: string; // UUID
  product_id: string; // UUID
  customer_type: CustomerType | 'all';
  customer_id?: string; // Optional specific customer UUID
  min_quantity: number;
  unit_price: number;
  effective_date: string;
  status: 'active' | 'inactive';
}

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

export interface SalesOrderItem {
  id: string; // UUID
  so_id: string; // UUID
  product_id: string; // UUID
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  subtotal: number;
  notes?: string;
}

export interface SalesOrder {
  so_id: string; // UUID
  so_number: string; // [COMPANY CODE]-YYYYMMDD-XXXX
  company_id: string; // UUID (Foreign Key to companies.company_id NOT NULL)
  sales_id: string; // UUID (Foreign Key to sales.sales_id)
  customer_id: string; // UUID (Foreign Key to customers.customer_id)
  order_date: string; // YYYY-MM-DD
  payment_terms: string;
  due_date: string;
  delivery_date: string;
  notes: string;
  status: OrderStatus;
  subtotal: number;
  tax_enabled?: boolean;
  tax_rate?: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  items: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'bank_transfer' | 'cash' | 'giro' | 'cheque';

export interface Payment {
  payment_id: string; // UUID
  company_id: string; // UUID (Strictly from SalesOrder.company_id NOT NULL)
  so_id: string; // UUID
  so_number: string;
  payment_number: string; // PAY-[COMPANY CODE]-YYYYMMDD-XXXX
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  bank_name?: string;
  notes?: string;
  created_at: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'STATUS_CHANGE';
export type AuditModule = 'SALES_ORDER' | 'PAYMENT' | 'CUSTOMER' | 'COMPANY' | 'PRICE_LIST' | 'SALES_PERSON' | 'ACCESS_CONTROL';

export interface AuditLog {
  id: string; // UUID
  company_id: string; // UUID
  company_code: string;
  user_id: string;
  user_name: string;
  role: string;
  action: AuditAction;
  module: AuditModule;
  record_id: string;
  record_identifier: string; // e.g. EXA-20260928-0001
  timestamp: string;
  old_value?: any;
  new_value?: any;
  description: string;
}

export type UserRole = 'super_admin' | 'admin' | 'finance' | 'sales';

export interface CurrentUser {
  user_id: string;
  name: string;
  email: string;
  username?: string; // Login Kode Akses / Username
  password?: string; // Login Password
  role: UserRole;
  sales_id?: string; // If role === 'sales'
  company_id?: string; // Primary registered company UUID
  allowed_company_ids: string[]; // RLS permitted companies
  allow_multi_company: boolean; // Permission ALLOW_MULTI_COMPANY
}
