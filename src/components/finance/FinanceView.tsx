import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Plus,
  Calendar,
  Wallet,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  BarChart2,
  FileText,
  Users,
  MoreVertical,
  Trash2,
  Check,
  RotateCw,
  ShoppingBag,
  CheckCircle2,
  Receipt,
  X,
  Search,
  Filter,
  Download,
  Printer,
  Sliders,
  Clock,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Expense, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../services/formatters';
import { CashSessionModal } from './CashSessionModal';
import { ExpenseModal } from './ExpenseModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useTheme } from '../../context/ThemeContext';

type FinanceTab = 'CASH' | 'EXPENSES';

interface FinanceViewProps {
  initialTab?: FinanceTab;
}

// Modal for confirming expense payment / settlement or updating payment info
const PayExpenseModal: React.FC<{
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: (data: {
    paymentDate: string;
    paymentMethod: PaymentMethod;
    debitFromCash: boolean;
    notes?: string;
  }) => void;
}> = ({ isOpen, expense, onClose, onConfirm }) => {
  const [paymentDate, setPaymentDate] = useState('2026-09-08');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [debitFromCash, setDebitFromCash] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expense) {
      const todayIso = new Date().toISOString().split('T')[0];
      const existingPaymentDate = expense.paymentDate ? expense.paymentDate.split('T')[0] : todayIso;
      setPaymentDate(existingPaymentDate);
      const initialMethod = expense.paymentMethod || 'PIX';
      setPaymentMethod(initialMethod);
      setDebitFromCash(expense.paidFromCash ?? (initialMethod === 'DINHEIRO'));
      setNotes('');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#081226] border border-blue-900/80 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-blue-900/50 cursor-pointer transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-blue-900/60">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">
              {expense.status === 'PAGO' ? 'Alterar Dados da Quitação' : 'Confirmar Quitação de Despesa'}
            </h3>
            <p className="text-xs text-slate-400">
              {expense.status === 'PAGO' ? 'Atualize a data ou meio de pagamento' : 'Marcar conta como paga no sistema'}
            </p>
          </div>
        </div>

        {/* Expense Detail Card */}
        <div className="bg-[#040a17] border border-blue-900/60 rounded-xl p-4 my-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Descrição da Conta</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
              {expense.category.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="font-bold text-sm text-white">{expense.description}</p>
          <div className="flex items-center justify-between pt-2 border-t border-blue-900/40">
            <span className="text-xs text-slate-400">Valor Quitado:</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(expense.amount)}
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm({
              paymentDate,
              paymentMethod,
              debitFromCash,
              notes,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Data Efetiva do Pagamento
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full bg-[#040a17] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Selecione a Forma de Pagamento Utilizada:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('PIX');
                  setDebitFromCash(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'PIX'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : 'bg-[#040a17] text-slate-300 border-blue-900/60 hover:bg-blue-900/30'
                }`}
              >
                <span>⚡ PIX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('DINHEIRO');
                  setDebitFromCash(true);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'DINHEIRO'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                    : 'bg-[#040a17] text-slate-300 border-blue-900/60 hover:bg-blue-900/30'
                }`}
              >
                <span>💵 Em Espécie (Caixa)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TRANSFERENCIA');
                  setDebitFromCash(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'TRANSFERENCIA'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                    : 'bg-[#040a17] text-slate-300 border-blue-900/60 hover:bg-blue-900/30'
                }`}
              >
                <span>🏦 Depósito / Transferência</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CARTAO_CREDITO');
                  setDebitFromCash(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'CARTAO_CREDITO' || paymentMethod === 'CARTAO_DEBITO'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-[#040a17] text-slate-300 border-blue-900/60 hover:bg-blue-900/30'
                }`}
              >
                <span>💳 Cartão Crédito/Débito</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="debitFromCash"
              checked={debitFromCash}
              onChange={(e) => setDebitFromCash(e.target.checked)}
              className="mt-0.5 rounded bg-[#040a17] border-blue-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="debitFromCash" className="text-xs text-slate-200 cursor-pointer select-none">
              <span className="font-bold text-emerald-400">Debitar da Gaveta do Caixa</span>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Lança automaticamente uma saída no caixa atual se ele estiver aberto.
              </p>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observação / Comprovante (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Quitado via PIX Itaú ou Autenticação nº 98123"
              className="w-full bg-[#040a17] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-900/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#040a17] hover:bg-blue-900/40 text-slate-300 text-xs font-bold rounded-xl border border-blue-900/80 cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Quitação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FinanceView: React.FC<FinanceViewProps> = ({ initialTab = 'CASH' }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [cashModalMode, setCashModalMode] = useState<'OPEN' | 'CLOSE' | 'SANGRIA' | 'SUPRIMENTO' | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expenseToPay, setExpenseToPay] = useState<Expense | null>(null);
  const [expenseSubFilter, setExpenseSubFilter] = useState<'PARCELADAS' | 'NAO_PARCELADAS' | 'ALL' | 'HISTORY'>('PARCELADAS');

  // History & Period Filters
  const [historyPeriodMode, setHistoryPeriodMode] = useState<'MONTH' | 'LAST_12_MONTHS' | 'CUSTOM'>('MONTH');
  const [historySelectedMonth, setHistorySelectedMonth] = useState<string>('2026-09'); // YYYY-MM
  const [historyStartDate, setHistoryStartDate] = useState<string>('2026-09-01');
  const [historyEndDate, setHistoryEndDate] = useState<string>('2026-09-30');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

  const [tick, setTick] = useState(0);

  // Subscribe to storage changes in real time
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setTick((t) => t + 1);
      setRawExpenses(StorageService.getExpenses() || []);
    });
    return unsub;
  }, []);

  const cashSession = useMemo(() => StorageService.getCashSession(), [tick]);
  // Expenses dataset state with auto-refresh
  const [rawExpenses, setRawExpenses] = useState<Expense[]>(() => StorageService.getExpenses() || []);

  const refreshExpenses = () => {
    setRawExpenses(StorageService.getExpenses() || []);
  };
  const sales = useMemo(() => StorageService.getSales() || [], [tick]);
  const orders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const currentUser = StorageService.getCurrentUser();

  const isCashOpen = cashSession?.status === 'ABERTO';

  // Display Cash Movements with realistic default matching reference screenshot if empty
  const cashMovements = useMemo(() => {
    const saved = StorageService.getCashMovements();
    if (saved && saved.length > 0) return saved;
    if (cashSession?.movements && Array.isArray(cashSession.movements) && cashSession.movements.length > 0) {
      return cashSession.movements;
    }
    return [];
  }, [cashSession, cashModalMode, tick]);

  // Expenses dataset directly driven by reactive state
  const allExpensesList = rawExpenses;

  // Helper to categorize installment expenses strictly
  const isInstallmentExpense = (exp: Expense) => {
    if (exp.isInstallment === false || String(exp.isInstallment) === 'false') return false;
    if (exp.isInstallment === true || String(exp.isInstallment) === 'true') return true;
    if (exp.totalInstallments && Number(exp.totalInstallments) > 1) return true;
    if (exp.installmentNumber && Number(exp.installmentNumber) > 0) return true;

    const notes = (exp.notes || '').toUpperCase();
    const desc = (exp.description || '').toUpperCase();

    if (
      notes.includes('PARCELA') ||
      notes.includes('PARCELADO') ||
      notes.includes('PARCELAS') ||
      notes.includes('PARC.') ||
      notes.includes('A PRAZO') ||
      notes.includes('CARNÊ') ||
      notes.includes('CARNE')
    ) {
      return true;
    }

    if (
      desc.includes('PARCELA') ||
      desc.includes('PARCELADO') ||
      desc.includes('PARCELAS') ||
      desc.includes('PARC.') ||
      desc.includes('A PRAZO') ||
      desc.includes('CARNÊ') ||
      desc.includes('CARNE') ||
      desc.match(/\b\d+\s*\/\s*\d+\b/) ||
      desc.match(/\bparc\.?\s*\d+/i)
    ) {
      return true;
    }

    return false;
  };

  // Helper to categorize continuous monthly payments
  const isContinuousPayment = (exp: Expense) => {
    const cat = (exp.category || '').toUpperCase();
    const notes = (exp.notes || '').toUpperCase();
    const desc = (exp.description || '').toUpperCase();

    return (
      cat.includes('ALUGUEL') ||
      cat.includes('ENERGIA') ||
      cat.includes('INTERNET') ||
      cat.includes('TELEFONE') ||
      cat.includes('SALARIOS') ||
      cat.includes('SOFTWARE') ||
      cat.includes('SISTEMA') ||
      cat.includes('IMPOSTO') ||
      notes.includes('FIXO') ||
      notes.includes('RECORRENTE') ||
      desc.includes('ALUGUEL') ||
      desc.includes('ENERGIA') ||
      desc.includes('LUZ') ||
      desc.includes('ÁGUA') ||
      desc.includes('AGUA') ||
      desc.includes('INTERNET') ||
      desc.includes('TELEFONE') ||
      desc.includes('MENSALIDADE') ||
      desc.includes('SALÁRIO') ||
      desc.includes('SALARIO') ||
      desc.includes('IMPOSTO')
    );
  };

  const installmentExpenses = useMemo(() => {
    return allExpensesList.filter(isInstallmentExpense);
  }, [allExpensesList]);

  const nonInstallmentExpenses = useMemo(() => {
    return allExpensesList.filter((exp) => !isInstallmentExpense(exp));
  }, [allExpensesList]);

  const continuousExpenses = useMemo(() => {
    return allExpensesList.filter(isContinuousPayment);
  }, [allExpensesList]);

  const variableExpenses = useMemo(() => {
    return allExpensesList.filter((exp) => !isContinuousPayment(exp));
  }, [allExpensesList]);

  // Filtered Paid Expenses History according to Period Selection
  const paidExpensesHistory = useMemo(() => {
    // Get all expenses that have status === 'PAGO' or have a paymentDate
    const paidList = allExpensesList.filter((e) => e.status === 'PAGO' || !!e.paymentDate);

    return paidList.filter((e) => {
      const pDate = e.paymentDate || e.dueDate || e.date;
      if (!pDate) return false;

      const dateObj = new Date(pDate);
      const isoStr = pDate.split('T')[0];

      // 1. Period Mode
      if (historyPeriodMode === 'MONTH') {
        const yearMonth = isoStr.substring(0, 7); // 'YYYY-MM'
        if (yearMonth !== historySelectedMonth) return false;
      } else if (historyPeriodMode === 'LAST_12_MONTHS') {
        const limitDate = new Date();
        limitDate.setFullYear(limitDate.getFullYear() - 1);
        if (dateObj < limitDate) return false;
      } else if (historyPeriodMode === 'CUSTOM') {
        if (historyStartDate && isoStr < historyStartDate) return false;
        if (historyEndDate && isoStr > historyEndDate) return false;
      }

      // 2. Category Filter
      if (historyCategoryFilter !== 'ALL') {
        if (historyCategoryFilter === 'CONTINUOUS' && !isContinuousPayment(e)) return false;
        if (historyCategoryFilter === 'VARIABLE' && isContinuousPayment(e)) return false;
        if (
          historyCategoryFilter !== 'CONTINUOUS' &&
          historyCategoryFilter !== 'VARIABLE' &&
          e.category !== historyCategoryFilter
        )
          return false;
      }

      // 3. Search Term
      if (historySearchTerm.trim()) {
        const term = historySearchTerm.toLowerCase();
        const matchDesc = e.description.toLowerCase().includes(term);
        const matchNotes = (e.notes || '').toLowerCase().includes(term);
        const matchCat = e.category.toLowerCase().includes(term);
        const matchResp = (e.responsibleName || '').toLowerCase().includes(term);
        if (!matchDesc && !matchNotes && !matchCat && !matchResp) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.dueDate || a.date).getTime();
      const dateB = new Date(b.paymentDate || b.dueDate || b.date).getTime();
      return dateB - dateA;
    });
  }, [
    allExpensesList,
    historyPeriodMode,
    historySelectedMonth,
    historyStartDate,
    historyEndDate,
    historyCategoryFilter,
    historySearchTerm,
  ]);

  // Aggregates for History Period
  const totalHistoryPaidAmount = useMemo(() => {
    return paidExpensesHistory.reduce((acc, item) => acc + item.amount, 0);
  }, [paidExpensesHistory]);

  const totalHistoryContinuousAmount = useMemo(() => {
    return paidExpensesHistory
      .filter((e) => isContinuousPayment(e))
      .reduce((acc, item) => acc + item.amount, 0);
  }, [paidExpensesHistory]);

  const totalHistoryVariableAmount = useMemo(() => {
    return paidExpensesHistory
      .filter((e) => !isContinuousPayment(e))
      .reduce((acc, item) => acc + item.amount, 0);
  }, [paidExpensesHistory]);

  // Aggregates for Top Summary Cards ("Quadradinhos") in Despesas: PARCELADAS vs NÃO PARCELADAS & SOMA UNIFICADA
  const monthlyInstallmentsTotal = useMemo(() => {
    return installmentExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [installmentExpenses]);

  const monthlyInstallmentsPending = useMemo(() => {
    return installmentExpenses
      .filter((e) => e.status === 'PENDENTE')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [installmentExpenses]);

  const monthlyInstallmentsPaid = useMemo(() => {
    return installmentExpenses
      .filter((e) => e.status === 'PAGO')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [installmentExpenses]);

  // Total somando de todos os meses em aberto de todas as despesas parceladas
  const allMonthsInstallmentsPendingTotal = useMemo(() => {
    return installmentExpenses.reduce((acc, exp) => {
      const currentParc = exp.installmentNumber || 1;
      const totalParc = exp.totalInstallments || 1;
      const remainingUnpaidParcels = exp.status === 'PAGO'
        ? Math.max(0, totalParc - currentParc)
        : Math.max(1, totalParc - currentParc + 1);
      return acc + (remainingUnpaidParcels * (Number(exp.amount) || 0));
    }, 0);
  }, [installmentExpenses]);

  const monthlyNonInstallmentsTotal = useMemo(() => {
    return nonInstallmentExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [nonInstallmentExpenses]);

  const monthlyNonInstallmentsPending = useMemo(() => {
    return nonInstallmentExpenses
      .filter((e) => e.status === 'PENDENTE')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [nonInstallmentExpenses]);

  const monthlyNonInstallmentsPaid = useMemo(() => {
    return nonInstallmentExpenses
      .filter((e) => e.status === 'PAGO')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [nonInstallmentExpenses]);

  const monthlyCombinedTotal = monthlyInstallmentsTotal + monthlyNonInstallmentsTotal;
  const monthlyCombinedPending = monthlyInstallmentsPending + monthlyNonInstallmentsPending;
  const monthlyCombinedPaid = monthlyInstallmentsPaid + monthlyNonInstallmentsPaid;

  // 12 Months Summary Breakdown Array
  const monthly12MonthsBreakdown = useMemo(() => {
    const list: Array<{
      monthKey: string;
      monthLabel: string;
      totalPaid: number;
      continuousPaid: number;
      variablePaid: number;
      count: number;
    }> = [];

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      const monthName = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      const monthItems = allExpensesList.filter((e) => {
        if (e.status !== 'PAGO' && !e.paymentDate) return false;
        const pDate = e.paymentDate || e.dueDate || e.date;
        return pDate && pDate.startsWith(key);
      });

      const totalPaid = monthItems.reduce((acc, item) => acc + item.amount, 0);
      const continuousPaid = monthItems.filter(isContinuousPayment).reduce((acc, item) => acc + item.amount, 0);
      const variablePaid = monthItems.filter((e) => !isContinuousPayment(e)).reduce((acc, item) => acc + item.amount, 0);

      list.push({
        monthKey: key,
        monthLabel: monthName,
        totalPaid,
        continuousPaid,
        variablePaid,
        count: monthItems.length,
      });
    }

    return list;
  }, [allExpensesList]);

  // Financial Metrics
  const totalInflows = useMemo(() => {
    const fromSales = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const fromOrders = orders.filter(o => o.status === 'ENTREGUE').reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);
    return fromSales + fromOrders;
  }, [sales, orders]);

  const totalPaidExpenses = useMemo(() => {
    return allExpensesList
      .filter((e) => e.status === 'PAGO')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [allExpensesList]);

  const totalPendingExpenses = useMemo(() => {
    return allExpensesList
      .filter((e) => e.status === 'PENDENTE')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [allExpensesList]);

  const netResult = totalInflows - totalPaidExpenses;

  // Expense Handlers
  const handleSaveExpense = (exp: Expense) => {
    StorageService.saveExpense(exp);
    refreshExpenses();
    setIsExpenseModalOpen(false);
    setExpenseToEdit(null);
    if (exp.isInstallment) {
      setExpenseSubFilter('PARCELADAS');
    }
  };

  const handleDeleteExpenseConfirm = () => {
    if (expenseToDelete) {
      StorageService.deleteExpense(expenseToDelete.id);
      refreshExpenses();
      setExpenseToDelete(null);
    }
  };

  const handleConfirmPayExpense = (data: {
    paymentDate: string;
    paymentMethod: PaymentMethod;
    debitFromCash: boolean;
    notes?: string;
  }) => {
    if (!expenseToPay) return;

    const existingNotes = expenseToPay.notes || '';
    const newNote = data.notes ? `Quitado: ${data.notes}` : '';
    const combinedNotes = [existingNotes, newNote].filter(Boolean).join(' | ');

    const updated: Expense = {
      ...expenseToPay,
      status: 'PAGO',
      paymentDate: new Date(data.paymentDate).toISOString(),
      paymentMethod: data.paymentMethod,
      paidFromCash: data.debitFromCash,
      notes: combinedNotes || undefined,
    };

    StorageService.saveExpense(updated);
    refreshExpenses();

    if (data.debitFromCash && isCashOpen) {
      StorageService.addCashMovement({
        type: 'DESPESA',
        description: `Despesa Quitada: ${expenseToPay.description} (${expenseToPay.category})`,
        amount: expenseToPay.amount,
        paymentMethod: data.paymentMethod,
        referenceId: expenseToPay.id,
      });
    }

    setExpenseToPay(null);
  };

  const handlePrintHistoryReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. HEADER BANNER */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark
          ? 'bg-[#081226] border-blue-900/60 shadow-[0_0_30px_rgba(2,132,199,0.1)] text-white'
          : 'bg-white border-slate-200 shadow-sm text-slate-900'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
            <Wallet className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Caixa & Operações de Gaveta
              </h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                isCashOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCashOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isCashOpen ? 'Caixa ABERTO' : 'Caixa FECHADO'}</span>
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Abertura, fechamento, sangrias, suprimentos e histórico de movimentações da loja.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isCashOpen ? (
            <>
              <button
                type="button"
                onClick={() => setCashModalMode('SANGRIA')}
                className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/80 shadow-[0_0_12px_rgba(225,29,72,0.25)] text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>Sangria (Retirada)</span>
              </button>
              <button
                type="button"
                onClick={() => setCashModalMode('SUPRIMENTO')}
                className="px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>Suprimento (Troco)</span>
              </button>
              <button
                type="button"
                onClick={() => setCashModalMode('CLOSE')}
                className={`px-4 py-2.5 border text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-[#070e1f] hover:bg-[#0e1a38] border-slate-700/80 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCashModalMode('OPEN')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Abrir Caixa Agora</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Saldo Atual no Caixa</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {formatCurrency(cashSession?.currentBalance || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isCashOpen ? 'Troco inicial + entradas do dia' : 'Caixa fechado'}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Entradas do Período</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {formatCurrency(totalInflows)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vendas PDV + Serviços de OS</p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Despesas Quitadas</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 font-mono">
            {formatCurrency(totalPaidExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pendente a pagar: {formatCurrency(totalPendingExpenses)}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Resultado Líquido</span>
            <BarChart2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-xl font-black font-mono ${netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netResult)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Entradas - Despesas Pagas</p>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
        isDark ? 'bg-[#060e20] border-blue-900/60' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('CASH')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'CASH'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Caixa & Movimentações</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'EXPENSES'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Despesas & Contas a Pagar ({allExpensesList.length})</span>
        </button>


      </div>

      {/* TAB 1: CAIXA E MOVIMENTAÇÕES DE GAVETA */}
      {activeTab === 'CASH' && (
        <div className={`border rounded-2xl shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'border-slate-800/80 bg-[#060c1c]' : 'border-slate-200 bg-slate-50/80'
          }`}>
            <div>
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Extrato de Movimentações da Gaveta de Caixa
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Lançamentos de vendas, serviços, sangrias e suprimentos no turno atual.
              </p>
            </div>

            {isCashOpen && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Operador:</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {cashSession.openedBy || currentUser?.name || 'Juliana Costa'}
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`font-black uppercase tracking-wider text-[11px] border-b ${
                  isDark ? 'bg-[#050c1c] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <th className="py-3.5 px-4 sm:px-5">HORÁRIO</th>
                  <th className="py-3.5 px-4">TIPO</th>
                  <th className="py-3.5 px-4">DESCRIÇÃO</th>
                  <th className="py-3.5 px-4">OPERADOR</th>
                  <th className="py-3.5 px-4 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {cashMovements.map((mov) => {
                  const isPositive = mov.type === 'ABERTURA' || mov.type === 'VENDA' || mov.type === 'ORDEM SERVIÇO' || mov.type === 'SUPRIMENTO' || mov.type === 'ENTRADA_AVULSA';
                  return (
                    <tr key={mov.id} className={isDark ? 'hover:bg-[#0d1d3d]/50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      <td className={`py-4 px-4 sm:px-5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {new Date(mov.timestamp || (mov as any).date || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${
                          mov.type === 'ABERTURA'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            : mov.type === 'SANGRIA' || mov.type === 'DESPESA'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        }`}>
                          {mov.type}
                        </span>
                      </td>
                      <td className={`py-4 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {mov.description}
                      </td>
                      <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {mov.userName || 'Sistema'}
                      </td>
                      <td className={`py-4 px-4 text-right font-black font-mono text-sm ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? '+' : '-'} {formatCurrency(mov.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DESPESAS & CONTAS A PAGAR */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Sub-Header Controls & Sub-Filter Pills */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <div>
              <h3 className="font-black text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                <span>Gestão de Despesas & Contas a Pagar</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Acompanhe o vencimento de contas fixas contínuas, despesas variáveis e histórico por período.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Sub-Filter Pills */}
              <div className={`p-1 rounded-xl border flex items-center gap-1 overflow-x-auto ${
                isDark ? 'bg-[#040a17] border-blue-900/50' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setExpenseSubFilter('PARCELADAS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    expenseSubFilter === 'PARCELADAS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                  <span>1. Despesas Parceladas ({installmentExpenses.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseSubFilter('NAO_PARCELADAS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    expenseSubFilter === 'NAO_PARCELADAS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Não Parceladas ({nonInstallmentExpenses.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseSubFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    expenseSubFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Todas (Tudo Junto) ({allExpensesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseSubFilter('HISTORY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    expenseSubFilter === 'HISTORY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Histórico de Pagamentos</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Lançar Nova Despesa</span>
              </button>
            </div>
          </div>

          {/* 3 QUADRADINHOS DE RESUMO (PARCELADAS, NÃO PARCELADAS E SOMA UNIFICADA DAS DUAS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* QUADRADINHO 1: DESPESAS PARCELADAS */}
            <div 
              onClick={() => setExpenseSubFilter('PARCELADAS')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-lg cursor-pointer hover:scale-[1.01] ${
                expenseSubFilter === 'PARCELADAS' ? 'ring-2 ring-blue-500' : ''
              } ${
                isDark ? 'bg-[#08152b] border-blue-500/40 text-white hover:bg-[#0c1f3d]' : 'bg-blue-50/80 border-blue-200 text-slate-900 hover:bg-blue-100/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-black text-blue-400 mb-1.5 uppercase tracking-wider">
                <span>1. Despesas Parceladas</span>
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-black text-blue-300 font-mono">
                {formatCurrency(monthlyInstallmentsTotal)}
                <span className="text-xs text-slate-400 font-normal ml-1">/deste mês</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-blue-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-blue-950/60 p-1.5 px-2 rounded-xl border border-blue-800/50">
                  <span className="text-slate-300 font-bold">Total Aberto (Todos os Meses):</span>
                  <span className="font-black text-rose-400 font-mono text-xs">
                    {formatCurrency(allMonthsInstallmentsPendingTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-400">Pendente no Mês:</span>
                  <span className="font-black text-amber-400 font-mono">
                    {formatCurrency(monthlyInstallmentsPending)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Quitado no Mês:</span>
                  <span className="font-black text-emerald-400 font-mono">
                    {formatCurrency(monthlyInstallmentsPaid)}
                  </span>
                </div>
              </div>
            </div>

            {/* QUADRADINHO 2: DESPESAS NÃO PARCELADAS */}
            <div 
              onClick={() => setExpenseSubFilter('NAO_PARCELADAS')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-lg cursor-pointer hover:scale-[1.01] ${
                expenseSubFilter === 'NAO_PARCELADAS' ? 'ring-2 ring-amber-500' : ''
              } ${
                isDark ? 'bg-[#121324] border-amber-500/40 text-white hover:bg-[#1a1b33]' : 'bg-amber-50/80 border-amber-200 text-slate-900 hover:bg-amber-100/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-black text-amber-400 mb-1.5 uppercase tracking-wider">
                <span>2. Despesas Não Parceladas</span>
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-black text-amber-300 font-mono">
                {formatCurrency(monthlyNonInstallmentsTotal)}
                <span className="text-xs text-slate-400 font-normal ml-1">/deste mês</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-amber-950/40 p-1.5 px-2 rounded-xl border border-amber-800/40">
                  <span className="text-slate-300 font-bold">Lançamentos à Vista/Fixos:</span>
                  <span className="font-extrabold text-amber-300 font-mono">
                    {nonInstallmentExpenses.length} itens
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-400">Pendente neste Mês:</span>
                  <span className="font-black text-rose-400 font-mono">
                    {formatCurrency(monthlyNonInstallmentsPending)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Quitado neste Mês:</span>
                  <span className="font-black text-emerald-400 font-mono">
                    {formatCurrency(monthlyNonInstallmentsPaid)}
                  </span>
                </div>
              </div>
            </div>

            {/* QUADRADINHO 3: SOMA UNIFICADA DAS DUAS */}
            <div 
              onClick={() => setExpenseSubFilter('ALL')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-lg cursor-pointer hover:scale-[1.01] ${
                expenseSubFilter === 'ALL' ? 'ring-2 ring-emerald-500' : ''
              } ${
                isDark ? 'bg-[#061824] border-emerald-500/50 text-white hover:bg-[#082233]' : 'bg-emerald-50/80 border-emerald-300 text-slate-900 hover:bg-emerald-100/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-black text-emerald-400 mb-1.5 uppercase tracking-wider">
                <span>3. Soma Unificada das Duas</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(monthlyCombinedTotal)}
                <span className="text-xs text-slate-400 font-normal ml-1">/deste mês</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-emerald-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-rose-950/40 p-1.5 px-2 rounded-xl border border-rose-800/40">
                  <div className="flex items-center gap-1 text-rose-300 font-bold">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>A Pagar (Em Aberto):</span>
                  </div>
                  <span className="font-black text-rose-400 font-mono">
                    {formatCurrency(monthlyCombinedPending)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-emerald-950/40 p-1.5 px-2 rounded-xl border border-emerald-800/40">
                  <div className="flex items-center gap-1 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Já Quitado (Pago):</span>
                  </div>
                  <span className="font-black text-emerald-300 font-mono">
                    {formatCurrency(monthlyCombinedPaid)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AREA 1: DESPESAS PARCELADAS (LAYOUT EM CARDS COM DETALHAMENTO DE PARCELAS) */}
          {(expenseSubFilter === 'ALL' || expenseSubFilter === 'PARCELADAS') && (
            <div className={`p-5 rounded-2xl border shadow-xl transition-all ${
              isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Section Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-blue-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 text-blue-400 border border-blue-500/30 shadow-md">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base uppercase tracking-wider text-blue-400">
                        Painel de Despesas Parceladas (A Prazo / Cartão / Carnê)
                      </h4>
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        Formato em Cartões de Parcelas
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Compras parceladas de equipamentos, ferramentas, reformas e insumos a prazo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pendente nas Parcelas:
                  </span>
                  <span className="font-black text-rose-400 text-sm font-mono bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                    {formatCurrency(installmentExpenses.filter((e) => e.status === 'PENDENTE').reduce((a, b) => a + b.amount, 0))}
                  </span>
                </div>
              </div>

              {installmentExpenses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nenhuma despesa parcelada cadastrada.
                  </p>
                </div>
              ) : (
                /* GRID CARDS LAYOUT FOR INSTALLMENT EXPENSES */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {installmentExpenses.map((exp) => {
                    const isPaid = exp.status === 'PAGO';
                    const currentParcel = exp.installmentNumber || 1;
                    const totalParcels = exp.totalInstallments || 1;

                    return (
                      <div
                        key={exp.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                          isDark
                            ? isPaid
                              ? 'bg-[#040d1f] border-emerald-500/40 hover:border-emerald-500'
                              : 'bg-[#061024] border-blue-500/50 hover:border-blue-400'
                            : isPaid
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-blue-50/50 border-blue-300'
                        }`}
                      >
                        {/* Top Card Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>Parcela {currentParcel} de {totalParcels}</span>
                          </span>

                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                          }`}>
                            {isPaid ? '🟢 QUITADO NESTE MÊS' : '🟡 PENDENTE MÊS'}
                          </span>
                        </div>

                        {/* Title & Category */}
                        <div>
                          <h5 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {exp.description}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {exp.category.replace(/_/g, ' ')}
                            </span>
                            {exp.notes && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {exp.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Installment Breakdown Box */}
                        <div className={`p-3 rounded-xl border space-y-2 ${
                          isDark ? 'bg-[#020612] border-blue-900/50' : 'bg-white border-slate-200'
                        }`}>
                          {/* Row 1: Valor da Parcela + Status no Mês */}
                          <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Valor da Parcela ({currentParcel}/{totalParcels})
                              </span>
                              <span className="text-base font-black text-rose-400 font-mono">
                                {formatCurrency(exp.amount)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Status no Mês
                              </span>
                              <span className={`text-xs font-black font-mono ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isPaid ? 'R$ 0,00 (Quitado)' : `${formatCurrency(exp.amount)} (Aberto)`}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Total do Contrato Parcelado */}
                          <div className="flex items-center justify-between text-[11px]">
                            <div>
                              <span className="text-slate-400">Nº de Parcelas:</span>
                              <span className="font-bold text-blue-300 ml-1">
                                {totalParcels}x parcelado
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Total do Compra:</span>
                              <span className="font-extrabold text-white font-mono ml-1">
                                {formatCurrency(exp.amount * totalParcels)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Info if paid */}
                        {isPaid && exp.paymentDate && (
                          <p className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            ✓ Pago em {formatDate(exp.paymentDate)} via {exp.paymentMethod || 'CARTÃO'}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-900/40">
                          <button
                            type="button"
                            onClick={() => setExpenseToPay(exp)}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                              isPaid
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>{isPaid ? 'Quitado (Alterar)' : 'Quitar / Pagar Parcela'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseToEdit(exp);
                                setIsExpenseModalOpen(true);
                              }}
                              className={`p-2 border rounded-xl font-bold text-xs cursor-pointer ${
                                isDark
                                  ? 'text-slate-300 hover:text-white bg-[#040915] hover:bg-blue-900/60 border-slate-700'
                                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                              }`}
                              title="Editar Despesa Parcelada"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded-xl cursor-pointer"
                              title="Excluir Despesa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AREA 2: DESPESAS NÃO PARCELADAS (À VISTA, FIXAS MENSAL & COMPRAS AVULSAS) */}
          {(expenseSubFilter === 'ALL' || expenseSubFilter === 'NAO_PARCELADAS') && (
            <div className={`border rounded-2xl shadow-xl overflow-hidden transition-all ${
              isDark ? 'bg-[#081226] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Section Header Banner */}
              <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'border-blue-900/40 bg-gradient-to-r from-[#061024] to-[#121c2e]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm uppercase tracking-wider text-amber-400">
                        Painel de Despesas Não Parceladas (À Vista & Contínuas Recorrentes)
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Aluguel, Energia, Internet, Salários, Impostos e Insumos À Vista
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Contas fixas mensais do estabelecimento e compras pontuais à vista.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total Pendente:
                  </span>
                  <span className="font-black text-amber-400 text-sm font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {formatCurrency(nonInstallmentExpenses.filter((e) => e.status === 'PENDENTE').reduce((a, b) => a + b.amount, 0))}
                  </span>
                </div>
              </div>

              {nonInstallmentExpenses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nenhuma despesa não parcelada cadastrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`font-black uppercase tracking-wider text-[11px] border-b ${
                        isDark ? 'bg-[#050c1c] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">VENCIMENTO</th>
                        <th className="py-3.5 px-4 min-w-[180px]">DESCRIÇÃO DA DESPESA</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">CATEGORIA</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">FORMA DE PAGAMENTO</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">VALOR</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap">AÇÕES QUITAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {nonInstallmentExpenses.map((exp) => (
                        <tr key={exp.id} className={isDark ? 'hover:bg-[#0d1d3d]/50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                          <td className={`py-4 px-4 sm:px-5 font-mono whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {formatDate(exp.dueDate)}
                          </td>
                          <td className={`py-4 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {exp.description}
                            {exp.notes && (
                              <span className={`block text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {exp.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                              {exp.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className={`py-4 px-4 whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {exp.paymentMethod || 'Dinheiro / PIX'}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border whitespace-nowrap inline-flex items-center gap-1.5 ${
                              exp.status === 'PAGO'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${exp.status === 'PAGO' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                              <span className="whitespace-nowrap">{exp.status === 'PAGO' ? 'PAGO' : 'PENDENTE'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 font-black text-rose-400 text-sm font-mono whitespace-nowrap">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setExpenseToPay(exp)}
                                className={`px-3 py-1.5 rounded-xl font-black text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 whitespace-nowrap ${
                                  exp.status === 'PAGO'
                                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                                <span className="whitespace-nowrap">{exp.status === 'PAGO' ? 'Quitado' : 'Quitar / Pagar'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpenseToEdit(exp);
                                  setIsExpenseModalOpen(true);
                                }}
                                className={`px-2.5 py-1.5 border rounded-xl font-bold text-xs cursor-pointer whitespace-nowrap ${
                                  isDark
                                    ? 'text-slate-300 hover:text-white bg-[#040915] hover:bg-blue-900/60 border-slate-700'
                                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                                }`}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpenseToDelete(exp)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded-xl cursor-pointer"
                                title="Excluir Despesa"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AREA 3: HISTÓRICO E RELATÓRIO DE PAGAMENTOS POR PERÍODO */}
          {(expenseSubFilter === 'ALL' || expenseSubFilter === 'HISTORY') && (
            <div className={`p-5 rounded-2xl border shadow-2xl transition-all space-y-5 ${
              isDark ? 'bg-[#081226] border-emerald-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl shadow-md">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <span>Histórico & Relatório de Pagamentos Efetuados</span>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                        Análise Temporal
                      </span>
                    </h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Filtre quanto foi pago por mês, últimos 12 meses ou período personalizado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintHistoryReport}
                    className="px-4 py-2 bg-[#040a17] hover:bg-blue-900/40 text-slate-200 border border-blue-900/80 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Imprimir Relatório</span>
                  </button>
                </div>
              </div>

              {/* CONTROLES DE FILTRO DE PERÍODO */}
              <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 ${
                isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Modo de Seleção de Período
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#020612] rounded-xl border border-blue-900/50">
                    <button
                      type="button"
                      onClick={() => setHistoryPeriodMode('MONTH')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        historyPeriodMode === 'MONTH'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Por Mês
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryPeriodMode('LAST_12_MONTHS')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        historyPeriodMode === 'LAST_12_MONTHS'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      12 Meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryPeriodMode('CUSTOM')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        historyPeriodMode === 'CUSTOM'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                {/* Period Inputs based on mode */}
                {historyPeriodMode === 'MONTH' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Selecione o Mês / Ano
                    </label>
                    <input
                      type="month"
                      value={historySelectedMonth}
                      onChange={(e) => setHistorySelectedMonth(e.target.value)}
                      className="w-full bg-[#020612] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                {historyPeriodMode === 'LAST_12_MONTHS' && (
                  <div className="flex items-center gap-2 pt-5">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/30">
                      ✓ Exibindo total acumulado dos últimos 12 meses
                    </span>
                  </div>
                )}

                {historyPeriodMode === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Data Inicial</label>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="w-full bg-[#020612] border border-blue-900/80 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Data Final</label>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="w-full bg-[#020612] border border-blue-900/80 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Search & Category Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Buscar / Filtrar Categoria</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por nome..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full bg-[#020612] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={historyCategoryFilter}
                      onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                      className="bg-[#020612] border border-blue-900/80 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">Todas Categorias</option>
                      <option value="CONTINUOUS">Apenas Mensais/Fixas</option>
                      <option value="VARIABLE">Apenas Outras/Variáveis</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SUMMARY STAT CARDS FOR SELECTED HISTORY PERIOD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#040a17] border-emerald-900/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-bold text-slate-400 block">Total Pago no Período Selecionado</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {formatCurrency(totalHistoryPaidAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {paidExpensesHistory.length} lançamentos quitados
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-bold text-slate-400 block">Total Pago em Contas Mensais Recorrentes</span>
                  <div className="text-2xl font-black text-blue-400 font-mono mt-1">
                    {formatCurrency(totalHistoryContinuousAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Aluguel, Luz, Internet, Sistemas, etc.</span>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#040a17] border-amber-900/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-bold text-slate-400 block">Total Pago em Outras Despesas e Peças</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {formatCurrency(totalHistoryVariableAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Fornecedores, Ferramentas, Consumo</span>
                </div>
              </div>

              {/* 12 MONTHS BREAKDOWN BAR VISUALIZER (If 12 Months selected) */}
              {historyPeriodMode === 'LAST_12_MONTHS' && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Evolução Mensal de Pagamentos (Últimos 12 Meses)
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {monthly12MonthsBreakdown.map((item) => (
                      <div
                        key={item.monthKey}
                        onClick={() => {
                          setHistorySelectedMonth(item.monthKey);
                          setHistoryPeriodMode('MONTH');
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all text-center ${
                          isDark
                            ? 'bg-[#08152b] border-blue-900/60 hover:border-emerald-500'
                            : 'bg-white border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">{item.monthLabel}</span>
                        <span className="text-sm font-black text-emerald-400 font-mono block mt-1">
                          {formatCurrency(item.totalPaid)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.count} pagto(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAILED HISTORY TABLE */}
              <div className="overflow-x-auto border border-blue-900/60 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`font-black uppercase tracking-wider text-[11px] border-b ${
                      isDark ? 'bg-[#050c1c] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <th className="py-3.5 px-4 sm:px-5">DATA QUITAÇÃO</th>
                      <th className="py-3.5 px-4">DESCRIÇÃO DA DESPESA</th>
                      <th className="py-3.5 px-4">CATEGORIA</th>
                      <th className="py-3.5 px-4">FORMA DE PAGTO</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4">VALOR PAGO</th>
                      <th className="py-3.5 px-4 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {paidExpensesHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-bold">
                          Nenhum pagamento registrado no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      paidExpensesHistory.map((exp) => (
                        <tr key={exp.id} className={isDark ? 'hover:bg-[#0d1d3d]/50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                          <td className={`py-4 px-4 sm:px-5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {formatDate(exp.paymentDate || exp.dueDate || exp.date)}
                          </td>
                          <td className={`py-4 px-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {exp.description}
                            {exp.notes && (
                              <span className={`block text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {exp.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                              isContinuousPayment(exp)
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}>
                              {exp.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className={`py-4 px-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {exp.paymentMethod || 'PIX'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 text-[10px] font-black rounded-lg border bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                              🟢 QUITADO
                            </span>
                          </td>
                          <td className="py-4 px-4 font-black text-emerald-400 text-sm font-mono">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setExpenseToPay(exp)}
                              className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 rounded-xl font-bold text-[11px] cursor-pointer transition-all inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Alterar Quitação</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Cash Session Modal for Open/Close/Sangria/Suprimento */}
      {cashModalMode && (
        <CashSessionModal
          isOpen={!!cashModalMode}
          onClose={() => setCashModalMode(null)}
          mode={cashModalMode}
        />
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSave={handleSaveExpense}
          expenseToEdit={expenseToEdit}
        />
      )}

      {/* Confirm Expense Pay / Settlement Modal */}
      {expenseToPay && (
        <PayExpenseModal
          isOpen={!!expenseToPay}
          expense={expenseToPay}
          onClose={() => setExpenseToPay(null)}
          onConfirm={handleConfirmPayExpense}
        />
      )}

      {/* Delete Expense Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title="Excluir Despesa"
        message={`Tem certeza que deseja excluir a despesa "${expenseToDelete?.description}"?`}
        onConfirm={handleDeleteExpenseConfirm}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
