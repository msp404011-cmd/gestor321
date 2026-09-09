import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  Users,
  CreditCard,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  Layers,
  Settings,
  X,
  FileText,
  Tag,
  Calendar,
  Clock,
  Tv,
  Monitor,
  Store,
  Sliders,
  Edit3,
  Calculator,
  Package,
  Percent,
  Banknote,
  Check,
  Camera,
  RotateCcw,
  Sparkles,
  HelpCircle,
  DollarSign,
  Maximize2,
} from 'lucide-react';
import { Product, Sale, SaleItem, Customer, PaymentMethod } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate, cleanPhoneForWhatsApp } from '../../services/formatters';
import { PosReceiptModal, PrintPaperFormat } from './PosReceiptModal';
import { useTheme } from '../../context/ThemeContext';

interface PosViewProps {
  onOpenNewCustomer: () => void;
  onOpenCash: () => void;
  onClose?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  onOpenNewCustomer,
  onOpenCash,
  onClose,
}) => {
  const { isDark } = useTheme();
  const products = StorageService.getProducts();
  const customers = StorageService.getCustomers();
  const resellers = StorageService.getResellers();
  const cashSession = StorageService.getCashSession();
  const currentUser = StorageService.getCurrentUser();
  const company = StorageService.getCompanySettings();

  // Selected item index in the cart (displayed on Left Panel)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  // Top Selectors State
  const [saleType, setSaleType] = useState<'VENDA' | 'ORCAMENTO' | 'DEVOLUCAO' | 'CONSIGNACAO'>('VENDA');
  const [customerId, setCustomerId] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>(() => currentUser?.name || 'Loja');
  const [priceTable, setPriceTable] = useState<'VAREJO' | 'ATACADO'>('VAREJO');

  useEffect(() => {
    if (currentUser?.name) {
      setSellerName(currentUser.name);
    }
  }, [currentUser?.name]);

  // Barcode / Search Input State (Empty by default)
  const [barcodeSearchInput, setBarcodeSearchInput] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Discount & Payment State
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'VALUE' | 'PERCENT'>('VALUE');
  const [discountInput, setDiscountInput] = useState<string>('0,00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Modals State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [customerSearchInput, setCustomerSearchInput] = useState<string>('');
  const [isQtyModalOpen, setIsQtyModalOpen] = useState<boolean>(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [isPreSaleModalOpen, setIsPreSaleModalOpen] = useState<boolean>(false);
  const [isAlterSaleModalOpen, setIsAlterSaleModalOpen] = useState<boolean>(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState<boolean>(false);
  const [selectedPrintFormat, setSelectedPrintFormat] = useState<PrintPaperFormat>('80mm');
  const [finishedSale, setFinishedSale] = useState<Sale | null>(null);

  // Status to track if sale was started via F1 or barcode
  const [isSaleActive, setIsSaleActive] = useState<boolean>(false);

  // Initial cart: empty by default (zerado)
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time exactly as in screenshot: Ter, 16/09/2025 and 09:22:34
  const formattedDateTime = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[currentTime.getDay()];
    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    return {
      dateText: `${dayName}, ${day}/${month}/${year}`,
      timeText: `${hours}:${minutes}:${seconds}`,
    };
  }, [currentTime]);

  // Selected customer or reseller object
  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    const c = customers.find((cust) => cust.id === customerId);
    if (c) return c;
    const r = resellers.find((res) => res.id === customerId);
    if (r) return { id: r.id, name: r.name, phone: r.phone, document: r.document };
    return null;
  }, [customers, resellers, customerId]);

  // Active item in cart
  const activeCartItem: SaleItem | undefined = cart[selectedItemIndex] || cart[0];

  // Active product details object from inventory
  const activeProduct = useMemo(() => {
    if (activeCartItem) {
      const found = products.find(
        (p) => p.id === activeCartItem.productId || p.barcode === activeCartItem.barcode
      );
      if (found) return found;
    }
    return null;
  }, [activeCartItem, products]);

  // Filter matching products for live autocomplete
  const matchedProducts = useMemo(() => {
    const q = barcodeSearchInput.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const categoryMatch = (p.category || '').toLowerCase().includes(q);
        const modelMatch = (p.model || '').toLowerCase().includes(q);
        return nameMatch || barcodeMatch || skuMatch || categoryMatch || modelMatch;
      })
      .slice(0, 10);
  }, [products, barcodeSearchInput]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.total, 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    const num = parseFloat(discountInput.replace('.', '').replace(',', '.')) || 0;
    if (discountType === 'PERCENT') {
      return (subtotal * num) / 100;
    }
    return num;
  }, [subtotal, discountInput, discountType]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount);
  }, [subtotal, calculatedDiscount]);

  const totalCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.costPrice || 0) * item.quantity, 0);
  }, [cart]);

  const profit = Math.max(0, total - totalCost);

  // Add product to cart
  const addToCart = (prod: Product, qty = 1) => {
    setIsSaleActive(true);
    const existingIndex = cart.findIndex((i) => i.productId === prod.id);

    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + qty;
      if (prod.stockQuantity && newQty > prod.stockQuantity) {
        alert(`Estoque máximo atingido para ${prod.name} (${prod.stockQuantity} un disponíveis).`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * updated[existingIndex].unitPrice;
      setCart(updated);
      setSelectedItemIndex(existingIndex);
    } else {
      if (prod.stockQuantity !== undefined && prod.stockQuantity <= 0) {
        alert(`O produto ${prod.name} está esgotado no estoque!`);
        return;
      }
      const price = priceTable === 'VAREJO' ? prod.sellingPrice : (prod.resellerPrice || prod.sellingPrice);
      const newItem: SaleItem = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode || prod.sku,
        unit: prod.unit || 'UN',
        quantity: qty,
        unitPrice: price,
        unitCost: prod.costPrice,
        costPrice: prod.costPrice,
        discount: 0,
        total: price * qty,
      };
      const newCart = [...cart, newItem];
      setCart(newCart);
      setSelectedItemIndex(newCart.length - 1);
    }
  };

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (!item) return;
    const prod = products.find((p) => p.id === item.productId);
    if (prod && prod.stockQuantity && newQty > prod.stockQuantity) {
      alert(`Quantidade solicitada excede o estoque disponível (${prod.stockQuantity} un).`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].unitPrice;
    setCart(updated);
  };

  // Remove item
  const removeFromCart = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    if (selectedItemIndex >= updated.length) {
      setSelectedItemIndex(Math.max(0, updated.length - 1));
    }
  };

  // Clear / Cancel cart (F7)
  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Deseja realmente cancelar esta venda e limpar todos os itens?')) {
      setCart([]);
      setDiscountInput('0,00');
      setCustomerId('');
      setSaleNotes('');
      setSelectedItemIndex(0);
      setIsSaleActive(false);
    }
  };

  // Handle barcode search / submit
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = barcodeSearchInput.trim();
    if (!q) {
      barcodeInputRef.current?.focus();
      return;
    }

    // Check exact match first
    const exactMatch = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
        p.name.toLowerCase() === q.toLowerCase()
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setBarcodeSearchInput('');
      setIsSearchDropdownOpen(false);
      barcodeInputRef.current?.focus();
      return;
    }

    // Check partial matches from matchedProducts
    if (matchedProducts.length > 0) {
      const selected = matchedProducts[highlightedIndex] || matchedProducts[0];
      if (selected) {
        addToCart(selected);
        setBarcodeSearchInput('');
        setIsSearchDropdownOpen(false);
        barcodeInputRef.current?.focus();
        return;
      }
    }

    alert(`Nenhum produto encontrado com o código ou nome "${q}".`);
  };

  // Finalize Sale
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      alert('Adicione ao menos um produto para finalizar a venda.');
      return;
    }

    const amountReceived = parseFloat(amountReceivedInput.replace('.', '').replace(',', '.')) || total;
    const change = Math.max(0, amountReceived - total);
    const isResellerMatch = customerId && resellers.some((r) => r.id === customerId);

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      saleNumber: StorageService.getNextSaleNumber(),
      date: new Date().toISOString(),
      customerId: customerId || undefined,
      customerName: selectedCustomer?.name || 'CLIENTE PADRÃO',
      sellerId: currentUser.id,
      sellerName: sellerName || currentUser.name,
      items: cart,
      subtotal,
      discount: calculatedDiscount,
      total,
      totalCost,
      costTotal: totalCost,
      profit,
      paymentMethod,
      amountReceived,
      amountPaid: total,
      change,
      notes: saleNotes.trim() || undefined,
      priceTable,
      resellerId: isResellerMatch ? customerId : undefined,
    };

    StorageService.finalizeSale(newSale);

    // Reset Cart & trigger receipt modal
    setCart([]);
    setDiscountInput('0,00');
    setAmountReceivedInput('');
    setSaleNotes('');
    setCustomerId('');
    setIsSaleActive(false);
    setIsCheckoutModalOpen(false);
    setFinishedSale(newSale);
  };

  // Action to start or finalize sale using F1 shortcut
  const handleF1Action = () => {
    if (cart.length === 0) {
      // Iniciar Venda: ativa a venda e foca no campo de código de barras
      setIsSaleActive(true);
      setBarcodeSearchInput('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 50);
    } else if (!isCheckoutModalOpen) {
      // Finalizar Venda: abre a tela de recebimento/pagamento
      setIsCheckoutModalOpen(true);
    } else {
      // Já está com o modal de finalização aberto: confirma e conclui a venda
      handleFinalizeSale();
    }
  };

  // Print Dialog Action
  const handleOpenPrintDialog = () => {
    if (cart.length === 0 && !finishedSale) {
      alert('Adicione produtos para emitir comprovante.');
      return;
    }
    setIsPrintDialogOpen(true);
  };

  const handleSelectFormatAndPrint = (format: PrintPaperFormat) => {
    setSelectedPrintFormat(format);
    setIsPrintDialogOpen(false);

    if (finishedSale) {
      setFinishedSale({ ...finishedSale });
    } else if (cart.length > 0) {
      const customer = customers.find((c) => c.id === customerId);
      const previewSale: Sale = {
        id: 'preview-' + Date.now(),
        saleNumber: StorageService.getNextSaleNumber(),
        date: new Date().toISOString(),
        customerId: customerId || undefined,
        customerName: customer?.name || 'CLIENTE PADRÃO',
        sellerId: currentUser.id,
        sellerName: sellerName || currentUser.name,
        items: cart,
        subtotal,
        discount: calculatedDiscount,
        total,
        totalCost,
        costTotal: totalCost,
        profit,
        paymentMethod,
        amountReceived: total,
        amountPaid: total,
        change: 0,
        notes: saleNotes.trim() || undefined,
      };
      setFinishedSale(previewSale);
    }
  };

  // WhatsApp send
  const handleSendWhatsApp = () => {
    const saleData = finishedSale || (cart.length > 0 ? {
      saleNumber: StorageService.getNextSaleNumber(),
      date: new Date().toISOString(),
      customerName: selectedCustomer?.name || 'CLIENTE PADRÃO',
      sellerName: sellerName || currentUser.name,
      items: cart,
      subtotal,
      discount: calculatedDiscount,
      total,
      paymentMethod,
    } : null);

    if (!saleData) {
      alert('Adicione itens para enviar por WhatsApp.');
      return;
    }

    let text = `*COMPROVANTE DE VENDA - ${company.name.toUpperCase()}*\n`;
    text += `*Venda:* #${saleData.saleNumber}\n`;
    text += `*Data:* ${formatDate(saleData.date)}\n`;
    text += `*Cliente:* ${saleData.customerName}\n`;
    text += `*Vendedor:* ${saleData.sellerName}\n`;
    text += `--------------------------------\n`;
    text += `*ITENS:*\n`;
    saleData.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.productName} (${it.quantity}x ${formatCurrency(it.unitPrice)}) = ${formatCurrency(it.total)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*Subtotal:* ${formatCurrency(saleData.subtotal)}\n`;
    if (saleData.discount > 0) {
      text += `*Desconto:* -${formatCurrency(saleData.discount)}\n`;
    }
    text += `*TOTAL:* ${formatCurrency(saleData.total)}\n`;
    text += `*Forma de Pgto:* ${saleData.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `Agradecemos pela preferência!\n`;
    if (company.phone) text += `Contato: ${company.phone}`;

    const cleanPhone = cleanPhoneForWhatsApp(selectedCustomer?.phone);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    }
  };

  // Global Keyboard Shortcuts (F1 to F12, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if input or textarea is active (unless function key)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'F1') {
        e.preventDefault();
        handleF1Action();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsAlterSaleModalOpen(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsConsultModalOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (activeCartItem) {
          const newPriceStr = prompt('Novo preço unitário (R$):', activeCartItem.unitPrice.toFixed(2).replace('.', ','));
          if (newPriceStr) {
            const parsed = parseFloat(newPriceStr.replace('.', '').replace(',', '.'));
            if (!isNaN(parsed) && parsed >= 0) {
              const updated = [...cart];
              updated[selectedItemIndex].unitPrice = parsed;
              updated[selectedItemIndex].total = updated[selectedItemIndex].quantity * parsed;
              setCart(updated);
            }
          }
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0 && selectedItemIndex < cart.length) {
          removeFromCart(selectedItemIndex);
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleOpenPrintDialog();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsQtyModalOpen(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsCatalogModalOpen(true);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsNotesModalOpen(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        setIsPreSaleModalOpen(true);
      } else if (e.key === 'Escape') {
        const isAnyPosLocalModalOpen = 
          isCheckoutModalOpen || 
          isConsultModalOpen || 
          isCustomerModalOpen || 
          isQtyModalOpen || 
          isNotesModalOpen || 
          isCatalogModalOpen || 
          isPreSaleModalOpen || 
          isAlterSaleModalOpen || 
          isPrintDialogOpen;

        // If no POS-specific modal is open, but an external modal/dialog from App.tsx is open in the DOM,
        // ignore the escape key so that the external modal can close itself without closing the POS.
        const isDomModalOpen = document.body.style.overflow === 'hidden' || !!document.querySelector('.fixed.z-50');
        if (!isAnyPosLocalModalOpen && isDomModalOpen) {
          return;
        }

        if (isCheckoutModalOpen) setIsCheckoutModalOpen(false);
        else if (isConsultModalOpen) setIsConsultModalOpen(false);
        else if (isCustomerModalOpen) setIsCustomerModalOpen(false);
        else if (isQtyModalOpen) setIsQtyModalOpen(false);
        else if (isNotesModalOpen) setIsNotesModalOpen(false);
        else if (isCatalogModalOpen) setIsCatalogModalOpen(false);
        else if (isPreSaleModalOpen) setIsPreSaleModalOpen(false);
        else if (isAlterSaleModalOpen) setIsAlterSaleModalOpen(false);
        else if (isPrintDialogOpen) setIsPrintDialogOpen(false);
        else {
          e.preventDefault();
          window.location.hash = '#dashboard';
          onClose?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart,
    selectedItemIndex,
    activeCartItem,
    isCheckoutModalOpen,
    isConsultModalOpen,
    isCustomerModalOpen,
    isQtyModalOpen,
    isNotesModalOpen,
    isCatalogModalOpen,
    isPreSaleModalOpen,
    isAlterSaleModalOpen,
    isPrintDialogOpen,
  ]);

  // Auto-scaler for fit-to-screen behavior on any monitor/screen size
  const posOuterRef = useRef<HTMLDivElement>(null);
  const [zoomRatio, setZoomRatio] = useState(1);

  useEffect(() => {
    const handleZoomResize = () => {
      if (!posOuterRef.current) return;
      const element = posOuterRef.current;
      const parent = element.parentElement;
      if (!parent) return;

      const parentHeight = parent.clientHeight || window.innerHeight;
      const parentWidth = parent.clientWidth || window.innerWidth;

      // Reset transform temporarily to measure natural scroll dimensions
      element.style.transform = 'none';
      element.style.width = '100%';
      element.style.height = '100%';

      const naturalHeight = element.scrollHeight;
      const naturalWidth = element.scrollWidth;

      let scale = 1;
      if (naturalHeight > parentHeight && parentHeight > 0) {
        scale = Math.min(scale, parentHeight / naturalHeight);
      }
      if (naturalWidth > parentWidth && parentWidth > 0) {
        scale = Math.min(scale, parentWidth / naturalWidth);
      }

      // Clamp scale (min 0.35, max 1.0) to fit screen perfectly with no arbitrary margin
      const clampedScale = Math.max(0.35, Math.min(1.0, scale));
      setZoomRatio(clampedScale);
    };

    handleZoomResize();

    const parent = posOuterRef.current?.parentElement;
    const observer = new ResizeObserver(() => {
      handleZoomResize();
    });
    if (parent) {
      observer.observe(parent);
    }

    window.addEventListener('resize', handleZoomResize);
    const timer = setTimeout(handleZoomResize, 100);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleZoomResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020813]">
      <div
        ref={posOuterRef}
        style={{
          transform: zoomRatio < 1 ? `scale(${zoomRatio})` : 'none',
          transformOrigin: 'top center',
          width: zoomRatio < 1 ? `${(1 / zoomRatio) * 100}%` : '100%',
          height: zoomRatio < 1 ? `${(1 / zoomRatio) * 100}%` : '100%',
        }}
        className="bg-[#020813] text-slate-100 font-sans p-1.5 sm:p-2 flex flex-col justify-between gap-1.5 sm:gap-2 antialiased selection:bg-cyan-500 selection:text-white select-none overflow-hidden h-full"
      >
      
      {/* 1. TOP HEADER BAR */}
      <header className="bg-[#071328] border border-blue-900/60 rounded-lg px-2.5 py-1 shadow-sm flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-md shrink-0 border border-cyan-400/30">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 leading-none">
              {company.commercialName || company.name || 'TECHNOVA Informática'}
            </h1>
            <p className="text-[8px] uppercase font-bold tracking-wider text-blue-300/80 leading-none mt-0.5">
              PDV - PONTO DE VENDA
            </p>
          </div>
        </div>

        {/* Center: Search & Barcode Input Field with F4 button */}
        <div className="flex-1 max-w-lg mx-2">
          <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={barcodeSearchInput}
              onChange={(e) => {
                setBarcodeSearchInput(e.target.value);
                setIsSearchDropdownOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                if (barcodeSearchInput.trim().length > 0) setIsSearchDropdownOpen(true);
              }}
              placeholder="Digite o código ou nome do produto..."
              className="w-full pl-8 pr-12 py-1 bg-[#040b19] border border-blue-800/80 hover:border-cyan-400/80 focus:border-cyan-400 rounded text-xs text-white placeholder-slate-400 font-medium focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#0a1b33] hover:bg-cyan-950 border border-blue-900/80 text-cyan-400 font-black text-[10px] rounded shadow-sm cursor-pointer transition-colors"
              title="Pressione F4 para focar e buscar produto"
            >
              F4
            </button>
          </form>
        </div>

        {/* Right: Operator, Date/Time, Fullscreen, Terminal Badge */}
        <div className="flex items-center gap-2 text-[11px]">
          {/* Operator Pill */}
          <div
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#040b19] border border-blue-900/80 rounded px-2 py-0.5 cursor-pointer hover:border-cyan-500/60 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600/80 text-cyan-200 flex items-center justify-center font-bold text-[10px]">
              <User className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none">Operador</p>
              <div className="flex items-center gap-0.5 font-bold text-white text-[11px] leading-tight">
                <span>{currentUser.name || 'Marcos Silva'}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Live Date & Clock Card */}
          <div className="bg-[#040b19] border border-blue-900/80 rounded px-2 py-0.5 text-right flex flex-col justify-center">
            <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-cyan-300 leading-none">
              <Calendar className="w-2.5 h-2.5 text-cyan-400" />
              <span>{formattedDateTime.dateText}</span>
            </div>
            <div className="flex items-center justify-end gap-1 text-[11px] font-black text-emerald-400 leading-none mt-0.5 tracking-wider">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{formattedDateTime.timeText}</span>
            </div>
          </div>

          {/* Monitor / Screen Button */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="w-6 h-6 rounded bg-[#040b19] border border-blue-900/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 flex items-center justify-center cursor-pointer transition-all"
            title="Alternar Tela Cheia"
          >
            <Monitor className="w-3 h-3" />
          </button>

          {/* Terminal ID Badge */}
          <div className="flex items-center gap-1 bg-[#040b19] border border-blue-900/80 rounded px-2 py-0.5 font-black text-[11px] text-white">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>PDV 01</span>
          </div>


        </div>
      </header>

      {/* 2. SECOND TOP BAR: 4 CONFIGURATION SELECTORS (Identical to Image) */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 shrink-0">
        
        {/* Selector 1: Tipo de Venda */}
        <div className="col-span-1 lg:col-span-2 flex flex-col">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Tipo de Venda
          </label>
          <div className="flex items-center justify-between bg-[#040b19]/90 border border-blue-900/60 rounded px-2.5 py-1.5 text-xs text-white font-bold cursor-pointer hover:border-cyan-400 transition-colors">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Venda (PDV)</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Selector 2: Cliente */}
        <div className="col-span-1 lg:col-span-6 flex flex-col">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Cliente
          </label>
          <div
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center justify-between bg-[#040b19]/90 border border-blue-900/60 rounded px-2.5 py-1.5 text-xs text-white font-bold cursor-pointer hover:border-cyan-400 transition-colors group truncate"
          >
            <div className="flex items-center gap-2 truncate">
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate uppercase">{selectedCustomer ? selectedCustomer.name : 'CLIENTE PADRÃO'}</span>
            </div>
            <div className="text-cyan-400 group-hover:text-cyan-200 shrink-0">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Selector 3: Vendedor */}
        <div className="col-span-1 lg:col-span-2 flex flex-col">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Vendedor
          </label>
          <div className="flex items-center justify-between bg-[#040b19]/90 border border-blue-900/60 rounded px-2.5 py-1.5 text-xs text-white font-bold cursor-pointer hover:border-cyan-400 transition-colors">
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{sellerName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Selector 4: Tabela de Preço (Venda Cliente Final vs Venda Revendedor) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Tipo de Venda / Tabela
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[#040b19]/90 border border-blue-900/60 rounded p-1">
            <button
              type="button"
              onClick={() => {
                if (priceTable === 'VAREJO') return;
                setPriceTable('VAREJO');
                const updatedCart = cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (product) {
                    const newPrice = product.sellingPrice;
                    return {
                      ...item,
                      unitPrice: newPrice,
                      total: newPrice * item.quantity,
                    };
                  }
                  return item;
                });
                setCart(updatedCart);
              }}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-[11px] font-black transition-all cursor-pointer ${
                priceTable === 'VAREJO'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/50'
              }`}
              title="Venda para Consumidor Final (Preço de Varejo)"
            >
              <Tag className="w-3 h-3" />
              <span>Cliente Final</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (priceTable === 'ATACADO') return;
                setPriceTable('ATACADO');
                if (paymentMethod === 'BOLETO') {
                  setPaymentMethod('FIADO');
                }
                const updatedCart = cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (product) {
                    const newPrice = product.resellerPrice || product.sellingPrice;
                    return {
                      ...item,
                      unitPrice: newPrice,
                      total: newPrice * item.quantity,
                    };
                  }
                  return item;
                });
                setCart(updatedCart);
              }}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-[11px] font-black transition-all cursor-pointer ${
                priceTable === 'ATACADO'
                  ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/50'
              }`}
              title="Venda para Revendedor / Técnico (Preço de Revenda)"
            >
              <Users className="w-3 h-3" />
              <span>Revendedor</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT BODY: LEFT PRODUCT SCAN & SPECS (5 COLS), RIGHT SALES ITEMS & KPIS (7 COLS) */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4.5 items-stretch flex-1 min-h-0 overflow-y-auto">
        
        {/* LEFT COLUMN: PRODUCT SCAN, ACTIVE PRODUCT DETAILS, METRICS & PHOTO (5 Cols) */}
        <div className="lg:col-span-5 bg-[#071328] border border-blue-900/60 rounded-xl p-2 space-y-2 shadow-[0_4px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-0 relative">
          
          {/* Top Barcode / Name Input Section with Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="space-y-0.5 relative z-30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 block">
                Produto (Código ou Nome)
              </label>
              <span className="text-[10px] text-cyan-400 font-medium">
                [F4] Buscar / Inserir
              </span>
            </div>
            
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none z-10">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeSearchInput}
                onChange={(e) => {
                  setBarcodeSearchInput(e.target.value);
                  setIsSearchDropdownOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => {
                  if (barcodeSearchInput.trim().length > 0) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (matchedProducts.length > 0) {
                      setIsSearchDropdownOpen(true);
                      setHighlightedIndex((prev) => (prev + 1) % matchedProducts.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (matchedProducts.length > 0) {
                      setIsSearchDropdownOpen(true);
                      setHighlightedIndex((prev) => (prev - 1 + matchedProducts.length) % matchedProducts.length);
                    }
                  } else if (e.key === 'Escape') {
                    setIsSearchDropdownOpen(false);
                  } else if (e.key === 'Enter') {
                    if (isSearchDropdownOpen && matchedProducts.length > 0) {
                      e.preventDefault();
                      const selected = matchedProducts[highlightedIndex] || matchedProducts[0];
                      if (selected) {
                        addToCart(selected);
                        setBarcodeSearchInput('');
                        setIsSearchDropdownOpen(false);
                      }
                    }
                  }
                }}
                placeholder="Digite o código de barras ou nome do produto..."
                className="w-full pl-9 pr-16 py-1.5 bg-[#040b19] border border-blue-900/80 hover:border-cyan-400/80 focus:border-cyan-400 rounded-lg text-xs text-white font-medium focus:outline-none shadow-inner transition-colors placeholder-slate-500"
              />

              {/* Clear button if text entered */}
              {barcodeSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeSearchInput('');
                    setIsSearchDropdownOpen(false);
                    barcodeInputRef.current?.focus();
                  }}
                  className="absolute right-11 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer z-10"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* F4 Button */}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-md border border-emerald-400/30 cursor-pointer shadow-sm transition-all z-10"
                title="Pressione F4 para buscar ou adicionar produto"
              >
                F4
              </button>
            </form>

            {/* LIVE AUTOCOMPLETE DROPDOWN */}
            {isSearchDropdownOpen && barcodeSearchInput.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#051329] border border-cyan-500/60 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-blue-950/80">
                {matchedProducts.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    <p className="font-bold text-slate-300">Nenhum produto encontrado</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tente outro nome, código de barras ou SKU</p>
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-1.5 bg-[#020b18] text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between border-b border-blue-900/40">
                      <span>Produtos encontrados ({matchedProducts.length})</span>
                      <span className="text-slate-400 text-[9px] font-normal">Use ↑ ↓ e Enter para selecionar</span>
                    </div>
                    {matchedProducts.map((p, idx) => {
                      const price = priceTable === 'VAREJO' ? p.sellingPrice : (p.resellerPrice || p.sellingPrice);
                      const isHighlighted = idx === highlightedIndex;
                      return (
                        <div
                          key={p.id}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => {
                            addToCart(p);
                            setBarcodeSearchInput('');
                            setIsSearchDropdownOpen(false);
                            barcodeInputRef.current?.focus();
                          }}
                          className={`p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-cyan-950/90 border-l-4 border-cyan-400 text-white'
                              : 'hover:bg-blue-950/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded bg-[#020712] border border-blue-900/60 flex items-center justify-center shrink-0 overflow-hidden">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Package className="w-4 h-4 text-cyan-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-tight">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>Cód: {p.barcode || p.sku}</span>
                                <span>•</span>
                                <span className={p.stockQuantity > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  Estoque: {p.stockQuantity} un
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-400 font-mono block">
                              R$ {price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[9px] text-cyan-300 font-bold uppercase">
                              {priceTable === 'VAREJO' ? 'Venda' : 'Revenda'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Product details card with premium blue/cyan horizontal glow on top */}
          <div className="relative bg-[#050f22] border border-blue-900/50 rounded-xl p-2.5 space-y-2 shadow-[0_0_20px_rgba(2,132,199,0.1)] overflow-hidden">
            {/* Horizontal accent line matching the exact neon style */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />

            {/* Title, Subtitle, Code & Stock */}
            <div className="flex items-start justify-between gap-2 pb-0.5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase leading-tight drop-shadow-sm">
                  {activeCartItem
                    ? activeCartItem.productName
                    : isSaleActive
                    ? 'VENDA EM ANDAMENTO - AGUARDANDO PRODUTO'
                    : 'CAIXA LIVRE / AGUARDANDO PRODUTO'}
                </h2>
                <p className="text-[10px] text-blue-200/80 font-medium leading-normal mt-0.5">
                  {activeCartItem
                    ? (activeProduct?.description || activeProduct?.model || 'Item selecionado no carrinho')
                    : isSaleActive
                    ? 'Venda iniciada com sucesso. Passe o leitor de código de barras ou digite o código/nome do produto'
                    : 'Pressione [F1] no teclado ou clique em "Iniciar Venda" para começar'}
                </p>
              </div>
              <div className="text-right text-[10px] shrink-0 font-medium leading-tight">
                <p className="text-slate-400 font-mono">
                  Cód: <span className="text-white font-bold">{activeCartItem?.barcode || activeProduct?.barcode || '---'}</span>
                </p>
                <p className="text-slate-400 mt-0.5">
                  Est: <span className="text-cyan-300 font-black">{activeProduct?.stockQuantity !== undefined ? `${activeProduct.stockQuantity} un` : '---'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 4 Inputs / Badges: Quantidade, Unidade, Preço Unitário, Total do Item */}
          <div className="grid grid-cols-4 gap-2">
            {/* Quantidade */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Quantidade
              </label>
              <input
                type="text"
                value={activeCartItem ? `${activeCartItem.quantity.toFixed(3).replace('.', ',')}` : '0,000'}
                onChange={(e) => {
                  const val = parseFloat(e.target.value.replace(',', '.'));
                  if (!isNaN(val) && val > 0 && activeCartItem) {
                    updateQuantity(selectedItemIndex, val);
                  }
                }}
                disabled={!activeCartItem}
                className="w-full px-2 py-1.5 bg-[#040b19] border border-blue-900 rounded-lg text-center font-bold text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 font-mono shadow-inner disabled:opacity-60"
              />
            </div>

            {/* Unidade */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Unidade
              </label>
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#040b19] border border-blue-900 rounded-lg text-center font-bold text-white text-xs sm:text-sm">
                <span>{activeCartItem?.unit || 'UN'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Preço Unitário (R$) */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
                Preço Unitário (R$)
              </label>
              <div className="px-2 py-1.5 bg-[#040b19] border border-blue-900 rounded-lg text-center font-bold text-white text-xs sm:text-sm font-mono truncate">
                {activeCartItem ? activeCartItem.unitPrice.toFixed(2).replace('.', ',') : '0,00'}
              </div>
            </div>

            {/* Total do Item (R$) */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
                Total do Item (R$)
              </label>
              <div className="px-2 py-1.5 bg-[#10b981] rounded-lg text-center font-black text-white text-xs sm:text-sm font-mono border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.35)] truncate">
                {activeCartItem ? activeCartItem.total.toFixed(2).replace('.', ',') : '0,00'}
              </div>
            </div>
          </div>

          {/* Bottom Row: Product Image (Left) & Technical Specs List (Right) */}
          <div className="grid grid-cols-12 gap-3 items-stretch flex-1 min-h-0 overflow-hidden py-0.5">
            
            {/* Product Image / Empty State Scanner */}
            <div className="col-span-6 bg-[#020712] border border-blue-900/40 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group min-h-[130px] lg:h-[180px] flex-1 shadow-inner">
              {activeProduct?.photoUrl ? (
                <img
                  src={activeProduct.photoUrl}
                  alt={activeProduct?.name || "Produto"}
                  className="max-h-[150px] w-full object-contain rounded drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] group-hover:scale-103 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-3 text-slate-400 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Barcode className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">
                      {isSaleActive ? 'Venda em Aberto' : 'Caixa Livre & Pronto'}
                    </p>
                    <p className="text-[10px] text-cyan-300/80">
                      {isSaleActive ? 'Aguardando bipe ou código' : 'Pressione [F1] para Iniciar'}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Technical Specs List & Stock Badge */}
            <div className="col-span-6 flex flex-col justify-between py-0.5 text-[11px]">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300 border-b border-blue-900/40 pb-1">
                  <span className="font-extrabold text-slate-400">Marca:</span>
                  <span className="font-semibold text-white truncate max-w-[130px]">
                    {activeProduct?.brand || '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-blue-900/40 pb-1">
                  <span className="font-extrabold text-slate-400">Categoria:</span>
                  <span className="font-semibold text-white truncate max-w-[130px]">
                    {activeProduct?.category || '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-blue-900/40 pb-1">
                  <span className="font-extrabold text-slate-400">Código:</span>
                  <span className="font-semibold text-white font-mono">
                    {activeCartItem?.barcode || activeProduct?.barcode || '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-blue-900/40 pb-1">
                  <span className="font-extrabold text-slate-400">Estoque Atual:</span>
                  <span className="font-semibold text-cyan-300 font-extrabold">
                    {activeProduct?.stockQuantity !== undefined ? `${activeProduct.stockQuantity} un` : '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-blue-900/40 pb-1">
                  <span className="font-extrabold text-slate-400">Localização:</span>
                  <span className="font-semibold text-white">
                    {activeProduct?.location || '---'}
                  </span>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="pt-1">
                {activeCartItem ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#064e3b]/80 border border-emerald-500/50 text-emerald-300 font-extrabold text-[11px] shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Item Selecionado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-950/80 border border-cyan-500/40 text-cyan-300 font-extrabold text-[11px] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{isSaleActive ? 'Pronto para Bipe' : 'Caixa Disponível'}</span>
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ITENS DA VENDA TABLE & 4 KPI SUMMARY CARDS (7 Cols) */}
        <div className="lg:col-span-7 bg-[#071328] border border-blue-900/60 rounded-xl p-2.5 sm:p-3.5 space-y-2 sm:space-y-3 shadow-[0_4px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-0 overflow-hidden">
          
          {/* Table Header Row: Title & Total Items Count */}
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-black text-white text-base tracking-tight">Itens da Venda</span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              <span>Total de Itens: {cart.length}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-[#040b19] border border-blue-900/70 rounded-xl overflow-hidden shadow-inner flex flex-col min-h-[150px] overflow-y-auto">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-blue-900/60 bg-[#061021] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 w-32">Código</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-center w-14">Un</th>
                    <th className="p-2.5 text-center w-16">Qtde</th>
                    <th className="p-2.5 text-right w-24">Unit. (R$)</th>
                    <th className="p-2.5 text-right w-24">Total (R$)</th>
                    <th className="p-2.5 text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/80">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">
                        Nenhum item adicionado à venda. Digite o código de barras ou use F3 para consultar.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const isSelected = idx === selectedItemIndex;
                      return (
                        <tr
                          key={`${item.productId}-${idx}`}
                          onClick={() => setSelectedItemIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-md'
                              : 'hover:bg-blue-950/40 text-slate-200'
                          }`}
                        >
                          <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-mono">{item.barcode || '---'}</td>
                          <td className="p-2.5 font-medium truncate max-w-[180px]">{item.productName}</td>
                          <td className="p-2.5 text-center">{item.unit || 'UN'}</td>
                          <td className="p-2.5 text-center font-mono">{item.quantity},000</td>
                          <td className="p-2.5 text-right font-mono">{item.unitPrice.toFixed(2).replace('.', ',')}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{item.total.toFixed(2).replace('.', ',')}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItemIndex(idx);
                                  setIsQtyModalOpen(true);
                                }}
                                className={`p-1 rounded cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                                title="Editar Item"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromCart(idx)}
                                className={`p-1 rounded cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-rose-500/80 hover:bg-rose-500 text-white'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                                title="Remover Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>

          {/* 4 KPI SUMMARY CARDS (SubTotal, Itens, Desconto, Total da Venda) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            
            {/* Card 1: SubTotal (R$) */}
            <div className="bg-[#051125] border border-blue-900/80 rounded-xl p-2.5 flex items-center gap-3 shadow-[0_0_15px_rgba(2,132,199,0.1)]">
              <div className="w-10 h-10 rounded-lg bg-[#0d6efd] text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(13,110,253,0.5)]">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  SubTotal (R$)
                </p>
                <p className="text-base sm:text-xl font-black text-white font-mono truncate">
                  {subtotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Card 2: Itens */}
            <div className="bg-[#051125] border border-blue-900/80 rounded-xl p-2.5 flex items-center gap-3 shadow-[0_0_15px_rgba(2,132,199,0.1)]">
              <div className="w-10 h-10 rounded-lg bg-[#0c1a32] border border-blue-800 text-cyan-300 flex items-center justify-center shrink-0 shadow-sm">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Itens
                </p>
                <p className="text-base sm:text-xl font-black text-white font-mono">
                  {cart.length}
                </p>
              </div>
            </div>

            {/* Card 3: Desconto (R$) */}
            <div
              onClick={() => setIsAlterSaleModalOpen(true)}
              className="bg-[#051125] border border-blue-900/80 rounded-xl p-2.5 flex items-center gap-3 shadow-[0_0_15px_rgba(2,132,199,0.1)] cursor-pointer hover:border-cyan-400 transition-colors"
              title="Clique para alterar desconto"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0c1a32] border border-blue-800 text-cyan-300 flex items-center justify-center shrink-0 shadow-sm">
                <Percent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Desconto (R$)
                </p>
                <p className="text-base sm:text-xl font-black text-white font-mono truncate">
                  {calculatedDiscount.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Card 4: Total da Venda (R$) - Glowing Emerald outline & Solid Green Icon */}
            <div
              onClick={() => setIsCheckoutModalOpen(true)}
              className="bg-[#051125] border-2 border-[#198754] rounded-xl p-2.5 flex items-center gap-3 shadow-[0_0_15px_rgba(25,135,84,0.2)] cursor-pointer hover:bg-[#071935] transition-all"
              title="Clique para finalizar venda (F1)"
            >
              <div className="w-10 h-10 rounded-lg bg-[#198754] text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(25,135,84,0.5)]">
                <Banknote className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase text-[#198754] tracking-wider truncate">
                  Total da Venda (R$)
                </p>
                <p className="text-base sm:text-xl font-black text-white font-mono truncate leading-none">
                  {total.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. BOTTOM FUNCTION KEY ACTION BAR (13 BUTTONS: F1 to ESC) */}
      <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5 sm:gap-2 shrink-0">
        
        {/* F1: Iniciar ou Finalizar Venda */}
        <button
          type="button"
          id="btn-f1"
          onClick={handleF1Action}
          className={`py-2.5 px-1 ${
            cart.length === 0
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50 shadow-emerald-900/30'
              : 'bg-blue-600 hover:bg-blue-500 border-blue-400/40 shadow-blue-950/50'
          } active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border shadow-lg`}
        >
          <span className="text-[10px] font-extrabold uppercase text-blue-100 leading-none">F1</span>
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black leading-none text-center truncate w-full">
            {cart.length === 0 ? 'Iniciar Venda' : isCheckoutModalOpen ? 'Concluir Venda' : 'Finalizar Venda'}
          </span>
        </button>

        {/* F2: Dar Desconto (Vibrant Orange) */}
        <button
          type="button"
          id="btn-f2"
          onClick={() => setIsAlterSaleModalOpen(true)}
          className="py-2.5 px-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-amber-300/40 shadow-lg"
        >
          <span className="text-[10px] font-extrabold uppercase text-amber-100 leading-none">F2</span>
          <Percent className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black leading-none text-center truncate w-full">Dar Desconto</span>
        </button>

        {/* F3: Consultar Produto (Emerald Green) */}
        <button
          type="button"
          id="btn-f3"
          onClick={() => setIsConsultModalOpen(true)}
          className="py-2.5 px-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-emerald-400/40 shadow-lg"
        >
          <span className="text-[10px] font-extrabold uppercase text-emerald-100 leading-none">F3</span>
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black leading-none text-center truncate w-full">Consultar Produto</span>
        </button>

        {/* F4: Buscar / Incluir Produto (Cyan/Navy) */}
        <button
          type="button"
          id="btn-f4"
          onClick={() => {
            barcodeInputRef.current?.focus();
            barcodeInputRef.current?.select();
            if (barcodeSearchInput.trim().length > 0) setIsSearchDropdownOpen(true);
          }}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-cyan-950/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-cyan-500/30 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-cyan-300 leading-none">F4</span>
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Buscar Produto</span>
        </button>

        {/* F5: Cliente (Navy) */}
        <button
          type="button"
          id="btn-f5"
          onClick={() => setIsCustomerModalOpen(true)}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F5</span>
          <User className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Cliente</span>
        </button>

        {/* F6: Excluir Produto (Navy with red icon) */}
        <button
          type="button"
          id="btn-f6"
          onClick={() => {
            if (cart.length > 0 && selectedItemIndex < cart.length) {
              removeFromCart(selectedItemIndex);
            }
          }}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-rose-950/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F6</span>
          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Excluir Produto</span>
        </button>

        {/* F7: Cancelar Venda (Navy) */}
        <button
          type="button"
          id="btn-f7"
          onClick={clearCart}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F7</span>
          <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Cancelar Venda</span>
        </button>

        {/* F8: Imprimir Venda (Navy) */}
        <button
          type="button"
          id="btn-f8"
          onClick={handleOpenPrintDialog}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F8</span>
          <Printer className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Imprimir Venda</span>
        </button>

        {/* F9: Alterar Quantidade (Navy) */}
        <button
          type="button"
          id="btn-f9"
          onClick={() => setIsQtyModalOpen(true)}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F9</span>
          <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Alterar Quantidade</span>
        </button>

        {/* F10: Cat. Produto (Navy) */}
        <button
          type="button"
          id="btn-f10"
          onClick={() => setIsCatalogModalOpen(true)}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F10</span>
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Cat. Produto</span>
        </button>

        {/* F11: Observações (Navy) */}
        <button
          type="button"
          id="btn-f11-obs"
          onClick={() => setIsNotesModalOpen(true)}
          className="py-2.5 px-1 bg-[#0c1a32] hover:bg-blue-900/60 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-blue-900/80 shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">F11</span>
          <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-extrabold leading-none text-center text-slate-200 truncate w-full">Observações</span>
        </button>

        {/* F12: Pré-venda (Bright Purple) */}
        <button
          type="button"
          id="btn-f12-pre"
          onClick={() => setIsPreSaleModalOpen(true)}
          className="py-2.5 px-1 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-purple-400/40 shadow-lg"
        >
          <span className="text-[10px] font-extrabold uppercase text-purple-200 leading-none">F12</span>
          <Camera className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black leading-none text-center truncate w-full">Pré-venda</span>
        </button>

        {/* ESC: Fechar (Bright Red) */}
        <button
          type="button"
          id="btn-esc"
          onClick={() => {
            window.location.hash = '#dashboard';
            onClose?.();
          }}
          className="py-2.5 px-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border border-rose-400/40 shadow-lg"
        >
          <span className="text-[10px] font-extrabold uppercase text-rose-200 leading-none">ESC</span>
          <X className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black leading-none text-center truncate w-full">Fechar</span>
        </button>

      </div>

      {/* 5. BOTTOM STATUS FOOTER BAR */}
      <footer className="bg-[#050e20] border border-blue-900/50 rounded px-2 py-0.5 flex flex-wrap items-center justify-between text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white">{company.name || 'TECHNOVA Informática'}</span>
          <span className="text-blue-900">|</span>
          <span className="font-medium text-slate-400">PDV - Sistema de Vendas</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Conectado</span>
          </div>

          <div className="text-slate-300">
            Usuário: <strong className="text-white">{currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}</strong>
          </div>

          <div className="text-slate-300">
            Terminal: <strong className="text-white">PDV 01</strong>
          </div>

          <div className="text-slate-400 font-mono">
            Versão 1.0.0
          </div>
        </div>
      </footer>

      {/* ================= MODALS & DIALOGS ================= */}

      {/* 1. CHECKOUT / FINALIZAR VENDA MODAL (F1) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(37,99,235,0.6)]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Finalizar Venda (F1)</h3>
                  <p className="text-xs text-cyan-300">Escolha a forma de pagamento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Highlight */}
            <div className="bg-[#030712] border border-cyan-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
              <div>
                <p className="text-xs font-bold text-slate-400">Total a Pagar</p>
                <p className="text-xs text-slate-300">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho
                </p>
              </div>
              <p className="text-3xl font-black text-cyan-400 font-mono drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Forma de Pagamento {priceTable === 'ATACADO' && <span className="text-cyan-400 text-[10px] font-normal">(Revenda)</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'DINHEIRO', label: 'Dinheiro', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
                  { id: 'CARTAO_CREDITO', label: 'Cartão', icon: <CreditCard className="w-4 h-4 text-cyan-400" /> },
                  { id: 'PIX', label: 'Pix', icon: <span className="text-purple-400 font-black">❖</span> },
                  { id: 'MULTIPLO', label: 'Múltiplos', icon: <Layers className="w-4 h-4 text-violet-400" /> },
                  { id: 'FIADO', label: priceTable === 'ATACADO' ? 'Fiado / A Prazo' : 'Fiado', icon: <FileText className="w-4 h-4 text-amber-400" /> },
                  ...(priceTable === 'VAREJO'
                    ? [{ id: 'BOLETO', label: 'Crediário', icon: <Receipt className="w-4 h-4 text-yellow-400" /> }]
                    : []),
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-blue-600 border-cyan-300 text-white shadow-[0_0_15px_rgba(2,132,199,0.5)] scale-102'
                        : 'bg-[#040c1c] border-blue-900 text-slate-300 hover:border-cyan-500/50'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If Dinheiro: Valor Recebido & Troco */}
            {paymentMethod === 'DINHEIRO' && (
              <div className="grid grid-cols-2 gap-3 bg-[#040a18] p-3 rounded-xl border border-blue-900/60">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Valor Recebido (R$)</label>
                  <input
                    type="text"
                    value={amountReceivedInput}
                    onChange={(e) => setAmountReceivedInput(e.target.value)}
                    placeholder={total.toFixed(2).replace('.', ',')}
                    className="w-full px-3 py-1.5 bg-[#020610] border border-blue-800 rounded-lg text-sm text-white font-bold font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Troco a Devolver</label>
                  <div className="px-3 py-1.5 bg-[#020610] border border-blue-800 rounded-lg text-sm text-emerald-400 font-black font-mono">
                    R$ {Math.max(0, (parseFloat(amountReceivedInput.replace('.', '').replace(',', '.')) || total) - total).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Confirmar e Finalizar / Imprimir / WhatsApp */}
            <div className="space-y-2 pt-2 border-t border-blue-900/60">
              <button
                type="button"
                onClick={handleFinalizeSale}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar e Finalizar Venda (F1)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenPrintDialog}
                  className="flex-1 py-2 px-3 bg-[#040b19] hover:bg-blue-950 border border-blue-900 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Imprimir (80mm / 50mm / A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-2 px-3 bg-[#040b19] hover:bg-emerald-950 border border-blue-900 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. CONSULT PRODUCT MODAL (F3) */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-blue-600 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-[0_0_40px_rgba(2,132,199,0.3)] max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Consultar Produtos (F3)</h3>
                  <p className="text-xs text-emerald-300">Localize e adicione itens ao carrinho</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConsultModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquise por nome, código de barras, SKU ou marca..."
                value={barcodeSearchInput}
                onChange={(e) => setBarcodeSearchInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#040b19] border border-blue-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {products
                .filter((p) => {
                  const q = barcodeSearchInput.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q)
                  );
                })
                .slice(0, 15)
                .map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      addToCart(prod);
                      setIsConsultModalOpen(false);
                    }}
                    className="p-2.5 bg-[#050f22] border border-blue-900/80 hover:border-cyan-400 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-blue-900/30"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.photoUrl || "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&auto=format&fit=crop&q=80"}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-lg border border-blue-900"
                      />
                      <div>
                        <p className="font-bold text-white text-xs sm:text-sm">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Cód: {prod.barcode} | Estoque: <strong className="text-cyan-300">{prod.stockQuantity} un</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        R$ {prod.sellingPrice.toFixed(2).replace('.', ',')}
                      </p>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                        + Adicionar
                      </span>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* 3. ALTER SALE / DISCOUNT MODAL (F2) */}
      {isAlterSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-amber-500 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Alterar Venda (F2)</h3>
                  <p className="text-xs text-amber-300">Ajuste descontos e configurações</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAlterSaleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tipo de Desconto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('VALUE')}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      discountType === 'VALUE'
                        ? 'bg-blue-600 border-cyan-400 text-white'
                        : 'bg-[#040a18] border-blue-900 text-slate-400'
                    }`}
                  >
                    Valor em Reais (R$)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      discountType === 'PERCENT'
                        ? 'bg-blue-600 border-cyan-400 text-white'
                        : 'bg-[#040a18] border-blue-900 text-slate-400'
                    }`}
                  >
                    Percentual (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Desconto ({discountType === 'PERCENT' ? '%' : 'R$'})
                </label>
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#040a18] border border-blue-800 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="bg-[#040b19] p-3 rounded-xl border border-blue-900 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Desconto calculado:</span>
                  <span className="font-bold">- R$ {calculatedDiscount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-black text-sm pt-1 border-t border-blue-900/60">
                  <span>Novo Total:</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAlterSaleModalOpen(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm rounded-xl transition-colors cursor-pointer"
              >
                Aplicar Alteração
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. CHANGE QUANTITY MODAL (F9) */}
      {isQtyModalOpen && activeCartItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-cyan-500 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <h3 className="text-base font-black text-white">Alterar Quantidade (F9)</h3>
              <button
                type="button"
                onClick={() => setIsQtyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-300 font-bold mb-1">{activeCartItem.productName}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(selectedItemIndex, Math.max(1, activeCartItem.quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-white font-bold flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={activeCartItem.quantity}
                  onChange={(e) => updateQuantity(selectedItemIndex, parseInt(e.target.value) || 1)}
                  className="flex-1 py-2 bg-[#040b19] border border-blue-800 rounded-xl text-center font-bold text-white text-lg font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(selectedItemIndex, activeCartItem.quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-white font-bold flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQtyModalOpen(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm rounded-xl cursor-pointer"
            >
              Confirmar
            </button>

          </div>
        </div>
      )}

      {/* 5. SALE NOTES MODAL (F11) */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-blue-600 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-[0_0_40px_rgba(2,132,199,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <h3 className="text-base font-black text-white">Observações da Venda (F11)</h3>
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <textarea
                rows={4}
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Insira detalhes adicionais, condições de entrega ou garantia..."
                className="w-full p-3 bg-[#040b19] border border-blue-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsNotesModalOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl cursor-pointer"
            >
              Salvar Observações
            </button>

          </div>
        </div>
      )}

      {/* 6. PRE-SALE MODAL (F11 purple button) */}
      {isPreSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-purple-500 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white">Pré-Venda / Orçamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreSaleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Gere uma pré-venda com validade para o cliente retirar no balcão ou pagar no caixa.
            </p>

            <div className="bg-[#040a18] p-3 rounded-xl border border-blue-900 text-xs space-y-1 font-mono">
              <p className="text-purple-300 font-bold">Resumo da Pré-Venda:</p>
              <p>Itens: {cart.length}</p>
              <p>Total: R$ {total.toFixed(2).replace('.', ',')}</p>
              <p>Cliente: {selectedCustomer ? selectedCustomer.name : 'CLIENTE PADRÃO'}</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Pré-venda salva com sucesso! Código: PV-${Date.now().toString().slice(-6)}`);
                  setIsPreSaleModalOpen(false);
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Salvar como Pré-Venda
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = prompt('Digite o código da Pré-venda para carregar:');
                  if (code) {
                    alert(`Pré-venda ${code} carregada com sucesso!`);
                    setIsPreSaleModalOpen(false);
                  }
                }}
                className="w-full py-2 bg-[#040a18] hover:bg-blue-950 border border-purple-500/50 text-purple-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Importar Pré-Venda Existente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. CATALOG BROWSER MODAL (F10) */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-blue-600 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-[0_0_40px_rgba(2,132,199,0.3)] max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white">Catálogo de Produtos (F10)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    addToCart(prod);
                    setIsCatalogModalOpen(false);
                  }}
                  className="p-3 bg-[#040b19] border border-blue-900/80 hover:border-cyan-400 rounded-xl space-y-2 cursor-pointer transition-all hover:bg-blue-950/40"
                >
                  <img
                    src={prod.photoUrl || "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80"}
                    alt={prod.name}
                    className="w-full h-24 object-contain rounded bg-black/40 p-1"
                  />
                  <div>
                    <p className="font-bold text-white text-xs truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">{prod.brand} | {prod.category}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        R$ {prod.sellingPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-bold">
                        + Adicionar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 8. CUSTOMER SELECTOR MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-blue-600 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-[0_0_40px_rgba(2,132,199,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Selecionar Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomerSearchInput('');
                  setIsCustomerModalOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar por nome, WhatsApp ou CPF/CNPJ..."
                value={customerSearchInput}
                onChange={(e) => setCustomerSearchInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#040b19] border border-blue-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div
                onClick={() => {
                  setCustomerId('');
                  setCustomerSearchInput('');
                  setIsCustomerModalOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  !customerId ? 'bg-blue-600 border-cyan-400 text-white' : 'bg-[#040a18] border-blue-900 text-slate-300'
                }`}
              >
                CLIENTE PADRÃO (Consumidor Final)
              </div>
              {/* Resellers list */}
              {resellers
                .filter((r) => {
                  const q = customerSearchInput.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    r.name.toLowerCase().includes(q) ||
                    (r.phone && r.phone.toLowerCase().includes(q)) ||
                    (r.document && r.document.toLowerCase().includes(q))
                  );
                })
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setCustomerId(r.id);
                      setPriceTable('ATACADO');
                      setCustomerSearchInput('');
                      setIsCustomerModalOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors flex justify-between items-center ${
                      customerId === r.id ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-[#040a18] border-cyan-900/60 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-black">{r.name}</p>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-extrabold uppercase">
                          REVENDA
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{r.phone || r.document}</p>
                    </div>
                  </div>
                ))}

              {/* Standard Customers list */}
              {customers
                .filter((c) => {
                  const q = customerSearchInput.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    c.name.toLowerCase().includes(q) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.document && c.document.toLowerCase().includes(q))
                  );
                })
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearchInput('');
                      setIsCustomerModalOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors flex justify-between items-center ${
                      customerId === c.id ? 'bg-blue-600 border-cyan-400 text-white' : 'bg-[#040a18] border-blue-900 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    <div>
                      <p className="text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.phone || c.document}</p>
                    </div>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomerSearchInput('');
                setIsCustomerModalOpen(false);
                onOpenNewCustomer();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>

          </div>
        </div>
      )}

      {/* 9. PRINT FORMAT SELECTOR DIALOG (80mm, 50mm, A4) */}
      {isPrintDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#08152e] border-2 border-cyan-500 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Escolha o Formato de Impressão</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintDialogOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectFormatAndPrint('80mm')}
                className="p-3 bg-[#040b19] border-2 border-cyan-500 hover:bg-cyan-950/40 rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
              >
                <Receipt className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-black text-xs text-white">80mm</p>
                  <p className="text-[10px] text-slate-400">Bobina Padrão</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormatAndPrint('50mm')}
                className="p-3 bg-[#040b19] border-2 border-blue-500 hover:bg-blue-950/40 rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
              >
                <Receipt className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-black text-xs text-white">50mm</p>
                  <p className="text-[10px] text-slate-400">Mini Térmica</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormatAndPrint('A4')}
                className="p-3 bg-[#040b19] border-2 border-emerald-500 hover:bg-emerald-950/40 rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
              >
                <FileText className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-black text-xs text-white">A4</p>
                  <p className="text-[10px] text-slate-400">Folha Inteira</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 10. POS RECEIPT PRINT MODAL */}
      {finishedSale && (
        <PosReceiptModal
          isOpen={!!finishedSale}
          onClose={() => setFinishedSale(null)}
          sale={finishedSale}
          initialFormat={selectedPrintFormat}
        />
      )}

      </div>
    </div>
  );
};
