import React, { useState, useMemo } from 'react';
import { SalesOrder, Company } from '../../types';
import { formatIDR, formatCompactIDR } from '../../lib/currency';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Calendar,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

interface MonthlyRevenueChartProps {
  orders: SalesOrder[];
  companies: Company[];
  selectedCompanyId: string;
  selectedCompanyName?: string;
}

type ChartType = 'bar' | 'line' | 'combined';
type MetricView = 'revenue' | 'paid_vs_revenue' | 'orders';
type TimeRange = '6m' | 'ytd' | '12m';

interface MonthData {
  key: string; // YYYY-MM
  label: string; // "Jan 2026"
  shortLabel: string; // "Jan"
  year: number;
  month: number; // 0-11
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  orderCount: number;
  companyBreakdown: Record<string, number>; // company_code -> amount
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  orders,
  companies,
  selectedCompanyId,
  selectedCompanyName,
}) => {
  const [chartType, setChartType] = useState<ChartType>('combined');
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [timeRange, setTimeRange] = useState<TimeRange>('ytd');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Build company code lookup
  const companyMap = useMemo(() => {
    return new Map(companies.map((c) => [c.company_id, c]));
  }, [companies]);

  // Aggregate orders by month
  const monthlyData = useMemo(() => {
    // Determine target months range based on selected timeRange
    // Anchor around September 2026 (the current simulated app time: 2026-09)
    const currentYear = 2026;
    const currentMonth = 8; // 0-indexed September

    const months: MonthData[] = [];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    if (timeRange === 'ytd') {
      // All 12 months of 2026
      for (let m = 0; m < 12; m++) {
        const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        months.push({
          key: monthKey,
          label: `${monthNames[m]} ${currentYear}`,
          shortLabel: monthNames[m],
          year: currentYear,
          month: m,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          orderCount: 0,
          companyBreakdown: {},
        });
      }
    } else if (timeRange === '6m') {
      // 6 months ending in September 2026 (Apr - Sep 2026)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        months.push({
          key: monthKey,
          label: `${monthNames[m]} ${y}`,
          shortLabel: monthNames[m],
          year: y,
          month: m,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          orderCount: 0,
          companyBreakdown: {},
        });
      }
    } else {
      // 12 months rolling (Oct 2025 - Sep 2026)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        months.push({
          key: monthKey,
          label: `${monthNames[m]} ${y}`,
          shortLabel: monthNames[m],
          year: y,
          month: m,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          orderCount: 0,
          companyBreakdown: {},
        });
      }
    }

    // Populate data with orders
    const monthLookup = new Map(months.map((m) => [m.key, m]));

    orders.forEach((order) => {
      if (order.status === 'cancelled') return; // Don't count cancelled orders towards revenue

      const dateStr = order.order_date;
      if (!dateStr) return;
      const key = dateStr.slice(0, 7); // "YYYY-MM"

      const targetMonth = monthLookup.get(key);
      if (targetMonth) {
        targetMonth.totalRevenue += order.total_amount || 0;
        targetMonth.totalPaid += order.paid_amount || 0;
        targetMonth.totalOutstanding += order.outstanding_amount || 0;
        targetMonth.orderCount += 1;

        const comp = companyMap.get(order.company_id);
        const compCode = comp?.company_code || 'OTHER';
        targetMonth.companyBreakdown[compCode] =
          (targetMonth.companyBreakdown[compCode] || 0) + (order.total_amount || 0);
      }
    });

    return months;
  }, [orders, timeRange, companyMap]);

  // Compute key metrics & insights
  const metrics = useMemo(() => {
    const totalRev = monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0);
    const totalPaid = monthlyData.reduce((sum, m) => sum + m.totalPaid, 0);
    const totalOrders = monthlyData.reduce((sum, m) => sum + m.orderCount, 0);
    const activeMonths = monthlyData.filter((m) => m.totalRevenue > 0);
    const avgMonthly = activeMonths.length > 0 ? totalRev / activeMonths.length : 0;

    // Peak Month
    let peakMonthLabel = '-';
    let peakMonthRevenue = 0;
    for (const m of monthlyData) {
      if (m.totalRevenue > peakMonthRevenue) {
        peakMonthRevenue = m.totalRevenue;
        peakMonthLabel = m.label;
      }
    }

    // Month-over-month growth (compare latest month with prior month)
    // Find the latest month that has data (e.g. September 2026 or prior)
    let latestIdx = -1;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].totalRevenue > 0 || monthlyData[i].orderCount > 0) {
        latestIdx = i;
        break;
      }
    }

    let momGrowth: number | null = null;
    if (latestIdx > 0) {
      const cur = monthlyData[latestIdx].totalRevenue;
      const prev = monthlyData[latestIdx - 1].totalRevenue;
      if (prev > 0) {
        momGrowth = ((cur - prev) / prev) * 100;
      } else if (cur > 0) {
        momGrowth = 100;
      }
    }

    return {
      totalRev,
      totalPaid,
      totalOrders,
      avgMonthly,
      peakMonthLabel,
      peakMonthRevenue,
      momGrowth,
      latestMonthLabel: latestIdx >= 0 ? monthlyData[latestIdx].label : '',
    };
  }, [monthlyData]);

  // Dimensions & coordinate mapping for SVG chart
  const maxVal = useMemo(() => {
    if (metricView === 'orders') {
      const maxOrders = Math.max(...monthlyData.map((m) => m.orderCount), 5);
      return Math.ceil(maxOrders * 1.2);
    }
    const maxRev = Math.max(...monthlyData.map((m) => m.totalRevenue), 10_000_000);
    // Add 15% head room so bars don't hit the ceiling
    return Math.ceil(maxRev * 1.15);
  }, [monthlyData, metricView]);

  // SVG Drawing constants
  const chartHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Number of Y-axis ticks
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Tren Penjualan Bulanan (Monthly Sales Revenue)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualisasi dinamika pendapatan, realisasi penagihan, dan tren performa transaksi per
                periode{' '}
                <strong className="text-slate-700">
                  {selectedCompanyId === 'ALL'
                    ? 'Konsolidasi Seluruh PT'
                    : selectedCompanyName || 'Entitas Terpilih'}
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Grafik Batang (Bar Chart)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Garis Tren (Line Chart)"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('combined')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                chartType === 'combined'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kombinasi Bar & Line (Combined Trend)"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Kombinasi</span>
            </button>
          </div>

          {/* Metric View Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setMetricView('revenue')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                metricView === 'revenue'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendapatan
            </button>
            <button
              type="button"
              onClick={() => setMetricView('paid_vs_revenue')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                metricView === 'paid_vs_revenue'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Realisasi vs Target
            </button>
            <button
              type="button"
              onClick={() => setMetricView('orders')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                metricView === 'orders'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume Pesanan
            </button>
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ytd">Tahun 2026 (Jan - Des)</option>
            <option value="6m">6 Bulan Terakhir</option>
            <option value="12m">12 Bulan Terakhir</option>
          </select>
        </div>
      </div>

      {/* Key Insight Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Total In Period */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Penjualan Periode
          </div>
          <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatIDR(metrics.totalRev)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {metrics.totalOrders} total pesanan
          </div>
        </div>

        {/* Monthly Average */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata Penjualan / Bln
          </div>
          <div className="text-base font-bold text-blue-700 font-mono tabular-nums mt-0.5">
            {formatIDR(metrics.avgMonthly)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Berdasarkan bulan aktif</div>
        </div>

        {/* Peak Month */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Bulan Puncak (Peak)
          </div>
          <div className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-0.5 truncate">
            {metrics.peakMonthLabel}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
            {metrics.peakMonthRevenue > 0
              ? formatCompactIDR(metrics.peakMonthRevenue)
              : 'Rp 0'}
          </div>
        </div>

        {/* MoM Growth */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pertumbuhan MoM
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {metrics.momGrowth !== null ? (
              <>
                <span
                  className={`text-base font-bold font-mono tabular-nums flex items-center gap-1 ${
                    metrics.momGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {metrics.momGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                  {metrics.momGrowth >= 0 ? '+' : ''}
                  {metrics.momGrowth.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">vs bln lalu</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Data awal</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {metrics.latestMonthLabel || 'Bulan berjalan'}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none pt-2">
        <svg
          viewBox={`0 0 800 ${chartHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="barGradientPaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="areaGradientLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {tickValues.map((val, idx) => {
            const yPos =
              paddingTop +
              (chartHeight - paddingTop - paddingBottom) * (1 - (val / (maxVal || 1)));

            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={800 - paddingRight}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? '' : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {metricView === 'orders' ? Math.round(val) : formatCompactIDR(val)}
                </text>
              </g>
            );
          })}

          {/* Area under line (for line or combined chart) */}
          {(chartType === 'line' || chartType === 'combined') && monthlyData.length > 1 && (
            (() => {
              const availableWidth = 800 - paddingLeft - paddingRight;
              const step = availableWidth / monthlyData.length;

              const points = monthlyData.map((m, idx) => {
                const x = paddingLeft + idx * step + step / 2;
                const value = metricView === 'orders' ? m.orderCount : m.totalRevenue;
                const y =
                  paddingTop +
                  (chartHeight - paddingTop - paddingBottom) * (1 - (value / (maxVal || 1)));
                return { x, y };
              });

              const firstPoint = points[0];
              const lastPoint = points[points.length - 1];
              const baselineY = chartHeight - paddingBottom;

              const areaPath = `M ${firstPoint.x} ${baselineY} L ${points
                .map((p) => `${p.x} ${p.y}`)
                .join(' L ')} L ${lastPoint.x} ${baselineY} Z`;

              const linePath = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;

              return (
                <g>
                  {chartType === 'line' && (
                    <path d={areaPath} fill="url(#areaGradientLine)" />
                  )}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={chartType === 'combined' ? '2.5' : '3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Point circles */}
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIndex === idx ? '6' : '3.5'}
                      fill="#ffffff"
                      stroke="#1d4ed8"
                      strokeWidth="2.5"
                      className="transition-all"
                    />
                  ))}
                </g>
              );
            })()
          )}

          {/* Bars Rendering */}
          {(chartType === 'bar' || chartType === 'combined') &&
            monthlyData.map((m, idx) => {
              const availableWidth = 800 - paddingLeft - paddingRight;
              const step = availableWidth / monthlyData.length;
              const colCenterX = paddingLeft + idx * step + step / 2;

              const baselineY = chartHeight - paddingBottom;
              const usableHeight = chartHeight - paddingTop - paddingBottom;

              const isHovered = hoveredIndex === idx;

              if (metricView === 'paid_vs_revenue') {
                // Two paired bars: Revenue & Paid
                const barWidth = Math.min(step * 0.35, 18);

                const revHeight = (m.totalRevenue / (maxVal || 1)) * usableHeight;
                const paidHeight = (m.totalPaid / (maxVal || 1)) * usableHeight;

                const revX = colCenterX - barWidth - 1;
                const paidX = colCenterX + 1;

                return (
                  <g key={m.key}>
                    {/* Revenue Bar */}
                    <rect
                      x={revX}
                      y={baselineY - revHeight}
                      width={barWidth}
                      height={Math.max(revHeight, 2)}
                      rx="3"
                      fill={isHovered ? '#1d4ed8' : 'url(#barGradientPrimary)'}
                      className="transition-all cursor-pointer"
                    />
                    {/* Paid Bar */}
                    <rect
                      x={paidX}
                      y={baselineY - paidHeight}
                      width={barWidth}
                      height={Math.max(paidHeight, 2)}
                      rx="3"
                      fill={isHovered ? '#047857' : 'url(#barGradientPaid)'}
                      className="transition-all cursor-pointer"
                    />
                  </g>
                );
              }

              // Single Bar
              const value = metricView === 'orders' ? m.orderCount : m.totalRevenue;
              const barHeight = (value / (maxVal || 1)) * usableHeight;
              const barWidth = Math.min(step * (chartType === 'combined' ? 0.45 : 0.6), 36);
              const barX = colCenterX - barWidth / 2;

              let fillGrad = 'url(#barGradientPrimary)';
              if (metricView === 'orders') fillGrad = 'url(#barGradientPurple)';
              if (isHovered) fillGrad = '#1e40af';

              return (
                <rect
                  key={m.key}
                  x={barX}
                  y={baselineY - barHeight}
                  width={barWidth}
                  height={Math.max(barHeight, value > 0 ? 3 : 0)}
                  rx="4"
                  fill={fillGrad}
                  opacity={chartType === 'combined' ? (isHovered ? 0.95 : 0.75) : 0.9}
                  className="transition-all cursor-pointer"
                />
              );
            })}

          {/* Month Labels & Hover Trigger Zones */}
          {monthlyData.map((m, idx) => {
            const availableWidth = 800 - paddingLeft - paddingRight;
            const step = availableWidth / monthlyData.length;
            const colCenterX = paddingLeft + idx * step + step / 2;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={m.key}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover zone */}
                <rect
                  x={paddingLeft + idx * step}
                  y={paddingTop}
                  width={step}
                  height={chartHeight - paddingTop}
                  fill="transparent"
                />

                {/* X-axis Month Label */}
                <text
                  x={colCenterX}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className={`text-[11px] transition-colors ${
                    isHovered
                      ? 'fill-blue-700 font-bold'
                      : 'fill-slate-500 font-medium'
                  }`}
                >
                  {m.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip */}
        {hoveredIndex !== null && monthlyData[hoveredIndex] && (
          (() => {
            const m = monthlyData[hoveredIndex];
            const availableWidth = 800 - paddingLeft - paddingRight;
            const step = availableWidth / monthlyData.length;
            const colPercent =
              ((paddingLeft + hoveredIndex * step + step / 2) / 800) * 100;

            // Anchor left or right depending on position
            const isNearRight = colPercent > 65;

            return (
              <div
                style={{
                  left: `${colPercent}%`,
                  transform: isNearRight
                    ? 'translateX(-100%) translateY(-100%)'
                    : 'translateX(0%) translateY(-100%)',
                  top: '110px',
                }}
                className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700/60 min-w-[210px] animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span>{m.label}</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                    {m.orderCount} Transaksi
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 text-[11px]">Total Pendapatan:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatIDR(m.totalRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Terbayar (Paid):
                    </span>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      {formatIDR(m.totalPaid)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-amber-400 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Sisa Piutang:
                    </span>
                    <span className="font-mono font-semibold text-amber-300 tabular-nums">
                      {formatIDR(m.totalOutstanding)}
                    </span>
                  </div>

                  {/* Company breakdown if holding view */}
                  {selectedCompanyId === 'ALL' && Object.keys(m.companyBreakdown).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px]">
                      <div className="text-slate-400 font-semibold mb-1">Kontribusi Entitas:</div>
                      <div className="space-y-0.5">
                        {Object.entries(m.companyBreakdown).map(([code, val]) => (
                          <div key={code} className="flex justify-between text-slate-300 font-mono">
                            <span>{code}:</span>
                            <span>{formatCompactIDR(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Legend & Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
            <span className="font-medium text-slate-700">Total Penjualan (Revenue)</span>
          </div>
          {metricView === 'paid_vs_revenue' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
              <span className="font-medium text-slate-700">Realisasi Penerimaan Dana (Paid)</span>
            </div>
          )}
          {chartType === 'combined' && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-blue-700 inline-block"></span>
              <span className="font-medium text-slate-700">Garis Tren Historis</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span>Arahkan kursor pada batang/bulan untuk rincian detail angka per entitas</span>
        </div>
      </div>
    </div>
  );
};
