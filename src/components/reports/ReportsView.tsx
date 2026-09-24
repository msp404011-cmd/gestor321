import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Wrench,
  Package,
  DollarSign,
  Layers,
  Clock,
  Calendar,
  Download,
  ChevronDown,
  Lock,
  TrendingUp,
  CreditCard,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileSpreadsheet,
  Lightbulb,
  CheckCircle2,
  Percent,
  Search,
  Filter,
  User,
  Eye,
  Printer,
  X,
  PackageCheck,
  Tag,
  ArrowUpDown,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Smartphone,
  TrendingDown,
  Wallet,
  Target,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { PaywallModal } from '../subscription/PaywallModal';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel, getCanonicalStatus, getOrderStatusLabel, getOrderStatusBadgeClasses } from '../../services/formatters';
import { Sale, ServiceOrder, Expense, Product, Purchase, AccountReceivable, PaymentMethod } from '../../types';

type TabType = 'OVERVIEW' | 'SALES' | 'SERVICES' | 'PRODUCTS' | 'FINANCE' | 'COMPARATIVE' | 'HISTORY';

// ==========================================
// 1. REPORTS OVERVIEW TAB
// ==========================================
type DreViewMode = 'SINTETICO' | 'ANALITICO' | 'CATEGORIA';

interface ReportsOverviewTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  expenses: Expense[];
  products: Product[];
  onExport: (type: string) => void;
}

