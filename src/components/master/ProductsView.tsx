import React, { useState, useMemo, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types';
import { formatIDR } from '../../lib/currency';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Boxes,
  Layers,
  ArrowRight,
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  FileUp,
  RefreshCw,
  Check,
} from 'lucide-react';

interface ProductsViewProps {
  onNavigateToTab?: (tab: any) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigateToTab }) => {
  const { products, saveProduct, deleteProduct, bulkImportProducts, currentUser } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Single Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Sak');
  const [baseCost, setBaseCost] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<
    {
      product_code: string;
      product_name: string;
      category: string;
      unit: string;
      base_cost: number;
      description: string;
      isExisting: boolean;
      isValid: boolean;
      errorMsg?: string;
    }[]
  >([]);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    const nextSeq = String(products.length + 1).padStart(3, '0');
    setProductCode(`PRD-${nextSeq}`);
    setProductName('');
    setCategory('Pupuk & Agrikultur');
    setUnit('Sak');
    setBaseCost(150000);
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductCode(p.product_code);
    setProductName(p.product_name);
    setCategory(p.category);
    setUnit(p.unit);
    setBaseCost(p.base_cost || 0);
    setDescription(p.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!productCode.trim()) {
      setFormError('Kode produk wajib diisi.');
      return;
    }
    if (!productName.trim()) {
      setFormError('Nama produk katalog wajib diisi.');
      return;
    }
    if (!unit.trim()) {
      setFormError('Satuan produk (Pcs, Sak, Kg, Ton, dll) wajib diisi.');
      return;
    }

    try {
      saveProduct({
        product_id: editingProduct ? editingProduct.product_id : undefined,
        product_code: productCode.trim().toUpperCase(),
        product_name: productName.trim(),
        category: category.trim() || 'Umum',
        unit: unit.trim(),
        base_cost: Number(baseCost) || 0,
        description: description.trim(),
      });

      setIsModalOpen(false);
      setSuccessMsg(
        editingProduct
          ? `Produk "${productName}" berhasil diperbarui!`
          : `Produk baru "${productName}" berhasil ditambahkan ke katalog!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan produk.');
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    try {
      deleteProduct(deleteTarget.product_id);
      setSuccessMsg(`Produk "${deleteTarget.product_name}" telah dihapus dari katalog.`);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  // ==========================================
  // EXPORT TO CSV
  // ==========================================
  const handleExportCSV = (all: boolean = true) => {
    const listToExport = all ? products : filteredProducts;
    if (listToExport.length === 0) {
      alert('Tidak ada data produk untuk diekspor.');
      return;
    }

    const headers = ['Kode SKU', 'Nama Produk', 'Kategori', 'Satuan', 'HPP Acuan (Rp)', 'Deskripsi'];
    const rows = listToExport.map((p) => [
      `"${p.product_code.replace(/"/g, '""')}"`,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${(p.category || 'Umum').replace(/"/g, '""')}"`,
      `"${(p.unit || 'Pcs').replace(/"/g, '""')}"`,
      p.base_cost || 0,
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `katalog_master_produk_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg(`Berhasil mengekspor ${listToExport.length} produk ke file CSV!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ==========================================
  // DOWNLOAD CSV TEMPLATE
  // ==========================================
  const handleDownloadTemplate = () => {
    const headers = ['Kode SKU', 'Nama Produk', 'Kategori', 'Satuan', 'HPP Acuan (Rp)', 'Deskripsi'];
    const samples = [
      ['"PRD-BRS-01"', '"Beras Premium Setra Ramos 50kg"', '"Pangan Pokok & Beras"', '"Sak"', '620000', '"Kemasan karung goni 50kg premium"'],
      ['"PRD-NPK-01"', '"Pupuk NPK Phonska Plus 50kg"', '"Pupuk & Agrikultur"', '"Sak"', '175000', '"Pupuk majemuk NPK 15-15-15"'],
      ['"PRD-SMN-01"', '"Semen Gresik Portland 50kg"', '"Bahan Bangunan & Semen"', '"Sak"', '58000', '"Semen tipe 1 SNI mutu tinggi"'],
      ['"PRD-MNY-01"', '"Minyak Goreng Sawit Curah 18L"', '"Komoditas Minyak"', '"Jerigen"', '240000', '"Jerigen food grade 18 liter"'],
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), ...samples.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_import_katalog_produk.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // IMPORT CSV PARSER
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportError('File kosong.');
          return;
        }

        // CSV parsing supporting quotes & commas
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setImportError('File harus memiliki baris header dan setidaknya satu baris data.');
          return;
        }

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

        // Find index of standard fields
        const getColIdx = (aliases: string[]) => {
          return rawHeaders.findIndex((h) => aliases.some((a) => h.includes(a)));
        };

        const codeIdx = getColIdx(['kodesku', 'kodeproduk', 'productcode', 'sku', 'kode', 'code']);
        const nameIdx = getColIdx(['namaproduk', 'namabarang', 'productname', 'nama', 'name']);
        const catIdx = getColIdx(['kategori', 'category']);
        const unitIdx = getColIdx(['satuan', 'unit', 'uom']);
        const costIdx = getColIdx(['hpp', 'biayadasar', 'basecost', 'cost', 'hargamodal']);
        const descIdx = getColIdx(['deskripsi', 'description', 'keterangan', 'spesifikasi']);

        const resolvedCodeIdx = codeIdx !== -1 ? codeIdx : 0;
        const resolvedNameIdx = nameIdx !== -1 ? nameIdx : 1;

        const existingCodes = new Set(products.map((p) => p.product_code.toUpperCase()));

        const parsed = lines.slice(1).map((line, idx) => {
          const cols = parseRow(line);
          const rawCode = (cols[resolvedCodeIdx] || '').trim().toUpperCase();
          const rawName = (cols[resolvedNameIdx] || '').trim();
          const rawCat = catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim() : 'Umum';
          const rawUnit = unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx].trim() : 'Pcs';
          const rawCostStr = costIdx !== -1 && cols[costIdx] ? cols[costIdx].replace(/[^0-9.]/g, '') : '0';
          const rawCost = parseFloat(rawCostStr) || 0;
          const rawDesc = descIdx !== -1 && cols[descIdx] ? cols[descIdx].trim() : '';

          const isValid = Boolean(rawCode && rawName);
          const isExisting = existingCodes.has(rawCode);

          return {
            product_code: rawCode,
            product_name: rawName,
            category: rawCat || 'Umum',
            unit: rawUnit || 'Pcs',
            base_cost: rawCost,
            description: rawDesc,
            isExisting,
            isValid,
            errorMsg: !isValid ? 'Kode SKU atau Nama Produk kosong' : undefined,
          };
        });

        if (parsed.length === 0) {
          setImportError('Tidak ada baris data yang terbaca dari file.');
          return;
        }

        setParsedRows(parsed);
      } catch (err: any) {
        setImportError(`Gagal membaca file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError('Tidak ada baris data yang valid untuk diimpor.');
      return;
    }

    setIsImporting(true);
    try {
      const result = bulkImportProducts(validRows, overwriteExisting);
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSuccessMsg(
        `Sukses mengimpor katalog: ${result.created} produk baru ditambahkan, ${result.updated} produk diperbarui${
          result.skipped > 0 ? `, ${result.skipped} dilewati` : ''
        }.`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setImportError(err.message || 'Gagal memproses impor produk.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedRows([]);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Master Katalog Produk</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                {products.length} Item Terdaftar
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Daftar master produk resmi yang otomatis muncul di dropdown saat Sales membuat pesanan (*Sales Order*).
              Dilengkapi fitur **Export & Import CSV** untuk pembaruan massal.
            </p>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            title="Unduh format template CSV untuk import"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Template CSV</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => handleExportCSV(true)}
            title="Ekspor seluruh katalog produk ke format CSV / Excel"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={() => {
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            title="Import daftar produk dari file CSV / Excel"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Import CSV</span>
          </button>

          {/* Add Single Product */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI / Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              Total Master Produk
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{products.length} SKU</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              Kategori Produk
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{categories.length} Kategori</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Pengaturan Harga PT
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">Matrix Harga per Entitas</div>
            </div>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('price-lists')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Atur Harga</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode produk, nama barang, atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-28">Kode SKU</th>
                <th className="py-3 px-4 min-w-[220px]">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-right">Biaya Dasar (HPP)</th>
                <th className="py-3 px-4 min-w-[200px]">Deskripsi / Spesifikasi</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada produk ditemukan.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau impor file CSV.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 bg-slate-50/50">
                      {p.product_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{p.product_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px]">
                        {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatIDR(p.base_cost || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {p.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Produk"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Hapus Produk"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingProduct ? 'Edit Master Produk' : 'Tambah Produk Baru ke Katalog'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Kode SKU / Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: PRD-BRS-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Satuan Standar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="unit-suggestions"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Sak, Kg, Ton, Dus..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="unit-suggestions">
                    <option value="Sak" />
                    <option value="Kg" />
                    <option value="Ton" />
                    <option value="Zak" />
                    <option value="Dus" />
                    <option value="Box" />
                    <option value="Pcs" />
                    <option value="Liter" />
                    <option value="Jerigen" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Produk Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Contoh: Beras Premium Rojo Lele 50kg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori Produk</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Pilih atau ketik kategori..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="category-suggestions">
                    <option value="Pupuk & Agrikultur" />
                    <option value="Pangan Pokok & Beras" />
                    <option value="Komoditas Minyak" />
                    <option value="Bahan Bangunan & Semen" />
                    <option value="Gula & Manisan" />
                    <option value="Bahan Kimia Industri" />
                    <option value="Pakan Ternak" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Biaya Dasar / HPP Acuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={baseCost}
                    onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Deskripsi / Spesifikasi Kemasan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan mutu, sertifikasi kemasan, kandungan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Simpan ke Katalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Import Master Produk (CSV)</h3>
                  <p className="text-[11px] text-slate-400">
                    Unggah file CSV untuk menambahkan atau memperbarui katalog produk massal.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseImportModal}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {importFile ? importFile.name : 'Klik untuk memilih file CSV'}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Mendukung pemisah koma (,) atau titik-koma (;). Header otomatis mendeteksi format Bahasa Indonesia maupun Inggris.
                  </p>
                </label>
              </div>

              {/* Download template prompt */}
              <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Belum punya formatnya? Unduh contoh template resmi kami.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded font-semibold text-[11px] transition-colors"
                >
                  Unduh Template
                </button>
              </div>

              {/* Parsed Rows Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>Pratinjau Data ({parsedRows.length} Baris Terbaca)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {parsedRows.filter((r) => r.isValid).length} Valid
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>Perbarui jika SKU sudah ada</span>
                    </label>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold">
                        <tr>
                          <th className="py-1.5 px-3">Status</th>
                          <th className="py-1.5 px-3">Kode SKU</th>
                          <th className="py-1.5 px-3">Nama Produk</th>
                          <th className="py-1.5 px-3">Kategori</th>
                          <th className="py-1.5 px-3 text-center">Satuan</th>
                          <th className="py-1.5 px-3 text-right">HPP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                            <td className="py-1.5 px-3">
                              {row.isValid ? (
                                row.isExisting ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Update
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Baru
                                  </span>
                                )
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono font-bold text-slate-800">
                              {row.product_code || '-'}
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900">{row.product_name}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.category}</td>
                            <td className="py-1.5 px-3 text-center font-bold text-blue-700">{row.unit}</td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-700">
                              {formatIDR(row.base_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 15 && (
                    <p className="text-[10px] text-slate-400 italic text-center">
                      Menampilkan 15 dari {parsedRows.length} produk.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCloseImportModal}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={parsedRows.length === 0 || isImporting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Proses Impor {parsedRows.filter((r) => r.isValid).length} Produk
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Produk</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong className="text-slate-900">{deleteTarget.product_name}</strong> ({deleteTarget.product_code}) dari katalog?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
