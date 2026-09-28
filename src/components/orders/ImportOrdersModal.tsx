import React, { useState, useRef, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatIDR } from '../../lib/currency';
import { downloadOrderImportTemplateCSV } from '../../lib/csvExport';
import {
  Upload,
  FileSpreadsheet,
  FileDown,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Users2,
  Calendar,
  Layers,
  Check,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ImportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedOrderRow {
  so_number: string;
  order_date: string;
  company_code: string;
  sales_code: string;
  customer_name: string;
  product_name_or_code: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  payment_terms: string;
  status: string;
  paid_amount: number;
  notes: string;
  isValid: boolean;
  errorMsg?: string;
  isExistingCustomer: boolean;
  isExistingProduct: boolean;
}

export const ImportOrdersModal: React.FC<ImportOrdersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    companies,
    salesList,
    customers,
    products,
    currentUser,
    bulkImportSalesOrders,
    defaultSalesCompany,
  } = useERP();

  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedOrderRow[]>([]);
  const [defaultCompanyId, setDefaultCompanyId] = useState<string>(
    defaultSalesCompany?.company_id || companies[0]?.company_id || ''
  );
  const [defaultSalesId, setDefaultSalesId] = useState<string>(
    currentUser.sales_id || salesList[0]?.sales_id || ''
  );
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    createdOrders: number;
    updatedOrders: number;
    skippedOrders: number;
    totalAmount: number;
    createdPayments: number;
    createdCustomers: number;
    createdProducts: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Existing names & codes sets for fast lookup
  const existingCustomerNames = useMemo(
    () => new Set(customers.map((c) => c.customer_name.trim().toLowerCase())),
    [customers]
  );

  const existingProductCodesAndNames = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      s.add(p.product_code.trim().toLowerCase());
      s.add(p.product_name.trim().toLowerCase());
    });
    return s;
  }, [products]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setImportError(null);
    setImportResult(null);
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportError('File kosong atau tidak dapat dibaca.');
          return;
        }

        const lines = text
          .split(/\r\n|\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length <= 1) {
          setImportError('File hanya berisi baris judul tanpa data transaksi.');
          return;
        }

        // CSV parsing helper with quote handling
        const parseRow = (rowStr: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (char === '"') {
              if (inQuotes && rowStr[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if ((char === ',' || char === ';') && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rawHeaders = parseRow(lines[0]).map((h) =>
          h.toLowerCase().replace(/[^a-z0-9]/g, '')
        );

        // Alias matching
        const getColIdx = (aliases: string[]) => {
          return rawHeaders.findIndex((h) => aliases.some((a) => h.includes(a)));
        };

        const soNumIdx = getColIdx(['noso', 'nomorso', 'sonumber', 'orderid', 'nofaktur', 'ref']);
        const dateIdx = getColIdx(['tanggal', 'tgl', 'date', 'orderdate', 'tglpesanan']);
        const compIdx = getColIdx(['pt', 'perusahaan', 'company', 'kodept', 'companycode']);
        const salesIdx = getColIdx(['sales', 'kodesales', 'namasales', 'salescode', 'salesname']);
        const custIdx = getColIdx(['pelanggan', 'customer', 'namapelanggan', 'customername', 'klien']);
        const prodIdx = getColIdx(['produk', 'barang', 'product', 'sku', 'namaproduk', 'item']);
        const qtyIdx = getColIdx(['qty', 'quantity', 'jumlah', 'kuantitas', 'vol']);
        const priceIdx = getColIdx(['harga', 'unitprice', 'hargasatuan', 'price', 'rate']);
        const discIdx = getColIdx(['diskon', 'discount', 'disc']);
        const topIdx = getColIdx(['termin', 'top', 'paymentterms', 'syaratbayar']);
        const statusIdx = getColIdx(['status', 'orderstatus', 'statuspesanan']);
        const paidIdx = getColIdx(['terbayar', 'paid', 'dibayar', 'paidamount']);
        const notesIdx = getColIdx(['catatan', 'keterangan', 'notes', 'memo']);

        const resolvedCustIdx = custIdx !== -1 ? custIdx : 4;
        const resolvedProdIdx = prodIdx !== -1 ? prodIdx : 5;
        const resolvedQtyIdx = qtyIdx !== -1 ? qtyIdx : 6;
        const resolvedPriceIdx = priceIdx !== -1 ? priceIdx : 7;

        const parsed: ParsedOrderRow[] = lines.slice(1).map((line, idx) => {
          const cols = parseRow(line);

          const rawSoNum = soNumIdx !== -1 && cols[soNumIdx] ? cols[soNumIdx].trim() : '';
          const rawDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : '';
          const rawComp = compIdx !== -1 && cols[compIdx] ? cols[compIdx].trim() : '';
          const rawSales = salesIdx !== -1 && cols[salesIdx] ? cols[salesIdx].trim() : '';
          const rawCust = (cols[resolvedCustIdx] || '').trim();
          const rawProd = (cols[resolvedProdIdx] || '').trim();
          const rawQtyStr = (cols[resolvedQtyIdx] || '1').replace(/[^0-9.]/g, '');
          const rawQty = parseFloat(rawQtyStr) || 1;
          const rawPriceStr = (cols[resolvedPriceIdx] || '0').replace(/[^0-9.]/g, '');
          const rawPrice = parseFloat(rawPriceStr) || 0;
          const rawDiscStr = discIdx !== -1 && cols[discIdx] ? cols[discIdx].replace(/[^0-9.]/g, '') : '0';
          const rawDisc = parseFloat(rawDiscStr) || 0;
          const rawTop = topIdx !== -1 && cols[topIdx] ? cols[topIdx].trim() : 'TOP 30 Hari';
          const rawStatus = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx].trim() : 'confirmed';
          const rawPaidStr = paidIdx !== -1 && cols[paidIdx] ? cols[paidIdx].replace(/[^0-9.]/g, '') : '';
          const rawPaid = rawPaidStr !== '' ? parseFloat(rawPaidStr) : 0;
          const rawNotes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx].trim() : '';

          const hasCustomer = Boolean(rawCust);
          const hasProduct = Boolean(rawProd);
          const isValid = hasCustomer && hasProduct;

          let errorMsg: string | undefined;
          if (!hasCustomer && !hasProduct) {
            errorMsg = 'Nama pelanggan dan produk wajib diisi';
          } else if (!hasCustomer) {
            errorMsg = 'Nama pelanggan kosong';
          } else if (!hasProduct) {
            errorMsg = 'Nama produk / SKU kosong';
          }

          const isExistingCustomer = existingCustomerNames.has(rawCust.toLowerCase());
          const isExistingProduct = existingProductCodesAndNames.has(rawProd.toLowerCase());

          return {
            so_number: rawSoNum,
            order_date: rawDate,
            company_code: rawComp,
            sales_code: rawSales,
            customer_name: rawCust || `Pelanggan Baris ${idx + 2}`,
            product_name_or_code: rawProd || 'Produk Standar',
            quantity: rawQty,
            unit_price: rawPrice,
            discount_percent: rawDisc,
            payment_terms: rawTop || 'TOP 30 Hari',
            status: rawStatus,
            paid_amount: rawPaid,
            notes: rawNotes,
            isValid,
            errorMsg,
            isExistingCustomer,
            isExistingProduct,
          };
        });

        if (parsed.length === 0) {
          setImportError('Tidak ada baris data yang berhasil terbaca.');
          return;
        }

        setParsedRows(parsed);
      } catch (err: any) {
        setImportError(`Gagal memproses file CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError('Tidak ada baris data yang valid untuk diimpor.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    setTimeout(() => {
      try {
        const result = bulkImportSalesOrders(validRows, {
          overwriteExisting,
          defaultCompanyId,
          defaultSalesId,
        });

        setImportResult(result);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setImportError(err.message || 'Gagal menyimpan data impor.');
      } finally {
        setIsImporting(false);
      }
    }, 300);
  };

  // Metrics summary of parsed file
  const summary = useMemo(() => {
    const validRows = parsedRows.filter((r) => r.isValid);
    const uniqueOrders = new Set(
      validRows.map((r, i) => r.so_number || `AUTO_${r.customer_name}_${r.order_date}_${i}`)
    );
    const totalEstValue = validRows.reduce((sum, r) => {
      const disc = (r.discount_percent || 0) / 100;
      return sum + r.quantity * r.unit_price * (1 - disc);
    }, 0);
    const newCustomersCount = validRows.filter((r) => !r.isExistingCustomer).length;
    const newProductsCount = validRows.filter((r) => !r.isExistingProduct).length;

    return {
      totalRows: parsedRows.length,
      validRowsCount: validRows.length,
      invalidRowsCount: parsedRows.length - validRows.length,
      uniqueOrdersCount: uniqueOrders.size,
      totalEstValue,
      newCustomersCount,
      newProductsCount,
    };
  }, [parsedRows]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Migrasi Data Penjualan
                </span>
                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-200 rounded text-[9px] font-mono">
                  CSV / EXCEL
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Impor Data Sales Order Lama
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadOrderImportTemplateCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/10 cursor-pointer"
              title="Unduh contoh format CSV yang siap diisi"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-300" />
              <span>Unduh Template CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Impor Data Sales Order Berhasil!
              </h4>
              <p className="text-slate-600 text-xs max-w-lg mx-auto leading-relaxed">
                Data transaksi penjualan lama telah berhasil dimutasikan ke dalam sistem ERP. Seluruh saldo piutang, status pelunasan, dan kartu penjualan otomatis terbarui.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2 text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Pesanan Dibuat</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {importResult.createdOrders} SO
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Pesanan Diupdate</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {importResult.updatedOrders} SO
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Pelanggan Baru</div>
                  <div className="text-base font-bold text-blue-700 mt-0.5">
                    +{importResult.createdCustomers}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Pembayaran Dicatat</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {importResult.createdPayments} Kuitansi
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportResult(null);
                    setImportFile(null);
                    setParsedRows([]);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Impor File Lainnya
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Lihat Daftar Sales Orders
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Alert / Error notification */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {!importFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, text/csv, .txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Pilih File CSV Data Penjualan
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                    Klik di sini untuk menelusuri file dari perangkat Anda. Mendukung file berekstensi <strong>.csv</strong> dengan pemisah koma (,) atau titik-koma (;).
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <span>Atau gunakan template:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadOrderImportTemplateCSV();
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Unduh Template Contoh
                    </button>
                  </div>
                </div>
              )}

              {/* File Info Bar if uploaded */}
              {importFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900">{importFile.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(importFile.size / 1024).toFixed(1)} KB · {parsedRows.length} baris terdeteksi
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFile(null);
                      setParsedRows([]);
                    }}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                  >
                    Ganti File
                  </button>
                </div>
              )}

              {/* Default Settings for Import */}
              {parsedRows.length > 0 && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Konfigurasi Default Migrasi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                        PT Default (Jika kolom PT kosong)
                      </label>
                      <select
                        value={defaultCompanyId}
                        onChange={(e) => setDefaultCompanyId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        {companies.map((c) => (
                          <option key={c.company_id} value={c.company_id}>
                            {c.company_code} - {c.company_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                        Sales Default (Jika kolom sales kosong)
                      </label>
                      {currentUser.role === 'sales' ? (
                        <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium truncate">
                          {currentUser.name} (Terkunci)
                        </div>
                      ) : (
                        <select
                          value={defaultSalesId}
                          onChange={(e) => setDefaultSalesId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          {salesList.map((s) => (
                            <option key={s.sales_id} value={s.sales_id}>
                              {s.sales_code} - {s.sales_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={overwriteExisting}
                          onChange={(e) => setOverwriteExisting(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-800 text-[11px]">
                          Update jika No. SO sudah ada
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Summary Badges */}
              {parsedRows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Pesanan Terdeteksi</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {summary.uniqueOrdersCount} SO
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Dari {summary.validRowsCount} baris valid
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Estimasi Nilai Total</div>
                    <div className="text-xs font-bold font-mono text-emerald-700 mt-1 truncate">
                      {formatIDR(summary.totalEstValue)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Total bruto transaksi</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Pelanggan Baru</div>
                    <div className="text-base font-bold text-blue-700 mt-0.5">
                      +{summary.newCustomersCount}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Akan didaftarkan otomatis</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Produk Baru</div>
                    <div className="text-base font-bold text-amber-700 mt-0.5">
                      +{summary.newProductsCount}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Akan didaftarkan otomatis</div>
                  </div>
                </div>
              )}

              {/* Table Preview */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs flex items-center justify-between">
                    <span>Pratinjau Data Impor ({parsedRows.length} Baris)</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Menampilkan sampel hingga 10 baris
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">No. SO</th>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">PT</th>
                          <th className="py-2 px-3">Pelanggan</th>
                          <th className="py-2 px-3">Produk</th>
                          <th className="py-2 px-3 text-right">Qty</th>
                          <th className="py-2 px-3 text-right">Harga</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {parsedRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>OK</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-semibold" title={row.errorMsg}>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Error</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {row.so_number || <span className="text-slate-400 italic">Auto</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {row.order_date || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {row.company_code || 'DEF'}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[120px]">
                              {row.customer_name}
                              {!row.isExistingCustomer && (
                                <span className="ml-1 text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-normal">
                                  Baru
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700 truncate max-w-[140px]">
                              {row.product_name_or_code}
                              {!row.isExistingProduct && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-normal">
                                  Baru
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                              {row.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800">
                              {formatIDR(row.unit_price)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  row.status === 'completed' || row.status === 'lunas'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {row.status || 'confirmed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Pelanggan dan produk yang belum terdaftar akan otomatis dibuatkan data baru.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isImporting}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={parsedRows.length === 0 || summary.validRowsCount === 0 || isImporting}
                    onClick={handleExecuteImport}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isImporting
                        ? 'Memproses Impor...'
                        : `Impor ${summary.uniqueOrdersCount} Sales Order Sekarang`}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