const ReportsOverviewTab: React.FC<ReportsOverviewTabProps> = ({
  sales,
  orders,
  expenses,
  products,
  onExport,
}) => {
  const { isDark } = useTheme();
  const [dreMode, setDreMode] = useState<DreViewMode>('SINTETICO');

  const pdvSales = useMemo(() => sales.reduce((acc, s) => acc + (s.total || 0), 0), [sales]);
  const osServices = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    [orders]
  );
  const grossRevenue = pdvSales + osServices;

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

  const osLaborRevenue = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.laborPrice || 0), 0),
    [orders]
  );
  const osPartsRevenue = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (o.partsPrice || 0), 0),
    [orders]
  );

  const paidExpenses = useMemo(() => expenses.filter((e) => e.status === 'PAGO'), [expenses]);
  const opExpenses = useMemo(() => paidExpenses.reduce((acc, e) => acc + (e.amount || 0), 0), [paidExpenses]);

  const grossProfit = grossRevenue - totalCogs;
  const netProfit = grossRevenue - totalCogs - opExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
  const grossMargin = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0;

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
      .map(([name, val], idx) => ({
        name,
        percent: Math.round((val / opExpenses) * 100),
        value: val,
        color: colors[idx % colors.length],
      }));
  }, [paidExpenses, opExpenses]);

  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; count: number; items: Expense[] }> = {};
    paidExpenses.forEach((e) => {
      const cat = e.category || 'Outras Despesas';
      if (!grouped[cat]) grouped[cat] = { total: 0, count: 0, items: [] };
      grouped[cat].total += e.amount || 0;
      grouped[cat].count += 1;
      grouped[cat].items.push(e);
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [paidExpenses]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md"><TrendingUp className="w-6 h-6" /></div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"><ArrowUpRight className="w-3.5 h-3.5" /> 100%</span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Faturamento Bruto Total</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(grossRevenue)}</span>
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="text-blue-500 font-semibold">PDV: {formatCurrency(pdvSales)}</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-300'}>•</span>
              <span className="text-amber-500 font-semibold">OS: {formatCurrency(osServices)}</span>
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md"><ShoppingCart className="w-6 h-6" /></div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-600 border border-blue-500/30">{grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}% da Receita</span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Custo dos Produtos e Peças (CMV)</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalCogs)}</span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lucro Bruto: <strong className="text-blue-500">{formatCurrency(grossProfit)} ({grossMargin}%)</strong></span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md"><CreditCard className="w-6 h-6" /></div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30">{paidExpenses.length} pagamentos</span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Despesas Operacionais Pagas</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(opExpenses)}</span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((opExpenses / grossRevenue) * 100) : 0}% do faturamento bruto</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${netProfit >= 0 ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'}`}><PieChart className="w-6 h-6" /></div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 border-rose-500/30'}`}>
              {netProfit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />} Margem {profitMargin}%
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Resultado Líquido do Período</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${netProfit >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-rose-500'}`}>{formatCurrency(netProfit)}</span>
            <span className="text-[11px] mt-1 block font-semibold text-slate-400">Receitas - Custos - Despesas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-8 p-5 rounded-2xl border shadow-xs space-y-4 ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Demonstrativo de Resultados do Exercício (DRE)</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visão detalhada de receitas, custos diretos e despesas operacionais</p>
            </div>
            <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setDreMode('SINTETICO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${dreMode === 'SINTETICO' ? 'bg-blue-600 text-white shadow-xs' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Sintético</button>
              <button onClick={() => setDreMode('ANALITICO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${dreMode === 'ANALITICO' ? 'bg-blue-600 text-white shadow-xs' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Analítico</button>
              <button onClick={() => setDreMode('CATEGORIA')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${dreMode === 'CATEGORIA' ? 'bg-blue-600 text-white shadow-xs' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Por Categoria</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b text-[11px] uppercase font-bold ${isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                  <th className="py-2.5 px-3">Estrutura de Resultados</th>
                  <th className="py-2.5 px-3 text-right">Valor Real (R$)</th>
                  <th className="py-2.5 px-3 text-right">% Receita</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
                <tr className={`font-bold ${isDark ? 'bg-blue-950/30 text-white' : 'bg-slate-50 text-slate-900'}`}>
                  <td className="py-3 px-3 flex items-center gap-2"><span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span><span className="text-cyan-600 font-black">(+) RECEITA BRUTA TOTAL</span></td>
                  <td className={`py-3 px-3 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(grossRevenue)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>100%</td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><ShoppingCart className="w-3.5 h-3.5 text-blue-500" /><span>Vendas PDV Balcão</span></td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatCurrency(pdvSales)}</td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((pdvSales / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Wrench className="w-3.5 h-3.5 text-amber-500" /><span>Serviços e Mão de Obra OS</span></td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatCurrency(osLaborRevenue)}</td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((osLaborRevenue / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2"><span className="w-1.5 h-4 bg-rose-500 rounded-full"></span><span className="text-rose-600">(-) Custo das Mercadorias e Peças (CMV)</span></td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">- {formatCurrency(totalCogs)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">{grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr className={`font-bold ${isDark ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>
                  <td className="py-2.5 px-3 pl-6 text-blue-600">(=) LUCRO BRUTO OPERACIONAL</td>
                  <td className="py-2.5 px-3 text-right font-black text-blue-600">{formatCurrency(grossProfit)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-600">{grossMargin}%</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2"><span className="w-1.5 h-4 bg-amber-500 rounded-full"></span><span className="text-amber-600">(-) Despesas Operacionais Pagas</span></td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-amber-600">- {formatCurrency(opExpenses)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-600">{grossRevenue > 0 ? Math.round((opExpenses / grossRevenue) * 100) : 0}%</td>
                </tr>
                {(dreMode === 'ANALITICO' || dreMode === 'CATEGORIA') &&
                  expensesByCategory.map(([catName, data], idx) => (
                    <tr key={idx} className={`text-xs ${isDark ? 'bg-[#061224]/50' : 'bg-slate-50/40'}`}>
                      <td className={`py-1.5 px-3 pl-10 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>• {catName} ({data.count} pagamentos)</td>
                      <td className={`py-1.5 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>- {formatCurrency(data.total)}</td>
                      <td className={`py-1.5 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((data.total / grossRevenue) * 100) : 0}%</td>
                    </tr>
                  ))}
                <tr className={`font-black text-sm ${isDark ? 'bg-emerald-950/40 text-white' : 'bg-emerald-50 text-slate-900'}`}>
                  <td className="py-3.5 px-3 flex items-center gap-2"><span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span><span className="text-emerald-600">(=) RESULTADO LÍQUIDO FINAL</span></td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 font-black text-base">{formatCurrency(netProfit)}</td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 font-extrabold">{profitMargin}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={`lg:col-span-4 p-5 rounded-2xl border shadow-xs space-y-4 flex flex-col justify-between ${isDark ? 'bg-[#09152a] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div>
            <div className={`border-b pb-3 mb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Exportações & Ações Rápidas</h3>
            </div>
            <div className="space-y-2">
              <button onClick={() => onExport('PDF_GERENCIAL')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${isDark ? 'bg-[#3a0d18] text-rose-200 border border-rose-900/80 hover:bg-[#4d1221]' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}><FileText className="w-4 h-4 text-rose-500" /><span>Emitir DRE Executivo em PDF</span></button>
              <button onClick={() => onExport('EXCEL_COMPLETO')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${isDark ? 'bg-[#062c1d] text-emerald-200 border border-emerald-900/80 hover:bg-[#0a3a27]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}><FileSpreadsheet className="w-4 h-4 text-emerald-500" /><span>Exportar Balanço para Excel (CSV)</span></button>
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 mt-4 ${isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-50 border-slate-200'}`}>
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg flex-shrink-0"><Lightbulb className="w-5 h-5" /></div>
            <div>
              <span className="text-xs font-extrabold text-amber-600 block">Dica Financeira</span>
              <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Acompanhe o CMV de perto para garantir que suas margens cubram as despesas operacionais fixas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. REPORTS SALES TAB
// ==========================================
const ReportsSalesTab: React.FC<{ sales: Sale[]; onExport: (type: string) => void }> = ({ sales, onExport }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesClient = (s.customerName || '').toLowerCase().includes(term);
        const matchesSaleNum = String(s.saleNumber || '').includes(term);
        if (!matchesClient && !matchesSaleNum) return false;
      }
      if (selectedPaymentMethod !== 'ALL' && s.paymentMethod !== selectedPaymentMethod) return false;
      return true;
    });
  }, [sales, searchTerm, selectedPaymentMethod]);

  const totalGrossSales = useMemo(() => filteredSales.reduce((sum, s) => sum + (s.total || 0), 0), [filteredSales]);
  const totalSalesCount = filteredSales.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Total Vendido PDV</span>
          <p className={`text-2xl font-black mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalGrossSales)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-cyan-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Volume de Vendas</span>
          <p className={`text-2xl font-black mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalSalesCount}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Ticket Médio</span>
          <p className={`text-2xl font-black mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalSalesCount > 0 ? totalGrossSales / totalSalesCount : 0)}</p>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-bold ${isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Nº Venda</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-3 px-3">{formatDateTime(sale.date || sale.createdAt)}</td>
                  <td className="py-3 px-3 font-bold text-blue-500">#{String(sale.saleNumber || sale.id).slice(-6)}</td>
                  <td className="py-3 px-3">{sale.customerName || 'Consumidor Final'}</td>
                  <td className="py-3 px-3">{getPaymentMethodLabel(sale.paymentMethod)}</td>
                  <td className={`py-3 px-3 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(sale.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN REPORTS VIEW
// ==========================================
interface ReportsViewProps {
  onOpenPlans?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPlans }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [dateRange, setDateRange] = useState('01/09/2026 - 30/09/2026');
  const [selectedReportType, setSelectedReportType] = useState('Relatório Completo');
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
    const unsub = StorageService.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const subLimits = useMemo(() => SubscriptionService.checkSubscriptionLimits(), [tick]);
  const sales = useMemo(() => StorageService.getSales() || [], [tick]);
  const orders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const expenses = useMemo(() => StorageService.getExpenses() || [], [tick]);
  const products = useMemo(() => StorageService.getProducts() || [], [tick]);

  const handleExport = (type: string) => {
    if (!subLimits.canExportPdf) {
      setPaywallModalState({
        isOpen: true,
        title: 'Exportação em PDF Bloqueada',
        description: 'A exportação de relatórios em PDF é um recurso Pro.',
        feature: 'EXPORT_PDF',
      });
      return;
    }
    alert(`Exportando relatório (${type})... Gerado com sucesso!`);
  };

  const isOrdersAllowed = SubscriptionService.isTabAllowed('ORDERS');

  const tabs = [
    { id: 'OVERVIEW', label: 'Visão Geral & DRE', icon: BarChart3, isPro: false },
    { id: 'SALES', label: 'Vendas (PDV)', icon: ShoppingCart, isPro: false },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${isDark ? 'bg-[#09152a] border-blue-900/60 shadow-xl text-white' : 'bg-white border-slate-200 shadow-xs text-slate-900'}`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-500 shadow-inner">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Relatórios & Análises</h2>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Métricas detalhadas, demonstrativos financeiros e saídas.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => handleExport(activeTab)} className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all shadow-xs cursor-pointer ${isDark ? 'bg-[#0c1c38] hover:bg-blue-600/30 text-white border-blue-800/80' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'}`}>
            <Download className="w-4 h-4 text-blue-500" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as TabType)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-md border border-blue-500' : isDark ? 'bg-[#09152a] text-slate-400 hover:text-slate-200 border border-blue-900/50' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'OVERVIEW' && <ReportsOverviewTab sales={sales} orders={orders} expenses={expenses} products={products} onExport={handleExport} />}
      {activeTab === 'SALES' && <ReportsSalesTab sales={sales} onExport={handleExport} />}

      <PaywallModal isOpen={paywallModalState.isOpen} onClose={() => setPaywallModalState((prev) => ({ ...prev, isOpen: false }))} title={paywallModalState.title} description={paywallModalState.description} feature={paywallModalState.feature} onOpenPlans={onOpenPlans} />
    </div>
  );
};
