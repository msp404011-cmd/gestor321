import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CreditCard,
  Calendar,
  Building2,
  Home,
  Save,
  DollarSign,
  CheckCircle2,
  Tag,
  Clock,
  Wallet,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expenseToEdit?: Expense | null;
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'ALUGUEL', label: 'Aluguel Comercial' },
  { value: 'ENERGIA_AGUA', label: 'Energia Elétrica / Água' },
  { value: 'INTERNET_TELEFONE', label: 'Internet / Telefone' },
  { value: 'FORNECEDORES', label: 'Fornecedores (Peças / Estoque)' },
  { value: 'FERRAMENTAS_EQUIPAMENTOS', label: 'Ferramentas / Equipamentos' },
  { value: 'SALARIOS_COMISSOES', label: 'Salários e Comissões' },
  { value: 'IMPOSTOS', label: 'Impostos e Taxas (DAS/NFe)' },
  { value: 'SOFTWARE_SISTEMAS', label: 'Sistemas / Licenças / Software' },
  { value: 'MARKETING', label: 'Marketing e Anúncios' },
  { value: 'OUTROS', label: 'Outras Despesas' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'PIX (Instantâneo)' },
  { value: 'DINHEIRO', label: 'Dinheiro em Espécie (Caixa)' },
  { value: 'TRANSFERENCIA', label: 'Depósito / Transferência (TED)' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'BOLETO', label: 'Boleto Bancário' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}) => {
  const { isDark } = useTheme();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState<string>('2026-09-08');
  const [expenseScope, setExpenseScope] = useState<'LOJA' | 'CASA'>('LOJA');
  const [category, setCategory] = useState<ExpenseCategory>('OUTROS');

  // Parcelamento
  const [isInstallment, setIsInstallment] = useState<boolean>(false);
  const [installmentNumber, setInstallmentNumber] = useState<number | ''>(1);
  const [totalInstallments, setTotalInstallments] = useState<number | ''>(6);

  // Status & Pagamento
  const [status, setStatus] = useState<'PENDENTE' | 'PAGO'>('PENDENTE');
  const [paymentDate, setPaymentDate] = useState<string>('2026-09-08');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState<string>('');

  const currentUser = StorageService.getCurrentUser();

  useEffect(() => {
    if (isOpen) {
      const todayIso = new Date().toISOString().split('T')[0];
      if (expenseToEdit) {
        setDescription(expenseToEdit.description || '');
        setAmount(expenseToEdit.amount || '');
        setDueDate(expenseToEdit.dueDate ? expenseToEdit.dueDate.split('T')[0] : todayIso);
        setExpenseScope(expenseToEdit.expenseScope || (expenseToEdit.notes?.includes('CASA') ? 'CASA' : 'LOJA'));
        setCategory(expenseToEdit.category || 'OUTROS');
        setIsInstallment(expenseToEdit.isInstallment || false);
        setInstallmentNumber(expenseToEdit.installmentNumber || 1);
        setTotalInstallments(expenseToEdit.totalInstallments || 6);
        setStatus(expenseToEdit.status || 'PENDENTE');
        setPaymentDate(expenseToEdit.paymentDate ? expenseToEdit.paymentDate.split('T')[0] : todayIso);
        setPaymentMethod(expenseToEdit.paymentMethod || 'PIX');
        setNotes(expenseToEdit.notes || '');
      } else {
        setDescription('');
        setAmount('');
        setDueDate(todayIso);
        setExpenseScope('LOJA');
        setCategory('OUTROS');
        setIsInstallment(false);
        setInstallmentNumber(1);
        setTotalInstallments(6);
        setStatus('PENDENTE');
        setPaymentDate(todayIso);
        setPaymentMethod('PIX');
        setNotes('');
      }
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Por favor, informe a descrição da despesa.');
      return;
    }

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    if (numAmount <= 0) {
      alert('Por favor, informe um valor válido maior que zero.');
      return;
    }

    const scopeLabel = expenseScope === 'LOJA' ? '[LOJA / EMPRESA]' : '[CASA / PESSOAL]';
    const parcelLabel = isInstallment ? '[PARCELADO]' : '';
    const cleanNotes = notes.trim();
    const fullNotes = [scopeLabel, parcelLabel, cleanNotes].filter(Boolean).join(' | ');

    const expense: Expense = {
      id: expenseToEdit ? expenseToEdit.id : 'exp-' + Date.now(),
      description: description.trim(),
      category: category || 'OUTROS',
      amount: numAmount,
      date: new Date(dueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      paymentDate: status === 'PAGO' ? new Date(paymentDate || dueDate).toISOString() : undefined,
      status,
      paymentMethod,
      paidFromCash: paymentMethod === 'DINHEIRO',
      responsibleName: currentUser?.name || 'Marcos Silva Pinto',
      notes: fullNotes,
      createdAt: expenseToEdit ? expenseToEdit.createdAt : new Date().toISOString(),
      expenseScope,
      isInstallment,
      installmentNumber: isInstallment ? (typeof installmentNumber === 'number' && installmentNumber > 0 ? installmentNumber : 1) : undefined,
      totalInstallments: isInstallment ? (typeof totalInstallments === 'number' && totalInstallments > 0 ? totalInstallments : 6) : undefined,
    };

    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl relative my-auto overflow-hidden transition-all ${
        isDark ? 'bg-[#081226] border-blue-900/80 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-blue-900/60 bg-[#060f21]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white leading-tight">
                {expenseToEdit ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Formulário direto de lançamento financeiro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl cursor-pointer transition-all ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-blue-900/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Compact Grid, No Scrollbar */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-2.5 overflow-hidden">
          {/* Row 1: Descrição (2 col) + Categoria (1 col) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-400" />
                <span>Descrição da Despesa</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel da Loja, Enel, Compra de Peças, Mercado Casa"
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none ${
                  isDark
                    ? 'bg-[#040a17] border-blue-900/80 text-white focus:border-blue-500 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Categoria</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none ${
                  isDark
                    ? 'bg-[#040a17] border-blue-900/80 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Valor, Vencimento & Âmbito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span>Valor (R$)</span>
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0,00"
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all focus:outline-none ${
                    isDark
                      ? 'bg-[#040a17] border-blue-900/80 text-emerald-400 focus:border-emerald-500 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Vencimento</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all focus:outline-none ${
                  isDark
                    ? 'bg-[#040a17] border-blue-900/80 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Âmbito / Origem</span>
                <span className="text-[10px] text-amber-400 font-extrabold">Loja / Casa</span>
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setExpenseScope('LOJA')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    expenseScope === 'LOJA'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-[#08142a] text-slate-400 border-blue-900/40 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span>Loja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpenseScope('CASA')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    expenseScope === 'CASA'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-[#08142a] text-slate-400 border-blue-900/40 hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span>Casa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Modalidade (Parcelado?) & Situação (Pendente vs Pago) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Box Parcelamento */}
            <div className="p-2.5 rounded-xl border bg-[#050d21] border-blue-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                    Parcelado a Prazo?
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  <span className="ml-2 text-[10px] font-bold text-amber-300 whitespace-nowrap">
                    {isInstallment ? 'Parcelado' : 'À Vista'}
                  </span>
                </label>
              </div>

              {isInstallment ? (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-900/40">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Total Parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="120"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 6"
                      className="w-full px-2 py-1 rounded-lg text-xs font-bold font-mono bg-[#020612] border border-amber-500/50 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Parcela Atual
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={typeof totalInstallments === 'number' ? totalInstallments : 120}
                      value={installmentNumber}
                      onChange={(e) => setInstallmentNumber(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 1"
                      className="w-full px-2 py-1 rounded-lg text-xs font-bold font-mono bg-[#020612] border border-amber-500/50 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  Lançamento único sem divisão de parcelas.
                </p>
              )}
            </div>

            {/* Box Status (Pendente x Pago) */}
            <div className="p-2.5 rounded-xl border bg-[#040a17] border-blue-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Situação da Despesa
                </span>
                <span className={`text-[10px] font-black uppercase ${status === 'PAGO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {status === 'PAGO' ? '🟢 Quitado' : '🟡 Pendente'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setStatus('PENDENTE')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    status === 'PENDENTE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                      : 'bg-[#08142a] text-slate-400 border-blue-900/40 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>A Vencer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('PAGO')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    status === 'PAGO'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-[#08142a] text-slate-400 border-blue-900/40 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Já Quitado</span>
                </button>
              </div>

              {status === 'PAGO' && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-900/40">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Data Pagamento
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg text-xs font-mono font-semibold bg-[#020612] border border-emerald-500/50 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Forma
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-1.5 py-1 rounded-lg text-xs font-semibold bg-[#020612] border border-emerald-500/50 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {PAYMENT_METHOD_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Observações */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais, nº de nota fiscal ou informações adicionais..."
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium border transition-all focus:outline-none ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-white focus:border-blue-500 placeholder-slate-600'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-blue-900/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-blue-900/40' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Despesa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
