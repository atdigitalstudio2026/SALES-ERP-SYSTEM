/**
 * Generic CSV Export Utility
 * Provides RFC 4180 compliant CSV serialization and browser download triggers.
 */

export interface CSVColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

export interface CSVExportOptions {
  /** Include UTF-8 Byte Order Mark (\uFEFF) for Microsoft Excel compatibility. Default: true */
  addBOM?: boolean;
  /** Delimiter character, default: ',' */
  delimiter?: string;
}

/**
 * Escapes a cell value according to RFC 4180 rules.
 */
function escapeCSVValue(val: unknown, delimiter = ','): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // If string contains delimiter, double quotes, or newlines, quote it and escape internal quotes
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generic function to convert an array of objects into a CSV string.
 */
export function generateCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  options: CSVExportOptions = {}
): string {
  const { addBOM = true, delimiter = ',' } = options;

  // Header row
  const headerRow = columns.map((col) => escapeCSVValue(col.header, delimiter)).join(delimiter);

  // Data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        let rawVal: unknown;
        if (typeof col.accessor === 'function') {
          rawVal = col.accessor(row);
        } else {
          rawVal = row[col.accessor];
        }
        return escapeCSVValue(rawVal, delimiter);
      })
      .join(delimiter)
  );

  const csvBody = [headerRow, ...dataRows].join('\r\n');
  return addBOM ? `\uFEFF${csvBody}` : csvBody;
}

/**
 * Triggers a browser download of a CSV string.
 */
export function downloadCSVFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main generic utility: Serializes data and initiates download in one call.
 */
export function exportToCSV<T>(
  filename: string,
  data: T[],
  columns: CSVColumn<T>[],
  options?: CSVExportOptions
): boolean {
  if (!data || data.length === 0) {
    return false;
  }
  const csv = generateCSV(data, columns, options);
  downloadCSVFile(filename, csv);
  return true;
}

/**
 * Pre-configured CSV export for Product List View
 */
export function exportProductsToCSV(
  products: Array<{
    product_code: string;
    product_name: string;
    category?: string;
    unit?: string;
    base_cost?: number;
    min_stock?: number;
    status?: string;
    description?: string;
  }>,
  customFilename?: string
): boolean {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `katalog_master_produk_${dateStr}.csv`;

  const columns: CSVColumn<(typeof products)[0]>[] = [
    { header: 'Kode SKU', accessor: (p) => p.product_code },
    { header: 'Nama Produk', accessor: (p) => p.product_name },
    { header: 'Kategori', accessor: (p) => p.category || 'Umum' },
    { header: 'Satuan', accessor: (p) => p.unit || 'Pcs' },
    { header: 'HPP Acuan (Rp)', accessor: (p) => p.base_cost ?? 0 },
    { header: 'Stok Minimum', accessor: (p) => p.min_stock ?? 0 },
    { header: 'Status', accessor: (p) => (p.status === 'inactive' ? 'Nonaktif' : 'Aktif') },
    { header: 'Deskripsi Produk', accessor: (p) => p.description || '' },
  ];

  return exportToCSV(filename, products, columns);
}

/**
 * Pre-configured CSV export for Sales Order List View
 */
export function exportOrdersToCSV(
  orders: Array<{
    so_id: string;
    so_number: string;
    company_id: string;
    customer_id: string;
    sales_id: string;
    order_date: string;
    payment_terms?: string;
    due_date?: string;
    subtotal?: number;
    discount_amount?: number;
    tax_amount?: number;
    total_amount: number;
    paid_amount?: number;
    outstanding_amount: number;
    status: string;
    items?: Array<unknown>;
    notes?: string;
  }>,
  lookup: {
    getCompanyName?: (companyId: string) => string;
    getCompanyCode?: (companyId: string) => string;
    getCustomerName?: (customerId: string) => string;
    getSalesName?: (salesId: string) => string;
  } = {},
  customFilename?: string
): boolean {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `sales_orders_report_${dateStr}.csv`;

  const columns: CSVColumn<(typeof orders)[0]>[] = [
    { header: 'No. Order (SO)', accessor: (o) => o.so_number },
    { header: 'Tanggal Order', accessor: (o) => o.order_date },
    {
      header: 'Kode PT',
      accessor: (o) => lookup.getCompanyCode ? lookup.getCompanyCode(o.company_id) : o.company_id,
    },
    {
      header: 'Nama PT (Badan Usaha)',
      accessor: (o) => lookup.getCompanyName ? lookup.getCompanyName(o.company_id) : o.company_id,
    },
    {
      header: 'Nama Pelanggan',
      accessor: (o) => lookup.getCustomerName ? lookup.getCustomerName(o.customer_id) : o.customer_id,
    },
    {
      header: 'Sales Officer',
      accessor: (o) => lookup.getSalesName ? lookup.getSalesName(o.sales_id) : o.sales_id,
    },
    { header: 'Termin Pembayaran (TOP)', accessor: (o) => o.payment_terms || '-' },
    { header: 'Jatuh Tempo', accessor: (o) => o.due_date || '-' },
    { header: 'Subtotal (Rp)', accessor: (o) => o.subtotal ?? 0 },
    { header: 'Diskon (Rp)', accessor: (o) => o.discount_amount ?? 0 },
    { header: 'PPN / Pajak (Rp)', accessor: (o) => o.tax_amount ?? 0 },
    { header: 'Total Nilai Pesanan (Rp)', accessor: (o) => o.total_amount },
    { header: 'Total Terbayar (Rp)', accessor: (o) => o.paid_amount ?? 0 },
    { header: 'Sisa Piutang / Outstanding (Rp)', accessor: (o) => o.outstanding_amount },
    {
      header: 'Status Transaksi',
      accessor: (o) =>
        o.status === 'completed'
          ? 'Lunas'
          : o.status === 'confirmed'
          ? 'Disetujui'
          : o.status === 'processing'
          ? 'Proses'
          : o.status,
    },
    { header: 'Jumlah Baris Item', accessor: (o) => o.items?.length || 0 },
    { header: 'Catatan Transaksi', accessor: (o) => o.notes || '' },
  ];

  return exportToCSV(filename, orders, columns);
}
