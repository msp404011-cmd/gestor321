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
} from '../../services/formatters';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { PatternLock } from './PatternLock';
import { OrderDeliveryModal } from './OrderDeliveryModal';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit: (order: ServiceOrder) => void;
  onOpenPrint: (order: ServiceOrder) => void;
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
  }, [order, isOpen]);

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
  const [partSearch, setPartSearch] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [showManualPartForm, setShowManualPartForm] = useState(false);
  const [manualPartName, setManualPartName] = useState('');
  const [manualPartQty, setManualPartQty] = useState(1);
  const [manualPartPrice, setManualPartPrice] = useState(0);

  // Products from inventory
  const [products, setProducts] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const partSearchRef = useRef<HTMLDivElement>(null);

  // Sync state whenever order changes or modal opens
  useEffect(() => {
    if (order) {
      const partsLoaded = order.parts || (order.items ? order.items.filter((i) => i.type === 'PECA') : []) || [];
      setLocalParts(partsLoaded);
      const partsSub = partsLoaded.reduce(
        (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
        0
      );
      const existingGross = (order.totalPrice || 0) + (order.discount || 0);
      if (existingGross !== partsSub || partsSub === 0) {
        setLocalCustomPrice(existingGross);
      } else {
        setLocalCustomPrice(null);
      }
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
    }
  }, [order, isOpen]);

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
  const effectiveBasePrice = localCustomPrice !== null ? localCustomPrice : partsTotal;
  const currentTotal = Math.max(0, effectiveBasePrice - Number(localDiscount || 0));

  const handleVerifyManagerPassword = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (StorageService.verifyManagerPassword(managerPassInput)) {
      setIsPriceUnlocked(true);
      if (localCustomPrice === null) {
        setLocalCustomPrice(effectiveBasePrice);
      }
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
    } else {
      setManagerPassError('Senha do gerente incorreta.');
    }
  };

  // Status Change Handler
  const handleUpdateStatus = (newStatus: OrderStatus, reason?: string) => {
    const current = currentOrder || order;
    if (!current) return;
    if (newStatus === 'ENTREGUE') {
      if (current.paymentStatus !== 'PAGO') {
        setShowDeliveryModal(true);
        return;
      }
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

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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

  // Save changes directly to order in StorageService
  const saveUpdatedOrder = (
    partsToSave: OrderPartItem[],
    customPrice: number | null,
    disc: number,
    service: string
  ) => {
    const calculatedPartsTotal = partsToSave.reduce(
      (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
      0
    );
    const base = customPrice !== null ? customPrice : calculatedPartsTotal;
    const calculatedFinalTotal = Math.max(0, base - Number(disc || 0));

    const updatedOrder: ServiceOrder = {
      ...order,
      parts: partsToSave,
      items: partsToSave.map((p) => ({
        ...p,
        type: 'PECA' as const,
      })),
      laborPrice: 0,
      partsPrice: calculatedPartsTotal,
      discount: Number(disc) || 0,
      totalPrice: calculatedFinalTotal,
      requestedService: service.trim() || order.requestedService,
      performedService: service.trim() || order.performedService,
      technicalDiagnosis: service.trim() || order.technicalDiagnosis,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveOrder(updatedOrder);
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

  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${getWhatsAppMessage()}` : '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              #{targetOrder.orderNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {targetOrder.brand} {targetOrder.model}
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {getOrderStatusLabel(targetOrder.status)}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cliente: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{targetOrder.customerName}</strong> ({targetOrder.customerPhone})
              </p>
            </div>
          </div>
        }
        size="4xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrint(targetOrder);
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir OS</span>
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(targetOrder);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-rose-500/10"
                  title="Excluir Ordem de Serviço"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir OS</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(targetOrder);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
                }`}
                title="Abrir formulário completo de edição da OS"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar OS Completa</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Quick Toast Notification */}
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
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

          <div className="lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start space-y-4 lg:space-y-0">
            {/* Coluna Esquerda: Status, Aparelho, Diagnóstico e Histórico */}
            <div className="lg:col-span-7 space-y-4">
              {/* Quick Status Workflow Action Bar */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border ${
                  isDark ? 'bg-[#081226] border-slate-700/80 shadow-md' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Etapa / Status Atual da OS:
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Clique para alterar instantaneamente
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('ORCAMENTO')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'ORCAMENTO'
                    ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-amber-300 border-slate-700'
                    : 'bg-white hover:bg-amber-50 text-amber-800 border-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Orçamento</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('AGUARDANDO_AUTORIZACAO')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'AGUARDANDO_AUTORIZACAO'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-purple-300 border-slate-700'
                    : 'bg-white hover:bg-purple-50 text-purple-800 border-slate-300'
                }`}
              >
                <Hourglass className="w-3.5 h-3.5 text-purple-400" />
                <span>Aguardando Autorização</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('AUTORIZADO')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'AUTORIZADO'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-cyan-300 border-slate-700'
                    : 'bg-white hover:bg-cyan-50 text-cyan-800 border-slate-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>Autorizado</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('AGUARDANDO_PECA')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'AGUARDANDO_PECA'
                    ? 'bg-orange-600 text-white border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.5)] ring-2 ring-orange-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-orange-300 border-slate-700'
                    : 'bg-white hover:bg-orange-50 text-orange-800 border-slate-300'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5 text-orange-400" />
                <span>Aguardando Peça</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('ATRASADO')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'ATRASADO'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.5)] ring-2 ring-rose-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-rose-300 border-slate-700'
                    : 'bg-white hover:bg-rose-50 text-rose-800 border-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Atrasado</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('PRONTO')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'PRONTO'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-emerald-300 border-slate-700'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border-slate-300'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pronto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (targetOrder.paymentStatus === 'PAGO') {
                    handleUpdateStatus('ENTREGUE');
                  } else {
                    setShowDeliveryModal(true);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canonical === 'ENTREGUE'
                    ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_14px_rgba(20,184,166,0.5)] ring-2 ring-teal-400/50'
                    : isDark
                    ? 'bg-[#0e1d38] hover:bg-[#172c54] text-teal-300 border-slate-700'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-slate-300'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-teal-400" />
                <span>Entregue</span>
              </button>
            </div>
          </div>

          {/* Details Grid: Defect & Diagnosis + Technical Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Defeito Relatado e SERVIÇO A SER FEITO */}
            <div
              className={`p-4 rounded-2xl border space-y-3.5 ${
                isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Defeito Relatado pelo Cliente
                </span>
                <p className={`text-sm font-semibold mt-1 leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {order.clientDefect || 'Problema não detalhado'}
                </p>
              </div>

              {/* SERVIÇO A SER FEITO COM CAMPO PARA COLOCAR / EDITAR */}
              <div className={`pt-3 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Serviço a Ser Feito / Solicitado</span>
                  </span>
                  {!isEditingService && (
                    <button
                      type="button"
                      onClick={() => setIsEditingService(true)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Alterar Serviço</span>
                    </button>
                  )}
                </div>

                {isEditingService ? (
                  <div className="space-y-2 animate-in fade-in">
                    <textarea
                      rows={2}
                      value={localService}
                      onChange={(e) => setLocalService(e.target.value)}
                      placeholder="Informe o serviço a ser feito (Ex: Troca de tela original, reparo de conector...)"
                      className="w-full p-2.5 bg-[#060e22] border border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLocalService(order.requestedService || order.performedService || '');
                          setIsEditingService(false);
                        }}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingService(false);
                          saveUpdatedOrder(localParts, localCustomPrice, localDiscount, localService);
                          showToast('Serviço atualizado com sucesso!');
                        }}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar Serviço</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#060e22] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={`text-xs font-semibold leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {localService || order.requestedService || order.performedService || order.technicalDiagnosis || (
                        <span className="text-slate-400 italic">Nenhum serviço informado ainda. Clique em "Alterar Serviço" acima para adicionar.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {order.technicalDiagnosis && order.technicalDiagnosis !== localService && (
                <div className={`pt-2.5 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Laudo / Diagnóstico Técnico
                  </span>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {order.technicalDiagnosis}
                  </p>
                </div>
              )}

              <div className={`pt-2.5 border-t space-y-2 text-xs ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Acessórios Deixados:</span>
                  <p className={`font-medium mt-0.5 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {order.accessories || 'Nenhum acessório adicional'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/40">
                  <span className="text-slate-400 block text-[11px] font-bold">Senha de Desbloqueio:</span>
                  {order.passwordPattern && order.passwordPattern.length > 0 ? (
                    <div className="mt-2 flex items-center gap-3">
                      <PatternLock
                        value={order.passwordPattern}
                        readOnly={true}
                        size={90}
                        theme={isDark ? 'dark' : 'light'}
                      />
                      <div>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold block">
                          Sequência: {order.passwordPattern.join(' ➔ ')}
                        </span>
                        {order.passwordPin && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {order.passwordPin}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : order.passwordPin?.startsWith('Desenho:') ? (
                    <div className="mt-1">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800 text-xs">
                        {order.passwordPin}
                      </span>
                    </div>
                  ) : (
                    <p className={`font-mono font-bold mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      {order.passwordPin || 'Sem senha informada'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Equipamento e Responsável */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dados Técnicos do Aparelho
                </span>
                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {order.deviceType}: {order.brand} {order.model}
                </p>
                {order.imei && (
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    IMEI: {order.imei}
                  </p>
                )}
                {order.serialNumber && (
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Serial: {order.serialNumber}
                  </p>
                )}
              </div>

              <div className={`pt-2.5 border-t grid grid-cols-2 gap-2 text-xs ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                <div>
                  <span className="text-slate-400 block text-[11px]">Técnico:</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {order.technicianName || 'Não atribuído'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Garantia:</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {order.warrantyDays} dias
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Abertura:</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Previsão:</span>
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {formatDate(order.estimatedCompletionDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit / Status Change History */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Histórico de Andamento da OS</span>
            </span>

            <div className="space-y-2 text-xs">
              {((targetOrder.history && targetOrder.history.length > 0) || (targetOrder.statusHistory && targetOrder.statusHistory.length > 0)) ? (
                (targetOrder.history && targetOrder.history.length > 0 ? targetOrder.history : (targetOrder.statusHistory || [])).map((h: any, i: number) => (
                  <div key={i} className={`flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                    <div className="flex-1">
                      <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {h.notes || h.note || 'Status atualizado'} — <span className="font-bold text-cyan-400">{getOrderStatusLabel(h.status || h.toStatus)}</span>
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(h.timestamp || h.changedAt)} por {h.userName || h.changedBy || 'Sistema'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs">Nenhum registro no histórico.</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Peças, Valores e Botão de Salvar */}
        <div className="lg:col-span-5 space-y-4">
          {/* ESPAÇO DEDICADO: PEÇAS E COMPONENTES UTILIZADOS (CONTABILIZAÇÃO NA OS) */}
          <div
            className={`p-4 rounded-2xl border space-y-3.5 ${
              isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Peças e Componentes Utilizados na OS
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  {localParts.length} item(ns) adicionados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualPartForm(!showManualPartForm)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showManualPartForm ? 'Fechar Peça Avulsa' : '+ Peça Avulsa'}</span>
                </button>
              </div>
            </div>

            {/* Campo de Busca de Peças no Estoque */}
            <div ref={partSearchRef} className="relative">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => {
                    setPartSearch(e.target.value);
                    setIsPartSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (partSearch.trim()) setIsPartSearchOpen(true);
                  }}
                  placeholder="Inserir peça: digite o nome da peça, código ou categoria para buscar no estoque..."
                  className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs border transition-colors ${
                    isDark
                      ? 'bg-[#060e22] border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-hidden'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden'
                  }`}
                />
                {partSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPartSearch('');
                      setIsPartSearchOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown de Resultados da Pesquisa de Peças */}
              {isPartSearchOpen && filteredProducts.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-2xl z-50 max-h-56 overflow-y-auto divide-y ${
                  isDark ? 'bg-[#091632] border-cyan-500/40 divide-slate-800 text-white' : 'bg-white border-blue-300 divide-slate-100 text-slate-900'
                }`}>
                  {filteredProducts.map((p) => {
                    const price = p.sellingPrice || (p as any).price || 0;
                    const stock = p.stockQuantity !== undefined ? p.stockQuantity : p.stock || 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleAddProductAsPart(p)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-cyan-950/50' : 'hover:bg-blue-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {p.category && <span>{p.category}</span>}
                            {p.barcode && <span>Cod: {p.barcode}</span>}
                            <span className={`px-1.5 py-0.2 rounded font-semibold ${
                              stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {stock > 0 ? `${stock} em estoque` : 'Sem estoque'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-400 block">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5 justify-end mt-0.5">
                            <Plus className="w-3 h-3" /> Inserir na OS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isPartSearchOpen && partSearch.trim() && filteredProducts.length === 0 && (
                <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-50 p-3 text-center text-xs ${
                  isDark ? 'bg-[#091632] border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
                }`}>
                  Nenhuma peça encontrada para "{partSearch}".
                  <button
                    type="button"
                    onClick={() => {
                      setManualPartName(partSearch);
                      setShowManualPartForm(true);
                      setIsPartSearchOpen(false);
                    }}
                    className="ml-2 font-bold text-cyan-400 underline cursor-pointer"
                  >
                    Adicionar como Peça Avulsa
                  </button>
                </div>
              )}
            </div>

            {/* Formulário de Peça Avulsa / Manual */}
            {showManualPartForm && (
              <div className={`p-3 rounded-xl border space-y-2.5 animate-in fade-in ${
                isDark ? 'bg-[#060e22] border-cyan-500/40' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Adicionar Peça / Componente Avulso</span>
                  <button
                    type="button"
                    onClick={() => setShowManualPartForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Nome / Descrição da Peça
                    </label>
                    <input
                      type="text"
                      value={manualPartName}
                      onChange={(e) => setManualPartName(e.target.value)}
                      placeholder="Ex: Conector Tipo-C, Bateria Premium..."
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                        isDark ? 'bg-[#091632] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualPartQty}
                      onChange={(e) => setManualPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                        isDark ? 'bg-[#091632] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Preço Unitário (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPartPrice}
                      onChange={(e) => setManualPartPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                        isDark ? 'bg-[#091632] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddManualPart}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir Peça na OS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Listagem de Peças Aplicadas na OS */}
            <div className={`divide-y rounded-xl overflow-hidden text-xs border ${
              isDark ? 'divide-slate-700/60 border-slate-700/60 bg-[#060e22]' : 'divide-slate-200 border-slate-200 bg-slate-50/60'
            }`}>
              {localParts.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Nenhuma peça cadastrada nesta OS ainda. Utilize o campo de busca acima ou clique em "+ Peça Avulsa" para adicionar.
                </div>
              ) : (
                localParts.map((p) => {
                  const sub = p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0);
                  return (
                    <div key={p.id} className="p-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                            {p.productName || p.name}
                          </span>
                          {p.productId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({p.productId})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Preço un: {formatCurrency(p.unitPrice)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdatePartQty(p.id, -1)}
                          className="w-6 h-6 rounded bg-slate-700/60 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                          title="Diminuir quantidade"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-xs">
                          {p.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePartQty(p.id, 1)}
                          className="w-6 h-6 rounded bg-slate-700/60 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                          title="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right shrink-0 w-24">
                        <span className={`font-bold text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatCurrency(sub)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemovePart(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0"
                        title="Remover peça da OS"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Contabilização Financeira: Valor Base da OS, Desconto e Total */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#060e22] border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Peças */}
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-[#081226] border-slate-700/60' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Subtotal Peças (R$)
                  </span>
                  <span className="text-sm font-black text-cyan-400 block mt-0.5">
                    {formatCurrency(partsTotal)}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    {localParts.length} peça(s)
                  </span>
                </div>

                {/* Valor da OS / Serviço (Editável com Senha do Gerente) */}
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isPriceUnlocked
                    ? isDark ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-amber-50 border-amber-300'
                    : isDark ? 'bg-[#081226] border-slate-700/60' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase block truncate">
                      Valor da OS (R$)
                    </span>
                    {isPriceUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Liberado</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setManagerPassError('');
                          setManagerPassInput('');
                          setShowManagerAuthModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 transition-all cursor-pointer"
                        title="Liberar edição com Senha do Gerente"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {isPriceUnlocked ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={localCustomPrice !== null ? localCustomPrice : partsTotal}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setLocalCustomPrice(val);
                        saveUpdatedOrder(localParts, val, localDiscount, localService);
                      }}
                      className={`w-full font-bold text-sm bg-transparent focus:outline-hidden border-b ${
                        isDark ? 'text-amber-300 border-amber-500/60 focus:border-amber-400' : 'text-slate-900 border-amber-400 focus:border-amber-500'
                      }`}
                    />
                  ) : (
                    <div
                      onClick={() => {
                        setManagerPassError('');
                        setManagerPassInput('');
                        setShowManagerAuthModal(true);
                      }}
                      className="cursor-pointer group flex items-center justify-between"
                      title="Clique para autorizar edição com senha do gerente"
                    >
                      <span className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        {formatCurrency(effectiveBasePrice)}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {isPriceUnlocked ? 'Valor manual autorizado' : 'Requer autorização'}
                  </span>
                </div>

                {/* Desconto */}
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-[#081226] border-slate-700/60' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Desconto (R$)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localDiscount}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setLocalDiscount(val);
                      saveUpdatedOrder(localParts, localCustomPrice, val, localService);
                    }}
                    className="w-full font-bold text-sm bg-transparent focus:outline-hidden border-b text-rose-400 border-slate-700 focus:border-rose-400"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    Abatimento
                  </span>
                </div>
              </div>

              {/* Total Final da OS */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Fórmula: <strong className="text-cyan-400">{formatCurrency(effectiveBasePrice)} (Base)</strong> - <strong className="text-rose-400">{formatCurrency(localDiscount)} (Desconto)</strong>
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
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Valores</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </Modal>

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
    </>
  );
};

