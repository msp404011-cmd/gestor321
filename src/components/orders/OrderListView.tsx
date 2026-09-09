import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Printer,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  Kanban as KanbanIcon,
  List,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Package,
  User,
  Smartphone,
  Laptop,
  ChevronDown,
  ChevronRight,
  Check,
  Calendar,
  Settings,
  Hourglass,
  Layers,
  Puzzle,
  X,
} from 'lucide-react';
import { ServiceOrder, OrderStatus } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  cleanPhoneForWhatsApp,
  getCanonicalStatus,
  CanonicalStatus,
} from '../../services/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useTheme } from '../../context/ThemeContext';
import { OrderDeliveryModal } from './OrderDeliveryModal';

interface OrderListViewProps {
  onOpenNewOrder: () => void;
  onEditOrder: (order: ServiceOrder) => void;
  onViewOrderDetail: (order: ServiceOrder) => void;
  onOpenPrint: (order: ServiceOrder) => void;
}

// Exactly the 7 requested statuses + TODAS option
type FilterPreset =
  | 'TODAS'
  | 'ORCAMENTO'
  | 'AGUARDANDO_AUTORIZACAO'
  | 'AUTORIZADO'
  | 'AGUARDANDO_PECA'
  | 'ATRASADO'
  | 'PRONTO'
  | 'ENTREGUE';

type PeriodFilter = 'TODOS' | 'HOJE' | 'SEMANA' | 'MES' | 'MES_ANTERIOR';

