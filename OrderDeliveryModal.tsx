import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  DollarSign,
  CreditCard,
  Send,
  User,
  Smartphone,
  Info,
  Clock,
  Banknote,
  Plus,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { ServiceOrder, PaymentMethod, AccountReceivable } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  cleanPhoneForWhatsApp,
  generateReceivableWhatsAppMessage,
  openWhatsAppLink,
  getPaymentMethodLabel,
} from '../../services/formatters';

interface OrderDeliveryModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  onClose: () => void;
  onSuccess: (order: ServiceOrder, receivable?: AccountReceivable) => void;
}

interface PaymentRow {
  id: string;
  method: PaymentMethod | string;
  amount: number | string;
}

export const OrderDeliveryModal: React.FC<OrderDeliveryModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const companySettings = StorageService.getCompanySettings();
  const currentUser = StorageService.getCurrentUser();
  const customPaymentMethods = StorageService.getCustomPaymentMethods();

  const laborPrice = Number(order.laborPrice) || 0;
  const partsPrice = Number(order.partsPrice) || 0;
  const discountAmount = Number(order.discount) || 0;

  // Order items / parts list
  const orderItems = (order.items && order.items.length > 0)
    ? order.items
    : (order.parts && order.parts.length > 0)
    ? order.parts
    : [];

  const itemsTotal = orderItems.reduce(
    (acc, it) => acc + (Number(it.totalPrice || it.total) || (Number(it.unitPrice) * (it.quantity || 1))),
    0
  );

  const rawTotal = order.totalPrice !== undefined && order.totalPrice !== null ? Number(order.totalPrice) : NaN;
  const computedTotal = Math.max(0, (itemsTotal > 0 ? itemsTotal + laborPrice : partsPrice + laborPrice) - discountAmount);
  const totalAmount = !isNaN(rawTotal) ? Math.max(0, rawTotal) : computedTotal;
  const isZeroCostOrder = totalAmount <= 0;

  // Mode: 'FULL' (À Vista / Múltiplo) or 'CREDIT' (A Prazo)
  const [deliveryMode, setDeliveryMode] = useState<'FULL' | 'CREDIT'>('FULL');

  // Default payment rows: Start with empty amount so input has NO zero prefilled!
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(() => [
    { id: 'drow-1', method: 'PIX', amount: '' },
  ]);

  // Reset rows when order or total amount changes
  useEffect(() => {
    if (isZeroCostOrder) {
      setPaymentRows([
        { id: 'drow-1', method: (order?.paymentMethod as any) || 'OUTRO', amount: '0' },
      ]);
    } else if (order?.payments && order.payments.length > 0) {
      setPaymentRows(
        order.payments.map((p, idx) => ({
          id: `drow-${idx + 1}`,
          method: p.paymentMethod || order.paymentMethod || 'PIX',
          amount: p.amount ? String(p.amount) : '',
        }))
      );
    } else if (order?.paymentMethod && order.paymentMethod !== 'A_PRAZO' && order.paymentStatus === 'PAGO') {
      setPaymentRows([
        { id: 'drow-1', method: order.paymentMethod, amount: String(totalAmount) },
      ]);
    } else {
      setPaymentRows([
        { id: 'drow-1', method: (order?.paymentMethod as any) || 'PIX', amount: '' },
      ]);
    }
    setIsCompleted(false);
    setCreatedReceivable(null);
    setError('');
  }, [order?.id, totalAmount, isZeroCostOrder]);

  // Credit / A Prazo state
  const [downPayment, setDownPayment] = useState<number | string>('');
  const [downPaymentMethod, setDownPaymentMethod] = useState<PaymentMethod>('PIX');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [creditNotes, setCreditNotes] = useState<string>('');

  // Finished state
  const [createdReceivable, setCreatedReceivable] = useState<AccountReceivable | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastPaymentsRecorded, setLastPaymentsRecorded] = useState<{ amount: number; method: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const remainingCredit = Math.max(0, totalAmount - (Number(downPayment) || 0));

  // Available Payment Options (Deduplicated automatically)
  const allPaymentOptions = StorageService.getDeduplicatedPaymentOptions();

  // Sum of payment amounts entered in rows
  const sumPaid = paymentRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  const diffPaid = totalAmount - sumPaid;

  // Handlers for payment rows
  const handleUpdateRowMethod = (id: string, method: string) => {
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, method } : row))
    );
  };

  const handleUpdateRowAmount = (id: string, amountVal: string) => {
    const val = amountVal === '' ? '' : Math.max(0, parseFloat(amountVal) || 0);
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount: val } : row))
    );
  };

  const handleAddPaymentRow = () => {
    const availableNextMethod =
      allPaymentOptions.find((opt) => !paymentRows.some((r) => r.method === opt.id))?.id ||
      'DINHEIRO';
    const newId = 'drow-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    setPaymentRows((prev) => [
      ...prev,
      { id: newId, method: availableNextMethod, amount: '' },
    ]);
  };

  const handleRemovePaymentRow = (id: string) => {
    if (paymentRows.length <= 1) return;
    setPaymentRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleFillRemainingInRow = (id: string) => {
    const otherSum = paymentRows
      .filter((r) => r.id !== id)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const needed = Math.max(0, totalAmount - otherSum);
    handleUpdateRowAmount(id, needed.toString());
  };

  const handleConfirm = () => {
    setError('');
    setLoading(true);

    try {
      if (isZeroCostOrder) {
        // Serviço zerado / Cortesia / Garantia / Sem cobrança
        const primaryMethod = (order.paymentMethod && order.paymentMethod !== 'A_PRAZO') ? order.paymentMethod : 'OUTRO';
        StorageService.deliverAndPayOrder(
          order.id,
          primaryMethod as PaymentMethod,
          currentUser?.name,
          'Aparelho entregue e concluído sem cobrança (Serviço zerado / Cortesia).',
          [{ paymentMethod: primaryMethod, amount: 0 }]
        );
        setLastPaymentsRecorded([{ amount: 0, method: primaryMethod }]);
        const updated = StorageService.getOrders().find((o) => o.id === order.id) || {
          ...order,
          status: 'ENTREGUE',
          paymentStatus: 'PAGO',
          totalPrice: 0,
          deliveredAt: new Date().toISOString(),
        };
        setIsCompleted(true);
        onSuccess(updated as ServiceOrder);
        return;
      }

      if (deliveryMode === 'FULL') {
        const activeSplits = paymentRows
          .filter((r) => Number(r.amount) > 0)
          .map((r) => ({
            paymentMethod: r.method,
            amount: Number(r.amount),
          }));

        if (activeSplits.length === 0) {
          setError('Por favor, informe ao menos uma forma de pagamento com valor maior que R$ 0,00.');
          setLoading(false);
          return;
        }

        if (Math.abs(diffPaid) > 0.01 && sumPaid < totalAmount) {
          setError(
            `A soma dos pagamentos (${formatCurrency(sumPaid)}) é menor que o valor total da OS (${formatCurrency(totalAmount)}). Ajuste os valores ou selecione 'A Prazo'.`
          );
          setLoading(false);
          return;
        }

        const primaryMethod = activeSplits[0].paymentMethod;
        StorageService.deliverAndPayOrder(
          order.id,
          primaryMethod as PaymentMethod,
          currentUser?.name,
          activeSplits.length > 1 ? 'Entregue com pagamentos divididos.' : 'Entregue com pagamento integral.',
          activeSplits
        );

        setLastPaymentsRecorded(activeSplits);
        const updated = StorageService.getOrders().find((o) => o.id === order.id) || order;
        setIsCompleted(true);
        onSuccess(updated);
      } else {
        // Entregar A Prazo / Fiado
        if (downPayment < 0 || downPayment > totalAmount) {
          setError('O valor de entrada não pode ser negativo nem maior que o total da OS.');
          setLoading(false);
          return;
        }

        const result = StorageService.deliverOrderOnCredit({
          orderId: order.id,
          downPayment: Number(downPayment) || 0,
          downPaymentMethod: downPayment > 0 ? downPaymentMethod : undefined,
          dueDate,
          notes: creditNotes,
          userName: currentUser?.name,
        });

        const updated = StorageService.getOrders().find((o) => o.id === order.id) || order;
        setCreatedReceivable(result.receivable);
        setIsCompleted(true);
        onSuccess(updated, result.receivable);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar entrega da OS.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const phone = cleanPhoneForWhatsApp(order.customerWhatsapp || order.customerPhone);
    const companyName = companySettings.commercialName || companySettings.name;

    if (deliveryMode === 'FULL') {
      const activeSplits = lastPaymentsRecorded.length > 0 ? lastPaymentsRecorded : paymentRows.filter((r) => Number(r.amount) > 0);
      const paymentSummaryText = activeSplits
        .map((p) => `• ${getPaymentMethodLabel(p.method)}: *${formatCurrency(Number(p.amount))}*`)
        .join('\n');

      const text = encodeURIComponent(
        `👋 Olá, *${order.customerName}*!\n\nSua Ordem de Serviço *#${order.orderNumber}* foi concluída e entregue! 🎉\n\n` +
        `📱 *Produto / Equipamento:* ${order.brand} ${order.model}${order.serialNumber ? ` (N/S: ${order.serialNumber})` : ''}\n` +
        `🛠️ *Serviço Realizado:* ${order.performedService || order.requestedService || 'Manutenção Técnica'}\n` +
        `💰 *Valor Total da OS:* *${formatCurrency(totalAmount)}*\n\n` +
        `✅ *Pagamento Realizado (${activeSplits.length > 1 ? 'Múltiplo / Dividido' : 'À Vista'}):*\n${paymentSummaryText}\n\n` +
        `Obrigado pela confiança! 🤝✨\n*${companyName}*`
      );
      openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`);
      return;
    }

    if (createdReceivable) {
      const msg = generateReceivableWhatsAppMessage({
        customerName: createdReceivable.customerName,
        referenceNumber: createdReceivable.referenceNumber,
        deviceInfo: createdReceivable.deviceInfo,
        totalAmount: createdReceivable.originalAmount || totalAmount,
        paidAmount: createdReceivable.paidAmount || 0,
        remainingAmount: createdReceivable.remainingAmount || 0,
        dueDate: createdReceivable.dueDate,
        companyName,
        companyPhone: companySettings.whatsapp || companySettings.phone,
        pixKey: companySettings.pixKey,
        lastPaymentAmount: createdReceivable.downPayment,
        lastPaymentMethod: createdReceivable.downPaymentMethod,
        createdAt: createdReceivable.createdAt,
        serviceDescription: createdReceivable.serviceDescription,
        payments: createdReceivable.payments,
      });
      openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header Compacto (Sem Rolar) */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Concluir Entrega OS #{order.orderNumber}
              </h2>
              <p className="text-[11px] text-slate-400">{order.customerName} • {order.brand} {order.model}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Design Otimizado Sem Rolagem */}
        <div className="p-3.5 space-y-3 text-slate-200 text-xs flex-1 overflow-y-auto">
          {/* Cartão do Produto & Discriminação Financeira da OS */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            {/* Cliente & Aparelho */}
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700/60">
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                <p className="font-bold text-white truncate">{order.customerName}</p>
              </div>

              <div className="text-right truncate">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">Produto / Aparelho</span>
                <p className="font-extrabold text-teal-300 truncate">{order.brand} {order.model}</p>
              </div>
            </div>

            {/* Peças / Componentes com Valores */}
            {orderItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <Package size={11} className="text-cyan-400" /> Itens / Peças da OS:
                </span>
                <div className="bg-slate-900/90 rounded-lg border border-slate-800 divide-y divide-slate-800/60 max-h-24 overflow-y-auto text-[11px]">
                  {orderItems.map((item, idx) => (
                    <div key={item.id || `item-${idx}`} className="px-2 py-1 flex items-center justify-between">
                      <span className="text-slate-200 font-medium truncate max-w-[220px]">
                        {item.quantity}x {item.productName || item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {formatCurrency((Number(item.totalPrice || item.total) || (Number(item.unitPrice) * item.quantity)))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totalizador Financeiro */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {laborPrice > 0 && <span>M.Obra: <strong className="text-slate-200">{formatCurrency(laborPrice)}</strong></span>}
                {partsPrice > 0 && <span>Peças: <strong className="text-slate-200">{formatCurrency(partsPrice)}</strong></span>}
                {discountAmount > 0 && <span className="text-rose-400">Desc: -{formatCurrency(discountAmount)}</span>}
              </div>

              <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                <span className="text-[11px] font-bold text-slate-300">Total OS:</span>
                <span className="text-sm font-extrabold text-teal-400 font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {isCompleted ? (
            /* Completed Screen with WhatsApp Action */
            <div className="py-3 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">OS Entregue com Sucesso!</h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  {isZeroCostOrder ? (
                    <>Serviço entregue e concluído sem cobrança (<strong className="text-emerald-400 font-mono">R$ 0,00</strong>).</>
                  ) : deliveryMode === 'FULL' ? (
                    <>Valor de <strong className="text-emerald-400 font-mono">{formatCurrency(totalAmount)}</strong> baixado no caixa.</>
                  ) : (
                    <>Lançado no setor A Prazo de <strong className="text-white">{order.customerName}</strong>.</>
                  )}
                </p>
              </div>

              {/* Formas utilizadas */}
              {deliveryMode === 'FULL' ? (
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Detalhamento dos Abatimentos:</span>
                  {lastPaymentsRecorded.map((p, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0">
                      <span>{getPaymentMethodLabel(p.method)}:</span>
                      <strong className="text-emerald-400 font-mono">{formatCurrency(p.amount)}</strong>
                    </div>
                  ))}
                </div>
              ) : createdReceivable && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-amber-500/30 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Valor Total da OS:</span>
                    <span className="text-slate-200 font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  {createdReceivable.downPayment && createdReceivable.downPayment > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Entrada Abatida Agora:</span>
                      <span className="font-bold">
                        {formatCurrency(createdReceivable.downPayment)} ({getPaymentMethodLabel(createdReceivable.downPaymentMethod || 'PIX')})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1.5 border-t border-slate-700 font-bold text-white">
                    <span>Saldo Restante a Prazo:</span>
                    <span className="text-amber-400 font-mono">{formatCurrency(createdReceivable.remainingAmount || 0)}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send size={16} />
                  Comprovante no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            /* Delivery & Payment Selection */
            <div className="space-y-3">
              {/* Tabs de Seleção de Modo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('FULL')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-center transition-all ${
                    deliveryMode === 'FULL'
                      ? 'bg-teal-600/20 border-teal-500 text-white font-semibold'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Banknote size={18} className={deliveryMode === 'FULL' ? 'text-teal-400' : 'text-slate-500'} />
                  <span className="text-xs font-bold">À Vista / Múltiplo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode('CREDIT')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-center transition-all ${
                    deliveryMode === 'CREDIT'
                      ? 'bg-amber-600/20 border-amber-500 text-white font-semibold'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Clock size={18} className={deliveryMode === 'CREDIT' ? 'text-amber-400' : 'text-slate-500'} />
                  <span className="text-xs font-bold">A Prazo / Crediário</span>
                </button>
              </div>

              {/* ABA 1: À VISTA / MÚLTIPLO */}
              {deliveryMode === 'FULL' && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <label className="text-[11px] font-bold text-white flex items-center gap-1 uppercase tracking-wide">
                      <CreditCard size={14} className="text-teal-400" /> Forma de Pagamento
                    </label>
                  </div>

                  {/* Payment Rows (Inicia com Apenas 1 Forma) */}
                  <div className="space-y-2">
                    {paymentRows.map((row, index) => (
                      <div
                        key={row.id}
                        className="p-2 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-teal-400">
                            Forma de Pagamento #{index + 1}
                          </span>
                          {paymentRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentRow(row.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Option Selector */}
                          <div className="col-span-7">
                            <select
                              value={row.method}
                              onChange={(e) => handleUpdateRowMethod(row.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-teal-400"
                            >
                              {allPaymentOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.icon} {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Value Input */}
                          <div className="col-span-5 relative flex items-center gap-1">
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder=""
                                value={row.amount === '' || row.amount === 0 ? '' : row.amount}
                                onChange={(e) => handleUpdateRowAmount(row.id, e.target.value)}
                                className="w-full pl-7 pr-1.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-lg text-white text-xs font-mono font-bold focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleFillRemainingInRow(row.id)}
                              className="shrink-0 px-1.5 py-1.5 bg-slate-800 hover:bg-teal-500/20 text-teal-300 border border-slate-700 rounded-lg text-[10px] font-semibold"
                              title="Preencher restante"
                            >
                              Restante
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Opção de Colocar Mais */}
                  <button
                    type="button"
                    onClick={handleAddPaymentRow}
                    className="w-full py-2 px-3 bg-slate-900/80 hover:bg-slate-800 border border-dashed border-teal-500/40 rounded-xl text-xs font-bold text-teal-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={15} className="text-teal-400" />
                    <span>+ Adicionar Outra Forma de Pagamento</span>
                  </button>

                  {/* PAINEL DE ABATIMENTO AO VIVO (SOLICITADO PELO USUÁRIO) */}
                  <div className="p-3 bg-slate-900 border border-teal-500/40 rounded-xl space-y-2.5 text-xs shadow-md">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-teal-500/30">
                      <span className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={14} className="text-teal-400" />
                        Valor Total da OS:
                      </span>
                      <span className="font-mono font-extrabold text-teal-300 text-sm">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Detalhamento dos Abatimentos por Forma */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wide block">
                        Detalhamento do Abatimento:
                      </span>
                      {paymentRows.map((r, idx) => {
                        const amt = Number(r.amount) || 0;
                        return (
                          <div key={r.id} className="flex justify-between items-center text-[11px] text-slate-300">
                            <span>Abatido via {getPaymentMethodLabel(r.method)}:</span>
                            <strong className="font-mono text-emerald-400">{formatCurrency(amt)}</strong>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Abatido & O que vai faltando */}
                    <div className="pt-1.5 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-300">Total Abatido nesta Operação:</span>
                        <span className="font-mono text-emerald-400">{formatCurrency(sumPaid)}</span>
                      </div>

                      {isZeroCostOrder ? (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-between">
                          <span>🎉 SERVIÇO ZERADO / SEM COBRANÇA</span>
                          <span className="font-mono">Total: R$ 0,00</span>
                        </div>
                      ) : Math.abs(diffPaid) < 0.01 && sumPaid > 0 ? (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-between">
                          <span>🎉 PAGO TOTALMENTE! (OS 100% Quitada)</span>
                          <span className="font-mono">Falta: R$ 0,00</span>
                        </div>
                      ) : diffPaid > 0 ? (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold flex items-center justify-between">
                          <span>⏳ Faltando Abater:</span>
                          <span className="font-mono text-amber-400">{formatCurrency(diffPaid)}</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-bold flex items-center justify-between">
                          <span>💡 Excesso / Troco a Devolver:</span>
                          <span className="font-mono text-cyan-400">{formatCurrency(Math.abs(diffPaid))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: A PRAZO / CREDIARIO */}
              {deliveryMode === 'CREDIT' && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-amber-500/30 space-y-2.5 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Entrada (Abatimento):
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalAmount}
                          value={downPayment === '' || downPayment === 0 ? '' : downPayment}
                          placeholder=""
                          onChange={(e) => {
                            const val = e.target.value;
                            setDownPayment(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                          }}
                          className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Forma da Entrada:
                      </label>
                      <select
                        disabled={!downPayment || downPayment <= 0}
                        value={downPaymentMethod}
                        onChange={(e) => setDownPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      >
                        {allPaymentOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.icon} {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resumo Dinâmico do Abatimento */}
                  <div className="p-2 bg-slate-900 border border-slate-700/80 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Valor Total da OS:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(totalAmount)}</span>
                    </div>
                    {downPayment > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>(-) Entrada Abatida Agora ({getPaymentMethodLabel(downPaymentMethod)}):</span>
                        <span className="font-mono">-{formatCurrency(downPayment)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-800 font-bold">
                      <span className="text-amber-300 font-bold">(=) O que vai para o A Prazo:</span>
                      <span className="text-amber-400 font-mono">{formatCurrency(remainingCredit)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Data de Vencimento:
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Observação / Acordo:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pagar dia 10..."
                        value={creditNotes}
                        onChange={(e) => setCreditNotes(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <Info size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/30 flex items-center gap-1.5 transition-all"
                >
                  {loading ? (
                    'Processando...'
                  ) : isZeroCostOrder ? (
                    <>
                      <CheckCircle2 size={15} />
                      Concluir e Entregar OS Zerada (R$ 0,00)
                    </>
                  ) : deliveryMode === 'FULL' ? (
                    <>
                      <CheckCircle2 size={15} />
                      Confirmar Entrega e Pagamento
                    </>
                  ) : (
                    <>
                      <Clock size={15} />
                      Confirmar Entrega A Prazo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
