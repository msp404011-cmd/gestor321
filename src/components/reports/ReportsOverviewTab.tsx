import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  FileText,
  FileSpreadsheet,
  Layers,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Sale, ServiceOrder, Expense, Product } from '../../types';

type DreViewMode = 'SINTETICO' | 'ANALITICO' | 'CATEGORIA';

interface ReportsOverviewTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  expenses: Expense[];
  products: Product[];
  onExport: (type: string) => void;
}

export const ReportsOverviewTab: React.FC<ReportsOverviewTabProps> = ({
  sales,
  orders,
  expenses,
  products,
  onExport,
}) => {
  const { isDark } = useTheme();
  const [dreMode, setDreMode] = useState<DreViewMode>('SINTETICO');

  // Gross Revenue calculations
  const pdvSales = useMemo(() => sales.reduce((acc, s) => acc + (s.total || 0), 0), [sales]);
  const osServices = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    [orders]
  );
  const grossRevenue = pdvSales + osServices;

  // Cost calculations
  const pdvCogs = useMemo(() => sales.reduce((acc, s) => acc + (s.costTotal || s.totalCost || 0), 0), [sales]);
  const osPartsCost = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO')
        .reduce((acc, o) => {
          const partsCost = (o.parts || o.items || [])
            .filter((i) => i.type === 'PECA' || i.type === 'PRODUTO')
            .reduce((sum, item) => sum + ((item.unitCost || item.costPrice || 0) * (item.quantity || 1)), 0);
          return acc + partsCost;
        }, 0),
    [orders]
  );
  const totalCogs = pdvCogs + osPartsCost;

  // Labor revenue
  const osLaborRevenue = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.laborPrice || 0), 0),
    [orders]
  );
  const osPartsRevenue = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.partsPrice || 0), 0),
    [orders]
  );

  // Expenses
  const paidExpenses = useMemo(() => expenses.filter((e) => e.status === 'PAGO'), [expenses]);
  const opExpenses = useMemo(() => paidExpenses.reduce((acc, e) => acc + (e.amount || 0), 0), [paidExpenses]);

  // Net Profit & Margins
  const grossProfit = grossRevenue - totalCogs;
  const netProfit = grossRevenue - totalCogs - opExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
  const grossMargin = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0;

  // Expense composition breakdown
  const expenseComposition = useMemo(() => {
    if (opExpenses === 0) return [];

    const grouped: Record<string, number> = {};
    paidExpenses.forEach((e) => {
      const cat = e.category || 'Outros';
      grouped[cat] = (grouped[cat] || 0) + (e.amount || 0);
    });

    const colors = ['#00b4d8', '#f59e0b', '#8b5cf6', '#ec4899', '#a855f7', '#10b981', '#64748b'];
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val], idx) => {
        const color = colors[idx % colors.length];
        const pct = Math.round((val / opExpenses) * 100);
        return {
          name,
          percent: pct,
          value: val,
          color,
        };
      });
  }, [paidExpenses, opExpenses]);

  // Expenses categorized for DRE Analítico
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; count: number; items: Expense[] }> = {};
    paidExpenses.forEach((e) => {
      const cat = e.category || 'Outras Despesas';
      if (!grouped[cat]) {
        grouped[cat] = { total: 0, count: 0, items: [] };
      }
      grouped[cat].total += e.amount || 0;
      grouped[cat].count += 1;
      grouped[cat].items.push(e);
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [paidExpenses]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 4 Executive Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
            isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Faturamento Bruto Total
            </span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(grossRevenue)}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="text-blue-500 font-semibold">PDV: {formatCurrency(pdvSales)}</span>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-300'}`}>•</span>
              <span className="text-amber-500 font-semibold">OS: {formatCurrency(osServices)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Custo das Mercadorias & Peças (CMV) */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-600 border border-blue-500/30">
              {grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}% da Receita
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Custo dos Produtos e Peças (CMV)
            </span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(totalCogs)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lucro Bruto: <strong className="text-blue-500">{formatCurrency(grossProfit)} ({grossMargin}%)</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Despesas Operacionais */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
            isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30">
              {paidExpenses.length} pagamentos
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Despesas Operacionais Pagas
            </span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(opExpenses)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {grossRevenue > 0 ? Math.round((opExpenses / grossRevenue) * 100) : 0}% do faturamento bruto
            </span>
          </div>
        </div>

        {/* Card 4: Lucro Líquido (DRE) */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
            isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
              netProfit >= 0 ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <PieChart className="w-6 h-6" />
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                netProfit >= 0
                  ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
              }`}
            >
              {netProfit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              Margem {profitMargin}%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Resultado Líquido do Período
            </span>
            <span
              className={`text-2xl font-black mt-0.5 block tracking-tight ${
                netProfit >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-rose-500'
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
            <span className="text-[11px] mt-1 block font-semibold text-slate-400">
              Receitas - Custos - Despesas
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Faturamento x Lucro */}
        <div
          className={`lg:col-span-7 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Comparativo de Faturamento vs Lucro Real
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Crescimento e saúde operacional nos períodos
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="font-semibold">Faturamento</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold">Lucro Líquido</span>
              </div>
            </div>
          </div>

          {/* SVG Area Line Chart */}
          <div className="relative pt-2 pb-1">
            <svg className="w-full h-56 overflow-visible" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[
                { y: 20, label: 'R$ 20.000' },
                { y: 60, label: 'R$ 15.000' },
                { y: 100, label: 'R$ 10.000' },
                { y: 140, label: 'R$ 5.000' },
                { y: 180, label: 'R$ 0' },
              ].map((g, i) => (
                <g key={i}>
                  <line x1="60" y1={g.y} x2="480" y2={g.y} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
                  <text x="50" y={g.y + 4} fill={isDark ? '#64748b' : '#94a3b8'} fontSize="10" textAnchor="end">
                    {g.label}
                  </text>
                </g>
              ))}

              {/* Faturamento Area & Line */}
              <path
                d="M 80,130 Q 140,110 200,105 T 320,95 T 400,85 T 460,75 L 460,180 L 80,180 Z"
                fill="url(#blueGrad)"
              />
              <path
                d="M 80,130 Q 140,110 200,105 T 320,95 T 400,85 T 460,75"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Lucro Area & Line */}
              <path
                d="M 80,160 Q 140,145 200,140 T 320,135 T 400,128 T 460,120 L 460,180 L 80,180 Z"
                fill="url(#emeraldGrad)"
              />
              <path
                d="M 80,160 Q 140,145 200,140 T 320,135 T 400,128 T 460,120"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Node points */}
              {[
                { x: 80, y1: 130, y2: 160, month: 'Abr' },
                { x: 156, y1: 110, y2: 145, month: 'Mai' },
                { x: 232, y1: 105, y2: 140, month: 'Jun' },
                { x: 308, y1: 95, y2: 135, month: 'Jul' },
                { x: 384, y1: 85, y2: 128, month: 'Ago' },
                { x: 460, y1: 75, y2: 120, month: 'Set' },
              ].map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y1} r="4" fill="#3b82f6" stroke={isDark ? '#09152a' : '#ffffff'} strokeWidth="2" />
                  <circle cx={pt.x} cy={pt.y2} r="4" fill="#10b981" stroke={isDark ? '#09152a' : '#ffffff'} strokeWidth="2" />
                  <text x={pt.x} y="195" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10" textAnchor="middle">
                    {pt.month}
                  </text>
                </g>
              ))}

              {/* Active Node Callout */}
              <g transform="translate(350, 42)">
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="45"
                  rx="8"
                  fill={isDark ? '#0c1d38' : '#1e293b'}
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
                <text x="8" y="14" fill="#38bdf8" fontSize="9" fontWeight="bold">
                  Período Atual
                </text>
                <circle cx="12" cy="25" r="3" fill="#3b82f6" />
                <text x="20" y="28" fill="#e2e8f0" fontSize="8.5">
                  Fat: <tspan fontWeight="bold">{formatCurrency(grossRevenue)}</tspan>
                </text>
                <circle cx="12" cy="36" r="3" fill="#10b981" />
                <text x="20" y="39" fill="#e2e8f0" fontSize="8.5">
                  Lucro: <tspan fontWeight="bold">{formatCurrency(netProfit)}</tspan>
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Chart: Composição das Despesas */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Composição das Despesas Operacionais
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Donut Chart SVG */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {expenseComposition.length === 0 ? (
                  <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="16" />
                ) : (
                  expenseComposition.map((item, idx) => {
                    const circumference = 2 * Math.PI * 38;
                    const strokeLen = (item.percent / 100) * circumference;
                    let prevSum = 0;
                    for (let i = 0; i < idx; i++) {
                      prevSum += (expenseComposition[i].percent / 100) * circumference;
                    }
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={`${strokeLen} ${circumference}`}
                        strokeDashoffset={`-${prevSum}`}
                      />
                    );
                  })
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(opExpenses)}
                </span>
                <span className={`text-[9px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Pago
                </span>
              </div>
            </div>

            {/* Expenses List */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {expenseComposition.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  Nenhuma despesa registrada
                </div>
              ) : (
                expenseComposition.slice(0, 5).map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.percent}%</span>
                      <span className={`font-bold text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: DRE Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: DRE Table */}
        <div
          className={`lg:col-span-8 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
            isDark ? 'border-blue-900/40' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Demonstrativo de Resultados do Exercício (DRE)
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Visão detalhada de receitas, custos diretos e despesas operacionais
              </p>
            </div>

            {/* View Mode Pills */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setDreMode('SINTETICO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dreMode === 'SINTETICO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sintético
              </button>
              <button
                onClick={() => setDreMode('ANALITICO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dreMode === 'ANALITICO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Analítico
              </button>
              <button
                onClick={() => setDreMode('CATEGORIA')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dreMode === 'CATEGORIA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Categoria
              </button>
            </div>
          </div>

          {/* DRE Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b text-[11px] uppercase font-bold ${
                  isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'
                }`}>
                  <th className="py-2.5 px-3">Estrutura de Resultados</th>
                  <th className="py-2.5 px-3 text-right">Valor Real (R$)</th>
                  <th className="py-2.5 px-3 text-right">% Receita</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
                {/* (+) Receita Operacional Bruta */}
                <tr className={`font-bold ${isDark ? 'bg-blue-950/30 text-white' : 'bg-slate-50 text-slate-900'}`}>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
                    <span className="text-cyan-600 font-black">(+) RECEITA BRUTA TOTAL</span>
                  </td>
                  <td className={`py-3 px-3 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(grossRevenue)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>100%</td>
                </tr>

                {/* Sub-rows */}
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                    <span>Vendas de Produtos e Acessórios (PDV Balcão)</span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(pdvSales)}
                  </td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {grossRevenue > 0 ? Math.round((pdvSales / grossRevenue) * 100) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <span>Serviços e Mão de Obra de OS Concluídas</span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(osLaborRevenue)}
                  </td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {grossRevenue > 0 ? Math.round((osLaborRevenue / grossRevenue) * 100) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Package className="w-3.5 h-3.5 text-purple-500" />
                    <span>Peças e Componentes Aplicados em OS</span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(osPartsRevenue)}
                  </td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {grossRevenue > 0 ? Math.round((osPartsRevenue / grossRevenue) * 100) : 0}%
                  </td>
                </tr>

                {/* (-) CMV */}
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
                    <span className="text-rose-600">(-) Custo das Mercadorias e Peças (CMV)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">
                    - {formatCurrency(totalCogs)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600">
                    {grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}%
                  </td>
                </tr>

                {/* (=) Lucro Bruto */}
                <tr className={`font-bold ${isDark ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>
                  <td className="py-2.5 px-3 pl-6 text-blue-600">
                    (=) LUCRO BRUTO OPERACIONAL
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-blue-600">
                    {formatCurrency(grossProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-600">{grossMargin}%</td>
                </tr>

                {/* (-) Despesas Operacionais */}
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                    <span className="text-amber-600">(-) Despesas Operacionais Pagas</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-amber-600">
                    - {formatCurrency(opExpenses)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-600">
                    {grossRevenue > 0 ? Math.round((opExpenses / grossRevenue) * 100) : 0}%
                  </td>
                </tr>

                {/* If Analítico or Categoria, list categories */}
                {(dreMode === 'ANALITICO' || dreMode === 'CATEGORIA') &&
                  expensesByCategory.map(([catName, data], idx) => (
                    <tr key={idx} className={`text-xs ${isDark ? 'bg-[#061224]/50' : 'bg-slate-50/40'}`}>
                      <td className={`py-1.5 px-3 pl-10 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        • {catName} ({data.count} pagamentos)
                      </td>
                      <td className={`py-1.5 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        - {formatCurrency(data.total)}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {grossRevenue > 0 ? Math.round((data.total / grossRevenue) * 100) : 0}%
                      </td>
                    </tr>
                  ))}

                {/* (=) Lucro Líquido DRE */}
                <tr className={`font-black text-sm ${isDark ? 'bg-emerald-950/40 text-white' : 'bg-emerald-50 text-slate-900'}`}>
                  <td className="py-3.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-600">(=) RESULTADO LÍQUIDO FINAL</span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 font-black text-base">
                    {formatCurrency(netProfit)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 font-extrabold">{profitMargin}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Ações Rápidas & Tip Box */}
        <div
          className={`lg:col-span-4 p-5 rounded-2xl border shadow-xs space-y-4 flex flex-col justify-between ${
            isDark ? 'bg-[#09152a] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div>
            <div className={`border-b pb-3 mb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Exportações & Ações Rápidas
              </h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onExport('PDF_GERENCIAL')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#3a0d18] text-rose-200 border border-rose-900/80 hover:bg-[#4d1221]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Emitir DRE Executivo em PDF</span>
              </button>

              <button
                onClick={() => onExport('EXCEL_COMPLETO')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#062c1d] text-emerald-200 border border-emerald-900/80 hover:bg-[#0a3a27]'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Exportar Balanço para Excel (CSV)</span>
              </button>

              <button
                onClick={() => onExport('DETALHADO')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#0d2242] text-blue-200 border border-blue-900/80 hover:bg-[#122e59]'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Relatório Gerencial Detalhado</span>
              </button>
            </div>
          </div>

          {/* Tip Card */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 mt-4 ${
              isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-600 block">Dica Financeira</span>
              <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Acompanhe o CMV de perto para garantir que suas margens em produtos e serviços cubram com folga as despesas operacionais fixas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
