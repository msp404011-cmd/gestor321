import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit,
  Check, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  Sparkles,
  PieChart,
  BadgeAlert,
  Loader2,
  ListPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  FileText
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { MonthlyDebit, MonthlyDebitPayment, AccountsPayable, AccountsPayableTransaction } from '../../types';
import { formatCurrency } from '../../services/formatters';

// Simple Canvas Confetti helper written from scratch for absolute reliability and zero external package dependency
class ConfettiEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }> = [];
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public burst(x: number, y: number) {
    const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x,
        y,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 12,
        speedY: (Math.random() - 0.7) * 16 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!this.animationFrameId) {
      this.animate();
    }
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.35; // gravity
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.015;

      if (p.opacity <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      
      // Draw rectangular confetti piece
      this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
    }
  };

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

export function MonthlyDebitsView() {
  const [activeMainTab, setActiveMainTab] = useState<'PARCELADOS' | 'CONTAS_PAGAR'>('PARCELADOS');
  const [debits, setDebits] = useState<MonthlyDebit[]>([]);
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State to edit debit or payable
  const [editingDebitId, setEditingDebitId] = useState<string | null>(null);
  const [editingPayableId, setEditingPayableId] = useState<string | null>(null);

  // States to add inline Transactions (debits or payments) into AccountsPayable
  const [activePayableIdForTx, setActivePayableIdForTx] = useState<string | null>(null);
  const [payableTxType, setPayableTxType] = useState<'DEBIT' | 'PAYMENT'>('DEBIT');
  const [payableTxAmount, setPayableTxAmount] = useState('');
  const [payableTxDesc, setPayableTxDesc] = useState('');

  // Current calendar month-year tracker (formatted as YYYY-MM)
  const currentMonthYear = (() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  })();

  // Form State for MonthlyDebits
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('12');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startMonth, setStartMonth] = useState(currentMonthYear);

  // Form State for AccountsPayable
  const [payableName, setPayableName] = useState('');
  const [payableDueDate, setPayableNameDueDate] = useState('');

  // Expand state for checking payment logs (or curtain sliding down)
  const [expandedDebits, setExpandedDebits] = useState<Record<string, boolean>>({});
  const [expandedPayables, setExpandedPayables] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiEngineRef = useRef<ConfettiEngine | null>(null);

  // Load and subscribe to storage
  useEffect(() => {
    setDebits(StorageService.getMonthlyDebits());
    setPayables(StorageService.getAccountsPayable());
    
    const unsubscribe = StorageService.subscribe(() => {
      setDebits(StorageService.getMonthlyDebits());
      setPayables(StorageService.getAccountsPayable());
    });
    return unsubscribe;
  }, []);

  // Initialize and resize confetti canvas
  useEffect(() => {
    if (canvasRef.current) {
      const engine = new ConfettiEngine(canvasRef.current);
      confettiEngineRef.current = engine;
      
      const handleResize = () => {
        if (canvasRef.current) {
          engine.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Format YYYY-MM string to Portuguese words (Ex: "Setembro de 2026")
  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[Number(month) - 1]} de ${year}`;
  };

  // Helper to retrieve due month based on startMonth and installment index (1-based)
  const getInstallmentMonth = (startMonthStr: string, index: number) => {
    if (!startMonthStr) startMonthStr = currentMonthYear;
    const [year, month] = startMonthStr.split('-').map(Number);
    const date = new Date(year, month - 1 + (index - 1), 15); // use mid-month
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}`;
  };

  // Smart date check for current month status for MonthlyDebits
  const getStatusForCurrentMonth = (debit: MonthlyDebit) => {
    if (debit.paidInstallments >= debit.installmentsCount) return 'FULLY_PAID';

    const startMonthStr = debit.startMonth || currentMonthYear;
    const [startY, startM] = startMonthStr.split('-').map(Number);
    const [currY, currM] = currentMonthYear.split('-').map(Number);
    
    const elapsedMonths = (currY - startY) * 12 + (currM - startM);
    if (elapsedMonths < 0) return 'FUTURE'; // starts in a future month

    const currentInstallmentIndex = elapsedMonths + 1;

    const paidThisMonth = debit.payments.some(p => {
      const pMonth = p.paidAt.substring(0, 7);
      return pMonth === currentMonthYear;
    });

    if (paidThisMonth || debit.paidInstallments >= currentInstallmentIndex) {
      return 'PAID_THIS_MONTH';
    } else {
      return 'PENDING_THIS_MONTH';
    }
  };

  // Bi-directional calculations handlers for MonthlyDebits Form
  const handleTotalAmountChange = (val: string) => {
    setTotalAmount(val);
    const total = parseFloat(val);
    const count = parseInt(installmentsCount);
    if (!isNaN(total) && !isNaN(count) && count > 0) {
      setInstallmentAmount((total / count).toFixed(2));
    } else {
      setInstallmentAmount('');
    }
  };

  const handleInstallmentAmountChange = (val: string) => {
    setInstallmentAmount(val);
    const inst = parseFloat(val);
    const count = parseInt(installmentsCount);
    if (!isNaN(inst) && !isNaN(count) && count > 0) {
      setTotalAmount((inst * count).toFixed(2));
    } else {
      setTotalAmount('');
    }
  };

  const handleInstallmentsCountChange = (val: string) => {
    setInstallmentsCount(val);
    const count = parseInt(val);
    if (isNaN(count) || count <= 0) return;

    const inst = parseFloat(installmentAmount);
    const total = parseFloat(totalAmount);

    if (!isNaN(inst)) {
      setTotalAmount((inst * count).toFixed(2));
    } else if (!isNaN(total)) {
      setInstallmentAmount((total / count).toFixed(2));
    }
  };

  // Stats Calculations for MonthlyDebits Tab
  const stats = (() => {
    let sumTotal = 0;
    let sumPaid = 0;
    let sumRemaining = 0;
    let openMonthPending = 0;

    debits.forEach((d) => {
      sumTotal += d.totalAmount;
      
      const paid = d.paidInstallments * d.installmentAmount;
      sumPaid += paid;
      sumRemaining += Math.max(0, d.totalAmount - paid);

      const status = getStatusForCurrentMonth(d);
      if (status === 'PENDING_THIS_MONTH') {
        openMonthPending += d.installmentAmount;
      }
    });

    return {
      sumTotal,
      sumPaid,
      sumRemaining,
      openMonthPending,
      percentage: sumTotal > 0 ? (sumPaid / sumTotal) * 100 : 0
    };
  })();

  // Stats Calculations for AccountsPayable Tab
  const payableStats = (() => {
    let totalOutstanding = 0;
    let totalPaid = 0;
    let totalDebited = 0;
    let activeAccountsCount = 0;

    payables.forEach((p) => {
      totalOutstanding += p.currentBalance;
      if (p.currentBalance > 0) {
        activeAccountsCount++;
      }

      p.transactions.forEach((tx) => {
        if (p.createdAt) { // sanity check
          if (tx.type === 'DEBIT') {
            totalDebited += tx.amount;
          } else if (tx.type === 'PAYMENT') {
            totalPaid += tx.amount;
          }
        }
      });
    });

    return {
      totalOutstanding,
      totalPaid,
      totalDebited,
      activeAccountsCount
    };
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount || !installmentsCount || !installmentAmount || !dueDate) {
      return;
    }

    setLoading(true);

    try {
      if (editingDebitId) {
        // Edit Mode: Merge and update existing
        const existingDebit = debits.find(d => d.id === editingDebitId);
        if (existingDebit) {
          const updatedDebit: MonthlyDebit = {
            ...existingDebit,
            name: name.trim(),
            totalAmount: parseFloat(totalAmount),
            installmentsCount: parseInt(installmentsCount),
            installmentAmount: parseFloat(installmentAmount),
            dueDate,
            startMonth,
            status: existingDebit.paidInstallments >= parseInt(installmentsCount) ? 'PAID' : 'OPEN'
          };
          StorageService.saveMonthlyDebit(updatedDebit);
        }
      } else {
        // Create Mode
        const newDebit: MonthlyDebit = {
          id: 'deb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: name.trim(),
          totalAmount: parseFloat(totalAmount),
          installmentsCount: parseInt(installmentsCount),
          installmentAmount: parseFloat(installmentAmount),
          dueDate,
          startMonth,
          paidInstallments: 0,
          createdAt: new Date().toISOString(),
          payments: [],
          status: 'OPEN'
        };
        StorageService.saveMonthlyDebit(newDebit);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error saving monthly debit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setName('');
    setTotalAmount('');
    setInstallmentsCount('12');
    setInstallmentAmount('');
    setDueDate('');
    setStartMonth(currentMonthYear);
    setEditingDebitId(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (debit: MonthlyDebit) => {
    setName(debit.name);
    setTotalAmount(debit.totalAmount.toFixed(2));
    setInstallmentsCount(debit.installmentsCount.toString());
    setInstallmentAmount(debit.installmentAmount.toFixed(2));
    setDueDate(debit.dueDate);
    setStartMonth(debit.startMonth || currentMonthYear);
    setEditingDebitId(debit.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o débito "${name}"?`)) {
      StorageService.deleteMonthlyDebit(id);
    }
  };

  const handleBaixa = (debit: MonthlyDebit, event: React.MouseEvent<HTMLButtonElement>) => {
    if (debit.paidInstallments >= debit.installmentsCount) return;

    if (confettiEngineRef.current) {
      confettiEngineRef.current.burst(event.clientX, event.clientY);
    }

    const nextIndex = debit.paidInstallments + 1;
    const paymentRecord: MonthlyDebitPayment = {
      installmentIndex: nextIndex,
      paidAt: new Date().toISOString(),
      amount: debit.installmentAmount
    };

    const updatedPayments = [...debit.payments, paymentRecord];
    const isCompleted = nextIndex >= debit.installmentsCount;

    const updatedDebit: MonthlyDebit = {
      ...debit,
      paidInstallments: nextIndex,
      payments: updatedPayments,
      status: isCompleted ? 'PAID' : 'OPEN'
    };

    StorageService.saveMonthlyDebit(updatedDebit);
  };

  const toggleExpand = (id: string) => {
    setExpandedDebits(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- ACCOUNTS PAYABLE (CONTAS A PAGAR) ACTIONS ---
  const handleOpenPayableEdit = (p: AccountsPayable) => {
    setPayableName(p.name);
    setPayableNameDueDate(p.dueDate);
    setEditingPayableId(p.id);
    setIsPayableModalOpen(true);
  };

  const handleClosePayableModal = () => {
    setPayableName('');
    setPayableNameDueDate('');
    setEditingPayableId(null);
    setIsPayableModalOpen(false);
  };

  const handleSubmitPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payableName.trim() || !payableDueDate) return;

    setLoading(true);

    try {
      if (editingPayableId) {
        const existing = payables.find(a => a.id === editingPayableId);
        if (existing) {
          const updated: AccountsPayable = {
            ...existing,
            name: payableName.trim(),
            dueDate: payableDueDate
          };
          StorageService.saveAccountsPayable(updated);
        }
      } else {
        const newPayable: AccountsPayable = {
          id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: payableName.trim(),
          dueDate: payableDueDate,
          currentBalance: 0,
          createdAt: new Date().toISOString(),
          transactions: []
        };
        StorageService.saveAccountsPayable(newPayable);
      }
      handleClosePayableModal();
    } catch (err) {
      console.error('Error saving accounts payable:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayable = (id: string, name: string) => {
    if (window.confirm(`Excluir a conta "${name}" e todo seu histórico de lançamentos?`)) {
      StorageService.deleteAccountsPayable(id);
    }
  };

  const toggleExpandPayable = (id: string) => {
    setExpandedPayables(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAddTxForm = (id: string, type: 'DEBIT' | 'PAYMENT') => {
    setActivePayableIdForTx(id);
    setPayableTxType(type);
    setPayableTxAmount('');
    setPayableTxDesc('');
  };

  const handleSubmitPayableTx = (e: React.FormEvent, payable: AccountsPayable) => {
    e.preventDefault();
    const amountNum = parseFloat(payableTxAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !payableTxDesc.trim()) return;

    // Confetti effect on transactions (especially on payments!)
    if (confettiEngineRef.current && (payableTxType === 'PAYMENT' || Math.random() > 0.4)) {
      const clickX = window.innerWidth / 2;
      const clickY = window.innerHeight / 2;
      confettiEngineRef.current.burst(clickX, clickY);
    }

    const newTx: AccountsPayableTransaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: payableTxType,
      amount: amountNum,
      description: payableTxDesc.trim(),
      date: new Date().toISOString()
    };

    // Calculate new currentBalance running totals
    const delta = payableTxType === 'DEBIT' ? amountNum : -amountNum;
    const newBalance = Math.max(0, payable.currentBalance + delta);

    const updatedPayable: AccountsPayable = {
      ...payable,
      currentBalance: newBalance,
      transactions: [newTx, ...payable.transactions] // prepend newest transactions
    };

    StorageService.saveAccountsPayable(updatedPayable);

    // Reset tx Form State
    setActivePayableIdForTx(null);
    setPayableTxAmount('');
    setPayableTxDesc('');
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Absolute Confetti Overlay Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <CreditCard className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                ADMINISTRAÇÃO FINANCEIRA
              </h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                Gestão Geral de Contas, Parcelas e Despesas Diárias
              </p>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="p-1 rounded-2xl bg-[#08152e] border border-blue-900/60 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('PARCELADOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeMainTab === 'PARCELADOS'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Débitos Parcelados
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('CONTAS_PAGAR')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeMainTab === 'CONTAS_PAGAR'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contas a Pagar
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: DEBITOS PARCELADOS */}
      {activeMainTab === 'PARCELADOS' && (
        <>
          {/* STATS BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Geral */}
            <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-[#080210] p-5 shadow-[0_0_20px_rgba(236,72,153,0.15)] group hover:border-pink-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-pink-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soma de Todos</span>
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {formatCurrency(stats.sumTotal)}
                </span>
                <span className="text-[9px] text-pink-400 font-bold block mt-1 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400 animate-spin" />
                  <span>Dívidas Ativas e Pagas</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Total Restante */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-[#100702] p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Faltando</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {formatCurrency(stats.sumRemaining)}
                </span>
                <span className="text-[9px] text-amber-400 font-bold block mt-1 uppercase tracking-wider">
                  {debits.length > 0 ? `${((stats.sumRemaining / stats.sumTotal) * 100).toFixed(0)}% restante` : '0% restante'}
                </span>
              </div>
            </div>

            {/* Stat 3: Pendente Mês Aberto */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#020d14] p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] group hover:border-cyan-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Aberto</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {formatCurrency(stats.openMonthPending)}
                </span>
                <span className="text-[9px] text-cyan-400 font-bold block mt-1 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <BadgeAlert className="w-3 h-3 text-cyan-400" />
                  <span>Pendente Mês Atual</span>
                </span>
              </div>
            </div>

            {/* Stat 4: Completion Ratio */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#021008] p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentual Pago</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-white tracking-wide">
                    {stats.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                    {formatCurrency(stats.sumPaid)} pago
                  </span>
                </div>
                <div className="w-full h-1.5 bg-emerald-950 rounded-full mt-2 overflow-hidden border border-emerald-900/35">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          {debits.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-pink-955/40 rounded-3xl bg-[#030712]/50 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-500/30">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Nenhum débito cadastrado</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Cadastre suas parcelas, faturas e contas fixas para acompanhar a evolução dos seus pagamentos e parcelas de forma visual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cadastrar Primeiro Débito
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {debits.map((debit) => {
                const cardPaidPercent = debit.totalAmount > 0 
                  ? (debit.paidInstallments / debit.installmentsCount) * 100 
                  : 0;

                const isFullyPaid = debit.paidInstallments >= debit.installmentsCount;
                const currentMonthStatus = getStatusForCurrentMonth(debit);
                const isPaidThisMonth = currentMonthStatus === 'PAID_THIS_MONTH' || isFullyPaid;

                const isExpanded = expandedDebits[debit.id] || false;

                return (
                  <div 
                    key={debit.id}
                    className={`relative overflow-hidden rounded-3xl border-2 bg-[#040814] flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      isFullyPaid 
                        ? 'border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : isPaidThisMonth 
                          ? 'border-blue-500/40 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                          : 'border-pink-500/30 hover:border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.05)]'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                      isFullyPaid 
                        ? 'from-emerald-500 to-teal-400' 
                        : isPaidThisMonth 
                          ? 'from-blue-500 to-cyan-400' 
                          : 'from-pink-500 to-purple-500'
                    }`} />

                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-100 truncate leading-tight tracking-wide uppercase">
                            {debit.name}
                          </h3>
                          <div className="space-y-0.5 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <div>
                              Vence dia: <strong className="text-slate-200 font-black">{debit.dueDate}</strong>
                            </div>
                            {debit.startMonth && (
                              <div className="text-slate-500 text-[9px]">
                                Início: <span className="text-slate-300">{formatMonthYear(debit.startMonth)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(debit)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-950 bg-black/30 hover:bg-cyan-500/5 transition-all cursor-pointer"
                            title="Editar Débito"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(debit.id, debit.name)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 bg-black/30 hover:bg-red-500/5 transition-all cursor-pointer"
                            title="Excluir Débito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-black/45 border border-white/5 p-3.5 rounded-2xl">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Progresso de Quitação</span>
                          <span className={`font-black ${
                            isFullyPaid 
                              ? 'text-emerald-400' 
                              : isPaidThisMonth 
                                ? 'text-blue-400' 
                                : 'text-pink-400'
                          }`}>
                            {cardPaidPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isFullyPaid 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                                : isPaidThisMonth 
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]' 
                                  : 'bg-gradient-to-r from-pink-500 to-purple-400 shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                            }`} 
                            style={{ width: `${cardPaidPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-bold">
                          <span>{debit.paidInstallments} pagas</span>
                          <span>de {debit.installmentsCount} parcelas</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-left">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Total</span>
                          <span className="text-sm font-black text-white mt-0.5 block leading-none">
                            {formatCurrency(debit.totalAmount)}
                          </span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-left">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Valor Parcela</span>
                          <span className="text-sm font-black text-white mt-0.5 block leading-none">
                            {formatCurrency(debit.installmentAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 font-medium">Status Mês Atual</span>
                        {isFullyPaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Quitada</span>
                          </span>
                        ) : currentMonthStatus === 'FUTURE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Não Iniciado</span>
                          </span>
                        ) : isPaidThisMonth ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/50 uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Pago</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/50 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-slate-800/50 bg-black/25 text-xs">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-3 pb-2">Histórico de Parcelas</h4>
                        {debit.payments.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">Nenhuma parcela paga ainda.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {debit.payments.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-[11px]">
                                <span className="text-slate-400 font-bold">{p.installmentIndex}ª Parcela ({formatMonthYear(getInstallmentMonth(debit.startMonth || currentMonthYear, p.installmentIndex))})</span>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-black block">{formatCurrency(p.amount)}</span>
                                  <span className="text-[9px] text-slate-500 block leading-tight">{new Date(p.paidAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-black/40 border-t border-slate-900 flex items-center gap-2 select-none">
                      <button
                        type="button"
                        onClick={() => toggleExpand(debit.id)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>Recolher</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Parcelas ({debit.payments.length})</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleBaixa(debit, e)}
                        disabled={isFullyPaid}
                        className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                          isFullyPaid 
                            ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed' 
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-500/40 active:scale-95'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dar Baixa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* RENDER TAB 2: CONTAS A PAGAR / DIARIAS (CORRENTE LEDGER COISA DO DIA A DIA) */}
      {activeMainTab === 'CONTAS_PAGAR' && (
        <>
          {/* TOP STATS BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Geral Devido */}
            <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-[#080210] p-5 shadow-[0_0_20px_rgba(236,72,153,0.15)] group hover:border-pink-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-pink-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Devendo Total</span>
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide animate-pulse">
                  {formatCurrency(payableStats.totalOutstanding)}
                </span>
                <span className="text-[9px] text-pink-400 font-bold block mt-1 uppercase tracking-wider flex items-center gap-1">
                  <BadgeAlert className="w-3 h-3 text-pink-400" />
                  <span>Soma de Todas as Contas</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Total Abatido/Pago */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#021008] p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pago (Abatido)</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {formatCurrency(payableStats.totalPaid)}
                </span>
                <span className="text-[9px] text-emerald-400 font-bold block mt-1 uppercase tracking-wider">
                  Histórico de Acertos
                </span>
              </div>
            </div>

            {/* Stat 3: Total Compras / Débito */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-[#020d14] p-5 shadow-[0_0_20px_rgba(37,99,235,0.15)] group hover:border-blue-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Comprado (Dívida)</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.3)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {formatCurrency(payableStats.totalDebited)}
                </span>
                <span className="text-[9px] text-blue-400 font-bold block mt-1 uppercase tracking-wider">
                  Lançamento de Compras
                </span>
              </div>
            </div>

            {/* Stat 4: Quantidade Contas */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-[#100702] p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credores Ativos</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  <ListPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block tracking-wide">
                  {payableStats.activeAccountsCount}
                </span>
                <span className="text-[9px] text-amber-400 font-bold block mt-1 uppercase tracking-wider">
                  Contas c/ saldo em aberto
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BAR FOR TAB 2 */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsPayableModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:shadow-[0_0_30px_rgba(6,182,212,0.65)] hover:scale-[1.02] active:scale-95 cursor-pointer transition-all border border-cyan-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Fatura / Credor</span>
            </button>
          </div>

          {/* MAIN RUNNING LEDGER GRID */}
          {payables.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-cyan-950/40 rounded-3xl bg-[#030712]/50 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-500/30">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Nenhuma conta diária cadastrada</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Crie fichas financeiras ou fichas de credores para controlar despesas diárias de forma flexível: adicione novas compras e realize abates parciais de forma integrada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayableModalOpen(true)}
                className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cadastrar Ficha de Credor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payables.map((payable) => {
                const isExpanded = expandedPayables[payable.id] || false;
                const isTxFormOpen = activePayableIdForTx === payable.id;

                return (
                  <div 
                    key={payable.id}
                    className={`relative overflow-hidden rounded-3xl border-2 bg-[#040814] flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      payable.currentBalance <= 0 
                        ? 'border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : 'border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                    }`}
                  >
                    {/* Visual bar header */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                      payable.currentBalance <= 0 
                        ? 'from-emerald-500 to-teal-400' 
                        : 'from-cyan-500 to-indigo-500'
                    }`} />

                    {/* Ficha Information */}
                    <div className="p-5 space-y-4 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-100 truncate leading-tight tracking-wide uppercase">
                            {payable.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                            Vencimento / Acerto: <strong className="text-slate-200 font-black">{payable.dueDate}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenPayableEdit(payable)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-950 bg-black/30 hover:bg-cyan-500/5 transition-all cursor-pointer"
                            title="Editar Credor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayable(payable.id, payable.name)}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 bg-black/30 hover:bg-red-500/5 transition-all cursor-pointer"
                            title="Excluir Credor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* LEDGER CURRENT BALANCE */}
                      <div className="bg-black/55 border border-white/5 p-4 rounded-2xl text-center space-y-1 relative">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Saldo Devedor Atual</span>
                        <span className={`text-2xl font-black block tracking-wide ${
                          payable.currentBalance > 0 ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-emerald-400'
                        }`}>
                          {formatCurrency(payable.currentBalance)}
                        </span>
                        <div className="pt-2">
                          {payable.currentBalance > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                              Ficha Ativa / Compras pendentes
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                              Sem Débito / Totalmente Pago
                            </span>
                          )}
                        </div>
                      </div>

                      {/* QUICK LAUNCH INLINE TRANSACTION FORM */}
                      {isTxFormOpen && (
                        <form 
                          onSubmit={(e) => handleSubmitPayableTx(e, payable)}
                          className="bg-[#051125] border border-blue-900/60 p-3 rounded-2xl text-xs space-y-3 animate-fade-in"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className={`font-black uppercase text-[9px] tracking-wider ${
                              payableTxType === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {payableTxType === 'DEBIT' ? '🔴 Lançar Nova Compra (Devendo)' : '🟢 Lançar Abate / Pagamento'}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setActivePayableIdForTx(null)}
                              className="text-slate-500 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1 space-y-0.5 text-left">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Valor (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={payableTxAmount}
                                onChange={(e) => setPayableTxAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2 bg-black border border-white/10 rounded-lg text-white font-bold"
                              />
                            </div>
                            <div className="col-span-2 space-y-0.5 text-left">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Descrição do Lançamento</label>
                              <input
                                type="text"
                                required
                                value={payableTxDesc}
                                onChange={(e) => setPayableTxDesc(e.target.value)}
                                placeholder={payableTxType === 'DEBIT' ? "Ex: Compra de 5 Telas iP11" : "Ex: Pix parcial caixa"}
                                className="w-full p-2 bg-black border border-white/10 rounded-lg text-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                              payableTxType === 'DEBIT'
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar Lançamento</span>
                          </button>
                        </form>
                      )}

                      {/* DUAL ACTION BUTTONS (ADD DEBIT / PAYMENT) */}
                      {!isTxFormOpen && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAddTxForm(payable.id, 'DEBIT')}
                            className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            <span>Contratar Débito</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddTxForm(payable.id, 'PAYMENT')}
                            className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            <span>Abater Dívida</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* EXPANDABLE RUNNING LEDGER HISTORY ("Desça a Cortina") */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-800/50 bg-black/35 text-xs animate-slide-down">
                        <div className="flex items-center gap-1.5 pt-3 pb-2.5 border-b border-white/5">
                          <History className="w-3.5 h-3.5 text-cyan-400" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Extrato da Conta / Histórico de Lançamentos</h4>
                        </div>
                        {payable.transactions.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-3 text-center">Nenhum lançamento registrado nesta ficha.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 mt-2.5 scrollbar-thin">
                            {payable.transactions.map((tx) => (
                              <div 
                                key={tx.id} 
                                className="flex items-start justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] hover:bg-white/10 transition-colors"
                              >
                                <div className="space-y-0.5 text-left">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black inline-block leading-none ${
                                    tx.type === 'DEBIT' 
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/20' 
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {tx.type === 'DEBIT' ? 'COMPRA' : 'ABATE'}
                                  </span>
                                  <span className="text-slate-200 font-bold block pt-1">{tx.description}</span>
                                  <span className="text-[9px] text-slate-500 block">
                                    {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span className={`font-black ${
                                  tx.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                  {tx.type === 'DEBIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card footer slider controller */}
                    <div className="p-3 bg-black/45 border-t border-slate-900 select-none">
                      <button
                        type="button"
                        onClick={() => toggleExpandPayable(payable.id)}
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>Subir Cortina</span>
                            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                          </>
                        ) : (
                          <>
                            <span>Descer Cortina / Extrato ({payable.transactions.length})</span>
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: DÉBITO PARCELADO (ADD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden border-2 border-pink-500/30 bg-[#040815] rounded-3xl shadow-[0_0_40px_rgba(236,72,153,0.25)] animate-scale-up">
            <div className="p-5 border-b border-white/5 bg-[#060e22] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {editingDebitId ? 'Editar Débito Mensal' : 'Cadastrar Novo Débito'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nome da Dívida / Fornecedor / Conta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aluguel da Loja, Internet Fibra, Parcela Maquinário"
                  className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              {/* Start Month */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Mês de Início do Débito</label>
                <input
                  type="month"
                  required
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              {/* Parcelas count */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Quantidade de Parcelas (Vezes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={installmentsCount}
                  onChange={(e) => handleInstallmentsCountChange(e.target.value)}
                  placeholder="12"
                  className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              {/* Installment Amount / Total Amount bidirectional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor da Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={installmentAmount}
                    onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor Total Calculado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Due Date description */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Vencimento (Dia do Mês)</label>
                <input
                  type="text"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Ex: Todo dia 10, Todo dia 05"
                  className="w-full p-3 bg-black border border-white/10 focus:border-pink-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-102 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingDebitId ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ACCOUNTS PAYABLE (ADD / EDIT) */}
      {isPayableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden border-2 border-cyan-500/30 bg-[#040815] rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.25)] animate-scale-up">
            <div className="p-5 border-b border-white/5 bg-[#060e22] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {editingPayableId ? 'Editar Credor / Ficha' : 'Cadastrar Ficha de Credor'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClosePayableModal}
                className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayable} className="p-5 space-y-4">
              {/* Payable Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nome do Credor / Fatura / Fornecedor</label>
                <input
                  type="text"
                  required
                  value={payableName}
                  onChange={(e) => setPayableName(e.target.value)}
                  placeholder="Ex: Fornecedor Mega Telas, Distribuidora Premium, etc."
                  className="w-full p-3 bg-black border border-white/10 focus:border-cyan-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Previsão de Vencimento / Acerto</label>
                <input
                  type="text"
                  required
                  value={payableDueDate}
                  onChange={(e) => setPayableNameDueDate(e.target.value)}
                  placeholder="Ex: Todo dia 15, Toda sexta-feira"
                  className="w-full p-3 bg-black border border-white/10 focus:border-cyan-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClosePayableModal}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-102 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingPayableId ? 'Salvar Alterações' : 'Criar Ficha'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
