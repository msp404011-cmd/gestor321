import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Send,
  User,
  Smartphone,
  Calendar,
  Info,
  Clock,
  Receipt,
} from 'lucide-react';
import { AccountReceivable, PaymentMethod } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  cleanPhoneForWhatsApp,
  generateReceivableWhatsAppMessage,
  openWhatsAppLink,
} from '../../services/formatters';

interface ReceivablePayModalProps {
  isOpen: boolean;
  receivable: AccountReceivable | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceivablePayModal: React.FC<ReceivablePayModalProps> = ({
  isOpen,
  receivable,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !receivable) return null;

  const companySettings = StorageService.getCompanySettings();
  const currentUser = StorageService.getCurrentUser();

  const remaining = Number(receivable.remainingAmount ?? receivable.amount) || 0;
  const original = Number(receivable.originalAmount ?? (remaining + (receivable.paidAmount || 0))) || remaining;
  const paid = Number(receivable.paidAmount || 0);

  const [payAmount, setPayAmount] = useState<number>(remaining);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastPaymentRecorded, setLastPaymentRecorded] = useState<{ amount: number; method: PaymentMethod } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = () => {
    setError('');
    if (payAmount <= 0) {
      setError('Informe um valor de pagamento maior que zero.');
      return;
    }

    if (payAmount > remaining) {
      setError(`O valor de pagamento não pode ser maior que o saldo restante (${formatCurrency(remaining)}).`);
      return;
    }

    setLoading(true);

    try {
      StorageService.payReceivable({
        receivableId: receivable.id,
        amount: payAmount,
        paymentMethod,
        notes,
        userName: currentUser?.name,
      });

      setLastPaymentRecorded({ amount: payAmount, method: paymentMethod });
      setIsCompleted(true);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar baixa.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const phone = cleanPhoneForWhatsApp(receivable.customerPhone);
    const newPaid = paid + (lastPaymentRecorded?.amount || 0);
    const newRemaining = Math.max(0, original - newPaid);

    let paymentsList = receivable.payments || [];
    if (lastPaymentRecorded) {
      const alreadyHasIt = paymentsList.some(
        (p) => p.amount === lastPaymentRecorded.amount && p.paymentMethod === lastPaymentRecorded.method
      );
      if (!alreadyHasIt) {
        paymentsList = [
          ...paymentsList,
          {
            id: 'temp-' + Date.now(),
            amount: lastPaymentRecorded.amount,
            paymentMethod: lastPaymentRecorded.method,
            date: new Date().toISOString(),
            userName: '',
          },
        ];
      }
    }

    const msg = generateReceivableWhatsAppMessage({
      customerName: receivable.customerName,
      referenceNumber: receivable.referenceNumber,
      deviceInfo: receivable.deviceInfo,
      totalAmount: original,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      dueDate: receivable.dueDate,
      companyName: companySettings.commercialName || companySettings.name,
      companyPhone: companySettings.whatsapp || companySettings.phone,
      pixKey: companySettings.pixKey,
      lastPaymentAmount: lastPaymentRecorded?.amount,
      lastPaymentMethod: lastPaymentRecorded?.method,
      createdAt: receivable.createdAt,
      serviceDescription: receivable.serviceDescription,
      payments: paymentsList,
    });

    openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dar Baixa no Débito A Prazo
              </h2>
              <p className="text-xs text-slate-400">{receivable.referenceNumber} • {receivable.customerName}</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-sm flex-1">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Cliente:</span>
              <span className="font-semibold text-white truncate block">{receivable.customerName}</span>
              {receivable.customerPhone && (
                <span className="text-slate-400">{formatPhone(receivable.customerPhone)}</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Referência:</span>
              <span className="font-semibold text-teal-400">{receivable.referenceNumber}</span>
              {receivable.deviceInfo && (
                <span className="text-slate-400 truncate block">{receivable.deviceInfo}</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <span className="text-slate-400">Total Original:</span>
              <p className="font-bold text-slate-200">{formatCurrency(original)}</p>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <span className="text-slate-400">Já Amortizado:</span>
              <p className="font-bold text-emerald-400">{formatCurrency(paid)}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Saldo Devedor Atual:</span>
              <span className="text-xl font-extrabold text-amber-400">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {isCompleted ? (
            /* Success & WhatsApp Screen */
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Baixa Registrada com Sucesso!</h3>
                <p className="text-slate-300 text-xs mt-1">
                  O valor de <strong className="text-emerald-400">{formatCurrency(lastPaymentRecorded?.amount)}</strong> foi lançado no caixa ativo da loja.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Novo Saldo Restante:</span>
                  <strong className="text-amber-400">
                    {formatCurrency(Math.max(0, remaining - (lastPaymentRecorded?.amount || 0)))}
                  </strong>
                </div>
                {remaining - (lastPaymentRecorded?.amount || 0) <= 0 && (
                  <p className="text-emerald-400 font-bold text-center pt-1">🎉 Conta Totalmente Quitada!</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
                >
                  <Send size={18} />
                  Enviar Comprovante / Extrato no WhatsApp
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
            /* Payment Input Form */
            <div className="space-y-4">
              {/* Valor a Pagar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Valor a Receber / Dar Baixa (R$):
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(remaining)}
                    className="text-[11px] text-teal-400 hover:underline font-medium"
                  >
                    Quitar Tudo ({formatCurrency(remaining)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Math.min(remaining, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Forma de Pagamento Recebida:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'PIX', label: 'PIX', icon: '⚡' },
                    { id: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
                    { id: 'CARTAO_CREDITO', label: 'Crédito', icon: '💳' },
                    { id: 'CARTAO_DEBITO', label: 'Débito', icon: '💳' },
                    { id: 'TRANSFERENCIA', label: 'Transferência', icon: '🏦' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        paymentMethod === opt.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 font-bold'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Observação do Recebimento (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagou metade em dinheiro no balcão..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Saldo Restante pós baixa */}
              <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Saldo Restante após este pagamento:</span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {formatCurrency(Math.max(0, remaining - payAmount))}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={loading || payAmount <= 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar Baixa de {formatCurrency(payAmount)}
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
