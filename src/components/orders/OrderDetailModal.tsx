import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Shield,
  Smartphone,
  CreditCard,
  DollarSign,
  Package,
  Calendar,
  X,
  Edit,
  Edit2,
  Hourglass,
  Puzzle,
  Plus,
  Trash2,
  Search,
  Check,
  Save,
  ChevronDown,
  Layers,
  Settings,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Send,
  Box,
  Archive,
  MapPin,
  Phone,
  Camera,
} from 'lucide-react';
import { ServiceOrder, OrderStatus, PaymentMethod, OrderPartItem, Product } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusBadgeClasses,
  cleanPhoneForWhatsApp,
  getCanonicalStatus,
  getPaymentMethodLabel,
  getDeviceThumbnail,
} from '../../services/formatters';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { PatternLock } from './PatternLock';
import { OrderDeliveryModal } from './OrderDeliveryModal';
import { ProductModal } from '../products/ProductModal';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit: (order: ServiceOrder) => void;
  onOpenPrint: (order: ServiceOrder, mode?: 'entrance' | 'internal' | 'receipt' | 'eulis') => void;
  onDelete?: (order: ServiceOrder) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onOpenPrint,
  onDelete,
}) => {
  const { isDark } = useTheme();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const currentUser = StorageService.getCurrentUser();

  // Local Reactive Order State (keeps status and items updated in real time)
  const [currentOrder, setCurrentOrder] = useState<ServiceOrder | null>(order || null);

  useEffect(() => {
    if (order) {
      const fresh = StorageService.getOrderById(order.id) || order;
      setCurrentOrder(fresh);
    }
  }, [order?.id, isOpen]);

  useEffect(() => {
    if (!order?.id) return;
    const unsub = StorageService.subscribe(() => {
      const fresh = StorageService.getOrderById(order.id);
      if (fresh) {
        setCurrentOrder(fresh);
      }
    });
    return unsub;
  }, [order?.id]);

  // Interactive Parts & Service State
  const [localParts, setLocalParts] = useState<OrderPartItem[]>([]);
  const [localCustomPrice, setLocalCustomPrice] = useState<number | null>(null);
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [showManagerAuthModal, setShowManagerAuthModal] = useState(false);
  const [managerPassInput, setManagerPassInput] = useState('');
  const [showManagerPassText, setShowManagerPassText] = useState(false);
  const [managerPassError, setManagerPassError] = useState('');
  const [localDiscount, setLocalDiscount] = useState<number>(0);
  const [localService, setLocalService] = useState<string>('');
  const [isEditingService, setIsEditingService] = useState(false);

  // Stock search and manual parts state
  const [partInputMode, setPartInputMode] = useState<'ESTOQUE' | 'AVULSO'>('ESTOQUE');
  const [showStockCatalog, setShowStockCatalog] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [showManualPartForm, setShowManualPartForm] = useState(false);
  const [manualPartName, setManualPartName] = useState('');
  const [manualPartQty, setManualPartQty] = useState(1);
  const [manualPartPrice, setManualPartPrice] = useState(0);

  // Product modal state inside OrderDetail
  const [showProductModalInDetail, setShowProductModalInDetail] = useState(false);
  const [productModalPrefillName, setProductModalPrefillName] = useState('');
  const [productToEditInDetail, setProductToEditInDetail] = useState<Product | null>(null);

  // Products from inventory
  const [products, setProducts] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const partSearchRef = useRef<HTMLDivElement>(null);

  // Inline Payment Rows State
  const [inlinePaymentRows, setInlinePaymentRows] = useState<{ id: string; method: string; amount: string | number }[]>([
    { id: 'iprow-1', method: 'PIX', amount: '' },
  ]);
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showArchiveLocationPrompt, setShowArchiveLocationPrompt] = useState(false);
  const [detailArchiveLocationInput, setDetailArchiveLocationInput] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);

  // Photo Attachment Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const current = currentOrder || order;
        if (!current) return;
        const updatedPhotos = [...(current.photosBefore || []), result];
        const updated: ServiceOrder = {
          ...current,
          photosBefore: updatedPhotos,
        };
        StorageService.saveOrder(updated);
        setCurrentOrder(updated);
        showToast('Foto anexada à OS com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync state whenever order changes or modal opens
  useEffect(() => {
    if (order) {
      setShowHistory(false);
      setShowArchiveLocationPrompt(false);
      setDetailArchiveLocationInput(order.archivedLocation || '');
      const partsLoaded = order.parts || (order.items ? order.items.filter((i) => i.type === 'PECA') : []) || [];
      setLocalParts(partsLoaded);
      const partsSub = partsLoaded.reduce(
        (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
        0
      );
      const initialLabor = order.laborPrice !== undefined && order.laborPrice >= 0
        ? order.laborPrice
        : Math.max(0, (order.totalPrice || 0) + (order.discount || 0) - partsSub);
      setLocalCustomPrice(initialLabor);
      setIsPriceUnlocked(false);
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
      setLocalDiscount(order.discount || 0);
      setLocalService(order.requestedService || order.performedService || order.technicalDiagnosis || '');
      setProducts(StorageService.getProducts());
      setIsEditingService(false);
      setPartSearch('');
      setIsPartSearchOpen(false);
      setShowManualPartForm(false);
      setPartInputMode('ESTOQUE');
      setShowStockCatalog(false);

      if (order.payments && order.payments.length > 0) {
        setInlinePaymentRows(
          order.payments.map((p, idx) => ({
            id: `iprow-${idx + 1}`,
            method: p.paymentMethod || order.paymentMethod || 'PIX',
            amount: p.amount ? String(p.amount) : '',
          }))
        );
      } else if (order.paymentMethod && order.paymentMethod !== 'A_PRAZO' && order.paymentStatus === 'PAGO') {
        setInlinePaymentRows([
          { id: 'iprow-1', method: order.paymentMethod, amount: String(order.totalPrice || 0) },
        ]);
      } else {
        setInlinePaymentRows([
          { id: 'iprow-1', method: (order.paymentMethod as any) || 'PIX', amount: '' },
        ]);
      }
    }
  }, [order?.id, isOpen]);

  // Handle outside click for part search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partSearchRef.current && !partSearchRef.current.contains(event.target as Node)) {
        setIsPartSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !order) return null;

  const targetOrder = currentOrder || order;
  const badge = getOrderStatusBadgeClasses(targetOrder.status);
  const canonical = getCanonicalStatus(targetOrder.status as string);

  // Filter products by search term
  const filteredProducts = partSearch.trim()
    ? products.filter((p) => {
        const q = partSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : [];

  // Live financial totals
  const partsTotal = localParts.reduce(
    (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
    0
  );
  const laborPrice = localCustomPrice !== null ? localCustomPrice : 0;
  const totalGross = laborPrice + partsTotal;
  const currentTotal = Math.max(0, totalGross - Number(localDiscount || 0));

  const handleVerifyManagerPassword = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (StorageService.verifyManagerPassword(managerPassInput)) {
      setIsPriceUnlocked(true);
      if (localCustomPrice === null) {
        setLocalCustomPrice(laborPrice);
      }
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
    } else {
      setManagerPassError('Senha do gerente incorreta.');
    }
  };

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

  // Status Change Handler
  const handleUpdateStatus = (newStatus: OrderStatus, reason?: string) => {
    const current = currentOrder || order;
    if (!current) return;
    if (isDeliveredStatus(newStatus as string)) {
      setShowDeliveryModal(true);
      return;
    }
    if (isArchivedStatus(newStatus as string)) {
      setDetailArchiveLocationInput(current.archivedLocation || '');
      setShowArchiveLocationPrompt(true);
      return;
    }
    const success = StorageService.updateOrderStatus(
      current.id,
      newStatus,
      reason || `Status alterado para ${getOrderStatusLabel(newStatus)} por ${currentUser.name}`
    );
    if (success) {
      const fresh = StorageService.getOrderById(current.id);
      if (fresh) setCurrentOrder(fresh);
      showToast(`Status alterado com sucesso para "${getOrderStatusLabel(newStatus)}"`);
    }
  };

  const handleSaveArchiveLocation = (customLoc?: string) => {
    const current = currentOrder || order;
    if (!current) return;
    const loc = (customLoc !== undefined ? customLoc : detailArchiveLocationInput).trim();
    const updated: ServiceOrder = {
      ...current,
      status: 'ARQUIVADO',
      archivedLocation: loc || undefined,
      statusHistory: [
        ...(current.statusHistory || []),
        {
          status: 'ARQUIVADO',
          changedAt: new Date().toISOString(),
          changedBy: currentUser?.name || 'Administrador',
          notes: `Status alterado para Arquivado.${loc ? ` Localização: ${loc}` : ''}`,
        },
      ],
    };
    StorageService.saveOrder(updated);
    setCurrentOrder(updated);
    setShowArchiveLocationPrompt(false);
    showToast(`OS arquivada com sucesso! Local: ${loc || 'Não informado'}`);
  };

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Payment methods options (Deduplicated automatically)
  const allInlinePaymentOptions = StorageService.getDeduplicatedPaymentOptions();

  const handleAddInlinePaymentRow = () => {
    setInlinePaymentRows((prev) => [
      ...prev,
      { id: `iprow-${Date.now()}`, method: 'PIX', amount: '' },
    ]);
  };

  const handleUpdateInlineRowMethod = (id: string, method: string) => {
    setInlinePaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, method } : row))
    );
  };

  const handleUpdateInlineRowAmount = (id: string, amount: string) => {
    setInlinePaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount } : row))
    );
  };

  const handleRemoveInlineRow = (id: string) => {
    if (inlinePaymentRows.length <= 1) return;
    setInlinePaymentRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Save changes directly to order in StorageService
  const saveUpdatedOrder = (
    partsToSave: OrderPartItem[],
    customPrice: number | null,
    disc: number,
    service: string,
    extraPayments?: { paymentMethod: PaymentMethod | string; amount: number; date?: string }[]
  ) => {
    const target = currentOrder || order;
    if (!target) return target;

    const calculatedPartsTotal = partsToSave.reduce(
      (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
      0
    );
    const baseLabor = customPrice !== null ? customPrice : 0;
    const gross = baseLabor + calculatedPartsTotal;
    const discountVal = Math.max(0, Number(disc) || 0);
    const calculatedFinalTotal = Math.max(0, gross - discountVal);

    const activeSplits =
      extraPayments !== undefined
        ? extraPayments
        : inlinePaymentRows
            .filter((r) => Number(r.amount) > 0)
            .map((p) => ({
              paymentMethod: p.method as PaymentMethod,
              amount: Number(p.amount),
              date: new Date().toISOString(),
            }));

    const sumPaid = activeSplits.reduce((acc, r) => acc + Number(r.amount), 0);
    let newPaymentStatus: 'PENDENTE' | 'PAGO' | 'PARCIAL' = 'PENDENTE';
    if (calculatedFinalTotal > 0) {
      if (sumPaid >= calculatedFinalTotal) {
        newPaymentStatus = 'PAGO';
      } else if (sumPaid > 0) {
        newPaymentStatus = 'PARCIAL';
      }
    } else if (sumPaid > 0) {
      newPaymentStatus = 'PAGO';
    }

    const mainMethod =
      activeSplits.length === 1
        ? activeSplits[0].paymentMethod
        : activeSplits.length > 1
        ? 'MULTIPLO'
        : target.paymentMethod;

    const updatedOrder: ServiceOrder = {
      ...target,
      parts: partsToSave,
      items: partsToSave.map((p) => ({
        ...p,
        type: 'PECA' as const,
      })),
      laborPrice: baseLabor,
      partsPrice: calculatedPartsTotal,
      discount: discountVal,
      totalPrice: calculatedFinalTotal,
      requestedService: service.trim() || target.requestedService || '',
      performedService: service.trim() || target.performedService || '',
      technicalDiagnosis: service.trim() || target.technicalDiagnosis || '',
      payments: activeSplits,
      paymentMethod: mainMethod as any,
      paymentStatus: newPaymentStatus,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveOrder(updatedOrder);
    setCurrentOrder(updatedOrder);
    return updatedOrder;
  };

  const handleSaveInlinePayments = () => {
    const target = currentOrder || order;
    if (!target) return;
    setIsSavingPayments(true);

    try {
      const activeSplits = inlinePaymentRows.filter((r) => Number(r.amount) > 0);
      const paymentsArray = activeSplits.map((p) => ({
        paymentMethod: p.method as PaymentMethod,
        amount: Number(p.amount),
        date: new Date().toISOString(),
      }));

      const updated = saveUpdatedOrder(
        localParts,
        localCustomPrice,
        localDiscount,
        localService,
        paymentsArray
      );

      const totalNet = Number(updated.totalPrice) || 1;
      const grossValue = (Number(updated.laborPrice) || 0) + (Number(updated.partsPrice) || 0) || ((Number(updated.totalPrice) || 0) + (Number(updated.discount) || 0));
      const proportion = grossValue / totalNet;

      for (const p of activeSplits) {
        StorageService.addCashMovement({
          type: 'SERVICO_OS',
          description: `Recebimento OS #${updated.orderNumber} (${getPaymentMethodLabel(p.method)}) - ${updated.customerName}`,
          amount: Number(p.amount) * proportion,
          paymentMethod: p.method as PaymentMethod,
          referenceId: updated.id,
        });
      }

      showToast('Formas de pagamento e quitação salvas na OS!');
    } catch (err: any) {
      showToast('Erro ao salvar pagamentos na OS.');
    } finally {
      setIsSavingPayments(false);
    }
  };

  // Add inventory product as part
  const handleAddProductAsPart = (product: Product) => {
    const existingIndex = localParts.findIndex((p) => p.productId === product.id);
    const unitPrice = product.sellingPrice || (product as any).price || 0;
    let updated: OrderPartItem[];
    if (existingIndex >= 0) {
      updated = [...localParts];
      const item = updated[existingIndex];
      const newQty = item.quantity + 1;
      const sub = newQty * item.unitPrice - (item.discount || 0);
      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        total: sub,
        totalPrice: sub,
      };
    } else {
      const newItem: OrderPartItem = {
        id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'PECA',
        productId: product.id,
        productName: product.name,
        name: product.name,
        quantity: 1,
        unitPrice: unitPrice,
        unitCost: product.costPrice || 0,
        costPrice: product.costPrice || 0,
        discount: 0,
        total: unitPrice,
        totalPrice: unitPrice,
      };
      updated = [...localParts, newItem];
    }
    setLocalParts(updated);
    setPartSearch('');
    setIsPartSearchOpen(false);

    // Persist immediately to order
    saveUpdatedOrder(updated, localCustomPrice, localDiscount, localService);
    showToast(`Peça "${product.name}" adicionada à OS!`);
  };

  const handleOpenNewProductInDetail = (prefillName?: string) => {
    setIsPartSearchOpen(false);
    setProductToEditInDetail(null);
    setProductModalPrefillName(prefillName || partSearch || manualPartName || '');
    setShowProductModalInDetail(true);
  };

  const handleSaveProductInDetail = (savedProduct: Product) => {
    StorageService.saveProduct(savedProduct);
    const updatedProducts = StorageService.getProducts();
    setProducts(updatedProducts);
    handleAddProductAsPart(savedProduct);
    setShowProductModalInDetail(false);
    setProductToEditInDetail(null);
    setProductModalPrefillName('');
  };

  // Add manual part
  const handleAddManualPart = () => {
    if (!manualPartName.trim()) {
      alert('Informe o nome da peça');
      return;
    }
    const qty = Math.max(1, manualPartQty);
    const price = Math.max(0, manualPartPrice);
    const sub = qty * price;
    const newItem: OrderPartItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PECA',
      name: manualPartName.trim(),
      productName: manualPartName.trim(),
      quantity: qty,
      unitPrice: price,
      discount: 0,
      total: sub,
      totalPrice: sub,
    };
    const updated = [...localParts, newItem];
    setLocalParts(updated);
    setManualPartName('');
    setManualPartQty(1);
    setManualPartPrice(0);
    setShowManualPartForm(false);

    saveUpdatedOrder(updated, localCustomPrice, localDiscount, localService);
    showToast(`Peça "${newItem.name}" adicionada à OS!`);
  };

  // Update part quantity
  const handleUpdatePartQty = (id: string, delta: number) => {
    const updated = localParts
      .map((p) => {
        if (p.id === id) {
          const newQty = p.quantity + delta;
          if (newQty <= 0) return null;
          const sub = newQty * p.unitPrice - (p.discount || 0);
          return {
            ...p,
            quantity: newQty,
            total: sub,
            totalPrice: sub,
          };
        }
        return p;
      })
      .filter(Boolean) as OrderPartItem[];
    setLocalParts(updated);
    saveUpdatedOrder(updated, localCustomPrice, localDiscount, localService);
  };

  // Remove part
  const handleRemovePart = (id: string) => {
    const updated = localParts.filter((p) => p.id !== id);
    setLocalParts(updated);
    saveUpdatedOrder(updated, localCustomPrice, localDiscount, localService);
    showToast('Peça removida da OS');
  };

  const handleSaveAllFinancials = () => {
    saveUpdatedOrder(localParts, localCustomPrice, localDiscount, localService);
    showToast('Valores e peças salvos com sucesso na OS!');
  };

  // WhatsApp formatted message
  const cleanPhone = cleanPhoneForWhatsApp(order.customerPhone);
  const company = StorageService.getCompanySettings();

  const getWhatsAppMessage = () => {
    let msg = `Olá *${order.customerName}*, tudo bem?\n`;
    msg += `Aqui é da *${company.name}* informando sobre sua Ordem de Serviço *#${order.orderNumber}*.\n\n`;
    msg += `📱 *Aparelho:* ${order.brand} ${order.model}\n`;
    msg += `📌 *Status Atual:* ${getOrderStatusLabel(order.status)}\n`;

    if (canonical === 'AGUARDANDO_AUTORIZACAO' || canonical === 'ORCAMENTO') {
      msg += `💰 *Orçamento Estimado:* ${formatCurrency(currentTotal)}\n`;
      msg += `🔧 *Serviço/Defeito:* ${localService || order.clientDefect}\n`;
      msg += `\nPodemos prosseguir com o conserto? Por favor, responda com sua aprovação.`;
    } else if (canonical === 'PRONTO') {
      msg += `🎉 *Seu aparelho está PRONTO para retirada!*\n`;
      msg += `💰 *Valor Total:* ${formatCurrency(currentTotal)}\n`;
      msg += `🛡️ *Garantia:* ${order.warrantyDays} dias\n`;
      msg += `\nEndereço: ${company.address} - Aguardamos você!`;
    } else {
      msg += `💰 *Valor:* ${formatCurrency(currentTotal)}\n`;
      msg += `Qualquer dúvida estamos à disposição!`;
    }

    return encodeURIComponent(msg);
  };

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${getWhatsAppMessage()}`
    : '';

  if (!isOpen) return null;

  return (
    <>
      {/* Side Drawer Overlay Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl sm:max-w-2xl bg-[#081023] text-white border-l border-slate-700/80 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#060c1d] flex flex-col gap-3 shrink-0">
            {/* Header row 1: Title & Close Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                  #{targetOrder.orderNumber}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                    Detalhes da OS #{targetOrder.orderNumber}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Criado em {formatDate(targetOrder.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Fechar detalhes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header row 2: Action Bar (Status Selector Pill + Imprimir + Editar) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 flex-wrap">
              {/* Interactive Status Dropdown Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`px-3 py-1.5 text-xs font-black rounded-full border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dot || 'bg-current'}`} />
                  <span>{getOrderStatusLabel(targetOrder.status)}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-2xl bg-[#0b1428] border border-slate-700 p-2 shadow-2xl space-y-1">
                    {StorageService.getCustomOSStatuses().map((st) => {
                      const stCode = (st.code || st.id).toUpperCase();
                      const stBadge = getOrderStatusBadgeClasses(stCode);
                      return (
                        <button
                          key={st.id || st.code}
                          type="button"
                          onClick={() => {
                            setIsStatusDropdownOpen(false);
                            handleUpdateStatus((st.code || st.id) as OrderStatus);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 cursor-pointer ${stBadge.text}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${stBadge.dot || 'bg-current'}`} />
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions: Imprimir & Editar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrint(targetOrder);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(targetOrder);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-400 hover:text-emerald-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 2. Scrollable Drawer Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            {/* 1. Cliente */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Cliente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {targetOrder.customerPhone && (
                    <a
                      href={`tel:${targetOrder.customerPhone}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                      title="Ligar para cliente"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-emerald-500/40"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                  {targetOrder.customerName ? targetOrder.customerName[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">{targetOrder.customerName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{targetOrder.customerPhone}</p>
                </div>
              </div>
            </div>

            {/* 2. Aparelho */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Aparelho</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Garantia: {targetOrder.warrantyDays || 90} dias
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={getDeviceThumbnail(targetOrder)}
                  alt={targetOrder.model}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700/80 bg-slate-900 shrink-0 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-sm text-white">{targetOrder.brand} {targetOrder.model}</h4>
                  {targetOrder.imei && <p className="text-xs font-mono text-slate-400 mt-0.5">IMEI: {targetOrder.imei}</p>}
                  {targetOrder.serialNumber && <p className="text-xs font-mono text-slate-400">S/N: {targetOrder.serialNumber}</p>}
                </div>
              </div>
            </div>

            {/* 3. Defeito relatado */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Defeito relatado</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 leading-relaxed pl-6">
                {targetOrder.clientDefect || 'Nenhum defeito detalhado informado pelo cliente.'}
              </p>
            </div>

            {/* 4. Serviço executado */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Serviço executado</span>
                </div>
                {!isEditingService && (
                  <button
                    type="button"
                    onClick={() => setIsEditingService(true)}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Alterar</span>
                  </button>
                )}
              </div>

              {isEditingService ? (
                <div className="space-y-2 animate-in fade-in">
                  <textarea
                    rows={2}
                    value={localService}
                    onChange={(e) => setLocalService(e.target.value)}
                    placeholder="Informe o serviço executado na OS..."
                    className="w-full p-2.5 bg-[#040815] border border-cyan-500/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingService(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingService(false);
                        saveUpdatedOrder(localParts, localCustomPrice, localDiscount, localService);
                        showToast('Serviço atualizado!');
                      }}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-200 leading-relaxed pl-6">
                  {localService || targetOrder.requestedService || targetOrder.performedService || targetOrder.technicalDiagnosis || 'Nenhum serviço registrado.'}
                </p>
              )}
            </div>

            {/* 5. Valor do serviço */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Valor do serviço</span>
                </div>
                <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {formatCurrency(currentTotal)}
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`px-3 py-1.5 text-xs font-black rounded-full border flex items-center gap-1.5 cursor-pointer shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dot || 'bg-current'}`} />
                  <span>{getOrderStatusLabel(targetOrder.status)}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6. Observações */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-slate-300" />
                <span>Observações</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                {targetOrder.internalNotes || targetOrder.notes || 'Sem observações adicionais.'}
              </p>
            </div>

            {/* 7. Fotos anexas com upload [+] */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Fotos anexas</span>
                </div>

                <label className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anexar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {((targetOrder.photosBefore || []).concat(targetOrder.photosAfter || [])).length > 0 ? (
                  (targetOrder.photosBefore || []).concat(targetOrder.photosAfter || []).map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt={`Foto ${i + 1}`}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 hover:scale-105 transition-transform cursor-pointer shadow-xs"
                      onClick={() => window.open(imgUrl, '_blank')}
                    />
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhuma foto anexada a esta OS.</p>
                )}
              </div>
            </div>

            {/* 8. Histórico da OS */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Histórico da OS</span>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-slate-800 ml-2 pt-1">
                {((targetOrder.history && targetOrder.history.length > 0) || (targetOrder.statusHistory && targetOrder.statusHistory.length > 0)) ? (
                  (targetOrder.history && targetOrder.history.length > 0 ? targetOrder.history : (targetOrder.statusHistory || [])).map((h: any, i: number) => (
                    <div key={i} className="relative pl-4 text-xs space-y-0.5">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-[#0b1428]" />
                      <p className="font-bold text-white">
                        {getOrderStatusLabel(h.status || h.toStatus)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(h.timestamp || h.changedAt)} por {h.userName || h.changedBy || 'Sistema'}
                      </p>
                      {h.notes && <p className="text-[11px] text-slate-300">{h.notes}</p>}
                    </div>
                  ))
                ) : (
                  <div className="relative pl-4 text-xs">
                    <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-[#0b1428]" />
                    <p className="font-bold text-white">OS criada</p>
                    <p className="text-[10px] text-slate-400">{formatDate(targetOrder.createdAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 9. Gestão Detalhada de Peças e Valores (Collapsible) */}
            <div className="p-3.5 rounded-2xl bg-[#0b1428] border border-slate-800/90 space-y-3">
              <button
                type="button"
                onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                className="w-full flex items-center justify-between text-xs font-black uppercase text-slate-300 tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Peças, Mão de Obra e Pagamento</span>
                </div>
                <span className="text-cyan-400 font-bold">{showFinancialDetails ? '▲ Ocultar' : '▼ Gerenciar'}</span>
              </button>

              {showFinancialDetails && (
                <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in">
                  {/* Stock search & parts list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Peças no Estoque</span>
                    <div className="relative" ref={partSearchRef}>
                      <input
                        type="text"
                        value={partSearch}
                        onChange={(e) => {
                          setPartSearch(e.target.value);
                          setIsPartSearchOpen(true);
                        }}
                        placeholder="Buscar peça no estoque..."
                        className="w-full p-2.5 bg-[#040815] border border-slate-700 rounded-xl text-xs text-white"
                      />
                      {isPartSearchOpen && filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1428] border border-slate-700 rounded-xl p-2 z-50 max-h-48 overflow-y-auto space-y-1">
                          {filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddProductAsPart(p)}
                              className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs flex justify-between cursor-pointer"
                            >
                              <span>{p.name}</span>
                              <span className="font-mono text-emerald-400">{formatCurrency(p.sellingPrice)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Added parts list */}
                    {localParts.map((part) => (
                      <div key={part.id} className="flex items-center justify-between p-2 rounded-xl bg-[#040815] border border-slate-800 text-xs">
                        <div>
                          <p className="font-bold text-white">{part.name}</p>
                          <span className="text-[10px] text-slate-400">Qtd: {part.quantity} x {formatCurrency(part.unitPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">{formatCurrency(part.totalPrice || part.quantity * part.unitPrice)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.id)}
                            className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Labor & Discount Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Labor */}
                    <div className="p-3 rounded-xl bg-[#040815] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Mão de Obra</span>
                        {!isPriceUnlocked ? (
                          <button
                            type="button"
                            onClick={() => setShowManagerAuthModal(true)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>Liberar</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Unlock className="w-2.5 h-2.5" /> Sim
                          </span>
                        )}
                      </div>

                      {isPriceUnlocked ? (
                        <input
                          type="number"
                          value={localCustomPrice !== null ? localCustomPrice : 0}
                          onChange={(e) => setLocalCustomPrice(Number(e.target.value))}
                          className="w-full p-2 bg-[#081023] border border-amber-500/60 rounded-lg text-xs font-mono font-bold text-amber-300"
                        />
                      ) : (
                        <div className="p-2 text-xs font-mono text-slate-400 font-bold">
                          {formatCurrency(laborPrice)}
                        </div>
                      )}
                    </div>

                    {/* Discount */}
                    <div className="p-3 rounded-xl bg-[#040815] border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">Desconto (R$)</span>
                      <input
                        type="number"
                        min="0"
                        value={localDiscount !== null ? localDiscount : 0}
                        onChange={(e) => setLocalDiscount(Number(e.target.value))}
                        className="w-full p-2 bg-[#081023] border border-slate-700 focus:border-cyan-500/60 rounded-lg text-xs font-mono font-bold text-rose-300"
                      />
                    </div>
                  </div>

                  {/* Total Final da OS */}
                  <div className="p-3.5 rounded-xl bg-[#040815] border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
                      <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Mão de Obra: <strong className="text-amber-300">{formatCurrency(laborPrice)}</strong> + Peças: <strong className="text-cyan-400">{formatCurrency(partsTotal)}</strong> - Desconto: <strong className="text-rose-400">{formatCurrency(localDiscount)}</strong>
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total da OS</span>
                          <span className="text-lg font-black text-emerald-400">
                            {formatCurrency(currentTotal)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveAllFinancials}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Formas e Registro de Pagamentos na OS */}
                  {(() => {
                    const sumInlinePaid = inlinePaymentRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                    const diffInlinePaid = (currentTotal || 0) - sumInlinePaid;
                    return (
                      <div className={`p-3 rounded-xl border space-y-2.5 mt-2.5 ${
                        isDark ? 'bg-[#060e22] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {/* Header compacto */}
                        <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-700/50">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Formas de Pagamento
                            </h4>
                          </div>

                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            targetOrder?.paymentStatus === 'PAGO'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : targetOrder?.paymentStatus === 'PARCIAL'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          }`}>
                            {targetOrder?.paymentStatus === 'PAGO' ? '● PAGO (100%)' : targetOrder?.paymentStatus === 'PARCIAL' ? '● PAGTO PARCIAL' : '● PENDENTE'}
                          </span>
                        </div>

                        {/* Active Payment Rows (Compact list) */}
                        <div className="space-y-1.5">
                          {inlinePaymentRows.map((row) => (
                            <div key={row.id} className="flex items-center gap-1.5 w-full max-w-full overflow-hidden">
                              {/* Select de Forma de Pagamento */}
                              <div className="flex-1 min-w-0">
                                <select
                                  value={row.method}
                                  onChange={(e) => handleUpdateInlineRowMethod(row.id, e.target.value)}
                                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold border focus:outline-hidden cursor-pointer truncate ${
                                    isDark
                                      ? 'bg-[#040a17] text-white border-slate-700 focus:border-teal-500'
                                      : 'bg-white text-slate-900 border-slate-300 focus:border-teal-600'
                                  }`}
                                >
                                  {allInlinePaymentOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id} className={isDark ? 'bg-[#091632] text-white' : 'bg-white text-slate-900'}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Input de Valor */}
                              <div className="relative w-28 sm:w-32 shrink-0">
                                <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0,00"
                                  value={row.amount}
                                  onChange={(e) => handleUpdateInlineRowAmount(row.id, e.target.value)}
                                  className={`w-full pl-7 pr-2 py-1.5 rounded-lg text-xs font-black border focus:outline-hidden ${
                                    isDark
                                      ? 'bg-[#040a17] text-teal-300 border-slate-700 focus:border-teal-500'
                                      : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-teal-600'
                                  }`}
                                />
                              </div>

                              {/* Remover */}
                              {inlinePaymentRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInlineRow(row.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Remover forma"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions & Resumo compacto na mesma linha */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
                          <button
                            type="button"
                            onClick={handleAddInlinePaymentRow}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 border border-dashed border-teal-500/40 rounded-lg hover:bg-teal-500/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Adicionar outra forma</span>
                          </button>

                          <div className="flex items-center gap-3 text-xs font-bold justify-between sm:justify-end">
                            <span className="text-[11px] text-slate-400">
                              Informado: <strong className="text-emerald-400">{formatCurrency(sumInlinePaid)}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {diffInlinePaid <= 0 ? (
                                <strong className="text-emerald-400">Quitado (100%)</strong>
                              ) : (
                                <>Faltando: <strong className="text-rose-400">{formatCurrency(diffInlinePaid)}</strong></>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Save Payment button */}
                        <div className="flex justify-end pt-2 border-t border-slate-700/40">
                          <button
                            type="button"
                            onClick={handleSaveInlinePayments}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Pagamento</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* 3. Fixed Drawer Footer CTAs */}
          <div className="p-4 border-t border-slate-800/90 bg-[#060c1d] flex items-center justify-between gap-3 shrink-0">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(targetOrder);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir OS</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdateStatus('CANCELADA')}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancelar OS</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeliveryModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:scale-102 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Marcar como Entregue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Delivery & Payment Modal (Supports Cash & A Prazo / Fiado) */}
      <OrderDeliveryModal
        isOpen={showDeliveryModal}
        order={targetOrder}
        onClose={() => setShowDeliveryModal(false)}
        onSuccess={() => setShowDeliveryModal(false)}
      />

      {/* Manager Password Prompt Modal */}
      {showManagerAuthModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowManagerAuthModal(false);
          }}
        >
          <div
            className="bg-[#0b1328] border-2 border-amber-500/60 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(245,158,11,0.4)] space-y-4 animate-in zoom-in-95 duration-150 cursor-default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Autorização do Gerente
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Liberar edição manual do valor da OS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManagerAuthModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVerifyManagerPassword(e);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Digite a Senha do Gerente
                </label>
                <div className="relative">
                  <input
                    type={showManagerPassText ? 'text' : 'password'}
                    autoFocus
                    value={managerPassInput}
                    onChange={(e) => {
                      setManagerPassInput(e.target.value);
                      setManagerPassError('');
                    }}
                    placeholder="••••••"
                    className="w-full pl-3 pr-10 py-2.5 bg-[#040a17] border border-amber-500/50 rounded-xl text-sm font-mono font-bold text-amber-300 focus:outline-hidden focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowManagerPassText(!showManagerPassText);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-amber-400 cursor-pointer"
                    title={showManagerPassText ? 'Ocultar' : 'Exibir'}
                  >
                    {showManagerPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {managerPassError ? (
                  <span className="text-[11px] text-rose-400 font-bold block mt-1">
                    {managerPassError}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Autorização necessária para alteração de valores.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowManagerAuthModal(false);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Liberar Valor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full Product Registration Modal directly from Order Detail */}
      {showProductModalInDetail && (
        <ProductModal
          isOpen={showProductModalInDetail}
          onClose={() => {
            setShowProductModalInDetail(false);
            setProductToEditInDetail(null);
            setProductModalPrefillName('');
          }}
          onSave={handleSaveProductInDetail}
          productToEdit={productToEditInDetail}
          initialName={productModalPrefillName}
        />
      )}

      {/* Archive Location Prompt Modal */}
      {showArchiveLocationPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
          onClick={() => setShowArchiveLocationPrompt(false)}
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
                    OS #{targetOrder.orderNumber} • {targetOrder.brand} {targetOrder.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArchiveLocationPrompt(false)}
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
                  Onde está guardado o aparelho? (Ex: Gaveta, Prateleira, Armário)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={detailArchiveLocationInput}
                  onChange={(e) => setDetailArchiveLocationInput(e.target.value)}
                  placeholder="Ex: Gaveta 1, Prateleira B, Armário 2..."
                  className="w-full px-3 py-2.5 bg-[#040c1e] border border-zinc-500/80 focus:border-amber-400 rounded-xl text-sm font-bold text-amber-300 placeholder-slate-500 focus:outline-hidden font-sans shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveArchiveLocation();
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
                      onClick={() => setDetailArchiveLocationInput(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        detailArchiveLocationInput === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-105 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setShowArchiveLocationPrompt(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveArchiveLocation()}
                className="px-5 py-2 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Localização</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

