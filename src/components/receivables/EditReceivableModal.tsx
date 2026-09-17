import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  DollarSign,
  Calendar,
  Smartphone,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import { AccountReceivable } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatPhone } from '../../services/formatters';

interface EditReceivableModalProps {
  isOpen: boolean;
  receivable: AccountReceivable;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditReceivableModal: React.FC<EditReceivableModalProps> = ({
  isOpen,
  receivable,
  onClose,
  onSuccess
}) => {
  const [customerName, setCustomerName] = useState(receivable.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(receivable.customerPhone || '');
  const [deviceInfo, setDeviceInfo] = useState(receivable.deviceInfo || '');
  const [serviceDescription, setServiceDescription] = useState(receivable.serviceDescription || '');
  const [originalAmount, setOriginalAmount] = useState<string>(
    String(receivable.originalAmount ?? receivable.amount ?? '')
  );
  const [dueDate, setDueDate] = useState<string>(receivable.dueDate || '');
  const [notes, setNotes] = useState(receivable.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && receivable) {
      setCustomerName(receivable.customerName || '');
      setCustomerPhone(receivable.customerPhone || '');
      setDeviceInfo(receivable.deviceInfo || '');
      setServiceDescription(receivable.serviceDescription || '');
      const orig = receivable.originalAmount ?? (Number(receivable.remainingAmount ?? receivable.amount) + (receivable.paidAmount || 0));
      setOriginalAmount(String(orig || ''));
      setDueDate(receivable.dueDate || '');
      setNotes(receivable.notes || '');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, receivable]);

  if (!isOpen) return null;

  const paidSoFar = Number(receivable.paidAmount || 0);
  const numOriginal = parseFloat(originalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const newRemainingDebt = Math.max(0, numOriginal - paidSoFar);

  const setQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError('Por favor, informe o nome do cliente devedor.');
      return;
    }

    if (numOriginal <= 0) {
      setError('O valor total do fiado deve ser maior que zero.');
      return;
    }

    if (numOriginal < paidSoFar) {
      setError(`O novo valor total (R$ ${numOriginal.toFixed(2)}) não pode ser menor que o valor já amortizado (R$ ${paidSoFar.toFixed(2)}).`);
      return;
    }

    if (!dueDate) {
      setError('Por favor, selecione uma data de vencimento.');
      return;
    }

    try {
      setIsSaving(true);

      const updatedReceivable: AccountReceivable = {
        ...receivable,
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        deviceInfo: deviceInfo.trim() || 'Aparelho / Avulso',
        serviceDescription: serviceDescription.trim() || 'Lançamento de fiado',
        originalAmount: numOriginal,
        remainingAmount: newRemainingDebt,
        amount: newRemainingDebt,
        status: newRemainingDebt === 0 ? 'PAGO' : 'PENDENTE',
        paidAt: newRemainingDebt === 0 ? (receivable.paidAt || new Date().toISOString()) : undefined,
        dueDate,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      StorageService.updateReceivable(updatedReceivable);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao editar fiado:', err);
      setError(err?.message || 'Erro ao atualizar dados do fiado.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Editar Fiado & Débito <span className="text-amber-400 font-mono text-xs">({receivable.referenceNumber})</span>
              </h2>
              <p className="text-xs text-amber-400/80">
                Altere informações cadastrais, valores, aparelho ou data de vencimento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Cliente */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
            <label className="block font-bold text-slate-200">
              Identificação do Cliente <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Nome do Cliente</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">WhatsApp / Celular</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Aparelho e Descrição do Débito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-200">
                Aparelho ou Referência
              </label>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ex: iPhone 11, Samsung A32..."
                  value={deviceInfo}
                  onChange={(e) => setDeviceInfo(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-200">
                Motivo / Serviço / Itens do Fiado
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ex: Troca de tela, Acessórios..."
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Valores */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Valor Total Original */}
              <div className="space-y-1">
                <label className="block font-bold text-white">
                  Valor Total do Débito <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">R$</span>
                  <input
                    type="text"
                    required
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-sm font-bold text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Já Abatido / Pago */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-400">
                  Já Abatido / Pago
                </label>
                <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-right flex flex-col justify-center h-[38px]">
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {formatCurrency(paidSoFar)}
                  </span>
                </div>
              </div>

              {/* Saldo Devedor Restante Calculado */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">
                  Novo Saldo Restante
                </label>
                <div className="p-2 bg-amber-950/40 border border-amber-500/40 rounded-xl text-right flex flex-col justify-center h-[38px]">
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {formatCurrency(newRemainingDebt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Data de Vencimento com Atalhos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-200">
                Data de Vencimento <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDueDate(15)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded cursor-pointer"
                >
                  +15 dias
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(30)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 rounded cursor-pointer font-bold"
                >
                  +30 dias
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(60)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded cursor-pointer"
                >
                  +60 dias
                </button>
              </div>
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Observações */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-300">Observações Adicionais</label>
            <textarea
              rows={2}
              placeholder="Anotações sobre a negociação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
