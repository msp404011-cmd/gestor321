import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Printer,
  Calendar,
  DollarSign,
  User,
  Clock,
  X,
  FileText,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShoppingCart,
  Receipt,
  MessageCircle,
  Tag,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Sale, Product } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate, cleanPhoneForWhatsApp } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { PosReceiptModal, PrintPaperFormat } from './PosReceiptModal';

interface PosSalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSaleToCart?: (sale: Sale) => void;
}

type PeriodFilter = 'TODOS' | 'HOJE' | 'SETE_DIAS' | 'ESTE_MES' | 'TRES_MESES' | 'SEIS_MESES' | 'DOZE_MESES' | 'CUSTOM';

export const PosSalesHistoryModal: React.FC<PosSalesHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadSaleToCart,
}) => {
  const { isDark } = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('TODOS');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('TODOS');

  // Selected sale for detail inspection ("Puxar Venda")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Printing sub-modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [printFormat, setPrintFormat] = useState<PrintPaperFormat>('80mm');

  // Retention stats and feedback
  const [retentionStats, setRetentionStats] = useState(() => StorageService.getSalesRetentionStats());
  const [retentionMessage, setRetentionMessage] = useState<string | null>(null);

  const company = StorageService.getCompanySettings();

  // Load sales and execute auto-retention policy
  const loadSalesData = () => {
    // Run retention cleanup to ensure >12 months oldest month is purged
    try {
      const cleanResult = StorageService.cleanExpiredSales();
      if (cleanResult.deletedCount > 0) {
        setRetentionMessage(`Retenção de 12 meses: Mês ${cleanResult.deletedMonth} foi arquivado (${cleanResult.deletedCount} vendas expurgadas).`);
      }
    } catch (e) {
      console.warn('Retention check warning:', e);
    }

    const list = StorageService.getSales();
    setSales(list);
    setRetentionStats(StorageService.getSalesRetentionStats());

    // Auto-select latest sale if available and none selected
    if (list.length > 0 && !selectedSale) {
      setSelectedSale(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSalesData();
    }
  }, [isOpen]);

  // Handle manual retention check
  const handleManualRetentionCheck = () => {
    const result = StorageService.cleanExpiredSales();
    loadSalesData();
    if (result.deletedCount > 0) {
      alert(`Política de Retenção Aplicada:\nO mês mais antigo (${result.deletedMonth}) foi expurgado com ${result.deletedCount} vendas.\nRestam ${result.remainingCount} vendas armazenadas nos últimos 12 meses.`);
    } else {
      alert('Todas as vendas armazenadas estão dentro do período de retenção de 12 meses! Nenhuma exclusão necessária.');
    }
  };

  // Filter sales
  const filteredSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date || sale.createdAt || '');

      // 1. Period filter
      if (selectedPeriod === 'HOJE') {
        const todayStr = now.toISOString().slice(0, 10);
        const saleDateStr = !isNaN(saleDate.getTime()) ? saleDate.toISOString().slice(0, 10) : '';
        if (saleDateStr !== todayStr) return false;
      } else if (selectedPeriod === 'SETE_DIAS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < sevenDaysAgo) return false;
      } else if (selectedPeriod === 'ESTE_MES') {
        if (
          saleDate.getFullYear() !== now.getFullYear() ||
          saleDate.getMonth() !== now.getMonth()
        ) {
          return false;
        }
      } else if (selectedPeriod === 'TRES_MESES') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (saleDate < threeMonthsAgo) return false;
      } else if (selectedPeriod === 'SEIS_MESES') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (saleDate < sixMonthsAgo) return false;
      } else if (selectedPeriod === 'DOZE_MESES') {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        if (saleDate < twelveMonthsAgo) return false;
      } else if (selectedPeriod === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate + 'T00:00:00');
          if (saleDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + 'T23:59:59');
          if (saleDate > end) return false;
        }
      }

      // 2. Payment Method filter
      if (selectedPaymentMethod !== 'TODOS') {
        if (sale.paymentMethod !== selectedPaymentMethod) return false;
      }

      // 3. Search query
      if (query) {
        const matchNumber = String(sale.saleNumber).includes(query);
        const matchCustomer = (sale.customerName || '').toLowerCase().includes(query);
        const matchSeller = (sale.sellerName || '').toLowerCase().includes(query);
        const matchPayment = (sale.paymentMethod || '').toLowerCase().includes(query);
        const matchItem = sale.items?.some(
          (it) =>
            it.productName?.toLowerCase().includes(query) ||
            it.barcode?.toLowerCase().includes(query)
        );

        if (!matchNumber && !matchCustomer && !matchSeller && !matchPayment && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, selectedPeriod, customStartDate, customEndDate, selectedPaymentMethod]);

  // Aggregate metrics
  const totalPeriodAmount = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [filteredSales]);

  const averageTicket = useMemo(() => {
    if (filteredSales.length === 0) return 0;
    return totalPeriodAmount / filteredSales.length;
  }, [filteredSales, totalPeriodAmount]);

  // Handlers for printing
  const handleOpenPrint = (sale: Sale, format: PrintPaperFormat = '80mm') => {
    setSaleToPrint(sale);
    setPrintFormat(format);
    setIsReceiptModalOpen(true);
  };

  const handleSendWhatsApp = (sale: Sale) => {
    let text = `*COMPROVANTE DE VENDA - ${company.name.toUpperCase()}*\n`;
    text += `*Venda:* #${sale.saleNumber}\n`;
    text += `*Data:* ${formatDate(sale.date)}\n`;
    text += `*Cliente:* ${sale.customerName}\n`;
    text += `*Vendedor:* ${sale.sellerName}\n`;
    text += `--------------------------------\n`;
    text += `*ITENS:*\n`;
    sale.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.productName} (${it.quantity}x ${formatCurrency(it.unitPrice)}) = ${formatCurrency(it.total)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*Subtotal:* ${formatCurrency(sale.subtotal)}\n`;
    if (sale.discount > 0) {
      text += `*Desconto:* -${formatCurrency(sale.discount)}\n`;
    }
    text += `*TOTAL:* ${formatCurrency(sale.total)}\n`;
    text += `*Forma de Pagamento:* ${sale.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `Agradecemos a preferência!\n`;
    text += `${company.phone ? 'Contato: ' + company.phone : ''}`;

    const customers = StorageService.getCustomers();
    const customer = customers.find((c) => c.id === sale.customerId || c.name === sale.customerName);
    const cleanPhone = cleanPhoneForWhatsApp(customer?.phone || (sale as any).customerPhone);

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    }
  };

  const handlePullSaleToCart = (sale: Sale) => {
    if (!onLoadSaleToCart) return;
    const confirmLoad = window.confirm(
      `Deseja carregar os itens da Venda #${sale.saleNumber} (${sale.items.length} itens) no carrinho do PDV atual?`
    );
    if (confirmLoad) {
      onLoadSaleToCart(sale);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-6xl h-[92vh] max-h-[850px] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-[#081225] border-blue-900/60 text-slate-100 shadow-[0_0_40px_rgba(0,180,216,0.15)]'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div
          className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'bg-[#050c1b] border-blue-900/60' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                  Histórico de Vendas (PDV)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {sales.length} Vendas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Consulte vendas anteriores, puxe itens e reimprima comprovantes fiscais/térmicos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 12-Month Retention Info Pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-help ${
                isDark
                  ? 'bg-blue-950/50 border-blue-800 text-cyan-300'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
              title="Política de retenção: os dados são guardados por até 12 meses. Ao completar 12 meses, somente o mês mais antigo é expurgado automaticamente, mantendo 12 meses de histórico intactos."
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Retenção 12 Meses Ativa</span>
            </div>

            <button
              type="button"
              onClick={handleManualRetentionCheck}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isDark
                  ? 'bg-[#09152e] hover:bg-blue-900/60 border-blue-900/80 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Verificar e executar retenção de 12 meses"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[10px]">Verificar Retenção</span>
            </button>

            <button
              type="button"
              id="btn-close-sales-history"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. FILTER & SEARCH BAR */}
        <div
          className={`p-3 border-b shrink-0 flex flex-col gap-2.5 ${
            isDark ? 'bg-[#070f21] border-blue-900/40' : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Nº da Venda (#501), cliente, vendedor, produto..."
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border transition-all outline-none ${
                  isDark
                    ? 'bg-[#050b18] border-blue-900/80 text-white placeholder:text-slate-500 focus:border-cyan-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="w-full sm:w-48 shrink-0">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#050b18] border-blue-900/80 text-cyan-300 focus:border-cyan-400'
                    : 'bg-white border-slate-300 text-slate-800 focus:border-cyan-500'
                }`}
              >
                <option value="TODOS">Forma: Todas</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                <option value="FIADO">Fiado (Crediário)</option>
                <option value="BOLETO">Boleto</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          {/* Period Tabs & Metrics row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-900/20">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'TODOS', label: 'Todos (12m)' },
                { id: 'HOJE', label: 'Hoje' },
                { id: 'SETE_DIAS', label: '7 Dias' },
                { id: 'ESTE_MES', label: 'Este Mês' },
                { id: 'TRES_MESES', label: '3 Meses' },
                { id: 'SEIS_MESES', label: '6 Meses' },
                { id: 'DOZE_MESES', label: '12 Meses' },
                { id: 'CUSTOM', label: 'Personalizado' },
              ].map((tab) => {
                const isActive = selectedPeriod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedPeriod(tab.id as PeriodFilter)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : isDark
                        ? 'bg-[#0a162e] hover:bg-blue-900/60 text-slate-300 border border-blue-900/50'
                        : 'bg-slate-200/70 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Mini summary badges */}
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 text-slate-400">
                <span>Vendas:</span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredSales.length}</strong>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span>Total:</span>
                <strong className="text-emerald-400 font-black">{formatCurrency(totalPeriodAmount)}</strong>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-slate-400">
                <span>Ticket Médio:</span>
                <strong className="text-cyan-300 font-bold">{formatCurrency(averageTicket)}</strong>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker when selected */}
          {selectedPeriod === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-900/30 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] font-bold text-slate-400">De:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    isDark ? 'bg-[#050b18] border-blue-900 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] font-bold text-slate-400">Até:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    isDark ? 'bg-[#050b18] border-blue-900 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-[10px] text-cyan-400 hover:underline font-bold"
                >
                  Limpar datas
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. MAIN BODY: MASTER-DETAIL SPLIT */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Sales List */}
          <div
            className={`w-full md:w-5/12 lg:w-4/12 border-r flex flex-col min-h-0 ${
              isDark ? 'bg-[#060e1d] border-blue-900/50' : 'bg-slate-50/50 border-slate-200'
            }`}
          >
            <div className="px-3 py-2 border-b border-blue-900/30 flex items-center justify-between text-[11px] text-slate-400 font-bold shrink-0">
              <span>{filteredSales.length} Venda(s) Encontrada(s)</span>
              <span className="text-[10px] font-mono text-cyan-400">Mais recente no topo</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredSales.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Receipt className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-60" />
                  <p className="text-xs font-bold text-slate-400">Nenhuma venda encontrada</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tente alterar os termos da busca ou selecione outro período de datas.
                  </p>
                </div>
              ) : (
                filteredSales.map((sale) => {
                  const isSelected = selectedSale?.id === sale.id;
                  const itemsCount = sale.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0;

                  return (
                    <div
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? isDark
                            ? 'bg-gradient-to-r from-blue-950 to-[#0c1f44] border-cyan-400 shadow-md shadow-cyan-950/40'
                            : 'bg-blue-50 border-cyan-500 shadow-sm'
                          : isDark
                          ? 'bg-[#081329] hover:bg-[#0c1c3d] border-blue-900/40 text-slate-200'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded font-mono font-black text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            #{sale.saleNumber || '---'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(sale.date || sale.createdAt)}
                          </span>
                        </div>
                        <span className="font-black text-xs sm:text-sm text-emerald-400">
                          {formatCurrency(sale.total)}
                        </span>
                      </div>

                      <div className="mt-1.5">
                        <p className="text-xs font-bold text-white truncate">
                          {sale.customerName || 'CLIENTE PADRÃO'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>
                            Vend: <strong className="text-slate-300">{sale.sellerName || 'Operador'}</strong>
                          </span>
                          <span>{itemsCount} un ({sale.items?.length || 0} itens)</span>
                        </div>
                      </div>

                      {/* Payment method tag & quick actions */}
                      <div className="mt-2 pt-1.5 border-t border-blue-900/30 flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-300 border border-blue-500/20 truncate max-w-[130px]">
                          {sale.paymentMethod}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrint(sale, '80mm');
                            }}
                            className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors"
                            title="Reimprimir Comprovante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-black text-cyan-400 flex items-center">
                            Puxar <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Detailed Sale Viewer ("Puxar Venda") */}
          <div
            className={`w-full md:w-7/12 lg:w-8/12 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-5 ${
              isDark ? 'bg-[#081225]' : 'bg-white'
            }`}
          >
            {selectedSale ? (
              <div className="flex flex-col h-full space-y-4">
                
                {/* Header of selected sale */}
                <div
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-[#050c1a] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-sm font-black font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Venda #{selectedSale.saleNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Finalizada
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formatDate(selectedSale.date || selectedSale.createdAt)}</span>
                      <span>•</span>
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Vendedor: <strong>{selectedSale.sellerName}</strong></span>
                    </p>
                  </div>

                  {/* Top quick action buttons */}
                  <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      id="btn-reprint-receipt"
                      onClick={() => handleOpenPrint(selectedSale, '80mm')}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Reimprimir Comprovante</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(selectedSale)}
                      className="px-2.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Enviar pelo WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden lg:inline">WhatsApp</span>
                    </button>

                    {onLoadSaleToCart && (
                      <button
                        type="button"
                        onClick={() => handlePullSaleToCart(selectedSale)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          isDark
                            ? 'bg-[#0a1733] hover:bg-blue-900 border-blue-800 text-cyan-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        }`}
                        title="Carregar itens desta venda no carrinho do PDV"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="hidden lg:inline">Puxar para PDV</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer & Payment details block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-[#050c1a]/80 border-blue-900/40' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Cliente da Venda
                    </span>
                    <p className="text-sm font-bold text-white">
                      {selectedSale.customerName || 'CLIENTE PADRÃO (BALCÃO)'}
                    </p>
                    {selectedSale.priceTable && (
                      <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                        Tabela de Preço: {selectedSale.priceTable}
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-[#050c1a]/80 border-blue-900/40' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Pagamento & Caixa
                    </span>
                    <p className="text-sm font-black text-cyan-300">
                      {selectedSale.paymentMethod}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {selectedSale.installments ? `${selectedSale.installments}x no Cartão • ` : ''}
                      {selectedSale.cashSessionId ? 'Caixa Vinculado' : 'Venda Direta'}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div
                  className={`flex-1 min-h-[160px] rounded-xl border overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#050c1a] border-blue-900/50' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="px-3 py-2 border-b border-blue-900/30 flex items-center justify-between text-xs font-black text-slate-300 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Produtos / Itens da Venda ({selectedSale.items?.length || 0})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Subtotal: {formatCurrency(selectedSale.subtotal)}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead
                        className={`text-[10px] uppercase font-black tracking-wider border-b sticky top-0 ${
                          isDark ? 'bg-[#071124] text-slate-400 border-blue-900/50' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-2 text-center">Qtd</th>
                          <th className="py-2 px-2 text-right">Unitário</th>
                          {selectedSale.discount > 0 && <th className="py-2 px-2 text-right">Desc</th>}
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                        {selectedSale.items?.map((it, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-blue-950/20 transition-colors ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-xs">{it.productName}</p>
                              {it.barcode && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Cód: {it.barcode}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-cyan-300">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                              {formatCurrency(it.unitPrice)}
                            </td>
                            {selectedSale.discount > 0 && (
                              <td className="py-2.5 px-2 text-right font-mono text-rose-400">
                                {it.discount ? `-${formatCurrency(it.discount)}` : '---'}
                              </td>
                            )}
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400">
                              {formatCurrency(it.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals & Notes Footer */}
                <div
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 ${
                    isDark ? 'bg-[#050c1a] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-xs text-slate-400 space-y-1">
                    {selectedSale.notes && (
                      <p className="italic text-slate-300">
                        <strong className="text-slate-400 not-italic">Obs:</strong> {selectedSale.notes}
                      </p>
                    )}
                    {selectedSale.amountReceived !== undefined && (
                      <p>
                        Valor Recebido: <strong className="text-white">{formatCurrency(selectedSale.amountReceived)}</strong>
                        {selectedSale.change !== undefined && selectedSale.change > 0 && (
                          <span className="ml-2 text-cyan-300">Troco: {formatCurrency(selectedSale.change)}</span>
                        )}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono">
                      ID: {selectedSale.id}
                    </p>
                  </div>

                  <div className="w-full sm:w-auto text-right space-y-0.5">
                    {selectedSale.discount > 0 && (
                      <div className="flex sm:justify-end gap-3 text-xs text-slate-400">
                        <span>Desconto Aplicado:</span>
                        <span className="font-bold text-rose-400">-{formatCurrency(selectedSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex sm:justify-end items-center gap-3">
                      <span className="text-xs font-black uppercase text-slate-400">Total Líquido:</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                        {formatCurrency(selectedSale.total)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Receipt className="w-12 h-12 text-slate-600 mb-3 opacity-40 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-300">Nenhuma venda selecionada</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Selecione uma venda na lista ao lado para puxar os dados completos e reimprimir o comprovante.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* 4. MODAL FOOTER WITH 12-MONTH RETENTION STATUS */}
        <div
          className={`px-4 py-2.5 border-t shrink-0 flex flex-wrap items-center justify-between text-[11px] gap-2 ${
            isDark ? 'bg-[#050c1b] border-blue-900/60 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">
              Regra de Retenção: Guardado por 12 meses. Ao completar 12 meses, apaga o mês mais antigo.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {retentionStats.oldestDate && (
              <span className="text-[10px] font-mono text-cyan-400">
                Histórico desde: {formatDate(retentionStats.oldestDate)}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-900/40 hover:bg-blue-900 text-white transition-colors cursor-pointer"
            >
              Fechar Histórico (ESC)
            </button>
          </div>
        </div>

      </div>

      {/* Sub-modal for printing the selected receipt */}
      {isReceiptModalOpen && saleToPrint && (
        <PosReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          sale={saleToPrint}
          initialFormat={printFormat}
        />
      )}
    </div>
  );
};
