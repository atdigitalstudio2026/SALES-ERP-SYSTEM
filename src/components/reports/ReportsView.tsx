import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  formatIDR,
  formatDate,
  generateExportFileName,
  downloadCSV,
} from '../../lib/currency';
import {
  BarChart3,
  Building2,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SalesOrder } from '../../types';

type ReportTab =
  | 'sales'
  | 'customer'
  | 'product'
  | 'salesperson'
  | 'payments'
  | 'receivables_aging';

export const ReportsView: React.FC = () => {
  const {
    companies,
    salesList,
    customers,
    products,
    orders,
    payments,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompany,
    permittedCompanies,
    currentUser,
  } = useERP();

  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  // Base filtered orders and payments matching selected company and RLS
  const activeOrders = useMemo(() => {
    let result = orders;
    if (currentUser.role === 'sales') {
      result = result.filter((o) => o.sales_id === currentUser.sales_id);
    }
    if (selectedCompanyId !== 'ALL') {
      result = result.filter((o) => o.company_id === selectedCompanyId);
    }
    return result;
  }, [orders, selectedCompanyId, currentUser]);

  const activePayments = useMemo(() => {
    let result = payments;
    if (selectedCompanyId !== 'ALL') {
      result = result.filter((p) => p.company_id === selectedCompanyId);
    }
    return result;
  }, [payments, selectedCompanyId]);

  // Target company code for export name
  const companyCodeForExport = selectedCompany ? selectedCompany.company_code : 'ALL';

  // 1. Sales Report Data
  const salesReportData = activeOrders;

  // 2. Customer Report Data
  const customerReportData = useMemo(() => {
    return customers
      .map((cust) => {
        const custOrders = activeOrders.filter((o) => o.customer_id === cust.customer_id);
        const orderCount = custOrders.length;
        const totalSales = custOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const totalPaid = custOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
        const totalOutstanding = custOrders.reduce((sum, o) => sum + (o.outstanding_amount || 0), 0);

        return {
          customer_id: cust.customer_id,
          customer_name: cust.customer_name,
          customer_type: cust.customer_type,
          orderCount,
          totalSales,
          totalPaid,
          totalOutstanding,
        };
      })
      .filter((c) => c.orderCount > 0);
  }, [customers, activeOrders]);

  // 3. Product Report Data
  const productReportData = useMemo(() => {
    return products
      .map((prod) => {
        let totalQty = 0;
        let totalRevenue = 0;

        activeOrders.forEach((o) => {
          o.items.forEach((item) => {
            if (item.product_id === prod.product_id) {
              totalQty += item.quantity;
              totalRevenue += item.subtotal;
            }
          });
        });

        return {
          product_id: prod.product_id,
          product_code: prod.product_code,
          product_name: prod.product_name,
          category: prod.category,
          unit: prod.unit,
          totalQty,
          totalRevenue,
        };
      })
      .filter((p) => p.totalQty > 0);
  }, [products, activeOrders]);

  // 4. Salesperson Report Data
  const salespersonReportData = useMemo(() => {
    return salesList
      .map((s) => {
        const sOrders = activeOrders.filter((o) => o.sales_id === s.sales_id);
        const orderCount = sOrders.length;
        const totalSales = sOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const totalPaid = sOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
        const totalOutstanding = sOrders.reduce((sum, o) => sum + (o.outstanding_amount || 0), 0);
        const primaryComp = companies.find((c) => c.company_id === s.company_id);

        return {
          sales_id: s.sales_id,
          sales_name: s.sales_name,
          sales_code: s.sales_code,
          primaryCompany: primaryComp?.company_code || 'EXA',
          area: s.area,
          orderCount,
          totalSales,
          totalPaid,
          totalOutstanding,
        };
      })
      .filter((s) => s.orderCount > 0);
  }, [salesList, activeOrders, companies]);

  // 5. Aging Report Data (Requirement #13)
  const agingReportData = useMemo(() => {
    const today = new Date();

    return activeOrders
      .filter((o) => o.outstanding_amount > 0 && o.status !== 'cancelled')
      .map((o) => {
        const dueDate = new Date(o.due_date);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let category: 'current' | '1-30' | '31-60' | '61-90' | '>90';
        if (diffDays <= 0) {
          category = 'current';
        } else if (diffDays <= 30) {
          category = '1-30';
        } else if (diffDays <= 60) {
          category = '31-60';
        } else if (diffDays <= 90) {
          category = '61-90';
        } else {
          category = '>90';
        }

        const comp = companies.find((c) => c.company_id === o.company_id);
        const cust = customers.find((c) => c.customer_id === o.customer_id);

        return {
          so_id: o.so_id,
          so_number: o.so_number,
          company_code: comp?.company_code || '',
          customer_name: cust?.customer_name || 'Customer',
          order_date: o.order_date,
          due_date: o.due_date,
          overdueDays: Math.max(0, diffDays),
          category,
          total_amount: o.total_amount,
          paid_amount: o.paid_amount || 0,
          outstanding_amount: o.outstanding_amount,
        };
      });
  }, [activeOrders, companies, customers]);

  // Aging bracket aggregates
  const agingBrackets = useMemo(() => {
    let current = 0;
    let b1_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let bOver90 = 0;

    agingReportData.forEach((item) => {
      if (item.category === 'current') current += item.outstanding_amount;
      else if (item.category === '1-30') b1_30 += item.outstanding_amount;
      else if (item.category === '31-60') b31_60 += item.outstanding_amount;
      else if (item.category === '61-90') b61_90 += item.outstanding_amount;
      else bOver90 += item.outstanding_amount;
    });

    const total = current + b1_30 + b31_60 + b61_90 + bOver90;
    return { current, b1_30, b31_60, b61_90, bOver90, total };
  }, [agingReportData]);

  // REQUIREMENT #18: EXPORT FUNCTIONALITY
  const handleExportCSV = () => {
    const reportTitles: Record<ReportTab, string> = {
      sales: 'Sales_Report',
      customer: 'Customer_Report',
      product: 'Product_Report',
      salesperson: 'Salesperson_Report',
      payments: 'Payment_Report',
      receivables_aging: 'Aging_Report',
    };

    const fileName = generateExportFileName(reportTitles[activeTab], companyCodeForExport);

    let csv = '';

    if (activeTab === 'sales') {
      csv += 'SO Number,Company,Customer,Order Date,Payment Terms,Due Date,Total Amount,Paid Amount,Outstanding,Status\n';
      salesReportData.forEach((o) => {
        const c = companies.find((comp) => comp.company_id === o.company_id);
        const cust = customers.find((client) => client.customer_id === o.customer_id);
        csv += `"${o.so_number}","${c?.company_code || ''}","${cust?.customer_name || ''}","${o.order_date}","${o.payment_terms}","${o.due_date}",${o.total_amount},${o.paid_amount || 0},${o.outstanding_amount},"${o.status}"\n`;
      });
    } else if (activeTab === 'customer') {
      csv += 'Customer Name,Type,Orders Count,Total Sales,Total Paid,Total Outstanding\n';
      customerReportData.forEach((c) => {
        csv += `"${c.customer_name}","${c.customer_type}",${c.orderCount},${c.totalSales},${c.totalPaid},${c.totalOutstanding}\n`;
      });
    } else if (activeTab === 'product') {
      csv += 'Product Code,Product Name,Category,Unit,Quantity Sold,Total Revenue\n';
      productReportData.forEach((p) => {
        csv += `"${p.product_code}","${p.product_name}","${p.category}","${p.unit}",${p.totalQty},${p.totalRevenue}\n`;
      });
    } else if (activeTab === 'salesperson') {
      csv += 'Sales Code,Sales Name,Primary Company,Area,Orders Count,Total Sales,Total Paid,Outstanding\n';
      salespersonReportData.forEach((s) => {
        csv += `"${s.sales_code}","${s.sales_name}","${s.primaryCompany}","${s.area}",${s.orderCount},${s.totalSales},${s.totalPaid},${s.totalOutstanding}\n`;
      });
    } else if (activeTab === 'payments') {
      csv += 'Payment Number,Company,SO Number,Payment Date,Method,Reference,Amount\n';
      activePayments.forEach((p) => {
        const c = companies.find((comp) => comp.company_id === p.company_id);
        csv += `"${p.payment_number}","${c?.company_code || ''}","${p.so_number}","${p.payment_date}","${p.payment_method}","${p.reference_number || ''}",${p.amount}\n`;
      });
    } else if (activeTab === 'receivables_aging') {
      csv += 'SO Number,Company,Customer,Due Date,Days Overdue,Bracket,Total Amount,Paid,Outstanding Balance\n';
      agingReportData.forEach((a) => {
        csv += `"${a.so_number}","${a.company_code}","${a.customer_name}","${a.due_date}",${a.overdueDays},"${a.category}",${a.total_amount},${a.paid_amount},${a.outstanding_amount}\n`;
      });
    }

    downloadCSV(fileName, csv);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Requirement #13: Company Filter) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Financial & Operational Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>Requirement #13 & #18</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Multi-Company Reporting & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Consolidated or subsidiary-isolated reports with automated company file naming on export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>

            {/* Requirement #18 Export button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export ({companyCodeForExport === 'ALL' ? 'All Companies' : companyCodeForExport})</span>
            </button>
          </div>
        </div>

        {/* Global Company Filter on Report (Requirement #13) */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Filter Company:</span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {currentUser.role !== 'sales' && (
                <option value="ALL">🏢 All Companies (Consolidated)</option>
              )}
              {permittedCompanies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_code} - {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Export File Pattern: <code className="font-mono text-blue-700 font-semibold">{generateExportFileName('Report', companyCodeForExport)}</code>
          </div>
        </div>
      </div>

      {/* Report Tabs (Requirement #13) */}
      <div className="no-print flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'sales'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sales Report
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'customer'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer Report
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'product'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Product Report
        </button>
        <button
          onClick={() => setActiveTab('salesperson')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'salesperson'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Salesperson Report
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Payment & Collections
        </button>
        <button
          onClick={() => setActiveTab('receivables_aging')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'receivables_aging'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Aging & Receivables Report
        </button>
      </div>

      {/* PRINT HEADER FOR OFFICIAL REPORT (Requirement #18) */}
      <div className="print-only hidden p-6 border-b-2 border-slate-900 mb-6">
        <h1 className="text-xl font-bold">
          {selectedCompany ? selectedCompany.company_name : 'CONSOLIDATED GROUP REPORT'}
        </h1>
        <div className="text-xs text-slate-600">
          {selectedCompany
            ? `${selectedCompany.legal_name} · NPWP: ${selectedCompany.tax_number} · ${selectedCompany.address}`
            : 'Multi-Entity Consolidated Operating Subsidiaries Report'}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Report Category: {activeTab.toUpperCase()} · Generated: {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>

      {/* TAB CONTENT: 1. Sales Report */}
      {activeTab === 'sales' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Sales Transaction Log ({companyCodeForExport})
            </span>
            <span className="text-slate-500 font-mono">
              Total: {formatIDR(salesReportData.reduce((s, o) => s + o.total_amount, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">SO Number</th>
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Order Date</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                  <th className="py-2.5 px-4 text-right">PPN 11%</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReportData.map((order) => {
                  const comp = companies.find((c) => c.company_id === order.company_id);
                  const cust = customers.find((c) => c.customer_id === order.customer_id);

                  return (
                    <tr key={order.so_id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{order.so_number}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">{comp?.company_code}</td>
                      <td className="py-2.5 px-4 text-slate-800">{cust?.customer_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(order.order_date)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">{formatIDR(order.subtotal)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">{formatIDR(order.tax_amount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">{formatIDR(order.total_amount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700">{formatIDR(order.paid_amount || 0)}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-amber-700">{formatIDR(order.outstanding_amount)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Customer Report */}
      {activeTab === 'customer' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Customer Sales & Receivables Summary
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Client Tier</th>
                  <th className="py-2.5 px-4 text-right">Orders</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue</th>
                  <th className="py-2.5 px-4 text-right">Total Collected</th>
                  <th className="py-2.5 px-4 text-right">Outstanding (AR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerReportData.map((c) => (
                  <tr key={c.customer_id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                    <td className="py-3 px-4 uppercase text-[11px] font-semibold text-slate-600">{c.customer_type}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{c.orderCount}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">{formatIDR(c.totalSales)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">{formatIDR(c.totalPaid)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-700">{formatIDR(c.totalOutstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Product Report */}
      {activeTab === 'product' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Product Movement & Revenue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Product Code</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Quantity Sold</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productReportData.map((p) => (
                  <tr key={p.product_id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.product_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 font-semibold">{p.totalQty} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-900">{formatIDR(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Salesperson Report */}
      {activeTab === 'salesperson' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Salesperson Performance Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Sales Officer</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Primary PT</th>
                  <th className="py-2.5 px-4">Assigned Area</th>
                  <th className="py-2.5 px-4 text-right">Orders Booked</th>
                  <th className="py-2.5 px-4 text-right">Total Sales</th>
                  <th className="py-2.5 px-4 text-right">Collected</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salespersonReportData.map((s) => (
                  <tr key={s.sales_id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.sales_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.sales_code}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{s.primaryCompany}</td>
                    <td className="py-3 px-4 text-slate-600">{s.area}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{s.orderCount}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">{formatIDR(s.totalSales)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">{formatIDR(s.totalPaid)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-700">{formatIDR(s.totalOutstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Payments Report */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Payment & Collections Audit Record
            </span>
            <span className="font-mono font-bold text-emerald-700">
              Total: {formatIDR(activePayments.reduce((s, p) => s + p.amount, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Payment No</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Sales Order</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Bank / Reference</th>
                  <th className="py-2.5 px-4 text-right">Amount (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePayments.map((p) => {
                  const comp = companies.find((c) => c.company_id === p.company_id);
                  return (
                    <tr key={p.payment_id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.payment_number}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">{comp?.company_code}</td>
                      <td className="py-2.5 px-4 font-mono text-blue-700">{p.so_number}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-slate-700">{p.payment_method.replace('_', ' ')}</td>
                      <td className="py-2.5 px-4 text-slate-600">{p.reference_number || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">{formatIDR(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Aging & Receivables Report (Requirement #13) */}
      {activeTab === 'receivables_aging' && (
        <div className="space-y-6">
          {/* Aging Bracket Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Current (Not Due)</span>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-800 mt-1">
                {formatIDR(agingBrackets.current)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">1 - 30 Days</span>
              <div className="text-base font-bold font-mono tabular-nums text-amber-800 mt-1">
                {formatIDR(agingBrackets.b1_30)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">31 - 60 Days</span>
              <div className="text-base font-bold font-mono tabular-nums text-orange-800 mt-1">
                {formatIDR(agingBrackets.b31_60)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">61 - 90 Days</span>
              <div className="text-base font-bold font-mono tabular-nums text-red-700 mt-1">
                {formatIDR(agingBrackets.b61_90)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider">&gt; 90 Days (Critical)</span>
              <div className="text-base font-bold font-mono tabular-nums text-red-900 mt-1">
                {formatIDR(agingBrackets.bOver90)}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total AR Due</span>
              <div className="text-base font-bold font-mono tabular-nums text-white mt-1">
                {formatIDR(agingBrackets.total)}
              </div>
            </div>
          </div>

          {/* Aging Details Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                Accounts Receivable Aging Breakdown ({companyCodeForExport})
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {agingReportData.length} pending receivables
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">SO Number</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-center">Overdue Days</th>
                    <th className="py-2.5 px-4 text-center">Aging Bracket</th>
                    <th className="py-2.5 px-4 text-right">Total Invoice</th>
                    <th className="py-2.5 px-4 text-right">Outstanding (AR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agingReportData.map((row) => (
                    <tr key={row.so_id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.so_number}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{row.company_code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.customer_name}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(row.due_date)}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {row.overdueDays > 0 ? `${row.overdueDays} days` : 'Not Due'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            row.category === 'current'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.category === '1-30'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{formatIDR(row.total_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-800">{formatIDR(row.outstanding_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
