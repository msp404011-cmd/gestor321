import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  Smartphone,
  Calendar,
  Send,
  Trash2,
  Receipt,
  ArrowUpRight,
  CreditCard,
  Plus,
  RefreshCw,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  Wrench,
  ShoppingBag,
  Package,
  Info,
  ArrowDownLeft,
} from 'lucide-react';
import { AccountReceivable, ServiceOrder, Sale } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudEngine } from '../../services/cloudEngine';
import { CloudEngineBadge } from '../common/CloudEngineBadge';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  cleanPhoneForWhatsApp,
  generateReceivableWhatsAppMessage,
  openWhatsAppLink,
} from '../../services/formatters';
import { ReceivablePayModal } from './ReceivablePayModal';
import { ManualReceivableModal } from './ManualReceivableModal';

interface ReceivablesViewProps {
  onOpenOrder?: (orderId: string) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({ onOpenOrder }) => {
  const [receivables, setReceivables] = useState<AccountReceivable[]>(() => StorageService.getReceivables());
  const [orders, setOrders] = useState<ServiceOrder[]>(() => StorageService.getOrders());
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const companySettings = StorageService.getCompanySettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID'>('ALL');
  const [selectedReceivableForPay, setSelectedReceivableForPay] = useState<AccountReceivable | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Exclusão segura de card de fiado (sem window.confirm)
  const [receivableToDelete, setReceivableToDelete] = useState<AccountReceivable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Subscribe to storage updates
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setReceivables(StorageService.getReceivables());
      setOrders(StorageService.getOrders());
      setSales(StorageService.getSales());
    });
    return unsub;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper para identificar exatamente o que é a dívida (aparelho, serviço, peças ou produtos vendidos)
  const getDebtInfo = (rec: AccountReceivable) => {
    let linkedOrder: ServiceOrder | undefined;
    let linkedSale: Sale | undefined;

    if (rec.originType === 'ORDEM_SERVICO' || rec.referenceNumber.toLowerCase().includes('os')) {
      linkedOrder = orders.find(
        (o) => o.id === rec.referenceId || `OS #${o.orderNumber}` === rec.referenceNumber
      );
    } else if (rec.originType === 'VENDA' || rec.referenceNumber.toLowerCase().includes('venda')) {
      linkedSale = sales.find(
        (s) => s.id === rec.referenceId || `Venda #${s.saleNumber}` === rec.referenceNumber
      );
    }

    // Aparelho ou Origem
    const device =
      rec.deviceInfo ||
      (linkedOrder ? `${linkedOrder.brand || ''} ${linkedOrder.model || ''}`.trim() : '') ||
      (rec.originType === 'VENDA' ? 'Produtos no Balcão' : rec.originType === 'MANUAL' ? 'Lançamento Manual' : 'Aparelho em OS');

    // Descrição do que compõe a dívida (serviço feito, peças, defeito ou itens da venda)
    let description = rec.serviceDescription || '';
    if (!description && linkedOrder) {
      const parts: string[] = [];
      if (linkedOrder.performedService) {
        parts.push(linkedOrder.performedService);
      } else if (linkedOrder.requestedService) {
        parts.push(linkedOrder.requestedService);
      }

      if (linkedOrder.items && linkedOrder.items.length > 0) {
        const itemNames = linkedOrder.items.map((i) => i.name || i.productName).filter(Boolean).join(', ');
        if (itemNames) parts.push(`Peças: ${itemNames}`);
      }

      if (parts.length > 0) {
        description = parts.join(' • ');
      } else if (linkedOrder.clientDefect) {
        description = `Reparo referente ao defeito: ${linkedOrder.clientDefect}`;
      }
    } else if (!description && linkedSale) {
      if (linkedSale.items && linkedSale.items.length > 0) {
        description = linkedSale.items
          .map((i) => `${i.productName} (${i.quantity}x)`)
          .join(', ');
      }
    }

    if (!description) {
      description =
        rec.originType === 'ORDEM_SERVICO'
          ? 'Serviço técnico / manutenção em Ordem de Serviço'
          : rec.originType === 'VENDA'
          ? 'Venda de produtos/acessórios no balcão'
          : 'Lançamento manual de fiado / débito';
    }

    const defect = linkedOrder?.clientDefect;
    const notes = rec.notes || linkedOrder?.customerNotes || linkedOrder?.internalNotes || linkedSale?.notes;

    return {
      linkedOrder,
      linkedSale,
      device,
      description,
      defect,
      notes,
    };
  };

  // Helper para cálculo amigável de dias de vencimento
  const getDueStatus = (dueDateStr?: string, isPaid?: boolean) => {
    if (isPaid) return { text: 'Quitado', isOverdue: false, isUrgent: false };
    if (!dueDateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr + 'T00:00:00');
      if (isNaN(due.getTime())) return null;
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return { text: 'Vence hoje!', isOverdue: true, isUrgent: true };
      if (diffDays < 0) return { text: `Vencido há ${Math.abs(diffDays)} dia(s)`, isOverdue: true, isUrgent: true };
      if (diffDays === 1) return { text: 'Vence amanhã', isOverdue: false, isUrgent: true };
      if (diffDays <= 3) return { text: `Vence em ${diffDays} dias`, isOverdue: false, isUrgent: true };
      return { text: `Vence em ${diffDays} dias`, isOverdue: false, isUrgent: false };
    } catch {
      return null;
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalToReceive = 0;
    let totalReceived = 0;
    let overdueCount = 0;
    const debtorCustomers = new Set<string>();

    receivables.forEach((r) => {
      const remaining = Number(r.remainingAmount ?? r.amount) || 0;
      const paid = Number(r.paidAmount || 0);

      totalToReceive += remaining;
      totalReceived += paid;

      if (remaining > 0) {
        debtorCustomers.add(r.customerId || r.customerName);
        if (r.dueDate && r.dueDate < todayStr) {
          overdueCount++;
        }
      }
    });

    return {
      totalToReceive,
      totalReceived,
      debtorCount: debtorCustomers.size,
      overdueCount,
    };
  }, [receivables, todayStr]);

  // Filtered list
  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      const remaining = Number(r.remainingAmount ?? r.amount) || 0;
      const isPaid = remaining <= 0 || r.status === 'PAGO';
      const isOverdue = !isPaid && r.dueDate && r.dueDate < todayStr;
      const isPartial = !isPaid && (r.paidAmount || 0) > 0;

      // Status Filter
      if (statusFilter === 'PENDING' && (isPaid || isPartial)) return false;
      if (statusFilter === 'PARTIAL' && !isPartial) return false;
      if (statusFilter === 'OVERDUE' && !isOverdue) return false;
      if (statusFilter === 'PAID' && !isPaid) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchRef = r.referenceNumber.toLowerCase().includes(q);
        const matchPhone = r.customerPhone ? r.customerPhone.includes(q) : false;
        const matchDevice = r.deviceInfo ? r.deviceInfo.toLowerCase().includes(q) : false;
        return matchName || matchRef || matchPhone || matchDevice;
      }

      return true;
    });
  }, [receivables, statusFilter, searchTerm, todayStr]);

  const handleSendWhatsApp = (rec: AccountReceivable) => {
    const phone = cleanPhoneForWhatsApp(rec.customerPhone);
    const original = Number(rec.originalAmount ?? (Number(rec.remainingAmount ?? rec.amount) + (rec.paidAmount || 0)));
    const paid = Number(rec.paidAmount || 0);
    const remaining = Number(rec.remainingAmount ?? rec.amount);
    const debt = getDebtInfo(rec);

    const msg = generateReceivableWhatsAppMessage({
      customerName: rec.customerName,
      referenceNumber: rec.referenceNumber,
      deviceInfo: debt.device,
      totalAmount: original,
      paidAmount: paid,
      remainingAmount: remaining,
      dueDate: rec.dueDate,
      companyName: companySettings.commercialName || companySettings.name,
      companyPhone: companySettings.whatsapp || companySettings.phone,
      pixKey: companySettings.pixKey,
      lastPaymentAmount: rec.payments && rec.payments.length > 0 ? rec.payments[rec.payments.length - 1].amount : rec.downPayment,
      lastPaymentMethod: rec.payments && rec.payments.length > 0 ? rec.payments[rec.payments.length - 1].paymentMethod : rec.downPaymentMethod,
      createdAt: rec.createdAt,
      serviceDescription: debt.description,
      payments: rec.payments,
    });

    openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`);
  };

  const executeDeleteReceivable = async (rec: AccountReceivable) => {
    try {
      setIsDeleting(true);
      // 1. Remove local e recalcula saldos
      StorageService.deleteReceivable(rec.id);
      // 2. Remove diretamente do Firestore na Nuvem
      await CloudEngine.directCloudDelete('receivables', rec.id);
      // 3. Atualiza estado imediatamente
      setReceivables(StorageService.getReceivables());
      setReceivableToDelete(null);
      setFeedbackToast({
        message: `Card de Fiado ${rec.referenceNumber} (${rec.customerName}) excluído com sucesso!`,
        type: 'success',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err) {
      console.error('Erro ao excluir débito:', err);
      setFeedbackToast({
        message: 'Erro ao excluir da nuvem. Tente novamente.',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  Setor A Prazo & Contas a Receber
                </h1>
                <CloudEngineBadge />
              </div>
              <p className="text-xs text-slate-400">
                Gerencie fiados, entradas, baixas parciais de OS e cobranças via WhatsApp 100% na Nuvem
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Plus size={16} className="stroke-[3]" />
          <span>+ Adicionar Cliente Devendo (Manual)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total A Receber */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Total a Receber</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">
            {formatCurrency(metrics.totalToReceive)}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">Saldo devedor em aberto na loja</p>
        </div>

        {/* Card 2: Total Já Recebido */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Total Já Recebido</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(metrics.totalReceived)}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Entradas e baixas amortizadas</p>
        </div>

        {/* Card 3: Clientes Devedores */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-slate-900 to-slate-900 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">Clientes com Débito</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{metrics.debtorCount}</p>
          <p className="text-[11px] text-cyan-400/80 mt-1">Clientes cadastrados com pendências</p>
        </div>

        {/* Card 4: Débitos Vencidos */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/15 via-slate-900 to-slate-900 border border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Débitos Vencidos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2">{metrics.overdueCount}</p>
          <p className="text-[11px] text-rose-400/80 mt-1">Cobranças com data expirada</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, OS, aparelho ou fone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PENDING', label: 'Em Aberto' },
            { id: 'PARTIAL', label: 'Com Entrada / Parcial' },
            { id: 'OVERDUE', label: 'Vencidos' },
            { id: 'PAID', label: 'Quitados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receivables List / Cards */}
      {filteredReceivables.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <Clock size={40} className="mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">Nenhum débito a prazo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ao entregar uma Ordem de Serviço selecionando a opção <strong>"A Prazo / Fiado"</strong> ou adicionando um cliente devendo manualmente, o registro aparecerá aqui.
          </p>
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Adicionar Cliente Devendo (Manual)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredReceivables.map((rec) => {
            const remaining = Number(rec.remainingAmount ?? rec.amount) || 0;
            const original = Number(rec.originalAmount ?? (remaining + (rec.paidAmount || 0))) || remaining;
            const paid = Number(rec.paidAmount || 0);
            const isPaid = remaining <= 0 || rec.status === 'PAGO';
            const isOverdue = !isPaid && rec.dueDate && rec.dueDate < todayStr;
            const progressPercent = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 100;
            const isExpanded = expandedHistoryId === rec.id;

            const debtInfo = getDebtInfo(rec);
            const dueStatus = getDueStatus(rec.dueDate, isPaid);

            const getPaymentMethodLabelLocal = (method: string) => {
              const map: Record<string, string> = {
                'PIX': 'PIX',
                'MONEY': 'Dinheiro',
                'DINHEIRO': 'Dinheiro',
                'CREDIT_CARD': 'Cartão de Crédito',
                'CARTAO_CREDITO': 'Cartão de Crédito',
                'DEBIT_CARD': 'Cartão de Débito',
                'CARTAO_DEBITO': 'Cartão de Débito',
                'BANK_TRANSFER': 'Transferência',
                'TRANSFERENCIA': 'Transferência',
                'OTHER': 'Outro'
              };
              return map[method] || method;
            };

            const allPayments: {
              id: string;
              amount: number;
              paymentMethod: string;
              date: string;
              label: string;
              userName?: string;
              notes?: string;
            }[] = [];

            if (rec.downPayment && rec.downPayment > 0) {
              allPayments.push({
                id: 'down-payment',
                amount: rec.downPayment,
                paymentMethod: rec.downPaymentMethod || 'DINHEIRO',
                date: rec.createdAt,
                label: 'Entrada Inicial / Sinal',
                userName: undefined,
                notes: 'Entrada registrada no fechamento',
              });
            }

            if (rec.payments && rec.payments.length > 0) {
              rec.payments.forEach((p, idx) => {
                allPayments.push({
                  id: p.id || `p-${idx}`,
                  amount: p.amount,
                  paymentMethod: p.paymentMethod || 'PIX',
                  date: p.date,
                  label: `Abatimento Parcial #${idx + 1}`,
                  userName: p.userName,
                  notes: p.notes,
                });
              });
            }

            if (allPayments.length === 0 && paid > 0) {
              allPayments.push({
                id: 'fallback-paid',
                amount: paid,
                paymentMethod: rec.paymentMethod || 'PIX',
                date: rec.paidAt || rec.createdAt,
                label: isPaid ? 'Quitação Total' : 'Abatimento Registrado',
              });
            }

            return (
              <div
                key={rec.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                  isPaid
                    ? 'bg-slate-900/70 border-slate-800 opacity-95'
                    : isOverdue
                    ? 'bg-slate-900/95 border-rose-500/50 shadow-rose-950/20 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/95 border-slate-750 hover:border-amber-500/50'
                }`}
              >
                {/* Card Header: Origem, Status, Cliente e Ações */}
                <div className="p-4 border-b border-slate-800 bg-slate-850/50 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Origem Badge */}
                      {rec.originType === 'ORDEM_SERVICO' || rec.referenceNumber.toLowerCase().includes('os') ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (debtInfo.linkedOrder && onOpenOrder) {
                              onOpenOrder(debtInfo.linkedOrder.id);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold flex items-center gap-1.5 transition-colors shrink-0 ${
                            debtInfo.linkedOrder && onOpenOrder
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 cursor-pointer'
                              : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          }`}
                          title={debtInfo.linkedOrder ? 'Clique para abrir os detalhes desta OS' : rec.referenceNumber}
                        >
                          <Wrench size={12} className="text-teal-400 shrink-0" />
                          <span>{rec.referenceNumber}</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shrink-0">
                          <ShoppingBag size={12} className="text-cyan-400 shrink-0" />
                          <span>{rec.referenceNumber}</span>
                        </span>
                      )}

                      {/* Status Tag */}
                      {isPaid ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          ✓ QUITADO
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse shrink-0">
                          ⚠️ {dueStatus ? dueStatus.text.toUpperCase() : 'VENCIDO'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          ⏳ {dueStatus ? dueStatus.text.toUpperCase() : 'EM ABERTO'}
                        </span>
                      )}
                    </div>

                    {/* Cliente */}
                    <h3 className="text-sm sm:text-base font-bold text-white truncate w-full" title={rec.customerName}>
                      {rec.customerName}
                    </h3>

                    {/* Telefone / WhatsApp */}
                    {rec.customerPhone && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1 font-semibold truncate">
                        <MessageCircle size={13} className="shrink-0" />
                        <span>{formatPhone(rec.customerPhone)}</span>
                      </p>
                    )}
                  </div>

                  {/* Lixeira rápida */}
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      title="Excluir Card de Fiado"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceivableToDelete(rec);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* SEÇÃO: O QUE É A DÍVIDA (Em destaque total no card) */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                        {rec.originType === 'ORDEM_SERVICO' ? (
                          <Wrench size={12} className="text-amber-400 shrink-0" />
                        ) : (
                          <ShoppingBag size={12} className="text-cyan-400 shrink-0" />
                        )}
                        O que é a Dívida:
                      </span>

                      {debtInfo.device && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 truncate max-w-[180px]"
                          title={debtInfo.device}
                        >
                          <Smartphone size={11} className="shrink-0 text-cyan-400" />
                          <span className="truncate">{debtInfo.device}</span>
                        </span>
                      )}
                    </div>

                    {/* Descrição do serviço / itens */}
                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-750/80">
                      <p className="text-xs font-semibold text-white leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0 mt-0.5">📌</span>
                        <span className="text-slate-100">{debtInfo.description}</span>
                      </p>

                      {debtInfo.defect && debtInfo.defect !== debtInfo.description && (
                        <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800 flex items-center gap-1.5">
                          <span className="text-rose-400 font-semibold shrink-0">Defeito da OS:</span>
                          <span className="text-slate-300 truncate">{debtInfo.defect}</span>
                        </p>
                      )}

                      {debtInfo.notes && (
                        <p className="text-[10px] text-amber-300/80 mt-1 italic flex items-center gap-1.5">
                          <span className="font-semibold not-italic text-amber-400">Obs:</span>
                          <span className="truncate">{debtInfo.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400 text-[11px]">Progresso de Amortização</span>
                      <span className={isPaid ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {progressPercent}% abatido
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Values grid: Total, Já Pago, Falta Pagar em uma linha proporcional */}
                  <div className="grid grid-cols-3 gap-1 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center items-center">
                    <div className="min-w-0 flex flex-col items-center px-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5 whitespace-nowrap">
                        Total
                      </span>
                      <span className="font-bold text-slate-200 text-xs sm:text-sm font-mono truncate w-full" title={formatCurrency(original)}>
                        {formatCurrency(original)}
                      </span>
                    </div>

                    <div className="min-w-0 flex flex-col items-center border-x border-slate-800/80 px-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 block mb-0.5 whitespace-nowrap">
                        Já Abatido
                      </span>
                      <span className="font-bold text-emerald-400 text-xs sm:text-sm font-mono truncate w-full" title={formatCurrency(paid)}>
                        {formatCurrency(paid)}
                      </span>
                    </div>

                    <div className="min-w-0 flex flex-col items-center px-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block mb-0.5 whitespace-nowrap">
                        Falta Pagar
                      </span>
                      <span 
                        className={`font-extrabold text-xs sm:text-sm font-mono truncate w-full ${
                          isPaid ? 'text-slate-500' : isOverdue ? 'text-rose-400' : 'text-amber-400'
                        }`} 
                        title={formatCurrency(remaining)}
                      >
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* SEÇÃO: ABATIMENTOS REALIZADOS (Com data certinho e valores detalhados) */}
                  <div className="rounded-xl bg-slate-950/75 border border-slate-800 p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800/70 pb-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span className="uppercase text-[10px] font-extrabold tracking-wider text-slate-300">
                          Abatimentos Realizados
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({allPayments.length})
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-emerald-400 font-mono">
                        {paid > 0 ? `${formatCurrency(paid)} abatido` : 'R$ 0,00'}
                      </span>
                    </div>

                    {allPayments.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                        {allPayments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-200 text-xs">
                                  {p.label}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  {getPaymentMethodLabelLocal(p.paymentMethod)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
                                <Calendar size={11} className="text-emerald-400 shrink-0" />
                                <span>Data: <strong className="text-slate-200 font-semibold">{formatDateTime(p.date)}</strong></span>
                                {p.userName && <span className="text-slate-500 text-[10px]">por {p.userName}</span>}
                              </div>
                              {p.notes && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                  "{p.notes}"
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="font-extrabold text-emerald-400 font-mono text-xs sm:text-sm block">
                                - {formatCurrency(p.amount)}
                              </span>
                              <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider">
                                Abatido
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 text-center text-slate-400 text-xs">
                        <p className="font-medium text-slate-300 text-[11px]">
                          ⏳ Nenhum abatimento realizado ainda
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Débito total de <strong className="text-slate-300">{formatCurrency(original)}</strong> pendente
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Datas de Emissão e Vencimento */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar size={13} className={isOverdue ? 'text-rose-400 shrink-0' : 'text-slate-500 shrink-0'} />
                      <span className="text-slate-400 truncate text-[11px]">
                        Vencimento: <strong className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200 font-semibold'}>{formatDate(rec.dueDate)}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 ml-2" title="Data em que a dívida foi criada">
                      Origem: {formatDate(rec.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions: Tudo em uma linha, proporcional e com espaçamento entre eles */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
                  {!isPaid ? (
                    <button
                      type="button"
                      onClick={() => setSelectedReceivableForPay(rec)}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.01] cursor-pointer whitespace-nowrap min-w-0"
                    >
                      <DollarSign size={14} className="shrink-0" />
                      <span className="truncate">Dar Baixa</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedReceivableForPay(rec)}
                      className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer whitespace-nowrap min-w-0"
                    >
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate">Ver Recibo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    title="Enviar Extrato no WhatsApp com Detalhamento"
                    onClick={() => handleSendWhatsApp(rec)}
                    className="py-2.5 px-3 bg-emerald-700/20 hover:bg-emerald-700/40 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send size={13} className="shrink-0" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    title="Excluir este card de fiado"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceivableToDelete(rec);
                    }}
                    className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {selectedReceivableForPay && (
        <ReceivablePayModal
          isOpen={!!selectedReceivableForPay}
          receivable={selectedReceivableForPay}
          onClose={() => setSelectedReceivableForPay(null)}
          onSuccess={() => {
            setReceivables(StorageService.getReceivables());
          }}
          onDelete={(rec) => {
            setSelectedReceivableForPay(null);
            setReceivableToDelete(rec);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão de Fiado (100% In-App, sem window.confirm) */}
      {receivableToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeleting && setReceivableToDelete(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">Excluir Card de Fiado?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Esta ação removerá este débito permanentemente da lista e sincronizará em tempo real com a nuvem Firebase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setReceivableToDelete(null)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informações do Débito */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Cliente:</span>
                <span className="font-bold text-white truncate max-w-[220px]">{receivableToDelete.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Referência:</span>
                <span className="font-mono text-teal-400 font-bold">{receivableToDelete.referenceNumber}</span>
              </div>
              {receivableToDelete.deviceInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Aparelho:</span>
                  <span className="text-slate-300 truncate max-w-[220px]">{receivableToDelete.deviceInfo}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Saldo Restante:</span>
                <span className="font-extrabold text-rose-400 text-sm font-mono">
                  {formatCurrency(Number(receivableToDelete.remainingAmount ?? receivableToDelete.amount) || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setReceivableToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => executeDeleteReceivable(receivableToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  'Excluindo...'
                ) : (
                  <>
                    <Trash2 size={14} />
                    Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Receivable Creation Modal */}
      <ManualReceivableModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          setReceivables(StorageService.getReceivables());
          setFeedbackToast({
            message: 'Cliente devedor e fiado lançados com sucesso!',
            type: 'success',
          });
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
      />

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className={`fixed bottom-5 right-5 z-50 p-3.5 px-4 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-bottom-3 duration-200 ${
          feedbackToast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
            : 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/50'
        }`}>
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}
    </div>
  );
};
