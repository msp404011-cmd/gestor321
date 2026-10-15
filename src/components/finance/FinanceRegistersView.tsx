import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Landmark,
  Plus,
  Minus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Check,
  X,
  CreditCard,
  Building2,
  TrendingDown,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  Banknote,
  Percent,
  Coins,
  History
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { FinanceCashRegister, FinanceCashMovementItem, DefinitiveExpense } from '../../types';
import { formatCurrency } from '../../services/formatters';

export function FinanceRegistersView() {
  const [registers, setRegisters] = useState<FinanceCashRegister[]>([]);
  const [movements, setMovements] = useState<FinanceCashMovementItem[]>([]);
  const [definitiveExpenses, setDefinitiveExpenses] = useState<DefinitiveExpense[]>([]);

  // Modais de Controle
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Edição
  const [editingRegisterId, setEditingRegisterId] = useState<string | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [txMovement, setTxMovement] = useState<FinanceCashMovementItem | null>(null);
  const [txType, setTxType] = useState<'ADD' | 'PAYBACK'>('PAYBACK');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Form State: Caixa
  const [regName, setRegName] = useState('');
  const [regInitialBalance, setRegInitialBalance] = useState('');
  const [regColor, setRegColor] = useState<'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'rose'>('emerald');
  const [regNotes, setRegNotes] = useState('');
  // Opção de Adicionar / Alimentar Saldo Inicial
  const [initialBalanceMode, setInitialBalanceMode] = useState<'ADD' | 'SET'>('ADD');
  const [addInitialAmount, setAddInitialAmount] = useState('');
  const [addInitialReason, setAddInitialReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Form State: Movimentação Direta no Card (Tirar / Colocar / Pegar Emprestado)
  const [movRegisterId, setMovRegisterId] = useState('');
  const [movType, setMovType] = useState<'WITHDRAWAL' | 'DEPOSIT'>('WITHDRAWAL');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');
  const [movDate, setMovDate] = useState(() => {
    const now = new Date();
    return now.toISOString().substring(0, 10);
  });
  const [movNotes, setMovNotes] = useState('');

  // Form State: Despesa Definitiva (Finanças Final)
  const [isDefinitiveModalOpen, setIsDefinitiveModalOpen] = useState(false);
  const [defRegisterId, setDefRegisterId] = useState('');
  const [defAmount, setDefAmount] = useState('');
  const [defReason, setDefReason] = useState('');

  // Form State: Devolução / Pagamento parcial ou total ao Caixa
  const [payBackAmount, setPayBackAmount] = useState('');

  // Edição de Histórico de Saldo Inicial
  const [isHistoryEditModalOpen, setIsHistoryEditModalOpen] = useState(false);
  const [editingHistoryRegId, setEditingHistoryRegId] = useState<string | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<any | null>(null);
  const [editHistoryAmount, setEditHistoryAmount] = useState('');
  const [editHistoryReason, setEditHistoryReason] = useState('');

  const handleOpenEditHistory = (regId: string, item: any) => {
    setEditingHistoryRegId(regId);
    setEditingHistoryItem(item);
    setEditHistoryAmount(item.amountAdded.toString());
    setEditHistoryReason(item.reason || '');
    setIsHistoryEditModalOpen(true);
  };

  const handleSaveEditHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryRegId || !editingHistoryItem) return;
    const newAmt = parseFloat(editHistoryAmount);
    if (isNaN(newAmt) || newAmt < 0) return;

    const reg = registers.find(r => r.id === editingHistoryRegId);
    if (!reg || !reg.initialBalanceHistory) return;

    const oldAmt = editingHistoryItem.amountAdded;
    const diff = newAmt - oldAmt;

    const updatedHistory = reg.initialBalanceHistory.map(h => {
      if (h.id === editingHistoryItem.id) {
        return {
          ...h,
          amountAdded: newAmt,
          reason: editHistoryReason.trim() || h.reason,
          newBalance: h.previousBalance + newAmt
        };
      }
      return h;
    });

    const newInitialBalance = Math.max(0, (reg.initialBalance || 0) + diff);

    const updatedReg: FinanceCashRegister = {
      ...reg,
      initialBalance: newInitialBalance,
      initialBalanceHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveFinanceCashRegister(updatedReg);
    loadData();
    setIsHistoryEditModalOpen(false);
    setEditingHistoryRegId(null);
    setEditingHistoryItem(null);
  };

  const handleDeleteHistory = (regId: string, historyId: string) => {
    const reg = registers.find(r => r.id === regId);
    if (!reg || !reg.initialBalanceHistory) return;
    const itemDel = reg.initialBalanceHistory.find(h => h.id === historyId);
    if (!itemDel) return;

    const updatedHistory = reg.initialBalanceHistory.filter(h => h.id !== historyId);
    const newInitialBalance = Math.max(0, (reg.initialBalance || 0) - itemDel.amountAdded);

    const updatedReg: FinanceCashRegister = {
      ...reg,
      initialBalance: newInitialBalance,
      initialBalanceHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveFinanceCashRegister(updatedReg);
    loadData();
  };


  // Filtros de Movimentações
  const [filterRegisterId, setFilterRegisterId] = useState<string>('TODOS');
  const [filterType, setFilterType] = useState<'TODOS' | 'WITHDRAWAL' | 'DEPOSIT'>('TODOS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'PENDING' | 'PAID'>('TODOS');

  // Modal de Confirmação de Exclusão ou Zerar Caixa
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'DELETE_REGISTER' | 'DELETE_MOVEMENT' | 'RESET_REGISTER';
    targetId: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'DELETE_REGISTER',
    targetId: '',
  });

  // Carregar dados iniciais e sincronizar
  const loadData = () => {
    const regs = StorageService.getFinanceCashRegisters();
    const movs = StorageService.getFinanceCashMovements();
    const expenses = StorageService.getDefinitiveExpenses();
    setRegisters(regs);
    setMovements(movs);
    setDefinitiveExpenses(expenses);
  };

  useEffect(() => {
    StorageService.recalculateFinanceRegisterBalances();
    loadData();
    const unsubscribe = StorageService.subscribe(() => {
      const regs = StorageService.getFinanceCashRegisters();
      const movs = StorageService.getFinanceCashMovements();
      const expenses = StorageService.getDefinitiveExpenses();
      setRegisters(regs);
      setMovements(movs);
      setDefinitiveExpenses(expenses);
    });
    return () => unsubscribe();
  }, []);

  // Totais Gerais
  const totals = useMemo(() => {
    let totalBalance = 0;
    let totalInitialBalance = 0;
    let totalWithdrawnPending = 0; // Total Faltando para preencher os caixas
    let totalWithdrawnGross = 0;   // Total Tirado
    let totalPaidBack = 0;         // Total Devolvido / Reposto
    let totalDeposited = 0;

    registers.forEach((r) => {
      const regExpenses = definitiveExpenses.filter((e) => e.cashRegisterId === r.id);
      const defExpTotal = regExpenses.reduce((s, e) => s + e.amount, 0);
      const targetInitial = Math.max(0, (r.initialBalance || 0) - defExpTotal);
      const currBal = r.currentBalance || 0;
      const faltandoNesteCaixa = Math.max(0, targetInitial - currBal);

      totalBalance += currBal;
      totalInitialBalance += (r.initialBalance || 0);
      totalWithdrawnPending += faltandoNesteCaixa;
      totalDeposited += r.totalDeposited || 0;
    });

    movements.forEach((m) => {
      const addTotal = (m.transactions || []).filter((t) => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
      const paybackTotal = (m.transactions || []).filter((t) => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);

      if (m.type === 'WITHDRAWAL') {
        const fullWithdrawn = m.amount + addTotal;
        const fullPaidBack = (m.paidBackAmount || 0) + paybackTotal;
        totalWithdrawnGross += fullWithdrawn;
        totalPaidBack += fullPaidBack;
      } else if (m.type === 'DEPOSIT') {
        const fullDeposited = (m.amount + addTotal) - paybackTotal;
        totalPaidBack += fullDeposited;
      }
    });

    return {
      totalBalance,
      totalInitialBalance,
      totalWithdrawnGross,
      totalWithdrawnPending,
      totalPaidBack,
      totalDeposited,
      registersCount: registers.length,
      pendingMovementsCount: movements.filter((m) => m.type === 'WITHDRAWAL' && !m.isPaid).length,
      withdrawnMovementsCount: movements.filter((m) => m.type === 'WITHDRAWAL').length,
    };
  }, [registers, movements, definitiveExpenses]);

  // Lista de Movimentações filtrada
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (filterRegisterId !== 'TODOS' && m.cashRegisterId !== filterRegisterId) {
        return false;
      }
      if (filterType !== 'TODOS' && m.type !== filterType) {
        return false;
      }
      if (filterStatus === 'PENDING' && (m.type !== 'WITHDRAWAL' || m.isPaid)) {
        return false;
      }
      if (filterStatus === 'PAID' && (m.type !== 'WITHDRAWAL' || !m.isPaid)) {
        return false;
      }
      return true;
    });
  }, [movements, filterRegisterId, filterType, filterStatus]);

  // --- Handlers para Caixas ---
  const handleOpenNewRegister = () => {
    setEditingRegisterId(null);
    setRegName('');
    setRegInitialBalance('');
    setRegColor('emerald');
    setRegNotes('');
    setInitialBalanceMode('SET');
    setAddInitialAmount('');
    setAddInitialReason('');
    setShowHistory(false);
    setIsRegisterModalOpen(true);
  };

  const handleOpenEditRegister = (reg: FinanceCashRegister, defaultMode: 'ADD' | 'SET' = 'ADD') => {
    setEditingRegisterId(reg.id);
    setRegName(reg.name);
    setRegInitialBalance(reg.initialBalance ? reg.initialBalance.toString() : '0');
    setRegColor(reg.color || 'emerald');
    setRegNotes(reg.notes || '');
    setInitialBalanceMode(defaultMode);
    setAddInitialAmount('');
    setAddInitialReason('');
    setShowHistory(false);
    setIsRegisterModalOpen(true);
  };

  const handleSaveRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    if (editingRegisterId) {
      const existing = registers.find((r) => r.id === editingRegisterId);
      if (existing) {
        let finalInitialBalance = existing.initialBalance || 0;
        let newHistory = existing.initialBalanceHistory ? [...existing.initialBalanceHistory] : [];

        if (initialBalanceMode === 'ADD') {
          const addedVal = parseFloat(addInitialAmount) || 0;
          if (addedVal > 0) {
            finalInitialBalance = (existing.initialBalance || 0) + addedVal;
            const historyEntry = {
              id: 'feed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              amountAdded: addedVal,
              previousBalance: existing.initialBalance || 0,
              newBalance: finalInitialBalance,
              date: new Date().toISOString(),
              reason: addInitialReason.trim() || 'Aporte / Alimentação do Saldo Inicial',
            };
            newHistory = [historyEntry, ...newHistory];
          }
        } else {
          const setVal = parseFloat(regInitialBalance);
          finalInitialBalance = isNaN(setVal) ? (existing.initialBalance || 0) : Math.max(0, setVal);
          if (finalInitialBalance !== existing.initialBalance) {
            const diff = finalInitialBalance - (existing.initialBalance || 0);
            const historyEntry = {
              id: 'feed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              amountAdded: diff,
              previousBalance: existing.initialBalance || 0,
              newBalance: finalInitialBalance,
              date: new Date().toISOString(),
              reason: addInitialReason.trim() || (diff > 0 ? 'Ajuste manual de saldo inicial (+)' : 'Ajuste manual de saldo inicial (-)'),
            };
            newHistory = [historyEntry, ...newHistory];
          }
        }

        const updated: FinanceCashRegister = {
          ...existing,
          name: regName.trim(),
          initialBalance: finalInitialBalance,
          initialBalanceHistory: newHistory,
          color: regColor,
          notes: regNotes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveFinanceCashRegister(updated);
      }
    } else {
      const initialNum = Math.max(0, parseFloat(regInitialBalance) || 0);
      const newReg: FinanceCashRegister = {
        id: 'freg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: regName.trim(),
        initialBalance: initialNum,
        currentBalance: initialNum,
        totalWithdrawn: 0,
        totalDeposited: 0,
        color: regColor,
        notes: regNotes.trim() || undefined,
        initialBalanceHistory: initialNum > 0 ? [{
          id: 'feed-init-' + Date.now(),
          amountAdded: initialNum,
          previousBalance: 0,
          newBalance: initialNum,
          date: new Date().toISOString(),
          reason: 'Abertura / Saldo inicial inicializado',
        }] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveFinanceCashRegister(newReg);
    }

    loadData();
    setIsRegisterModalOpen(false);
  };

  // --- Handlers para Movimentações (Tirar / Colocar / Pegar Emprestado direto no card) ---
  const handleOpenNewMovement = (targetRegisterId?: string, forceType?: 'WITHDRAWAL' | 'DEPOSIT', defaultReason?: string) => {
    setEditingMovementId(null);
    setMovRegisterId(targetRegisterId || (registers[0]?.id ?? ''));
    setMovType(forceType || 'WITHDRAWAL');
    setMovAmount('');
    setMovReason(defaultReason || (forceType === 'DEPOSIT' ? 'Reposição no Caixa' : 'Retirada / Empréstimo'));
    setMovDate(new Date().toISOString().substring(0, 10));
    setMovNotes('');
    setIsMovementModalOpen(true);
  };

  const handleOpenEditMovement = (m: FinanceCashMovementItem) => {
    setEditingMovementId(m.id);
    setMovRegisterId(m.cashRegisterId);
    setMovType(m.type);
    setMovAmount(m.amount.toString());
    setMovReason(m.reason);
    setMovDate(m.date ? m.date.substring(0, 10) : new Date().toISOString().substring(0, 10));
    setMovNotes(m.notes || '');
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(movAmount);
    if (!movRegisterId || !movReason.trim() || isNaN(amtNum) || amtNum <= 0) return;

    const targetReg = registers.find((r) => r.id === movRegisterId);
    const regName = targetReg ? targetReg.name : 'Caixa';

    if (editingMovementId) {
      const existing = movements.find((m) => m.id === editingMovementId);
      if (existing) {
        const isNowPaid = existing.isPaid && amtNum <= existing.paidBackAmount;
        const updated: FinanceCashMovementItem = {
          ...existing,
          cashRegisterId: movRegisterId,
          cashRegisterName: regName,
          type: movType,
          amount: amtNum,
          reason: movReason.trim(),
          date: movDate,
          isPaid: movType === 'DEPOSIT' ? true : isNowPaid,
          notes: movNotes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveFinanceCashMovement(updated);
      }
    } else {
      const newMov: FinanceCashMovementItem = {
        id: 'fmov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        cashRegisterId: movRegisterId,
        cashRegisterName: regName,
        type: movType,
        amount: amtNum,
        reason: movReason.trim(),
        date: movDate,
        paidBackAmount: 0,
        isPaid: movType === 'DEPOSIT', // Depósitos já entram como concluídos
        notes: movNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveFinanceCashMovement(newMov);
    }

    loadData();
    setIsMovementModalOpen(false);
  };

  // --- Handlers para Despesa Definitiva (Finanças Final) ---
  const handleOpenDefinitiveModal = (regId: string) => {
    setDefRegisterId(regId);
    setDefAmount('');
    setDefReason('');
    setIsDefinitiveModalOpen(true);
  };

  const handleSaveDefinitiveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(defAmount);
    if (!defRegisterId || !defReason.trim() || isNaN(amtNum) || amtNum <= 0) return;

    StorageService.saveDefinitiveExpense({
      id: 'def-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      cashRegisterId: defRegisterId,
      amount: amtNum,
      reason: defReason.trim(),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    loadData();
    setIsDefinitiveModalOpen(false);
  };

  const handleDeleteDefinitiveExpense = (id: string) => {
    StorageService.deleteDefinitiveExpense(id);
    loadData();
  };

  // --- Adicionar Transação ao Card (Adicionar Mais Retirada ou Devolver ao Caixa) ---
  const handleOpenTransactionModal = (m: FinanceCashMovementItem, type: 'ADD' | 'PAYBACK') => {
    setTxMovement(m);
    setTxType(type);
    setTxAmount('');
    setTxDescription(type === 'ADD' ? 'Adicional ao Empréstimo / Retirada' : 'Devolução ao Caixa');
    setTxDate(new Date().toISOString().substring(0, 10));
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txMovement) return;

    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newTx = {
      id: 'ftx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: txType,
      amount: amt,
      date: txDate,
      description: txDescription.trim() || (txType === 'ADD' ? 'Adicional' : 'Devolução'),
      createdAt: new Date().toISOString(),
    };

    const existingTransactions = txMovement.transactions || [];
    const updatedTransactions = [newTx, ...existingTransactions];

    const addTotal = updatedTransactions.filter(t => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
    const paybackTotal = updatedTransactions.filter(t => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);
    const totalAmt = txMovement.amount + addTotal;
    const totalPaid = (txMovement.paidBackAmount || 0) + paybackTotal;
    const isFullyPaid = totalPaid >= totalAmt;

    const updated: FinanceCashMovementItem = {
      ...txMovement,
      transactions: updatedTransactions,
      isPaid: txMovement.type === 'WITHDRAWAL' ? isFullyPaid : true,
      paidAt: isFullyPaid ? new Date().toISOString() : txMovement.paidAt,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveFinanceCashMovement(updated);
    loadData();
    setIsTransactionModalOpen(false);
    setTxMovement(null);
  };

  // --- Zerar Caixa ("assim que pagar o total que foi tirado zereo caixa") ---
  const handleResetRegisterConfirm = (regId: string, regName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Zerar Retiradas do Caixa',
      message: `Tem certeza que deseja zerar todas as retiradas do caixa "${regName}"? Todas as retiradas pendentes serão marcadas como quitadas/pagas e o saldo do caixa voltará integralmente.`,
      actionType: 'RESET_REGISTER',
      targetId: regId,
    });
  };

  const handleExecuteConfirm = () => {
    if (confirmDialog.actionType === 'RESET_REGISTER') {
      StorageService.resetRegisterWithdrawals(confirmDialog.targetId);
    } else if (confirmDialog.actionType === 'DELETE_REGISTER') {
      StorageService.deleteFinanceCashRegister(confirmDialog.targetId);
      const orphaned = movements.filter((m) => m.cashRegisterId === confirmDialog.targetId);
      orphaned.forEach((m) => StorageService.deleteFinanceCashMovement(m.id));
    } else if (confirmDialog.actionType === 'DELETE_MOVEMENT') {
      StorageService.deleteFinanceCashMovement(confirmDialog.targetId);
    }

    loadData();
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      actionType: 'DELETE_REGISTER',
      targetId: '',
    });
  };

  // Cores personalizadas dos Caixas
  const getRegisterColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return {
          border: 'border-blue-500/40 hover:border-blue-400/70',
          bg: 'bg-gradient-to-br from-[#061533] via-[#030d22] to-[#020713]',
          glow: 'shadow-[0_0_25px_rgba(59,130,246,0.18)]',
          badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          accent: 'text-blue-400',
          btn: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
      case 'purple':
        return {
          border: 'border-purple-500/40 hover:border-purple-400/70',
          bg: 'bg-gradient-to-br from-[#1c0836] via-[#100422] to-[#06010f]',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.18)]',
          badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          accent: 'text-purple-400',
          btn: 'bg-purple-600 hover:bg-purple-500 text-white',
        };
      case 'amber':
        return {
          border: 'border-amber-500/40 hover:border-amber-400/70',
          bg: 'bg-gradient-to-br from-[#2a1705] via-[#180c02] to-[#0b0500]',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.18)]',
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          accent: 'text-amber-400',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      case 'cyan':
        return {
          border: 'border-cyan-500/40 hover:border-cyan-400/70',
          bg: 'bg-gradient-to-br from-[#04202c] via-[#02131b] to-[#01090e]',
          glow: 'shadow-[0_0_25px_rgba(6,182,212,0.18)]',
          badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          accent: 'text-cyan-400',
          btn: 'bg-cyan-600 hover:bg-cyan-500 text-white',
        };
      case 'rose':
        return {
          border: 'border-rose-500/40 hover:border-rose-400/70',
          bg: 'bg-gradient-to-br from-[#2b0816] via-[#17030b] to-[#090104]',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.18)]',
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          accent: 'text-rose-400',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white',
        };
      default: // emerald
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400/70',
          bg: 'bg-gradient-to-br from-[#04241a] via-[#02140e] to-[#010906]',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.18)]',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          accent: 'text-emerald-400',
          btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
    }
  };

  return (
    <div>
      <button
        type="button"
        id="btn-novo-caixa-action"
        onClick={handleOpenNewRegister}
        className="hidden"
      />

      {/* 2. STATS BANNER DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Stat 1: Saldo Disponível em Todos os Caixas */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-[#02130e] p-3 sm:p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
              Saldo em Todos os Caixas
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
              <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate font-mono">
              {formatCurrency(totals.totalBalance)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 shrink-0" />
              <span>{totals.registersCount} {totals.registersCount === 1 ? 'caixa cadastrado' : 'caixas cadastrados'}</span>
            </span>
          </div>
        </div>

        {/* Stat 2: TOTAL SALDO INICIAL */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-teal-500/30 bg-[#021814] p-3 sm:p-5 shadow-[0_0_20px_rgba(20,184,166,0.15)] group hover:border-teal-400/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-teal-500/10 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-teal-300 uppercase tracking-widest truncate">
              Total Saldo Inicial
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.3)] shrink-0">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-black text-teal-300 block tracking-wide truncate font-mono">
              {formatCurrency(totals.totalInitialBalance)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-teal-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
              Incluindo adições e aportes
            </span>
          </div>
        </div>

        {/* Stat 2: TOTAL TIRADO */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/30 bg-[#12041f] p-3 sm:p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)] group hover:border-purple-400/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/10 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-purple-300 uppercase tracking-widest truncate">
              Total Tirado
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)] shrink-0">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-black text-purple-300 block tracking-wide truncate font-mono">
              {formatCurrency(totals.totalWithdrawnGross)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-purple-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
              {totals.withdrawnMovementsCount} {totals.withdrawnMovementsCount === 1 ? 'retirada realizada' : 'retiradas realizadas'}
            </span>
          </div>
        </div>

        {/* Stat 3: TOTAL FALTANDO (DO LADO DO QUADRADO TOTAL TIRADO) */}
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3 sm:p-5 transition-all group ${
          totals.totalWithdrawnPending > 0
            ? 'border-rose-500/40 bg-[#1a040d] shadow-[0_0_20px_rgba(244,63,94,0.2)] hover:border-rose-400/60'
            : 'border-emerald-500/30 bg-[#02130e] shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400/50'
        }`}>
          <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-xl group-hover:scale-125 transition-transform ${
            totals.totalWithdrawnPending > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'
          }`} />
          <div className="flex items-center justify-between">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate ${
              totals.totalWithdrawnPending > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              Total Faltando
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              totals.totalWithdrawnPending > 0
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            }`}>
              {totals.totalWithdrawnPending > 0 ? (
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className={`text-base sm:text-2xl font-black block tracking-wide truncate font-mono ${
              totals.totalWithdrawnPending > 0 ? 'text-rose-400' : 'text-emerald-300'
            }`}>
              {formatCurrency(totals.totalWithdrawnPending)}
            </span>
            <span className={`text-[8px] sm:text-[9px] font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate ${
              totals.totalWithdrawnPending > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {totals.totalWithdrawnPending > 0 ? (
                totals.totalPaidBack > 0 ? `Já reposto: ${formatCurrency(totals.totalPaidBack)}` : 'Para preencher o saldo inicial'
              ) : (
                'Tudo preenchido / Caixas em dia'
              )}
            </span>
          </div>
        </div>

        {/* Stat 4: Total Colocado / Reposto */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-[#02131a] p-3 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] group hover:border-cyan-400/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
              Total Colocado / Entradas
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-black text-cyan-300 block tracking-wide truncate font-mono">
              {formatCurrency(totals.totalDeposited)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-cyan-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
              Entradas adicionais no caixa
            </span>
          </div>
        </div>

        {/* Stat 5: Histórico de Devoluções */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-[#061026] p-3 sm:p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)] group hover:border-blue-400/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-500/10 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
              Saldo Devolvido
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-black text-blue-300 block tracking-wide truncate font-mono">
              {formatCurrency(totals.totalPaidBack)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-blue-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
              Total já recolocado de volta
            </span>
          </div>
        </div>
      </div>

      {/* 3. LAYOUT RESPONSIVO: APENAS OS CARDS DE CAIXA COM AS MOVIMENTAÇÕES DENTRO DE CADA UM */}
      {registers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 space-y-3 max-w-lg mx-auto">
          <Landmark className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-base text-slate-300 font-bold">Nenhum Caixa cadastrado ainda.</p>
          <button
            type="button"
            onClick={handleOpenNewRegister}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-all cursor-pointer"
          >
            + Criar Primeiro Caixa
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {registers.map((reg) => {
            const colorClasses = getRegisterColorClasses(reg.color);
            const hasWithdrawn = (reg.totalWithdrawn || 0) > 0;
            const regMovements = movements.filter((m) => m.cashRegisterId === reg.id);
            const regExpenses = definitiveExpenses.filter((e) => e.cashRegisterId === reg.id);
            const totalDefinitiveExpenses = regExpenses.reduce((s, e) => s + e.amount, 0);

            const targetInitial = Math.max(0, (reg.initialBalance || 0) - totalDefinitiveExpenses);

            const regWithdrawalMovements = regMovements.filter((m) => m.type === 'WITHDRAWAL');
            let regTotalWithdrawnGross = 0;
            let regTotalPaidBack = 0;

            regWithdrawalMovements.forEach((m) => {
              const addTotal = (m.transactions || []).filter((t) => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
              const paybackTotal = (m.transactions || []).filter((t) => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);
              const fullWithdrawn = m.amount + addTotal;
              const fullPaid = (m.paidBackAmount || 0) + paybackTotal;
              regTotalWithdrawnGross += fullWithdrawn;
              regTotalPaidBack += fullPaid;
            });

            // Depósitos e Reposições feitas no caixa (saldo colocado de volta)
            const regDepositMovements = regMovements.filter((m) => m.type === 'DEPOSIT');
            let regTotalDepositedMovements = 0;
            regDepositMovements.forEach((m) => {
              const addTotal = (m.transactions || []).filter((t) => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
              const paybackTotal = (m.transactions || []).filter((t) => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);
              regTotalDepositedMovements += (m.amount + addTotal) - paybackTotal;
            });

            const totalColocadoDeVolta = regTotalPaidBack + regTotalDepositedMovements;

            // O valor que falta para preencher o valor do caixa inicial:
            // Se o saldo atual for menor que o saldo inicial líquido, a diferença é exatamente o que falta.
            const regTotalFaltando = Math.max(0, targetInitial - (reg.currentBalance || 0));

            return (
              <div key={reg.id} className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                {/* ---------------------------------------------------- */}
                {/* CARD 1: CAIXA PRINCIPAL / SALDO DO CAIXA             */}
                {/* ---------------------------------------------------- */}
                <div className={`rounded-3xl p-4 sm:p-6 border-2 transition-all relative overflow-hidden flex flex-col justify-between shadow-xl ${colorClasses.border} ${colorClasses.bg} ${colorClasses.glow}`}>
                  <div>
                    {/* Header do Card Caixa */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${colorClasses.badge}`}>
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base sm:text-lg font-black text-white truncate">
                            {reg.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {reg.notes || 'Caixa de Operação'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRegister(reg, 'ADD')}
                          className="px-2.5 py-1.5 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-950/85 transition-all cursor-pointer flex items-center gap-1 group border border-emerald-500/30 text-xs font-bold shadow-sm"
                          title="Editar Caixa e Alimentar Saldo Inicial"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black hidden sm:inline text-emerald-400 group-hover:text-white">Alimentar / Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Excluir Caixa',
                              message: `Deseja realmente apagar o caixa "${reg.name}"? As movimentações vinculadas também serão excluídas.`,
                              actionType: 'DELETE_REGISTER',
                              targetId: reg.id,
                            })
                          }
                          className="p-2 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/60 transition-all cursor-pointer border border-rose-500/20"
                          title="Apagar Caixa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bloco de Saldos */}
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 my-1.5">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Saldo Atual Disponível (Líquido)
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl font-black text-white tracking-tight font-mono">
                            {formatCurrency(reg.currentBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-1" />

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            Saldo Inicial (Líquido)
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-extrabold text-slate-300 font-mono">
                              {formatCurrency(Math.max(0, (reg.initialBalance || 0) - totalDefinitiveExpenses))}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditRegister(reg, 'ADD')}
                              className="px-1.5 py-0.5 rounded-md bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-0.5 shadow-sm active:scale-95"
                              title="Adicionar mais saldo ao saldo inicial (Alimentar)"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Alimentar</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                            Total Depositado / Reposto
                          </span>
                          <span className="font-black text-emerald-400 font-mono">
                            {formatCurrency(reg.totalDeposited)}
                          </span>
                        </div>
                      </div>

                      {/* Total Tirado e Total Faltando do Card Caixa */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-white/10">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-purple-300 block">
                            Total Tirado
                          </span>
                          <span className="font-black text-purple-300 font-mono text-sm sm:text-base">
                            {formatCurrency(regTotalWithdrawnGross)}
                          </span>
                          <span className="text-[8px] text-purple-400/80 block mt-0.5 truncate">
                            {regWithdrawalMovements.length} {regWithdrawalMovements.length === 1 ? 'retirada' : 'retiradas'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-rose-300 block">
                            Total Faltando
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`font-black font-mono text-sm sm:text-base ${regTotalFaltando > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatCurrency(regTotalFaltando)}
                            </span>
                            {totalColocadoDeVolta > 0 && regTotalFaltando > 0 && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-bold">
                                +{formatCurrency(totalColocadoDeVolta)} reposto
                              </span>
                            )}
                            {regTotalFaltando === 0 && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Caixa Completo</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 block mt-0.5 truncate">
                            {regTotalFaltando > 0 ? 'Para preencher o saldo inicial' : 'Saldo inicial 100% preenchido'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Histórico de Adições / Aportes ao Saldo Inicial dentro do Card */}
                    <div className="space-y-1.5 my-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Histórico de Adições de Saldo Inicial</span>
                        <span className="text-[9px] text-slate-400">{reg.initialBalanceHistory?.length || 0} registros</span>
                      </div>
                      <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 scrollbar-thin">
                        {(!reg.initialBalanceHistory || reg.initialBalanceHistory.length === 0) ? (
                          <p className="text-[11px] text-slate-500 italic py-1 text-center">Nenhuma adição de saldo inicial registrada.</p>
                        ) : (
                          reg.initialBalanceHistory.map((h: any) => (
                            <div key={h.id} className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-emerald-200 truncate">{h.reason || 'Adição de Saldo Inicial'}</div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-black text-emerald-400 font-mono">+{formatCurrency(h.amountAdded)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditHistory(reg.id, h)}
                                  className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                  title="Editar adição"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHistory(reg.id, h.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Apagar adição"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Lista de Movimentações (Depósitos e Retiradas) */}
                    <div className="space-y-1.5 my-1.5 pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Movimentações do Caixa</span>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                        {regMovements.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1 text-center">Nenhuma movimentação registrada.</p>
                        ) : (
                          regMovements.map((m) => {
                            const isDeposit = m.type === 'DEPOSIT';
                            const addTotal = (m.transactions || []).filter((t) => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
                            const paybackTotal = (m.transactions || []).filter((t) => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);
                            const totalAmt = m.amount + addTotal;
                            const totalPaid = (m.paidBackAmount || 0) + paybackTotal;
                            const remainingFaltando = m.isPaid ? 0 : Math.max(0, totalAmt - totalPaid);

                            return (
                              <div key={m.id} className={`p-2.5 rounded-2xl bg-black/60 border ${isDeposit ? 'border-emerald-900/40 text-emerald-300' : remainingFaltando > 0 ? 'border-rose-900/40 text-rose-300' : 'border-slate-800 text-slate-400'} space-y-1 text-xs`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      isDeposit
                                        ? 'bg-emerald-950 text-emerald-300'
                                        : m.isPaid
                                        ? 'bg-slate-800 text-slate-400 line-through'
                                        : 'bg-rose-950 text-rose-300'
                                    }`}>
                                      {isDeposit ? 'Reposição / Depósito' : m.isPaid ? 'Retirada (Quitada)' : 'Retirada'}
                                    </span>
                                    {!isDeposit && remainingFaltando > 0 && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono">
                                        Falta: {formatCurrency(remainingFaltando)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-black font-mono text-xs ${isDeposit ? 'text-emerald-400' : 'text-purple-400'}`}>
                                      {isDeposit ? '+' : '-'}{formatCurrency(totalAmt)}
                                    </span>
                                    {!isDeposit && remainingFaltando > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenTransactionModal(m, 'PAYBACK')}
                                        className="px-2 py-0.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
                                        title="Colocar saldo de volta no caixa"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        <span>Devolver</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditMovement(m)}
                                      className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                      title="Editar movimentação"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDialog({
                                          isOpen: true,
                                          title: 'Excluir Movimentação',
                                          message: `Deseja realmente apagar esta movimentação de ${formatCurrency(m.amount)}?`,
                                          actionType: 'DELETE_MOVEMENT',
                                          targetId: m.id,
                                        });
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                      title="Remover movimentação"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] pt-0.5">
                                  <div className="text-white font-bold break-words">{m.reason || m.notes || (isDeposit ? 'Reposição' : 'Retirada')}</div>
                                  {!isDeposit && totalPaid > 0 && (
                                    <span className="text-blue-300 text-[10px] font-bold shrink-0">
                                      Devolvido: +{formatCurrency(totalPaid)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Caixa Principal */}
                  <div className="space-y-1.5 pt-1.5 border-t border-white/15 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenNewMovement(reg.id, 'DEPOSIT', 'Reposição no Caixa')}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>(+) Colocar / Depositar no Caixa</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleOpenNewMovement(reg.id, 'WITHDRAWAL', 'Retirada / Empréstimo do Caixa')}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                    >
                      <Minus className="w-4 h-4 stroke-[3]" />
                      <span>(-) Nova Retirada / Empréstimo</span>
                    </button>

                    {(regMovements.length > 0 || (reg.totalDeposited || 0) > 0) && (
                      <button
                        type="button"
                        onClick={() => handleResetRegisterConfirm(reg.id, reg.name)}
                        className="w-full py-2.5 px-2.5 rounded-2xl text-[11px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Zerar Caixa (Limpar Tudo)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* CARD 2: CARD DE FINAÇAS FINAL (DEFINITIVO)           */}
                {/* ---------------------------------------------------- */}
                <div className="rounded-3xl p-4 sm:p-6 border-2 border-rose-500/30 bg-[#120408] transition-all relative overflow-hidden flex flex-col justify-between shadow-xl">
                  <div>
                    {/* Header Card Retiradas */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-rose-500/40 bg-rose-500/20 text-rose-300">
                          <Minus className="w-5 h-5 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base sm:text-lg font-black text-white truncate">
                            FINANÇAS FINAL
                          </h4>
                          <div className="space-y-0.5 mt-0.5">
                            <span className="text-[11px] text-rose-400 font-bold block truncate">
                              Total Tirado: {formatCurrency(totalDefinitiveExpenses)}
                            </span>
                            <span className="text-[11px] text-amber-400 font-bold block truncate">
                              Saldo Inicial (Menos Gastos): {formatCurrency(Math.max(0, (reg.initialBalance || 0) - totalDefinitiveExpenses))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Despesas Definitivas */}
                    <div className="space-y-1.5 my-1.5 pt-1">
                      <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
                        {regExpenses.map((e) => (
                          <div key={e.id} className="p-3 rounded-2xl bg-black/60 border border-rose-900/30 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-950 text-rose-300">Gasto Definitivo</span>
                              <div className="flex items-center gap-2">
                                <span className="font-black font-mono text-rose-400">-{formatCurrency(e.amount)}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    StorageService.deleteDefinitiveExpense(e.id);
                                    loadData();
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Remover gasto definitivo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-white font-black text-xs break-words">{e.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card de Finanças Final */}
                  <div className="space-y-2 pt-3 border-t border-white/15 mt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDefinitiveModal(reg.id)}
                      className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>(+) Registrar Gasto Definitivo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CRIAR OU EDITAR CAIXA                                 */}
      {/* ============================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091024] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  {editingRegisterId ? 'Editar Caixa' : 'Novo Card de Caixa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const currentEditingReg = editingRegisterId ? registers.find((r) => r.id === editingRegisterId) : null;
              const previewAdded = parseFloat(addInitialAmount) || 0;
              const currentBase = currentEditingReg ? (currentEditingReg.initialBalance || 0) : 0;
              const previewNewInitial = currentBase + previewAdded;

              return (
                <form onSubmit={handleSaveRegister} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Nome do Caixa *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Caixa Principal, Caixa Balcão, Cofre..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>

                  {/* SEÇÃO DO SALDO INICIAL: ADICIONAR / ALIMENTAR SALDO INICIAL OU EDITAR TOTAL */}
                  {editingRegisterId && currentEditingReg ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span>Saldo Inicial do Caixa</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Inicial Atual</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            {formatCurrency(currentBase)}
                          </span>
                        </div>
                      </div>

                      {/* Seletor de Modo: Alimentar / Adicionar vs Alterar Valor Total */}
                      <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setInitialBalanceMode('ADD')}
                          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            initialBalanceMode === 'ADD'
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar / Alimentar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInitialBalanceMode('SET')}
                          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            initialBalanceMode === 'SET'
                              ? 'bg-cyan-600 text-white shadow-md font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Alterar Valor Total</span>
                        </button>
                      </div>

                      {initialBalanceMode === 'ADD' ? (
                        <div className="space-y-2.5 pt-0.5">
                          <div>
                            <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                              Quanto deseja adicionar ao saldo inicial? (R$)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xs">
                                + R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                autoFocus
                                value={addInitialAmount}
                                onChange={(e) => setAddInitialAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-12 pr-3 py-2 rounded-xl text-sm bg-slate-950 border border-emerald-500/40 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400 font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Botões de Atalho Rápido para Adicionar */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[20, 50, 100, 200, 500].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  const current = parseFloat(addInitialAmount) || 0;
                                  setAddInitialAmount((current + val).toString());
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[10px] font-black transition-all cursor-pointer active:scale-95"
                              >
                                +R${val}
                              </button>
                            ))}
                            {previewAdded > 0 && (
                              <button
                                type="button"
                                onClick={() => setAddInitialAmount('')}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] hover:text-white cursor-pointer"
                              >
                                Limpar
                              </button>
                            )}
                          </div>

                          {/* Previsão do Novo Saldo Inicial */}
                          {previewAdded > 0 && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs animate-fade-in">
                              <div>
                                <span className="text-[10px] text-emerald-400 font-bold block">
                                  Novo Saldo Inicial Calculado:
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {formatCurrency(currentBase)} + {formatCurrency(previewAdded)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-emerald-300 font-mono">
                                  = {formatCurrency(previewNewInitial)}
                                </span>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              Motivo do Aporte / Alimentação (Opcional)
                            </label>
                            <input
                              type="text"
                              value={addInitialReason}
                              onChange={(e) => setAddInitialReason(e.target.value)}
                              placeholder="Ex: Reforço de troco para o dia, Aporte de capital"
                              className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-0.5">
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Saldo Inicial / Fundo Base Total (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={regInitialBalance}
                              onChange={(e) => setRegInitialBalance(e.target.value)}
                              placeholder="Ex: 500.00"
                              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-bold font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Substitui o valor base total do saldo inicial.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Histórico de Aportes anteriores */}
                      {currentEditingReg.initialBalanceHistory && currentEditingReg.initialBalanceHistory.length > 0 && (
                        <div className="pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <History className="w-3 h-3" />
                            <span>{showHistory ? 'Ocultar histórico de aportes' : `Ver histórico de aportes (${currentEditingReg.initialBalanceHistory.length})`}</span>
                          </button>

                          {showHistory && (
                            <div className="mt-2 space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                              {currentEditingReg.initialBalanceHistory.map((h) => (
                                <div key={h.id} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-200 block truncate max-w-[190px]">{h.reason || 'Aporte de saldo inicial'}</span>
                                    <span className="text-slate-500 text-[9px]">{new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-emerald-400 font-mono">+{formatCurrency(h.amountAdded)}</span>
                                    <span className="text-slate-500 block text-[9px]">Saldo: {formatCurrency(h.newBalance)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Saldo Inicial / Fundo Base (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={regInitialBalance}
                        onChange={(e) => setRegInitialBalance(e.target.value)}
                        placeholder="Ex: 500.00"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Fundo de troco ou saldo de partida na gaveta do caixa.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Cor do Card
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {(['emerald', 'blue', 'purple', 'amber', 'cyan', 'rose'] as const).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRegColor(color)}
                          className={`h-8 rounded-xl border-2 transition-all flex items-center justify-center ${
                            regColor === color ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          } ${
                            color === 'emerald'
                              ? 'bg-emerald-600'
                              : color === 'blue'
                              ? 'bg-blue-600'
                              : color === 'purple'
                              ? 'bg-purple-600'
                              : color === 'amber'
                              ? 'bg-amber-600'
                              : color === 'cyan'
                              ? 'bg-cyan-600'
                              : 'bg-rose-600'
                          }`}
                        >
                          {regColor === color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Observações / Localização (Opcional)
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="Ex: Gaveta do balcão 01"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg cursor-pointer flex items-center gap-1.5 ${
                        editingRegisterId && initialBalanceMode === 'ADD' && previewAdded > 0
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                          : 'bg-cyan-600 hover:bg-cyan-500'
                      }`}
                    >
                      {editingRegisterId ? (
                        initialBalanceMode === 'ADD' && previewAdded > 0 ? (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Alimentar Saldo (+{formatCurrency(previewAdded)})</span>
                          </>
                        ) : (
                          'Salvar Alterações'
                        )
                      ) : (
                        'Criar Caixa'
                      )}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CRIAR OU EDITAR MOVIMENTAÇÃO (TIRAR / COLOCAR / EMPRESA)*/}
      {/* ============================================================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091024] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  movType === 'WITHDRAWAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {movType === 'WITHDRAWAL' ? <Minus className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  {editingMovementId
                    ? 'Editar Movimentação'
                    : movType === 'WITHDRAWAL'
                    ? 'Tirar / Pegar Emprestado do Caixa (-)'
                    : 'Colocar Dinheiro no Caixa (+)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovType('WITHDRAWAL')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      movType === 'WITHDRAWAL'
                        ? 'bg-rose-600 text-white shadow-md border border-rose-400'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>(-) Tirar / Emprestado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovType('DEPOSIT')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      movType === 'DEPOSIT'
                        ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>(+) Colocar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Qual Caixa? *
                </label>
                <select
                  required
                  value={movRegisterId}
                  onChange={(e) => setMovRegisterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-bold"
                >
                  {registers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Saldo: {formatCurrency(r.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movAmount}
                  onChange={(e) => setMovAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-black text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-black text-amber-300 block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Motivo da Retirada / Empréstimo *</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ex: Empréstimo pessoal, Compra de peça urgente, Vale..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-amber-500/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={movDate}
                  onChange={(e) => setMovDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observações Extras (Opcional)
                </label>
                <input
                  type="text"
                  value={movNotes}
                  onChange={(e) => setMovNotes(e.target.value)}
                  placeholder="Ex: Comprovante guardado"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg cursor-pointer ${
                    movType === 'WITHDRAWAL'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {editingMovementId ? 'Salvar Alterações' : movType === 'WITHDRAWAL' ? 'Confirmar Retirada' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADICIONAR TRANSAÇÃO AO CARD (RETIRADA OU DEVOLUÇÃO)  */}
      {/* ============================================================== */}
      {isTransactionModalOpen && txMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091024] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  txType === 'ADD' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}>
                  {txType === 'ADD' ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  {txType === 'ADD' ? 'Adicionar Mais Retirada / Empréstimo' : 'Devolver / Pagar ao Caixa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransactionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTxType('PAYBACK')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  txType === 'PAYBACK'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Devolver ao Caixa
              </button>
              <button
                type="button"
                onClick={() => setTxType('ADD')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  txType === 'ADD'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Adicionar Retirada
              </button>
            </div>

            {(() => {
              const addTotal = (txMovement.transactions || []).filter((t) => t.type === 'ADD').reduce((s, t) => s + t.amount, 0);
              const paybackTotal = (txMovement.transactions || []).filter((t) => t.type === 'PAYBACK').reduce((s, t) => s + t.amount, 0);
              const totalAmt = txMovement.amount + addTotal;
              const totalPaid = (txMovement.paidBackAmount || 0) + paybackTotal;
              const remainingFaltando = Math.max(0, totalAmt - totalPaid);

              return (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <div>Caixa: <span className="font-bold text-white">{txMovement.cashRegisterName || 'Caixa'}</span></div>
                    <div>Motivo: <span className="font-bold text-amber-300">{txMovement.reason}</span></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-800 text-center">
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-purple-400 block uppercase font-bold">Total Tirado</span>
                      <span className="text-xs font-black text-purple-300 font-mono">{formatCurrency(totalAmt)}</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-emerald-400 block uppercase font-bold">Já Devolvido</span>
                      <span className="text-xs font-black text-emerald-300 font-mono">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                      <span className="text-[9px] text-rose-300 block uppercase font-bold">Total Faltando</span>
                      <span className="text-xs font-black text-rose-400 font-mono">{formatCurrency(remainingFaltando)}</span>
                    </div>
                  </div>

                  {txType === 'PAYBACK' && remainingFaltando > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold">Atalhos rápidos:</span>
                      <button
                        type="button"
                        onClick={() => setTxAmount(remainingFaltando.toString())}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-black cursor-pointer active:scale-95"
                      >
                        Devolver Tudo ({formatCurrency(remainingFaltando)})
                      </button>
                      {[20, 50, 100, 200].filter((v) => v < remainingFaltando).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setTxAmount(v.toString())}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          +R${v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleSaveTransaction} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Valor da Operação (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0,00"
                  className={`w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border text-white placeholder-slate-500 focus:outline-none font-black text-lg ${
                    txType === 'ADD' ? 'border-rose-500/50 focus:border-rose-400' : 'border-emerald-500/50 focus:border-emerald-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição / Motivo deste lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ex: Parcela 2, Empréstimo adicional..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg cursor-pointer ${
                    txType === 'ADD' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {txType === 'ADD' ? 'Confirmar Adição' : 'Confirmar Devolução'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DEFINITIVE EXPENSE (FINANÇAS FINAL)                   */}
      {/* ============================================================== */}
      {isDefinitiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091024] border border-rose-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center">
                  <Minus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  Nova Despesa Definitiva
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDefinitiveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDefinitiveExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Valor da Despesa (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={defAmount}
                  onChange={(e) => setDefAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Motivo / Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={defReason}
                  onChange={(e) => setDefReason(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor XYZ"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDefinitiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
                >
                  Confirmar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CONFIRMAÇÃO GERAL (EXCLUIR OU ZERAR CAIXA)            */}
      {/* ============================================================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#091024] border border-amber-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: false,
                    title: '',
                    message: '',
                    actionType: 'DELETE_REGISTER',
                    targetId: '',
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-lg cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDITAR ADIÇÃO / HISTÓRICO DE SALDO INICIAL            */}
      {/* ============================================================== */}
      {isHistoryEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091024] border border-teal-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(20,184,166,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  Editar Adição / Aporte de Saldo Inicial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHistory} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Valor Adicionado (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editHistoryAmount}
                  onChange={(e) => setEditHistoryAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-teal-300 font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Motivo / Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={editHistoryReason}
                  onChange={(e) => setEditHistoryReason(e.target.value)}
                  placeholder="Ex: Reforço de troco"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHistoryEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-500 text-white shadow-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
