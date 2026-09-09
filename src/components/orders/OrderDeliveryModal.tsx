import React, { useState } from 'react';
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
  Receipt,
  FileSpreadsheet,
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
} from '../../services/formatters';

interface OrderDeliveryModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  onClose: () => void;
  onSuccess: (order: ServiceOrder, receivable?: AccountReceivable) => void;
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

  const totalAmount = order.totalPrice || 0;

  // Mode: 'FULL' (À Vista) or 'CREDIT' (A Prazo)
  const [deliveryMode, setDeliveryMode] = useState<'FULL' | 'CREDIT'>('FULL');

  // Full Payment state
  const [fullPaymentMethod, setFullPaymentMethod] = useState<PaymentMethod>('PIX');

  // Credit / A Prazo state
  const [downPayment, setDownPayment] = useState<number>(0);
  const [downPaymentMethod, setDownPaymentMethod] = useState<PaymentMethod>('PIX');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [creditNotes, setCreditNotes] = useState<string>('');

  // Finished state for WhatsApp sharing
  const [createdReceivable, setCreatedReceivable] = useState<AccountReceivable | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const remainingCredit = Math.max(0, totalAmount - (Number(downPayment) || 0));

  const handleConfirm = () => {
    setError('');
    setLoading(true);

    try {
      if (deliveryMode === 'FULL') {
        // Entregar com pagamento integral à vista
        StorageService.deliverAndPayOrder(order.id, fullPaymentMethod, currentUser?.name, 'Entregue com pagamento integral.');
        const updated = StorageService.getOrders().find((o) => o.id === order.id) || order;
        onSuccess(updated);
        onClose();
      } else {
        // Entregar A Prazo
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
    if (!createdReceivable && deliveryMode === 'FULL') {
      const phone = cleanPhoneForWhatsApp(order.customerWhatsapp || order.customerPhone);
      const text = encodeURIComponent(
        `👋 Olá, *${order.customerName}*! Sua OS #${order.orderNumber} (${order.brand} ${order.model}) foi concluída e entregue com sucesso! 🎉\n\nValor Pago: *${formatCurrency(order.totalPrice)}* (${fullPaymentMethod})\n\nMuito obrigado pela preferência! 🤝🚀`
      );
      openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`);
      return;
    }

    if (createdReceivable) {
      const phone = cleanPhoneForWhatsApp(createdReceivable.customerPhone || order.customerWhatsapp || order.customerPhone);
      const msg = generateReceivableWhatsAppMessage({
        customerName: createdReceivable.customerName,
        referenceNumber: createdReceivable.referenceNumber,
        deviceInfo: createdReceivable.deviceInfo,
        totalAmount: createdReceivable.originalAmount || totalAmount,
        paidAmount: createdReceivable.paidAmount || 0,
        remainingAmount: createdReceivable.remainingAmount || 0,
        dueDate: createdReceivable.dueDate,
        companyName: companySettings.commercialName || companySettings.name,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Concluir Entrega da OS #{order.orderNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Selecione a forma de pagamento ou envie para o módulo A Prazo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-sm flex-1">
          {/* Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <User size={13} className="text-teal-400" /> Cliente
              </span>
              <p className="font-semibold text-white truncate">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-xs text-slate-400">{formatPhone(order.customerPhone)}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Smartphone size={13} className="text-cyan-400" /> Aparelho
              </span>
              <p className="font-semibold text-white truncate">
                {order.brand} {order.model}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {order.performedService || order.requestedService || 'Reparo técnico'}
              </p>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Valor Total a Pagar:</span>
              <span className="text-xl font-extrabold text-teal-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {isCompleted ? (
            /* Completed Screen with WhatsApp Action */
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">OS Entregue com Sucesso!</h3>
                <p className="text-slate-300 text-xs mt-1">
                  O débito foi lançado no <strong className="text-teal-400">Setor A Prazo</strong> do cliente{' '}
                  <strong className="text-white">{order.customerName}</strong>.
                </p>
              </div>

              {createdReceivable && (
                <div className="p-4 rounded-xl bg-slate-800/80 border border-teal-500/30 text-left space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Valor Original:</span>
                    <span className="text-slate-200 font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  {createdReceivable.downPayment && createdReceivable.downPayment > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Entrada Paga Agora:</span>
                      <span className="font-bold">{formatCurrency(createdReceivable.downPayment)} ({createdReceivable.downPaymentMethod})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-700 font-bold text-white">
                    <span>Saldo Restante no A Prazo:</span>
                    <span className="text-amber-400">{formatCurrency(createdReceivable.remainingAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Data de Vencimento:</span>
                    <span className="text-slate-200">{formatDate(createdReceivable.dueDate)}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
                >
                  <Send size={18} />
                  Enviar Extrato com Emojis no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            /* Mode Selection */
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Como o cliente irá pagar esta entrega?
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('FULL')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    deliveryMode === 'FULL'
                      ? 'bg-teal-600/20 border-teal-500 text-white ring-2 ring-teal-500/40 font-semibold'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Banknote size={24} className={deliveryMode === 'FULL' ? 'text-teal-400' : 'text-slate-500'} />
                  <div>
                    <p className="text-sm font-bold">À Vista / Integral</p>
                    <p className="text-[11px] opacity-80">Quita e lança 100% no caixa</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode('CREDIT')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    deliveryMode === 'CREDIT'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/40 font-semibold'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Clock size={24} className={deliveryMode === 'CREDIT' ? 'text-amber-400' : 'text-slate-500'} />
                  <div>
                    <p className="text-sm font-bold">A Prazo / Fiado</p>
                    <p className="text-[11px] opacity-80">Entrada opcional + Setor A Prazo</p>
                  </div>
                </button>
              </div>

              {/* Mode: FULL PAYMENT */}
              {deliveryMode === 'FULL' && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 animate-in fade-in">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-teal-400" /> Forma de Pagamento Recebida:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'PIX', label: 'PIX', icon: '⚡' },
                      { id: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
                      { id: 'CARTAO_CREDITO', label: 'Cartão Crédito', icon: '💳' },
                      { id: 'CARTAO_DEBITO', label: 'Cartão Débito', icon: '💳' },
                      { id: 'TRANSFERENCIA', label: 'Transferência', icon: '🏦' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFullPaymentMethod(opt.id as PaymentMethod)}
                        className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                          fullPaymentMethod === opt.id
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 ring-1 ring-teal-500'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    O valor integral de <strong>{formatCurrency(totalAmount)}</strong> será contabilizado no caixa ativo e a OS será marcada como Entregue e Paga.
                  </p>
                </div>
              )}

              {/* Mode: A PRAZO / FIADO */}
              {deliveryMode === 'CREDIT' && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-amber-500/30 space-y-4 animate-in fade-in">
                  <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Esta OS será movida para o <strong>Setor A Prazo</strong> do cliente. Você pode registrar uma entrada agora (opcional) e o restante poderá ser pago em parcelas ou quitações parciais.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Entrada Opcional */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                        <DollarSign size={13} className="text-emerald-400" /> Valor de Entrada (Opcional):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalAmount}
                          value={downPayment || ''}
                          placeholder="0,00 (Sem entrada)"
                          onChange={(e) => setDownPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Forma de Pagamento da Entrada (Se houver) */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                        <CreditCard size={13} className="text-teal-400" /> Meio de Pagamento da Entrada:
                      </label>
                      <select
                        disabled={!downPayment || downPayment <= 0}
                        value={downPaymentMethod}
                        onChange={(e) => setDownPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      >
                        <option value="PIX">PIX</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                        <option value="CARTAO_DEBITO">Cartão de Débito</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                      </select>
                    </div>
                  </div>

                  {/* Data de Vencimento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                        <Calendar size={13} className="text-cyan-400" /> Prazo / Data de Vencimento:
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Resumo do Débito Restante */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700 flex flex-col justify-center">
                      <span className="text-[11px] text-slate-400">Saldo que vai para o A Prazo:</span>
                      <span className="text-lg font-extrabold text-amber-400">
                        {formatCurrency(remainingCredit)}
                      </span>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">
                      Observações / Acordo do Prazo (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Combinou de pagar dia 10 quando receber o salário..."
                      value={creditNotes}
                      onChange={(e) => setCreditNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {loading ? (
                    'Processando...'
                  ) : deliveryMode === 'FULL' ? (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar Entrega e Pagamento
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
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
