import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  Filter,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ArrowUpRight,
  Layers,
  ChevronDown,
  Barcode,
  Check,
} from 'lucide-react';
import { Purchase, Product, Supplier } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface PurchasesViewProps {
  onOpenNewProduct?: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ onOpenNewProduct }) => {
  const { isDark } = useTheme();

  // State
  const [, setTick] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'LOTES' | 'ITENS'>('LOTES');
  const [searchQuery, setSearchQuery] = useState('');

  // Date filter state (Default: Este Mês)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [datePreset, setDatePreset] = useState<'HOJE' | '7DIAS' | 'MES' | '30DIAS' | 'TODOS'>('MES');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Data from Storage
  const purchases = StorageService.getPurchases();
  const products = StorageService.getProducts();

  // Quick Date Preset Handlers
  const handleApplyPreset = (preset: 'HOJE' | '7DIAS' | 'MES' | '30DIAS' | 'TODOS') => {
    setDatePreset(preset);
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    if (preset === 'HOJE') {
      setStartDate(todayFormatted);
      setEndDate(todayFormatted);
    } else if (preset === '7DIAS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayFormatted);
    } else if (preset === 'MES') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayFormatted);
    } else if (preset === '30DIAS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayFormatted);
    } else if (preset === 'TODOS') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter Purchases by Date Range & Search
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Date filter
      if (startDate) {
        const pDate = p.date ? p.date.substring(0, 10) : '';
        if (pDate < startDate) return false;
      }
      if (endDate) {
        const pDate = p.date ? p.date.substring(0, 10) : '';
        if (pDate > endDate) return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSupplier = (p.supplier || p.supplierName || '').toLowerCase().includes(q);
        const matchInvoice = (p.invoiceNumber || '').toLowerCase().includes(q);
        const matchUser = (p.userName || '').toLowerCase().includes(q);
        const matchItem = p.items.some((i) => (i.productName || '').toLowerCase().includes(q));
        return matchSupplier || matchInvoice || matchUser || matchItem;
      }

      return true;
    });
  }, [purchases, startDate, endDate, searchQuery]);

  // Expanded list of all individual product items in filtered range
  const filteredItemMovements = useMemo(() => {
    const list: {
      id: string;
      purchaseId: string;
      date: string;
      invoiceNumber: string;
      supplier: string;
      userName: string;
      productId: string;
      productName: string;
      category?: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[] = [];

    filteredPurchases.forEach((p) => {
      p.items.forEach((item, idx) => {
        list.push({
          id: `${p.id}-item-${idx}`,
          purchaseId: p.id,
          date: p.date,
          invoiceNumber: p.invoiceNumber,
          supplier: p.supplier || p.supplierName || 'Fornecedor Diversos',
          userName: p.userName,
          productId: item.productId,
          productName: item.productName || 'Produto',
          category: item.category,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost || item.quantity * item.unitCost,
        });
      });
    });

    return list;
  }, [filteredPurchases]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalAmountInvested = filteredPurchases.reduce((acc, p) => acc + (p.totalAmount || p.total || 0), 0);
    const totalItemsAdded = filteredItemMovements.reduce((acc, i) => acc + i.quantity, 0);
    const totalEntriesCount = filteredPurchases.length;
    const uniqueSuppliersCount = new Set(filteredPurchases.map((p) => p.supplier || p.supplierName)).size;

    return {
      totalAmountInvested,
      totalItemsAdded,
      totalEntriesCount,
      uniqueSuppliersCount,
    };
  }, [filteredPurchases, filteredItemMovements]);

  // Delete Purchase Handler
  const handleDeletePurchase = (id: string) => {
    StorageService.deletePurchase(id);
    setDeleteConfirmId(null);
    if (selectedPurchase?.id === id) {
      setSelectedPurchase(null);
    }
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${
              isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700'
            }`}>
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Entrada de Estoque & Compras
              </h1>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Registre novidades no estoque e consulte todo o histórico de alimentação por período
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenNewProduct && (
            <button
              type="button"
              onClick={onOpenNewProduct}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
              }`}
            >
              <Package className="w-4 h-4 text-cyan-500" />
              <span>Novo Produto</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lançar Entrada de Estoque</span>
          </button>
        </div>
      </div>

      {/* Date Filters & Quick Presets Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold mr-1 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Período:
            </span>

            {[
              { id: 'HOJE', label: 'Hoje' },
              { id: '7DIAS', label: 'Últimos 7 dias' },
              { id: 'MES', label: 'Este Mês' },
              { id: '30DIAS', label: '30 dias' },
              { id: 'TODOS', label: 'Todos' },
            ].map((preset) => {
              const active = datePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'bg-amber-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs & Text Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('' as any);
                  }}
                  className={`pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                    isDark
                      ? 'bg-[#0f1a36] border-slate-700 text-slate-200 focus:border-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-600'
                  }`}
                  title="Data Inicial"
                />
              </div>

              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>até</span>

              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('' as any);
                  }}
                  className={`pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                    isDark
                      ? 'bg-[#0f1a36] border-slate-700 text-slate-200 focus:border-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-600'
                  }`}
                  title="Data Final"
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className={`w-4 h-4 absolute left-3 top-2.5 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Buscar fornecedor, produto, NF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                  isDark
                    ? 'bg-[#0f1a36] border-slate-700 text-slate-200 focus:border-amber-500 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-600 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Valor Alimentado */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c152e] to-[#070d1d] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            : 'bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-amber-400' : 'text-amber-800'
            }`}>
              Valor Alimentado no Estoque
            </span>
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            isDark ? 'text-amber-300' : 'text-amber-900'
          }`}>
            {formatCurrency(metrics.totalAmountInvested)}
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Total investido no período selecionado
          </p>
        </div>

        {/* Metric 2: Peças Adicionadas */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c152e] to-[#070d1d] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            : 'bg-gradient-to-br from-emerald-50 to-teal-50/40 border-emerald-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-emerald-400' : 'text-emerald-800'
            }`}>
              Peças / Unidades Adicionadas
            </span>
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            isDark ? 'text-emerald-300' : 'text-emerald-900'
          }`}>
            +{metrics.totalItemsAdded} <span className="text-xs font-normal">unidades</span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Soma de novos itens no estoque
          </p>
        </div>

        {/* Metric 3: Lotes / Entradas */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c152e] to-[#070d1d] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-blue-400' : 'text-blue-800'
            }`}>
              Lotes de Entrada / NFs
            </span>
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            isDark ? 'text-blue-300' : 'text-blue-900'
          }`}>
            {metrics.totalEntriesCount} <span className="text-xs font-normal">registros</span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Notas fiscais / compras efetuadas
          </p>
        </div>

        {/* Metric 4: Fornecedores */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c152e] to-[#070d1d] border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
            : 'bg-gradient-to-br from-purple-50 to-pink-50/40 border-purple-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-purple-400' : 'text-purple-800'
            }`}>
              Fornecedores Utilizados
            </span>
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            isDark ? 'text-purple-300' : 'text-purple-900'
          }`}>
            {metrics.uniqueSuppliersCount} <span className="text-xs font-normal">fornecedores</span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Origens distintas das mercadorias
          </p>
        </div>
      </div>

      {/* View Mode Toggle Tabs (Lotes de Entrada vs Item por Item) */}
      <div className="flex items-center justify-between border-b pb-2 border-slate-700/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('LOTES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'LOTES'
                ? isDark
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-amber-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lotes de Entrada ({filteredPurchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ITENS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'ITENS'
                ? isDark
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-amber-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Produtos Alimentados ({filteredItemMovements.length})</span>
          </button>
        </div>

        <div className={`text-xs font-medium hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Mostrando histórico do período
        </div>
      </div>

      {/* Main Table Content */}
      {activeSubTab === 'LOTES' ? (
        /* TAB 1: LOTES DE ENTRADA */
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <th className="py-3.5 px-4">Data & Hora</th>
                  <th className="py-3.5 px-4">Nota Fiscal / Ref</th>
                  <th className="py-3.5 px-4">Fornecedor</th>
                  <th className="py-3.5 px-4">Itens / Peças</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Truck className={`w-10 h-10 mx-auto mb-2 opacity-30 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                      <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nenhuma entrada de estoque encontrada no período selecionado.
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Altere os filtros de data acima ou clique em "+ Lançar Entrada de Estoque" para registrar.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => {
                    const totalItemsCount = purchase.items.reduce((acc, i) => acc + i.quantity, 0);

                    return (
                      <tr
                        key={purchase.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Data */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500/80" />
                            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                              {formatDate(purchase.date)}
                            </span>
                          </div>
                        </td>

                        {/* NF */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isDark
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            NF #{purchase.invoiceNumber || 'S/N'}
                          </span>
                        </td>

                        {/* Fornecedor */}
                        <td className="py-3.5 px-4 font-semibold">
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                              {purchase.supplier || purchase.supplierName || 'Fornecedor Vários'}
                            </span>
                          </div>
                        </td>

                        {/* Itens */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              +{totalItemsCount} un
                            </span>
                            <span className={`text-[11px] truncate max-w-[180px] ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              ({purchase.items.length} tipo{purchase.items.length > 1 ? 's' : ''})
                            </span>
                          </div>
                        </td>

                        {/* Valor Total */}
                        <td className="py-3.5 px-4 text-right font-bold text-sm">
                          <span className={isDark ? 'text-amber-300' : 'text-amber-900'}>
                            {formatCurrency(purchase.totalAmount || purchase.total || 0)}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <User className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                              {purchase.userName || 'Sistema'}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPurchase(purchase)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300'
                                  : 'bg-slate-100 text-cyan-700 hover:bg-slate-200'
                              }`}
                              title="Ver Detalhes do Lote"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(purchase.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                              title="Excluir do Histórico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: PRODUTOS ALIMENTADOS (ITEM A ITEM) */
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Produto Alimentado</th>
                  <th className="py-3.5 px-4 text-center">Qtd Adicionada</th>
                  <th className="py-3.5 px-4 text-right">Custo Unitário</th>
                  <th className="py-3.5 px-4 text-right">Custo Total</th>
                  <th className="py-3.5 px-4">Fornecedor / NF</th>
                  <th className="py-3.5 px-4">Registrado por</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredItemMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Layers className={`w-10 h-10 mx-auto mb-2 opacity-30 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                      <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nenhum item alimentado encontrado no período selecionado.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItemMovements.map((mov) => {
                    const matchedProd = products.find((p) => p.id === mov.productId);

                    return (
                      <tr
                        key={mov.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Data */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {formatDate(mov.date)}
                        </td>

                        {/* Produto */}
                        <td className="py-3.5 px-4 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <span className={`block font-bold leading-tight ${
                                isDark ? 'text-slate-100' : 'text-slate-900'
                              }`}>
                                {mov.productName}
                              </span>
                              <span className={`text-[10px] block ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                {matchedProd?.brand ? `${matchedProd.brand} • ` : ''}
                                {mov.category || matchedProd?.category || 'Geral'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Quantidade em Badge Verde */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] whitespace-nowrap">
                            +{mov.quantity} un
                          </span>
                        </td>

                        {/* Custo Unitario */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          {formatCurrency(mov.unitCost)}
                        </td>

                        {/* Custo Total */}
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                          {formatCurrency(mov.totalCost)}
                        </td>

                        {/* Fornecedor & NF */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className={`block font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {mov.supplier}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              NF #{mov.invoiceNumber || 'S/N'}
                            </span>
                          </div>
                        </td>

                        {/* Registrado por */}
                        <td className="py-3.5 px-4">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                            {mov.userName || 'Sistema'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: LANÇAR NOVA ENTRADA DE ESTOQUE */}
      {isNewModalOpen && (
        <NewPurchaseModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false);
            setTick((t) => t + 1);
          }}
          products={products}
          onOpenNewProduct={onOpenNewProduct}
        />
      )}

      {/* MODAL 2: VER DETALHES DA COMPRA / LOTE */}
      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}

      {/* MODAL 3: CONFIRMAR EXCLUSÃO DA COMPRA */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${
            isDark ? 'bg-[#0d162d] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Confirmar Remoção do Registro?</h3>
                <p className="text-xs text-slate-400">Esta ação excluirá o registro de entrada do histórico.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePurchase(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* COMPONENTE INTERNO: MODAL PARA NOVO LANÇAMENTO DE ENTRADA */
interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  onOpenNewProduct?: () => void;
}

const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  onOpenNewProduct,
}) => {
  const { isDark } = useTheme();

  // Form Header State
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  // Item Selector / Search State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);
  const [itemSellingPrice, setItemSellingPrice] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const unitCostInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Cart / Items List for this Purchase
  const [items, setItems] = useState<
    {
      productId: string;
      productName: string;
      category?: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      suggestedSellingPrice?: number;
    }[]
  >([]);

  // Focus search input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by search term (Name, Barcode, SKU, Category, Brand)
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [products, searchTerm]);

  // Selected Product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Select Product Handler
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setSearchTerm(prod.name);
    setIsSearchOpen(false);
    setItemUnitCost(prod.costPrice || 0);
    setItemSellingPrice(prod.sellingPrice || 0);

    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  // Keyboard Navigation / Barcode Scanner Enter Handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchTerm.trim()) return;

      const q = searchTerm.trim().toLowerCase();
      // Search for exact barcode or SKU first
      const exactMatch =
        products.find(
          (p) =>
            (p.barcode && p.barcode.trim().toLowerCase() === q) ||
            (p.sku && p.sku.trim().toLowerCase() === q)
        ) || filteredProducts[0];

      if (exactMatch) {
        handleSelectProduct(exactMatch);
      }
    }
  };

  // Clear selected product
  const handleClearSelection = () => {
    setSelectedProductId('');
    setSearchTerm('');
    setIsSearchOpen(true);
    setItemUnitCost(0);
    setItemSellingPrice(0);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Add Item to Purchase Cart
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    if (itemQuantity <= 0) return;

    const totalCost = Number((itemQuantity * itemUnitCost).toFixed(2));

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        quantity: itemQuantity,
        unitCost: itemUnitCost,
        totalCost,
        suggestedSellingPrice: itemSellingPrice,
      },
    ]);

    // Reset item selector fields & refocus search input for immediate next entry!
    setSelectedProductId('');
    setSearchTerm('');
    setItemQuantity(1);
    setItemUnitCost(0);
    setItemSellingPrice(0);
    setIsSearchOpen(true);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Remove Item from Cart
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate Total Purchase Amount
  const totalAmount = items.reduce((acc, i) => acc + i.totalCost, 0);

  // Submit Purchase
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Por favor, adicione pelo menos 1 produto à entrada de estoque.');
      return;
    }

    StorageService.addPurchase({
      supplier: supplier || 'Fornecedor Diversos',
      supplierName: supplier || 'Fornecedor Diversos',
      invoiceNumber: invoiceNumber || `${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(purchaseDate).toISOString(),
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        category: i.category,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalCost: i.totalCost,
      })),
      totalAmount,
      total: totalAmount,
      status: 'Recebida',
      notes,
    });

    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className={`w-full max-w-3xl my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-[#0a1124] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Lançar Nova Entrada de Estoque</h2>
              <p className="text-xs text-slate-400">Adicione novos itens ao estoque e atualize o custo do produto em tempo real</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Nota Fiscal & Fornecedor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Fornecedor / Distribuidor</label>
              <input
                type="text"
                placeholder="Ex: Inova Celulares, Apple SP"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#0f1a36] border-slate-700 text-slate-100 focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nº Nota Fiscal / Ref</label>
              <input
                type="text"
                placeholder="Ex: NF 10425 ou Entrada #99"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#0f1a36] border-slate-700 text-slate-100 focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Data da Entrada</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#0f1a36] border-slate-700 text-slate-100 focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
                required
              />
            </div>
          </div>

          {/* Section 2: Adicionar Produto ao Lote */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0d162d] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Buscar Produto (Nome ou Código de Barras)
              </h3>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Trocar Produto
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Integrated Search Box for Name or Barcode */}
              <div className="sm:col-span-5 relative" ref={searchDropdownRef}>
                <label className="block text-[11px] font-bold mb-1 flex items-center justify-between">
                  <span>Buscar por Nome / Barcode</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Foco Automático</span>
                </label>

                <div className="relative flex items-center">
                  <Search className={`w-4 h-4 absolute left-3 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Digite o nome ou bipe o código..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsSearchOpen(true);
                      if (selectedProductId) {
                        setSelectedProductId('');
                      }
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs border outline-none font-medium transition-all ${
                      selectedProduct
                        ? isDark
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : isDark
                        ? 'bg-[#0f1a36] border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                    }`}
                  />
                  <Barcode className={`w-4 h-4 absolute right-3 pointer-events-none ${selectedProduct ? 'text-emerald-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>

                {/* Dropdown with live search results */}
                {isSearchOpen && (
                  <div className={`absolute z-30 left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-2xl overflow-hidden max-h-60 overflow-y-auto ${
                    isDark ? 'bg-[#0d162d] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      <span>Produtos Encontrados ({filteredProducts.length})</span>
                      <span>Pressione Enter</span>
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-400 mb-2">Nenhum produto encontrado com "{searchTerm}".</p>
                        {onOpenNewProduct && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              onOpenNewProduct();
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Cadastrar Novo Produto</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/50">
                        {filteredProducts.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleSelectProduct(prod)}
                            className={`w-full text-left p-2.5 transition-colors cursor-pointer flex items-center justify-between group ${
                              selectedProductId === prod.id
                                ? 'bg-amber-500/20 text-amber-300'
                                : isDark
                                ? 'hover:bg-slate-800/80'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-xs truncate group-hover:text-amber-400 transition-colors">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                {prod.barcode && (
                                  <span className="font-mono bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700">
                                    {prod.barcode}
                                  </span>
                                )}
                                {prod.category && <span>{prod.category}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`block font-bold text-xs ${prod.stockQuantity <= (prod.minStockQuantity || 2) ? 'text-amber-400' : 'text-emerald-400'}`}>
                                Estoque: {prod.stockQuantity} un
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Custo: {formatCurrency(prod.costPrice || 0)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold mb-1">Qtd (+)</label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-bold text-center ${
                    isDark ? 'bg-[#0f1a36] border-slate-700 text-emerald-400 focus:border-emerald-500' : 'bg-white border-slate-300 text-emerald-700 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Unit Cost */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold mb-1">Custo Un (R$)</label>
                <input
                  ref={unitCostInputRef}
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemUnitCost}
                  onChange={(e) => setItemUnitCost(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-bold ${
                    isDark ? 'bg-[#0f1a36] border-slate-700 text-amber-300 focus:border-amber-500' : 'bg-white border-slate-300 text-amber-900 focus:border-amber-600'
                  }`}
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar ao Lote</span>
                </button>
              </div>
            </div>

            {/* Selected product highlight banner */}
            {selectedProduct && (
              <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">{selectedProduct.name}</span>
                    <span className="ml-2 text-[11px] opacity-80">
                      (Estoque Atual: {selectedProduct.stockQuantity} un • {selectedProduct.barcode ? `Cód: ${selectedProduct.barcode}` : 'Sem código'})
                    </span>
                  </div>
                </div>
                <div className="font-bold font-mono text-xs">
                  Custo Cadastrado: {formatCurrency(selectedProduct.costPrice || 0)}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Itens no Lote */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens neste Lote ({items.length})
              </h3>
              <span className="text-sm font-black text-amber-400">
                Total da Entrada: {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#0f1a36] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase text-[10px] ${
                    isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3 text-center">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Custo Un</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                        Nenhum produto adicionado ainda. Selecione acima para incluir.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold">{item.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                          +{item.quantity} un
                        </td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitCost)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                          {formatCurrency(item.totalCost)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Observações */}
          <div>
            <label className="block text-xs font-bold mb-1">Observações do Lote</label>
            <textarea
              rows={2}
              placeholder="Ex: Lote recebido em perfeito estado via transportadora XYZ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                isDark ? 'bg-[#0f1a36] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={items.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir e Alimentar Estoque ({formatCurrency(totalAmount)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* COMPONENTE INTERNO: MODAL DE DETALHES DA COMPRA */
interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
}

const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({ purchase, onClose }) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className={`w-full max-w-2xl my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0a1124] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">Detalhes da Entrada de Estoque</h2>
              <p className="text-xs text-slate-400">
                NF #{purchase.invoiceNumber || 'S/N'} • {formatDate(purchase.date)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0f1a36] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Fornecedor</span>
              <span className="font-bold text-sm">{purchase.supplier || purchase.supplierName}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0f1a36] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Registrado por</span>
              <span className="font-bold">{purchase.userName || 'Sistema'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0f1a36] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Valor Total</span>
              <span className="font-black text-amber-400 text-sm">
                {formatCurrency(purchase.totalAmount || purchase.total || 0)}
              </span>
            </div>
          </div>

          {/* Itemized list */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              Produtos Alimentados neste Lote ({purchase.items.length})
            </h3>

            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#0f1a36] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase text-[10px] ${
                    isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3 text-center">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Custo Un</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {purchase.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold">{item.productName}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                        +{item.quantity} un
                      </td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitCost)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                        {formatCurrency(item.totalCost || item.quantity * item.unitCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {purchase.notes && (
            <div className={`p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[#0f1a36] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="font-bold block text-[10px] text-slate-400 uppercase">Observações</span>
              {purchase.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
