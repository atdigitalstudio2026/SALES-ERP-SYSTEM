import {
  Company,
  SalesPerson,
  SalesCompanyAccess,
  Customer,
  CustomerCompany,
  Product,
  PriceList,
  SalesOrder,
  SalesOrderItem,
  Payment,
  AuditLog,
  CurrentUser,
  UserRole
} from '../types';
import { firestoreSync, FIRESTORE_COLLECTIONS } from './firestoreSync';

const STORAGE_KEYS = {
  COMPANIES: 'multi_company_erp_companies_v1',
  SALES: 'multi_company_erp_sales_v1',
  SALES_ACCESS: 'multi_company_erp_sales_access_v1',
  CUSTOMERS: 'multi_company_erp_customers_v1',
  CUSTOMER_COMPANIES: 'multi_company_erp_customer_companies_v1',
  PRODUCTS: 'multi_company_erp_products_v1',
  PRICE_LISTS: 'multi_company_erp_price_lists_v1',
  SALES_ORDERS: 'multi_company_erp_sales_orders_v1',
  PAYMENTS: 'multi_company_erp_payments_v1',
  AUDIT_LOGS: 'multi_company_erp_audit_logs_v1',
  CURRENT_USER: 'multi_company_erp_current_user_v1',
  USER_PERSONAS: 'multi_company_erp_user_personas_v1',
  SETTINGS: 'multi_company_erp_settings_v1',
};

