import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wrench,
  Package,
  Users,
  Plus,
  ShoppingCart,
  UserPlus,
  Box,
  Wallet,
  BarChart3,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  DollarSign,
  ChevronDown,
  ArrowRight,
  Smartphone,
  Laptop,
  Gamepad2,
  Sparkles,
  Crown,
  ShieldCheck,
  Check,
  Edit3,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/formatters';
import { ServiceOrder, SubscriptionPlanInfo } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface DashboardRecentOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  device: string;
  status: string;
  statusLabel: string;
  statusBadgeClass: string;
  totalPrice: number;
}

interface DashboardViewProps {
  onNavigate: (tab: string, itemId?: string) => void;
  onOpenQuickAction?: (
    action: 'new_order' | 'new_sale' | 'new_customer' | 'new_product' | 'purchase' | 'cash'
  ) => void;
  onOpenNewOrder?: () => void;
  onOpenPDV?: () => void;
  onViewOrder?: (order: ServiceOrder) => void;
  onOpenNewProduct?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickAction,
  onOpenNewOrder,
  onOpenPDV,
  onViewOrder,
  onOpenNewProduct,
}) => {
  const { isDark } = useTheme();
  // Real-time synchronization state
  const [tick, setTick] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<'30days' | '7days' | '15days' | 'year'>('30days');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; date: string } | null>(null);

  // Hidden Plan Menu State (canto superior direito: PAINEL ATIVO)
  const [isPlanMenuOpen, setIsPlanMenuOpen] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [savePlanFeedback, setSavePlanFeedback] = useState(false);
  const planContainerRef = useRef<HTMLDivElement>(null);

  const planInfo = useMemo(() => {
    return StorageService.getSubscriptionPlan();
  }, [tick]);

  const [editPlanName, setEditPlanName] = useState(planInfo.planName);
  const [editPlanPrice, setEditPlanPrice] = useState(planInfo.planPrice);
  const [editBillingPeriod, setEditBillingPeriod] = useState(planInfo.billingPeriod);
  const [editExpiryDate, setEditExpiryDate] = useState(planInfo.expiryDate);

  // Sync edit form fields when planInfo changes or when editing mode opens
  useEffect(() => {
    setEditPlanName(planInfo.planName);
    setEditPlanPrice(planInfo.planPrice);
    setEditBillingPeriod(planInfo.billingPeriod);
    setEditExpiryDate(planInfo.expiryDate);
  }, [planInfo, isEditingPlan]);

  // Click outside and ESC listener to close hidden plan menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (planContainerRef.current && !planContainerRef.current.contains(event.target as Node)) {
        setIsPlanMenuOpen(false);
        setIsEditingPlan(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPlanMenuOpen(false);
        setIsEditingPlan(false);
      }
    };
    if (isPlanMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlanMenuOpen]);

  // Expiration calculation & days remaining
  const expiryDetails = useMemo(() => {
    if (!planInfo.expiryDate) {
      return { daysRemaining: null, formattedDate: 'Não definida', isExpired: false, isExpiringSoon: false };
    }
    const [year, month, day] = planInfo.expiryDate.split('-').map(Number);
    const expiry = new Date(year, (month || 1) - 1, day || 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = expiry.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return {
      daysRemaining,
      formattedDate,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 7,
    };
  }, [planInfo.expiryDate]);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SubscriptionPlanInfo = {
      ...planInfo,
      planName: editPlanName.trim() || 'Plano PRO Empresarial',
      planPrice: Number(editPlanPrice) >= 0 ? Number(editPlanPrice) : 99.9,
      billingPeriod: editBillingPeriod,
      expiryDate: editExpiryDate || '2026-10-15',
      status: 'ATIVO',
    };
    StorageService.saveSubscriptionPlan(updated);
    setIsEditingPlan(false);
    setSavePlanFeedback(true);
    setTimeout(() => setSavePlanFeedback(false), 3000);
  };

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to storage changes in real time
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // System Data
  const orders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const sales = useMemo(() => StorageService.getSales() || [], [tick]);
  const products = useMemo(() => StorageService.getProducts() || [], [tick]);
  const customers = useMemo(() => StorageService.getCustomers() || [], [tick]);
  const cashSession = useMemo(() => StorageService.getCashSession(), [tick]);
  const settings = useMemo(() => StorageService.getSettings(), [tick]);

  // Dynamic calculations from real system data
  const isCashOpen = cashSession?.status === 'ABERTO';

  // 1. Revenue calculations (Real time directly from storage including delivered OS)
  const { todaySalesTotal, todaySalesCount, growthPercentage } = useMemo(() => {
    const now = new Date();
    const isToday = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const isYesterday = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      return d.getDate() === yest.getDate() && d.getMonth() === yest.getMonth() && d.getFullYear() === yest.getFullYear();
    };

    // Today POS sales
    const tSales = sales.filter((s) => isToday(s.date || s.createdAt));
    const tSalesTotal = tSales.reduce((acc, s) => acc + (s.total || 0), 0);

    // Yesterday POS sales
    const ySales = sales.filter((s) => isYesterday(s.date || s.createdAt));
    const ySalesTotal = ySales.reduce((acc, s) => acc + (s.total || 0), 0);

    // Today delivered/paid OS
    const tOrders = orders.filter((o) => o.status === 'ENTREGUE' && isToday(o.deliveryDate || o.updatedAt || o.createdAt));
    const tOrdersTotal = tOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    // Yesterday delivered/paid OS
    const yOrders = orders.filter((o) => o.status === 'ENTREGUE' && isYesterday(o.deliveryDate || o.updatedAt || o.createdAt));
    const yOrdersTotal = yOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    const totalToday = tSalesTotal + tOrdersTotal;
    const countToday = tSales.length + tOrders.length;
    const totalYesterday = ySalesTotal + yOrdersTotal;

    let growth = 0;
    if (totalYesterday > 0) {
      growth = Math.round(((totalToday - totalYesterday) / totalYesterday) * 100);
    } else if (totalToday > 0) {
      growth = 100;
    }

    return {
      todaySalesTotal: totalToday,
      todaySalesCount: countToday,
      growthPercentage: growth,
    };
  }, [sales, orders]);

  const monthRevenueTotal = useMemo(() => {
    const sumSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const sumDeliveredOrders = orders
      .filter((o) => o.status === 'ENTREGUE')
      .reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    return sumSales + sumDeliveredOrders;
  }, [sales, orders]);

  // 2. Order status counts (Real time calculation with no forced minimums)
  const statusCounts = useMemo(() => {
    const nova = orders.filter((o) => o.status === 'NOVA').length;
    const orcamento = orders.filter(
      (o) =>
        (o.status as string) === 'ORCAMENTO' ||
        o.status === 'AGUARDANDO_DIAGNOSTICO' ||
        o.status === 'AGUARDANDO_ORCAMENTO'
    ).length;
    const aguardandoAprovacao = orders.filter(
      (o) => o.status === 'AGUARDANDO_APROVACAO' || o.status === 'AGUARDANDO_AUTORIZACAO'
    ).length;
    const emManutencao = orders.filter(
      (o) => o.status === 'EM_MANUTENCAO' || o.status === 'APROVADA' || o.status === 'AGUARDANDO_PECA'
    ).length;
    const pronta = orders.filter((o) => o.status === 'PRONTA' || o.status === 'PRONTO').length;
    const entregue = orders.filter((o) => o.status === 'ENTREGUE').length;

    return {
      nova,
      orcamento,
      aguardandoAprovacao,
      emManutencao,
      pronta,
      entregue,
      total: orders.length,
    };
  }, [orders]);

  // 3. Stock metrics
  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => (p.stockQuantity ?? 0) <= (p.minStockQuantity || p.minStock || 0)
    ).length;
  }, [products]);

  // 4. Customers count
  const customerCount = useMemo(() => {
    return customers.length;
  }, [customers]);

  // 5. Recent Service Orders list (reactive to actual database orders)
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5).map((o) => {
      let label = 'Em Aberto';
      let badgeClass = 'bg-blue-600/30 text-blue-300 border border-blue-500/50';

      if (o.status === 'PRONTA' || o.status === 'PRONTO') {
        label = 'Pronta';
        badgeClass = 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      } else if (o.status === 'EM_MANUTENCAO' || o.status === 'APROVADA') {
        label = 'Em Manutenção';
        badgeClass = 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
      } else if (o.status === 'ENTREGUE') {
        label = 'Entregue';
        badgeClass = 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
      } else if (o.status === 'AGUARDANDO_APROVACAO' || o.status === 'AGUARDANDO_AUTORIZACAO') {
        label = 'Aguard. Aprovação';
        badgeClass = 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      } else if (
        (o.status as string) === 'ORCAMENTO' ||
        o.status === 'AGUARDANDO_DIAGNOSTICO' ||
        o.status === 'AGUARDANDO_ORCAMENTO'
      ) {
        label = 'Orçamento';
        badgeClass = 'bg-orange-600/30 text-orange-300 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.4)]';
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber || 1000,
        customerName: o.customerName || 'Cliente',
        device: `${o.brand || ''} ${o.model || ''}`.trim() || 'Dispositivo',
        status: o.status,
        statusLabel: label,
        statusBadgeClass: badgeClass,
        totalPrice: o.totalPrice || 0,
      };
    });
  }, [orders]);

  // 6. Top selling products dynamically aggregated from real sales
  const topProducts = useMemo(() => {
    const productCountMap = new Map<string, { id: string; name: string; qty: number }>();

    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const pId = item.productId || item.productName || item.name || 'item';
        const pName = item.productName || item.name || 'Produto';
        const existing = productCountMap.get(pId);
        if (existing) {
          existing.qty += item.quantity || 1;
        } else {
          productCountMap.set(pId, {
            id: pId,
            name: pName,
            qty: item.quantity || 1,
          });
        }
      });
    });

    const sorted = Array.from(productCountMap.values()).sort((a, b) => b.qty - a.qty);
    return sorted.slice(0, 5).map((p) => {
      const lower = p.name.toLowerCase();
      let iconType = 'other';
      if (lower.includes('película') || lower.includes('pelicula') || lower.includes('vidro') || lower.includes('tela')) iconType = 'glass';
      else if (lower.includes('cabo') || lower.includes('usb') || lower.includes('tipo-c') || lower.includes('lightning')) iconType = 'cable';
      else if (lower.includes('carregador') || lower.includes('turbo') || lower.includes('fonte') || lower.includes('adaptador')) iconType = 'charger';
      else if (lower.includes('capa') || lower.includes('capinha') || lower.includes('case') || lower.includes('silicone')) iconType = 'case';
      else if (lower.includes('fone') || lower.includes('bluetooth') || lower.includes('headphone') || lower.includes('airpod') || lower.includes('earphone')) iconType = 'headphone';
      else if (lower.includes('celular') || lower.includes('smartphone') || lower.includes('iphone') || lower.includes('samsung') || lower.includes('motorola') || lower.includes('xiaomi')) iconType = 'phone';

      return {
        id: p.id,
        name: p.name,
        qty: p.qty,
        iconType,
      };
    });
  }, [sales]);

  // 7. Payment methods breakdown dynamically calculated from monthly sales & completed orders
  const paymentMethods = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthSales = sales.filter((s) => {
      const dateStr = s.date || s.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentMonthOrders = orders.filter((o) => {
      if (o.status !== 'ENTREGUE' && o.paymentStatus !== 'PAGO') return false;
      const dateStr = o.deliveredAt || o.updatedAt || o.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let pix = 0;
    let credito = 0;
    let dinheiro = 0;
    let debito = 0;
    let transferencia = 0;
    let outros = 0;

    const categorizePM = (pm: string) => {
      const p = (pm || '').toUpperCase().trim();
      if (p.includes('PIX')) return 'pix';
      if (p.includes('CREDITO') || p.includes('CRÉDITO')) return 'credito';
      if (p.includes('DINHEIRO')) return 'dinheiro';
      if (p.includes('DEBITO') || p.includes('DÉBITO')) return 'debito';
      if (p.includes('TRANSFERENCIA') || p.includes('TRANSFERÊNCIA')) return 'transferencia';
      return 'outros';
    };

    currentMonthSales.forEach((s) => {
      const amt = Number(s.total) || 0;
      const cat = categorizePM(s.paymentMethod);
      if (cat === 'pix') pix += amt;
      else if (cat === 'credito') credito += amt;
      else if (cat === 'dinheiro') dinheiro += amt;
      else if (cat === 'debito') debito += amt;
      else if (cat === 'transferencia') transferencia += amt;
      else outros += amt;
    });

    currentMonthOrders.forEach((o) => {
      const amt = Number(o.totalPrice) || 0;
      const cat = categorizePM(o.paymentMethod);
      if (cat === 'pix') pix += amt;
      else if (cat === 'credito') credito += amt;
      else if (cat === 'dinheiro') dinheiro += amt;
      else if (cat === 'debito') debito += amt;
      else if (cat === 'transferencia') transferencia += amt;
      else outros += amt;
    });

    const total = pix + credito + dinheiro + debito + transferencia + outros;
    const getPct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

    return [
      { name: 'PIX', amount: pix, pct: getPct(pix), color: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]', icon: 'diamond' },
      { name: 'Cartão de Crédito', amount: credito, pct: getPct(credito), color: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]', icon: 'card' },
      { name: 'Dinheiro', amount: dinheiro, pct: getPct(dinheiro), color: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]', icon: 'cash' },
      { name: 'Cartão de Débito', amount: debito, pct: getPct(debito), color: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]', icon: 'card' },
      { name: 'Transferência', amount: transferencia, pct: getPct(transferencia), color: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]', icon: 'bank' },
      { name: 'Outros', amount: outros, pct: getPct(outros), color: 'bg-slate-600', icon: 'other' },
    ];
  }, [sales, orders]);

  // 8. Dynamic Dashboard Alerts & Notifications
  const dashboardAlerts = useMemo(() => {
    const list: {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      icon: any;
      iconBg: string;
      iconColor: string;
      borderColor: string;
      cardBg: string;
      tab: string;
    }[] = [];

    // 1. Zero stock
    const zeroStock = products.filter((p) => (p.stockQuantity ?? 0) <= 0);
    if (zeroStock.length > 0) {
      list.push({
        id: 'alert-zero-stock',
        type: 'zero_stock',
        title: `${zeroStock.length} produto${zeroStock.length > 1 ? 's' : ''} com estoque zerado`,
        subtitle: 'Verifique e reponha o estoque',
        icon: AlertTriangle,
        iconBg: 'bg-rose-600/30 border-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
        iconColor: 'text-rose-400',
        borderColor: isDark ? 'border-rose-900/40 hover:border-rose-500/60' : 'border-rose-200 hover:border-rose-300',
        cardBg: isDark ? 'bg-rose-950/20' : 'bg-rose-50',
        tab: 'PRODUCTS',
      });
    }

    // 2. Low stock (above 0 and <= minStock)
    const lowStock = products.filter(
      (p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= (p.minStockQuantity || p.minStock || 0)
    );
    if (lowStock.length > 0) {
      list.push({
        id: 'alert-low-stock',
        type: 'low_stock',
        title: `${lowStock.length} produto${lowStock.length > 1 ? 's' : ''} abaixo do estoque mínimo`,
        subtitle: 'Acesse o estoque para compras',
        icon: AlertTriangle,
        iconBg: 'bg-amber-600/30 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
        iconColor: 'text-amber-400',
        borderColor: isDark ? 'border-amber-900/40 hover:border-amber-500/60' : 'border-amber-200 hover:border-amber-300',
        cardBg: isDark ? 'bg-amber-950/20' : 'bg-amber-50',
        tab: 'PRODUCTS',
      });
    }

    // 3. OS Aguardando Aprovação
    const pendingApproval = orders.filter(
      (o) => o.status === 'AGUARDANDO_APROVACAO' || o.status === 'AGUARDANDO_AUTORIZACAO'
    );
    if (pendingApproval.length > 0) {
      list.push({
        id: 'alert-pending-os',
        type: 'approval',
        title: `${pendingApproval.length} OS aguardando aprovação`,
        subtitle: 'Entre em contato com os clientes',
        icon: Info,
        iconBg: 'bg-blue-600/30 border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]',
        iconColor: 'text-blue-400',
        borderColor: isDark ? 'border-blue-900/40 hover:border-blue-500/60' : 'border-blue-200 hover:border-blue-300',
        cardBg: isDark ? 'bg-blue-950/20' : 'bg-blue-50',
        tab: 'ORDERS',
      });
    }

    // 4. Caixa status
    if (isCashOpen && cashSession) {
      const openedTime = cashSession.openedAt
        ? new Date(cashSession.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'hoje';
      list.push({
        id: 'alert-cash-open',
        type: 'cash',
        title: `Caixa aberto desde ${openedTime}`,
        subtitle: `Responsável: ${cashSession.openedBy || 'Operador'}`,
        icon: CheckCircle2,
        iconBg: 'bg-emerald-600/30 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
        iconColor: 'text-emerald-400',
        borderColor: isDark ? 'border-emerald-900/40 hover:border-emerald-500/60' : 'border-emerald-200 hover:border-emerald-300',
        cardBg: isDark ? 'bg-emerald-950/20' : 'bg-emerald-50',
        tab: 'CASH',
      });
    } else {
      list.push({
        id: 'alert-cash-closed',
        type: 'cash',
        title: 'Caixa fechado no momento',
        subtitle: 'Abra o caixa para iniciar movimentações',
        icon: Clock,
        iconBg: 'bg-slate-600/30 border-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.4)]',
        iconColor: 'text-slate-400',
        borderColor: isDark ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300',
        cardBg: isDark ? 'bg-slate-900/40' : 'bg-slate-50',
        tab: 'CASH',
      });
    }

    // 5. OS Atrasadas / Prazos expirados
    const delayed = orders.filter((o) => {
      if (o.status === 'ENTREGUE' || o.status === 'CANCELADA' || o.status === 'PRONTA' || o.status === 'PRONTO') return false;
      if (o.estimatedCompletionDate) {
        const [y, m, d] = o.estimatedCompletionDate.split('-').map(Number);
        const target = new Date(y, (m || 1) - 1, d || 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return target < today;
      }
      return false;
    });
    if (delayed.length > 0) {
      list.push({
        id: 'alert-delayed-os',
        type: 'delayed',
        title: `${delayed.length} OS com prazo expirado`,
        subtitle: `Cliente: ${delayed[0].customerName || 'Verifique as ordens'}`,
        icon: Clock,
        iconBg: 'bg-purple-600/30 border-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]',
        iconColor: 'text-purple-400',
        borderColor: isDark ? 'border-purple-900/40 hover:border-purple-500/60' : 'border-purple-200 hover:border-purple-300',
        cardBg: isDark ? 'bg-purple-950/20' : 'bg-purple-50',
        tab: 'ORDERS',
      });
    }

    return list;
  }, [products, orders, isCashOpen, cashSession, isDark]);

  // Quick Action Dispatchers
  const handleNovaOS = () => {
    if (onOpenNewOrder) onOpenNewOrder();
    else if (onOpenQuickAction) onOpenQuickAction('new_order');
    else onNavigate('ORDERS');
  };

  const handleNovaVenda = () => {
    if (onOpenPDV) onOpenPDV();
    else if (onOpenQuickAction) onOpenQuickAction('new_sale');
    else onNavigate('POS');
  };

  const handleNovoCliente = () => {
    if (onOpenQuickAction) onOpenQuickAction('new_customer');
    else onNavigate('CUSTOMERS');
  };

  const handleEntradaEstoque = () => {
    onNavigate('PURCHASES');
  };

  const handleAbrirCaixa = () => {
    onNavigate('CASH');
  };

  const handleRelatorios = () => {
    onNavigate('REPORTS');
  };

  // 9. SVG Area Chart Calculations (Real time data buckets)
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; salesVal: number; serviceVal: number }[] = [];
    const numPoints = 7;
    let daysStep = 5;
    if (chartPeriod === '7days') daysStep = 1;
    else if (chartPeriod === '15days') daysStep = 2.5;
    else if (chartPeriod === 'year') daysStep = 52;

    for (let i = numPoints - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - Math.round(i * daysStep));
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${dayStr}/${monthStr}`;

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      if (daysStep > 1 && i > 0) {
        start.setDate(start.getDate() - Math.floor(daysStep / 2));
      }
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      if (daysStep > 1 && i < numPoints - 1) {
        end.setDate(end.getDate() + Math.floor(daysStep / 2));
      }

      let sVal = 0;
      sales.forEach((s) => {
        const sDate = new Date(s.date || s.createdAt || '');
        if (!isNaN(sDate.getTime()) && sDate >= start && sDate <= end) {
          sVal += s.total || 0;
        }
      });

      let oVal = 0;
      orders.forEach((o) => {
        if (o.status === 'ENTREGUE') {
          const oDate = new Date(o.deliveredAt || o.updatedAt || o.createdAt || '');
          if (!isNaN(oDate.getTime()) && oDate >= start && oDate <= end) {
            oVal += o.totalPrice || 0;
          }
        }
      });

      buckets.push({
        label,
        salesVal: sVal,
        serviceVal: oVal,
      });
    }

    const allVals = buckets.flatMap((b) => [b.salesVal, b.serviceVal]);
    const maxVal = Math.max(...allVals, 0);
    const chartMax = maxVal > 0 ? Math.ceil((maxVal * 1.25) / 100) * 100 : 1000;

    const yLabels = [
      chartMax >= 1000 ? `${(chartMax / 1000).toFixed(1)}k` : `${chartMax}`,
      chartMax >= 1000 ? `${((chartMax * 0.75) / 1000).toFixed(1)}k` : `${Math.round(chartMax * 0.75)}`,
      chartMax >= 1000 ? `${((chartMax * 0.5) / 1000).toFixed(1)}k` : `${Math.round(chartMax * 0.5)}`,
      chartMax >= 1000 ? `${((chartMax * 0.25) / 1000).toFixed(1)}k` : `${Math.round(chartMax * 0.25)}`,
      '0',
    ];

    const xLabels = buckets.map((b) => b.label);
    const xCoords = [50, 128, 206, 284, 362, 440, 518];

    const salesPoints = buckets.map((b, idx) => {
      const x = xCoords[idx];
      const y = maxVal > 0 ? 170 - (b.salesVal / chartMax) * 140 : 170;
      return { x, y, val: b.salesVal, date: b.label };
    });

    const servicePoints = buckets.map((b, idx) => {
      const x = xCoords[idx];
      const y = maxVal > 0 ? 170 - (b.serviceVal / chartMax) * 140 : 170;
      return { x, y, val: b.serviceVal, date: b.label };
    });

    let peakPoint = salesPoints[salesPoints.length - 1];
    let highestVal = 0;
    salesPoints.forEach((p) => {
      if (p.val > highestVal) {
        highestVal = p.val;
        peakPoint = p;
      }
    });

    return {
      xLabels,
      yLabels,
      salesPoints,
      servicePoints,
      peakPoint,
      hasData: maxVal > 0,
    };
  }, [sales, orders, chartPeriod]);

  // Helper to generate smooth SVG path with cubic beziers
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length === 0) return 'M 50 170 L 518 170';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const salesPath = generateSmoothPath(chartData.salesPoints);
  const servicePath = generateSmoothPath(chartData.servicePoints);

  const salesAreaPath = `${salesPath} L ${chartData.salesPoints[chartData.salesPoints.length - 1].x} 175 L ${chartData.salesPoints[0].x} 175 Z`;
  const serviceAreaPath = `${servicePath} L ${chartData.servicePoints[chartData.servicePoints.length - 1].x} 175 L ${chartData.servicePoints[0].x} 175 Z`;

  // Donut chart arcs calculation
  const donutTotal = statusCounts.total;
  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~339.29

  const donutSegments = [
    { label: 'Nova', count: statusCounts.nova, color: '#0ea5e9' }, // Cyan
    { label: 'Orçamento', count: statusCounts.orcamento, color: '#f59e0b' }, // Amber
    { label: 'Aguard. Aprovação', count: statusCounts.aguardandoAprovacao, color: '#eab308' }, // Yellow
    { label: 'Em Manutenção', count: statusCounts.emManutencao, color: '#a855f7' }, // Purple
    { label: 'Pronta', count: statusCounts.pronta, color: '#10b981' }, // Green
    { label: 'Entregue', count: statusCounts.entregue, color: '#06b6d4' }, // Teal
  ];

  let accumulatedPercent = 0;
  const donutArcs = donutTotal > 0
    ? donutSegments.map((seg) => {
        const pct = seg.count / donutTotal;
        const strokeDash = pct * donutCircumference;
        const strokeOffset = -accumulatedPercent * donutCircumference;
        accumulatedPercent += pct;
        return {
          ...seg,
          strokeDash,
          strokeOffset,
        };
      })
    : [];

  return (
    <div className="space-y-4 pb-8">
      {/* 1. TOP HERO BANNER */}
      <section
        className={`relative rounded-2xl p-3 sm:p-4 border-2 transition-all z-20 ${
          isDark
            ? 'bg-gradient-to-r from-[#0a142c] via-[#081023] to-[#060c1c] border-blue-500/60 shadow-[0_0_24px_rgba(59,130,246,0.3)] text-white'
            : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-blue-300 shadow-sm text-slate-800'
        }`}
      >
        {/* Neon Glow Ambient Orbs (contained cleanly without clipping popovers) */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Greeting and Slogan in One Compact Row */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">👋</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
                  Olá, Marcos!
                </h1>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="font-serif italic text-xs sm:text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 whitespace-nowrap">
                  Consertar • Conectar • Evoluir!
                </span>
              </div>
              <p className={`text-xs mt-0.5 truncate whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Central de operações em tempo real da assistência técnica e vendas.
              </p>
            </div>
          </div>

          {/* Right: Live Calendar, Clock and Quick Status Pill */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-end md:self-auto">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-slate-400">|</span>
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-mono whitespace-nowrap">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Menu Escondido: Informações da Assinatura e Plano do Cliente (Plano em uso, Valor e Vencimento) */}
            <div className="relative" ref={planContainerRef}>
              <button
                type="button"
                id="btn-painel-ativo-menu"
                onClick={() => setIsPlanMenuOpen((prev) => !prev)}
                className={`border-2 text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-md ${
                  isPlanMenuOpen
                    ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-[1.02]'
                    : isDark
                    ? 'bg-blue-600/30 hover:bg-blue-600/50 border-blue-400 text-blue-100 hover:text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                }`}
                title="Clique para abrir detalhes do Plano, Valor e Vencimento da Assinatura"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>PAINEL ATIVO</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isPlanMenuOpen ? 'rotate-180 text-white' : 'text-blue-300'
                  }`}
                />
              </button>

              {/* MENU ESCONDIDO (DROPDOWN SUSPENSO 100% VISÍVEL, ALINHADO AO BOTÃO PAINEL ATIVO) */}
              {isPlanMenuOpen && (
                <div
                  id="popover-plano-assinatura"
                  className={`absolute right-0 top-full mt-2 w-[340px] sm:w-[450px] max-w-[calc(100vw-32px)] rounded-2xl border-2 p-5 shadow-2xl z-[9999] transition-all animate-in fade-in zoom-in-95 duration-150 cursor-default ${
                    isDark
                      ? 'bg-[#091122] border-blue-500/70 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-2 ring-blue-500/30'
                      : 'bg-white border-blue-300 text-slate-900 shadow-2xl ring-2 ring-blue-500/20'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Cabeçalho do Menu */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                            Assinatura & Plano do Cliente
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ATIVO
                            </span>
                          </h4>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {settings.commercialName || 'TechNova Assistência'} • Gestão de Licença
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPlanMenuOpen(false);
                          setIsEditingPlan(false);
                        }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                        title="Fechar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Feedback de salvamento */}
                    {savePlanFeedback && (
                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Dados do plano atualizados com sucesso!</span>
                      </div>
                    )}

                    {!isEditingPlan ? (
                      /* MODO VISUALIZAÇÃO DO PLANO */
                      <div className="mt-4 space-y-3.5">
                        {/* 1. QUAL PLANO O CLIENTE ESTÁ USANDO */}
                        <div
                          className={`p-3.5 rounded-xl border ${
                            isDark
                              ? 'bg-gradient-to-br from-blue-950/60 to-slate-900/90 border-blue-500/40'
                              : 'bg-blue-50/80 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                            <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>Plano em Uso pelo Cliente</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold">
                              {planInfo.billingPeriod}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                            <div>
                              <span className="text-base sm:text-lg font-black tracking-tight block">
                                {planInfo.planName}
                              </span>
                              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Contrato: {planInfo.contractNumber || 'MSP-7842-PRO'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. VALOR DO PLANO & 3. ATÉ ONDE VENCE O PLANO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Valor do Plano */}
                          <div
                            className={`p-3.5 rounded-xl border ${
                              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Valor do Plano
                              </span>
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                                {formatCurrency(planInfo.planPrice)}
                              </span>
                            </div>
                            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Cobrança {planInfo.billingPeriod.toLowerCase()}
                            </span>
                          </div>

                          {/* Vencimento do Plano */}
                          <div
                            className={`p-3.5 rounded-xl border ${
                              expiryDetails.isExpired
                                ? 'bg-rose-950/40 border-rose-500/50'
                                : expiryDetails.isExpiringSoon
                                ? 'bg-amber-950/40 border-amber-500/50'
                                : isDark
                                ? 'bg-slate-900/90 border-slate-800'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Até onde vence o plano</span>
                              <Clock className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="mt-1.5 text-sm sm:text-base font-black">
                              {planInfo.expiryDate
                                ? new Date(planInfo.expiryDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : 'Indeterminado'}
                            </div>
                            <div className="mt-1">
                              {expiryDetails.daysRemaining !== null && (
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                    expiryDetails.isExpired
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                      : expiryDetails.isExpiringSoon
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  }`}
                                >
                                  {expiryDetails.isExpired
                                    ? 'Assinatura Vencida'
                                    : `Restam ${expiryDetails.daysRemaining} dia(s) de acesso`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status de Cobertura / Recursos Liberados */}
                        <div
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-1">
                            Módulos & Recursos Inclusos nesta Licença:
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                            <span>Ordens de Serviço & Gestão de Técnicos ilimitadas</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                            <span>PDV Frente de Caixa, Vendas Rápidas & Emissão de Recibos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                            <span>Controle de Estoque, Peças & Auditoria em tempo real</span>
                          </div>
                        </div>

                        {/* Botões do Rodapé */}
                        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setIsEditingPlan(true)}
                            className={`flex-1 py-2 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            }`}
                          >
                            <Edit3 className="w-4 h-4 text-blue-400" />
                            <span>Editar Informações do Plano</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlanMenuOpen(false);
                              setIsEditingPlan(false);
                            }}
                            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODO FORMULÁRIO DE EDIÇÃO DO PLANO */
                      <form onSubmit={handleSavePlan} className="mt-4 space-y-3">
                        <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                          <Edit3 className="w-4 h-4" />
                          <span>Atualizar Dados do Plano do Cliente:</span>
                        </div>

                        {/* Nome do Plano */}
                        <div>
                          <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Qual plano o cliente está usando:
                          </label>
                          <input
                            type="text"
                            required
                            value={editPlanName}
                            onChange={(e) => setEditPlanName(e.target.value)}
                            placeholder="Ex: Plano PRO Empresarial, Plano Ouro..."
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Valor do Plano e Ciclo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Valor do Plano (R$):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={editPlanPrice}
                              onChange={(e) => setEditPlanPrice(parseFloat(e.target.value) || 0)}
                              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Ciclo de Cobrança:
                            </label>
                            <select
                              value={editBillingPeriod}
                              onChange={(e) => setEditBillingPeriod(e.target.value as any)}
                              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="MENSAL">Mensal</option>
                              <option value="TRIMESTRAL">Trimestral</option>
                              <option value="SEMESTRAL">Semestral</option>
                              <option value="ANUAL">Anual</option>
                              <option value="VITALÍCIO">Vitalício</option>
                            </select>
                          </div>
                        </div>

                        {/* Data de Vencimento do Plano */}
                        <div>
                          <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Até onde vence o plano:
                          </label>
                          <input
                            type="date"
                            required
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Botões do Formulário */}
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsEditingPlan(false)}
                            className={`flex-1 py-2 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            }`}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Salvar Alterações</span>
                          </button>
                        </div>
                      </form>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP QUICK ACTIONS BAR (MOVED TO TOP AS REQUESTED BY USER) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Button 1: Nova OS */}
        <button
          type="button"
          onClick={handleNovaOS}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.55)] hover:shadow-[0_0_28px_rgba(59,130,246,0.8)]'
              : 'bg-[#e8f1ff] border border-blue-200/90 shadow-2xs hover:shadow-md hover:bg-[#deebff]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-blue-800/70 border border-blue-300/80 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : 'bg-[#0066ff] shadow-sm'
          }`}>
            <Plus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#0a2540]'
            }`}>
              Nova OS
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-blue-100' : 'text-blue-700 font-medium'
            }`}>
              Reg. equipamento
            </span>
          </div>
        </button>

        {/* Button 2: Nova Venda */}
        <button
          type="button"
          onClick={handleNovaVenda}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.55)] hover:shadow-[0_0_28px_rgba(16,185,129,0.8)]'
              : 'bg-[#e6f8f3] border border-emerald-200/90 shadow-2xs hover:shadow-md hover:bg-[#d8f5ec]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-emerald-800/70 border border-emerald-300/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              : 'bg-[#00c896] shadow-sm'
          }`}>
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#053b2d]'
            }`}>
              Nova Venda
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-emerald-100' : 'text-emerald-700 font-medium'
            }`}>
              PDV da loja
            </span>
          </div>
        </button>

        {/* Button 3: Novo Cliente */}
        <button
          type="button"
          onClick={handleNovoCliente}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.55)] hover:shadow-[0_0_28px_rgba(168,85,247,0.8)]'
              : 'bg-[#f3ebff] border border-purple-200/90 shadow-2xs hover:shadow-md hover:bg-[#ebd9ff]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-purple-800/70 border border-purple-300/80 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : 'bg-[#9043f6] shadow-sm'
          }`}>
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#2e0962]'
            }`}>
              Novo Cliente
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-purple-100' : 'text-purple-700 font-medium'
            }`}>
              Cadastrar cliente
            </span>
          </div>
        </button>

        {/* Button 4: Entrada de Estoque */}
        <button
          type="button"
          onClick={handleEntradaEstoque}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.55)] hover:shadow-[0_0_28px_rgba(245,158,11,0.8)]'
              : 'bg-[#fff3e6] border border-amber-200/90 shadow-2xs hover:shadow-md hover:bg-[#ffe6cc]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-amber-800/70 border border-amber-300/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-[#ff8800] shadow-sm'
          }`}>
            <Box className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#522900]'
            }`}>
              Entrada Estoque
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-amber-100' : 'text-amber-700 font-medium'
            }`}>
              Add produtos
            </span>
          </div>
        </button>

        {/* Button 5: Abrir Caixa */}
        <button
          type="button"
          onClick={handleAbrirCaixa}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-rose-500 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.55)] hover:shadow-[0_0_28px_rgba(244,63,94,0.8)]'
              : 'bg-[#ffeef2] border border-rose-200/90 shadow-2xs hover:shadow-md hover:bg-[#ffdce4]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-rose-800/70 border border-rose-300/80 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              : 'bg-[#ff2d55] shadow-sm'
          }`}>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#570014]'
            }`}>
              {isCashOpen ? 'Caixa Aberto' : 'Abrir Caixa'}
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-rose-100' : 'text-rose-700 font-medium'
            }`}>
              Movimentação
            </span>
          </div>
        </button>

        {/* Button 6: Relatórios */}
        <button
          type="button"
          onClick={handleRelatorios}
          className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left group hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-r from-cyan-700 via-teal-600 to-teal-500 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.55)] hover:shadow-[0_0_28px_rgba(6,182,212,0.8)]'
              : 'bg-[#e6f7ff] border border-cyan-200/90 shadow-2xs hover:shadow-md hover:bg-[#d4f2ff]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform ${
            isDark
              ? 'bg-cyan-800/70 border border-cyan-300/80 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
              : 'bg-[#00b2fe] shadow-sm'
          }`}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate whitespace-nowrap leading-tight ${
              isDark ? 'text-white' : 'text-[#003c57]'
            }`}>
              Relatórios
            </span>
            <span className={`text-[10px] block truncate whitespace-nowrap ${
              isDark ? 'text-cyan-100' : 'text-cyan-700 font-medium'
            }`}>
              Resultados
            </span>
          </div>
        </button>
      </section>

      {/* 3. TOP 5 3D KPI METRIC CARDS WITH EXACT COLORS, DIVISIONS & 3D ICONS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Card 1: Faturamento Hoje (Green 3D Glass) */}
        <div
          onClick={() => onNavigate('CASH')}
          className={`rounded-2xl p-3 border-2 transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#06241a] via-[#081f18] to-[#04130f] border-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:shadow-[0_0_32px_rgba(16,185,129,0.55)]'
              : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-emerald-400 shadow-sm hover:shadow-md'
          }`}
          title="Ver movimentações e fluxo do Caixa de hoje"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              FATURAMENTO HOJE
            </span>
            <span className={`border rounded-full px-1.5 py-0.2 text-[9px] font-bold whitespace-nowrap shrink-0 ${
              growthPercentage >= 0 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}>
              {growthPercentage >= 0 ? `↑ +${growthPercentage}%` : `↓ ${growthPercentage}%`}
            </span>
          </div>
          <div className={`text-lg sm:text-xl font-black tracking-tight whitespace-nowrap truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(todaySalesTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-500/30 text-[10px]">
            <span className="text-emerald-400 font-semibold whitespace-nowrap truncate">
              ↑ {todaySalesCount} {todaySalesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
            </span>
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              <span className="text-xs">💰</span>
            </div>
          </div>
        </div>

        {/* Card 2: Faturamento Mês (Cyan/Blue 3D Glass) */}
        <div
          onClick={() => onNavigate('FINANCE')}
          className={`rounded-2xl p-3 border-2 transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#07203a] via-[#061a30] to-[#041020] border-cyan-500 shadow-[0_0_22px_rgba(6,182,212,0.35)] hover:shadow-[0_0_32px_rgba(6,182,212,0.55)]'
              : 'bg-gradient-to-br from-cyan-50 via-white to-blue-50/50 border-cyan-400 shadow-sm hover:shadow-md'
          }`}
          title="Ver Gestão Financeira Completa"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              FATURAMENTO MÊS
            </span>
            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full px-1.5 py-0.2 text-[9px] font-bold whitespace-nowrap shrink-0">
              ↑ Mensal
            </span>
          </div>
          <div className={`text-lg sm:text-xl font-black tracking-tight whitespace-nowrap truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(monthRevenueTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-cyan-500/30 text-[10px]">
            <span className="text-cyan-400 font-medium whitespace-nowrap truncate">
              ↑ {sales.length + orders.filter(o => o.status === 'ENTREGUE').length} vendas e serviços
            </span>
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              <span className="text-xs">📊</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ordens de Serviço (Purple 3D Glass) */}
        <div
          onClick={() => onNavigate('ORDERS')}
          className={`rounded-2xl p-3 border-2 flex items-center gap-2.5 transition-all cursor-pointer group shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#230d36] via-[#1a0a29] to-[#10051a] border-purple-500 shadow-[0_0_22px_rgba(168,85,247,0.35)] hover:shadow-[0_0_32px_rgba(168,85,247,0.55)]'
              : 'bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border-purple-400 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-purple-500/30 border border-purple-400/70 text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block whitespace-nowrap truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ORDENS DE SERVIÇO
            </span>
            <div className={`text-lg sm:text-xl font-black tracking-tight whitespace-nowrap truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {statusCounts.total}
            </div>
            <span className="text-purple-300 text-[10px] font-medium block whitespace-nowrap truncate">
              {statusCounts.emManutencao} em andamento
            </span>
          </div>
        </div>

        {/* Card 5: Estoque Baixo (Red/Crimson 3D Glass) */}
        <div
          onClick={() => onNavigate('PRODUCTS')}
          className={`rounded-2xl p-3 border-2 flex items-center gap-2.5 transition-all cursor-pointer group shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#300c17] via-[#240811] to-[#170409] border-rose-500 shadow-[0_0_22px_rgba(244,63,94,0.35)] hover:shadow-[0_0_32px_rgba(244,63,94,0.55)]'
              : 'bg-gradient-to-br from-rose-50 via-white to-rose-50/50 border-rose-400 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-rose-500/30 border border-rose-400/70 text-rose-300 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.5)]">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block whitespace-nowrap truncate">
              ESTOQUE BAIXO
            </span>
            <div className={`text-lg sm:text-xl font-black tracking-tight whitespace-nowrap truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {lowStockCount}
            </div>
            <span className="text-rose-300 text-[10px] font-medium block whitespace-nowrap truncate">
              produtos em alerta
            </span>
          </div>
        </div>

        {/* Card 6: Clientes (Teal 3D Glass) */}
        <div
          onClick={() => onNavigate('CUSTOMERS')}
          className={`rounded-2xl p-3 border-2 flex items-center gap-2.5 transition-all cursor-pointer group shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#062429] via-[#051b1f] to-[#031114] border-teal-400 shadow-[0_0_22px_rgba(20,184,166,0.35)] hover:shadow-[0_0_32px_rgba(20,184,166,0.55)]'
              : 'bg-gradient-to-br from-teal-50 via-white to-teal-50/50 border-teal-400 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-teal-500/30 border border-teal-400/70 text-teal-300 shrink-0 shadow-[0_0_12px_rgba(20,184,166,0.5)]">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block whitespace-nowrap truncate">
              CLIENTES
            </span>
            <div className={`text-lg sm:text-xl font-black tracking-tight whitespace-nowrap truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {customerCount}
            </div>
            <span className="text-teal-300 text-[10px] font-semibold block whitespace-nowrap truncate">
              {customerCount === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. CHARTS & ANALYTICS ROW (3 COLUMNS WITH 3D GLASS DIVISIONS) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Column 1: Faturamento (Últimos 30 dias) SVG Area Chart (lg:col-span-6) */}
        <div
          className={`lg:col-span-6 xl:col-span-6 rounded-2xl p-4 flex flex-col justify-between border-2 transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-blue-500/70 shadow-[0_0_24px_rgba(59,130,246,0.25)] text-white'
              : 'bg-white border-blue-300 shadow-sm text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 h-3 bg-cyan-400 rounded-xs" />
                <span className="w-1 h-4 bg-purple-400 rounded-xs" />
                <span className="w-1 h-2.5 bg-pink-400 rounded-xs" />
              </div>
              <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
                Faturamento <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>(Últimos 30 dias)</span>
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-xs whitespace-nowrap">
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  Vendas
                </span>
                <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
                  Serviços (OS)
                </span>
              </div>

              {/* Selector */}
              <div className="relative">
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as any)}
                  className={`border-2 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-500 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="30days">Últimos 30 dias</option>
                  <option value="15days">Últimos 15 dias</option>
                  <option value="7days">Últimos 7 dias</option>
                  <option value="year">Este Ano</option>
                </select>
              </div>
            </div>
          </div>

          {/* SVG Area Chart Container */}
          <div className="relative w-full h-48 sm:h-52 mt-1">
            <svg
              viewBox="0 0 540 210"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="vendasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="servicosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#ec4899" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines and Y-labels */}
              {chartData.yLabels.map((yl, idx) => {
                const yPos = 30 + idx * 35;
                return (
                  <g key={yl + '-' + idx}>
                    <text
                      x="35"
                      y={yPos + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {yl}
                    </text>
                    <line
                      x1="45"
                      y1={yPos}
                      x2="530"
                      y2={yPos}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray={idx === 4 ? '0' : '4 3'}
                    />
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={salesAreaPath} fill="url(#vendasGradient)" />
              <path d={serviceAreaPath} fill="url(#servicosGradient)" />

              {/* Curves */}
              <path
                d={servicePath}
                fill="none"
                stroke="#ec4899"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_6px_rgba(236,72,153,0.7)]"
              />
              <path
                d={salesPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
              />

              {/* Data points */}
              {chartData.salesPoints.map((pt, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:r-6 hover:shadow-[0_0_12px_#06b6d4]"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              ))}

              {/* Dynamic Peak Tooltip Pin */}
              {chartData.hasData && chartData.peakPoint && (
                <g transform={`translate(${chartData.peakPoint.x}, ${chartData.peakPoint.y})`}>
                  <line x1="0" y1="0" x2="0" y2={175 - chartData.peakPoint.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 2" />
                  <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />
                  {/* Pinned Card */}
                  <g transform={`translate(${chartData.peakPoint.x > 400 ? -75 : -40}, ${chartData.peakPoint.y > 60 ? -55 : 15})`}>
                    <rect
                      width="80"
                      height="42"
                      rx="8"
                      fill="#0b1326"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      filter="drop-shadow(0 0 10px rgba(6,182,212,0.5))"
                    />
                    <text x="40" y="18" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      {formatCurrency(chartData.peakPoint.val)}
                    </text>
                    <text x="40" y="32" textAnchor="middle" fill="#94a3b8" fontSize="8">
                      {chartData.peakPoint.date}
                    </text>
                  </g>
                </g>
              )}

              {/* X-axis Date Labels */}
              {chartData.xLabels.map((xl, idx) => {
                const xPos = 50 + idx * 78;
                return (
                  <text
                    key={xl + '-' + idx}
                    x={xPos}
                    y="196"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {xl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Column 2: Ordens de Serviço por Status (Donut Chart) (xl:col-span-3) */}
        <div
          className={`lg:col-span-6 xl:col-span-3 rounded-2xl p-4 flex flex-col justify-between border-2 transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-purple-500/70 shadow-[0_0_24px_rgba(168,85,247,0.25)] text-white'
              : 'bg-white border-purple-300 shadow-sm text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
              Ordens de Serviço por Status
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-auto">
            {/* Donut Graphic */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 2xl:w-36 2xl:h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="none"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="16"
                />
                {donutArcs.map((arc, i) => (
                  <circle
                    key={i}
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="16"
                    strokeDasharray={`${Math.max(0, arc.strokeDash - 2)} ${donutCircumference}`}
                    strokeDashoffset={arc.strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                    style={{
                      filter: `drop-shadow(0 0 4px ${arc.color})`,
                    }}
                  />
                ))}
              </svg>

              {/* Center Total Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black tracking-tight leading-none">
                  {statusCounts.total}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total
                </span>
              </div>
            </div>

            {/* Right Legend */}
            <div className="space-y-1.5 w-full sm:w-auto flex-1 min-w-0">
              {donutSegments.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onNavigate('ORDERS')}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: seg.color,
                        boxShadow: `0 0 6px ${seg.color}`,
                      }}
                    />
                    <span className={`text-xs truncate whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{seg.label}</span>
                  </div>
                  <span className="font-bold text-xs ml-auto shrink-0">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Formas de Pagamento (Mês) (xl:col-span-3) */}
        <div
          className={`lg:col-span-6 xl:col-span-3 rounded-2xl p-4 flex flex-col justify-between border-2 transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-teal-500/70 shadow-[0_0_24px_rgba(20,184,166,0.25)] text-white'
              : 'bg-white border-teal-300 shadow-sm text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
              Formas de Pagamento <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>(Mês)</span>
            </h2>
          </div>

          <div className="space-y-2.5 my-auto">
            {paymentMethods.map((pm) => (
              <div key={pm.name} className="flex items-center gap-2 text-xs">
                {/* Method Icon token */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}>
                  {pm.name === 'PIX' ? (
                    <span className="text-cyan-400 font-bold text-[9px]">◆</span>
                  ) : pm.name === 'Dinheiro' ? (
                    <span className="text-amber-400 font-bold text-[9px]">$</span>
                  ) : pm.name === 'Transferência' ? (
                    <span className="text-purple-400 font-bold text-[9px]">🏦</span>
                  ) : (
                    <span className="text-blue-400 font-bold text-[9px]">💳</span>
                  )}
                </div>

                <span className={`text-xs min-w-[95px] max-w-[120px] truncate whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{pm.name}</span>

                {/* Progress bar with Glowing aura */}
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className={`h-full rounded-full ${pm.color} transition-all duration-700 shadow-[0_0_8px_currentColor]`}
                    style={{ width: `${pm.pct}%` }}
                  />
                </div>

                <span className="font-bold text-xs w-8 text-right shrink-0">{pm.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM 3 CARDS IN ONE ROW: ULTIMAS ORDENS (col-5) + PRODUTOS MAIS VENDIDOS (col-3) + ALERTAS (col-4) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Card 1: Últimas Ordens de Serviço (lg:col-span-12 xl:col-span-5) */}
        <div
          className={`lg:col-span-12 xl:col-span-5 rounded-2xl p-3.5 sm:p-4 border-2 flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-blue-500/70 shadow-[0_0_24px_rgba(59,130,246,0.22)] text-white'
              : 'bg-white border-blue-300 shadow-sm text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 shrink-0">
                  <span className="text-xs">◎</span>
                </div>
                <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
                  Últimas Ordens de Serviço
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ORDERS')}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ver Todas →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="pb-2 pr-2 whitespace-nowrap">#OS</th>
                    <th className="pb-2 px-2 whitespace-nowrap">CLIENTE</th>
                    <th className="pb-2 px-2 whitespace-nowrap">APARELHO</th>
                    <th className="pb-2 px-2 whitespace-nowrap">STATUS</th>
                    <th className="pb-2 pl-2 text-right whitespace-nowrap">VALOR</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        Nenhuma ordem de serviço registrada no momento.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.slice(0, 5).map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => onNavigate('ORDERS')}
                        className={`transition-colors cursor-pointer group ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-2 pr-2 font-bold text-blue-400 group-hover:text-cyan-300 whitespace-nowrap">
                          #{ord.orderNumber}
                        </td>
                        <td className={`py-2 px-2 font-medium truncate max-w-[130px] sm:max-w-[160px] 2xl:max-w-[200px] whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {ord.customerName}
                        </td>
                        <td className={`py-2 px-2 truncate max-w-[120px] sm:max-w-[150px] 2xl:max-w-[190px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {ord.device}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${ord.statusBadgeClass}`}>
                            {ord.statusLabel}
                          </span>
                        </td>
                        <td className="py-2 pl-2 text-right font-bold whitespace-nowrap">
                          {formatCurrency(ord.totalPrice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Produtos Mais Vendidos (lg:col-span-6 xl:col-span-3) */}
        <div
          className={`lg:col-span-6 xl:col-span-3 rounded-2xl p-3.5 sm:p-4 border-2 flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-white'
              : 'bg-white border-cyan-300 shadow-sm text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/60 flex items-center justify-center text-blue-400 shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
                  Produtos Mais Vendidos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('PRODUCTS')}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ver Todos →
              </button>
            </div>

            <div className="space-y-1.5">
              <div className={`flex items-center justify-between text-[10px] uppercase font-bold pb-1 border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <span className="whitespace-nowrap">PRODUTO</span>
                <span className="whitespace-nowrap">QTD</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhum produto vendido no momento.
                </div>
              ) : (
                topProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('PRODUCTS')}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-[#0a1020] border-slate-700/80' : 'bg-slate-100 border-slate-200'
                      }`}>
                        {p.iconType === 'glass' ? (
                          <Smartphone className="w-3 h-3 text-cyan-400" />
                        ) : p.iconType === 'cable' ? (
                          <span className="text-[11px]">🔌</span>
                        ) : p.iconType === 'charger' ? (
                          <span className="text-[11px]">⚡</span>
                        ) : p.iconType === 'case' ? (
                          <span className="text-[11px]">📱</span>
                        ) : p.iconType === 'phone' ? (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="text-[11px]">🎧</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium truncate whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.name}</span>
                    </div>
                    <span className={`font-bold text-xs px-2.5 py-0.5 rounded border shrink-0 ${
                      isDark ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {p.qty}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Alertas e Notificações (lg:col-span-6 xl:col-span-4) */}
        <div
          className={`lg:col-span-6 xl:col-span-4 rounded-2xl p-3.5 sm:p-4 border-2 flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-[#0c1626]/90 border-rose-500/70 shadow-[0_0_24px_rgba(244,63,94,0.22)] text-white'
              : 'bg-white border-rose-300 shadow-sm text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <h2 className="text-sm font-bold tracking-wide whitespace-nowrap">
                  Alertas e Notificações
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ORDERS')}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ver Todos →
              </button>
            </div>

            <div className="space-y-1.5">
              {dashboardAlerts.length === 0 ? (
                <div className={`p-4 text-center rounded-xl border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xs font-bold">Tudo em dia!</p>
                  <p className="text-[10px] text-slate-400">Sem alertas pendentes no momento</p>
                </div>
              ) : (
                dashboardAlerts.map((alert) => {
                  const IconComp = alert.icon;
                  return (
                    <div
                      key={alert.id}
                      onClick={() => onNavigate(alert.tab)}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors cursor-pointer ${alert.cardBg} ${alert.borderColor}`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${alert.iconBg} ${alert.iconColor}`}>
                        <IconComp className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {alert.title}
                        </p>
                        <p className={`text-[10px] truncate whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {alert.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER BAR */}
      <footer className={`pt-2 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-2 ${
        isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            {settings?.name || 'TechNova Informática'} © {new Date().getFullYear()} | Sistema de Gestão
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${
            isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}>
            Versão 1.0.0
          </span>
        </div>

        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{settings?.slogan || 'Qualidade hoje, clientes sempre!'}</span>
          <span className="text-rose-500">❤️</span>
        </div>
      </footer>
    </div>
  );
};
