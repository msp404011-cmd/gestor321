import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Wrench,
  DollarSign,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
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
  Printer,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  Smartphone,
  Wallet,
  Target,
  Layers,
  Tag,
  AlertCircle,
  Check,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { useTheme } from '../../context/ThemeContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getPaymentMethodLabel,
  getOrderStatusLabel,
} from '../../services/formatters';
import { Sale, ServiceOrder, Expense, Product } from '../../types';

export type TabType = 'GAINS_PDV_OS' | 'OVERVIEW' | 'SALES' | 'SERVICES';

// Helpers para cálculo financeiro
export const getSaleGross = (sale: Sale): number => {
  return Number(sale.total) || Number(sale.subtotal) || 0;
};

export const getSaleCost = (sale: Sale): number => {
  if (typeof sale.costTotal === 'number' && sale.costTotal > 0) return sale.costTotal;
  if (typeof sale.totalCost === 'number' && sale.totalCost > 0) return sale.totalCost;
  if (Array.isArray(sale.items) && sale.items.length > 0) {
    return sale.items.reduce((sum, item) => {
      const unitCost = Number(item.unitCost ?? item.costPrice ?? 0);
      const qty = Number(item.quantity) || 1;
      return sum + unitCost * qty;
    }, 0);
  }
  return 0;
};

export const getSaleProfit = (sale: Sale): number => {
  return getSaleGross(sale) - getSaleCost(sale);
};

export const getOrderPartsCost = (order: ServiceOrder): number => {
  const parts = order.parts || order.items || [];
  return parts
    .filter((i) => i.type === 'PECA' || i.type === 'PRODUTO')
    .reduce((sum, item) => {
      const unitCost = Number(item.unitCost ?? item.costPrice ?? 0);
      const qty = Number(item.quantity) || 1;
      return sum + unitCost * qty;
    }, 0);
};

export const getOrderGross = (order: ServiceOrder): number => {
  if (typeof order.totalPrice === 'number' && !isNaN(order.totalPrice)) {
    return order.totalPrice;
  }
  const labor = Number(order.laborPrice) || 0;
  const parts = Number(order.partsPrice) || 0;
  const discount = Number(order.discount) || 0;
  return Math.max(0, labor + parts - discount);
};

export const getOrderProfit = (order: ServiceOrder): number => {
  return getOrderGross(order) - getOrderPartsCost(order);
};

export const getOrderDate = (order: ServiceOrder): string => {
  return order.paymentDate || order.deliveredAt || order.updatedAt || order.createdAt || '';
};

export const isDateInRange = (dateStr: string | undefined, startDate: string, endDate: string): boolean => {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const targetYmd = `${year}-${month}-${day}`;

  if (startDate && targetYmd < startDate) return false;
  if (endDate && targetYmd > endDate) return false;
  return true;
};

// ==========================================
// 1. SETOR PRINCIPAL: GANHOS PDV & OS
// ==========================================
interface GainsPdvOsTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  startDate: string;
  endDate: string;
  onExportCsv: () => void;
  onCopySummary: () => void;
  onPrint: () => void;
}