// Initial 4 companies required by specification
export const INITIAL_COMPANIES: Company[] = [
  {
    company_id: 'c1111111-1111-1111-1111-111111111111',
    company_code: 'EXA',
    company_name: 'PT Exindokarsa Agung',
    legal_name: 'PT Exindokarsa Agung Persada',
    address: 'Gedung Palma One Lt. 8, Jl. HR Rasuna Said Kav. X-2 No. 4, Kuningan, Jakarta Selatan 12950',
    phone: '+62 21 5296 1120',
    email: 'sales@exindokarsa.co.id',
    tax_number: '01.234.567.8-012.000',
    status: 'active',
    created_at: '2025-01-15T08:00:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  },
  {
    company_id: 'c2222222-2222-2222-2222-222222222222',
    company_code: 'SRAM',
    company_name: 'PT Sumber Roso Agro Makmur',
    legal_name: 'PT Sumber Roso Agro Makmur Tbk',
    address: 'Kawasan Industri Candi Blok A2 No. 5-7, Jl. Gatot Subroto, Semarang 50181',
    phone: '+62 24 761 4455',
    email: 'admin@sumber-roso.co.id',
    tax_number: '02.345.678.9-023.000',
    status: 'active',
    created_at: '2025-01-20T08:00:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  },
  {
    company_id: 'c3333333-3333-3333-3333-333333333333',
    company_code: 'IMR',
    company_name: 'PT Indo Megah Raya',
    legal_name: 'PT Indo Megah Raya Nusantara',
    address: 'Jl. Rungkut Industri III No. 12-14, Kawasan SIER, Surabaya 60293',
    phone: '+62 31 843 8899',
    email: 'commercial@indomegahraya.com',
    tax_number: '03.456.789.0-034.000',
    status: 'active',
    created_at: '2025-02-01T08:00:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  },
  {
    company_id: 'c4444444-4444-4444-4444-444444444444',
    company_code: 'PAS',
    company_name: 'PT Pelangi Agro Sejahtera',
    legal_name: 'PT Pelangi Agro Sejahtera Mandiri',
    address: 'Komp. Pergudangan Marunda Center Blok B-18, Tarumajaya, Bekasi 17215',
    phone: '+62 21 8899 3321',
    email: 'operations@pelangiagro.co.id',
    tax_number: '04.567.890.1-045.000',
    status: 'active',
    created_at: '2025-02-10T08:00:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  },
];

// Initial Sales Reps
export const INITIAL_SALES: SalesPerson[] = [
  {
    sales_id: 's1111111-1111-1111-1111-111111111111',
    sales_code: 'SLS-001',
    sales_name: 'Andi Wijaya',
    email: 'andi.wijaya@exindokarsa.co.id',
    phone: '+62 812-3456-7890',
    company_id: 'c1111111-1111-1111-1111-111111111111', // PT Exindokarsa Agung
    area: 'DKI Jakarta & Banten',
    position: 'Senior Key Account Manager',
    status: 'active',
    created_at: '2025-01-16T08:00:00.000Z',
  },
  {
    sales_id: 's2222222-2222-2222-2222-222222222222',
    sales_code: 'SLS-002',
    sales_name: 'Budi Santoso',
    email: 'budi.santoso@indomegahraya.com',
    phone: '+62 813-9876-5432',
    company_id: 'c3333333-3333-3333-3333-333333333333', // PT Indo Megah Raya
    area: 'Jawa Timur & Bali',
    position: 'Regional Sales Officer',
    status: 'active',
    created_at: '2025-02-05T08:00:00.000Z',
  },
  {
    sales_id: 's3333333-3333-3333-3333-333333333333',
    sales_code: 'SLS-003',
    sales_name: 'Dewi Lestari',
    email: 'dewi.lestari@sumber-roso.co.id',
    phone: '+62 811-2233-4455',
    company_id: 'c2222222-2222-2222-2222-222222222222', // PT Sumber Roso Agro Makmur
    area: 'Jawa Tengah & DIY',
    position: 'Agro Sales Executive',
    status: 'active',
    created_at: '2025-02-15T08:00:00.000Z',
  },
  {
    sales_id: 's4444444-4444-4444-4444-444444444444',
    sales_code: 'SLS-004',
    sales_name: 'Rian Pratama',
    email: 'rian.pratama@pelangiagro.co.id',
    phone: '+62 856-7788-9900',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PT Pelangi Agro Sejahtera
    area: 'Jawa Barat & Bodetabek',
    position: 'Commercial Representative',
    status: 'active',
    created_at: '2025-02-20T08:00:00.000Z',
  },
];

// Requirement #6: sales_company_access
// Andi has access to EXA (Default=YES) and SRAM (Access=YES, Default=NO), no access to IMR and PAS
export const INITIAL_SALES_ACCESS: SalesCompanyAccess[] = [
  // Andi's permissions
  {
    id: 'sca-001',
    sales_id: 's1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    is_default: true,
    status: 'active',
    created_at: '2025-01-16T08:00:00.000Z',
  },
  {
    id: 'sca-002',
    sales_id: 's1111111-1111-1111-1111-111111111111',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    is_default: false,
    status: 'active',
    created_at: '2025-01-16T08:00:00.000Z',
  },
  // Budi's permissions (IMR only)
  {
    id: 'sca-003',
    sales_id: 's2222222-2222-2222-2222-222222222222',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    is_default: true,
    status: 'active',
    created_at: '2025-02-05T08:00:00.000Z',
  },
  // Dewi's permissions (SRAM default, PAS access)
  {
    id: 'sca-004',
    sales_id: 's3333333-3333-3333-3333-333333333333',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    is_default: true,
    status: 'active',
    created_at: '2025-02-15T08:00:00.000Z',
  },
  {
    id: 'sca-005',
    sales_id: 's3333333-3333-3333-3333-333333333333',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    is_default: false,
    status: 'active',
    created_at: '2025-02-15T08:00:00.000Z',
  },
  // Rian's permissions (PAS only)
  {
    id: 'sca-006',
    sales_id: 's4444444-4444-4444-4444-444444444444',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    is_default: true,
    status: 'active',
    created_at: '2025-02-20T08:00:00.000Z',
  },
];

// Requirement #11: Global Customers
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    customer_id: 'cust-1111',
    customer_name: 'PT ABC Retailindo',
    contact_person: 'Hendrawan Kusuma',
    email: 'procurement@abcretail.co.id',
    phone: '+62 21 7890 1234',
    address: 'Jl. Boulevard Gading Serpong M5 No. 18, Tangerang',
    customer_type: 'corporate',
    created_at: '2025-01-18T09:00:00.000Z',
  },
  {
    customer_id: 'cust-2222',
    customer_name: 'CV Berkah Tani Makmur',
    contact_person: 'Haji Sulaiman',
    email: 'sulaiman@berkahtani.com',
    phone: '+62 281 632 889',
    address: 'Jl. Jenderal Sudirman No. 88, Purwokerto',
    customer_type: 'distributor',
    created_at: '2025-01-22T09:00:00.000Z',
  },
  {
    customer_id: 'cust-3333',
    customer_name: 'Lotte Mart Wholesale Indonesia',
    contact_person: 'Jessica Tan',
    email: 'jessica.tan@lottemart.co.id',
    phone: '+62 21 840 7700',
    address: 'Jl. TB Simatupang No. 37, Pasar Rebo, Jakarta Timur',
    customer_type: 'corporate',
    created_at: '2025-02-02T09:00:00.000Z',
  },
  {
    customer_id: 'cust-4444',
    customer_name: 'Toko Rejeki Barokah',
    contact_person: 'Siti Aminah',
    email: 'toko.rejeki.barokah@gmail.com',
    phone: '+62 878-1122-3344',
    address: 'Pasar Induk Kramat Jati Kios Los D No. 42, Jakarta Timur',
    customer_type: 'retail',
    created_at: '2025-02-12T09:00:00.000Z',
  },
  {
    customer_id: 'cust-5555',
    customer_name: 'PT Nusantara Agro Sejati',
    contact_person: 'Bambang Soediro',
    email: 'purchasing@nusantara-agro.id',
    phone: '+62 31 556 7711',
    address: 'Jl. Raya Darmo Permai II No. 104, Surabaya',
    customer_type: 'distributor',
    created_at: '2025-02-25T09:00:00.000Z',
  },
];

// Requirement #11: customer_companies (Customer relates to multiple companies with specific terms & limits)
export const INITIAL_CUSTOMER_COMPANIES: CustomerCompany[] = [
  // PT ABC Retailindo has relations with EXA and IMR
  {
    id: 'cc-001',
    customer_id: 'cust-1111',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    customer_code: 'CUST-EXA-001',
    payment_terms: 'Net 30 Days',
    credit_limit: 150_000_000,
    status: 'active',
  },
  {
    id: 'cc-002',
    customer_id: 'cust-1111',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    customer_code: 'CUST-IMR-001',
    payment_terms: 'Net 14 Days',
    credit_limit: 75_000_000,
    status: 'active',
  },
  // CV Berkah Tani Makmur has relations with SRAM and PAS
  {
    id: 'cc-003',
    customer_id: 'cust-2222',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    customer_code: 'CUST-SRAM-002',
    payment_terms: 'Net 45 Days',
    credit_limit: 200_000_000,
    status: 'active',
  },
  {
    id: 'cc-004',
    customer_id: 'cust-2222',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    customer_code: 'CUST-PAS-002',
    payment_terms: 'Net 30 Days',
    credit_limit: 100_000_000,
    status: 'active',
  },
  // Lotte Mart Wholesale Indonesia has relations with all 4 PTs
  {
    id: 'cc-005',
    customer_id: 'cust-3333',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    customer_code: 'CUST-EXA-003',
    payment_terms: 'Net 60 Days',
    credit_limit: 500_000_000,
    status: 'active',
  },
  {
    id: 'cc-006',
    customer_id: 'cust-3333',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    customer_code: 'CUST-SRAM-003',
    payment_terms: 'Net 60 Days',
    credit_limit: 400_000_000,
    status: 'active',
  },
  {
    id: 'cc-007',
    customer_id: 'cust-3333',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    customer_code: 'CUST-IMR-003',
    payment_terms: 'Net 45 Days',
    credit_limit: 350_000_000,
    status: 'active',
  },
  {
    id: 'cc-008',
    customer_id: 'cust-3333',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    customer_code: 'CUST-PAS-003',
    payment_terms: 'Net 45 Days',
    credit_limit: 300_000_000,
    status: 'active',
  },
  // Toko Rejeki Barokah (Retail)
  {
    id: 'cc-009',
    customer_id: 'cust-4444',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    customer_code: 'CUST-EXA-004',
    payment_terms: 'Cash on Delivery',
    credit_limit: 20_000_000,
    status: 'active',
  },
  {
    id: 'cc-010',
    customer_id: 'cust-4444',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    customer_code: 'CUST-PAS-004',
    payment_terms: 'Net 7 Days',
    credit_limit: 25_000_000,
    status: 'active',
  },
  // PT Nusantara Agro Sejati
  {
    id: 'cc-011',
    customer_id: 'cust-5555',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    customer_code: 'CUST-SRAM-005',
    payment_terms: 'Net 30 Days',
    credit_limit: 120_000_000,
    status: 'active',
  },
  {
    id: 'cc-012',
    customer_id: 'cust-5555',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    customer_code: 'CUST-IMR-005',
    payment_terms: 'Net 30 Days',
    credit_limit: 100_000_000,
    status: 'active',
  },
];

// Master Products
export const INITIAL_PRODUCTS: Product[] = [
  {
    product_id: 'p1111',
    product_code: 'KURMA-AKH-200',
    product_name: 'Akram Khalas 200g', // From prompt requirement #12
    category: 'Dates & Food',
    unit: 'Pcs',
    base_cost: 18000,
    description: 'Premium vacuum-packed selected Khalas dates 200g',
  },
  {
    product_id: 'p2222',
    product_code: 'KURMA-MDJ-500',
    product_name: 'Medjool Jumbo 500g',
    category: 'Dates & Food',
    unit: 'Box',
    base_cost: 65000,
    description: 'Fresh Medjool dates king-size grade A',
  },
  {
    product_id: 'p3333',
    product_code: 'PUPUK-BIO-25KG',
    product_name: 'Pupuk Bio Organik Makmur 25kg',
    category: 'Agro Supplies',
    unit: 'Sack',
    base_cost: 85000,
    description: 'Enriched organic bio-fertilizer granular 25kg',
  },
  {
    product_id: 'p4444',
    product_code: 'BENIH-PADI-5KG',
    product_name: 'Benih Unggul Padi Ciherang 5kg',
    category: 'Agro Seeds',
    unit: 'Bag',
    base_cost: 45000,
    description: 'Certified high-yield paddy seed Ciherang strain',
  },
  {
    product_id: 'p5555',
    product_code: 'MINYAK-SWM-2L',
    product_name: 'Minyak Goreng Sawit Emas 2L',
    category: 'Commodities',
    unit: 'Pouch',
    base_cost: 29000,
    description: 'Refined double-fractionated palm cooking oil',
  },
];

// Requirement #12: Price List per Company
// Product: Akram Khalas 200g
// Company: PT Exindokarsa Agung -> Price: Rp 25.000
// Company: PT Indo Megah Raya -> Price: Rp 24.500
export const INITIAL_PRICE_LISTS: PriceList[] = [
  // Akram Khalas 200g in EXA: Rp 25.000
  {
    id: 'pl-001',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    product_id: 'p1111',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 25000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  // Akram Khalas 200g in IMR: Rp 24.500
  {
    id: 'pl-002',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    product_id: 'p1111',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 24500,
    effective_date: '2026-01-01',
    status: 'active',
  },
  // Akram Khalas 200g in SRAM: Rp 25.500
  {
    id: 'pl-003',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    product_id: 'p1111',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 25500,
    effective_date: '2026-01-01',
    status: 'active',
  },
  // Akram Khalas 200g in PAS: Rp 25.200
  {
    id: 'pl-004',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    product_id: 'p1111',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 25200,
    effective_date: '2026-01-01',
    status: 'active',
  },

  // Medjool Jumbo 500g
  {
    id: 'pl-005',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    product_id: 'p2222',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 85000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-006',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    product_id: 'p2222',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 82000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-007',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    product_id: 'p2222',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 86500,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-008',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    product_id: 'p2222',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 84000,
    effective_date: '2026-01-01',
    status: 'active',
  },

  // Pupuk Bio Organik Makmur 25kg
  {
    id: 'pl-009',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    product_id: 'p3333',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 118000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-010',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    product_id: 'p3333',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 115000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-011',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    product_id: 'p3333',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 122000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-012',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    product_id: 'p3333',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 120000,
    effective_date: '2026-01-01',
    status: 'active',
  },

  // Benih Unggul Padi 5kg
  {
    id: 'pl-013',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    product_id: 'p4444',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 62000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-014',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    product_id: 'p4444',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 60000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  // Minyak Sawit 2L
  {
    id: 'pl-015',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    product_id: 'p5555',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 36000,
    effective_date: '2026-01-01',
    status: 'active',
  },
  {
    id: 'pl-016',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    product_id: 'p5555',
    customer_type: 'all',
    min_quantity: 1,
    unit_price: 37500,
    effective_date: '2026-01-01',
    status: 'active',
  },
];

// Initial Sales Orders with proper [COMPANY CODE]-YYYYMMDD-XXXX numbering
export const INITIAL_ORDERS: SalesOrder[] = [
  {
    so_id: 'so-1001',
    so_number: 'EXA-20260920-0001',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    sales_id: 's1111111-1111-1111-1111-111111111111', // Andi Wijaya
    customer_id: 'cust-1111', // PT ABC Retailindo
    order_date: '2026-09-20',
    payment_terms: 'Net 30 Days',
    due_date: '2026-10-20',
    delivery_date: '2026-09-24',
    notes: 'Kirim ke Gudang Bintaro pukul 09.00 WIB',
    status: 'confirmed',
    subtotal: 50000000,
    tax_amount: 5500000, // 11%
    total_amount: 55500000,
    paid_amount: 25000000,
    outstanding_amount: 30500000,
    items: [
      {
        id: 'soi-1',
        so_id: 'so-1001',
        product_id: 'p1111',
        product_code: 'KURMA-AKH-200',
        product_name: 'Akram Khalas 200g',
        quantity: 1000,
        unit: 'Pcs',
        unit_price: 25000,
        discount_percent: 0,
        subtotal: 25000000,
      },
      {
        id: 'soi-2',
        so_id: 'so-1001',
        product_id: 'p2222',
        product_code: 'KURMA-MDJ-500',
        product_name: 'Medjool Jumbo 500g',
        quantity: 294, // approx 25M
        unit: 'Box',
        unit_price: 85000,
        discount_percent: 0,
        subtotal: 25000000,
      },
    ],
    created_at: '2026-09-20T10:30:00.000Z',
    updated_at: '2026-09-21T14:00:00.000Z',
  },
  {
    so_id: 'so-1002',
    so_number: 'EXA-20260925-0002',
    company_id: 'c1111111-1111-1111-1111-111111111111', // EXA
    sales_id: 's1111111-1111-1111-1111-111111111111', // Andi Wijaya
    customer_id: 'cust-3333', // Lotte Mart Wholesale
    order_date: '2026-09-25',
    payment_terms: 'Net 60 Days',
    due_date: '2026-11-24',
    delivery_date: '2026-09-28',
    notes: 'PO Lotte No. LMT-2026-09-8812',
    status: 'completed',
    subtotal: 62500000,
    tax_amount: 6875000,
    total_amount: 69375000,
    paid_amount: 69375000,
    outstanding_amount: 0,
    items: [
      {
        id: 'soi-3',
        so_id: 'so-1002',
        product_id: 'p1111',
        product_code: 'KURMA-AKH-200',
        product_name: 'Akram Khalas 200g',
        quantity: 2500,
        unit: 'Pcs',
        unit_price: 25000,
        discount_percent: 0,
        subtotal: 62500000,
      },
    ],
    created_at: '2026-09-25T09:15:00.000Z',
    updated_at: '2026-09-26T11:20:00.000Z',
  },
  {
    so_id: 'so-2001',
    so_number: 'SRAM-20260922-0001',
    company_id: 'c2222222-2222-2222-2222-222222222222', // SRAM
    sales_id: 's3333333-3333-3333-3333-333333333333', // Dewi Lestari
    customer_id: 'cust-2222', // CV Berkah Tani Makmur
    order_date: '2026-09-22',
    payment_terms: 'Net 45 Days',
    due_date: '2026-11-06',
    delivery_date: '2026-09-26',
    notes: 'Kirim armada fuso 2 unit ke gudang Purwokerto',
    status: 'processing',
    subtotal: 70800000,
    tax_amount: 7788000,
    total_amount: 78588000,
    paid_amount: 0,
    outstanding_amount: 78588000,
    items: [
      {
        id: 'soi-4',
        so_id: 'so-2001',
        product_id: 'p3333',
        product_code: 'PUPUK-BIO-25KG',
        product_name: 'Pupuk Bio Organik Makmur 25kg',
        quantity: 600,
        unit: 'Sack',
        unit_price: 118000,
        discount_percent: 0,
        subtotal: 70800000,
      },
    ],
    created_at: '2026-09-22T11:00:00.000Z',
    updated_at: '2026-09-22T11:00:00.000Z',
  },
  {
    so_id: 'so-3001',
    so_number: 'IMR-20260923-0001',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    sales_id: 's2222222-2222-2222-2222-222222222222', // Budi Santoso
    customer_id: 'cust-1111', // PT ABC Retailindo (Option A multi-company customer)
    order_date: '2026-09-23',
    payment_terms: 'Net 14 Days',
    due_date: '2026-10-07',
    delivery_date: '2026-09-26',
    notes: 'Pengiriman batch Jawa Timur',
    status: 'confirmed',
    subtotal: 49000000,
    tax_amount: 5390000,
    total_amount: 54390000,
    paid_amount: 20000000,
    outstanding_amount: 34390000,
    items: [
      {
        id: 'soi-5',
        so_id: 'so-3001',
        product_id: 'p1111',
        product_code: 'KURMA-AKH-200',
        product_name: 'Akram Khalas 200g',
        quantity: 2000,
        unit: 'Pcs',
        unit_price: 24500, // IMR price Rp 24.500
        discount_percent: 0,
        subtotal: 49000000,
      },
    ],
    created_at: '2026-09-23T14:20:00.000Z',
    updated_at: '2026-09-24T16:00:00.000Z',
  },
  {
    so_id: 'so-4001',
    so_number: 'PAS-20260924-0001',
    company_id: 'c4444444-4444-4444-4444-444444444444', // PAS
    sales_id: 's4444444-4444-4444-4444-444444444444', // Rian Pratama
    customer_id: 'cust-4444', // Toko Rejeki Barokah
    order_date: '2026-09-24',
    payment_terms: 'Net 7 Days',
    due_date: '2026-10-01',
    delivery_date: '2026-09-25',
    notes: 'Pengiriman via pick-up langsung',
    status: 'completed',
    subtotal: 23000000,
    tax_amount: 2530000,
    total_amount: 25530000,
    paid_amount: 25530000,
    outstanding_amount: 0,
    items: [
      {
        id: 'soi-6',
        so_id: 'so-4001',
        product_id: 'p3333',
        product_code: 'PUPUK-BIO-25KG',
        product_name: 'Pupuk Bio Organik Makmur 25kg',
        quantity: 200,
        unit: 'Sack',
        unit_price: 115000,
        discount_percent: 0,
        subtotal: 23000000,
      },
    ],
    created_at: '2026-09-24T08:45:00.000Z',
    updated_at: '2026-09-25T13:30:00.000Z',
  },
];

// Requirement #10: Payments inherit company_id strictly from SalesOrder.company_id
export const INITIAL_PAYMENTS: Payment[] = [
  {
    payment_id: 'pay-101',
    company_id: 'c1111111-1111-1111-1111-111111111111', // Inherited from EXA
    so_id: 'so-1001',
    so_number: 'EXA-20260920-0001',
    payment_number: 'PAY-EXA-20260921-0001',
    payment_date: '2026-09-21',
    amount: 25000000,
    payment_method: 'bank_transfer',
    reference_number: 'TRF-BCA-987123',
    bank_name: 'BCA Cabang Kuningan',
    notes: 'Down payment 45% SO EXA-20260920-0001',
    created_at: '2026-09-21T14:00:00.000Z',
  },
  {
    payment_id: 'pay-102',
    company_id: 'c1111111-1111-1111-1111-111111111111', // Inherited from EXA
    so_id: 'so-1002',
    so_number: 'EXA-20260925-0002',
    payment_number: 'PAY-EXA-20260926-0002',
    payment_date: '2026-09-26',
    amount: 69375000,
    payment_method: 'bank_transfer',
    reference_number: 'TRF-MANDIRI-445511',
    bank_name: 'Bank Mandiri Corporate',
    notes: 'Pelunasan penuh PO Lotte Mart',
    created_at: '2026-09-26T11:20:00.000Z',
  },
  {
    payment_id: 'pay-301',
    company_id: 'c3333333-3333-3333-3333-333333333333', // Inherited from IMR
    so_id: 'so-3001',
    so_number: 'IMR-20260923-0001',
    payment_number: 'PAY-IMR-20260924-0001',
    payment_date: '2026-09-24',
    amount: 20000000,
    payment_method: 'bank_transfer',
    reference_number: 'TRF-BCA-778819',
    bank_name: 'BCA Cabang Rungkut',
    notes: 'Uang Muka PT ABC Retailindo ke IMR',
    created_at: '2026-09-24T16:00:00.000Z',
  },
  {
    payment_id: 'pay-401',
    company_id: 'c4444444-4444-4444-4444-444444444444', // Inherited from PAS
    so_id: 'so-4001',
    so_number: 'PAS-20260924-0001',
    payment_number: 'PAY-PAS-20260925-0001',
    payment_date: '2026-09-25',
    amount: 25530000,
    payment_method: 'cash',
    reference_number: 'KWT-PAS-0091',
    notes: 'Pembayaran tunai kasir Marunda',
    created_at: '2026-09-25T13:30:00.000Z',
  },
];

// Requirement #17: Audit Log sample
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    company_code: 'EXA',
    user_id: 'u-andi',
    user_name: 'ANDI',
    role: 'Sales',
    action: 'CREATE',
    module: 'SALES_ORDER',
    record_id: 'so-1001',
    record_identifier: 'SO-20260920-0001',
    timestamp: '2026-09-20T10:30:00.000Z',
    description: 'ANDI | CREATE | SALES_ORDER | EXA | SO-20260920-0001',
  },
  {
    id: 'aud-002',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    company_code: 'EXA',
    user_id: 'u-fin',
    user_name: 'FINANCE',
    role: 'Finance',
    action: 'PAYMENT',
    module: 'PAYMENT',
    record_id: 'pay-101',
    record_identifier: 'PAY-EXA-20260921-0001',
    timestamp: '2026-09-21T14:00:00.000Z',
    description: 'FINANCE | PAYMENT | PAYMENT | EXA | PAY-EXA-20260921-0001',
  },
  {
    id: 'aud-003',
    company_id: 'c3333333-3333-3333-3333-333333333333',
    company_code: 'IMR',
    user_id: 'u-budi',
    user_name: 'BUDI',
    role: 'Sales',
    action: 'CREATE',
    module: 'SALES_ORDER',
    record_id: 'so-3001',
    record_identifier: 'SO-20260923-0001',
    timestamp: '2026-09-23T14:20:00.000Z',
    description: 'BUDI | CREATE | SALES_ORDER | IMR | SO-20260923-0001',
  },
];

// Current User personas for role simulation & RLS testing
export const USER_PERSONAS: CurrentUser[] = [
  {
    user_id: 'u-superadmin',
    name: 'Pratama Hartono',
    email: 'hartono@group-holding.com',
    role: 'super_admin',
    allowed_company_ids: [
      'c1111111-1111-1111-1111-111111111111',
      'c2222222-2222-2222-2222-222222222222',
      'c3333333-3333-3333-3333-333333333333',
      'c4444444-4444-4444-4444-444444444444',
    ],
    allow_multi_company: true,
  },
  {
    user_id: 'u-admin',
    name: 'Admin Group Sales',
    email: 'admin.sales@holding.co.id',
    role: 'admin',
    allowed_company_ids: [
      'c1111111-1111-1111-1111-111111111111',
      'c2222222-2222-2222-2222-222222222222',
      'c3333333-3333-3333-3333-333333333333',
      'c4444444-4444-4444-4444-444444444444',
    ],
    allow_multi_company: true,
  },
  {
    user_id: 'u-finance',
    name: 'Kartika Sari (Finance)',
    email: 'finance@holding.co.id',
    role: 'finance',
    allowed_company_ids: [
      'c1111111-1111-1111-1111-111111111111',
      'c2222222-2222-2222-2222-222222222222',
      'c3333333-3333-3333-3333-333333333333',
      'c4444444-4444-4444-4444-444444444444',
    ],
    allow_multi_company: true,
  },
  {
    // Andi: Default EXA, has access to SRAM, NO access to IMR and PAS
    user_id: 'u-andi',
    name: 'Andi Wijaya (Sales EXA & SRAM)',
    email: 'andi.wijaya@exindokarsa.co.id',
    role: 'sales',
    sales_id: 's1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111', // PT Exindokarsa Agung
    allowed_company_ids: [
      'c1111111-1111-1111-1111-111111111111', // EXA
      'c2222222-2222-2222-2222-222222222222', // SRAM
    ],
    allow_multi_company: true, // Will test ALLOW_MULTI_COMPANY
  },
  {
    // Budi: Only IMR
    user_id: 'u-budi',
    name: 'Budi Santoso (Sales IMR Only)',
    email: 'budi.santoso@indomegahraya.com',
    role: 'sales',
    sales_id: 's2222222-2222-2222-2222-222222222222',
    company_id: 'c3333333-3333-3333-3333-333333333333', // IMR
    allowed_company_ids: [
      'c3333333-3333-3333-3333-333333333333', // IMR
    ],
    allow_multi_company: false,
  },
];

// Helper to generate UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Storage wrapper
class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  // Settings: ALLOW_MULTI_COMPANY toggle
  getAllowMultiCompany(): boolean {
    const settings = this.get<{ allow_multi_company: boolean }>(STORAGE_KEYS.SETTINGS, {
      allow_multi_company: true,
    });
    return settings.allow_multi_company;
  }

  setAllowMultiCompany(allowed: boolean): void {
    this.set(STORAGE_KEYS.SETTINGS, { allow_multi_company: allowed });
  }

  // Current User & Personas
  getUserPersonas(): CurrentUser[] {
    return this.get<CurrentUser[]>(STORAGE_KEYS.USER_PERSONAS, USER_PERSONAS);
  }

  updateUserPersona(userId: string, data: { name?: string; email?: string }): CurrentUser {
    const personas = this.getUserPersonas();
    const idx = personas.findIndex((p) => p.user_id === userId);
    if (idx === -1) throw new Error('User persona tidak ditemukan');

    const updated: CurrentUser = {
      ...personas[idx],
      name: data.name?.trim() || personas[idx].name,
      email: data.email?.trim() || personas[idx].email,
    };
    personas[idx] = updated;
    this.set(STORAGE_KEYS.USER_PERSONAS, personas);

    const currentUser = this.getCurrentUser();
    if (currentUser.user_id === userId) {
      this.setCurrentUser(updated);
    }

    this.addAuditLog({
      company_id: 'ALL',
      company_code: 'GRP',
      action: 'UPDATE',
      module: 'ACCESS_CONTROL',
      record_id: userId,
      record_identifier: updated.role,
      description: `Profil ${updated.role.toUpperCase()} diperbarui menjadi "${updated.name}" (${updated.email})`,
    });

    return updated;
  }

  getCurrentUser(): CurrentUser {
    const personas = this.getUserPersonas();
    return this.get<CurrentUser>(STORAGE_KEYS.CURRENT_USER, personas[0]);
  }

  setCurrentUser(user: CurrentUser): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Companies
  getCompanies(): Company[] {
    return this.get<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  }

  getCompanyById(id: string): Company | undefined {
    return this.getCompanies().find((c) => c.company_id === id);
  }

  getCompanyByCode(code: string): Company | undefined {
    return this.getCompanies().find((c) => c.company_code.toUpperCase() === code.toUpperCase());
  }

  saveCompany(companyData: Omit<Company, 'company_id' | 'created_at' | 'updated_at'> & { company_id?: string }): Company {
    const companies = this.getCompanies();
    const now = new Date().toISOString();
    let saved: Company;

    if (companyData.company_id) {
      const index = companies.findIndex((c) => c.company_id === companyData.company_id);
      if (index === -1) throw new Error('Company not found');
      saved = {
        ...companies[index],
        ...companyData,
        company_id: companyData.company_id,
        updated_at: now,
      };
      companies[index] = saved;
    } else {
      saved = {
        ...companyData,
        company_id: generateUUID(),
        created_at: now,
        updated_at: now,
      };
      companies.push(saved);
    }

    this.set(STORAGE_KEYS.COMPANIES, companies);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.COMPANIES, saved.company_id, saved);
    this.addAuditLog({
      company_id: saved.company_id,
      company_code: saved.company_code,
      action: companyData.company_id ? 'UPDATE' : 'CREATE',
      module: 'COMPANY',
      record_id: saved.company_id,
      record_identifier: saved.company_code,
      description: `${this.getCurrentUser().name} | ${companyData.company_id ? 'UPDATE' : 'CREATE'} | COMPANY | ${saved.company_code} | ${saved.company_name}`,
    });

    return saved;
  }

  toggleCompanyStatus(id: string): Company {
    const companies = this.getCompanies();
    const company = companies.find((c) => c.company_id === id);
    if (!company) throw new Error('Company not found');
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    company.status = newStatus;
    company.updated_at = new Date().toISOString();
    this.set(STORAGE_KEYS.COMPANIES, companies);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.COMPANIES, company.company_id, company);

    this.addAuditLog({
      company_id: company.company_id,
      company_code: company.company_code,
      action: 'STATUS_CHANGE',
      module: 'COMPANY',
      record_id: company.company_id,
      record_identifier: company.company_code,
      description: `${this.getCurrentUser().name} | STATUS_CHANGE | COMPANY | ${company.company_code} | Status set to ${newStatus}`,
    });

    return company;
  }

  // Sales Persons
  getSales(): SalesPerson[] {
    return this.get<SalesPerson[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  getSalesById(id: string): SalesPerson | undefined {
    return this.getSales().find((s) => s.sales_id === id);
  }

  saveSales(salesData: Omit<SalesPerson, 'sales_id' | 'created_at'> & { sales_id?: string }): SalesPerson {
    const salesList = this.getSales();
    const now = new Date().toISOString();
    let saved: SalesPerson;

    if (salesData.sales_id) {
      const idx = salesList.findIndex((s) => s.sales_id === salesData.sales_id);
      if (idx === -1) throw new Error('Sales not found');
      saved = {
        ...salesList[idx],
        ...salesData,
        sales_id: salesData.sales_id,
      };
      salesList[idx] = saved;
    } else {
      saved = {
        ...salesData,
        sales_id: generateUUID(),
        created_at: now,
      };
      salesList.push(saved);

      // Auto create default company access
      const accesses = this.getSalesCompanyAccess();
      accesses.push({
        id: generateUUID(),
        sales_id: saved.sales_id,
        company_id: saved.company_id,
        is_default: true,
        status: 'active',
        created_at: now,
      });
      this.set(STORAGE_KEYS.SALES_ACCESS, accesses);
    }

    this.set(STORAGE_KEYS.SALES, salesList);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.SALES, saved.sales_id, saved);
    const comp = this.getCompanyById(saved.company_id);
    this.addAuditLog({
      company_id: saved.company_id,
      company_code: comp?.company_code || 'GRP',
      action: salesData.sales_id ? 'UPDATE' : 'CREATE',
      module: 'SALES_PERSON',
      record_id: saved.sales_id,
      record_identifier: saved.sales_code,
      description: `${this.getCurrentUser().name} | ${salesData.sales_id ? 'UPDATE' : 'CREATE'} | SALES_PERSON | ${comp?.company_code} | ${saved.sales_name}`,
    });

    return saved;
  }

  deleteSales(salesId: string): void {
    const salesList = this.getSales();
    const target = salesList.find((s) => s.sales_id === salesId);
    if (!target) throw new Error('Sales representative not found');

    const updated = salesList.filter((s) => s.sales_id !== salesId);
    this.set(STORAGE_KEYS.SALES, updated);
    firestoreSync.deleteDocument(FIRESTORE_COLLECTIONS.SALES, salesId);

    // Also remove sales company accesses
    const accesses = this.getSalesCompanyAccess().filter((a) => a.sales_id !== salesId);
    this.set(STORAGE_KEYS.SALES_ACCESS, accesses);

    const comp = this.getCompanyById(target.company_id);
    this.addAuditLog({
      company_id: target.company_id,
      company_code: comp?.company_code || 'GRP',
      action: 'DELETE',
      module: 'SALES_PERSON',
      record_id: target.sales_id,
      record_identifier: target.sales_code,
      description: `${this.getCurrentUser().name} | DELETE | SALES_PERSON | ${comp?.company_code} | Deleted sales rep ${target.sales_name} (${target.sales_code})`,
    });
  }

  // Sales Company Access
  getSalesCompanyAccess(): SalesCompanyAccess[] {
    return this.get<SalesCompanyAccess[]>(STORAGE_KEYS.SALES_ACCESS, INITIAL_SALES_ACCESS);
  }

  getAccessForSales(salesId: string): SalesCompanyAccess[] {
    return this.getSalesCompanyAccess().filter((a) => a.sales_id === salesId && a.status === 'active');
  }

  updateSalesAccess(salesId: string, companyAccessList: { company_id: string; is_default: boolean; has_access: boolean }[]): void {
    let accesses = this.getSalesCompanyAccess().filter((a) => a.sales_id !== salesId);
    const now = new Date().toISOString();

    for (const item of companyAccessList) {
      if (item.has_access) {
        accesses.push({
          id: generateUUID(),
          sales_id: salesId,
          company_id: item.company_id,
          is_default: item.is_default,
          status: 'active',
          created_at: now,
        });
      }
    }

    this.set(STORAGE_KEYS.SALES_ACCESS, accesses);
    this.addAuditLog({
      company_id: companyAccessList.find((c) => c.is_default)?.company_id || INITIAL_COMPANIES[0].company_id,
      company_code: 'ACCESS',
      action: 'UPDATE',
      module: 'ACCESS_CONTROL',
      record_id: salesId,
      record_identifier: salesId,
      description: `${this.getCurrentUser().name} | UPDATE | ACCESS_CONTROL | SALES_ACCESS | Updated permissions for Sales ID ${salesId}`,
    });
  }

  // Customers
  getCustomers(): Customer[] {
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.customer_id === id);
  }

  saveCustomer(customerData: Omit<Customer, 'customer_id' | 'created_at'> & { customer_id?: string }): Customer {
    const customers = this.getCustomers();
    const now = new Date().toISOString();
    let saved: Customer;

    if (customerData.customer_id) {
      const idx = customers.findIndex((c) => c.customer_id === customerData.customer_id);
      if (idx === -1) throw new Error('Customer not found');
      saved = {
        ...customers[idx],
        ...customerData,
        customer_id: customerData.customer_id,
      };
      customers[idx] = saved;
    } else {
      saved = {
        ...customerData,
        customer_id: generateUUID(),
        created_at: now,
      };
      customers.push(saved);
    }

    this.set(STORAGE_KEYS.CUSTOMERS, customers);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.CUSTOMERS, saved.customer_id, saved);
    return saved;
  }

  // Customer Companies relations (Option A Global Customer)
  getCustomerCompanies(): CustomerCompany[] {
    return this.get<CustomerCompany[]>(STORAGE_KEYS.CUSTOMER_COMPANIES, INITIAL_CUSTOMER_COMPANIES);
  }

  getCustomerCompaniesByCompany(companyId: string): CustomerCompany[] {
    return this.getCustomerCompanies().filter((cc) => cc.company_id === companyId && cc.status === 'active');
  }

  getCustomerCompaniesByCustomer(customerId: string): CustomerCompany[] {
    return this.getCustomerCompanies().filter((cc) => cc.customer_id === customerId);
  }

  saveCustomerCompany(entry: Omit<CustomerCompany, 'id'> & { id?: string }): CustomerCompany {
    const list = this.getCustomerCompanies();
    let saved: CustomerCompany;
    if (entry.id) {
      const idx = list.findIndex((c) => c.id === entry.id);
      if (idx === -1) throw new Error('Record not found');
      saved = { ...list[idx], ...entry, id: entry.id };
      list[idx] = saved;
    } else {
      saved = { ...entry, id: generateUUID() };
      list.push(saved);
    }
    this.set(STORAGE_KEYS.CUSTOMER_COMPANIES, list);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.CUSTOMER_COMPANIES, saved.id, saved);
    return saved;
  }

  // Products
  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.product_id === id);
  }

  saveProduct(data: Omit<Product, 'product_id'> & { product_id?: string }): Product {
    const products = this.getProducts();
    let saved: Product;

    // Check code uniqueness
    const existingCode = products.find(
      (p) => p.product_code.toLowerCase() === data.product_code.trim().toLowerCase() && p.product_id !== data.product_id
    );
    if (existingCode) {
      throw new Error(`Kode produk "${data.product_code}" sudah digunakan oleh "${existingCode.product_name}". Gunakan kode lain.`);
    }

    if (data.product_id) {
      const idx = products.findIndex((p) => p.product_id === data.product_id);
      if (idx === -1) throw new Error('Produk tidak ditemukan');
      saved = {
        ...products[idx],
        ...data,
        product_id: data.product_id,
      };
      products[idx] = saved;
    } else {
      saved = {
        ...data,
        product_id: generateUUID(),
      };
      products.push(saved);
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.PRODUCTS, saved.product_id, saved);

    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      company_id: 'ALL',
      company_code: 'GRP',
      action: data.product_id ? 'UPDATE' : 'CREATE',
      module: 'COMPANY',
      record_id: saved.product_id,
      record_identifier: saved.product_code,
      description: `${currentUser.name} | ${data.product_id ? 'UPDATE' : 'CREATE'} | PRODUCT_CATALOG | ${saved.product_code} - ${saved.product_name}`,
    });

    return saved;
  }

  deleteProduct(productId: string): void {
    const products = this.getProducts();
    const target = products.find((p) => p.product_id === productId);
    if (!target) throw new Error('Produk tidak ditemukan');

    const updated = products.filter((p) => p.product_id !== productId);
    this.set(STORAGE_KEYS.PRODUCTS, updated);
    firestoreSync.deleteDocument(FIRESTORE_COLLECTIONS.PRODUCTS, productId);

    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      company_id: 'ALL',
      company_code: 'GRP',
      action: 'DELETE',
      module: 'COMPANY',
      record_id: target.product_id,
      record_identifier: target.product_code,
      description: `${currentUser.name} | DELETE | PRODUCT_CATALOG | Menghapus produk ${target.product_code} (${target.product_name})`,
    });
  }

  bulkImportProducts(
    items: {
      product_code: string;
      product_name: string;
      category?: string;
      unit?: string;
      base_cost?: number;
      description?: string;
    }[],
    overwriteExisting: boolean = true
  ): { created: number; updated: number; skipped: number } {
    const products = this.getProducts();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.product_code || !item.product_name) {
        skipped++;
        continue;
      }

      const code = item.product_code.trim().toUpperCase();
      const existingIdx = products.findIndex((p) => p.product_code.toUpperCase() === code);

      if (existingIdx !== -1) {
        if (overwriteExisting) {
          const existing = products[existingIdx];
          const saved: Product = {
            ...existing,
            product_name: item.product_name.trim() || existing.product_name,
            category: item.category?.trim() || existing.category || 'Umum',
            unit: item.unit?.trim() || existing.unit || 'Pcs',
            base_cost: item.base_cost !== undefined ? Number(item.base_cost) : existing.base_cost,
            description: item.description !== undefined ? item.description.trim() : existing.description,
          };
          products[existingIdx] = saved;
          firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.PRODUCTS, saved.product_id, saved);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const saved: Product = {
          product_id: generateUUID(),
          product_code: code,
          product_name: item.product_name.trim(),
          category: item.category?.trim() || 'Umum',
          unit: item.unit?.trim() || 'Pcs',
          base_cost: Number(item.base_cost) || 0,
          description: item.description?.trim() || '',
        };
        products.push(saved);
        firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.PRODUCTS, saved.product_id, saved);
        created++;
      }
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);

    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      company_id: 'ALL',
      company_code: 'GRP',
      action: 'CREATE',
      module: 'COMPANY',
      record_id: 'BULK_IMPORT',
      record_identifier: 'CSV_IMPORT',
      description: `${currentUser.name} | BULK_IMPORT | PRODUCT_CATALOG | Impor ${created} produk baru, perbarui ${updated} produk, lewati ${skipped}`,
    });

    return { created, updated, skipped };
  }

  // Price Lists (Price linked to Company, Product, Customer Type)
  getPriceLists(): PriceList[] {
    return this.get<PriceList[]>(STORAGE_KEYS.PRICE_LISTS, INITIAL_PRICE_LISTS);
  }

  resolveProductPrice(
    companyId: string,
    productId: string,
    customerType: string = 'all',
    customerId?: string,
    quantity: number = 1
  ): number {
    const lists = this.getPriceLists().filter(
      (pl) => pl.company_id === companyId && pl.product_id === productId && pl.status === 'active'
    );

    // 1. Try customer specific price
    if (customerId) {
      const custMatch = lists.find((pl) => pl.customer_id === customerId && quantity >= pl.min_quantity);
      if (custMatch) return custMatch.unit_price;
    }

    // 2. Try customer type match
    const typeMatch = lists.find(
      (pl) => (pl.customer_type === customerType || pl.customer_type === 'all') && quantity >= pl.min_quantity
    );
    if (typeMatch) return typeMatch.unit_price;

    // 3. Fallback to product base cost * 1.3
    const product = this.getProductById(productId);
    return product ? Math.round(product.base_cost * 1.35) : 25000;
  }

  savePriceList(entry: Omit<PriceList, 'id'> & { id?: string }): PriceList {
    const list = this.getPriceLists();
    let saved: PriceList;
    if (entry.id) {
      const idx = list.findIndex((p) => p.id === entry.id);
      if (idx === -1) throw new Error('Price list not found');
      saved = { ...list[idx], ...entry, id: entry.id };
      list[idx] = saved;
    } else {
      saved = { ...entry, id: generateUUID() };
      list.push(saved);
    }
    this.set(STORAGE_KEYS.PRICE_LISTS, list);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.PRICE_LISTS, saved.id, saved);
    return saved;
  }

  // Sales Orders & SO Number generator per company
  getSalesOrders(): SalesOrder[] {
    return this.get<SalesOrder[]>(STORAGE_KEYS.SALES_ORDERS, INITIAL_ORDERS);
  }

  getSalesOrderById(id: string): SalesOrder | undefined {
    return this.getSalesOrders().find((o) => o.so_id === id);
  }

  /**
   * Generates next unique SO number:
   * Format: [COMPANY CODE]-YYYYMMDD-XXXX
   * e.g. EXA-20260928-0001
   */
  generateNextSONumber(companyId: string, orderDateStr?: string): string {
    const company = this.getCompanyById(companyId);
    if (!company) throw new Error('Company not found for SO numbering');

    const date = orderDateStr ? new Date(orderDateStr) : new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}${mm}${dd}`;

    const prefix = `${company.company_code}-${datePrefix}-`;
    const orders = this.getSalesOrders();
    const matching = orders
      .filter((o) => o.so_number.startsWith(prefix))
      .map((o) => {
        const parts = o.so_number.split('-');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((n) => !isNaN(n));

    const nextSeq = matching.length > 0 ? Math.max(...matching) + 1 : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Create or update Sales Order
   * CRITICAL: company_id is NOT NULL and Foreign Key to companies
   */
  saveSalesOrder(orderData: {
    so_id?: string;
    so_number?: string;
    company_id: string; // REQUIRED NOT NULL
    sales_id: string;
    customer_id: string;
    order_date: string;
    payment_terms: string;
    due_date: string;
    delivery_date: string;
    notes: string;
    tax_enabled?: boolean;
    tax_rate?: number;
    tax_amount?: number;
    status: SalesOrder['status'];
    items: Omit<SalesOrderItem, 'id' | 'so_id'>[];
  }): SalesOrder {
    if (!orderData.company_id) {
      throw new Error('Database Constraint Violation: company_id cannot be null on Sales Order');
    }

    const company = this.getCompanyById(orderData.company_id);
    if (!company) {
      throw new Error(`Foreign Key Violation: company_id ${orderData.company_id} does not exist in companies table`);
    }

    const sales = this.getSalesById(orderData.sales_id);
    if (!sales) {
      throw new Error('Foreign Key Violation: sales_id does not exist in sales table');
    }

    const customer = this.getCustomerById(orderData.customer_id);
    if (!customer) {
      throw new Error('Foreign Key Violation: customer_id does not exist in customers table');
    }

    const orders = this.getSalesOrders();
    const now = new Date().toISOString();
    let saved: SalesOrder;

    // Calculate totals
    const calculatedItems: SalesOrderItem[] = orderData.items.map((item, idx) => ({
      ...item,
      id: generateUUID(),
      so_id: orderData.so_id || '',
      subtotal: Math.round(item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)),
    }));

    const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const tax_enabled = orderData.tax_enabled !== undefined 
      ? orderData.tax_enabled 
      : (orderData.tax_amount !== undefined ? orderData.tax_amount > 0 : true);
    const tax_rate = orderData.tax_rate !== undefined ? orderData.tax_rate : (tax_enabled ? 11 : 0);
    const tax_amount = tax_enabled ? Math.round(subtotal * (tax_rate / 100)) : 0;
    const total_amount = subtotal + tax_amount;

    if (orderData.so_id) {
      const idx = orders.findIndex((o) => o.so_id === orderData.so_id);
      if (idx === -1) throw new Error('Order not found');
      const existing = orders[idx];
      const paid = existing.paid_amount || 0;
      saved = {
        ...existing,
        ...orderData,
        so_id: existing.so_id,
        so_number: orderData.so_number?.trim() || existing.so_number,
        subtotal,
        tax_enabled,
        tax_rate,
        tax_amount,
        total_amount,
        paid_amount: paid,
        outstanding_amount: Math.max(0, total_amount - paid),
        items: calculatedItems.map((item) => ({ ...item, so_id: existing.so_id })),
        updated_at: now,
      };
      orders[idx] = saved;
    } else {
      const so_id = generateUUID();
      const so_number = orderData.so_number?.trim() || this.generateNextSONumber(orderData.company_id, orderData.order_date);

      // Verify uniqueness
      if (orders.some((o) => o.so_number === so_number)) {
        throw new Error(`Unique Constraint Violation: SO number "${so_number}" already exists. Please choose a different number.`);
      }

      saved = {
        ...orderData,
        so_id,
        so_number,
        subtotal,
        tax_enabled,
        tax_rate,
        tax_amount,
        total_amount,
        paid_amount: 0,
        outstanding_amount: total_amount,
        items: calculatedItems.map((item) => ({ ...item, so_id })),
        created_at: now,
        updated_at: now,
      };
      orders.unshift(saved);
    }

    this.set(STORAGE_KEYS.SALES_ORDERS, orders);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.SALES_ORDERS, saved.so_id, saved);

    // Requirement #17: Audit Log
    // E.g. ANDI | CREATE | SALES_ORDER | EXA | SO-20260928-0001
    const currentUser = this.getCurrentUser();
    const action = orderData.so_id ? 'UPDATE' : 'CREATE';
    this.addAuditLog({
      company_id: saved.company_id,
      company_code: company.company_code,
      user_id: currentUser.user_id,
      user_name: currentUser.name.toUpperCase().split(' ')[0],
      role: currentUser.role,
      action,
      module: 'SALES_ORDER',
      record_id: saved.so_id,
      record_identifier: saved.so_number,
      description: `${currentUser.name.toUpperCase().split(' ')[0]} | ${action} | SALES_ORDER | ${company.company_code} | ${saved.so_number}`,
      new_value: {
        total_amount: saved.total_amount,
        customer: customer.customer_name,
        items_count: saved.items.length,
      },
    });

    return saved;
  }

  // Payments (Requirement #10: company_id strictly from Sales Order)
  getPayments(): Payment[] {
    return this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  recordPayment(data: {
    so_id: string; // Foreign key to Sales Order
    amount: number;
    payment_date: string;
    payment_method: Payment['payment_method'];
    reference_number: string;
    bank_name?: string;
    notes?: string;
  }): Payment {
    const orders = this.getSalesOrders();
    const soIdx = orders.findIndex((o) => o.so_id === data.so_id);
    if (soIdx === -1) throw new Error('Sales Order not found');

    const so = orders[soIdx];
    // REQUIREMENT #10: Company is inherited strictly from Sales Order.company_id!
    const companyId = so.company_id;
    const company = this.getCompanyById(companyId);
    if (!company) throw new Error('Company of Sales Order does not exist');

    if (data.amount <= 0) throw new Error('Payment amount must be greater than zero');

    const date = new Date(data.payment_date);
    const datePrefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const payments = this.getPayments();
    const compPayments = payments.filter((p) => p.payment_number.startsWith(`PAY-${company.company_code}-${datePrefix}-`));
    const nextSeq = compPayments.length + 1;
    const paymentNumber = `PAY-${company.company_code}-${datePrefix}-${String(nextSeq).padStart(4, '0')}`;

    const newPayment: Payment = {
      payment_id: generateUUID(),
      company_id: companyId, // STRICTLY INHERITED FROM SO
      so_id: so.so_id,
      so_number: so.so_number,
      payment_number: paymentNumber,
      payment_date: data.payment_date,
      amount: data.amount,
      payment_method: data.payment_method,
      reference_number: data.reference_number,
      bank_name: data.bank_name,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.PAYMENTS, newPayment.payment_id, newPayment);

    // Update Sales Order paid and outstanding amounts
    so.paid_amount = (so.paid_amount || 0) + data.amount;
    so.outstanding_amount = Math.max(0, so.total_amount - so.paid_amount);
    if (so.outstanding_amount === 0 && so.status !== 'cancelled') {
      so.status = 'completed';
    }
    so.updated_at = new Date().toISOString();
    orders[soIdx] = so;
    this.set(STORAGE_KEYS.SALES_ORDERS, orders);
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.SALES_ORDERS, so.so_id, so);

    // Audit log
    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      company_id: companyId,
      company_code: company.company_code,
      user_id: currentUser.user_id,
      user_name: currentUser.name.toUpperCase().split(' ')[0],
      role: currentUser.role,
      action: 'PAYMENT',
      module: 'PAYMENT',
      record_id: newPayment.payment_id,
      record_identifier: newPayment.payment_number,
      description: `${currentUser.name.toUpperCase().split(' ')[0]} | PAYMENT | PAYMENT | ${company.company_code} | ${newPayment.payment_number} for ${so.so_number}`,
      new_value: {
        amount: data.amount,
        so_number: so.so_number,
      },
    });

    return newPayment;
  }

  // Audit Logs (Requirement #17)
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp' | 'user_id' | 'user_name' | 'role'> & {
    user_id?: string;
    user_name?: string;
    role?: string;
  }): AuditLog {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      user_id: entry.user_id || currentUser.user_id,
      user_name: entry.user_name || currentUser.name.toUpperCase().split(' ')[0],
      role: entry.role || currentUser.role,
      ...entry,
    };
    logs.unshift(newLog);
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Cap to recent 500 logs
    firestoreSync.saveDocument(FIRESTORE_COLLECTIONS.AUDIT_LOGS, newLog.id, newLog);
    return newLog;
  }

  // Reset to sample initial state
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SALES_ACCESS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.PRICE_LISTS);
    localStorage.removeItem(STORAGE_KEYS.SALES_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}

export const storage = new StorageService();
