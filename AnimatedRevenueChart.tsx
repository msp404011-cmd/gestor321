import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Calendar, Zap, Sparkles, ShoppingBag, Wrench, DollarSign } from 'lucide-react';
import { Sale, ServiceOrder } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { AnimatedCountNumber } from './AnimatedCountNumber';

interface AnimatedRevenueChartProps {
  sales: Sale[];
  orders: ServiceOrder[];
  isDark: boolean;
}

export type ChartTimeframe = 'today' | '7days' | '15days' | '30days' | 'year';

interface DataPoint {
  label: string;
  fullDate: string;
  salesVal: number;
  salesCount: number;
  serviceVal: number;
  serviceCount: number;
  totalVal: number;
  x: number;
  salesY: number;
  serviceY: number;
  totalY: number;
}

export const AnimatedRevenueChart: React.FC<AnimatedRevenueChartProps> = ({
  sales,
  orders,
  isDark,
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('30days');
  const [activeSeries, setActiveSeries] = useState<{
    sales: boolean;
    services: boolean;
    total: boolean;
  }>({
    sales: true,
    services: true,
    total: false,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute points according to selected timeframe
  const { points, maxVal, chartMax, totalSalesSum, totalServiceSum, totalRevenueSum, peakPoint } = useMemo(() => {
    const now = new Date();
    const buckets: {
      label: string;
      fullDate: string;
      salesVal: number;
      salesCount: number;
      serviceVal: number;
      serviceCount: number;
      totalVal: number;
    }[] = [];

    let numPoints = 7;
    let daysStep = 5;

    if (timeframe === 'today') {
      numPoints = 8; // hourly intervals
      for (let h = 0; h < 24; h += 3) {
        const hLabel = `${String(h).padStart(2, '0')}:00`;
        const start = new Date(now);
        start.setHours(h, 0, 0, 0);
        const end = new Date(now);
        end.setHours(h + 2, 59, 59, 999);

        let sVal = 0;
        let sCount = 0;
        sales.forEach((s) => {
          const sDate = new Date(s.date || s.createdAt || '');
          if (!isNaN(sDate.getTime()) && sDate >= start && sDate <= end) {
            sVal += s.total || 0;
            sCount++;
          }
        });

        let oVal = 0;
        let oCount = 0;
        orders.forEach((o) => {
          if (o.status === 'ENTREGUE') {
            const oDate = new Date(o.deliveredAt || o.updatedAt || o.createdAt || '');
            if (!isNaN(oDate.getTime()) && oDate >= start && oDate <= end) {
              oVal += o.totalPrice || 0;
              oCount++;
            }
          }
        });

        buckets.push({
          label: hLabel,
          fullDate: `Hoje às ${hLabel}`,
          salesVal: sVal,
          salesCount: sCount,
          serviceVal: oVal,
          serviceCount: oCount,
          totalVal: sVal + oVal,
        });
      }
    } else {
      if (timeframe === '7days') {
        numPoints = 7;
        daysStep = 1;
      } else if (timeframe === '15days') {
        numPoints = 8;
        daysStep = 2;
      } else if (timeframe === '30days') {
        numPoints = 7;
        daysStep = 5;
      } else if (timeframe === 'year') {
        numPoints = 12; // 12 months
      }

      if (timeframe === 'year') {
        const currentYear = now.getFullYear();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        for (let m = 0; m < 12; m++) {
          const start = new Date(currentYear, m, 1, 0, 0, 0);
          const end = new Date(currentYear, m + 1, 0, 23, 59, 59);

          let sVal = 0;
          let sCount = 0;
          sales.forEach((s) => {
            const sDate = new Date(s.date || s.createdAt || '');
            if (!isNaN(sDate.getTime()) && sDate >= start && sDate <= end) {
              sVal += s.total || 0;
              sCount++;
            }
          });

          let oVal = 0;
          let oCount = 0;
          orders.forEach((o) => {
            if (o.status === 'ENTREGUE') {
              const oDate = new Date(o.deliveredAt || o.updatedAt || o.createdAt || '');
              if (!isNaN(oDate.getTime()) && oDate >= start && oDate <= end) {
                oVal += o.totalPrice || 0;
                oCount++;
              }
            }
          });

          buckets.push({
            label: monthNames[m],
            fullDate: `${monthNames[m]} de ${currentYear}`,
            salesVal: sVal,
            salesCount: sCount,
            serviceVal: oVal,
            serviceCount: oCount,
            totalVal: sVal + oVal,
          });
        }
      } else {
        for (let i = numPoints - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - Math.round(i * daysStep));
          const dayStr = String(d.getDate()).padStart(2, '0');
          const monthStr = String(d.getMonth() + 1).padStart(2, '0');
          const label = `${dayStr}/${monthStr}`;

          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          if (daysStep > 1 && i > 0) {
            start.setDate(start.getDate() - Math.floor(daysStep / 2));
          }
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          if (daysStep > 1 && i < numPoints - 1) {
            end.setDate(end.getDate() + Math.floor(daysStep / 2));
          }

          let sVal = 0;
          let sCount = 0;
          sales.forEach((s) => {
            const sDate = new Date(s.date || s.createdAt || '');
            if (!isNaN(sDate.getTime()) && sDate >= start && sDate <= end) {
              sVal += s.total || 0;
              sCount++;
            }
          });

          let oVal = 0;
          let oCount = 0;
          orders.forEach((o) => {
            if (o.status === 'ENTREGUE') {
              const oDate = new Date(o.deliveredAt || o.updatedAt || o.createdAt || '');
              if (!isNaN(oDate.getTime()) && oDate >= start && oDate <= end) {
                oVal += o.totalPrice || 0;
                oCount++;
              }
            }
          });

          buckets.push({
            label,
            fullDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            salesVal: sVal,
            salesCount: sCount,
            serviceVal: oVal,
            serviceCount: oCount,
            totalVal: sVal + oVal,
          });
        }
      }
    }

    // Totals
    const totalSalesSum = buckets.reduce((acc, b) => acc + b.salesVal, 0);
    const totalServiceSum = buckets.reduce((acc, b) => acc + b.serviceVal, 0);
    const totalRevenueSum = totalSalesSum + totalServiceSum;

    const allValues = buckets.flatMap((b) => [b.salesVal, b.serviceVal, b.totalVal]);
    const maxVal = Math.max(...allValues, 0);
    const chartMax = maxVal > 0 ? Math.ceil((maxVal * 1.25) / 50) * 50 : 500;

    // SVG coordinates setup: viewBox 0 0 540 210
    // X from 45 to 515
    // Y from 30 (top) to 175 (bottom)
    const startX = 45;
    const endX = 515;
    const widthSpan = endX - startX;
    const bottomY = 175;
    const topY = 30;
    const heightSpan = bottomY - topY;

    const points: DataPoint[] = buckets.map((b, idx) => {
      const x = startX + (idx / Math.max(buckets.length - 1, 1)) * widthSpan;
      const salesY = bottomY - (b.salesVal / chartMax) * heightSpan;
      const serviceY = bottomY - (b.serviceVal / chartMax) * heightSpan;
      const totalY = bottomY - (b.totalVal / chartMax) * heightSpan;

      return {
        ...b,
        x,
        salesY: isNaN(salesY) ? bottomY : salesY,
        serviceY: isNaN(serviceY) ? bottomY : serviceY,
        totalY: isNaN(totalY) ? bottomY : totalY,
      };
    });

    let peakPoint: DataPoint | null = null;
    let maxBucketVal = -1;
    points.forEach((pt) => {
      const v = Math.max(pt.salesVal, pt.serviceVal);
      if (v > maxBucketVal) {
        maxBucketVal = v;
        peakPoint = pt;
      }
    });

    return {
      points,
      maxVal,
      chartMax,
      totalSalesSum,
      totalServiceSum,
      totalRevenueSum,
      peakPoint: maxBucketVal > 0 ? peakPoint : null,
    };
  }, [sales, orders, timeframe]);

  // Helper for cubic bezier smooth curves
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length === 0) return 'M 45 175 L 515 175';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) * 0.55;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const salesPath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.salesY })));
  }, [points]);

  const servicePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.serviceY })));
  }, [points]);

  const totalPath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.totalY })));
  }, [points]);

  const salesAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${salesPath} L ${lastX} 175 L ${firstX} 175 Z`;
  }, [points, salesPath]);

  const serviceAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${servicePath} L ${lastX} 175 L ${firstX} 175 Z`;
  }, [points, servicePath]);

  const totalAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${totalPath} L ${lastX} 175 L ${firstX} 175 Z`;
  }, [points, totalPath]);

  // Y-axis grid values
  const yAxisTicks = useMemo(() => {
    const steps = 4;
    const ticks = [];
    for (let i = 0; i <= steps; i++) {
      const val = chartMax * (1 - i / steps);
      const label = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${Math.round(val)}`;
      const y = 30 + i * ((175 - 30) / steps);
      ticks.push({ val, label, y });
    }
    return ticks;
  }, [chartMax]);

  // Mouse move handler for interactive crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const svgWidth = rect.width;
    const viewBoxX = (relativeX / svgWidth) * 540;

    // Find closest data point
    let closestIdx = 0;
    let minDistance = 99999;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - viewBoxX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
  };

  const hoveredData = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-2 transition-all relative overflow-hidden group shadow-xl ${
        isDark
          ? 'bg-gradient-to-b from-[#0a152d]/95 via-[#071024]/90 to-[#040a18] border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white hover:border-cyan-400'
          : 'bg-white border-blue-200 shadow-lg text-slate-900'
      }`}
    >
      {/* Background neon ambient aura */}
      <div className="absolute top-0 right-1/4 w-72 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title, Live Trend, and Dynamic Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4.5 p-1 rounded-md bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              <span className="w-1 h-2.5 bg-cyan-400 rounded-xs animate-pulse" />
              <span className="w-1 h-3.5 bg-pink-400 rounded-xs animate-pulse delay-100" />
              <span className="w-1 h-2 bg-purple-400 rounded-xs animate-pulse delay-200" />
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-1.5">
              Faturamento
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                Tempo Real
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-slate-400 font-medium">Total no período:</span>
            <span className="font-extrabold text-emerald-400 text-sm tracking-tight flex items-center gap-1">
              <AnimatedCountNumber value={totalRevenueSum} prefix="R$ " decimals={2} />
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" />
            </span>
          </div>
        </div>

        {/* Action Controls: Series Toggles & Timeframe Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Series Toggles */}
          <div className="flex items-center gap-1 bg-[#050f24] p-1 rounded-xl border border-blue-900/60 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveSeries((prev) => ({ ...prev, sales: !prev.sales }))}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSeries.sales
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Alternar linha de Vendas"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
              Vendas
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries((prev) => ({ ...prev, services: !prev.services }))}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSeries.services
                  ? 'bg-pink-950 text-pink-300 border border-pink-500/60 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Alternar linha de Serviços (OS)"
            >
              <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#ec4899]" />
              Serviços (OS)
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries((prev) => ({ ...prev, total: !prev.total }))}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSeries.total
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Alternar linha de Total Geral"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
              Total
            </button>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center gap-0.5 bg-[#050f24] p-1 rounded-xl border border-blue-900/60">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: '7days', label: '7D' },
                { id: '15days', label: '15D' },
                { id: '30days', label: '30D' },
                { id: 'year', label: 'Ano' },
              ] as { id: ChartTimeframe; label: string }[]
            ).map((tab) => {
              const isSelected = timeframe === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeframe(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Chart Area */}
      <div
        ref={containerRef}
        className="relative w-full h-52 sm:h-60 mt-2 select-none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg
          viewBox="0 0 540 210"
          className="w-full h-full overflow-visible cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Vendas Neon Gradient */}
            <linearGradient id="vendasGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Servicos Neon Gradient */}
            <linearGradient id="servicosGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#ec4899" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>

            {/* Total Neon Gradient */}
            <linearGradient id="totalGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>

            {/* Filter for glowing neon paths */}
            <filter id="neonGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neonGlowPink" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid lines and Y-axis Labels */}
          {yAxisTicks.map((t, idx) => (
            <g key={`y-axis-${idx}`}>
              <text
                x="36"
                y={t.y + 3.5}
                textAnchor="end"
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {t.label}
              </text>
              <line
                x1="45"
                y1={t.y}
                x2="515"
                y2={t.y}
                stroke={isDark ? (idx === yAxisTicks.length - 1 ? '#334155' : '#1e293b') : '#e2e8f0'}
                strokeWidth={idx === yAxisTicks.length - 1 ? '1.5' : '1'}
                strokeDasharray={idx === yAxisTicks.length - 1 ? '0' : '4 3'}
              />
            </g>
          ))}

          {/* Area Fill Layers */}
          {activeSeries.total && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={totalAreaPath}
              fill="url(#totalGlowGradient)"
            />
          )}

          {activeSeries.services && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={serviceAreaPath}
              fill="url(#servicosGlowGradient)"
            />
          )}

          {activeSeries.sales && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={salesAreaPath}
              fill="url(#vendasGlowGradient)"
            />
          )}

          {/* Curved Line Strokes with Neon Glow */}
          {activeSeries.total && (
            <path
              d={totalPath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]"
            />
          )}

          {activeSeries.services && (
            <path
              d={servicePath}
              fill="none"
              stroke="#ec4899"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(236,72,153,0.9)]"
            />
          )}

          {activeSeries.sales && (
            <path
              d={salesPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]"
            />
          )}

          {/* Data Points on Nodes */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={`data-pt-${idx}`}>
                {activeSeries.sales && (
                  <circle
                    cx={pt.x}
                    cy={pt.salesY}
                    r={isHovered ? 6 : 4}
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-200 cursor-pointer shadow-[0_0_10px_#06b6d4]"
                  />
                )}

                {activeSeries.services && (
                  <circle
                    cx={pt.x}
                    cy={pt.serviceY}
                    r={isHovered ? 6 : 4}
                    fill="#ec4899"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-200 cursor-pointer shadow-[0_0_10px_#ec4899]"
                  />
                )}

                {activeSeries.total && (
                  <circle
                    cx={pt.x}
                    cy={pt.totalY}
                    r={isHovered ? 6 : 4}
                    fill="#a855f7"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-200 cursor-pointer shadow-[0_0_10px_#a855f7]"
                  />
                )}
              </g>
            );
          })}

          {/* Animated Peak Badge (as seen in the reference image) */}
          {peakPoint && hoveredIndex === null && (
            <g transform={`translate(${peakPoint.x}, ${peakPoint.salesY})`}>
              <circle cx="0" cy="0" r="8" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="animate-ping opacity-75" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={175 - peakPoint.salesY}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.7"
              />
              <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Floating Pin Card */}
              <g
                transform={`translate(${peakPoint.x > 380 ? -95 : -45}, ${
                  peakPoint.salesY > 65 ? -52 : 12
                })`}
              >
                <rect
                  width="90"
                  height="44"
                  rx="10"
                  fill="#06122b"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                  filter="drop-shadow(0 0 12px rgba(6,182,212,0.6))"
                />
                <text x="45" y="18" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900">
                  {formatCurrency(peakPoint.salesVal || peakPoint.totalVal)}
                </text>
                <text x="45" y="33" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                  {peakPoint.label} • Pico
                </text>
              </g>
            </g>
          )}

          {/* Interactive Hover Crosshair / Vertical Guideline */}
          {hoveredData && (
            <g>
              <line
                x1={hoveredData.x}
                y1="25"
                x2={hoveredData.x}
                y2="175"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                className="drop-shadow-[0_0_6px_#38bdf8]"
              />
              <circle cx={hoveredData.x} cy="175" r="3.5" fill="#38bdf8" />
            </g>
          )}

          {/* X-axis Date Labels */}
          {points.map((pt, idx) => (
            <text
              key={`x-lbl-${idx}`}
              x={pt.x}
              y="196"
              textAnchor="middle"
              fill={hoveredIndex === idx ? '#38bdf8' : isDark ? '#64748b' : '#94a3b8'}
              fontSize="10"
              fontWeight={hoveredIndex === idx ? 'bold' : 'normal'}
              className="transition-colors duration-150"
            >
              {pt.label}
            </text>
          ))}
        </svg>

        {/* Floating Interactive Glassmorphism Tooltip when hovering over chart */}
        <AnimatePresence>
          {hoveredData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 pointer-events-none bg-[#07132c]/95 border-2 border-cyan-400/80 rounded-xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-md min-w-[170px]"
              style={{
                left: `clamp(10px, ${(hoveredData.x / 540) * 100}%, calc(100% - 180px))`,
                top: '10px',
              }}
            >
              <div className="flex items-center justify-between border-b border-blue-900/80 pb-1.5 mb-2">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {hoveredData.fullDate}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {activeSeries.sales && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                      Vendas ({hoveredData.salesCount}):
                    </span>
                    <span className="font-extrabold text-white">
                      {formatCurrency(hoveredData.salesVal)}
                    </span>
                  </div>
                )}

                {activeSeries.services && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-pink-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#ec4899]" />
                      OS ({hoveredData.serviceCount}):
                    </span>
                    <span className="font-extrabold text-white">
                      {formatCurrency(hoveredData.serviceVal)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-900/60 font-black">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Total Dia:
                  </span>
                  <span className="text-emerald-400 font-black text-sm">
                    {formatCurrency(hoveredData.totalVal)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