const GainsPdvOsTab: React.FC<GainsPdvOsTabProps> = ({
  sales,
  orders,
  startDate,
  endDate,
  onExportCsv,
  onCopySummary,
  onPrint,
}) => {
  const { isDark } = useTheme();
  const [osFilterMode, setOsFilterMode] = useState<'DELIVERED_PAID' | 'ALL'>('DELIVERED_PAID');
  const [pdvSearch, setPdvSearch] = useState('');
  const [osSearch, setOsSearch] = useState('');
  const [isPdvExpanded, setIsPdvExpanded] = useState(true);
  const [isOsExpanded, setIsOsExpanded] = useState(true);

  // Filtragem estrita: apenas OS Entregues ou Pagas
  const activeOrders = useMemo(() => {
    return orders.filter((o) => {
      return o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO';
    });
  }, [orders]);

  // Estatísticas do PDV
  const pdvStats = useMemo(() => {
    const gross = sales.reduce((acc, s) => acc + getSaleGross(s), 0);
    const cost = sales.reduce((acc, s) => acc + getSaleCost(s), 0);
    const profit = gross - cost;
    const margin = gross > 0 ? Math.round((profit / gross) * 100) : 0;
    const itemsCount = sales.reduce((acc, s) => acc + (s.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0), 0);
    const count = sales.length;
    const avgTicket = count > 0 ? gross / count : 0;

    return { gross, cost, profit, margin, count, itemsCount, avgTicket };
  }, [sales]);

  // Estatísticas das Ordens de Serviço
  const osStats = useMemo(() => {
    const gross = activeOrders.reduce((acc, o) => acc + getOrderGross(o), 0);
    const cost = activeOrders.reduce((acc, o) => acc + getOrderPartsCost(o), 0);
    const profit = gross - cost;
    const margin = gross > 0 ? Math.round((profit / gross) * 100) : 0;
    const count = activeOrders.length;
    const labor = activeOrders.reduce((acc, o) => acc + (Number(o.laborPrice) || 0), 0);
    const partsRevenue = activeOrders.reduce((acc, o) => acc + (Number(o.partsPrice) || 0), 0);
    const avgTicket = count > 0 ? gross / count : 0;

    return { gross, cost, profit, margin, count, labor, partsRevenue, avgTicket };
  }, [activeOrders]);

  // Soma Total Consolidada
  const totalStats = useMemo(() => {
    const gross = pdvStats.gross + osStats.gross;
    const cost = pdvStats.cost + osStats.cost;
    const profit = pdvStats.profit + osStats.profit;
    const margin = gross > 0 ? Math.round((profit / gross) * 100) : 0;
    const totalOps = pdvStats.count + osStats.count;
    const avgTicket = totalOps > 0 ? gross / totalOps : 0;

    const pdvGrossShare = gross > 0 ? Math.round((pdvStats.gross / gross) * 100) : 0;
    const osGrossShare = gross > 0 ? 100 - pdvGrossShare : 0;

    const pdvProfitShare = profit > 0 ? Math.round((pdvStats.profit / profit) * 100) : 0;
    const osProfitShare = profit > 0 ? 100 - pdvProfitShare : 0;

    return {
      gross,
      cost,
      profit,
      margin,
      totalOps,
      avgTicket,
      pdvGrossShare,
      osGrossShare,
      pdvProfitShare,
      osProfitShare,
    };
  }, [pdvStats, osStats]);

  // Vendas do PDV filtradas por busca interna
  const filteredSales = useMemo(() => {
    if (!pdvSearch.trim()) return sales;
    const q = pdvSearch.toLowerCase().trim();
    return sales.filter((s) => {
      const client = (s.customerName || '').toLowerCase();
      const num = String(s.saleNumber || s.id);
      const pay = getPaymentMethodLabel(s.paymentMethod).toLowerCase();
      return client.includes(q) || num.includes(q) || pay.includes(q);
    });
  }, [sales, pdvSearch]);

  // OS filtradas por busca interna
  const filteredOrders = useMemo(() => {
    if (!osSearch.trim()) return activeOrders;
    const q = osSearch.toLowerCase().trim();
    return activeOrders.filter((o) => {
      const client = (o.customerName || '').toLowerCase();
      const num = String(o.orderNumber || o.id);
      const dev = [o.brand, o.model].filter(Boolean).join(' ').toLowerCase();
      const srv = (o.performedService || o.requestedService || o.clientDefect || '').toLowerCase();
      return client.includes(q) || num.includes(q) || dev.includes(q) || srv.includes(q);
    });
  }, [activeOrders, osSearch]);

  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return `De ${formatDate(startDate)} até ${formatDate(endDate)}`;
    }
    if (startDate) return `A partir de ${formatDate(startDate)}`;
    if (endDate) return `Até ${formatDate(endDate)}`;
    return 'Todo o Histórico Completo';
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* SETOR 3: SOMA TOTAL CONSOLIDADA DO FILTRO POR DATA (HEADER) */}
      {/* ======================================================== */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c1a33] via-[#09152a] to-[#0d1424] border-blue-800/80'
            : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border-blue-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Soma Total Consolidada (PDV + OS)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Filtro por Data
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-bold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                📅 {periodLabel} • {totalStats.totalOps} operações realizadas ({pdvStats.count} vendas PDV + {osStats.count} ordens de serviço)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopySummary}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 shadow-xs"
              title="Copiar resumo completo com emojis para WhatsApp"
            >
              <Copy className="w-4 h-4 text-purple-400" />
              <span>Copiar Resumo</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 shadow-xs"
              title="Imprimir relatório completo deste período"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              title="Exportar planilha Excel (CSV) deste período"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Totais Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Faturamento Bruto Total */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b162c] border-emerald-500/30' : 'bg-white border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Faturamento Bruto Geral
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
              {formatCurrency(totalStats.gross)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[11px]">
              <span className="text-blue-400 font-bold">PDV: {formatCurrency(pdvStats.gross)} ({totalStats.pdvGrossShare}%)</span>
              <span className="text-amber-400 font-bold">OS: {formatCurrency(osStats.gross)} ({totalStats.osGrossShare}%)</span>
            </div>
          </div>

          {/* Card 2: Custo Total de Produtos & Peças */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b162c] border-rose-500/30' : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Custo Total (Produtos & Peças)
              </span>
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2 font-mono">
              {formatCurrency(totalStats.cost)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[11px]">
              <span className="text-blue-400 font-bold">PDV: {formatCurrency(pdvStats.cost)}</span>
              <span className="text-amber-400 font-bold">OS: {formatCurrency(osStats.cost)}</span>
            </div>
          </div>

          {/* Card 3: Lucro Total Consolidado */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b162c] border-cyan-500/40' : 'bg-white border-cyan-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Lucro Total Geral
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Margem {totalStats.margin}%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2 font-mono">
              {formatCurrency(totalStats.profit)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[11px]">
              <span className="text-blue-400 font-bold">PDV: {formatCurrency(pdvStats.profit)} ({totalStats.pdvProfitShare}%)</span>
              <span className="text-amber-400 font-bold">OS: {formatCurrency(osStats.profit)} ({totalStats.osProfitShare}%)</span>
            </div>
          </div>

          {/* Card 4: Ticket Médio & Volume */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b162c] border-purple-500/30' : 'bg-white border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Volume & Ticket Médio
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 mt-2 font-mono">
              {formatCurrency(totalStats.avgTicket)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[11px]">
              <span className="text-slate-400 font-bold">{totalStats.totalOps} atendimentos</span>
              <span className="text-emerald-400 font-bold">Bruto - Custo = Lucro</span>
            </div>
          </div>
        </div>

        {/* Barra Visual de Proporção: PDV vs OS */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#081122]/70 border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>PDV ({totalStats.pdvGrossShare}%)</span>
            </span>
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
              Distribuição do Faturamento
            </span>
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>OS ({totalStats.osGrossShare}%)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${totalStats.pdvGrossShare}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
              title={`PDV: ${formatCurrency(pdvStats.gross)} (${totalStats.pdvGrossShare}%)`}
            />
            <div
              style={{ width: `${totalStats.osGrossShare}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              title={`OS: ${formatCurrency(osStats.gross)} (${totalStats.osGrossShare}%)`}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SETOR 1: GANHOS DO PDV (VENDAS BALCÃO) */}
      {/* ======================================================== */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-blue-200'
        }`}
      >
        {/* Header do Setor PDV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  1. Ganhos do PDV (Vendas de Balcão)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {pdvStats.count} {pdvStats.count === 1 ? 'venda' : 'vendas'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Faturamento bruto, custo das mercadorias vendidas (CMV) e lucro das vendas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPdvExpanded(!isPdvExpanded)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700"
            >
              {isPdvExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Recolher Tabela</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Ver {pdvStats.count} Vendas Detalhadas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Cards de Bruto, Custo e Lucro do PDV */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {/* Bruto PDV */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-blue-50/50 border-blue-200'}`}>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
              🟢 Faturamento Bruto PDV
            </span>
            <div className="text-2xl font-black text-blue-400 mt-1 font-mono">
              {formatCurrency(pdvStats.gross)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total arrecadado nas vendas do período
            </p>
          </div>

          {/* Custo PDV */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-rose-800/60' : 'bg-rose-50/50 border-rose-200'}`}>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              🔴 Custo dos Produtos (CMV)
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
              {formatCurrency(pdvStats.cost)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Custo de compra das {pdvStats.itemsCount} mercadorias vendidas
            </p>
          </div>

          {/* Lucro PDV */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-emerald-800/60' : 'bg-emerald-50/50 border-emerald-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                🔵 Lucro Bruto PDV
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Margem {pdvStats.margin}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {formatCurrency(pdvStats.profit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Bruto - Custo ({pdvStats.count} vendas • Médio: {formatCurrency(pdvStats.avgTicket)})
            </p>
          </div>
        </div>

        {/* Tabela Analítica das Vendas do PDV */}
        {isPdvExpanded && (
          <div className="mt-5 space-y-3 pt-3 border-t border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                Extrato Detalhado de Vendas do PDV ({filteredSales.length})
              </span>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, nº venda..."
                  value={pdvSearch}
                  onChange={(e) => setPdvSearch(e.target.value)}
                  className="w-full bg-[#081122] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase text-[10px] ${isDark ? 'bg-[#081122] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Nº Venda</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Forma Pagto</th>
                    <th className="py-2.5 px-3 text-center">Itens</th>
                    <th className="py-2.5 px-3 text-right">Bruto (R$)</th>
                    <th className="py-2.5 px-3 text-right">Custo (R$)</th>
                    <th className="py-2.5 px-3 text-right">Lucro (R$)</th>
                    <th className="py-2.5 px-3 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-xs text-slate-500 font-sans italic">
                        Nenhuma venda encontrada para os critérios selecionados no período.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const gross = getSaleGross(sale);
                      const cost = getSaleCost(sale);
                      const profit = gross - cost;
                      const margin = gross > 0 ? Math.round((profit / gross) * 100) : 0;
                      const itemsTotalQty = (sale.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

                      return (
                        <tr key={sale.id} className="hover:bg-blue-600/5 transition-colors">
                          <td className="py-2.5 px-3 font-sans text-slate-400">
                            {formatDateTime(sale.date || sale.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-400 font-sans">
                            #{String(sale.saleNumber || sale.id).slice(-6)}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-white truncate max-w-[150px]">
                            {sale.customerName || 'Consumidor Final'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-300">
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400 font-sans">
                            {itemsTotalQty}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {formatCurrency(gross)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-400 font-medium">
                            {formatCurrency(cost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                            {formatCurrency(profit)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              margin >= 40
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : margin >= 20
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {margin}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredSales.length > 0 && (
                  <tfoot>
                    <tr className={`border-t font-bold font-mono ${isDark ? 'bg-[#081122] text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
                      <td colSpan={4} className="py-3 px-3 font-sans font-black text-blue-400">
                        TOTAL DO PDV ({filteredSales.length} vendas):
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-sans">
                        {filteredSales.reduce((sum, s) => sum + (s.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-blue-400">
                        {formatCurrency(filteredSales.reduce((sum, s) => sum + getSaleGross(s), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        {formatCurrency(filteredSales.reduce((sum, s) => sum + getSaleCost(s), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        {formatCurrency(filteredSales.reduce((sum, s) => sum + getSaleProfit(s), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-cyan-400">
                        {pdvStats.margin}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SETOR 2: GANHOS DAS ORDENS DE SERVIÇO (OS) */}
      {/* ======================================================== */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-amber-200'
        }`}
      >
        {/* Header do Setor OS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Ganhos das Ordens de Serviço (OS)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {osStats.count} {osStats.count === 1 ? 'ordem' : 'ordens'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Faturamento bruto (Mão de Obra + Peças), custo de insumos/telas e lucro dos reparos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">


            <button
              type="button"
              onClick={() => setIsOsExpanded(!isOsExpanded)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
            >
              {isOsExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Recolher Tabela</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Ver {osStats.count} OS Detalhadas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Cards de Bruto, Custo e Lucro das OS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {/* Bruto OS */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-amber-800/60' : 'bg-amber-50/50 border-amber-200'}`}>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              🟢 Faturamento Bruto OS
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
              {formatCurrency(osStats.gross)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Mão de Obra: {formatCurrency(osStats.labor)}</span>
              <span>Peças: {formatCurrency(osStats.partsRevenue)}</span>
            </div>
          </div>

          {/* Custo Peças OS */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-rose-800/60' : 'bg-rose-50/50 border-rose-200'}`}>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              🔴 Custo de Peças / Insumos
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
              {formatCurrency(osStats.cost)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Custo de reposição das peças aplicadas nos reparos
            </p>
          </div>

          {/* Lucro OS */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0c1c38] border-emerald-800/60' : 'bg-emerald-50/50 border-emerald-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                🔵 Lucro Líquido OS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Margem {osStats.margin}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {formatCurrency(osStats.profit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Bruto - Custo Peças ({osStats.count} OS • Médio: {formatCurrency(osStats.avgTicket)})
            </p>
          </div>
        </div>

        {/* Tabela Analítica das Ordens de Serviço */}
        {isOsExpanded && (
          <div className="mt-5 space-y-3 pt-3 border-t border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                Extrato Detalhado de Ordens de Serviço ({filteredOrders.length})
              </span>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, modelo, nº OS..."
                  value={osSearch}
                  onChange={(e) => setOsSearch(e.target.value)}
                  className="w-full bg-[#081122] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase text-[10px] ${isDark ? 'bg-[#081122] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Nº OS</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Aparelho</th>
                    <th className="py-2.5 px-3">Serviço / Defeito</th>
                    <th className="py-2.5 px-3 text-right">M. Obra (R$)</th>
                    <th className="py-2.5 px-3 text-right">Peças (R$)</th>
                    <th className="py-2.5 px-3 text-right">Custo Peça (R$)</th>
                    <th className="py-2.5 px-3 text-right">Bruto (R$)</th>
                    <th className="py-2.5 px-3 text-right">Lucro OS (R$)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-xs text-slate-500 font-sans italic">
                        Nenhuma ordem de serviço encontrada para os critérios selecionados no período.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const gross = getOrderGross(order);
                      const cost = getOrderPartsCost(order);
                      const profit = gross - cost;
                      const deviceStr = [order.brand, order.model].filter(Boolean).join(' ');
                      const serviceStr = order.performedService || order.requestedService || order.clientDefect || 'Reparo';

                      return (
                        <tr key={order.id} className="hover:bg-amber-600/5 transition-colors">
                          <td className="py-2.5 px-3 font-sans text-slate-400">
                            {formatDate(getOrderDate(order))}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-amber-400 font-sans">
                            #{order.orderNumber || String(order.id).slice(-4)}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-white truncate max-w-[140px]">
                            {order.customerName || 'Cliente'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-[120px]">
                            {deviceStr || 'Dispositivo'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400 truncate max-w-[150px]">
                            {serviceStr}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {formatCurrency(order.laborPrice || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {formatCurrency(order.partsPrice || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-400 font-medium">
                            {formatCurrency(cost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {formatCurrency(gross)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                            {formatCurrency(profit)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredOrders.length > 0 && (
                  <tfoot>
                    <tr className={`border-t font-bold font-mono ${isDark ? 'bg-[#081122] text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
                      <td colSpan={5} className="py-3 px-3 font-sans font-black text-amber-400">
                        TOTAL DAS OS ({filteredOrders.length} ordens):
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-300">
                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + (Number(o.laborPrice) || 0), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-300">
                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + (Number(o.partsPrice) || 0), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + getOrderPartsCost(o), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-400">
                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + getOrderGross(o), 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + getOrderProfit(o), 0))}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-cyan-400">
                        {osStats.margin}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. ABA: VISÃO GERAL & DRE
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
  products: _products,
  onExport,
}) => {
  const { isDark } = useTheme();
  const [dreMode, setDreMode] = useState<DreViewMode>('SINTETICO');

  const pdvSales = useMemo(() => sales.reduce((acc, s) => acc + getSaleGross(s), 0), [sales]);
  const osServices = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + getOrderGross(o), 0),
    [orders]
  );
  const grossRevenue = pdvSales + osServices;

  const pdvCogs = useMemo(() => sales.reduce((acc, s) => acc + getSaleCost(s), 0), [sales]);
  const osPartsCost = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO')
        .reduce((acc, o) => acc + getOrderPartsCost(o), 0),
    [orders]
  );
  const totalCogs = pdvCogs + osPartsCost;

  const osLaborRevenue = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((acc, o) => acc + (Number(o.laborPrice) || 0), 0),
    [orders]
  );

  const paidExpenses = useMemo(() => expenses.filter((e) => e.status === 'PAGO'), [expenses]);
  const opExpenses = useMemo(() => paidExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [paidExpenses]);

  const grossProfit = grossRevenue - totalCogs;
  const netProfit = grossRevenue - totalCogs - opExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
  const grossMargin = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0;

  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; count: number; items: Expense[] }> = {};
    paidExpenses.forEach((e) => {
      const cat = e.category || 'Outras Despesas';
      if (!grouped[cat]) grouped[cat] = { total: 0, count: 0, items: [] };
      grouped[cat].total += Number(e.amount) || 0;
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
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100%
            </span>
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
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-600 border border-blue-500/30">
              {grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}% da Receita
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Custo dos Produtos e Peças (CMV)</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalCogs)}</span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lucro Bruto: <strong className="text-blue-500">{formatCurrency(grossProfit)} ({grossMargin}%)</strong>
            </span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30">
              {paidExpenses.length} pagamentos
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Despesas Operacionais Pagas</span>
            <span className={`text-2xl font-black mt-0.5 block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(opExpenses)}</span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((opExpenses / grossRevenue) * 100) : 0}% do faturamento bruto</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden group ${isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${netProfit >= 0 ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'}`}>
              <PieChart className="w-6 h-6" />
            </div>
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
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
                    <span className="text-cyan-600 font-black">(+) RECEITA BRUTA TOTAL</span>
                  </td>
                  <td className={`py-3 px-3 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(grossRevenue)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>100%</td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                    <span>Vendas PDV Balcão</span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatCurrency(pdvSales)}</td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((pdvSales / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 pl-8 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <span>Serviços e Mão de Obra OS</span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatCurrency(osLaborRevenue)}</td>
                  <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{grossRevenue > 0 ? Math.round((osLaborRevenue / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
                    <span className="text-rose-600">(-) Custo das Mercadorias e Peças (CMV)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">- {formatCurrency(totalCogs)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">{grossRevenue > 0 ? Math.round((totalCogs / grossRevenue) * 100) : 0}%</td>
                </tr>
                <tr className={`font-bold ${isDark ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>
                  <td className="py-2.5 px-3 pl-6 text-blue-600">(=) LUCRO BRUTO OPERACIONAL</td>
                  <td className="py-2.5 px-3 text-right font-black text-blue-600">{formatCurrency(grossProfit)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-600">{grossMargin}%</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                    <span className="text-amber-600">(-) Despesas Operacionais Pagas</span>
                  </td>
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
                  <td className="py-3.5 px-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-600">(=) RESULTADO LÍQUIDO FINAL</span>
                  </td>
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
              <button onClick={() => onExport('PDF_GERENCIAL')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${isDark ? 'bg-[#3a0d18] text-rose-200 border border-rose-900/80 hover:bg-[#4d1221]' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}>
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Emitir DRE Executivo em PDF</span>
              </button>
              <button onClick={() => onExport('EXCEL_COMPLETO')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${isDark ? 'bg-[#062c1d] text-emerald-200 border border-emerald-900/80 hover:bg-[#0a3a27]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Exportar Balanço para Excel (CSV)</span>
              </button>
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 mt-4 ${isDark ? 'bg-[#0c1c38] border-blue-800/60' : 'bg-slate-50 border-slate-200'}`}>
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-600 block">Dica Financeira</span>
              <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Acompanhe o CMV de perto para garantir que suas margens cubram as despesas operacionais fixas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ABA: VENDAS (PDV DETALHADO)
// ==========================================
const ReportsSalesTab: React.FC<{ sales: Sale[]; onExport: (type: string) => void }> = ({ sales, onExport: _onExport }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesClient = (s.customerName || '').toLowerCase().includes(term);
        const matchesSaleNum = String(s.saleNumber || s.id).includes(term);
        if (!matchesClient && !matchesSaleNum) return false;
      }
      if (selectedPaymentMethod !== 'ALL' && s.paymentMethod !== selectedPaymentMethod) return false;
      return true;
    });
  }, [sales, searchTerm, selectedPaymentMethod]);

  const totalGrossSales = useMemo(() => filteredSales.reduce((sum, s) => sum + getSaleGross(s), 0), [filteredSales]);
  const totalCost = useMemo(() => filteredSales.reduce((sum, s) => sum + getSaleCost(s), 0), [filteredSales]);
  const totalProfit = totalGrossSales - totalCost;
  const totalSalesCount = filteredSales.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Total Bruto PDV</span>
          <p className={`text-2xl font-black mt-2 font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{formatCurrency(totalGrossSales)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-rose-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Custo Total (CMV)</span>
          <p className={`text-2xl font-black mt-2 font-mono ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{formatCurrency(totalCost)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Lucro Bruto PDV</span>
          <p className={`text-2xl font-black mt-2 font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(totalProfit)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Volume & Ticket Médio</span>
          <p className={`text-xl font-black mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalSalesCount} <span className="text-xs text-slate-400 font-normal">vendas • Médio: {formatCurrency(totalSalesCount > 0 ? totalGrossSales / totalSalesCount : 0)}</span>
          </p>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-sm font-bold text-white">Lançamentos do PDV Filtrados</h4>
          <div className="flex items-center gap-2">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="bg-[#081122] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="ALL">Todas as Formas de Pagamento</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
            </select>
            <input
              type="text"
              placeholder="Buscar cliente ou nº..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#081122] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-bold ${isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Nº Venda</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3 text-right">Bruto</th>
                <th className="py-2.5 px-3 text-right">Custo</th>
                <th className="py-2.5 px-3 text-right">Lucro</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {filteredSales.map((sale) => {
                const gross = getSaleGross(sale);
                const cost = getSaleCost(sale);
                const profit = gross - cost;

                return (
                  <tr key={sale.id}>
                    <td className="py-3 px-3 font-sans">{formatDateTime(sale.date || sale.createdAt)}</td>
                    <td className="py-3 px-3 font-bold text-blue-500 font-sans">#{String(sale.saleNumber || sale.id).slice(-6)}</td>
                    <td className="py-3 px-3 font-sans text-white">{sale.customerName || 'Consumidor Final'}</td>
                    <td className="py-3 px-3 font-sans">{getPaymentMethodLabel(sale.paymentMethod)}</td>
                    <td className={`py-3 px-3 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(gross)}</td>
                    <td className="py-3 px-3 text-right text-rose-400">{formatCurrency(cost)}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">{formatCurrency(profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN REPORTS VIEW (COM FILTRO POR DATA E SETORES)
// ==========================================
interface ReportsViewProps {
  onOpenPlans?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPlans: _onOpenPlans }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('GAINS_PDV_OS');
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Inicialização padrão do filtro por data: Mês Atual
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = StorageService.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const allSales = useMemo(() => StorageService.getSales() || [], [tick]);
  const allOrders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const allExpenses = useMemo(() => StorageService.getExpenses() || [], [tick]);
  const allProducts = useMemo(() => StorageService.getProducts() || [], [tick]);

  // Filtragem estrita pelo range de data selecionado
  const filteredSales = useMemo(() => {
    return allSales.filter((s) => isDateInRange(s.date || s.createdAt, startDate, endDate));
  }, [allSales, startDate, endDate]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => isDateInRange(getOrderDate(o), startDate, endDate));
  }, [allOrders, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => isDateInRange(e.dueDate || e.paymentDate || e.date || e.createdAt, startDate, endDate));
  }, [allExpenses, startDate, endDate]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Funções de atalho para datas
  const applyPresetDate = (preset: 'HOJE' | 'SEMANA' | 'ESTE_MES' | 'MES_PASSADO' | 'ULTIMOS_30' | 'ANO_ATUAL' | 'TUDO') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'HOJE') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'SEMANA') {
      const dayOfWeek = now.getDay() || 7; // Segunda = 1
      const mon = new Date(now);
      mon.setDate(now.getDate() - (dayOfWeek - 1));
      setStartDate(mon.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ESTE_MES') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'MES_PASSADO') {
      const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastPrev = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(firstPrev);
      setEndDate(lastPrev);
    } else if (preset === 'ULTIMOS_30') {
      const d30 = new Date(now);
      d30.setDate(now.getDate() - 30);
      setStartDate(d30.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ANO_ATUAL') {
      const firstYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(firstYear);
      setEndDate(todayStr);
    } else if (preset === 'TUDO') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Ações de exportação
  const handleCopySummary = () => {
    const pdvGross = filteredSales.reduce((acc, s) => acc + getSaleGross(s), 0);
    const pdvCost = filteredSales.reduce((acc, s) => acc + getSaleCost(s), 0);
    const pdvProfit = pdvGross - pdvCost;
    const pdvItems = filteredSales.reduce((acc, s) => acc + (s.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0), 0);

    const activeOrders = filteredOrders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO' || (Number(o.paidAmount) > 0));
    const osGross = activeOrders.reduce((acc, o) => acc + getOrderGross(o), 0);
    const osCost = activeOrders.reduce((acc, o) => acc + getOrderPartsCost(o), 0);
    const osProfit = osGross - osCost;
    const osLabor = activeOrders.reduce((acc, o) => acc + (Number(o.laborPrice) || 0), 0);
    const osPartsRev = activeOrders.reduce((acc, o) => acc + (Number(o.partsPrice) || 0), 0);

    const totalGross = pdvGross + osGross;
    const totalCost = pdvCost + osCost;
    const totalProfit = pdvProfit + osProfit;
    const totalMargin = totalGross > 0 ? Math.round((totalProfit / totalGross) * 100) : 0;
    const totalOps = filteredSales.length + activeOrders.length;

    const periodText = startDate && endDate
      ? `${formatDate(startDate)} até ${formatDate(endDate)}`
      : startDate
      ? `A partir de ${formatDate(startDate)}`
      : endDate
      ? `Até ${formatDate(endDate)}`
      : 'Todo o Histórico';

    let text = `📊 *RELATÓRIO FINANCEIRO & GANHOS - PDV & OS*\n`;
    text += `📅 *Período:* ${periodText}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🛒 *1. GANHOS DO PDV (Vendas Balcão)*\n`;
    text += `🟢 *Bruto:* ${formatCurrency(pdvGross)}\n`;
    text += `🔴 *Custo (CMV):* ${formatCurrency(pdvCost)}\n`;
    text += `🔵 *Lucro Líquido:* ${formatCurrency(pdvProfit)} (${pdvGross > 0 ? Math.round((pdvProfit / pdvGross) * 100) : 0}%)\n`;
    text += `📦 *Vendas:* ${filteredSales.length} vendas | ${pdvItems} itens\n`;
    text += `💳 *Ticket Médio:* ${formatCurrency(filteredSales.length > 0 ? pdvGross / filteredSales.length : 0)}\n\n`;

    text += `🔧 *2. GANHOS DAS ORDENS DE SERVIÇO (OS)*\n`;
    text += `🟢 *Bruto:* ${formatCurrency(osGross)}\n`;
    text += `🔴 *Custo Peças:* ${formatCurrency(osCost)}\n`;
    text += `🔵 *Lucro Líquido:* ${formatCurrency(osProfit)} (${osGross > 0 ? Math.round((osProfit / osGross) * 100) : 0}%)\n`;
    text += `🛠️ *Mão de Obra:* ${formatCurrency(osLabor)}\n`;
    text += `⭕ *Peças Cobradas:* ${formatCurrency(osPartsRev)}\n`;
    text += `📋 *OS Concluídas:* ${activeOrders.length} ordens\n`;
    text += `💳 *Ticket Médio:* ${formatCurrency(activeOrders.length > 0 ? osGross / activeOrders.length : 0)}\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏆 *3. SOMA TOTAL CONSOLIDADA (PDV + OS)*\n`;
    text += `💰 *FATURAMENTO BRUTO GERAL:* ${formatCurrency(totalGross)}\n`;
    text += `📉 *CUSTO TOTAL GERAL:* ${formatCurrency(totalCost)}\n`;
    text += `🚀 *LUCRO TOTAL GERAL:* ${formatCurrency(totalProfit)}\n`;
    text += `📊 *MARGEM GLOBAL DE LUCRO:* ${totalMargin}%\n`;
    text += `🎯 *Total de Atendimentos:* ${totalOps} operações\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚡ *Sistema Gestor de Assistência & PDV*`;

    navigator.clipboard.writeText(text);
    showToast('Resumo com emojis copiado com sucesso para o WhatsApp!', 'success');
  };

  const handleExportCsv = () => {
    const pdvGross = filteredSales.reduce((acc, s) => acc + getSaleGross(s), 0);
    const pdvCost = filteredSales.reduce((acc, s) => acc + getSaleCost(s), 0);
    const pdvProfit = pdvGross - pdvCost;

    const activeOrders = filteredOrders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO' || (Number(o.paidAmount) > 0));
    const osGross = activeOrders.reduce((acc, o) => acc + getOrderGross(o), 0);
    const osCost = activeOrders.reduce((acc, o) => acc + getOrderPartsCost(o), 0);
    const osProfit = osGross - osCost;

    const totalGross = pdvGross + osGross;
    const totalCost = pdvCost + osCost;
    const totalProfit = pdvProfit + osProfit;
    const totalMargin = totalGross > 0 ? Math.round((totalProfit / totalGross) * 100) : 0;

    const rows: string[][] = [];
    rows.push(['RELATÓRIO FINANCEIRO & GANHOS - PDV E ORDENS DE SERVIÇO']);
    rows.push([`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`]);
    rows.push([]);

    rows.push(['CONSOLIDAÇÃO GERAL (PDV + OS)']);
    rows.push(['Faturamento Bruto Total', 'Custo Total Geral', 'Lucro Total Geral', 'Margem Global']);
    rows.push([
      totalGross.toFixed(2).replace('.', ','),
      totalCost.toFixed(2).replace('.', ','),
      totalProfit.toFixed(2).replace('.', ','),
      `${totalMargin}%`,
    ]);
    rows.push([]);

    rows.push(['SETOR 1: GANHOS DO PDV (VENDAS)']);
    rows.push(['Bruto PDV', 'Custo PDV', 'Lucro PDV', 'Margem PDV', 'Qtd Vendas']);
    rows.push([
      pdvGross.toFixed(2).replace('.', ','),
      pdvCost.toFixed(2).replace('.', ','),
      pdvProfit.toFixed(2).replace('.', ','),
      `${pdvGross > 0 ? Math.round((pdvProfit / pdvGross) * 100) : 0}%`,
      String(filteredSales.length),
    ]);
    rows.push([]);

    rows.push(['LANÇAMENTOS DO PDV']);
    rows.push(['Data', 'Nº Venda', 'Cliente', 'Pagamento', 'Bruto (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)']);
    filteredSales.forEach((s) => {
      const g = getSaleGross(s);
      const c = getSaleCost(s);
      const p = g - c;
      const m = g > 0 ? Math.round((p / g) * 100) : 0;
      rows.push([
        formatDateTime(s.date || s.createdAt),
        String(s.saleNumber || s.id),
        `"${s.customerName || 'Consumidor Final'}"`,
        getPaymentMethodLabel(s.paymentMethod),
        g.toFixed(2).replace('.', ','),
        c.toFixed(2).replace('.', ','),
        p.toFixed(2).replace('.', ','),
        `${m}%`,
      ]);
    });
    rows.push([]);

    rows.push(['SETOR 2: GANHOS DAS ORDENS DE SERVIÇO (OS)']);
    rows.push(['Bruto OS', 'Custo Peças OS', 'Lucro OS', 'Margem OS', 'Qtd OS']);
    rows.push([
      osGross.toFixed(2).replace('.', ','),
      osCost.toFixed(2).replace('.', ','),
      osProfit.toFixed(2).replace('.', ','),
      `${osGross > 0 ? Math.round((osProfit / osGross) * 100) : 0}%`,
      String(activeOrders.length),
    ]);
    rows.push([]);

    rows.push(['ORDENS DE SERVIÇO']);
    rows.push(['Data', 'Nº OS', 'Cliente', 'Aparelho', 'Serviço', 'Mão de Obra (R$)', 'Peças (R$)', 'Custo Peças (R$)', 'Bruto Total (R$)', 'Lucro OS (R$)', 'Status']);
    activeOrders.forEach((o) => {
      const g = getOrderGross(o);
      const c = getOrderPartsCost(o);
      const p = g - c;
      rows.push([
        formatDate(getOrderDate(o)),
        `#${o.orderNumber || o.id}`,
        `"${o.customerName || 'Cliente'}"`,
        `"${[o.brand, o.model].filter(Boolean).join(' ')}"`,
        `"${o.performedService || o.requestedService || o.clientDefect || 'Serviço'}"`,
        (Number(o.laborPrice) || 0).toFixed(2).replace('.', ','),
        (Number(o.partsPrice) || 0).toFixed(2).replace('.', ','),
        c.toFixed(2).replace('.', ','),
        g.toFixed(2).replace('.', ','),
        p.toFixed(2).replace('.', ','),
        getOrderStatusLabel(o.status),
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_ganhos_pdv_os_${startDate || 'todos'}_a_${endDate || 'hoje'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Planilha Excel (CSV) gerada e baixada com sucesso!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportLegacy = (type: string) => {
    if (type === 'PDF_GERENCIAL') {
      window.print();
    } else {
      handleExportCsv();
    }
  };

  const tabs = [
    { id: 'GAINS_PDV_OS', label: 'Ganhos PDV & OS (Bruto, Custo e Lucro)', icon: DollarSign },
    { id: 'OVERVIEW', label: 'Visão Geral & DRE', icon: BarChart3 },
    { id: 'SALES', label: 'Vendas (PDV)', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200" ref={printRef}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-4">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#09152a] border-blue-900/60 shadow-xl text-white' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-500 shadow-inner">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Relatórios & Análise
            </h2>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ganhos do PDV e Ordens de Serviço (Bruto, Custo e Lucro) com filtro personalizado por data
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shadow-xs cursor-pointer bg-[#0c1c38] hover:bg-slate-800 text-purple-300 border-purple-500/40"
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span>Copiar Resumo</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shadow-xs cursor-pointer bg-[#0c1c38] hover:bg-slate-800 text-blue-300 border-blue-500/40"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE FILTRO POR DATA (DATA INICIAL E ATÉ ONDE / DATA FINAL) */}
      {/* ======================================================== */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md space-y-3.5 ${
          isDark ? 'bg-[#0b162c] border-blue-800/60 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-700/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">
              Filtro de Período Personalizado
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              (Escolha a data inicial e até onde para filtrar PDV e Ordens de Serviço)
            </span>
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Filtro de Data</span>
            </button>
          )}
        </div>

        {/* Inputs de Data Inicial e Data Final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
          {/* Campo Data Inicial */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Data Inicial *</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#081122] border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>

          {/* Campo Data Final */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Data Final (Até Onde) *</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#081122] border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>

          {/* Informação do Período Ativo */}
          <div className="sm:col-span-2 lg:col-span-2 bg-[#081122] p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Registros no Período:</span>
              <span className="font-bold text-emerald-400 font-sans">
                {filteredSales.length} Vendas PDV • {filteredOrders.length} OS
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300">
                {startDate && endDate ? 'Período Ativo' : 'Histórico Todo'}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Atalhos Rápidos de Data */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span className="text-slate-400 font-bold mr-1 text-[10px] uppercase">Atalhos rápidos:</span>
          <button
            type="button"
            onClick={() => applyPresetDate('HOJE')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer border border-slate-700"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('SEMANA')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer border border-slate-700"
          >
            Esta Semana
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('ESTE_MES')}
            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 font-bold transition-all cursor-pointer border border-blue-500/30"
          >
            Este Mês
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('MES_PASSADO')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer border border-slate-700"
          >
            Mês Passado
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('ULTIMOS_30')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer border border-slate-700"
          >
            Últimos 30 Dias
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('ANO_ATUAL')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer border border-slate-700"
          >
            Ano Atual
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('TUDO')}
            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 font-bold transition-all cursor-pointer border border-purple-500/30"
          >
            Todo o Histórico
          </button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                  : isDark
                  ? 'bg-[#09152a] text-slate-400 hover:text-slate-200 border border-blue-900/50'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'GAINS_PDV_OS' && (
        <GainsPdvOsTab
          sales={filteredSales}
          orders={filteredOrders}
          startDate={startDate}
          endDate={endDate}
          onExportCsv={handleExportCsv}
          onCopySummary={handleCopySummary}
          onPrint={handlePrint}
        />
      )}

      {activeTab === 'OVERVIEW' && (
        <ReportsOverviewTab
          sales={filteredSales}
          orders={filteredOrders}
          expenses={filteredExpenses}
          products={allProducts}
          onExport={handleExportLegacy}
        />
      )}

      {activeTab === 'SALES' && (
        <ReportsSalesTab
          sales={filteredSales}
          onExport={handleExportLegacy}
        />
      )}
    </div>
  );
};
