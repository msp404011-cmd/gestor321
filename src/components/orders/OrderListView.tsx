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
  ChevronLeft,
  Check,
  Calendar,
  Settings,
  Hourglass,
  Layers,
  Puzzle,
  X,
  Box,
  Archive,
  MapPin,
  LayoutGrid,
  Copy,
} from 'lucide-react';
import { ServiceOrder, OrderStatus, CustomOSStatusItem, OrderPartItem } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  cleanPhoneForWhatsApp,
  getCanonicalStatus,
  getOrderStatusBadgeClasses,
  CanonicalStatus,
} from '../../services/formatters';
import { ConfirmDialog } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { OrderDeliveryModal } from './OrderDeliveryModal';

interface OrderListViewProps {
  onOpenNewOrder: () => void;
  onEditOrder: (order: ServiceOrder) => void;
  onViewOrderDetail: (order: ServiceOrder) => void;
  onOpenPrint: (order: ServiceOrder, mode?: 'entrance' | 'internal' | 'receipt' | 'eulis') => void;
}

type FilterPreset = string;

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
  const [viewMode, setViewMode] = useState<'blocks' | 'table' | 'kanban'>('blocks');
  const [statusMenuOpenForId, setStatusMenuOpenForId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [sendModalOrder, setSendModalOrder] = useState<ServiceOrder | null>(null);
  const [sendModalMode, setSendModalMode] = useState<'BOTH' | 'PREMIUM' | 'FIRST_LINE'>('BOTH');

  // Top Status Cards Edge-Hover Auto-Scroll & Wheel Refs and States
  const statusContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftStatus, setCanScrollLeftStatus] = useState(false);
  const [canScrollRightStatus, setCanScrollRightStatus] = useState(false);
  const scrollAnimFrameRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);

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
  const [orderForArchiveLocation, setOrderForArchiveLocation] = useState<ServiceOrder | null>(null);
  const [archiveLocationInput, setArchiveLocationInput] = useState('');
  const [archivePromisedDate, setArchivePromisedDate] = useState('');
  const [archivePromisedNotes, setArchivePromisedNotes] = useState('');
  const [hasPromisedDate, setHasPromisedDate] = useState(false);
  const [customOSStatuses, setCustomOSStatuses] = useState<CustomOSStatusItem[]>(() => StorageService.getCustomOSStatuses());
  const [orders, setOrders] = useState<ServiceOrder[]>(() => StorageService.getOrders());

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCustomOSStatuses(StorageService.getCustomOSStatuses());
      setOrders(StorageService.getOrders());
    });
    return unsub;
  }, []);

  // Helper to check if status cards container has overflow on left or right
  const checkStatusScrollPosition = () => {
    const el = statusContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeftStatus(scrollLeft > 2);
    setCanScrollRightStatus(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    checkStatusScrollPosition();
    const el = statusContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkStatusScrollPosition);
      window.addEventListener('resize', checkStatusScrollPosition);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkStatusScrollPosition);
      window.removeEventListener('resize', checkStatusScrollPosition);
    };
  }, [orders, customOSStatuses]);

  // Horizontal wheel scroll listener for status cards
  useEffect(() => {
    const el = statusContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
        checkStatusScrollPosition();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Edge-hover continuous auto-scroll loop
  const stopEdgeAutoScroll = () => {
    if (scrollAnimFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = null;
    }
    scrollSpeedRef.current = 0;
  };

  const startEdgeAutoScroll = (speed: number) => {
    scrollSpeedRef.current = speed;
    if (scrollAnimFrameRef.current !== null) return;

    const animateScroll = () => {
      if (!statusContainerRef.current || scrollSpeedRef.current === 0) {
        scrollAnimFrameRef.current = null;
        return;
      }
      statusContainerRef.current.scrollLeft += scrollSpeedRef.current;
      checkStatusScrollPosition();
      scrollAnimFrameRef.current = requestAnimationFrame(animateScroll);
    };

    scrollAnimFrameRef.current = requestAnimationFrame(animateScroll);
  };

  const handleStatusContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = statusContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    const edgeThreshold = 75; // 75px edge hover zone

    const distFromLeft = mouseX - rect.left;
    const distFromRight = rect.right - mouseX;

    if (distFromLeft > 0 && distFromLeft < edgeThreshold && canScrollLeftStatus) {
      const intensity = (edgeThreshold - distFromLeft) / edgeThreshold;
      const speed = -Math.max(3, Math.round(intensity * 14));
      startEdgeAutoScroll(speed);
    } else if (distFromRight > 0 && distFromRight < edgeThreshold && canScrollRightStatus) {
      const intensity = (edgeThreshold - distFromRight) / edgeThreshold;
      const speed = Math.max(3, Math.round(intensity * 14));
      startEdgeAutoScroll(speed);
    } else {
      stopEdgeAutoScroll();
    }
  };

  const handleStatusManualScroll = (direction: 'left' | 'right') => {
    const el = statusContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(220, Math.round(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const currentUser = StorageService.getCurrentUser();

  const isArchivedStatus = (st?: string) => {
    if (!st) return false;
    const clean = st.trim().toUpperCase();
    return clean === 'ARQUIVADO' || clean === 'ARQUIVO' || clean.includes('ARQUIV') || getCanonicalStatus(st) === 'ARQUIVADO';
  };

  const isDeliveredStatus = (st?: string) => {
    if (!st) return false;
    const clean = st.trim().toUpperCase();
    return clean === 'ENTREGUE' || clean === 'CONCLUIDO' || clean === 'CONCLUÍDO' || getCanonicalStatus(st) === 'ENTREGUE';
  };

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

  // Calculate counts and sum of repair values for each custom status
  const statusMetrics = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {};

    customOSStatuses.forEach((s) => {
      map[s.code.toUpperCase()] = { count: 0, totalAmount: 0 };
    });

    orders.forEach((o) => {
      const canonical = getCanonicalStatus(o.status as string);
      const amount = getOrderAmount(o);
      if (!map[canonical]) {
        map[canonical] = { count: 0, totalAmount: 0 };
      }
      map[canonical].count += 1;
      map[canonical].totalAmount += amount;
    });

    return map;
  }, [orders, customOSStatuses]);

  // Top Status Cards configuration generated dynamically from customOSStatuses
  const statusCardsConfig = useMemo(() => {
    return customOSStatuses.map((s) => {
      const codeUpper = s.code.toUpperCase();
      const metric = statusMetrics[codeUpper] || { count: 0, totalAmount: 0 };
      const badgeClasses = getOrderStatusBadgeClasses(codeUpper);

      let icon = <Clock className="w-4 h-4 text-white" />;
      if (codeUpper === 'AGUARDANDO_AUTORIZACAO') icon = <Hourglass className="w-4 h-4 text-white" />;
      else if (codeUpper === 'AUTORIZADO' || codeUpper === 'EM_MANUTENCAO') icon = <Wrench className="w-4 h-4 text-white" />;
      else if (codeUpper === 'AGUARDANDO_PECA') icon = <Puzzle className="w-4 h-4 text-white" />;
      else if (codeUpper === 'ATRASADO') icon = <AlertTriangle className="w-4 h-4 text-white" />;
      else if (codeUpper === 'PRONTO') icon = <CheckCircle2 className="w-4 h-4 text-white" />;
      else if (codeUpper === 'ENTREGUE') icon = <Package className="w-4 h-4 text-white" />;
      else if (codeUpper === 'GARANTIA') icon = <Layers className="w-4 h-4 text-white" />;
      else if (codeUpper === 'ARQUIVADO') icon = <Archive className="w-4 h-4 text-white" />;

      const labelParts = s.label.split(' ');
      const line1 = labelParts.length > 2 ? labelParts.slice(0, Math.ceil(labelParts.length / 2)).join(' ') : labelParts[0] || s.label;
      const line2 = labelParts.length > 2 ? labelParts.slice(Math.ceil(labelParts.length / 2)).join(' ') : labelParts.slice(1).join(' ');

      return {
        id: codeUpper,
        line1,
        line2,
        title: s.label,
        count: metric.count,
        totalAmount: metric.totalAmount,
        icon,
        badgeClasses,
      };
    });
  }, [customOSStatuses, statusMetrics]);

  // Status badge style helper
  const getStatusBadgeConfig = (rawStatus: string) => {
    const label = getOrderStatusLabel(rawStatus);
    const classes = getOrderStatusBadgeClasses(rawStatus);
    return {
      label,
      icon: <Clock className="w-3.5 h-3.5" />,
      bg: `${classes.bg} ${classes.text} ${classes.border}`,
      dot: classes.dot,
    };
  };

  // Status Change handler
  const handleUpdateOrderStatus = (order: ServiceOrder, newStatus: OrderStatus) => {
    setStatusMenuOpenForId(null);
    if (isDeliveredStatus(newStatus as string)) {
      setOrderForDelivery(order);
      return;
    }

    if (isArchivedStatus(newStatus as string)) {
      openArchiveModalForOrder(order);
      return;
    }

    const updated: ServiceOrder = {
      ...order,
      status: newStatus,
      deliveredAt: order.deliveredAt,
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
    setOrders(StorageService.getOrders());
  };

  const openArchiveModalForOrder = (os: ServiceOrder) => {
    setOrderForArchiveLocation(os);
    setArchiveLocationInput(os.archivedLocation || '');
    setArchivePromisedDate(os.promisedRepairDate || '');
    setArchivePromisedNotes(os.promisedRepairNotes || '');
    setHasPromisedDate(!!os.promisedRepairDate);
  };

  const handleConfirmArchiveLocation = (customLocation?: string) => {
    if (!orderForArchiveLocation) return;
    const loc = (customLocation !== undefined ? customLocation : archiveLocationInput).trim();
    const finalDate = hasPromisedDate && archivePromisedDate.trim() ? archivePromisedDate.trim() : undefined;
    const finalNotes = hasPromisedDate && archivePromisedNotes.trim() ? archivePromisedNotes.trim() : undefined;

    const updated: ServiceOrder = {
      ...orderForArchiveLocation,
      status: 'ARQUIVADO',
      archivedLocation: loc || undefined,
      promisedRepairDate: finalDate,
      promisedRepairNotes: finalNotes,
      promisedRepairDismissed: false,
      statusHistory: [
        ...(orderForArchiveLocation.statusHistory || []),
        {
          status: 'ARQUIVADO',
          changedAt: new Date().toISOString(),
          changedBy: currentUser?.name || 'Administrador',
          notes: `Status alterado para Arquivado.${loc ? ` Localização: ${loc}.` : ''}${finalDate ? ` Retorno agendado para conserto em: ${finalDate}.` : ''}`,
        },
      ],
    };
    StorageService.saveOrder(updated);
    setOrders(StorageService.getOrders());
    setOrderForArchiveLocation(null);
    setArchiveLocationInput('');
    setArchivePromisedDate('');
    setArchivePromisedNotes('');
    setHasPromisedDate(false);
  };

  // Handler to toggle and apply 1ª Linha or Premium part value directly on OS card
  const handleSelectPartTierOnOrder = (
    e: React.MouseEvent,
    targetOrder: ServiceOrder,
    tier: 'FIRST_LINE' | 'PREMIUM'
  ) => {
    e.stopPropagation();
    const newTier = targetOrder.selectedPartTier === tier ? 'NONE' : tier;
    const tierPrice =
      newTier === 'FIRST_LINE'
        ? (Number(targetOrder.partPriceFirstLine) || 0)
        : newTier === 'PREMIUM'
        ? (Number(targetOrder.partPricePremium) || 0)
        : 0;

    const baseParts = (targetOrder.parts || []).filter(
      (p) => !p.id.startsWith('tier-part-') && !p.id.startsWith('part-tier-')
    );

    const newTierItem: OrderPartItem | null =
      newTier !== 'NONE' && tierPrice > 0
        ? {
            id: `part-tier-${Date.now()}`,
            type: 'PECA',
            name: `${targetOrder.partTierDescription || 'Peça'} (${newTier === 'PREMIUM' ? 'Premium' : '1ª Linha'})`,
            productName: `${targetOrder.partTierDescription || 'Peça'} (${newTier === 'PREMIUM' ? 'Premium' : '1ª Linha'})`,
            quantity: 1,
            unitPrice: tierPrice,
            discount: 0,
            total: tierPrice,
            totalPrice: tierPrice,
          }
        : null;

    const newParts = newTierItem ? [...baseParts, newTierItem] : baseParts;
    const newPartsPrice = newParts.reduce((acc, p) => acc + (p.totalPrice || p.total || (p.unitPrice || 0) * (p.quantity || 1)), 0);
    const newTotal = (Number(targetOrder.laborPrice) || 0) + newPartsPrice - (Number(targetOrder.discount) || 0);

    const updated: ServiceOrder = {
      ...targetOrder,
      selectedPartTier: newTier,
      parts: newParts,
      items: newParts,
      partsPrice: newPartsPrice,
      totalPrice: Math.max(0, newTotal),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveOrder(updated);
    setOrders(StorageService.getOrders());
  };

  // Helper to build formatted message string for the client
  const buildCustomerMessage = (
    os: ServiceOrder,
    mode: 'BOTH' | 'PREMIUM' | 'FIRST_LINE' = 'BOTH'
  ): string => {
    const company = StorageService.getCompanySettings();
    const statusLabel = getOrderStatusLabel(os.status);

    let msg = `👋 Olá, *${os.customerName || 'Cliente'}*!\n\n`;
    msg += `🏢 Aqui é da *${company.name || 'Assistência Técnica'}*!\n`;
    msg += `📋 Abaixo estão as informações da sua Ordem de Serviço *#${os.orderNumber}*:\n\n`;
    msg += `📱 *Aparelho / Equipamento:* ${os.brand || ''} ${os.model || ''}\n`;
    if (os.clientDefect) {
      msg += `⚠️ *Defeito Relatado:* ${os.clientDefect}\n`;
    }
    if (os.requestedService || os.performedService) {
      msg += `🛠️ *Serviço:* ${os.requestedService || os.performedService}\n`;
    }
    msg += `📌 *Status Atual:* ${statusLabel}\n`;

    const hasFirstLine = Number(os.partPriceFirstLine) > 0;
    const hasPremium = Number(os.partPricePremium) > 0;

    const showPremium = (mode === 'BOTH' || mode === 'PREMIUM') && hasPremium;
    const showFirstLine = (mode === 'BOTH' || mode === 'FIRST_LINE') && hasFirstLine;

    if (showPremium || showFirstLine) {
      msg += `\n─────────────────────────\n`;
      if (showPremium && showFirstLine) {
        msg += `💰 *OPÇÕES DE ORÇAMENTO DISPONÍVEIS:*\n\n`;
      } else {
        msg += `💰 *INFORMAÇÕES DO ORÇAMENTO:*\n\n`;
      }

      // 1. PREMIUM FIRST
      if (showPremium) {
        const premTotal = Number(os.partPricePremium) + (os.laborPrice || 0) - (os.discount || 0);
        const isSelected = os.selectedPartTier === 'PREMIUM';
        msg += `💎 *OPÇÃO PREMIUM:* *${formatCurrency(premTotal)}* ${isSelected ? '✅ (OPÇÃO SELECIONADA)' : ''}\n`;
        msg += `✨ *Diferencial Premium:* Conta com tecnologia e peças com o desempenho e qualidade mais próximos da original de fábrica, garantindo altíssima durabilidade e acabamento impecável!\n\n`;
      }

      // 2. PRIMEIRA LINHA SECOND
      if (showFirstLine) {
        const flTotal = Number(os.partPriceFirstLine) + (os.laborPrice || 0) - (os.discount || 0);
        const isSelected = os.selectedPartTier === 'FIRST_LINE';
        msg += `⭐ *OPÇÃO 1ª LINHA:* *${formatCurrency(flTotal)}* ${isSelected ? '✅ (OPÇÃO SELECIONADA)' : ''}\n`;
        msg += `💡 *Serviço Econômico:* É um serviço econômico para menor custo, lembrando que são realizadas com peças de menor custo e qualidade inferior em relação à linha Premium.\n\n`;
      }

      msg += `─────────────────────────\n`;
      if (showPremium && showFirstLine) {
        msg += `❓ Por favor, nos informe qual das opções você prefere para darmos andamento!\n`;
      } else {
        msg += `❓ Podemos dar andamento no serviço? Por favor, nos confirme sua aprovação!\n`;
      }
    } else {
      let totalToDisplay = os.totalPrice || 0;
      if (os.selectedPartTier === 'FIRST_LINE' && Number(os.partPriceFirstLine) > 0) {
        totalToDisplay = Number(os.partPriceFirstLine) + (os.laborPrice || 0) - (os.discount || 0);
      } else if (os.selectedPartTier === 'PREMIUM' && Number(os.partPricePremium) > 0) {
        totalToDisplay = Number(os.partPricePremium) + (os.laborPrice || 0) - (os.discount || 0);
      }

      if (totalToDisplay > 0) {
        msg += `\n─────────────────────────\n`;
        msg += `💰 *Valor Total do Serviço:* *${formatCurrency(totalToDisplay)}*\n`;
        msg += `─────────────────────────\n`;
        msg += `❓ Podemos dar andamento no serviço? Por favor, nos confirme sua aprovação!\n`;
      }
    }

    msg += `\n💬 Qualquer dúvida, estamos à disposição para te atender!`;
    return msg;
  };

  // Handler to send OS details / quote to client via WhatsApp
  const handleSendToClient = (
    e: React.MouseEvent,
    os: ServiceOrder,
    mode: 'BOTH' | 'PREMIUM' | 'FIRST_LINE' = 'BOTH'
  ) => {
    e.stopPropagation();
    const rawPhone = os.customerPhone || os.customerWhatsapp || '';
    const cleanPhone = cleanPhoneForWhatsApp(rawPhone);

    if (!cleanPhone) {
      alert('O cliente desta Ordem de Serviço não possui um número de telefone/WhatsApp válido cadastrado.');
      return;
    }

    const msg = buildCustomerMessage(os, mode);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Handler to copy formatted customer message to clipboard
  const handleCopyCustomerMessage = (
    e: React.MouseEvent,
    os: ServiceOrder,
    mode: 'BOTH' | 'PREMIUM' | 'FIRST_LINE' = 'BOTH'
  ) => {
    e.stopPropagation();
    const msg = buildCustomerMessage(os, mode);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopiedOrderId(os.id);
        setTimeout(() => setCopiedOrderId(null), 2500);
      }).catch(() => {
        alert('Texto copiado com sucesso!');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = msg;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedOrderId(os.id);
      setTimeout(() => setCopiedOrderId(null), 2500);
    }
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
      const statusLabel = getOrderStatusLabel(o.status as string).toLowerCase();
      return (
        o.orderNumber.toString().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        (o.imei && o.imei.toLowerCase().includes(q)) ||
        (o.serialNumber && o.serialNumber.toLowerCase().includes(q)) ||
        (o.archivedLocation && o.archivedLocation.toLowerCase().includes(q)) ||
        (o.clientDefect && o.clientDefect.toLowerCase().includes(q)) ||
        (o.technicalDiagnosis && o.technicalDiagnosis.toLowerCase().includes(q)) ||
        (o.requestedService && o.requestedService.toLowerCase().includes(q)) ||
        (o.performedService && o.performedService.toLowerCase().includes(q)) ||
        (o.partTierDescription && o.partTierDescription.toLowerCase().includes(q)) ||
        (o.technicianName && o.technicianName.toLowerCase().includes(q)) ||
        (o.attendantName && o.attendantName.toLowerCase().includes(q)) ||
        statusLabel.includes(q) ||
        (o.items && o.items.some((it) => (it.name || it.productName || '').toLowerCase().includes(q)))
      );
    });
  }, [orders, search]);

  // Breakdown of matching orders per status tab
  const matchesByStatus = useMemo(() => {
    const map: Record<string, ServiceOrder[]> = {};
    customOSStatuses.forEach((s) => {
      map[s.code.toUpperCase()] = [];
    });
    allMatchingOrders.forEach((o) => {
      const canonical = getCanonicalStatus(o.status as string);
      if (!map[canonical]) {
        map[canonical] = [];
      }
      map[canonical].push(o);
    });
    return map;
  }, [allMatchingOrders, customOSStatuses]);

  // Filtered orders: When searching, searches across ALL statuses seamlessly! When no search, respects selected preset.
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hasSearch = q !== '';

    return orders.filter((o) => {
      const canonical = getCanonicalStatus(o.status as string);

      // 1. Status Filter: strictly compare canonical status ONLY when NOT searching
      if (!hasSearch && filterPreset !== 'TODAS' && canonical !== filterPreset) {
        return false;
      }

      // 2. Period Filter (only when not searching or if specific period is selected)
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

      // 3. Search Query: matches across all statuses
      if (!hasSearch) return true;
      const statusLabel = getOrderStatusLabel(o.status as string).toLowerCase();
      return (
        o.orderNumber.toString().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        (o.imei && o.imei.toLowerCase().includes(q)) ||
        (o.serialNumber && o.serialNumber.toLowerCase().includes(q)) ||
        (o.archivedLocation && o.archivedLocation.toLowerCase().includes(q)) ||
        (o.clientDefect && o.clientDefect.toLowerCase().includes(q)) ||
        (o.technicalDiagnosis && o.technicalDiagnosis.toLowerCase().includes(q)) ||
        (o.requestedService && o.requestedService.toLowerCase().includes(q)) ||
        (o.performedService && o.performedService.toLowerCase().includes(q)) ||
        (o.partTierDescription && o.partTierDescription.toLowerCase().includes(q)) ||
        (o.technicianName && o.technicianName.toLowerCase().includes(q)) ||
        (o.attendantName && o.attendantName.toLowerCase().includes(q)) ||
        statusLabel.includes(q) ||
        (o.items && o.items.some((it) => (it.name || it.productName || '').toLowerCase().includes(q)))
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

  // Kanban columns dynamically constructed from customOSStatuses
  const kanbanColumns: KanbanColumnDef[] = useMemo(() => {
    return customOSStatuses.map((s) => {
      const codeUpper = s.code.toUpperCase();
      const metric = statusMetrics[codeUpper] || { count: 0, totalAmount: 0 };
      const badgeClasses = getOrderStatusBadgeClasses(codeUpper);

      let icon = <Clock className="w-4 h-4 text-amber-400" />;
      if (codeUpper === 'AGUARDANDO_AUTORIZACAO') icon = <Hourglass className="w-4 h-4 text-purple-400" />;
      else if (codeUpper === 'AUTORIZADO' || codeUpper === 'EM_MANUTENCAO') icon = <Wrench className="w-4 h-4 text-cyan-400" />;
      else if (codeUpper === 'AGUARDANDO_PECA') icon = <Puzzle className="w-4 h-4 text-orange-400" />;
      else if (codeUpper === 'ATRASADO') icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
      else if (codeUpper === 'PRONTO') icon = <Check className="w-4 h-4 text-emerald-400" />;
      else if (codeUpper === 'ENTREGUE') icon = <Package className="w-4 h-4 text-teal-400" />;
      else if (codeUpper === 'ARQUIVADO') icon = <Archive className="w-4 h-4 text-zinc-300" />;

      return {
        id: codeUpper,
        title: s.label,
        count: metric.count,
        totalAmount: metric.totalAmount,
        icon,
        headerBg: 'bg-slate-900/80',
        headerBorder: badgeClasses.border || 'border-slate-700',
        headerText: badgeClasses.text || 'text-white',
        columnBorder: badgeClasses.border || 'border-slate-800',
        columnGlow: 'shadow-md',
        badgeBg: `${badgeClasses.bg} ${badgeClasses.text} border`,
        targetStatus: codeUpper as OrderStatus,
      };
    });
  }, [customOSStatuses, statusMetrics]);

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
              onClick={() => setViewMode('blocks')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'blocks'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Blocos"
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Blocos</span>
            </button>
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

      {/* 2. TOP STATUS CARDS (Dynamically mapped for all active OS statuses, with Edge-Hover Auto-Scroll and Wheel Support) */}
      <div
        className="mt-2.5 mb-2.5 relative group/status-container w-full select-none"
        onMouseMove={handleStatusContainerMouseMove}
        onMouseLeave={stopEdgeAutoScroll}
      >
        {/* Left Scroll Arrow & Gradient Fade */}
        {canScrollLeftStatus && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#060c1d] via-[#060c1d]/80 to-transparent z-10 pointer-events-none rounded-l-xl" />
            <button
              type="button"
              onClick={() => handleStatusManualScroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 text-white border border-slate-700/90 shadow-xl flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-400 hover:scale-110 active:scale-95 transition-all cursor-pointer group-hover/status-container:opacity-100 opacity-80"
              title="Rolar status para a esquerda"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-300" />
            </button>
          </>
        )}

        {/* Right Scroll Arrow & Gradient Fade */}
        {canScrollRightStatus && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#060c1d] via-[#060c1d]/80 to-transparent z-10 pointer-events-none rounded-r-xl" />
            <button
              type="button"
              onClick={() => handleStatusManualScroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 text-white border border-slate-700/90 shadow-xl flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-400 hover:scale-110 active:scale-95 transition-all cursor-pointer group-hover/status-container:opacity-100 opacity-80"
              title="Rolar status para a direita"
            >
              <ChevronRight className="w-5 h-5 text-cyan-300" />
            </button>
          </>
        )}

        {/* Scrollable Container */}
        <div
          ref={statusContainerRef}
          className="flex flex-nowrap items-stretch overflow-x-auto custom-scrollbar gap-2 sm:gap-2.5 pt-1 pb-1.5 w-full scroll-smooth"
        >
          {statusCardsConfig.map((card) => {
            const isActive = filterPreset === card.id;
            const badge = card.badgeClasses;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setFilterPreset(filterPreset === card.id ? 'TODAS' : card.id)}
                className={`p-2 sm:p-2.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[88px] sm:min-h-[96px] flex-1 min-w-[110px] sm:min-w-[125px] shrink-0 sm:shrink ${
                  badge.bg
                } ${badge.border} ${badge.text} ${
                  isActive ? 'ring-2 ring-current shadow-lg scale-[1.02]' : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
                }`}
              >
                {/* Top: Title (in 2 lines if needed) + Status Icon Box */}
                <div className="flex items-start justify-between gap-1 w-full min-w-0">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="text-[10px] sm:text-[11px] font-extrabold block leading-tight truncate">
                      {card.line1}
                    </span>
                    {card.line2 && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold block leading-tight opacity-90 truncate">
                        {card.line2}
                      </span>
                    )}
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 bg-black/20 border border-white/20">
                    {card.icon}
                  </div>
                </div>

                {/* Bottom: Count ("X OS") + Total Value ("R$ X,XX") on ONE visible line with proportional font sizing */}
                <div className="mt-1.5 pt-1 border-t border-current/20 flex items-center justify-between gap-1 flex-nowrap w-full min-w-0">
                  <div className="flex items-baseline gap-0.5 shrink-0 min-w-0">
                    <span className="text-xs sm:text-sm font-black leading-none">
                      {card.count}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase opacity-80">
                      OS
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink min-w-0 overflow-hidden" title={`Valor Total: ${formatCurrency(card.totalAmount)}`}>
                    <span className="text-[9.5px] sm:text-[11px] font-black font-mono tracking-tighter leading-none whitespace-nowrap truncate">
                      {formatCurrency(card.totalAmount)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
              <span>Todas ({orders.length}) • {formatCurrency(orders.reduce((acc, o) => acc + getOrderAmount(o), 0))}</span>
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
                      {/* Left: Customer + Equipment + Defect + Archived Location Badge */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-blue-400">
                            OS #{order.orderNumber}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {order.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.customerPhone}
                          </span>
                          {order.archivedLocation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse">
                              <Box className="w-3 h-3 text-slate-950 shrink-0" />
                              <span>LOCAL: {order.archivedLocation}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 flex-wrap">
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

      {/* 4. MAIN OS DATA (Blocos / Tabela / Kanban) */}
      {viewMode === 'blocks' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs sm:text-sm bg-[#080d1a] border border-slate-800 rounded-2xl p-6 shadow-xl">
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
                    <span>Limpar Filtros e Ver Todas ({orders.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              paginatedOrders.map((os) => {
                const badge = getStatusBadgeConfig(os.status as string);
                const thumb = getDeviceThumbnail(os);
                const avatarColor = getAvatarBg(os.customerName);
                const isHighlighted = highlightedOrderId === os.id;
                const totalAmount = os.totalPrice || 0;

                return (
                  <div
                    key={os.id}
                    id={`order-row-${os.id}`}
                    onClick={() => onViewOrderDetail(os)}
                    className={`bg-[#0b1328] border border-slate-800 hover:border-blue-500/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.01] group ${
                      isHighlighted ? 'ring-2 ring-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse' : ''
                    }`}
                  >
                    {/* Card Header: #OS_NUMBER + Date/Time + Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-cyan-400 tracking-tight">#{os.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{formatDate(os.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderForStatusChange(os);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${badge.bg}`}
                        title="Clique para alterar status da OS"
                      >
                        {badge.label}
                      </button>
                    </div>

                    {/* Customer & Equipment Main Info */}
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={thumb}
                          alt={os.model}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 bg-slate-900 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] border border-slate-900 shadow-xs ${avatarColor}`}>
                          {os.customerName ? os.customerName[0].toUpperCase() : 'C'}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">
                          {os.customerName}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{os.customerPhone}</p>
                        <p className="text-xs font-extrabold text-slate-200 truncate mt-1">
                          {os.brand} {os.model}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {os.imei ? `IMEI: ${os.imei}` : os.serialNumber ? `S/N: ${os.serialNumber}` : 'Sem IMEI'}
                        </p>
                      </div>
                    </div>

                    {/* Defect & Executed Service Box */}
                    <div className="p-2.5 rounded-xl bg-[#060c1d] border border-slate-800/80 space-y-1 text-xs">
                      <p className="text-slate-300 line-clamp-1">
                        <strong className="text-amber-400 text-[10px] uppercase font-black mr-1">DEFEITO:</strong>
                        <span>{os.clientDefect || 'Não informado pelo cliente'}</span>
                      </p>
                      <p className="text-slate-300 line-clamp-1">
                        <strong className="text-cyan-400 text-[10px] uppercase font-black mr-1">SERVIÇO:</strong>
                        <span>{os.requestedService || os.performedService || os.technicalDiagnosis || 'Em análise técnica'}</span>
                      </p>
                    </div>

                    {/* Dual Budget Values (1ª Linha & Premium) - Small, Sleek & Clickable directly on card */}
                    {(Number(os.partPriceFirstLine) > 0 || Number(os.partPricePremium) > 0) && (
                      <div className="p-2 rounded-xl bg-[#050b1a] border border-slate-800/90 flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          <span>Opções de Peça ({os.partTierDescription || 'Peça'}):</span>
                          <span className="text-[8px] text-slate-500 font-normal italic">Toque para marcar</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Number(os.partPriceFirstLine) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleSelectPartTierOnOrder(e, os, 'FIRST_LINE')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border flex items-center justify-between gap-1 shadow-xs ${
                                os.selectedPartTier === 'FIRST_LINE'
                                  ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black ring-1 ring-amber-300'
                                  : 'bg-[#030a17] text-amber-300 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400'
                              }`}
                              title="Clique para marcar/aplicar valor de 1ª Linha nesta OS"
                            >
                              <span className="truncate">⭐ 1ª Linha</span>
                              <span className="font-mono text-[10.5px] shrink-0 font-black">
                                {formatCurrency(os.partPriceFirstLine || 0)}
                              </span>
                            </button>
                          )}
                          {Number(os.partPricePremium) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleSelectPartTierOnOrder(e, os, 'PREMIUM')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border flex items-center justify-between gap-1 shadow-xs ${
                                os.selectedPartTier === 'PREMIUM'
                                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] font-black ring-1 ring-cyan-300'
                                  : 'bg-[#030a17] text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400'
                              }`}
                              title="Clique para marcar/aplicar valor Premium nesta OS"
                            >
                              <span className="truncate">💎 Premium</span>
                              <span className="font-mono text-[10.5px] shrink-0 font-black">
                                {formatCurrency(os.partPricePremium || 0)}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Physical Location in Archive if applicable */}
                    {(os.archivedLocation || getCanonicalStatus(os.status as string) === 'ARQUIVADO') && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openArchiveModalForOrder(os);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-between cursor-pointer hover:bg-amber-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Box className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span className="truncate">LOCAL NO ARQUIVO: {os.archivedLocation || 'Definir local...'}</span>
                        </div>
                        <Edit2 className="w-3 h-3 text-amber-400 shrink-0" />
                      </div>
                    )}

                    {/* Data Marcada para Conserto / Retorno do Cliente */}
                    {os.promisedRepairDate ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openArchiveModalForOrder(os);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/25 via-pink-500/20 to-purple-600/15 border border-purple-500/50 text-purple-200 text-[10px] font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/35 transition-all shadow-xs"
                        title="Cliente informou que vai trazer para consertar neste dia. Clique para alterar."
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                          <span className="truncate font-black">
                            📅 CONSERTO MARCADO: {formatDate(os.promisedRepairDate)}
                          </span>
                        </div>
                        <Edit2 className="w-3 h-3 text-purple-400 shrink-0" />
                      </div>
                    ) : (getCanonicalStatus(os.status as string) === 'ARQUIVADO') ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openArchiveModalForOrder(os);
                        }}
                        className="w-full py-1.5 px-2 rounded-xl border border-dashed border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 text-[9.5px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Cliente falou que vai trazer para consertar tal dia? Clique para agendar."
                      >
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>+ Agendar data que o cliente vai consertar</span>
                      </button>
                    ) : null}

                    {/* Footer Row: Value + Print + Details Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400">Valor do serviço</span>
                        <span className="text-base font-black text-emerald-400 font-mono tracking-tight">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* BOTÃO DUPLO MANDAR / COPIAR PRO CLIENTE */}
                        <div className="inline-flex items-center rounded-xl bg-emerald-600/20 border border-emerald-500/40 p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendModalOrder(os);
                              setSendModalMode('BOTH');
                            }}
                            className="px-2.5 py-1 text-emerald-300 hover:text-white hover:bg-emerald-600/40 text-xs font-bold flex items-center gap-1 rounded-lg transition-all cursor-pointer active:scale-95"
                            title="Enviar orçamento/resumo da OS para o cliente (Escolha Ambas, Só Premium ou Só 1ª Linha)"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mandar pro Cliente</span>
                          </button>
                          <div className="w-[1px] h-4 bg-emerald-500/30 my-auto mx-0.5" />
                          <button
                            type="button"
                            onClick={(e) => handleCopyCustomerMessage(e, os, 'BOTH')}
                            className={`px-2 py-1 text-xs font-bold flex items-center gap-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                              copiedOrderId === os.id
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : 'text-emerald-300 hover:text-white hover:bg-emerald-600/40'
                            }`}
                            title="Copiar texto da mensagem da OS para a área de transferência"
                          >
                            {copiedOrderId === os.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                                <span className="text-[11px] font-black">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* BOTÃO EDITAR DIRETO */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOrder(os);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Editar esta Ordem de Serviço"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Editar</span>
                        </button>

                        {/* OPÇÃO DE IMPRESSÃO EM TODAS AS OSs */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrint(os);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Imprimir esta Ordem de Serviço"
                        >
                          <Printer className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Imprimir</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOrderDetail(os);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-blue-600/30"
                        >
                          <span>Ver detalhes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls for Blocks Mode */}
          {filteredOrders.length > itemsPerPage && (
            <div className="px-4 py-3 bg-[#080d1a] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Exibindo <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
                <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> de{' '}
                <strong>{filteredOrders.length}</strong> ordens de serviço
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer font-bold"
                >
                  Anterior
                </button>
                <span className="font-bold text-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer font-bold"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
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
                          <span>Limpar Filtros e Ver Todas ({orders.length})</span>
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

                        {/* 4. DEFEITO & SERVIÇO A SER FEITO (Both fully visible in 2 clean lines + Dual tier badges) */}
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

                            {/* Dual Budget Values (1ª Linha & Premium) Clickable */}
                            {(Number(os.partPriceFirstLine) > 0 || Number(os.partPricePremium) > 0) && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {Number(os.partPriceFirstLine) > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectPartTierOnOrder(e, os, 'FIRST_LINE')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all cursor-pointer flex items-center gap-0.5 ${
                                      os.selectedPartTier === 'FIRST_LINE'
                                        ? 'bg-amber-600 text-white border-amber-400 font-black shadow-xs ring-1 ring-amber-300'
                                        : 'bg-[#040c1e] text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                                    }`}
                                    title="Marcar/aplicar valor de 1ª Linha nesta OS"
                                  >
                                    <span>⭐ 1ªL: {formatCurrency(os.partPriceFirstLine || 0)}</span>
                                    {os.selectedPartTier === 'FIRST_LINE' && <Check className="w-2.5 h-2.5" />}
                                  </button>
                                )}
                                {Number(os.partPricePremium) > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectPartTierOnOrder(e, os, 'PREMIUM')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all cursor-pointer flex items-center gap-0.5 ${
                                      os.selectedPartTier === 'PREMIUM'
                                        ? 'bg-cyan-600 text-white border-cyan-400 font-black shadow-xs ring-1 ring-cyan-300'
                                        : 'bg-[#040c1e] text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
                                    }`}
                                    title="Marcar/aplicar valor Premium nesta OS"
                                  >
                                    <span>💎 Prem: {formatCurrency(os.partPricePremium || 0)}</span>
                                    {os.selectedPartTier === 'PREMIUM' && <Check className="w-2.5 h-2.5" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. STATUS & PROMINENT ARCHIVED LOCATION (Clickable pill opening Quick Status Dialog) */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex flex-col items-start gap-1.5">
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

                            {(os.archivedLocation || getCanonicalStatus(os.status as string) === 'ARQUIVADO') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openArchiveModalForOrder(os);
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all shadow-md cursor-pointer border max-w-[210px] truncate ${
                                  os.archivedLocation
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:from-amber-300 hover:to-amber-400 hover:scale-105'
                                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-600 text-amber-300 hover:text-amber-200'
                                }`}
                                title="Localização física no arquivo. Clique para alterar."
                              >
                                <Box className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                                <span className="truncate">
                                  {os.archivedLocation ? `📍 LOCAL: ${os.archivedLocation.toUpperCase()}` : '📍 DEFINIR LOCAL...'}
                                </span>
                              </button>
                            )}

                            {os.promisedRepairDate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openArchiveModalForOrder(os);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer truncate max-w-[210px]"
                                title="Cliente agendou data para conserto"
                              >
                                <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                                <span className="truncate">Marcado: {formatDate(os.promisedRepairDate)}</span>
                              </button>
                            )}
                          </div>
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSendModalOrder(os);
                                setSendModalMode('BOTH');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Mandar orçamento/resumo da OS para o cliente (Opção Ambas, Só Premium ou Só 1ª Linha)"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden xl:inline">Mandar pro Cliente</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCustomerMessage(e, os)}
                              className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                copiedOrderId === os.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                  : 'bg-emerald-600/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                              }`}
                              title="Copiar texto da mensagem da OS para a área de transferência"
                            >
                              {copiedOrderId === os.id ? (
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditOrder(os);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Editar OS"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
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

                    {/* Dual Budget Values (1ª Linha & Premium) Clickable */}
                    {(Number(os.partPriceFirstLine) > 0 || Number(os.partPricePremium) > 0) && (
                      <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-slate-800 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Opções de Peça ({os.partTierDescription || 'Peça'}):</span>
                        <div className="grid grid-cols-2 gap-1">
                          {Number(os.partPriceFirstLine) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleSelectPartTierOnOrder(e, os, 'FIRST_LINE')}
                              className={`px-2 py-1 rounded text-[9.5px] font-black border transition-all cursor-pointer flex items-center justify-between gap-0.5 ${
                                os.selectedPartTier === 'FIRST_LINE'
                                  ? 'bg-amber-600 text-white border-amber-400 shadow-xs'
                                  : 'bg-[#030914] text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <span>⭐ 1ª Linha</span>
                              <span>{formatCurrency(os.partPriceFirstLine || 0)}</span>
                            </button>
                          )}
                          {Number(os.partPricePremium) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleSelectPartTierOnOrder(e, os, 'PREMIUM')}
                              className={`px-2 py-1 rounded text-[9.5px] font-black border transition-all cursor-pointer flex items-center justify-between gap-0.5 ${
                                os.selectedPartTier === 'PREMIUM'
                                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-xs'
                                  : 'bg-[#030914] text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              <span>💎 Premium</span>
                              <span>{formatCurrency(os.partPricePremium || 0)}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {(os.archivedLocation || getCanonicalStatus(os.status as string) === 'ARQUIVADO') && (
                      <div className="mb-2 space-y-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openArchiveModalForOrder(os);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-md ${
                            os.archivedLocation
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                              : 'bg-zinc-900 border-zinc-600 text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Box className="w-4 h-4 text-slate-950 shrink-0" />
                            <span className="uppercase tracking-wider">LOCAL NO ARQUIVO:</span>
                            <span className="truncate underline font-extrabold">{os.archivedLocation || 'Definir local...'}</span>
                          </div>
                          <Edit2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                        </button>

                        {os.promisedRepairDate ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openArchiveModalForOrder(os);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-[10px] font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/30 transition-all shadow-xs"
                          >
                            <span className="truncate">📅 CONSERTO MARCADO: {formatDate(os.promisedRepairDate)}</span>
                            <Edit2 className="w-3 h-3 text-purple-400 shrink-0" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openArchiveModalForOrder(os);
                            }}
                            className="w-full py-1 px-2 rounded-lg border border-dashed border-purple-500/40 text-purple-300 hover:text-white bg-purple-950/20 text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span>+ Agendar data do conserto</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-700/40 gap-2">
                      <div className="flex items-center justify-between sm:justify-start">
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Valor:</span>
                        <span className="font-black text-sm text-emerald-400 font-mono">{formatCurrency(os.totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <div className="inline-flex items-center rounded-lg bg-emerald-600/20 border border-emerald-500/40 p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendModalOrder(os);
                              setSendModalMode('BOTH');
                            }}
                            className="px-2 py-1 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1 rounded-md transition-all cursor-pointer active:scale-95"
                            title="Mandar orçamento/resumo da OS para o cliente (Escolha Ambas, Só Premium ou Só 1ª Linha)"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Mandar</span>
                          </button>
                          <div className="w-[1px] h-3.5 bg-emerald-500/30 my-auto mx-0.5" />
                          <button
                            type="button"
                            onClick={(e) => handleCopyCustomerMessage(e, os, 'BOTH')}
                            className={`px-2 py-1 text-xs font-bold flex items-center gap-1 rounded-md transition-all cursor-pointer active:scale-95 ${
                              copiedOrderId === os.id
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'text-emerald-300 hover:text-white'
                            }`}
                            title="Copiar texto da mensagem da OS"
                          >
                            {copiedOrderId === os.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                                <span className="text-[10px]">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOrder(os);
                          }}
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrint(os);
                          }}
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 shrink-0" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToDelete(os);
                          }}
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
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

                          {/* Dual Budget Values (1ª Linha & Premium) Clickable */}
                          {(Number(os.partPriceFirstLine) > 0 || Number(os.partPricePremium) > 0) && (
                            <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-slate-800 flex flex-col gap-1">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase">Opções ({os.partTierDescription || 'Peça'}):</span>
                              <div className="grid grid-cols-2 gap-1">
                                {Number(os.partPriceFirstLine) > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectPartTierOnOrder(e, os, 'FIRST_LINE')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all cursor-pointer flex items-center justify-between gap-0.5 ${
                                      os.selectedPartTier === 'FIRST_LINE'
                                        ? 'bg-amber-600 text-white border-amber-400 font-bold shadow-xs'
                                        : 'bg-[#030914] text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                                    }`}
                                    title="Marcar 1ª Linha nesta OS"
                                  >
                                    <span>⭐ 1ªL</span>
                                    <span>{formatCurrency(os.partPriceFirstLine || 0)}</span>
                                  </button>
                                )}
                                {Number(os.partPricePremium) > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectPartTierOnOrder(e, os, 'PREMIUM')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-all cursor-pointer flex items-center justify-between gap-0.5 ${
                                      os.selectedPartTier === 'PREMIUM'
                                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-xs'
                                        : 'bg-[#030914] text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
                                    }`}
                                    title="Marcar Premium nesta OS"
                                  >
                                    <span>💎 Prem</span>
                                    <span>{formatCurrency(os.partPricePremium || 0)}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Archived Location tag if present or status is ARQUIVADO */}
                          {(os.archivedLocation || getCanonicalStatus(os.status as string) === 'ARQUIVADO') && (
                            <div className="mb-2 space-y-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openArchiveModalForOrder(os);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-black text-left transition-all cursor-pointer border shadow-sm ${
                                  os.archivedLocation
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)] hover:scale-[1.02]'
                                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700 text-amber-300'
                                }`}
                                title="Clique para alterar a localização física no arquivo"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Box className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                                  <span className="truncate">
                                    {os.archivedLocation ? `📍 LOCAL: ${os.archivedLocation.toUpperCase()}` : '📍 DEFINIR LOCAL...'}
                                  </span>
                                </div>
                                <Edit2 className="w-3 h-3 text-slate-950 shrink-0" />
                              </button>

                              {os.promisedRepairDate && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openArchiveModalForOrder(os);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-[10px] font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/30 transition-all shadow-xs"
                                >
                                  <span className="truncate">📅 Marcado: {formatDate(os.promisedRepairDate)}</span>
                                  <Edit2 className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Price & Status */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1.5">
                            <span className="text-xs font-bold text-emerald-400">
                              {formatCurrency(os.totalPrice)}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Botão Mandar pro Cliente */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSendModalOrder(os);
                                  setSendModalMode('BOTH');
                                }}
                                className="p-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                                title="Mandar orçamento/resumo da OS para o cliente (Opção Ambas, Só Premium ou Só 1ª Linha)"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              </button>

                              {/* Botão Copiar Texto da OS */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyCustomerMessage(e, os, 'BOTH')}
                                className={`p-1 rounded-lg border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                                  copiedOrderId === os.id
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                    : 'bg-emerald-600/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                                }`}
                                title="Copiar texto da mensagem da OS para a área de transferência"
                              >
                                {copiedOrderId === os.id ? (
                                  <Check className="w-3.5 h-3.5 text-slate-950" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </button>

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
              {customOSStatuses.map((item) => {
                const itemCode = (item.code || item.id).toUpperCase();
                const isCurrent =
                  getCanonicalStatus(orderForStatusChange.status as string) === itemCode ||
                  (orderForStatusChange.status as string)?.toUpperCase() === itemCode;

                const badge = getOrderStatusBadgeClasses(itemCode);

                return (
                  <button
                    key={item.id || item.code}
                    type="button"
                    onClick={() => {
                      const targetOrder = orderForStatusChange;
                      setOrderForStatusChange(null);
                      const targetCode = item.code || item.id || item.label;
                      if (isArchivedStatus(targetCode)) {
                        setArchiveLocationInput(targetOrder.archivedLocation || '');
                        setOrderForArchiveLocation(targetOrder);
                      } else if (isDeliveredStatus(targetCode)) {
                        setOrderForDelivery(targetOrder);
                      } else {
                        handleUpdateOrderStatus(targetOrder, (item.code || item.id) as OrderStatus);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? `${badge.bg} ${badge.text} ${badge.border} ring-2 ring-current/40 font-bold shadow-md`
                        : isDark
                        ? 'bg-[#070f1e] border-slate-800 text-slate-200 hover:bg-[#0d1c38]'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badge.dot}`} />
                      <span className="text-xs font-bold truncate">{item.label}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider ml-1">
                          Atual
                        </span>
                      )}
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
        onSuccess={(updatedOrder) => {
          setOrderForDelivery(null);
          setOrders(StorageService.getOrders());
        }}
      />

      {/* Archive / Location Selection Modal */}
      {orderForArchiveLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
          onClick={() => setOrderForArchiveLocation(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border space-y-4 cursor-default animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0a1426] border-zinc-500/70 text-white shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                : 'bg-white border-zinc-400 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-600 text-amber-400 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-black text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Localização no Arquivo
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    OS #{orderForArchiveLocation.orderNumber} • {orderForArchiveLocation.brand} {orderForArchiveLocation.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderForArchiveLocation(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Onde está guardado o aparelho? (Ex: Gaveta, Prateleira, Caixa)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={archiveLocationInput}
                  onChange={(e) => setArchiveLocationInput(e.target.value)}
                  placeholder="Ex: Gaveta 1, Prateleira B, Armário 2..."
                  className="w-full px-3 py-2.5 bg-[#040c1e] border border-zinc-500/80 focus:border-amber-400 rounded-xl text-sm font-bold text-amber-300 placeholder-slate-500 focus:outline-hidden font-sans shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmArchiveLocation();
                    }
                  }}
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Gaveta 1', 'Gaveta 2', 'Gaveta 3', 'Prateleira A', 'Prateleira B', 'Armário 1', 'Armário 2', 'Caixa 1', 'Caixa 2', 'Galpão'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setArchiveLocationInput(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        archiveLocationInput === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-105 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* OPÇÃO OPCIONAL: Prometeu consertar celular em tal data */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={hasPromisedDate}
                    onChange={(e) => setHasPromisedDate(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-black text-purple-200 block">
                      📅 Agendar Data Que o Cliente Prometeu Trazer (Opcional)
                    </span>
                    <span className="text-[10.5px] text-purple-300/80 block">
                      O cliente informou que vai trazer o celular tal dia para consertar?
                    </span>
                  </div>
                </label>

                {hasPromisedDate && (
                  <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-200 mb-1">
                        Dia / Mês / Ano do Retorno Prometido:
                      </label>
                      <input
                        type="date"
                        value={archivePromisedDate}
                        onChange={(e) => setArchivePromisedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#040c1e] border border-purple-400/80 focus:border-purple-300 rounded-xl text-xs font-black text-purple-200 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-200 mb-1">
                        Observação do Agendamento (Opcional):
                      </label>
                      <input
                        type="text"
                        value={archivePromisedNotes}
                        onChange={(e) => setArchivePromisedNotes(e.target.value)}
                        placeholder="Ex: Vai receber salário dia 10 / vir na parte da manhã..."
                        className="w-full px-3 py-2 bg-[#040c1e] border border-purple-400/50 focus:border-purple-300 rounded-xl text-xs text-purple-100 placeholder-purple-400/50 focus:outline-hidden"
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300">
                      🔔 <strong>Aviso Automático:</strong> No dia agendado, o sistema criará uma <strong>mensagem bem grandona na tela inicial</strong> alertando sobre este serviço com o botão <strong>"OK VISTO"</strong>.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setOrderForArchiveLocation(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmArchiveLocation()}
                className="px-5 py-2 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Localização</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send & Copy Customer Message Modal */}
      {sendModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
          onClick={() => setSendModalOrder(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border space-y-4 cursor-default animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0a1426] border-emerald-500/50 text-white shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                : 'bg-white border-emerald-400 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className={`font-black text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Enviar Mensagem de Orçamento
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cliente: <strong>{sendModalOrder.customerName}</strong> • OS #{sendModalOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendModalOrder(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality Mode Filter Selector Chips */}
            {(Number(sendModalOrder.partPriceFirstLine) > 0 || Number(sendModalOrder.partPricePremium) > 0) && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Selecione a Qualidade a Incluir na Mensagem:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Number(sendModalOrder.partPriceFirstLine) > 0 && Number(sendModalOrder.partPricePremium) > 0 && (
                    <button
                      type="button"
                      onClick={() => setSendModalMode('BOTH')}
                      className={`px-2.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center text-center gap-0.5 ${
                        sendModalMode === 'BOTH'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-[1.02]'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[12px]">👥 Ambas</span>
                      <span className="text-[9.5px] opacity-80 font-normal">Premium + 1ªL</span>
                    </button>
                  )}

                  {Number(sendModalOrder.partPricePremium) > 0 && (
                    <button
                      type="button"
                      onClick={() => setSendModalMode('PREMIUM')}
                      className={`px-2.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center text-center gap-0.5 ${
                        sendModalMode === 'PREMIUM'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-[1.02]'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[12px]">💎 Só Premium</span>
                      <span className="text-[9.5px] opacity-80 font-normal font-mono">
                        {formatCurrency((sendModalOrder.partPricePremium || 0) + (sendModalOrder.laborPrice || 0) - (sendModalOrder.discount || 0))}
                      </span>
                    </button>
                  )}

                  {Number(sendModalOrder.partPriceFirstLine) > 0 && (
                    <button
                      type="button"
                      onClick={() => setSendModalMode('FIRST_LINE')}
                      className={`px-2.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center text-center gap-0.5 ${
                        sendModalMode === 'FIRST_LINE'
                          ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-[1.02]'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[12px]">⭐ Só 1ª Linha</span>
                      <span className="text-[9.5px] opacity-80 font-normal font-mono">
                        {formatCurrency((sendModalOrder.partPriceFirstLine || 0) + (sendModalOrder.laborPrice || 0) - (sendModalOrder.discount || 0))}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Live Message Preview Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Pré-visualização do Texto da Mensagem:
              </span>
              <div className="p-3.5 rounded-xl bg-[#030917] border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto custom-scrollbar select-text leading-relaxed">
                {buildCustomerMessage(sendModalOrder, sendModalMode)}
              </div>
            </div>

            {/* Actions: Send WhatsApp & Copy */}
            <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={(e) => handleCopyCustomerMessage(e, sendModalOrder, sendModalMode)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  copiedOrderId === sendModalOrder.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {copiedOrderId === sendModalOrder.id ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleSendToClient(e, sendModalOrder, sendModalMode)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mandar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
