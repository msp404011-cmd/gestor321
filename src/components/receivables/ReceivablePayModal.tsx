import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Send,
  Plus,
  Trash2,
  Info,
  FileText,
} from 'lucide-react';
import { AccountReceivable, PaymentMethod } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatPhone,
  cleanPhoneForWhatsApp,
  generateReceivableWhatsAppMessage,
  openWhatsAppLink,
  getPaymentMethodLabel,
} from '../../services/formatters';

interface ReceivablePayModalProps {
  isOpen: boolean;
  receivable: AccountReceivable | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentRow {
  id: string;
  method: PaymentMethod | string;
  amount: number | string;
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
  const customPaymentMethods = StorageService.getCustomPaymentMethods();

  const remaining = Number(receivable.remainingAmount ?? receivable.amount) || 0;
  const original = Number(receivable.originalAmount ?? (remaining + (receivable.paidAmount || 0))) || remaining;
  const paid = Number(receivable.paidAmount || 0);

  // Default payment rows: Start with 1 empty row so input has NO zero prefilled!
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(() => [
    { id: 'prow-1', method: 'PIX', amount: '' },
  ]);

  const [notes, setNotes] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastPaymentsRecorded, setLastPaymentsRecorded] = useState<{ amount: number; method: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset payment rows whenever receivable opens or changes
  useEffect(() => {
    setPaymentRows([{ id: 'prow-1', method: 'PIX', amount: '' }]);
    setIsCompleted(false);
    setError('');
    setNotes('');
  }, [receivable?.id, remaining]);

  // Available Payment Options (Deduplicated automatically)
  const allPaymentOptions = StorageService.getDeduplicatedPaymentOptions();

  // Interactive sum calculation
  const sumPaid = paymentRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  const diffFromDebt = remaining - sumPaid;

  // Handlers for payment rows
  const handleUpdateRowMethod = (id: string, method: string) => {
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, method } : row))
    );
  };

  const handleUpdateRowAmount = (id: string, amountVal: string) => {
    const rawNum = amountVal === '' ? '' : Math.max(0, parseFloat(amountVal) || 0);
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount: rawNum } : row))
    );
  };

  const handleAddPaymentRow = () => {
    const unusedOpt =
      allPaymentOptions.find((opt) => !paymentRows.some((r) => r.method === opt.id))?.id ||
      'DINHEIRO';
    const newId = 'prow-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    setPaymentRows((prev) => [
      ...prev,
      { id: newId, method: unusedOpt, amount: '' },
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
    const needed = Math.max(0, remaining - otherSum);
    handleUpdateRowAmount(id, needed.toString());
  };

  const handlePay = () => {
    setError('');

    const activeSplits = paymentRows
      .filter((r) => Number(r.amount) > 0)
      .map((r) => ({
        paymentMethod: r.method,
        amount: Number(r.amount),
      }));

    if (activeSplits.length === 0) {
      setError('Informe ao menos um valor de pagamento maior que zero.');
      return;
    }

    if (sumPaid > remaining + 0.01) {
      setError(`O valor total digitado (${formatCurrency(sumPaid)}) supera o saldo devedor de ${formatCurrency(remaining)}.`);
      return;
    }

    setLoading(true);

    try {
      StorageService.payReceivable({
        receivableId: receivable.id,
        amount: sumPaid,
        paymentMethod: activeSplits[0].paymentMethod as PaymentMethod,
        notes,
        userName: currentUser?.name,
        splitPayments: activeSplits,
      });

      setLastPaymentsRecorded(activeSplits);
      setIsCompleted(true);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar baixa de débito.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const phone = cleanPhoneForWhatsApp(receivable.customerPhone);
    const totalNewPaidThisTurn = lastPaymentsRecorded.reduce((acc, p) => acc + p.amount, 0);
    const newPaid = paid + totalNewPaidThisTurn;
    const newRemaining = Math.max(0, original - newPaid);

    let paymentsList = receivable.payments || [];
    if (lastPaymentsRecorded.length > 0) {
      for (const rec of lastPaymentsRecorded) {
        paymentsList = [
          ...paymentsList,
          {
            id: 'temp-' + Date.now() + Math.random(),
            amount: rec.amount,
            paymentMethod: rec.method as PaymentMethod,
            date: new Date().toISOString(),
            userName: currentUser?.name || '',
          },
        ];
      }
    }

    const primaryLastRecorded = lastPaymentsRecorded[0];

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
      lastPaymentAmount: totalNewPaidThisTurn,
      lastPaymentMethod: primaryLastRecorded?.method || 'PIX',
      createdAt: receivable.createdAt,
      serviceDescription: receivable.serviceDescription,
      payments: paymentsList,
    });

    openWhatsAppLink(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`);
  };

  const debtDescriptionText =
    receivable.serviceDescription ||
    receivable.deviceInfo ||
    `Débito Ref: ${receivable.referenceNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header Compacto (Sem Rolar) */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Dar Baixa no Débito A Prazo
              </h2>
              <p className="text-[11px] text-slate-400">{receivable.referenceNumber} • {receivable.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 space-y-3 text-slate-200 text-xs flex-1 overflow-y-auto">
          {/* Card Resumo do Débito */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="p-2 bg-slate-900/90 border border-teal-500/30 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1 mb-0.5">
                <FileText size={11} /> Descrição / Referência do Débito:
              </span>
              <p className="text-xs font-semibold text-white">
                {debtDescriptionText}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
                <span>Cliente: <strong className="text-slate-200">{receivable.customerName}</strong></span>
                {receivable.customerPhone && (
                  <span>Tel: <strong className="text-slate-200">{formatPhone(receivable.customerPhone)}</strong></span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Total Original:</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{formatCurrency(original)}</span>
              </div>
              <div className="p-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Já Amortizado:</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(paid)}</span>
              </div>
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="text-[10px] text-amber-300 font-bold block">Débito Restante:</span>
                <span className="text-xs font-extrabold text-amber-400 font-mono">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>

          {isCompleted ? (
            /* Success Screen */
            <div className="py-3 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Baixa Registrada com Sucesso!</h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  Lançamento de <strong className="text-emerald-400 font-mono">{formatCurrency(lastPaymentsRecorded.reduce((a, b) => a + b.amount, 0))}</strong> realizado no caixa.
                </p>
              </div>

              <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Detalhamento dos Recebimentos:</span>
                {lastPaymentsRecorded.map((p, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0">
                    <span>{getPaymentMethodLabel(p.method)}:</span>
                    <strong className="text-emerald-400 font-mono">{formatCurrency(p.amount)}</strong>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-slate-700 flex justify-between font-bold">
                  <span>Novo Saldo Restante:</span>
                  <strong className="text-amber-400 font-mono">
                    {formatCurrency(Math.max(0, remaining - lastPaymentsRecorded.reduce((a, b) => a + b.amount, 0)))}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send size={16} />
                  Enviar Comprovante WhatsApp
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
            /* Payment Input Form */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <label className="text-[11px] font-bold text-white flex items-center gap-1 uppercase tracking-wide">
                  <CreditCard size={14} className="text-emerald-400" /> Forma de Pagamento
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
                      <span className="font-bold text-emerald-400">
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
                      <div className="col-span-7">
                        <select
                          value={row.method}
                          onChange={(e) => handleUpdateRowMethod(row.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
                        >
                          {allPaymentOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-5 relative flex items-center gap-1">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remaining}
                            placeholder=""
                            value={row.amount === '' || row.amount === 0 ? '' : row.amount}
                            onChange={(e) => handleUpdateRowAmount(row.id, e.target.value)}
                            className="w-full pl-7 pr-1.5 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-lg text-white text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFillRemainingInRow(row.id)}
                          className="shrink-0 px-1.5 py-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 border border-slate-700 rounded-lg text-[10px] font-semibold"
                          title="Preencher restante"
                        >
                          Restante
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opção de Adicionar Mais */}
              <button
                type="button"
                onClick={handleAddPaymentRow}
                className="w-full py-2 px-3 bg-slate-900/80 hover:bg-slate-800 border border-dashed border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={15} className="text-emerald-400" />
                <span>+ Adicionar Outra Forma de Pagamento</span>
              </button>

              {/* Observação */}
              <div>
                <input
                  type="text"
                  placeholder="Observação do Recebimento (opcional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Painel de Abatimento ao Vivo */}
              <div className="p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-medium">Saldo Devedor do Débito:</span>
                  <span className="font-mono font-bold text-amber-400">{formatCurrency(remaining)}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                    Detalhamento do Abatimento:
                  </span>
                  {paymentRows.map((r) => {
                    const amt = Number(r.amount) || 0;
                    return (
                      <div key={r.id} className="flex justify-between items-center text-[11px] text-slate-300">
                        <span>Abatido via {getPaymentMethodLabel(r.method)}:</span>
                        <strong className="font-mono text-emerald-400">{formatCurrency(amt)}</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">Total Abatido nesta Operação:</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(sumPaid)}</span>
                  </div>

                  {sumPaid >= remaining ? (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span>🎉 DÉBITO 100% QUITADO!</span>
                      <span className="font-mono">Restante: R$ 0,00</span>
                    </div>
                  ) : sumPaid > 0 ? (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold flex items-center justify-between">
                      <span>⏳ Abatimento Parcial. Falta:</span>
                      <span className="font-mono text-amber-400">{formatCurrency(remaining - sumPaid)}</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-xs text-center font-medium">
                      Informe os valores nas formas de pagamento para dar a baixa.
                    </div>
                  )}
                </div>
              </div>

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
                  onClick={handlePay}
                  disabled={loading || sumPaid <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                >
                  {loading ? (
                    'Salvando...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Confirmar Baixa de {formatCurrency(sumPaid)}
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
