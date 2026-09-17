import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  User,
  DollarSign,
  Calendar,
  Smartphone,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Customer, PaymentMethod } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatPhone } from '../../services/formatters';

interface ManualReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ManualReceivableModal: React.FC<ManualReceivableModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Manual fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [downPaymentMethod, setDownPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomers(StorageService.getCustomers());
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.cpfCnpj && c.cpfCnpj.includes(q))
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerSearch(c.name);
    setIsCustomerDropdownOpen(false);
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerSearch('');
  };

  const setQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const numTotal = parseFloat(totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const numDown = parseFloat(downPayment.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const remainingDebt = Math.max(0, numTotal - numDown);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalName = selectedCustomer ? selectedCustomer.name : customerName.trim();
    if (!finalName) {
      setError('Por favor, informe o nome do cliente devedor.');
      return;
    }

    if (numTotal <= 0) {
      setError('Por favor, informe um valor total válido para o fiado (maior que zero).');
      return;
    }

    if (numDown > numTotal) {
      setError('O valor da entrada não pode ser maior do que o valor total do fiado.');
      return;
    }

    if (!dueDate) {
      setError('Por favor, defina a data de vencimento da dívida.');
      return;
    }

    try {
      setIsSaving(true);
      StorageService.addManualReceivable({
        customerId: selectedCustomer?.id,
        customerName: finalName,
        customerPhone: selectedCustomer?.phone || customerPhone.trim(),
        deviceInfo: deviceInfo.trim() || 'Aparelho / Avulso',
        serviceDescription: serviceDescription.trim() || 'Lançamento manual de fiado',
        amount: numTotal,
        downPayment: numDown > 0 ? numDown : undefined,
        downPaymentMethod: numDown > 0 ? downPaymentMethod : undefined,
        dueDate,
        notes: notes.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao adicionar fiado manual:', err);
      setError(err?.message || 'Erro ao registrar fiado. Verifique os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Novo Fiado / Adicionar Cliente Devedor
              </h2>
              <p className="text-xs text-amber-400/80">
                Lançamento manual de conta a prazo com sincronização na Nuvem
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
          <div className="space-y-1.5" ref={searchRef}>
            <label className="block font-bold text-slate-200">
              Cliente Devedor <span className="text-rose-400">*</span>
            </label>

            {selectedCustomer ? (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs truncate">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-[11px] text-slate-400">{formatPhone(selectedCustomer.phone)}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedCustomer}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 bg-rose-950/40 rounded-lg cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar cliente existente ou digitar novo nome..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerName(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />

                  {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-amber-950/40 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-white text-xs">{c.name}</p>
                            {c.phone && <p className="text-[10px] text-slate-400">{formatPhone(c.phone)}</p>}
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                            Selecionar
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Telefone para cliente manual */}
                {!selectedCustomer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Nome do cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">WhatsApp / Celular (Opcional)</label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Aparelho e Descrição do Débito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-200">
                Aparelho ou Referência (Opcional)
              </label>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ex: iPhone 11, Samsung A32, Balcão..."
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
                  placeholder="Ex: Troca de tela, Capinha + Película..."
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Valores e Entrada */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Valor Total */}
              <div className="space-y-1">
                <label className="block font-bold text-white">
                  Valor Total do Fiado <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">R$</span>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-sm font-bold text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Entrada Inicial */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">
                  Entrada Paga no Ato (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Saldo Restante a Receber */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300">
                  Saldo Devedor Restante
                </label>
                <div className="p-2 bg-amber-950/40 border border-amber-500/40 rounded-xl text-right flex flex-col justify-center h-[38px]">
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {formatCurrency(remainingDebt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Se houver entrada paga, pergunta a forma de pagamento da entrada */}
            {numDown > 0 && (
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Forma de Pagamento da Entrada:
                </span>
                <select
                  value={downPaymentMethod}
                  onChange={(e) => setDownPaymentMethod(e.target.value as PaymentMethod)}
                  className="px-2 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="DINHEIRO">💵 Dinheiro</option>
                  <option value="PIX">⚡ PIX</option>
                  <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                  <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                </select>
              </div>
            )}
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
              placeholder="Anotações sobre a negociação, garantias combinadas, etc..."
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
              <span>{isSaving ? 'Salvando...' : 'Lançar Fiado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
