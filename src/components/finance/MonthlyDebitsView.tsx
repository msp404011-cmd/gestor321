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
  FileText,
  Zap,
  Droplets,
  Home,
  ShoppingCart,
  Wifi,
  Users,
  Wrench,
  Search,
  Filter,
  Receipt,
  X,
  Building2,
  Clock
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { MonthlyDebit, MonthlyDebitPayment, AccountsPayable, AccountsPayableTransaction, RealFixedCost } from '../../types';
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
  const [activeMainTab, setActiveMainTab] = useState<'PARCELADOS' | 'CONTAS_PAGAR' | 'CUSTO_FIXO'>('PARCELADOS');
  const [debits, setDebits] = useState<MonthlyDebit[]>([]);
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [fixedCosts, setFixedCosts] = useState<RealFixedCost[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isFixedCostModalOpen, setIsFixedCostModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State to edit debit, payable, or fixed cost
  const [editingDebitId, setEditingDebitId] = useState<string | null>(null);
  const [editingPayableId, setEditingPayableId] = useState<string | null>(null);
  const [editingFixedCostId, setEditingFixedCostId] = useState<string | null>(null);

  // States to add inline Transactions (debits or payments) into AccountsPayable
  const [activePayableIdForTx, setActivePayableIdForTx] = useState<string | null>(null);
  const [payableTxType, setPayableTxType] = useState<'DEBIT' | 'PAYMENT'>('DEBIT');
  const [payableTxAmount, setPayableTxAmount] = useState('');
  const [payableTxDesc, setPayableTxDesc] = useState('');

  // Form State for Custo Fixo Real
  const [costName, setCostName] = useState('');
  const [costCategory, setCostCategory] = useState<RealFixedCost['category']>('ENERGIA');
  const [costAmount, setCostAmount] = useState('');
  const [costDueDate, setCostDueDate] = useState('');
  const [costNotes, setCostNotes] = useState('');

  // Filters for Custo Fixo Real
  const [fixedCostSearch, setFixedCostSearch] = useState('');
  const [fixedCostCategoryFilter, setFixedCostCategoryFilter] = useState<string>('TODOS');

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

  // Feedback de Baixa e Total que Falta
  const [baixaFeedback, setBaixaFeedback] = useState<{
    debitId: string;
    name: string;
    installmentPaid: number;
    installmentsCount: number;
    paidAmount: number;
    remainingAmount: number;
    remainingInstallments: number;
    isFullyPaid: boolean;
  } | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: 'DEBIT' | 'PAYABLE' | 'FIXED_COST';
  }>({
    isOpen: false,
    id: '',
    name: '',
    type: 'DEBIT',
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiEngineRef = useRef<ConfettiEngine | null>(null);

  // Helper function to seed initial default fixed costs if list is empty
  const ensureDefaultFixedCosts = () => {
    let costs = StorageService.getRealFixedCosts();
    if (costs.length === 0) {
      const defaultItems: RealFixedCost[] = [
        {
          id: 'fc-luz',
          name: 'Luz / Energia Elétrica',
          category: 'ENERGIA',
          amount: 380.00,
          dueDate: 'Dia 10',
          notes: 'Conta mensal da distribuidora de energia',
          isPaidThisMonth: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fc-aluguel',
          name: 'Aluguel do Imóvel / Loja',
          category: 'ALUGUEL',
          amount: 1800.00,
          dueDate: 'Dia 05',
          notes: 'Aluguel comercial ponto principal',
          isPaidThisMonth: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fc-agua',
          name: 'Água e Saneamento',
          category: 'AGUA',
          amount: 120.00,
          dueDate: 'Dia 15',
          notes: 'Consumo de água da loja',
          isPaidThisMonth: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fc-internet',
          name: 'Internet Fibra Óptica',
          category: 'INTERNET',
          amount: 149.90,
          dueDate: 'Dia 20',
          notes: 'Link dedicado de internet',
          isPaidThisMonth: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'fc-mercado',
          name: 'Mercado / Copa & Suprimentos',
          category: 'MERCADO',
          amount: 300.00,
          dueDate: 'Semanal / Mensal',
          notes: 'Café, produtos de limpeza e itens para funcionários',
          isPaidThisMonth: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      StorageService.saveRealFixedCosts(defaultItems);
      costs = defaultItems;
    }
    setFixedCosts(costs);
  };

  // Load and subscribe to storage
  useEffect(() => {
    setDebits(StorageService.getMonthlyDebits());
    setPayables(StorageService.getAccountsPayable());
    ensureDefaultFixedCosts();
    
    const unsubscribe = StorageService.subscribe(() => {
      setDebits(StorageService.getMonthlyDebits());
      setPayables(StorageService.getAccountsPayable());
      setFixedCosts(StorageService.getRealFixedCosts());
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

  // Smart helper to parse due day from any user input (Ex: "Todo dia 10", "15", "2026-10-15")
  const parseDueDay = (dueDateStr: string): number => {
    if (!dueDateStr) return 10;
    if (/^\d{4}-\d{2}-\d{2}/.test(dueDateStr)) {
      const d = new Date(dueDateStr);
      if (!isNaN(d.getTime())) return d.getDate();
    }
    const digits = dueDateStr.replace(/\D/g, '');
    if (digits) {
      const val = parseInt(digits, 10);
      if (val >= 1 && val <= 31) return val;
    }
    return 10;
  };

  // Helper to check if a MonthlyDebit is overdue / atrasado
  const isDebitOverdue = (debit: MonthlyDebit): boolean => {
    if (debit.paidInstallments >= debit.installmentsCount) return false;

    const currentMonthStatus = getStatusForCurrentMonth(debit);
    if (currentMonthStatus === 'FUTURE') return false;

    const today = new Date();
    const todayDay = today.getDate();
    const dueDay = parseDueDay(debit.dueDate);

    const startMonthStr = debit.startMonth || currentMonthYear;
    const [startY, startM] = startMonthStr.split('-').map(Number);
    const [currY, currM] = currentMonthYear.split('-').map(Number);
    const elapsedMonths = (currY - startY) * 12 + (currM - startM);

    if (debit.paidInstallments < elapsedMonths) {
      return true; // Previous month installment unpaid
    }

    if (currentMonthStatus === 'PENDING_THIS_MONTH' && todayDay > dueDay) {
      return true; // Current month due day passed
    }

    return false;
  };

  // Helper to check if AccountsPayable is overdue
  const isPayableOverdue = (payable: AccountsPayable): boolean => {
    if (payable.currentBalance <= 0) return false;

    const today = new Date();
    const todayDay = today.getDate();
    const dueDay = parseDueDay(payable.dueDate);

    return todayDay > dueDay;
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

  // Stats Calculations for Custo Fixo Real Tab
  const fixedCostStats = (() => {
    let sumTotal = 0;
    let sumPaid = 0;
    let sumPending = 0;

    fixedCosts.forEach((c) => {
      sumTotal += c.amount;
      if (c.isPaidThisMonth) {
        sumPaid += c.amount;
      } else {
        sumPending += c.amount;
      }
    });

    return {
      sumTotal,
      sumPaid,
      sumPending,
      count: fixedCosts.length,
      dailyAverage: sumTotal > 0 ? sumTotal / 30 : 0,
    };
  })();

  // Filtered Fixed Costs
  const filteredFixedCosts = fixedCosts.filter((cost) => {
    const matchesSearch = cost.name.toLowerCase().includes(fixedCostSearch.toLowerCase()) ||
      (cost.notes && cost.notes.toLowerCase().includes(fixedCostSearch.toLowerCase()));
    const matchesCategory = fixedCostCategoryFilter === 'TODOS' || cost.category === fixedCostCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: RealFixedCost['category']) => {
    switch (category) {
      case 'ENERGIA':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'AGUA':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'ALUGUEL':
        return <Home className="w-4 h-4 text-indigo-400" />;
      case 'MERCADO':
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'INTERNET':
        return <Wifi className="w-4 h-4 text-purple-400" />;
      case 'SISTEMAS':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'FOLHA':
        return <Users className="w-4 h-4 text-rose-400" />;
      case 'MANUTENCAO':
        return <Wrench className="w-4 h-4 text-orange-400" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: RealFixedCost['category']) => {
    switch (category) {
      case 'ENERGIA':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'AGUA':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'ALUGUEL':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'MERCADO':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'INTERNET':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'SISTEMAS':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'FOLHA':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MANUTENCAO':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryLabel = (category: RealFixedCost['category']) => {
    switch (category) {
      case 'ENERGIA':
        return 'Luz / Energia';
      case 'AGUA':
        return 'Água & Saneamento';
      case 'ALUGUEL':
        return 'Aluguel do Imóvel';
      case 'MERCADO':
        return 'Mercado & Copa';
      case 'INTERNET':
        return 'Internet & Fone';
      case 'SISTEMAS':
        return 'Sistemas & Software';
      case 'FOLHA':
        return 'Folha & Pró-labore';
      case 'MANUTENCAO':
        return 'Manutenção Geral';
      default:
        return 'Outros Custos';
    }
  };

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
    setDeleteConfirmState({
      isOpen: true,
      id,
      name,
      type: 'DEBIT',
    });
  };

  const handleDeletePayable = (id: string, name: string) => {
    setDeleteConfirmState({
      isOpen: true,
      id,
      name,
      type: 'PAYABLE',
    });
  };

  const handleDeleteFixedCost = (id: string, name: string) => {
    setDeleteConfirmState({
      isOpen: true,
      id,
      name,
      type: 'FIXED_COST',
    });
  };

  const handleConfirmDelete = () => {
    const { id, type } = deleteConfirmState;
    if (!id) return;

    if (type === 'DEBIT') {
      StorageService.deleteMonthlyDebit(id);
      setDebits(StorageService.getMonthlyDebits());
    } else if (type === 'PAYABLE') {
      StorageService.deleteAccountsPayable(id);
      setPayables(StorageService.getAccountsPayable());
    } else if (type === 'FIXED_COST') {
      StorageService.deleteRealFixedCost(id);
      setFixedCosts(StorageService.getRealFixedCosts());
    }

    setDeleteConfirmState({
      isOpen: false,
      id: '',
      name: '',
      type: 'DEBIT',
    });
  };

  // --- CUSTO FIXO REAL ACTIONS ---
  const handleOpenAddFixedCost = (categoryPreset?: RealFixedCost['category'], namePreset?: string) => {
    setCostName(namePreset || '');
    setCostCategory(categoryPreset || 'ENERGIA');
    setCostAmount('');
    setCostDueDate('Dia 10');
    setCostNotes('');
    setEditingFixedCostId(null);
    setIsFixedCostModalOpen(true);
  };

  const handleOpenEditFixedCost = (cost: RealFixedCost) => {
    setCostName(cost.name);
    setCostCategory(cost.category);
    setCostAmount(cost.amount.toString());
    setCostDueDate(cost.dueDate);
    setCostNotes(cost.notes || '');
    setEditingFixedCostId(cost.id);
    setIsFixedCostModalOpen(true);
  };

  const handleCloseFixedCostModal = () => {
    setCostName('');
    setCostCategory('ENERGIA');
    setCostAmount('');
    setCostDueDate('');
    setCostNotes('');
    setEditingFixedCostId(null);
    setIsFixedCostModalOpen(false);
  };

  const handleSubmitFixedCost = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(costAmount);
    if (!costName.trim() || isNaN(amtNum) || amtNum <= 0) return;

    if (editingFixedCostId) {
      const existing = fixedCosts.find(c => c.id === editingFixedCostId);
      if (existing) {
        const updated: RealFixedCost = {
          ...existing,
          name: costName.trim(),
          category: costCategory,
          amount: amtNum,
          dueDate: costDueDate.trim() || 'Dia 10',
          notes: costNotes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveRealFixedCost(updated);
      }
    } else {
      const newCost: RealFixedCost = {
        id: 'fix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: costName.trim(),
        category: costCategory,
        amount: amtNum,
        dueDate: costDueDate.trim() || 'Dia 10',
        notes: costNotes.trim() || undefined,
        isPaidThisMonth: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveRealFixedCost(newCost);
    }

    setFixedCosts(StorageService.getRealFixedCosts());
    handleCloseFixedCostModal();
  };

  const toggleFixedCostPaidStatus = (cost: RealFixedCost) => {
    const updated: RealFixedCost = {
      ...cost,
      isPaidThisMonth: !cost.isPaidThisMonth,
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveRealFixedCost(updated);
    setFixedCosts(StorageService.getRealFixedCosts());
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
    const remainingAmount = Math.max(0, debit.totalAmount - (nextIndex * debit.installmentAmount));
    const remainingInstallments = Math.max(0, debit.installmentsCount - nextIndex);

    const updatedDebit: MonthlyDebit = {
      ...debit,
      paidInstallments: nextIndex,
      payments: updatedPayments,
      status: isCompleted ? 'PAID' : 'OPEN'
    };

    StorageService.saveMonthlyDebit(updatedDebit);
    setDebits(StorageService.getMonthlyDebits());

    setBaixaFeedback({
      debitId: debit.id,
      name: debit.name,
      installmentPaid: nextIndex,
      installmentsCount: debit.installmentsCount,
      paidAmount: debit.installmentAmount,
      remainingAmount,
      remainingInstallments,
      isFullyPaid: isCompleted,
    });
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

  const handleDeletePayableTransaction = (payable: AccountsPayable, txId: string) => {
    const targetTx = payable.transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const filteredTx = payable.transactions.filter((t) => t.id !== txId);
    // Recalculate balance
    const delta = targetTx.type === 'DEBIT' ? -targetTx.amount : targetTx.amount;
    const newBalance = Math.max(0, payable.currentBalance + delta);

    const updatedPayable: AccountsPayable = {
      ...payable,
      currentBalance: newBalance,
      transactions: filteredTx,
    };

    StorageService.saveAccountsPayable(updatedPayable);
    setPayables(StorageService.getAccountsPayable());
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

        {/* TAB SWITCHER (3 ABAS: PARCELADOS, CONTAS A PAGAR, CUSTO FIXO REAL) */}
        <div className="p-1 rounded-2xl bg-[#08152e] border border-blue-900/60 flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveMainTab('PARCELADOS')}
            className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shrink-0 ${
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
            className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shrink-0 ${
              activeMainTab === 'CONTAS_PAGAR'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contas a Pagar
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('CUSTO_FIXO')}
            className={`flex-1 min-w-[130px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shrink-0 flex items-center justify-center gap-1.5 ${
              activeMainTab === 'CUSTO_FIXO'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md shadow-amber-500/20'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Custo Fixo Real</span>
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: DEBITOS PARCELADOS */}
      {activeMainTab === 'PARCELADOS' && (
        <>
          {/* STATS BANNER */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Stat 1: Total Geral */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-pink-500/30 bg-[#080210] p-3 sm:p-5 shadow-[0_0_20px_rgba(236,72,153,0.15)] group hover:border-pink-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-pink-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Soma de Todos</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)] shrink-0">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {formatCurrency(stats.sumTotal)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-pink-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 animate-spin shrink-0" />
                  <span className="truncate">Dívidas Ativas/Pagas</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Total Restante */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#100702] p-3 sm:p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total Faltando</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {formatCurrency(stats.sumRemaining)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  {debits.length > 0 ? `${((stats.sumRemaining / stats.sumTotal) * 100).toFixed(0)}% restante` : '0% restante'}
                </span>
              </div>
            </div>

            {/* Stat 3: Pendente Mês Aberto */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-[#020d14] p-3 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] group hover:border-cyan-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Mês Aberto</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {formatCurrency(stats.openMonthPending)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-cyan-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider flex items-center gap-1 animate-pulse truncate">
                  <BadgeAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">Pendente Mês Atual</span>
                </span>
              </div>
            </div>

            {/* Stat 4: Completion Ratio */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-[#021008] p-3 sm:p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Percentual Pago</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                  <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="flex items-end justify-between">
                  <span className="text-base sm:text-2xl font-black text-white tracking-wide truncate">
                    {stats.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold uppercase tracking-wider truncate">
                    {formatCurrency(stats.sumPaid)}
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

          {/* FEEDBACK DE BAIXA DE PARCELA - MOSTRA O TOTAL QUE FALTA */}
          {baixaFeedback && (
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {baixaFeedback.isFullyPaid ? '🎉 100% QUITADO!' : '✅ BAIXA REALIZADA COM SUCESSO!'}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {baixaFeedback.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Parcela <strong className="text-white font-mono">{baixaFeedback.installmentPaid} de {baixaFeedback.installmentsCount}</strong> ({formatCurrency(baixaFeedback.paidAmount)}) registrada com sucesso.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                  <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/40 text-left sm:text-right min-w-[160px]">
                    <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider block">
                      TOTAL QUE FALTA A PAGAR:
                    </span>
                    <span className={`text-lg sm:text-xl font-black font-mono block leading-tight ${baixaFeedback.remainingAmount <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {baixaFeedback.remainingAmount <= 0 ? 'R$ 0,00 (NADA RESTANTE)' : formatCurrency(baixaFeedback.remainingAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {baixaFeedback.remainingInstallments <= 0 ? 'Todas as parcelas pagas' : `Restam ${baixaFeedback.remainingInstallments} parcela(s)`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBaixaFeedback(null)}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Fechar aviso"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                const isOverdue = isDebitOverdue(debit);

                const isExpanded = expandedDebits[debit.id] || false;

                return (
                  <div 
                    key={debit.id}
                    className={`relative overflow-hidden rounded-3xl border-2 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      isFullyPaid 
                        ? 'bg-[#040814] border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : isOverdue
                          ? 'bg-gradient-to-b from-[#280B10] via-[#12071A] to-[#040814] border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-1 ring-orange-500'
                          : isPaidThisMonth 
                            ? 'bg-[#040814] border-blue-500/40 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                            : 'bg-[#040814] border-pink-500/30 hover:border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.05)]'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                      isFullyPaid 
                        ? 'from-emerald-500 to-teal-400' 
                        : isOverdue
                          ? 'from-rose-600 via-orange-500 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                          : isPaidThisMonth 
                            ? 'from-blue-500 to-cyan-400' 
                            : 'from-pink-500 to-purple-500'
                    }`} />

                    <div className="p-5 space-y-4">
                      {/* FLAMING OVERDUE ALERT BANNER */}
                      {isOverdue && (
                        <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between gap-1 shadow-lg animate-pulse">
                          <span className="flex items-center gap-1.5 uppercase tracking-wide text-[10px] sm:text-xs">
                            🔥 PARCELA VENCIDA / EM ATRASO!
                          </span>
                          <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded font-mono">
                            QUITAR AGORA
                          </span>
                        </div>
                      )}
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
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Total Débito</span>
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

                      {/* DESTAQUE OBRIGATÓRIO: TOTAL QUE FALTA SEMPRE APÓS QUITAÇÃO DAS PARCELAS */}
                      {(() => {
                        const totalPaidAmount = Math.min(debit.totalAmount, debit.paidInstallments * debit.installmentAmount);
                        const remainingToPay = Math.max(0, debit.totalAmount - totalPaidAmount);
                        const remainingParcels = Math.max(0, debit.installmentsCount - debit.paidInstallments);

                        return (
                          <div className={`p-3 rounded-2xl border-2 transition-all ${
                            isFullyPaid
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                              : 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-amber-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                                {isFullyPaid ? 'Situação do Débito' : 'TOTAL QUE FALTA A PAGAR'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {remainingParcels === 0 ? 'Quitado' : `Faltam ${remainingParcels}x`}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className={`text-base font-black font-mono tracking-tight ${
                                isFullyPaid ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {isFullyPaid ? 'R$ 0,00 (QUITADO)' : formatCurrency(remainingToPay)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Já pago: <strong className="text-white font-mono">{formatCurrency(totalPaidAmount)}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

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
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white border border-rose-400 uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                            <BadgeAlert className="w-3 h-3" />
                            <span>🔥 Vencida</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Stat 1: Total Geral Devido */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-pink-500/30 bg-[#080210] p-3 sm:p-5 shadow-[0_0_20px_rgba(236,72,153,0.15)] group hover:border-pink-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-pink-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Saldo Devendo Total</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)] shrink-0">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide animate-pulse truncate">
                  {formatCurrency(payableStats.totalOutstanding)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-pink-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider flex items-center gap-1 truncate">
                  <BadgeAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 shrink-0" />
                  <span className="truncate">Soma de Todas as Contas</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Total Abatido/Pago */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-[#021008] p-3 sm:p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total Pago (Abatido)</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {formatCurrency(payableStats.totalPaid)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  Histórico de Acertos
                </span>
              </div>
            </div>

            {/* Stat 3: Total Compras / Débito */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-[#020d14] p-3 sm:p-5 shadow-[0_0_20px_rgba(37,99,235,0.15)] group hover:border-blue-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total Comprado (Dívida)</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.3)] shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {formatCurrency(payableStats.totalDebited)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-blue-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  Lançamento de Compras
                </span>
              </div>
            </div>

            {/* Stat 4: Quantidade Contas */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#100702] p-3 sm:p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Credores Ativos</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] shrink-0">
                  <ListPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-white block tracking-wide truncate">
                  {payableStats.activeAccountsCount}
                </span>
                <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
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
                const isOverdue = isPayableOverdue(payable);

                return (
                  <div 
                    key={payable.id}
                    className={`relative overflow-hidden rounded-3xl border-2 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      payable.currentBalance <= 0 
                        ? 'bg-[#040814] border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : isOverdue
                          ? 'bg-gradient-to-b from-[#280B10] via-[#12071A] to-[#040814] border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-1 ring-orange-500'
                          : 'bg-[#040814] border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                    }`}
                  >
                    {/* Visual bar header */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                      payable.currentBalance <= 0 
                        ? 'from-emerald-500 to-teal-400' 
                        : isOverdue
                          ? 'from-rose-600 via-orange-500 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                          : 'from-cyan-500 to-indigo-500'
                    }`} />

                    {/* Ficha Information */}
                    <div className="p-5 space-y-4 flex-1">
                      {/* FLAMING OVERDUE ALERT BANNER */}
                      {isOverdue && (
                        <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between gap-1 shadow-lg animate-pulse mb-3">
                          <span className="flex items-center gap-1.5 uppercase tracking-wide text-[10px] sm:text-xs">
                            🔥 CONTA VENCIDA / EM ATRASO!
                          </span>
                          <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded font-mono">
                            QUITAR AGORA
                          </span>
                        </div>
                      )}
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
                                <div className="flex items-center gap-2">
                                  <span className={`font-black ${
                                    tx.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'
                                  }`}>
                                    {tx.type === 'DEBIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePayableTransaction(payable, tx.id)}
                                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Remover este lançamento"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
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

      {/* RENDER TAB 3: CUSTO FIXO REAL */}
      {activeMainTab === 'CUSTO_FIXO' && (
        <>
          {/* STATS BANNER CUSTO FIXO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Stat 1: Total Custo Fixo */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#0c0802] p-3 sm:p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Custo Fixo Mensal Total</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] shrink-0">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-amber-400 block tracking-wide truncate">
                  {formatCurrency(fixedCostStats.sumTotal)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-amber-300/80 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 animate-spin shrink-0" />
                  <span className="truncate">Soma das Despesas Recorrentes</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Pago no Mês */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-[#021008] p-3 sm:p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group hover:border-emerald-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Já Quitado Mês</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-emerald-400 block tracking-wide truncate">
                  {formatCurrency(fixedCostStats.sumPaid)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-emerald-400/80 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  {fixedCostStats.sumTotal > 0 ? `${((fixedCostStats.sumPaid / fixedCostStats.sumTotal) * 100).toFixed(0)}% pago` : '0% pago'}
                </span>
              </div>
            </div>

            {/* Stat 3: Pendente Mês */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-rose-500/30 bg-[#120406] p-3 sm:p-5 shadow-[0_0_20px_rgba(244,63,94,0.15)] group hover:border-rose-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-rose-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Ainda Pendente</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)] shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-rose-400 block tracking-wide truncate">
                  {formatCurrency(fixedCostStats.sumPending)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-rose-400/80 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  Falta pagar no mês
                </span>
              </div>
            </div>

            {/* Stat 4: Média Diária Estimada */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/30 bg-[#090212] p-3 sm:p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)] group hover:border-purple-400/50 transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/5 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Custo Diário Médio</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)] shrink-0">
                  <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="text-base sm:text-2xl font-black text-purple-300 block tracking-wide truncate">
                  {formatCurrency(fixedCostStats.dailyAverage)} / dia
                </span>
                <span className="text-[8px] sm:text-[9px] text-purple-400 font-bold block mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                  Base 30 dias de trabalho
                </span>
              </div>
            </div>
          </div>

          {/* QUICK ATALHOS / PRESETS POPULARES */}
          <div className="bg-[#091122] border border-amber-500/20 p-3 sm:p-4 rounded-2xl space-y-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
              ⚡ Atalhos Rápidos para Adicionar Custos Universais:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('ENERGIA', 'Conta de Luz / Energia')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Zap className="w-3.5 h-3.5" /> + Luz / Energia
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('ALUGUEL', 'Aluguel do Imóvel')}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Home className="w-3.5 h-3.5" /> + Aluguel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('AGUA', 'Conta de Água')}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Droplets className="w-3.5 h-3.5" /> + Água
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('INTERNET', 'Internet & Telefone')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Wifi className="w-3.5 h-3.5" /> + Internet
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('MERCADO', 'Mercado / Suprimentos')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> + Mercado / Copa
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('SISTEMAS', 'Sistema / Software')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <FileText className="w-3.5 h-3.5" /> + Software / Sistemas
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost('FOLHA', 'Pró-labore / Folha')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Users className="w-3.5 h-3.5" /> + Folha / Pró-labore
              </button>
            </div>
          </div>

          {/* CONTROLS BAR: SEARCH, FILTER & ADD BUTTON */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#081224] p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fixedCostSearch}
                  onChange={(e) => setFixedCostSearch(e.target.value)}
                  placeholder="Buscar custo fixo..."
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative shrink-0">
                <select
                  value={fixedCostCategoryFilter}
                  onChange={(e) => setFixedCostCategoryFilter(e.target.value)}
                  className="p-2 pr-7 bg-black/40 border border-white/10 rounded-xl text-xs text-amber-300 font-bold focus:outline-hidden appearance-none cursor-pointer"
                >
                  <option value="TODOS">Todas Categorias</option>
                  <option value="ENERGIA">⚡ Luz / Energia</option>
                  <option value="ALUGUEL">🏠 Aluguel</option>
                  <option value="AGUA">💧 Água</option>
                  <option value="INTERNET">📶 Internet</option>
                  <option value="MERCADO">🛒 Mercado</option>
                  <option value="SISTEMAS">💻 Sistemas</option>
                  <option value="FOLHA">👥 Folha</option>
                  <option value="MANUTENCAO">🔧 Manutenção</option>
                  <option value="OUTROS">📋 Outros</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Add Custom Button */}
            <button
              type="button"
              onClick={() => handleOpenAddFixedCost()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Custo Fixo</span>
            </button>
          </div>

          {/* MAIN GRID OF FIXED COSTS */}
          {filteredFixedCosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-amber-500/20 rounded-3xl bg-[#030712]/50 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Nenhum custo fixo encontrado</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Cadastre seus custos fixos mensais (luz, água, aluguel, mercado, etc.) para calcular o valor exato necessário para manter sua estrutura aberta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddFixedCost()}
                className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Adicionar Custo Fixo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFixedCosts.map((cost) => (
                <div
                  key={cost.id}
                  className={`relative overflow-hidden rounded-3xl border-2 flex flex-col justify-between p-5 space-y-4 transition-all duration-300 ${
                    cost.isPaidThisMonth
                      ? 'bg-[#040c14] border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'bg-[#0b0816] border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                    cost.isPaidThisMonth ? 'from-emerald-500 to-teal-400' : 'from-amber-500 via-orange-500 to-red-500'
                  }`} />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
                        {getCategoryIcon(cost.category)}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block ${getCategoryBadgeClass(cost.category)}`}>
                          {getCategoryLabel(cost.category)}
                        </span>
                        <h3 className="text-base font-black text-white truncate leading-tight mt-1">
                          {cost.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFixedCost(cost)}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-950 bg-black/30 transition-all cursor-pointer"
                        title="Editar Custo Fixo"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFixedCost(cost.id, cost.name)}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 bg-black/30 transition-all cursor-pointer"
                        title="Excluir Custo Fixo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount & Due Date */}
                  <div className="bg-black/50 border border-white/5 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Mensal</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">Vencimento: {cost.dueDate}</span>
                    </div>
                    <span className="text-2xl font-black text-amber-400 block tracking-wide">
                      {formatCurrency(cost.amount)}
                    </span>
                    {cost.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5 truncate">
                        "{cost.notes}"
                      </p>
                    )}
                  </div>

                  {/* Toggle Paid Status */}
                  <button
                    type="button"
                    onClick={() => toggleFixedCostPaidStatus(cost)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
                      cost.isPaidThisMonth
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    {cost.isPaidThisMonth ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Quitado no Mês</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Marcar como Quitado</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
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

      {/* MODAL 3: CONFIRMAR EXCLUSÃO DE DEBITO OU CONTA */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md overflow-hidden border-2 border-red-500/40 bg-[#040815] rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-scale-up p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black uppercase text-white tracking-wide">
                Confirmar Exclusão
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza que deseja excluir <strong className="text-red-400">"{deleteConfirmState.name}"</strong>?
              </p>
              <p className="text-[11px] text-slate-500 italic">
                {deleteConfirmState.type === 'DEBIT'
                  ? 'Esta ação removerá o débito mensal e seu histórico de parcelas.'
                  : 'Esta ação removerá a conta e todos os lançamentos registrados.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirmState({ isOpen: false, id: '', name: '', type: 'DEBIT' })
                }
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-red-500/30 hover:scale-102 active:scale-95 transition-all cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: CUSTO FIXO REAL (ADD / EDIT) */}
      {isFixedCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden border-2 border-amber-500/30 bg-[#040815] rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.25)] animate-scale-up">
            <div className="p-5 border-b border-white/5 bg-[#0a0818] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {editingFixedCostId ? 'Editar Custo Fixo' : 'Adicionar Custo Fixo Real'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseFixedCostModal}
                className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFixedCost} className="p-5 space-y-4">
              {/* Category */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Categoria do Custo</label>
                <select
                  value={costCategory}
                  onChange={(e) => setCostCategory(e.target.value as RealFixedCost['category'])}
                  className="w-full p-3 bg-black border border-white/10 focus:border-amber-500 focus:outline-hidden rounded-xl text-xs text-amber-300 font-bold transition-all cursor-pointer"
                >
                  <option value="ENERGIA">⚡ Luz / Energia Elétrica</option>
                  <option value="AGUA">💧 Água & Saneamento</option>
                  <option value="ALUGUEL">🏠 Aluguel do Imóvel</option>
                  <option value="MERCADO">🛒 Mercado / Copa & Alimentação</option>
                  <option value="INTERNET">📶 Internet & Telefone</option>
                  <option value="SISTEMAS">💻 Software & Licenças de Sistemas</option>
                  <option value="FOLHA">👥 Folha / Pró-labore</option>
                  <option value="MANUTENCAO">🔧 Manutenção Geral & Reparos</option>
                  <option value="OUTROS">📋 Outras Despesas Fixas</option>
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Descrição / Nome do Custo</label>
                <input
                  type="text"
                  required
                  value={costName}
                  onChange={(e) => setCostName(e.target.value)}
                  placeholder="Ex: Energia Elétrica Loja 1, Internet Fibra, Mercado Mensal"
                  className="w-full p-3 bg-black border border-white/10 focus:border-amber-500 focus:outline-hidden rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-black border border-white/10 focus:border-amber-500 focus:outline-hidden rounded-xl text-xs text-white font-bold placeholder-slate-600 transition-all"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dia do Vencimento</label>
                  <input
                    type="text"
                    required
                    value={costDueDate}
                    onChange={(e) => setCostDueDate(e.target.value)}
                    placeholder="Ex: Dia 10, Todo dia 05"
                    className="w-full p-3 bg-black border border-white/10 focus:border-amber-500 focus:outline-hidden rounded-xl text-xs text-white font-medium placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observações (Opcional)</label>
                <input
                  type="text"
                  value={costNotes}
                  onChange={(e) => setCostNotes(e.target.value)}
                  placeholder="Ex: Pagamento via débito automático na conta"
                  className="w-full p-3 bg-black border border-white/10 focus:border-amber-500 focus:outline-hidden rounded-xl text-xs text-white font-medium placeholder-slate-600 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseFixedCostModal}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-102 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingFixedCostId ? 'Salvar Alterações' : 'Confirmar Custo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
