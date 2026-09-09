import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  PieChart,
  Calendar,
  Download,
  ChevronDown,
  Wrench,
  Package,
  DollarSign,
  Clock,
  FileText,
  FileSpreadsheet,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Layers,
  Filter,
  Crown,
  Lock,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { PaywallModal } from '../subscription/PaywallModal';
import { formatCurrency } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

type TabType = 'OVERVIEW' | 'SALES' | 'SERVICES' | 'PRODUCTS' | 'FINANCE' | 'COMPARATIVE' | 'HISTORY';
type DreViewMode = 'SINTETICO' | 'ANALITICO' | 'CATEGORIA';

interface ReportsViewProps {
  onOpenPlans?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPlans }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [dreMode, setDreMode] = useState<DreViewMode>('SINTETICO');
  const [dateRange, setDateRange] = useState('01/09/2026 - 30/09/2026');
  const [selectedDreType, setSelectedDreType] = useState('DRE Gerencial');
  const [tick, setTick] = useState(0);

  const [paywallModalState, setPaywallModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    feature: 'ADVANCED_REPORTS' | 'EXPORT_PDF';
  }>({
    isOpen: false,
    title: '',
    description: '',
    feature: 'ADVANCED_REPORTS',
  });

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const subLimits = useMemo(() => SubscriptionService.checkSubscriptionLimits(), [tick]);

  // Dynamic storage data calculation
  const sales = useMemo(() => StorageService.getSales() || [], [tick]);
  const orders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const expenses = useMemo(() => StorageService.getExpenses() || [], [tick]);

  const pdvSales = useMemo(() => sales.reduce((acc, s) => acc + (s.total || 0), 0), [sales]);
  const osServices = useMemo(() => orders.filter(o => o.status === 'ENTREGUE').reduce((acc, o) => acc + (o.totalPrice || 0), 0), [orders]);
  const grossRevenue = pdvSales + osServices;
  const cogs = useMemo(() => sales.reduce((acc, s) => acc + (s.costTotal || 0), 0), [sales]);
  const opExpenses = useMemo(() => expenses.filter(e => e.status === 'PAGO').reduce((acc, e) => acc + (e.amount || 0), 0), [expenses]);
  const netProfit = grossRevenue - cogs - opExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  const handleExport = (type: string) => {
    if (!subLimits.canExportPdf) {
      setPaywallModalState({
        isOpen: true,
        title: 'Exportação em PDF Bloqueada',
        description: 'A exportação de relatórios em formato PDF e relatórios executivos é um recurso exclusivo do Plano Pro.',
        feature: 'EXPORT_PDF',
      });
      return;
    }
    alert(`Exportando relatório (${type})... O arquivo em formato ${type} foi gerado com sucesso!`);
  };

  const tabs = [
    { id: 'OVERVIEW', label: 'Visão Geral', icon: BarChart3, isPro: false },
    { id: 'SALES', label: 'Vendas', icon: ShoppingCart, isPro: false },
    { id: 'SERVICES', label: 'Serviços (OS)', icon: Wrench, isPro: false },
    { id: 'PRODUCTS', label: 'Produtos / Estoque', icon: Package, isPro: false },
    { id: 'FINANCE', label: 'Financeiro', icon: DollarSign, isPro: true },
    { id: 'COMPARATIVE', label: 'Comparativos', icon: Layers, isPro: true },
    { id: 'HISTORY', label: 'Histórico', icon: Clock, isPro: true },
  ];

  // Expenses breakdown from real data
  const expenseComposition = useMemo(() => {
    const paidExpenses = expenses.filter(e => e.status === 'PAGO');
    const totalExp = paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    if (totalExp === 0) return [];

    const grouped: Record<string, number> = {};
    paidExpenses.forEach(e => {
      const cat = e.category || 'Outros';
      grouped[cat] = (grouped[cat] || 0) + (e.amount || 0);
    });

    const colors = ['#00b4d8', '#f59e0b', '#8b5cf6', '#ec4899', '#a855f7', '#10b981'];
    return Object.entries(grouped).map(([name, val], idx) => {
      const color = colors[idx % colors.length];
      const pct = Math.round((val / totalExp) * 100);
      return {
        name,
        percent: pct,
        value: val,
        color,
        class: `bg-[${color}]`,
      };
    });
  }, [expenses]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Main Header Card */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#09152a] border-blue-900/60 shadow-xl text-white' : 'bg-white border-slate-200 shadow-xs text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-500 shadow-inner">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Relatórios & Análises</h2>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Visualize os resultados da sua empresa de forma simples e completa.
            </p>
          </div>
        </div>

        {/* Top Control Bar (Select, Date Picker, Export) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* DRE Type Selector */}
          <div className="relative">
            <select
              value={selectedDreType}
              onChange={(e) => setSelectedDreType(e.target.value)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl border appearance-none pr-9 cursor-pointer transition-colors shadow-xs ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="DRE Gerencial">DRE Gerencial</option>
              <option value="DRE Fiscal">DRE Fiscal</option>
              <option value="Fluxo de Caixa">Fluxo de Caixa</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Date Range Selector */}
          <div className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border shadow-xs cursor-pointer transition-colors ${
            isDark
              ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
              : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
          }`}>
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>

          {/* Export Action Button */}
          <button
            onClick={() => handleExport('PDF')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
              isDark
                ? 'bg-[#0c1c38] hover:bg-blue-600/30 text-white border-blue-800/80'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          const isLocked = t.isPro && !subLimits.canAccessAdvancedReports;

          return (
            <button
              key={t.id}
              onClick={() => {
                if (isLocked) {
                  setPaywallModalState({
                    isOpen: true,
                    title: `Relatório ${t.label} Bloqueado`,
                    description: 'Relatórios avançados, demonstrativos financeiros detalhados e análises comparativas são recursos exclusivos do Plano Pro e Enterprise.',
                    feature: 'ADVANCED_REPORTS',
                  });
                  return;
                }
                setActiveTab(t.id as TabType);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                  : isDark
                  ? 'bg-[#09152a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1c38] border border-blue-900/50'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.isPro && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                  isLocked
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isLocked && <Lock className="w-2.5 h-2.5" />}
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4 Executive Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
          isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <ArrowUpRight className="w-3.5 h-3.5" /> 18%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Faturamento Bruto</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(grossRevenue)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>em relação ao mês anterior</span>
          </div>
        </div>

        {/* Card 2: Custo das Mercadorias */}
        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30">
              <ArrowDownRight className="w-3.5 h-3.5" /> 7%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Custo das Mercadorias</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(cogs)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>34% do faturamento</span>
          </div>
        </div>

        {/* Card 3: Despesas Operacionais */}
        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
          isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30">
              ↑ 5%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Despesas Operacionais</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(opExpenses)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>18% do faturamento</span>
          </div>
        </div>

        {/* Card 4: Lucro Líquido (DRE) */}
        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${
          isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <PieChart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <ArrowUpRight className="w-3.5 h-3.5" /> + 26%
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Lucro Líquido (DRE)</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(netProfit)}
            </span>
            <span className="text-[11px] mt-1 block font-semibold text-emerald-600">
              Margem Líquida: {profitMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Faturamento x Lucro (Últimos 6 meses) */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Faturamento x Lucro (Últimos 6 meses)</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Faturamento</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Lucro Líquido</span>
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

              {/* Horizontal Grid lines & Y-axis labels */}
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

              {/* Active Month Tooltip Overlay over "Set" node */}
              <g transform="translate(360, 50)">
                <rect
                  x="0"
                  y="0"
                  width="115"
                  height="45"
                  rx="8"
                  fill={isDark ? '#0c1d38' : '#1e293b'}
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
                <text x="8" y="14" fill="#38bdf8" fontSize="9" fontWeight="bold">
                  Set/2026
                </text>
                <circle cx="12" cy="25" r="3" fill="#3b82f6" />
                <text x="20" y="28" fill="#e2e8f0" fontSize="8.5">
                  Faturamento: <tspan fontWeight="bold">R$ 12.450,00</tspan>
                </text>
                <circle cx="12" cy="36" r="3" fill="#10b981" />
                <text x="20" y="39" fill="#e2e8f0" fontSize="8.5">
                  Lucro: <tspan fontWeight="bold">R$ 6.040,00</tspan>
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Chart: Composição das Despesas (Donut + Legend) */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className={`border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Composição das Despesas</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Donut Chart SVG */}
            <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {expenseComposition.length === 0 ? (
                  <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="16" />
                ) : (
                  expenseComposition.map((item, idx) => {
                    const circumference = 2 * Math.PI * 38; // ~238.76
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

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(opExpenses)}
                </span>
                <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</span>
              </div>
            </div>

            {/* Expenses Detailed Legend List */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {expenseComposition.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  Nenhuma despesa registrada
                </div>
              ) : (
                expenseComposition.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.percent}%</span>
                      <span className={`font-bold w-16 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

      {/* Bottom Grid: DRE Sintético Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: DRE Sintético Table */}
        <div className={`lg:col-span-8 p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
            isDark ? 'border-blue-900/40' : 'border-slate-200'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DRE Sintético - Este Mês</h3>

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
                <tr className={`border-b text-[11px] uppercase ${
                  isDark ? 'text-slate-400 border-blue-900/40' : 'text-slate-500 border-slate-200'
                }`}>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                  <th className="py-2.5 px-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
                {/* (+) Receita Operacional Bruta */}
                <tr className={`font-bold ${isDark ? 'bg-blue-950/20 text-white' : 'bg-slate-50 text-slate-900'}`}>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                    <span className="text-cyan-600 font-extrabold">(+) Receita Operacional Bruta</span>
                  </td>
                  <td className={`py-3 px-3 text-right font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(grossRevenue)}
                  </td>
                  <td className={`py-3 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>100%</td>
                </tr>

                {/* Sub-rows */}
                <tr>
                  <td className={`py-2.5 px-3 pl-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Vendas de Produtos e Acessórios (PDV)
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(pdvSales)}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>70%</td>
                </tr>
                <tr>
                  <td className={`py-2.5 px-3 pl-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Serviços Prestados em Ordens de Serviço (OS)
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(osServices)}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>30%</td>
                </tr>

                {/* (-) CMV */}
                <tr className="font-bold">
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                    <span className="text-rose-600">(-) Custo das Mercadorias e Peças (CMV)</span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                    - {formatCurrency(cogs)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600">34%</td>
                </tr>

                {/* (-) Despesas Operacionais */}
                <tr className="font-bold">
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                    <span className="text-rose-600">(-) Despesas Operacionais</span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                    - {formatCurrency(opExpenses)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600">18%</td>
                </tr>

                {/* (=) Lucro Líquido DRE */}
                <tr className={`font-black text-sm ${isDark ? 'bg-emerald-950/30 text-white' : 'bg-emerald-50 text-slate-900'}`}>
                  <td className="py-3.5 px-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-600">(=) Lucro Líquido (DRE)</span>
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
        <div className={`lg:col-span-4 p-5 rounded-2xl border shadow-xs space-y-4 flex flex-col justify-between ${
          isDark ? 'bg-[#09152a] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className={`border-b pb-3 mb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ações Rápidas</h3>
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleExport('PDF')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#3a0d18] text-rose-200 border border-rose-900/80 hover:bg-[#4d1221]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Emitir Relatório em PDF</span>
              </button>

              <button
                onClick={() => handleExport('Excel')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#062c1d] text-emerald-200 border border-emerald-900/80 hover:bg-[#0a3a27]'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Exportar para Excel</span>
              </button>

              <button
                onClick={() => handleExport('Detalhado')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#0d2242] text-blue-200 border border-blue-900/80 hover:bg-[#122e59]'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Relatório Detalhado</span>
              </button>

              <button
                onClick={() => handleExport('Vendas')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#250d3a] text-purple-200 border border-purple-900/80 hover:bg-[#341352]'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-purple-500" />
                <span>Relatório de Vendas</span>
              </button>

              <button
                onClick={() => handleExport('OS')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#2f2208] text-amber-200 border border-amber-900/80 hover:bg-[#3f2e0b]'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>Relatório de OS</span>
              </button>

              <button
                onClick={() => handleExport('Comparativo')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#0d2c3a] text-cyan-200 border border-cyan-900/80 hover:bg-[#123b4e]'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-cyan-500" />
                <span>Comparativo de Períodos</span>
              </button>
            </div>
          </div>

          {/* Tip Card */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 mt-4 ${
            isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-600 block">Dica</span>
              <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Analise seus relatórios mensalmente para tomar decisões mais assertivas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Paywall Gate Modal */}
      <PaywallModal
        isOpen={paywallModalState.isOpen}
        onClose={() => setPaywallModalState((prev) => ({ ...prev, isOpen: false }))}
        title={paywallModalState.title}
        description={paywallModalState.description}
        feature={paywallModalState.feature}
        onOpenPlans={onOpenPlans}
      />
    </div>
  );
};
