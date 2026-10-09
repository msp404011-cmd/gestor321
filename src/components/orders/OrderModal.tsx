import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Wrench,
  X,
  AlertTriangle,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Unlock,
  CheckSquare,
  Headphones,
} from 'lucide-react';
import {
  ServiceOrder,
  OrderStatus,
  OrderPartItem,
  Customer,
  Device,
  DeviceType,
  PaymentMethod,
  CustomDeviceType,
  CustomAccessoryItem,
  CustomPaymentMethodItem,
  CustomOSStatusItem,
  Product,
  DeviceTechnicalChecklist,
} from '../../types';
import { StorageService, isAccessoryForDeviceType } from '../../services/storage';
import { formatCurrency, cleanPhoneForWhatsApp } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { OrderClientDeviceSection } from './OrderClientDeviceSection';
import { OrderProblemAccessoriesSection } from './OrderProblemAccessoriesSection';
import { OrderAccessoriesChecklistSection } from './OrderAccessoriesChecklistSection';
import { OrderPartsFinancialSection } from './OrderPartsFinancialSection';
import { OrderTechnicalChecklistSection } from './OrderTechnicalChecklistSection';
import { CustomerModal } from '../customers/CustomerModal';
import { ProductModal } from '../products/ProductModal';
import { filterAndSortCustomers } from '../../utils/searchUtils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: ServiceOrder) => void;
  orderToEdit?: ServiceOrder | null;
  defaultCustomer?: Customer | null;
  defaultDevice?: Device | null;
  initialCustomerId?: string;
  initialDeviceId?: string;
  onOpenNewCustomer?: () => void;
  onOpenNewDevice?: (customerId?: string) => void;
  onOpenPrint?: (order: ServiceOrder) => void;
}

const COMMON_BRANDS = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'Asus',
  'LG',
  'Dell',
  'Lenovo',
  'HP',
  'Acer',
  'Sony',
  'Positivo',
  'Realme',
  'Infinix',
  'Outra',
];

const STATUS_CHOICES: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'ORCAMENTO', label: 'Orçamento', icon: '📌' },
  { status: 'AGUARDANDO_AUTORIZACAO', label: 'Aguardando Autorização', icon: '⏳' },
  { status: 'AUTORIZADO', label: 'Autorizado', icon: '⚙️' },
  { status: 'AGUARDANDO_PECA', label: 'Aguardando Peça', icon: '🧩' },
  { status: 'ATRASADO', label: 'Atrasado', icon: '⚠️' },
  { status: 'PRONTO', label: 'Pronto para Retirada', icon: '✅' },
  { status: 'ENTREGUE', label: 'Entregue / Concluído', icon: '📦' },
  { status: 'ARQUIVADO', label: 'Arquivado', icon: '🗄️' },
];

