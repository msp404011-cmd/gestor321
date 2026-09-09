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
} from 'lucide-react';
import { AccountReceivable, ServiceOrder } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  cleanPhoneForWhatsApp,
  generateReceivableWhatsAppMessage,
  openWhatsAppLink,
} from '../../services/formatters';
import { ReceivablePayModal } from './ReceivablePayModal';

interface ReceivablesViewProps {
  onOpenOrder?: (orderId: string) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({ onOpenOrder }) => {
  const [receivables, setReceivables] = useState<AccountReceivable[]>(() => StorageService.getReceivables());
  const companySettings = StorageService.getCompanySettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID'>('ALL');
  const [selectedReceivableForPay, setSelectedReceivableForPay] = useState<AccountReceivable | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Subscribe to storage updates
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setReceivables(StorageService.getReceivables());
    });
    return unsub;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

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

    const msg = generateReceivableWhatsAppMessage({
      customerName: rec.customerName,
      referenceNumber: rec.referenceNumber,
      deviceInfo: rec.deviceInfo,
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
      serviceDescription: rec.serviceDescription,
      payments: rec.payments,
    });

    openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`);
  };

  const handleDelete = (rec: AccountReceivable) => {
    if (confirm(`Tem certeza que deseja excluir o registro de débito de ${rec.customerName} (${rec.referenceNumber})?`)) {
      StorageService.deleteReceivable(rec.id);
      setReceivables(StorageService.getReceivables());
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
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Setor A Prazo & Contas a Receber
              </h1>
              <p className="text-xs text-slate-400">
                Gerencie fiados, entradas, baixas parciais de OS e cobranças via WhatsApp
              </p>
            </div>
          </div>
        </div>
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
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Clock size={40} className="mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">Nenhum débito a prazo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ao entregar uma Ordem de Serviço selecionando a opção <strong>"A Prazo / Fiado"</strong>, o cliente e seu débito aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReceivables.map((rec) => {
            const remaining = Number(rec.remainingAmount ?? rec.amount) || 0;
            const original = Number(rec.originalAmount ?? (remaining + (rec.paidAmount || 0))) || remaining;
            const paid = Number(rec.paidAmount || 0);
            const isPaid = remaining <= 0 || rec.status === 'PAGO';
            const isOverdue = !isPaid && rec.dueDate && rec.dueDate < todayStr;
            const progressPercent = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 100;
            const isExpanded = expandedHistoryId === rec.id;

            const getPaymentMethodLabelLocal = (method: string) => {
              const map: Record<string, string> = {
                'PIX': 'PIX',
                'MONEY': 'Dinheiro',
                'CREDIT_CARD': 'Cartão de Crédito',
                'DEBIT_CARD': 'Cartão de Débito',
                'BANK_TRANSFER': 'Transferência Bancária',
                'OTHER': 'Outro'
              };
              return map[method] || method;
            };

            const allPayments = [];
            if (rec.downPayment && rec.downPayment > 0) {
              allPayments.push({
                id: 'down-payment',
                amount: rec.downPayment,
                paymentMethod: rec.downPaymentMethod || 'PIX',
                date: rec.createdAt,
                label: 'Entrada / Sinal'
              });
            }
            if (rec.payments && rec.payments.length > 0) {
              rec.payments.forEach((p, idx) => {
                allPayments.push({
                  id: p.id || `p-${idx}`,
                  amount: p.amount,
                  paymentMethod: p.paymentMethod || 'PIX',
                  date: p.date,
                  label: `Pagamento Parcial #${idx + 1}`
                });
              });
            }

            return (
              <div
                key={rec.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                  isPaid
                    ? 'bg-slate-900/40 border-slate-800 opacity-80'
                    : isOverdue
                    ? 'bg-slate-900/80 border-rose-500/40 shadow-rose-950/20 ring-1 ring-rose-500/20'
                    : 'bg-slate-900/80 border-slate-700 hover:border-amber-500/50'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-800/40 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                        {rec.referenceNumber}
                      </span>
                      {isPaid ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ✓ QUITADO
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                          ⚠️ VENCIDO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ⏳ EM ABERTO
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5 truncate max-w-[220px]">
                      {rec.customerName}
                    </h3>
                    {rec.customerPhone && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-semibold">
                        <MessageCircle size={13} className="shrink-0" />
                        {formatPhone(rec.customerPhone)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Excluir Débito"
                      onClick={() => handleDelete(rec)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Body - Entire card body is clickable to toggle history */}
                <div 
                  onClick={() => setExpandedHistoryId(isExpanded ? null : rec.id)}
                  className="p-4 space-y-3 flex-1 text-xs cursor-pointer hover:bg-slate-800/10 active:bg-slate-800/20 transition-colors select-none"
                  title="Clique para ver o histórico de pagamentos"
                >
                  {/* Device / Service info */}
                  {rec.deviceInfo && (
                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                      <Smartphone size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate font-medium">{rec.deviceInfo}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-medium">
                      <span className="text-slate-400">Progresso do Pagamento</span>
                      <span className={isPaid ? 'text-emerald-400' : 'text-amber-400'}>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Values grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total</span>
                      <span className="font-bold text-slate-300 text-xs">{formatCurrency(original)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Já Pago</span>
                      <span className="font-bold text-emerald-400 text-xs">{formatCurrency(paid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Falta Pagar</span>
                      <span className="font-extrabold text-amber-400 text-xs">{formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className={isOverdue ? 'text-rose-400' : 'text-slate-500'} />
                      Vencimento: <strong className={isOverdue ? 'text-rose-400' : 'text-slate-200'}>{formatDate(rec.dueDate)}</strong>
                    </span>
                    <span className="text-slate-500">{formatDate(rec.createdAt)}</span>
                  </div>

                  {/* Expandable Payment History indicator */}
                  <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors border-t border-slate-800/60 pt-2.5">
                    <Clock size={11} className="text-slate-500" />
                    <span>
                      {allPayments.length > 0
                        ? `${allPayments.length} pagamento(s) - Ver Histórico`
                        : 'Sem pagamentos parciais - Ver Histórico'
                      }
                    </span>
                    {isExpanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                  </div>

                  {isExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()} // Prevent double toggle inside container click
                      className="mt-2 space-y-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-[11px] max-h-44 overflow-y-auto animate-in slide-in-from-top-2 duration-150"
                    >
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 border-b border-slate-850 pb-1 flex items-center gap-1">
                        <Clock size={10} className="text-emerald-400" />
                        Histórico de Recebimentos
                      </p>
                      {allPayments.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-2">
                          Nenhum pagamento ou sinal registrado para esta conta.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {allPayments.map((p, idx) => (
                            <div key={p.id || idx} className="flex items-center justify-between border-b border-slate-800/40 pb-1.5 last:border-0 last:pb-0">
                              <div>
                                <span className="text-slate-300 font-semibold block">{p.label}</span>
                                <span className="text-slate-500 text-[10px] block">({getPaymentMethodLabelLocal(p.paymentMethod)})</span>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-400 font-extrabold block">{formatCurrency(p.amount)}</span>
                                <span className="text-slate-500 text-[9px] block">{formatDate(p.date)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t border-slate-800 bg-slate-800/30 flex items-center gap-2">
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceivableForPay(rec)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
                    >
                      <DollarSign size={14} />
                      Dar Baixa
                    </button>
                  )}

                  <button
                    type="button"
                    title="Enviar Extrato no WhatsApp com Emojis"
                    onClick={() => handleSendWhatsApp(rec)}
                    className="py-2 px-3 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send size={14} />
                    WhatsApp
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
        />
      )}
    </div>
  );
};
