import React, { useState } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Reseller } from '../../types';
import { StorageService } from '../../services/storage';

interface ResellerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: Reseller | null;
  onPaymentCompleted?: (transactionId: string) => void;
}

export const ResellerPaymentModal: React.FC<ResellerPaymentModalProps> = ({
  isOpen,
  onClose,
  reseller,
  onPaymentCompleted,
}) => {
  if (!isOpen || !reseller) return null;

  const currentBalance = Number(reseller.balance) || 0;
  const [amount, setAmount] = useState<number | ''>(currentBalance > 0 ? currentBalance : '');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const numAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
  const remainingBalance = Math.max(0, currentBalance - numAmount);

  const handlePayFull = () => {
    setAmount(currentBalance);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
    if (finalAmount <= 0) {
      setErrorMsg('Informe um valor de pagamento válido.');
      return;
    }

    try {
      const currentUser = StorageService.getCurrentUser();
      const result = StorageService.createResellerPayment({
        resellerId: reseller.id,
        amount: Number(amount),
        paymentMethod,
        notes: notes.trim() || undefined,
        userName: currentUser?.name || 'Operador',
      });

      if (onPaymentCompleted) {
        onPaymentCompleted(result.transaction.id);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar pagamento.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1328] border border-emerald-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081023]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Receber Pagamento / Acerto de Contas
              </h2>
              <p className="text-xs text-slate-400">
                Revendedor: <span className="text-white font-bold">{reseller.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Balance Display */}
          <div className="p-3.5 rounded-xl bg-[#070e20] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">
                Saldo Devedor Atual
              </span>
              <span className="text-lg font-black text-rose-400">
                R$ {currentBalance.toFixed(2)}
              </span>
            </div>
            {currentBalance > 0 && (
              <button
                type="button"
                onClick={handlePayFull}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Quitar Total (R$ {currentBalance.toFixed(2)})
              </button>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Valor do Pagamento (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                placeholder="0,00"
                onChange={(e) => {
                  setErrorMsg('');
                  const val = e.target.value;
                  setAmount(val === '' ? '' : parseFloat(val));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070e20] border border-slate-700 rounded-xl text-base font-black text-emerald-400 focus:outline-hidden focus:border-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'PIX', label: 'PIX' },
                { id: 'DINHEIRO', label: 'Dinheiro' },
                { id: 'CARTAO_DEBITO', label: 'Débito' },
                { id: 'CARTAO_CREDITO', label: 'Crédito' },
                { id: 'TRANSFERENCIA', label: 'TED / Transf.' },
                { id: 'BOLETO', label: 'Boleto' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    paymentMethod === m.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-[#070e20] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações / Comprovante
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento referente a remessas anteriores via chave PIX CNPJ..."
              className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Result preview */}
          <div className="p-3 rounded-lg bg-[#070e20] border border-slate-800/80 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Saldo anterior:</span>
              <span className="font-bold text-white">R$ {currentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Pagamento informado:</span>
              <span className="font-bold">- R$ {amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-white pt-1 border-t border-slate-800">
              <span>Novo Saldo Devedor Restante:</span>
              <span className={remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                R$ {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