const QUICK_SERVICES = [
  { name: 'Troca de tela frontal completa', price: 280 },
  { name: 'Troca de bateria original / premium', price: 180 },
  { name: 'Reparo de conector de carga (Dock)', price: 120 },
  { name: 'Desoxidação / Limpeza química', price: 150 },
  { name: 'Troca de vidro traseiro / tampa', price: 160 },
  { name: 'Atualização e restauração de software', price: 90 },
  { name: 'Troca de alto-falante / auricular', price: 110 },
  { name: 'Reparo avançado de placa mãe', price: 320 },
];

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  defaultCustomer,
  defaultDevice,
  initialCustomerId,
  initialDeviceId,
  onOpenNewCustomer,
  onOpenNewDevice,
  onOpenPrint,
}) => {
  const { isDark } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const currentUser = StorageService.getCurrentUser();

  // Dynamic Settings from Storage
  const [customDeviceTypes, setCustomDeviceTypes] = useState<CustomDeviceType[]>(() =>
    StorageService.getCustomDeviceTypes()
  );
  const [customAccessories, setCustomAccessories] = useState<CustomAccessoryItem[]>(() =>
    StorageService.getCustomAccessories()
  );
  const [customPaymentMethods, setCustomPaymentMethods] = useState<CustomPaymentMethodItem[]>(() =>
    StorageService.getCustomPaymentMethods()
  );

  // Customer selection & search
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Pickup authorization (Só o dono ou outra pessoa)
  const [pickupType, setPickupType] = useState<'OWNER_ONLY' | 'THIRD_PARTY'>('OWNER_ONLY');
  const [authorizedPickupName, setAuthorizedPickupName] = useState('');
  const [authorizedPickupPhone, setAuthorizedPickupPhone] = useState('');

  // Device fields
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('Smartphone');
  const [brand, setBrand] = useState('Samsung');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [physicalState, setPhysicalState] = useState('');
  const [hasNoDamages, setHasNoDamages] = useState(true);

  // Password Options
  const [passwordType, setPasswordType] = useState<'NONE' | 'PIN' | 'PATTERN'>('NONE');
  const [passwordPin, setPasswordPin] = useState('');
  const [patternNodes, setPatternNodes] = useState<number[]>([]);
  const [patternNote, setPatternNote] = useState('');

  // Dynamic Accessories Checklist State
  const [customAccMap, setCustomAccMap] = useState<Record<string, { present: boolean; details: string }>>({});

  // Technical Tests Checklist State & Column 2 Tab
  const [technicalChecklist, setTechnicalChecklist] = useState<DeviceTechnicalChecklist>({});
  const [col2Tab, setCol2Tab] = useState<'PROBLEMA' | 'ACESSORIOS' | 'CHECKLIST'>('PROBLEMA');

  // Problems & Services
  const [clientDefect, setClientDefect] = useState('');
  const [serviceToBeDone, setServiceToBeDone] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Forecast & Pricing
  const [entryDate, setEntryDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isDeliveryOptional, setIsDeliveryOptional] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('Não informado');

  // Status
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('ORCAMENTO');
  const [archivedLocation, setArchivedLocation] = useState<string>('');
  const [promisedRepairDate, setPromisedRepairDate] = useState<string>('');
  const [promisedRepairNotes, setPromisedRepairNotes] = useState<string>('');

  // Options
  const [printAfterCreate, setPrintAfterCreate] = useState(true);
  const [error, setError] = useState('');

  // Full Customer Registration / Edit Modal State inside Order
  const [showFullCustomerModal, setShowFullCustomerModal] = useState(false);
  const [customerSearchPrefill, setCustomerSearchPrefill] = useState('');
  const [customerToEditInOrder, setCustomerToEditInOrder] = useState<Customer | null>(null);

  // Product Registration Modal State inside Order
  const [showProductModalInOrder, setShowProductModalInOrder] = useState(false);
  const [productModalPrefillName, setProductModalPrefillName] = useState('');
  const [productToEditInOrder, setProductToEditInOrder] = useState<Product | null>(null);

  // Parts list & Stock Products for OS Accounting
  const [parts, setParts] = useState<OrderPartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [customOSStatuses, setCustomOSStatuses] = useState<CustomOSStatusItem[]>(() => StorageService.getCustomOSStatuses());
  const [partInputMode, setPartInputMode] = useState<'ESTOQUE' | 'AVULSO'>('ESTOQUE');
  const [partSearch, setPartSearch] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [showStockCatalog, setShowStockCatalog] = useState(false);
  const [manualPartName, setManualPartName] = useState('');
  const [manualPartQty, setManualPartQty] = useState(1);
  const [manualPartPrice, setManualPartPrice] = useState<number>(0);
  const [manualPartCost, setManualPartCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [showManagerAuthModal, setShowManagerAuthModal] = useState(false);
  const [managerPassInput, setManagerPassInput] = useState('');
  const [showManagerPassText, setShowManagerPassText] = useState(false);
  const [managerPassError, setManagerPassError] = useState('');

  // Two-tier part options (1ª Linha vs Premium)
  const [partPriceFirstLine, setPartPriceFirstLine] = useState<number>(0);
  const [partPricePremium, setPartPricePremium] = useState<number>(0);
  const [partTierDescription, setPartTierDescription] = useState<string>('');
  const [selectedPartTier, setSelectedPartTier] = useState<'FIRST_LINE' | 'PREMIUM' | 'NONE'>('NONE');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDENTE');

  const searchRef = useRef<HTMLDivElement>(null);
  const partSearchRef = useRef<HTMLDivElement>(null);

  // Subscribe to Storage updates
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCustomers(StorageService.getCustomers());
      setCustomDeviceTypes(StorageService.getCustomDeviceTypes());
      setCustomAccessories(StorageService.getCustomAccessories());
      setCustomPaymentMethods(StorageService.getCustomPaymentMethods());
      setCustomOSStatuses(StorageService.getCustomOSStatuses());
      setProducts(StorageService.getProducts());
    });
    return unsub;
  }, []);

  const dynamicStatusChoices = useMemo(() => {
    if (Array.isArray(customOSStatuses) && customOSStatuses.length > 0) {
      return customOSStatuses.map((s) => ({
        status: (s.code || s.id) as OrderStatus,
        label: s.label,
        icon: (s as any).icon || '📌',
      }));
    }
    return STATUS_CHOICES;
  }, [customOSStatuses]);

  // Initialize data on open
  useEffect(() => {
    if (!isOpen) return;

    const currentCustomers = StorageService.getCustomers();
    setCustomers(currentCustomers);
    const loadedDevTypes = StorageService.getCustomDeviceTypes();
    setCustomDeviceTypes(loadedDevTypes);
    const loadedAccessories = StorageService.getCustomAccessories();
    setCustomAccessories(loadedAccessories);
    const loadedPayMethods = StorageService.getCustomPaymentMethods();
    setCustomPaymentMethods(loadedPayMethods);

    const today = new Date().toISOString().split('T')[0];

    if (orderToEdit) {
      // Load existing order to edit with full safe fallbacks
      const cust = orderToEdit.customerId
        ? currentCustomers.find((c) => c.id === orderToEdit.customerId) || null
        : null;
      setSelectedCustomer(
        cust || {
          id: orderToEdit.customerId || 'cust-' + Date.now(),
          name: orderToEdit.customerName || 'Cliente',
          phone: orderToEdit.customerPhone || '',
          whatsapp: orderToEdit.customerWhatsapp || orderToEdit.customerPhone || '',
          document: orderToEdit.customerDocument || '',
          email: '',
          address: '',
          city: '',
          createdAt: orderToEdit.createdAt || new Date().toISOString(),
        }
      );
      setCustomerSearch(orderToEdit.customerName || '');
      setPickupType((orderToEdit.pickupType as any) || (orderToEdit.authorizedPickupName ? 'THIRD_PARTY' : 'OWNER_ONLY'));
      setAuthorizedPickupName(orderToEdit.authorizedPickupName || '');
      setAuthorizedPickupPhone(orderToEdit.authorizedPickupPhone || '');
      setDeviceId(orderToEdit.deviceId || '');
      setDeviceType(orderToEdit.deviceType || (loadedDevTypes[0]?.name as DeviceType) || 'Smartphone');
      setBrand(orderToEdit.brand || 'Samsung');
      setModel(orderToEdit.model || '');
      setImei(orderToEdit.imei || '');
      setSerialNumber(orderToEdit.serialNumber || '');
      const existingDamages = orderToEdit.physicalCondition || orderToEdit.physicalState || '';
      if (existingDamages && existingDamages !== 'Sem avarias aparentes' && existingDamages !== 'Normal') {
        setHasNoDamages(false);
        setPhysicalState(existingDamages);
      } else {
        setHasNoDamages(true);
        setPhysicalState('');
      }

      setClientDefect(orderToEdit.clientDefect || '');
      setServiceToBeDone(
        orderToEdit.performedService ||
          orderToEdit.requestedService ||
          orderToEdit.technicalDiagnosis ||
          ''
      );
      setEntryDate(orderToEdit.createdAt ? orderToEdit.createdAt.split('T')[0] : today);
      
      if (orderToEdit.estimatedCompletionDate) {
        setIsDeliveryOptional(false);
        setDeliveryDate(orderToEdit.estimatedCompletionDate.split('T')[0]);
      } else {
        setIsDeliveryOptional(true);
        setDeliveryDate('');
      }

      const loadedParts: OrderPartItem[] = Array.isArray(orderToEdit.parts) && orderToEdit.parts.length > 0
        ? orderToEdit.parts
        : Array.isArray(orderToEdit.items)
        ? (orderToEdit.items.filter((i) => i.type === 'PECA') as OrderPartItem[])
        : [];
      setParts(loadedParts);
      setDiscount(orderToEdit.discount || 0);

      const existingLabor = orderToEdit.laborPrice !== undefined
        ? Number(orderToEdit.laborPrice)
        : Math.max(0, (orderToEdit.totalPrice || 0) + (orderToEdit.discount || 0) - loadedParts.reduce((acc, p) => acc + (p.totalPrice || p.total || (p.quantity || 1) * (p.unitPrice || 0) - (p.discount || 0)), 0));
      setCustomTotalPrice(existingLabor);

      setInitialStatus(orderToEdit.status || 'ORCAMENTO');
      setArchivedLocation(orderToEdit.archivedLocation || '');
      setPromisedRepairDate(orderToEdit.promisedRepairDate || '');
      setPromisedRepairNotes(orderToEdit.promisedRepairNotes || '');
      setPaymentMethod(orderToEdit.paymentMethod || 'Não informado');
      setPartPriceFirstLine(orderToEdit.partPriceFirstLine || 0);
      setPartPricePremium(orderToEdit.partPricePremium || 0);
      setPartTierDescription(orderToEdit.partTierDescription || '');
      setSelectedPartTier(orderToEdit.selectedPartTier || 'NONE');
      setWarrantyDays(orderToEdit.warrantyDays || 90);
      setPaymentStatus(orderToEdit.paymentStatus || 'PENDENTE');

      if (orderToEdit.passwordPattern && Array.isArray(orderToEdit.passwordPattern) && orderToEdit.passwordPattern.length > 0) {
        setPasswordType('PATTERN');
        setPatternNodes(orderToEdit.passwordPattern);
        setPasswordPin('');
      } else if (orderToEdit.passwordPin && orderToEdit.passwordPin.trim()) {
        setPasswordType('PIN');
        setPasswordPin(orderToEdit.passwordPin);
        setPatternNodes([]);
      } else {
        setPasswordType('NONE');
        setPasswordPin('');
        setPatternNodes([]);
      }
      setPatternNote('');

      // Populate Accessories from checklist or text
      const initialMap: Record<string, { present: boolean; details: string }> = {};
      (loadedAccessories || []).forEach((acc) => {
        initialMap[acc.id] = { present: false, details: '' };
      });

      if (orderToEdit.checklistAccessories) {
        const chk = orderToEdit.checklistAccessories as any;
        if (chk.caseCover?.present) initialMap['acc-case'] = { present: true, details: chk.caseCover.details || '' };
        if (chk.chip1?.present) initialMap['acc-chip-1'] = { present: true, details: chk.chip1.details || '' };
        if (chk.chip2?.present) initialMap['acc-chip-2'] = { present: true, details: chk.chip2.details || '' };
        if (chk.memoryCard?.present) initialMap['acc-memory-card'] = { present: true, details: chk.memoryCard.details || '' };
        if (chk.charger?.present) initialMap['acc-charger'] = { present: true, details: chk.charger.details || '' };
        if (chk.others?.present) initialMap['acc-others'] = { present: true, details: chk.others.details || '' };
      }
      setCustomAccMap(initialMap);
      setTechnicalChecklist(orderToEdit.technicalChecklist || {});
      setCol2Tab('PROBLEMA');
    } else {
      // NEW ORDER - Fresh state
      setSelectedCustomer(defaultCustomer || null);
      setCustomerSearch(defaultCustomer ? defaultCustomer.name : '');
      setPickupType('OWNER_ONLY');
      setAuthorizedPickupName('');
      setAuthorizedPickupPhone('');

      if (defaultDevice) {
        setDeviceId(defaultDevice.id);
        setDeviceType(defaultDevice.type || 'Smartphone');
        setBrand(defaultDevice.brand || 'Samsung');
        setModel(defaultDevice.model || '');
        setImei(defaultDevice.imei || '');
        setSerialNumber(defaultDevice.serialNumber || '');
        setHasNoDamages(true);
        setPhysicalState('');
      } else {
        setDeviceId('');
        setDeviceType((loadedDevTypes[0]?.name as DeviceType) || 'Smartphone');
        setBrand('Samsung');
        setModel('');
        setImei('');
        setSerialNumber('');
        setHasNoDamages(true);
        setPhysicalState('');
      }

      setClientDefect('');
      setServiceToBeDone('');
      setShowServicePicker(false);
      setEntryDate(today);
      setDeliveryDate('');
      setIsDeliveryOptional(true);
      setPaymentMethod('Não informado');
      setInitialStatus('ORCAMENTO');
      setArchivedLocation('');
      setParts([]);
      setPartPriceFirstLine(0);
      setPartPricePremium(0);
      setPartTierDescription('');
      setSelectedPartTier('NONE');
      setDiscount(0);
      setCustomTotalPrice(null);
      setIsPriceUnlocked(false);
      setPasswordType('NONE');
      setPasswordPin('');
      setPatternNodes([]);
      setPatternNote('');

      const freshMap: Record<string, { present: boolean; details: string }> = {};
      loadedAccessories.forEach((acc) => {
        freshMap[acc.id] = { present: false, details: '' };
      });
      setCustomAccMap(freshMap);
      setTechnicalChecklist({});
      setCol2Tab('PROBLEMA');
    }

    setError('');
    setShowFullCustomerModal(false);
    setShowProductModalInOrder(false);
    setShowManagerAuthModal(false);
    setManagerPassInput('');
    setManagerPassError('');
  }, [isOpen, orderToEdit, defaultCustomer, defaultDevice]);

  // Click outside listener for search popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (partSearchRef.current && !partSearchRef.current.contains(e.target as Node)) {
        setIsPartSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    return filterAndSortCustomers(customers, customerSearch, 35);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setIsSearchOpen(false);
  };

  const handleOpenFullCustomerModal = (prefillName?: string) => {
    setIsSearchOpen(false);
    setCustomerToEditInOrder(null);
    setCustomerSearchPrefill(prefillName || customerSearch || '');
    setShowFullCustomerModal(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setIsSearchOpen(false);
    setCustomerToEditInOrder(customer);
    setCustomerSearchPrefill('');
    setShowFullCustomerModal(true);
  };

  const handleSaveCustomerFromOrder = (savedCust: Customer) => {
    StorageService.saveCustomer(savedCust);
    const updatedCustomers = StorageService.getCustomers();
    setCustomers(updatedCustomers);
    setSelectedCustomer(savedCust);
    setCustomerSearch(savedCust.name);
    setShowFullCustomerModal(false);
    setCustomerToEditInOrder(null);
    setCustomerSearchPrefill('');
  };

  const handleOpenNewProductInOrder = (prefillName?: string) => {
    setIsPartSearchOpen(false);
    setProductToEditInOrder(null);
    setProductModalPrefillName(prefillName || partSearch || manualPartName || '');
    setShowProductModalInOrder(true);
  };

  const handleSaveProductInOrder = (savedProduct: Product) => {
    StorageService.saveProduct(savedProduct);
    const updatedProducts = StorageService.getProducts();
    setProducts(updatedProducts);
    handleAddProductAsPart(savedProduct);
    setShowProductModalInOrder(false);
    setProductToEditInOrder(null);
    setProductModalPrefillName('');
  };

  // Parts accounting handlers
  const handleAddProductAsPart = (product: Product) => {
    const existingIndex = parts.findIndex((p) => p.productId === product.id);
    const unitPrice = product.sellingPrice || (product as any).price || 0;
    if (existingIndex >= 0) {
      const updated = [...parts];
      const item = updated[existingIndex];
      const newQty = item.quantity + 1;
      const sub = (newQty * item.unitPrice) - (item.discount || 0);
      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        total: sub,
        totalPrice: sub,
      };
      setParts(updated);
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
      setParts([...parts, newItem]);
    }
    setPartSearch('');
    setIsPartSearchOpen(false);
  };

  const handleAddManualPart = () => {
    if (!manualPartName.trim()) return;
    const unitPrice = Number(manualPartPrice) || 0;
    const costPrice = Number(manualPartCost) || 0;
    const qty = Math.max(1, Number(manualPartQty) || 1);
    const sub = qty * unitPrice;
    const newItem: OrderPartItem = {
      id: `part-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PECA',
      productName: manualPartName.trim(),
      name: manualPartName.trim(),
      quantity: qty,
      unitPrice: unitPrice,
      unitCost: costPrice,
      costPrice: costPrice,
      discount: 0,
      total: sub,
      totalPrice: sub,
    };
    setParts([...parts, newItem]);
    setManualPartName('');
    setManualPartQty(1);
    setManualPartPrice(0);
    setManualPartCost(0);
  };

  const handleUpdatePartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemovePart(index);
      return;
    }
    const updated = [...parts];
    const item = updated[index];
    const sub = (newQty * item.unitPrice) - (item.discount || 0);
    updated[index] = {
      ...item,
      quantity: newQty,
      total: sub,
      totalPrice: sub,
    };
    setParts(updated);
  };

  const handleUpdatePartPrice = (index: number, newPrice: number) => {
    const updated = [...parts];
    const item = updated[index];
    const safePrice = Math.max(0, newPrice);
    const sub = (item.quantity * safePrice) - (item.discount || 0);
    updated[index] = {
      ...item,
      unitPrice: safePrice,
      total: sub,
      totalPrice: sub,
    };
    setParts(updated);
  };

  const handleRemovePart = (index: number) => {
    const updated = parts.filter((_, i) => i !== index);
    setParts(updated);
  };

  const selectedTierPartPrice =
    selectedPartTier === 'FIRST_LINE'
      ? (Number(partPriceFirstLine) || 0)
      : selectedPartTier === 'PREMIUM'
      ? (Number(partPricePremium) || 0)
      : 0;

  // Calculations for Parts and Totals
  const partsTotal = parts.reduce(
    (sum, p) => sum + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
    0
  ) + selectedTierPartPrice;
  const laborPriceVal = customTotalPrice !== null ? customTotalPrice : 0;
  const effectiveBasePrice = laborPriceVal;
  const totalGross = laborPriceVal + partsTotal;
  const finalOrderTotal = Math.max(0, totalGross - (Number(discount) || 0));

  // Manager password verification
  const handleVerifyManagerPassword = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (StorageService.verifyManagerPassword(managerPassInput)) {
      setIsPriceUnlocked(true);
      if (customTotalPrice === null) {
        setCustomTotalPrice(effectiveBasePrice);
      }
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
    } else {
      setManagerPassError('Senha do gerente incorreta.');
    }
  };

  // Filtered products from stock for part search
  const filteredProducts = partSearch.trim()
    ? products
        .filter((p) => {
          const q = partSearch.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q))
          );
        })
        .slice(0, 12)
    : [];

  // Compile accessories summary
  const compileAccessoriesSummary = (): string => {
    const list: string[] = [];
    let anyPresent = false;

    const relevantAccs = customAccessories.filter((acc) =>
      isAccessoryForDeviceType(acc, deviceType)
    );

    relevantAccs.forEach((acc) => {
      const state = customAccMap[acc.id] || { present: false, details: '' };
      if (state.present) {
        anyPresent = true;
        list.push(`${acc.name}: SIM${state.details.trim() ? ` (${state.details.trim()})` : ''}`);
      }
    });

    if (!anyPresent) {
      return 'Nenhum acessório adicional entregue (Aparelho avulso)';
    }

    return list.join(' | ');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    try {
      // 1. Resolve Customer automatically if not explicitly selected
      let targetCust = selectedCustomer;
      if (!targetCust) {
        const trimmedSearch = customerSearch.trim();
        if (trimmedSearch) {
          const autoCust: Customer = {
            id: 'cust-' + Date.now(),
            name: trimmedSearch,
            phone: '(00) 00000-0000',
            whatsapp: '',
            document: '',
            email: '',
            address: '',
            city: '',
            createdAt: new Date().toISOString(),
          };
          StorageService.saveCustomer(autoCust);
          targetCust = autoCust;
          setSelectedCustomer(autoCust);
        } else {
          const balcaoCust: Customer = {
            id: 'cust-balcao',
            name: 'Cliente Balcão / Consumidor',
            phone: '(00) 00000-0000',
            whatsapp: '',
            document: '',
            email: '',
            address: '',
            city: '',
            createdAt: new Date().toISOString(),
          };
          StorageService.saveCustomer(balcaoCust);
          targetCust = balcaoCust;
          setSelectedCustomer(balcaoCust);
        }
      }

      // 2. Resolve Device Brand & Model fallbacks
      const finalBrand = brand.trim() || 'Samsung';
      const finalModel = model.trim() || 'Aparelho';
      const finalClientDefect = clientDefect.trim() || 'Defeito a diagnosticar';

      // 3. Password resolution
      let finalPassword = '';
      if (passwordType === 'PIN') {
        finalPassword = passwordPin.trim();
      } else if (passwordType === 'PATTERN' && patternNodes.length > 0) {
        finalPassword = `Desenho: [${patternNodes.join('-')}]${
          patternNote.trim() ? ` (${patternNote.trim()})` : ''
        }`;
      } else {
        finalPassword = 'Sem senha informada';
      }

      const nextNum = orderToEdit ? orderToEdit.orderNumber : StorageService.getNextOrderNumber();
      const compiledAccessories = compileAccessoriesSummary();

      const historyList = orderToEdit?.statusHistory
        ? [...orderToEdit.statusHistory]
        : [
            {
              status: initialStatus,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser?.name || 'Atendente',
              notes: 'Ordem de serviço aberta no sistema.',
            },
          ];

      const checklistObj: any = {};
      checklistObj.caseCover = {
        present: !!customAccMap['acc-case']?.present,
        details: customAccMap['acc-case']?.details?.trim() || '',
      };
      checklistObj.chip1 = {
        present: !!customAccMap['acc-chip-1']?.present,
        details: customAccMap['acc-chip-1']?.details?.trim() || '',
      };
      checklistObj.chip2 = {
        present: !!customAccMap['acc-chip-2']?.present,
        details: customAccMap['acc-chip-2']?.details?.trim() || '',
      };
      checklistObj.memoryCard = {
        present: !!customAccMap['acc-memory-card']?.present,
        details: customAccMap['acc-memory-card']?.details?.trim() || '',
      };
      checklistObj.charger = {
        present: !!customAccMap['acc-charger']?.present,
        details: customAccMap['acc-charger']?.details?.trim() || '',
      };
      checklistObj.others = {
        present: !!customAccMap['acc-others']?.present,
        details: customAccMap['acc-others']?.details?.trim() || '',
      };

      const selectedTierPartItem: OrderPartItem | null =
        selectedPartTier !== 'NONE' && selectedTierPartPrice > 0
          ? {
              id: `part-tier-${Date.now()}`,
              type: 'PECA',
              name: `${partTierDescription.trim() || 'Peça'} (${selectedPartTier === 'PREMIUM' ? 'Premium' : '1ª Linha'})`,
              productName: `${partTierDescription.trim() || 'Peça'} (${selectedPartTier === 'PREMIUM' ? 'Premium' : '1ª Linha'})`,
              quantity: 1,
              unitPrice: selectedTierPartPrice,
              discount: 0,
              total: selectedTierPartPrice,
              totalPrice: selectedTierPartPrice,
            }
          : null;

      const combinedParts = selectedTierPartItem ? [...parts, selectedTierPartItem] : parts;

      const finalOrder: ServiceOrder = {
        id: orderToEdit ? orderToEdit.id : 'os-' + Date.now(),
        orderNumber: nextNum,
        customerId: targetCust.id,
        customerName: targetCust.name,
        customerPhone: targetCust.phone || targetCust.whatsapp || '',
        customerWhatsapp: targetCust.whatsapp || targetCust.phone || '',
        customerDocument: targetCust.document,
        pickupType: pickupType,
        authorizedPickupName: pickupType === 'THIRD_PARTY' ? authorizedPickupName.trim() : undefined,
        authorizedPickupPhone: pickupType === 'THIRD_PARTY' ? authorizedPickupPhone.trim() : undefined,
        deviceId: deviceId || 'dev-' + Date.now(),
        deviceType: deviceType || 'Smartphone',
        brand: finalBrand,
        model: finalModel,
        imei: imei.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        passwordPin: finalPassword || undefined,
        passwordType: passwordType,
        passwordPattern: passwordType === 'PATTERN' && patternNodes.length > 0 ? patternNodes : undefined,
        accessories: compiledAccessories,
        checklistAccessories: checklistObj as any,
        technicalChecklist: technicalChecklist,
        physicalCondition: hasNoDamages ? 'Sem avarias aparentes' : (physicalState.trim() || 'Avarias relatadas'),
        physicalState: hasNoDamages ? 'Sem avarias aparentes' : (physicalState.trim() || 'Avarias relatadas'),
        clientDefect: finalClientDefect,
        technicalDiagnosis: serviceToBeDone.trim(),
        requestedService: serviceToBeDone.trim(),
        performedService: serviceToBeDone.trim(),
        // Opções de Peça (1ª Linha vs Premium)
        partPriceFirstLine: Number(partPriceFirstLine) || 0,
        partPricePremium: Number(partPricePremium) || 0,
        selectedPartTier: selectedPartTier,
        partTierDescription: partTierDescription.trim() || undefined,
        items: combinedParts.map((p) => ({
          ...p,
          id: p.id || `part-${Date.now()}`,
          name: p.name || p.productName || 'Peça Utilizada',
          productName: p.productName || p.name || 'Peça Utilizada',
          type: 'PECA' as const,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          discount: p.discount || 0,
          total: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
          totalPrice: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
        })),
        parts: combinedParts.map((p) => ({
          ...p,
          total: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
          totalPrice: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
        })),
        laborPrice: laborPriceVal,
        partsPrice: partsTotal,
        discount: Number(discount) || 0,
        totalPrice: finalOrderTotal,
        paymentMethod:
          (paymentMethod && paymentMethod !== 'Não informado')
            ? (paymentMethod as PaymentMethod)
            : (finalOrderTotal === 0 ? 'OUTRO' : undefined),
        paymentStatus: finalOrderTotal === 0
          ? 'PAGO'
          : (paymentStatus || (orderToEdit ? orderToEdit.paymentStatus : 'PENDENTE')) as any,
        status: initialStatus,
        archivedLocation: (initialStatus === 'ARQUIVADO' || (initialStatus as string)?.toUpperCase()?.includes('ARQUIV') || archivedLocation.trim()) ? (archivedLocation.trim() || undefined) : undefined,
        promisedRepairDate: (initialStatus === 'ARQUIVADO' || (initialStatus as string)?.toUpperCase()?.includes('ARQUIV')) && promisedRepairDate.trim() ? promisedRepairDate.trim() : (orderToEdit?.promisedRepairDate || undefined),
        promisedRepairNotes: (initialStatus === 'ARQUIVADO' || (initialStatus as string)?.toUpperCase()?.includes('ARQUIV')) && promisedRepairNotes.trim() ? promisedRepairNotes.trim() : (orderToEdit?.promisedRepairNotes || undefined),
        promisedRepairDismissed: orderToEdit?.promisedRepairDate !== promisedRepairDate ? false : orderToEdit?.promisedRepairDismissed,
        deliveredAt: (initialStatus === 'ENTREGUE' || (initialStatus as string)?.toUpperCase()?.includes('ENTREG') || (initialStatus as string) === 'CONCLUIDO')
          ? (orderToEdit?.deliveredAt || new Date().toISOString())
          : orderToEdit?.deliveredAt,
        technicianName: orderToEdit?.technicianName || currentUser?.name || 'Técnico Responsável',
        attendantName: orderToEdit?.attendantName || currentUser?.name || 'Atendente',
        warrantyDays: warrantyDays || 90,
        estimatedCompletionDate:
          !isDeliveryOptional && deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        createdAt: orderToEdit ? orderToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: historyList,
        history: historyList,
      };

      onSave(finalOrder);

      if (printAfterCreate && onOpenPrint) {
        setTimeout(() => {
          onOpenPrint(finalOrder);
        }, 150);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar OS:', err);
      setError('Ocorreu um erro ao criar a OS: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  const nextOrderNumber = orderToEdit ? orderToEdit.orderNumber : StorageService.getNextOrderNumber();
  const whatsappClean = selectedCustomer
    ? cleanPhoneForWhatsApp(selectedCustomer.whatsapp || selectedCustomer.phone)
    : '';

  const checklistFilledCount = useMemo(() => {
    return [
      technicalChecklist.ligar,
      technicalChecklist.toqueTela,
      technicalChecklist.flash,
      technicalChecklist.wifi,
      technicalChecklist.cameraFrontal,
      technicalChecklist.cameraTraseira,
      technicalChecklist.microfone,
      technicalChecklist.audio,
      technicalChecklist.volumeMais,
      technicalChecklist.volumeMenos,
      technicalChecklist.biometriaPresenca,
      technicalChecklist.botaoAuxiliarPresenca,
      technicalChecklist.gavetaChip,
      technicalChecklist.cartaoMemoria,
      technicalChecklist.chip1,
      technicalChecklist.chip2,
      technicalChecklist.sinalArea,
    ].filter(Boolean).length;
  }, [technicalChecklist]);

  const accessoriesPresentCount = useMemo(() => {
    const relevantAccs = (customAccessories || []).filter((acc) =>
      isAccessoryForDeviceType(acc, deviceType)
    );
    return relevantAccs.filter((acc) => customAccMap[acc.id]?.present).length;
  }, [customAccessories, customAccMap, deviceType]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      {/* Main Container matching the reference image layout */}
      <div
        className="w-full max-w-full sm:max-w-[99vw] 2xl:max-w-[1720px] h-full sm:h-[98vh] sm:max-h-[98vh] sm:rounded-3xl rounded-none border-0 sm:border-2 border-blue-600/40 shadow-[0_0_50px_rgba(37,99,235,0.25)] flex flex-col overflow-hidden cursor-default bg-[#040a18] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-3 py-2.5 sm:px-5 sm:py-3 border-b border-blue-900/40 shrink-0 flex items-center justify-between bg-[#061026]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.6)] shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-xs sm:text-base font-black tracking-tight text-white truncate max-w-[160px] sm:max-w-none">
                {orderToEdit ? 'Editar OS' : 'Nova Ordem de Serviço'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-[#07193b] text-cyan-400 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                OS #{nextOrderNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-700/80 bg-[#07132a] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Notice if any */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-rose-950/70 text-rose-300 border border-rose-500/50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main 3-Column Proportional Grid Body - Scrollable on mobile, 3-column on desktop */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 p-2 sm:p-2.5 overflow-y-auto lg:overflow-hidden bg-[#030814]">
          {/* COLUMN 1: CLIENTE & EQUIPAMENTO */}
          <OrderClientDeviceSection
            isDark={isDark}
            customers={customers}
            filteredCustomers={filteredCustomers}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            searchRef={searchRef}
            handleSelectCustomer={handleSelectCustomer}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            whatsappClean={whatsappClean}
            pickupType={pickupType}
            setPickupType={setPickupType}
            authorizedPickupName={authorizedPickupName}
            setAuthorizedPickupName={setAuthorizedPickupName}
            authorizedPickupPhone={authorizedPickupPhone}
            setAuthorizedPickupPhone={setAuthorizedPickupPhone}
            onOpenNewCustomer={handleOpenFullCustomerModal}
            onOpenEditCustomer={handleOpenEditCustomer}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
            customDeviceTypes={customDeviceTypes}
            brand={brand}
            setBrand={setBrand}
            model={model}
            setModel={setModel}
            commonBrands={COMMON_BRANDS}
            imei={imei}
            setImei={setImei}
            hasNoDamages={hasNoDamages}
            setHasNoDamages={setHasNoDamages}
            physicalState={physicalState}
            setPhysicalState={setPhysicalState}
            passwordType={passwordType}
            setPasswordType={setPasswordType}
            passwordPin={passwordPin}
            setPasswordPin={setPasswordPin}
            patternNodes={patternNodes}
            setPatternNodes={setPatternNodes}
            patternNote={patternNote}
            setPatternNote={setPatternNote}
          />

          {/* COLUMN 2: PROBLEMA, SERVIÇO & ACESSÓRIOS vs CHECKLIST TÉCNICO */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Column 2 Sub-Tabs - 3 dedicated ergonomic steps */}
            <div className="flex items-center gap-1 p-1 bg-[#061026] border border-blue-900/40 rounded-xl mb-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCol2Tab('PROBLEMA')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  col2Tab === 'PROBLEMA'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Defeito reclamado e serviço a realizar"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Defeito & Serviço</span>
              </button>

              <button
                type="button"
                onClick={() => setCol2Tab('ACESSORIOS')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  col2Tab === 'ACESSORIOS'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Checklist de acessórios entregues com o aparelho"
              >
                <Headphones className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Acessórios</span>
                {accessoriesPresentCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-950 text-purple-300 border border-purple-500/50 shrink-0">
                    {accessoriesPresentCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCol2Tab('CHECKLIST')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  col2Tab === 'CHECKLIST'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Checklist técnico dos botões e funções do aparelho"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Checklist Técnico</span>
                {checklistFilledCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 shrink-0">
                    {checklistFilledCount}/17
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {col2Tab === 'PROBLEMA' ? (
                <OrderProblemAccessoriesSection
                  isDark={isDark}
                  clientDefect={clientDefect}
                  setClientDefect={setClientDefect}
                  serviceToBeDone={serviceToBeDone}
                  setServiceToBeDone={setServiceToBeDone}
                  showServicePicker={showServicePicker}
                  setShowServicePicker={setShowServicePicker}
                  quickServices={QUICK_SERVICES}
                  deviceType={deviceType}
                  customAccessories={customAccessories}
                  customAccMap={customAccMap}
                  setCustomAccMap={setCustomAccMap}
                  onSelectQuickService={(sName, price) => {
                    setServiceToBeDone(sName);
                    if (!isPriceUnlocked && customTotalPrice === null) {
                      setCustomTotalPrice(price);
                    }
                  }}
                  onOpenAccessoriesTab={() => setCol2Tab('ACESSORIOS')}
                  onOpenChecklistTab={() => setCol2Tab('CHECKLIST')}
                  checklistFilledCount={checklistFilledCount}
                />
              ) : col2Tab === 'ACESSORIOS' ? (
                <OrderAccessoriesChecklistSection
                  isDark={isDark}
                  deviceType={deviceType}
                  customAccessories={customAccessories}
                  customAccMap={customAccMap}
                  setCustomAccMap={setCustomAccMap}
                  onNavigateToTab={(target) => setCol2Tab(target)}
                  checklistFilledCount={checklistFilledCount}
                />
              ) : (
                <OrderTechnicalChecklistSection
                  isDark={isDark}
                  checklist={technicalChecklist}
                  onChange={setTechnicalChecklist}
                  onNavigateBack={() => setCol2Tab('ACESSORIOS')}
                />
              )}
            </div>
          </div>

          {/* COLUMN 3: PEÇAS, VALORES & PAGAMENTO */}
          <OrderPartsFinancialSection
            isDark={isDark}
            parts={parts}
            partInputMode={partInputMode}
            setPartInputMode={setPartInputMode}
            partSearch={partSearch}
            setPartSearch={setPartSearch}
            isPartSearchOpen={isPartSearchOpen}
            setIsPartSearchOpen={setIsPartSearchOpen}
            partSearchRef={partSearchRef}
            showStockCatalog={showStockCatalog}
            setShowStockCatalog={setShowStockCatalog}
            products={products}
            filteredProducts={filteredProducts}
            handleAddProductAsPart={handleAddProductAsPart}
            onOpenNewProductModal={handleOpenNewProductInOrder}
            manualPartName={manualPartName}
            setManualPartName={setManualPartName}
            manualPartQty={manualPartQty}
            setManualPartQty={setManualPartQty}
            manualPartPrice={manualPartPrice}
            setManualPartPrice={setManualPartPrice}
            manualPartCost={manualPartCost}
            setManualPartCost={setManualPartCost}
            handleAddManualPart={handleAddManualPart}
            handleUpdatePartQty={handleUpdatePartQty}
            handleUpdatePartPrice={handleUpdatePartPrice}
            handleRemovePart={handleRemovePart}
            partsTotal={partsTotal}
            effectiveBasePrice={effectiveBasePrice}
            isPriceUnlocked={isPriceUnlocked}
            customTotalPrice={customTotalPrice}
            setCustomTotalPrice={setCustomTotalPrice}
            setShowManagerAuthModal={setShowManagerAuthModal}
            setManagerPassError={setManagerPassError}
            setManagerPassInput={setManagerPassInput}
            discount={discount}
            setDiscount={setDiscount}
            finalOrderTotal={finalOrderTotal}
            entryDate={entryDate}
            setEntryDate={setEntryDate}
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            isDeliveryOptional={isDeliveryOptional}
            setIsDeliveryOptional={setIsDeliveryOptional}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            customPaymentMethods={customPaymentMethods}
            initialStatus={initialStatus}
            setInitialStatus={setInitialStatus}
            statusChoices={dynamicStatusChoices}
            archivedLocation={archivedLocation}
            setArchivedLocation={setArchivedLocation}
            promisedRepairDate={promisedRepairDate}
            setPromisedRepairDate={setPromisedRepairDate}
            promisedRepairNotes={promisedRepairNotes}
            setPromisedRepairNotes={setPromisedRepairNotes}
            partPriceFirstLine={partPriceFirstLine}
            setPartPriceFirstLine={setPartPriceFirstLine}
            partPricePremium={partPricePremium}
            setPartPricePremium={setPartPricePremium}
            partTierDescription={partTierDescription}
            setPartTierDescription={setPartTierDescription}
            selectedPartTier={selectedPartTier}
            setSelectedPartTier={setSelectedPartTier}
            warrantyDays={warrantyDays}
            setWarrantyDays={setWarrantyDays}
            paymentStatus={paymentStatus}
            setPaymentStatus={setPaymentStatus}
            customerPhone={whatsappClean || selectedCustomer?.phone || ''}
            orderSummaryForCopy={{
              orderNumber: nextOrderNumber,
              customerName: selectedCustomer?.name,
              brand: brand,
              model: model,
              clientDefect: clientDefect,
              laborPrice: laborPriceVal,
              warrantyDays: warrantyDays,
            }}
          />
        </div>

        {/* Bottom Action Footer Bar */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-blue-900/40 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#061026] safe-bottom">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-300 min-w-0 flex-wrap">
            <span className="font-bold text-white truncate max-w-[140px] sm:max-w-none">
              {selectedCustomer ? selectedCustomer.name : 'Cliente não selecionado'}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 truncate max-w-[120px] sm:max-w-none hidden sm:inline">
              {brand && model ? `${brand} ${model}` : 'Sem aparelho'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-black text-emerald-400 font-mono text-sm sm:text-xs">
              Total: {formatCurrency(finalOrderTotal)}
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 shrink-0">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={printAfterCreate}
                onChange={(e) => setPrintAfterCreate(e.target.checked)}
                className="w-4 h-4 rounded bg-[#040c1e] border-slate-700 text-blue-500 cursor-pointer accent-blue-500"
              />
              <span className="text-[11px] sm:text-xs">Imprimir comprovante</span>
            </label>

            <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2.5 rounded-xl border border-slate-700 bg-[#08152e] hover:bg-[#0c1e40] text-slate-300 hover:text-white font-black text-xs transition-colors cursor-pointer min-h-[42px] flex items-center justify-center"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
              >
                <Check className="w-4 h-4" />
                <span>
                  {orderToEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Customer Registration / Edit Modal */}
      {showFullCustomerModal && (
        <CustomerModal
          isOpen={showFullCustomerModal}
          onClose={() => {
            setShowFullCustomerModal(false);
            setCustomerToEditInOrder(null);
            setCustomerSearchPrefill('');
          }}
          onSave={handleSaveCustomerFromOrder}
          customerToEdit={customerToEditInOrder}
          initialName={customerSearchPrefill}
        />
      )}

      {/* Full Product Registration Modal directly from Order */}
      {showProductModalInOrder && (
        <ProductModal
          isOpen={showProductModalInOrder}
          onClose={() => {
            setShowProductModalInOrder(false);
            setProductToEditInOrder(null);
            setProductModalPrefillName('');
          }}
          onSave={handleSaveProductInOrder}
          productToEdit={productToEditInOrder}
          initialName={productModalPrefillName}
        />
      )}

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
    </div>
  );
};