interface KanbanColumnDef {
  id: CanonicalStatus;
  title: string;
  count: number;
  totalAmount?: number;
  icon: React.ReactNode;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  columnBorder: string;
  columnGlow: string;
  badgeBg: string;
  targetStatus: OrderStatus;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  onOpenNewOrder,
  onEditOrder,
  onViewOrderDetail,
  onOpenPrint,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  
  // Default to 'TODAS' so the user immediately sees all service orders
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('TODAS');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('TODOS');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusMenuOpenForId, setStatusMenuOpenForId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(target)) {
        setIsPeriodDropdownOpen(false);
      }
      if (statusMenuOpenForId && !target.closest('.status-change-popover')) {
        setStatusMenuOpenForId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusMenuOpenForId]);

  // Drag and drop state for kanban
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [orderForDelivery, setOrderForDelivery] = useState<ServiceOrder | null>(null);
  const [orderForStatusChange, setOrderForStatusChange] = useState<ServiceOrder | null>(null);

  const orders = StorageService.getOrders();
  const currentUser = StorageService.getCurrentUser();

  // Helper to reliably compute the repair/service total of each OS
  const getOrderAmount = (o: ServiceOrder) => {
    if (typeof o.totalPrice === 'number' && !isNaN(o.totalPrice) && o.totalPrice > 0) {
      return o.totalPrice;
    }
    const labor = Number(o.laborPrice) || 0;
    const parts = Number(o.partsPrice) || 0;
    const discount = Number(o.discount) || 0;
    const calculated = labor + parts - discount;
    return calculated > 0 ? calculated : 0;
  };

  // Exact counts for the 7 requested status cards (no overlapping/mixing)
  const counts = {
    total: orders.length,
    orcamento: orders.filter((o) => getCanonicalStatus(o.status as string) === 'ORCAMENTO').length,
    aguardandoAutorizacao: orders.filter((o) => getCanonicalStatus(o.status as string) === 'AGUARDANDO_AUTORIZACAO').length,
    autorizado: orders.filter((o) => getCanonicalStatus(o.status as string) === 'AUTORIZADO').length,
    aguardandoPeca: orders.filter((o) => getCanonicalStatus(o.status as string) === 'AGUARDANDO_PECA').length,
    atrasado: orders.filter((o) => getCanonicalStatus(o.status as string) === 'ATRASADO').length,
    pronto: orders.filter((o) => getCanonicalStatus(o.status as string) === 'PRONTO').length,
    entregue: orders.filter((o) => getCanonicalStatus(o.status as string) === 'ENTREGUE').length,
  };

  // Sum of repair values (valor de conserto somado) for each status
  const sums = {
    total: orders.reduce((acc, o) => acc + getOrderAmount(o), 0),
    orcamento: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'ORCAMENTO')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    aguardandoAutorizacao: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'AGUARDANDO_AUTORIZACAO')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    autorizado: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'AUTORIZADO')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    aguardandoPeca: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'AGUARDANDO_PECA')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    atrasado: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'ATRASADO')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    pronto: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'PRONTO')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
    entregue: orders
      .filter((o) => getCanonicalStatus(o.status as string) === 'ENTREGUE')
      .reduce((acc, o) => acc + getOrderAmount(o), 0),
  };

  // Top Status Cards configuration (with 2 lines support and dedicated status colors + summed repair value)
  const statusCardsConfig = [
    {
      id: 'ORCAMENTO' as const,
      line1: 'Orçamento',
      line2: '',
      title: 'Orçamento',
      count: counts.orcamento,
      totalAmount: sums.orcamento,
      icon: <Clock className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#281c06] via-[#1a1204] to-[#0f0a02] border-amber-500/70 text-amber-300'
        : 'bg-gradient-to-br from-amber-50 to-white border-amber-300 text-amber-900',
      activeRing: 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-[1.02] border-amber-400',
      countColor: isDark ? 'text-amber-200' : 'text-amber-800',
      tagColor: isDark ? 'text-amber-400' : 'text-amber-600',
    },
    {
      id: 'AGUARDANDO_AUTORIZACAO' as const,
      line1: 'Aguardando',
      line2: 'Autorização',
      title: 'Aguardando Autorização',
      count: counts.aguardandoAutorizacao,
      totalAmount: sums.aguardandoAutorizacao,
      icon: <Hourglass className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#240c38] via-[#170724] to-[#0d0414] border-purple-500/70 text-purple-300'
        : 'bg-gradient-to-br from-purple-50 to-white border-purple-300 text-purple-900',
      activeRing: 'ring-2 ring-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02] border-purple-400',
      countColor: isDark ? 'text-purple-200' : 'text-purple-800',
      tagColor: isDark ? 'text-purple-400' : 'text-purple-600',
    },
    {
      id: 'AUTORIZADO' as const,
      line1: 'Autorizado',
      line2: '',
      title: 'Autorizado',
      count: counts.autorizado,
      totalAmount: sums.autorizado,
      icon: <Wrench className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#062633] via-[#041922] to-[#020e14] border-cyan-500/70 text-cyan-300'
        : 'bg-gradient-to-br from-cyan-50 to-white border-cyan-300 text-cyan-900',
      activeRing: 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.02] border-cyan-400',
      countColor: isDark ? 'text-cyan-200' : 'text-cyan-800',
      tagColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
    },
    {
      id: 'AGUARDANDO_PECA' as const,
      line1: 'Aguardando',
      line2: 'Peça',
      title: 'Aguardando Peça',
      count: counts.aguardandoPeca,
      totalAmount: sums.aguardandoPeca,
      icon: <Puzzle className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#2c1404] via-[#1c0c02] to-[#100701] border-orange-500/70 text-orange-300'
        : 'bg-gradient-to-br from-orange-50 to-white border-orange-300 text-orange-900',
      activeRing: 'ring-2 ring-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-[1.02] border-orange-400',
      countColor: isDark ? 'text-orange-200' : 'text-orange-800',
      tagColor: isDark ? 'text-orange-400' : 'text-orange-600',
    },
    {
      id: 'ATRASADO' as const,
      line1: 'Atrasado',
      line2: '',
      title: 'Atrasado',
      count: counts.atrasado,
      totalAmount: sums.atrasado,
      icon: <AlertTriangle className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#2d0912] via-[#1d050b] to-[#100206] border-rose-500/70 text-rose-300'
        : 'bg-gradient-to-br from-rose-50 to-white border-rose-300 text-rose-900',
      activeRing: 'ring-2 ring-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-[1.02] border-rose-400',
      countColor: isDark ? 'text-rose-200' : 'text-rose-800',
      tagColor: isDark ? 'text-rose-400' : 'text-rose-600',
    },
    {
      id: 'PRONTO' as const,
      line1: 'Pronto',
      line2: '',
      title: 'Pronto',
      count: counts.pronto,
      totalAmount: sums.pronto,
      icon: <CheckCircle2 className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#062916] via-[#041a0e] to-[#020f08] border-emerald-500/70 text-emerald-300'
        : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-300 text-emerald-900',
      activeRing: 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-[1.02] border-emerald-400',
      countColor: isDark ? 'text-emerald-200' : 'text-emerald-800',
      tagColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
    },
    {
      id: 'ENTREGUE' as const,
      line1: 'Entregue',
      line2: '',
      title: 'Entregue',
      count: counts.entregue,
      totalAmount: sums.entregue,
      icon: <Package className="w-4 h-4 text-white" />,
      iconBoxBg: 'bg-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.5)]',
      cardBg: isDark
        ? 'bg-gradient-to-br from-[#062927] via-[#041c1a] to-[#02100f] border-teal-500/70 text-teal-300'
        : 'bg-gradient-to-br from-teal-50 to-white border-teal-300 text-teal-900',
      activeRing: 'ring-2 ring-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.5)] scale-[1.02] border-teal-400',
      countColor: isDark ? 'text-teal-200' : 'text-teal-800',
      tagColor: isDark ? 'text-teal-400' : 'text-teal-600',
    },
  ];

  // Status badge style helper strictly based on the 7 canonical statuses
  const getStatusBadgeConfig = (rawStatus: string) => {
    const canonical = getCanonicalStatus(rawStatus);

    switch (canonical) {
      case 'ORCAMENTO':
        return {
          label: 'Orçamento',
          icon: <Clock className="w-3.5 h-3.5" />,
          bg: 'bg-amber-500 text-white border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
          dot: 'bg-amber-200',
        };
      case 'AGUARDANDO_AUTORIZACAO':
        return {
          label: 'Aguardando Autorização',
          icon: <Hourglass className="w-3.5 h-3.5" />,
          bg: 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
          dot: 'bg-purple-200',
        };
      case 'AUTORIZADO':
        return {
          label: 'Autorizado',
          icon: <Wrench className="w-3.5 h-3.5" />,
          bg: 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
          dot: 'bg-cyan-200',
        };
      case 'AGUARDANDO_PECA':
        return {
          label: 'Aguardando Peça',
          icon: <Puzzle className="w-3.5 h-3.5" />,
          bg: 'bg-orange-500 text-white border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
          dot: 'bg-orange-200',
        };
      case 'ATRASADO':
        return {
          label: 'Atrasado',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          bg: 'bg-rose-600 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
          dot: 'bg-rose-200',
        };
      case 'PRONTO':
        return {
          label: 'Pronto',
          icon: <Check className="w-3.5 h-3.5" />,
          bg: 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
          dot: 'bg-emerald-200',
        };
      case 'ENTREGUE':
        return {
          label: 'Entregue',
          icon: <Package className="w-3.5 h-3.5" />,
          bg: 'bg-teal-600 text-white border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.4)]',
          dot: 'bg-teal-200',
        };
      default:
        return {
          label: 'Orçamento',
          icon: <Clock className="w-3.5 h-3.5" />,
          bg: 'bg-amber-500 text-white border-amber-300',
          dot: 'bg-amber-200',
        };
    }
  };

  // Status Change handler
  const handleUpdateOrderStatus = (order: ServiceOrder, newStatus: OrderStatus) => {
    setStatusMenuOpenForId(null);
    if (newStatus === 'ENTREGUE' && order.paymentStatus !== 'PAGO') {
      setOrderForDelivery(order);
      return;
    }

    const updated: ServiceOrder = {
      ...order,
      status: newStatus,
      deliveredAt: newStatus === 'ENTREGUE' && !order.deliveredAt ? new Date().toISOString() : order.deliveredAt,
      statusHistory: [
        ...(order.statusHistory || []),
        {
          status: newStatus,
          changedAt: new Date().toISOString(),
          changedBy: currentUser?.name || 'Administrador',
          notes: `Status alterado para ${getOrderStatusLabel(newStatus)}.`,
        },
      ],
    };
    StorageService.saveOrder(updated);
  };

  // Drag and Drop Handlers for Kanban mode
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, columnDef: KanbanColumnDef) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    setDraggedOrderId(null);
    setDragOverColumnId(null);

    if (!orderId) return;
    const currentOrders = StorageService.getOrders();
    const order = currentOrders.find((o) => o.id === orderId);
    if (!order) return;

    if (getCanonicalStatus(order.status as string) !== columnDef.targetStatus) {
      handleUpdateOrderStatus(order, columnDef.targetStatus);
    }
  };

  // Global Search results across ALL statuses and tabs
  const allMatchingOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return orders.filter((o) => {
      return (
        o.orderNumber.toString().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        (o.imei && o.imei.toLowerCase().includes(q)) ||
        (o.serialNumber && o.serialNumber.toLowerCase().includes(q)) ||
        o.clientDefect.toLowerCase().includes(q) ||
        (o.technicalDiagnosis && o.technicalDiagnosis.toLowerCase().includes(q)) ||
        (o.requestedService && o.requestedService.toLowerCase().includes(q)) ||
        (o.items && o.items.some((it) => it.name.toLowerCase().includes(q)))
      );
    });
  }, [orders, search]);

  // Breakdown of matching orders per status tab
  const matchesByStatus = useMemo(() => {
    const map: Record<CanonicalStatus, ServiceOrder[]> = {
      ORCAMENTO: [],
      AGUARDANDO_AUTORIZACAO: [],
      AUTORIZADO: [],
      AGUARDANDO_PECA: [],
      ATRASADO: [],
      PRONTO: [],
      ENTREGUE: [],
    };
    allMatchingOrders.forEach((o) => {
      const canonical = getCanonicalStatus(o.status as string);
      if (map[canonical]) {
        map[canonical].push(o);
      }
    });
    return map;
  }, [allMatchingOrders]);

  // Filtered orders strictly based on selected preset (no mixing, 100% accurate)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const canonical = getCanonicalStatus(o.status as string);

      // 1. Status Filter: strictly compare canonical status
      if (filterPreset !== 'TODAS' && canonical !== filterPreset) {
        return false;
      }

      // 2. Period Filter
      if (periodFilter !== 'TODOS') {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (periodFilter === 'HOJE') {
          if (orderDate < today) return false;
        } else if (periodFilter === 'SEMANA') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (orderDate < weekAgo) return false;
        } else if (periodFilter === 'MES') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (orderDate < monthAgo) return false;
        }
      }

      // 3. Search Query
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        o.orderNumber.toString().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        (o.imei && o.imei.toLowerCase().includes(q)) ||
        (o.serialNumber && o.serialNumber.toLowerCase().includes(q)) ||
        o.clientDefect.toLowerCase().includes(q) ||
        (o.technicalDiagnosis && o.technicalDiagnosis.toLowerCase().includes(q)) ||
        (o.requestedService && o.requestedService.toLowerCase().includes(q)) ||
        (o.items && o.items.some((it) => it.name.toLowerCase().includes(q)))
      );
    });
  }, [orders, filterPreset, periodFilter, search]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPreset, periodFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleSelectSearchOrder = (order: ServiceOrder) => {
    const canonical = getCanonicalStatus(order.status as string);
    setFilterPreset(canonical as FilterPreset);
    setHighlightedOrderId(order.id);
    setIsSearchFocused(false);

    // Smooth scroll to the order in view
    setTimeout(() => {
      const row = document.getElementById(`order-row-${order.id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // Reset highlight after 4.5s
    setTimeout(() => {
      setHighlightedOrderId(null);
    }, 4500);
  };

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      StorageService.deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const hasActiveFilters = search.trim() !== '' || filterPreset !== 'TODAS' || periodFilter !== 'TODOS';

  const clearFilters = () => {
    setSearch('');
    setFilterPreset('TODAS');
    setPeriodFilter('TODOS');
    setCurrentPage(1);
    setIsSearchFocused(false);
    setIsPeriodDropdownOpen(false);
    setHighlightedOrderId(null);
    setStatusMenuOpenForId(null);
  };

  // Exactly the 7 requested columns in Kanban view
  const kanbanColumns: KanbanColumnDef[] = [
    {
      id: 'ORCAMENTO',
      title: 'Orçamento',
      count: counts.orcamento,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      headerBg: 'bg-amber-950/60',
      headerBorder: 'border-amber-500/70',
      headerText: 'text-amber-300',
      columnBorder: 'border-amber-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      badgeBg: 'bg-amber-900/80 text-amber-200 border-amber-500',
      targetStatus: 'ORCAMENTO',
    },
    {
      id: 'AGUARDANDO_AUTORIZACAO',
      title: 'Aguardando Autorização',
      count: counts.aguardandoAutorizacao,
      icon: <Hourglass className="w-4 h-4 text-purple-400" />,
      headerBg: 'bg-purple-950/60',
      headerBorder: 'border-purple-500/70',
      headerText: 'text-purple-300',
      columnBorder: 'border-purple-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      badgeBg: 'bg-purple-900/80 text-purple-200 border-purple-500',
      targetStatus: 'AGUARDANDO_AUTORIZACAO',
    },
    {
      id: 'AUTORIZADO',
      title: 'Autorizado',
      count: counts.autorizado,
      icon: <Wrench className="w-4 h-4 text-cyan-400" />,
      headerBg: 'bg-cyan-950/60',
      headerBorder: 'border-cyan-500/70',
      headerText: 'text-cyan-300',
      columnBorder: 'border-cyan-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]',
      badgeBg: 'bg-cyan-900/80 text-cyan-200 border-cyan-500',
      targetStatus: 'AUTORIZADO',
    },
    {
      id: 'AGUARDANDO_PECA',
      title: 'Aguardando Peça',
      count: counts.aguardandoPeca,
      icon: <Puzzle className="w-4 h-4 text-orange-400" />,
      headerBg: 'bg-orange-950/60',
      headerBorder: 'border-orange-500/70',
      headerText: 'text-orange-300',
      columnBorder: 'border-orange-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.25)]',
      badgeBg: 'bg-orange-900/80 text-orange-200 border-orange-500',
      targetStatus: 'AGUARDANDO_PECA',
    },
    {
      id: 'ATRASADO',
      title: 'Atrasado',
      count: counts.atrasado,
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      headerBg: 'bg-rose-950/60',
      headerBorder: 'border-rose-500/70',
      headerText: 'text-rose-300',
      columnBorder: 'border-rose-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      badgeBg: 'bg-rose-900/80 text-rose-200 border-rose-500',
      targetStatus: 'ATRASADO',
    },
    {
      id: 'PRONTO',
      title: 'Pronto',
      count: counts.pronto,
      icon: <Check className="w-4 h-4 text-emerald-400" />,
      headerBg: 'bg-emerald-950/60',
      headerBorder: 'border-emerald-500/70',
      headerText: 'text-emerald-300',
      columnBorder: 'border-emerald-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      badgeBg: 'bg-emerald-900/80 text-emerald-200 border-emerald-500',
      targetStatus: 'PRONTO',
    },
    {
      id: 'ENTREGUE',
      title: 'Entregue',
      count: counts.entregue,
      icon: <Package className="w-4 h-4 text-teal-400" />,
      headerBg: 'bg-teal-950/60',
      headerBorder: 'border-teal-500/70',
      headerText: 'text-teal-300',
      columnBorder: 'border-teal-500/50',
      columnGlow: 'shadow-[0_0_15px_rgba(20,184,166,0.25)]',
      badgeBg: 'bg-teal-900/80 text-teal-200 border-teal-500',
      targetStatus: 'ENTREGUE',
    },
  ];

  // Helper for device image
  const getDeviceThumbnail = (os: ServiceOrder) => {
    if (os.photosBefore && os.photosBefore.length > 0) {
      return os.photosBefore[0];
    }
    const modelLower = (os.model || '').toLowerCase();
    const brandLower = (os.brand || '').toLowerCase();

    if (os.deviceType === 'Notebook' || modelLower.includes('dell') || modelLower.includes('inspiron') || modelLower.includes('notebook') || modelLower.includes('laptop')) {
      return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80';
    }
    if (modelLower.includes('redmi') || brandLower.includes('xiaomi')) {
      return 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&auto=format&fit=crop&q=80';
    }
    if (modelLower.includes('iphone 13') || modelLower.includes('iphone 14') || modelLower.includes('iphone 15')) {
      return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&auto=format&fit=crop&q=80';
    }
    if (modelLower.includes('iphone') || brandLower.includes('apple')) {
      return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=200&auto=format&fit=crop&q=80';
  };

  // Helper for customer avatar color
  const getAvatarBg = (name: string) => {
    const char = (name[0] || 'A').toUpperCase();
    if (['C', 'D', 'E', 'M'].includes(char)) return 'bg-rose-600 text-white';
    if (['B', 'F', 'G', 'L'].includes(char)) return 'bg-blue-600 text-white';
    if (['R', 'S', 'T', 'V'].includes(char)) return 'bg-indigo-600 text-white';
    return 'bg-cyan-600 text-white';
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* 1. TOP HEADER BAR: Icon + Title + Nova OS button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ordens de Serviço
            </h1>
            <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Acompanhe e gerencie todas as ordens de serviço da sua assistência.
            </p>
          </div>
        </div>

        {/* Right: + Nova OS Button & Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* View Mode Switcher */}
          <div
            className={`flex items-center p-0.5 sm:p-1 rounded-xl border ${
              isDark ? 'bg-[#0b1329] border-slate-700/80' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Kanban"
            >
              <KanbanIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewOrder}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nova OS</span>
          </button>
        </div>
      </div>

      {/* 2. TOP STATUS CARDS (The 7 requested statuses with clear 2-line title support and dedicated status colors) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
        {statusCardsConfig.map((card) => {
          const isActive = filterPreset === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setFilterPreset(filterPreset === card.id ? 'TODAS' : (card.id as FilterPreset))}
              className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[92px] sm:min-h-[102px] ${
                card.cardBg
              } ${isActive ? card.activeRing : 'hover:scale-[1.01]'}`}
            >
              {/* Top: Title (in 2 lines if needed) + Status Color Icon Box */}
              <div className="flex items-start justify-between gap-1.5 w-full">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] sm:text-xs font-bold block leading-tight">
                    {card.line1}
                  </span>
                  {card.line2 && (
                    <span className="text-[10px] sm:text-[11px] font-bold block leading-tight opacity-90">
                      {card.line2}
                    </span>
                  )}
                </div>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${card.iconBoxBg}`}>
                  {card.icon}
                </div>
              </div>

              {/* Bottom: Big Count + OS Label + Valor de Conserto Somado */}
              <div className="mt-1 sm:mt-1.5 pt-1 sm:pt-1.5 border-t border-current/15">
                <div className="flex items-baseline gap-1">
                  <span className={`text-base sm:text-lg font-black leading-none ${card.countColor}`}>
                    {card.count}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase ${card.tagColor}`}>
                    OS
                  </span>
                </div>
                <div className="mt-1 pt-0.5 border-t border-current/10 flex items-center justify-between gap-1" title={`Valor Total dos Consertos neste status: ${formatCurrency(card.totalAmount)}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Conserto:</span>
                  <span className={`text-[11px] sm:text-xs font-black font-mono tracking-tight block truncate ${card.countColor}`}>
                    {formatCurrency(card.totalAmount)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & PERIOD FILTER CONTROLS BAR */}
      <div className="relative" ref={searchBoxRef}>
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 ${
            isDark ? 'bg-[#090f20] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Search Input with Instant Cross-Tab Dropdown */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Buscar cliente, nº da OS, aparelho ou defeito em todas as abas..."
              className={`w-full pl-9 sm:pl-10 pr-24 sm:pr-28 py-2 rounded-lg text-xs border transition-colors outline-hidden ${
                isDark
                  ? 'bg-[#0d162d] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
              }`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setIsSearchFocused(false);
                }}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer flex items-center gap-1 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                Todas as Abas
              </span>
            )}
          </div>

          {/* Right filters: Todas as OS + Período + Limpar */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Todas as OS Quick Button */}
            <button
              type="button"
              onClick={() => setFilterPreset('TODAS')}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                filterPreset === 'TODAS'
                  ? 'bg-blue-600 text-white border-blue-500 font-bold'
                  : isDark
                  ? 'bg-[#0d162d] border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas ({counts.total}) • {formatCurrency(sums.total)}</span>
            </button>

            {/* Período Selector */}
            <div className="relative flex-1 sm:flex-none" ref={periodDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-lg border text-left flex items-center justify-between sm:justify-start gap-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0d162d] border-slate-700 hover:border-slate-600 text-slate-200'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 block leading-tight font-semibold">
                      Período
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold leading-tight">
                      {periodFilter === 'TODOS'
                        ? 'Todos'
                        : periodFilter === 'HOJE'
                        ? 'Hoje'
                        : periodFilter === 'SEMANA'
                        ? 'Esta Semana'
                        : 'Este Mês'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {isPeriodDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-30 p-1 animate-in fade-in ${
                    isDark ? 'bg-[#0d162d] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {[
                    { id: 'TODOS', label: 'Todos os períodos' },
                    { id: 'HOJE', label: 'Hoje' },
                    { id: 'SEMANA', label: 'Esta Semana' },
                    { id: 'MES', label: 'Este Mês' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPeriodFilter(p.id as PeriodFilter);
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                        periodFilter === p.id
                          ? 'bg-blue-600 text-white font-bold'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{p.label}</span>
                      {periodFilter === p.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Limpar Filtros Button */}
            <button
              type="button"
              onClick={clearFilters}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                hasActiveFilters
                  ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : isDark
                  ? 'bg-[#0d162d] border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              }`}
              title="Limpar todos os filtros de busca, status e período"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* FLOATING INSTANT SEARCH DROPDOWN (Searches across ALL tabs/statuses & clicks go directly to status) */}
        {isSearchFocused && search.trim() !== '' && (
          <div
            className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-50 p-2 max-h-[380px] overflow-y-auto ${
              isDark ? 'bg-[#090f23] border-blue-500/60 text-white shadow-[0_10px_35px_rgba(0,0,0,0.8)]' : 'bg-white border-blue-400 text-slate-900 shadow-xl'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-blue-400">
                  Busca Global em Todas as Abas
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  {allMatchingOrders.length} encontrada(s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchFocused(false)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {allMatchingOrders.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum cliente ou OS encontrada com "<strong>{search}</strong>" em nenhuma das abas.
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-400 px-2">
                  Clique em qualquer resultado abaixo para <strong>ir direto para a aba de status</strong> onde a OS se encontra:
                </p>
                {allMatchingOrders.map((order) => {
                  const badge = getStatusBadgeConfig(order.status as string);
                  const canonical = getCanonicalStatus(order.status as string);
                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectSearchOrder(order)}
                      className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all ${
                        isDark
                          ? 'bg-[#0d162d] border-slate-700/80 hover:border-blue-400 hover:bg-blue-950/40'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {/* Left: Customer + Equipment + Defect */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-blue-400">
                            OS #{order.orderNumber}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {order.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.customerPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                          <span className="font-medium text-slate-400">
                            {order.brand} {order.model}
                          </span>
                          {order.clientDefect && (
                            <span className="text-slate-400 truncate max-w-[260px]">
                              • {order.clientDefect}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Status Badge & Jump Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSearchOrder(order);
                          }}
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Ir p/ Status</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3.1 GLOBAL SEARCH CROSS-TAB SUMMARY BANNER (Quick 1-click status jumps) */}
      {search.trim() !== '' && (
        <div
          className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 animate-in fade-in ${
            isDark ? 'bg-[#081226] border-blue-500/50 text-slate-200' : 'bg-blue-50/80 border-blue-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold">
                Busca por "{search}": {allMatchingOrders.length} resultado(s) no total.
              </span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-1">
                Clique nos botões para ir direto ao status da OS:
              </span>
            </div>
          </div>

          {/* Quick Status Pills with Results */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusCardsConfig.map((card) => {
              const countInStatus = matchesByStatus[card.id]?.length || 0;
              if (countInStatus === 0) return null;
              const isActive = filterPreset === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setFilterPreset(card.id as FilterPreset)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50'
                      : isDark
                      ? 'bg-[#0d162d] border-slate-700 text-slate-300 hover:border-slate-500'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{card.title}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-[10px] font-extrabold text-blue-200">
                    {countInStatus}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setFilterPreset('TODAS')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                filterPreset === 'TODAS'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : isDark
                  ? 'bg-[#0d162d] border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Ver Todas ({allMatchingOrders.length})
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN OS DATA (100% visible on all screens without horizontal scroll) */}
      {viewMode === 'table' ? (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-[#080d1a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* DESKTOP & TABLET VIEW (Zero horizontal scrolling, fluid layout) */}
          <div className="hidden md:block w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className={isDark ? 'bg-[#040711] text-slate-400 border-b-2 border-slate-800' : 'bg-slate-100 text-slate-700 border-b-2 border-slate-200'}>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[10%]">OS</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[18%]">CLIENTE</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[20%]">APARELHO / IMEI</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[24%]">DEFEITO & SERVIÇO</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[14%]">STATUS</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider w-[8%]">VALOR</th>
                  <th className="py-2.5 px-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider text-right w-[6%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 dark:divide-slate-700/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p>
                          Nenhuma ordem de serviço encontrada com os filtros ativos{' '}
                          {filterPreset !== 'TODAS' && (
                            <>
                              (Status: <strong>{getOrderStatusLabel(filterPreset as OrderStatus)}</strong>)
                            </>
                          )}
                          {search && (
                            <>
                              {' '}e busca "<strong>{search}</strong>"
                            </>
                          )}.
                        </p>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Limpar Filtros e Ver Todas ({counts.total})</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((os, index) => {
                    const badge = getStatusBadgeConfig(os.status as string);
                    const cleanPhone = cleanPhoneForWhatsApp(os.customerPhone);
                    const waLink = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Olá ${os.customerName}, sua OS #${os.orderNumber} (${os.brand} ${os.model}) está com status: ${getOrderStatusLabel(
                            os.status
                          )}. Valor: ${formatCurrency(os.totalPrice)}.`
                        )}`
                      : null;

                    const thumb = getDeviceThumbnail(os);
                    const avatarColor = getAvatarBg(os.customerName);
                    const isMenuOpen = statusMenuOpenForId === os.id;

                    // Alternating Dark / Light Zebra Striping
                    const isEven = index % 2 === 0;
                    const rowBg = isDark
                      ? isEven
                        ? 'bg-[#081024]' // Slightly deeper navy
                        : 'bg-[#0e1b38]' // Distinctly lighter navy
                      : isEven
                      ? 'bg-slate-50'
                      : 'bg-white';

                    const isHighlighted = highlightedOrderId === os.id;
                    const highlightClass = isHighlighted
                      ? 'ring-2 ring-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all animate-pulse'
                      : '';

                    return (
                      <tr
                        key={os.id}
                        id={`order-row-${os.id}`}
                        onClick={() => onViewOrderDetail(os)}
                        className={`transition-colors cursor-pointer border-b border-slate-700/50 hover:bg-blue-600/20 group ${rowBg} ${highlightClass}`}
                      >
                        {/* 1. OS NUMBER & DATE */}
                        <td className="py-2.5 px-3 align-middle">
                          <span
                            className={`font-black text-xs lg:text-sm block ${
                              badge.label === 'Pronto' || badge.label === 'Entregue'
                                ? 'text-emerald-400'
                                : badge.label === 'Atrasado'
                                ? 'text-rose-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            #{os.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap">
                            {formatDate(os.createdAt)}
                          </span>
                        </td>

                        {/* 2. CLIENTE (Avatar + Name + Phone) */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarColor}`}>
                              {os.customerName ? os.customerName[0].toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0 pr-1">
                              <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`} title={os.customerName}>
                                {os.customerName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {os.customerPhone}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. APARELHO / IMEI (Thumbnail + Model + IMEI) */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <img
                              src={thumb}
                              alt={os.model}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                            />
                            <div className="min-w-0 pr-1">
                              <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`} title={`${os.brand} ${os.model}`}>
                                {os.brand} {os.model}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                                {os.imei ? `IMEI: ${os.imei}` : os.serialNumber ? `S/N: ${os.serialNumber}` : 'Sem IMEI'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 4. DEFEITO & SERVIÇO A SER FEITO (Both fully visible in 2 clean lines) */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`} title={os.clientDefect || 'Problema não especificado'}>
                              <span className="text-[10px] font-bold uppercase text-amber-500/90 dark:text-amber-400/90 mr-1">Defeito:</span>
                              {os.clientDefect || 'Não especificado'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={os.requestedService || os.performedService || 'Em análise'}>
                              <span className="text-[9px] font-bold uppercase text-cyan-500/90 dark:text-cyan-400/90 mr-1">Serviço:</span>
                              {os.requestedService || os.performedService || 'Em análise técnica'}
                            </p>
                          </div>
                        </td>

                        {/* 5. STATUS (Clickable pill opening Quick Status Dialog) */}
                        <td className="py-2.5 px-3 align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderForStatusChange(os);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] lg:text-[11px] font-bold border transition-all cursor-pointer shadow-xs whitespace-nowrap hover:scale-105 active:scale-95 ${badge.bg}`}
                            title="Clique para mudar o status da OS"
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </button>
                        </td>

                        {/* 6. VALOR */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className={`font-black text-xs lg:text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatCurrency(os.totalPrice)}
                          </span>
                        </td>

                        {/* 7. ACTIONS / CHEVRON */}
                        <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPrint(os);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Imprimir OS"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToDelete(os);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Excluir OS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewOrderDetail(os);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST CARDS (100% visible on small mobile screens without sideways scroll) */}
          <div className="block md:hidden divide-y divide-slate-800">
            {filteredOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs px-4 flex flex-col items-center justify-center gap-3">
                <p>Nenhuma ordem de serviço encontrada para este filtro.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Limpar Filtros e Ver Todas</span>
                </button>
              </div>
            ) : (
              paginatedOrders.map((os, index) => {
                const badge = getStatusBadgeConfig(os.status as string);
                const cleanPhone = cleanPhoneForWhatsApp(os.customerPhone);
                const waLink = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Olá ${os.customerName}, sua OS #${os.orderNumber} (${os.brand} ${os.model}) está com status: ${getOrderStatusLabel(
                        os.status
                      )}. Valor: ${formatCurrency(os.totalPrice)}.`
                    )}`
                  : null;

                const isEven = index % 2 === 0;
                const rowBg = isDark
                  ? isEven
                    ? 'bg-[#081024]'
                    : 'bg-[#0e1b38]'
                  : isEven
                  ? 'bg-slate-50'
                  : 'bg-white';

                const isHighlighted = highlightedOrderId === os.id;
                const highlightClass = isHighlighted
                  ? 'ring-2 ring-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse'
                  : '';

                return (
                  <div
                    key={os.id}
                    id={`order-row-${os.id}`}
                    onClick={() => onViewOrderDetail(os)}
                    className={`p-3.5 transition-colors cursor-pointer ${rowBg} ${highlightClass}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-cyan-400">#{os.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(os.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderForStatusChange(os);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${badge.bg}`}
                        title="Clique para mudar o status da OS"
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                        <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{os.customerName}</p>
                        <p className="text-[10px] text-slate-400">{os.customerPhone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Aparelho</span>
                        <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{os.brand} {os.model}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{os.imei ? `IMEI: ${os.imei}` : os.serialNumber ? `S/N: ${os.serialNumber}` : 'Sem IMEI'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-2 rounded-lg text-xs mb-2.5">
                      <p className="text-slate-300 line-clamp-1">
                        <strong className="text-amber-400 text-[10px] uppercase">Defeito:</strong> {os.clientDefect || 'Não especificado'}
                      </p>
                      <p className="text-slate-400 line-clamp-1 mt-0.5">
                        <strong className="text-cyan-400 text-[10px] uppercase">Serviço:</strong> {os.requestedService || os.performedService || 'Em análise'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Valor:</span>
                        <span className="font-black text-sm text-emerald-400">{formatCurrency(os.totalPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrint(os);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToDelete(os);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer / Pagination */}
          <div
            className={`px-3 sm:px-4 py-2.5 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-[11px] sm:text-xs ${
              isDark ? 'bg-[#040711] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              Mostrando <strong>{filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> a <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> de <strong>{filteredOrders.length}</strong> registros
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-bold transition-colors"
                title="Página anterior"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                const isCurrent = num === currentPage;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isDark
                        ? 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-bold transition-colors"
                title="Próxima página"
              >
                &gt;
              </button>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`ml-2 border rounded-lg px-2 py-1 font-bold text-[11px] focus:outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="5">5 por pág.</option>
                <option value="10">10 por pág.</option>
                <option value="20">20 por pág.</option>
                <option value="50">50 por pág.</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* 5. KANBAN BOARD VIEW (Exact 7 columns matching the requested statuses) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-3.5 items-start">
          {kanbanColumns.map((col) => {
            const columnOrders = filteredOrders.filter(
              (os) => getCanonicalStatus(os.status as string) === col.id
            );

            const isOver = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragEnd}
                onDrop={(e) => handleDrop(e, col)}
                className={`flex flex-col rounded-2xl border transition-all duration-150 ${
                  isDark ? 'bg-[#080d1a]/95' : 'bg-slate-50/95'
                } ${col.columnBorder} ${isOver ? 'ring-2 ring-blue-500 scale-[1.01]' : ''}`}
              >
                {/* Column Header */}
                <div
                  className={`p-2.5 sm:p-3 rounded-t-2xl border-b flex items-center justify-between ${col.headerBg} ${col.headerBorder}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {col.icon}
                    <h3 className={`font-bold text-xs truncate ${col.headerText}`}>{col.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] sm:text-[11px] font-mono font-black text-white/90" title="Total somado das OS">
                      {formatCurrency(columnOrders.reduce((acc, os) => acc + getOrderAmount(os), 0))}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${col.badgeBg}`}>
                      {columnOrders.length}
                    </span>
                  </div>
                </div>

                {/* Orders Cards Container */}
                <div className="p-2.5 space-y-2.5 min-h-[300px]">
                  {columnOrders.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 italic">
                      Nenhuma OS nesta etapa
                    </div>
                  ) : (
                    columnOrders.map((os) => {
                      const badge = getStatusBadgeConfig(os.status as string);
                      const thumb = getDeviceThumbnail(os);
                      const isMenuOpen = statusMenuOpenForId === os.id;

                      const isHighlighted = highlightedOrderId === os.id;
                      const highlightClass = isHighlighted
                        ? 'ring-2 ring-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse'
                        : '';

                      return (
                        <div
                          key={os.id}
                          id={`order-row-${os.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, os.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onViewOrderDetail(os)}
                          className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm relative ${
                            isDark
                              ? 'bg-[#0d162d] border-slate-700/80 hover:border-slate-500'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          } ${highlightClass}`}
                        >
                          {/* Card Top: Number + Date */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-cyan-400">
                              #{os.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(os.createdAt)}
                            </span>
                          </div>

                          {/* Customer */}
                          <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {os.customerName}
                          </p>
                          <p className="text-[10px] text-slate-400 mb-2">
                            {os.customerPhone}
                          </p>

                          {/* Device with photo */}
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-slate-800 mb-2">
                            <img
                              src={thumb}
                              alt={os.model}
                              className="w-6 h-6 rounded-md object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {os.brand} {os.model}
                              </p>
                            </div>
                          </div>

                          {/* Defect */}
                          <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
                            <strong className="text-slate-400">Defeito:</strong> {os.clientDefect || 'Não especificado'}
                          </p>

                          {/* Price & Status */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1.5">
                            <span className="text-xs font-bold text-emerald-400">
                              {formatCurrency(os.totalPrice)}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Status pill button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderForStatusChange(os);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${badge.bg}`}
                                title="Clique para mudar o status"
                              >
                                {badge.label}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToDelete(os);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Excluir OS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Status Change Dialog Modal (Unclipped, Accessible & Centered) */}
      {orderForStatusChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
          onClick={() => setOrderForStatusChange(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border space-y-4 cursor-default animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0a1426] border-slate-700 text-white shadow-[0_0_35px_rgba(6,182,212,0.25)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b pb-3.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  #{orderForStatusChange.orderNumber}
                </div>
                <div>
                  <h3 className={`font-bold text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Alterar Status da OS
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {orderForStatusChange.customerName} • {orderForStatusChange.brand} {orderForStatusChange.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderForStatusChange(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Selecione o novo status:
              </div>
              {[
                {
                  status: 'ORCAMENTO',
                  label: 'Em Orçamento',
                  desc: 'Aparelho em diagnóstico e montagem do orçamento inicial',
                  icon: <Clock className="w-4 h-4 text-amber-400" />,
                  borderClass: 'hover:border-amber-500/80',
                  activeClass: 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40',
                },
                {
                  status: 'AGUARDANDO_AUTORIZACAO',
                  label: 'Aguardando Autorização',
                  desc: 'Orçamento repassado, aguardando aprovação do cliente',
                  icon: <Hourglass className="w-4 h-4 text-purple-400" />,
                  borderClass: 'hover:border-purple-500/80',
                  activeClass: 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/40',
                },
                {
                  status: 'AUTORIZADO',
                  label: 'Autorizado (Em Manutenção)',
                  desc: 'Serviço aprovado, técnico realizando o reparo na bancada',
                  icon: <Wrench className="w-4 h-4 text-cyan-400" />,
                  borderClass: 'hover:border-cyan-500/80',
                  activeClass: 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/40',
                },
                {
                  status: 'AGUARDANDO_PECA',
                  label: 'Aguardando Peça',
                  desc: 'Reparo pausado aguardando fornecedor/chegada de peças',
                  icon: <Puzzle className="w-4 h-4 text-orange-400" />,
                  borderClass: 'hover:border-orange-500/80',
                  activeClass: 'bg-orange-500/20 border-orange-500 text-orange-300 ring-2 ring-orange-500/40',
                },
                {
                  status: 'ATRASADO',
                  label: 'Atrasado',
                  desc: 'Prazo estourado ou imprevisto técnico na bancada',
                  icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
                  borderClass: 'hover:border-rose-500/80',
                  activeClass: 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/40',
                },
                {
                  status: 'PRONTO',
                  label: 'Pronto para Retirada',
                  desc: 'Serviço concluído e testado, pronto para o cliente retirar',
                  icon: <Check className="w-4 h-4 text-emerald-400" />,
                  borderClass: 'hover:border-emerald-500/80',
                  activeClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40',
                },
                {
                  status: 'ENTREGUE',
                  label: 'Entregue / Concluído',
                  desc: 'Aparelho entregue ao cliente (baixa financeira à vista ou a prazo)',
                  icon: <Package className="w-4 h-4 text-teal-400" />,
                  borderClass: 'hover:border-teal-500/80',
                  activeClass: 'bg-teal-500/20 border-teal-500 text-teal-300 ring-2 ring-teal-500/40',
                },
              ].map((item) => {
                const isCurrent = getCanonicalStatus(orderForStatusChange.status as string) === item.status;
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => {
                      const targetOrder = orderForStatusChange;
                      setOrderForStatusChange(null);
                      handleUpdateOrderStatus(targetOrder, item.status as OrderStatus);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? item.activeClass
                        : isDark
                        ? `bg-[#070f1e] border-slate-800 text-slate-200 hover:bg-[#0d1c38] ${item.borderClass}`
                        : `bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 ${item.borderClass}`
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-black/20 shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate">{item.label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                  </button>
                );
              })}
            </div>

            <div className={`pt-3 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setOrderForStatusChange(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Delivery & Payment Modal (Supports Cash & A Prazo / Fiado) */}
      <OrderDeliveryModal
        isOpen={!!orderForDelivery}
        order={orderForDelivery}
        onClose={() => setOrderForDelivery(null)}
        onSuccess={() => setOrderForDelivery(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!orderToDelete}
        title="Excluir Ordem de Serviço"
        message={`Deseja realmente excluir a OS #${orderToDelete?.orderNumber} do cliente "${orderToDelete?.customerName}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir OS"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onClose={() => setOrderToDelete(null)}
      />
    </div>
  );
};
