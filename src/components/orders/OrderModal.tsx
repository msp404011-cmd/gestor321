import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  X,
  User,
  AlertTriangle,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Unlock,
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
  Product,
} from '../../types';
import { StorageService, isAccessoryForDeviceType } from '../../services/storage';
import { formatCurrency, cleanPhoneForWhatsApp } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { OrderClientDeviceSection } from './OrderClientDeviceSection';
import { OrderProblemAccessoriesSection } from './OrderProblemAccessoriesSection';
import { OrderPartsFinancialSection } from './OrderPartsFinancialSection';
import { CustomerModal } from '../customers/CustomerModal';
import { ProductModal } from '../products/ProductModal';

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
  { status: 'ORCAMENTO', label: 'Em Orçamento', icon: '⚙️' },
  { status: 'AGUARDANDO_AUTORIZACAO', label: 'Aguardando Autorização', icon: '⏳' },
  { status: 'AUTORIZADO', label: 'Autorizado', icon: '⚙️' },
  { status: 'AGUARDANDO_PECA', label: 'Aguardando Peça', icon: '🧩' },
  { status: 'ATRASADO', label: 'Atrasado', icon: '⚠️' },
  { status: 'PRONTO', label: 'Pronto para Retirada', icon: '✅' },
  { status: 'ENTREGUE', label: 'Entregue / Concluído', icon: '📦' },
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
  const allDevices = StorageService.getDevices();
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

  // Device fields
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('Smartphone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [physicalState, setPhysicalState] = useState('');
  const [hasNoDamages, setHasNoDamages] = useState(true);

  // Password Options (Alphanumeric/PIN or Pattern Lock)
  const [passwordType, setPasswordType] = useState<'NONE' | 'PIN' | 'PATTERN'>('NONE');
  const [passwordPin, setPasswordPin] = useState('');
  const [patternNodes, setPatternNodes] = useState<number[]>([]);
  const [patternNote, setPatternNote] = useState('');

  // Dynamic Accessories Checklist State
  const [customAccMap, setCustomAccMap] = useState<Record<string, { present: boolean; details: string }>>({});

  // Problems & Services
  const [clientDefect, setClientDefect] = useState('');
  const [serviceToBeDone, setServiceToBeDone] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Forecast & Pricing
  const [entryDate, setEntryDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isDeliveryOptional, setIsDeliveryOptional] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Não informado');

  // Status
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('ORCAMENTO');

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
  const [partInputMode, setPartInputMode] = useState<'ESTOQUE' | 'AVULSO'>('ESTOQUE');
  const [partSearch, setPartSearch] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [showStockCatalog, setShowStockCatalog] = useState(false);
  const [manualPartName, setManualPartName] = useState('');
  const [manualPartQty, setManualPartQty] = useState(1);
  const [manualPartPrice, setManualPartPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [showManagerAuthModal, setShowManagerAuthModal] = useState(false);
  const [managerPassInput, setManagerPassInput] = useState('');
  const [showManagerPassText, setShowManagerPassText] = useState(false);
  const [managerPassError, setManagerPassError] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const partSearchRef = useRef<HTMLDivElement>(null);

  // Subscribe to Storage updates
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCustomers(StorageService.getCustomers());
      setCustomDeviceTypes(StorageService.getCustomDeviceTypes());
      setCustomAccessories(StorageService.getCustomAccessories());
      setCustomPaymentMethods(StorageService.getCustomPaymentMethods());
      setProducts(StorageService.getProducts());
    });
    return unsub;
  }, []);

  // Initialize data on open - ALWAYS clean/zeroed unless editing
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
      // Load existing order to edit
      const cust = currentCustomers.find((c) => c.id === orderToEdit.customerId) || null;
      setSelectedCustomer(
        cust || {
          id: orderToEdit.customerId,
          name: orderToEdit.customerName,
          phone: orderToEdit.customerPhone,
          whatsapp: orderToEdit.customerWhatsapp || orderToEdit.customerPhone,
          document: orderToEdit.customerDocument || '',
          email: '',
          address: '',
          city: '',
          createdAt: orderToEdit.createdAt,
        }
      );
      setCustomerSearch(orderToEdit.customerName);
      setDeviceId(orderToEdit.deviceId || '');
      setDeviceType(orderToEdit.deviceType || (loadedDevTypes[0]?.name as DeviceType) || 'Smartphone');
      setBrand(orderToEdit.brand || '');
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

      const loadedParts: OrderPartItem[] =
        orderToEdit.parts ||
        (orderToEdit.items ? (orderToEdit.items.filter((i) => i.type === 'PECA') as OrderPartItem[]) : []) ||
        [];
      setParts(loadedParts);
      const initialPartsTotal = loadedParts.reduce(
        (acc, p) => acc + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
        0
      );
      setDiscount(orderToEdit.discount || 0);
      const existingGross = (orderToEdit.totalPrice || 0) + (orderToEdit.discount || 0);
      if (existingGross !== initialPartsTotal || initialPartsTotal === 0) {
        setCustomTotalPrice(existingGross);
      } else {
        setCustomTotalPrice(null);
      }
      setIsPriceUnlocked(false);
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
      setPaymentMethod(orderToEdit.paymentMethod || 'Não informado');
      setInitialStatus(orderToEdit.status || 'ORCAMENTO');

      // Password configuration
      if (orderToEdit.passwordPattern && orderToEdit.passwordPattern.length > 0) {
        setPasswordType('PATTERN');
        setPatternNodes(orderToEdit.passwordPattern);
        setPasswordPin(orderToEdit.passwordPin || '');
      } else if (orderToEdit.passwordPin) {
        if (orderToEdit.passwordPin.startsWith('Desenho:')) {
          setPasswordType('PATTERN');
          const seq = orderToEdit.passwordPin
            .replace('Desenho:', '')
            .trim()
            .split('-')
            .map(Number)
            .filter((n) => !isNaN(n) && n >= 1 && n <= 9);
          setPatternNodes(seq);
          setPasswordPin('');
        } else {
          setPasswordType('PIN');
          setPasswordPin(orderToEdit.passwordPin);
          setPatternNodes([]);
        }
      } else {
        setPasswordType('NONE');
        setPasswordPin('');
        setPatternNodes([]);
      }

      // Load checklist accessories map
      const initialMap: Record<string, { present: boolean; details: string }> = {};
      const ca = orderToEdit.checklistAccessories || {};
      const accText = orderToEdit.accessories || '';

      loadedAccessories.forEach((acc) => {
        if (ca[acc.id]) {
          initialMap[acc.id] = {
            present: !!ca[acc.id].present,
            details: ca[acc.id].details || '',
          };
        } else {
          if (acc.id === 'acc-chip-1' && ca.chip1) {
            initialMap[acc.id] = { present: !!ca.chip1.present, details: ca.chip1.details || '' };
          } else if (acc.id === 'acc-chip-2' && ca.chip2) {
            initialMap[acc.id] = { present: !!ca.chip2.present, details: ca.chip2.details || '' };
          } else if (acc.id === 'acc-memory-card' && ca.memoryCard) {
            initialMap[acc.id] = { present: !!ca.memoryCard.present, details: ca.memoryCard.details || '' };
          } else if (acc.id === 'acc-case' && ca.caseCover) {
            initialMap[acc.id] = { present: !!ca.caseCover.present, details: ca.caseCover.details || '' };
          } else if (acc.id === 'acc-charger' && ca.charger) {
            initialMap[acc.id] = { present: !!ca.charger.present, details: ca.charger.details || '' };
          } else if (acc.id === 'acc-others' && ca.others) {
            initialMap[acc.id] = { present: !!ca.others.present, details: ca.others.details || '' };
          } else {
            const regex = new RegExp(`${acc.name}:?\\s*(sim|presente)`, 'i');
            const isPresent = regex.test(accText);
            initialMap[acc.id] = { present: isPresent, details: '' };
          }
        }
      });
      setCustomAccMap(initialMap);

    } else {
      // NEW OS -> Completely clean and ZEROED OUT
      let targetCust: Customer | null = null;
      if (initialCustomerId) {
        targetCust = currentCustomers.find((c) => c.id === initialCustomerId) || null;
      } else if (defaultCustomer) {
        targetCust = defaultCustomer;
      }

      if (targetCust) {
        setSelectedCustomer(targetCust);
        setCustomerSearch(targetCust.name);
      } else {
        setSelectedCustomer(null);
        setCustomerSearch('');
      }

      // Device fields ZEROED
      if (defaultDevice) {
        setDeviceId(defaultDevice.id);
        setDeviceType(defaultDevice.type);
        setBrand(defaultDevice.brand);
        setModel(defaultDevice.model);
        setImei(defaultDevice.imei || '');
        setSerialNumber(defaultDevice.serialNumber || '');
        setPasswordPin(defaultDevice.passwordPin || '');
        setPhysicalState(defaultDevice.physicalCondition || '');
      } else {
        setDeviceId('');
        setDeviceType((loadedDevTypes[0]?.name as DeviceType) || 'Smartphone');
        setBrand('');
        setModel('');
        setImei('');
        setSerialNumber('');
        setPhysicalState('');
      }

      // Password ZEROED
      setPasswordType('NONE');
      setPasswordPin('');
      setPatternNodes([]);
      setPatternNote('');

      // Dynamic Accessories Checklist ZEROED
      const initialMap: Record<string, { present: boolean; details: string }> = {};
      loadedAccessories.forEach((acc) => {
        initialMap[acc.id] = { present: false, details: '' };
      });
      setCustomAccMap(initialMap);

      // Defects & Prices ZEROED
      setClientDefect('');
      setServiceToBeDone('');
      setHasNoDamages(true);
      setPhysicalState('');
      setEntryDate(today);
      setDeliveryDate('');
      setIsDeliveryOptional(true);
      setDiscount(0);
      setCustomTotalPrice(null);
      setIsPriceUnlocked(false);
      setShowManagerAuthModal(false);
      setManagerPassInput('');
      setManagerPassError('');
      setPaymentMethod('Não informado');
      setInitialStatus('ORCAMENTO');
      setParts([]);
      setPartSearch('');
      setIsPartSearchOpen(false);
    }

    setError('');
  }, [isOpen, orderToEdit, defaultCustomer, defaultDevice, initialCustomerId]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (partSearchRef.current && !partSearchRef.current.contains(event.target as Node)) {
        setIsPartSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filtered customer list
  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) => {
        const query = customerSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          (c.document && c.document.includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query))
        );
      })
    : customers.slice(0, 8);

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setIsSearchOpen(false);

    // Check if customer already has registered devices
    const custDevs = allDevices.filter((d) => d.customerId === cust.id);
    if (custDevs.length > 0) {
      const dev = custDevs[0];
      setDeviceId(dev.id);
      setDeviceType(dev.type);
      setBrand(dev.brand);
      setModel(dev.model);
      setImei(dev.imei || '');
      setSerialNumber(dev.serialNumber || '');
      setPasswordPin(dev.passwordPin || '');
      setPhysicalState(dev.physicalCondition || '');
    }
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
    const qty = Math.max(1, Number(manualPartQty) || 1);
    const sub = qty * unitPrice;
    const newItem: OrderPartItem = {
      id: `part-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PECA',
      productName: manualPartName.trim(),
      name: manualPartName.trim(),
      quantity: qty,
      unitPrice: unitPrice,
      unitCost: 0,
      costPrice: 0,
      discount: 0,
      total: sub,
      totalPrice: sub,
    };
    setParts([...parts, newItem]);
    setManualPartName('');
    setManualPartQty(1);
    setManualPartPrice(0);
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

  // Calculations for Parts and Totals
  const partsTotal = parts.reduce(
    (sum, p) => sum + (p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0)),
    0
  );
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

  // Compile accessories checklist into a clean summary string for the active device type
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
      const finalBrand = brand.trim() || 'Geral';
      const finalModel = model.trim() || 'Aparelho';
      const finalClientDefect = clientDefect.trim() || 'Avaliação / Orçamento técnico';

      const nextNum = orderToEdit ? orderToEdit.orderNumber : StorageService.getNextOrderNumber();

      // Determine final password representation
      let finalPassword = '';
      if (passwordType === 'PIN') {
        finalPassword = passwordPin.trim();
      } else if (passwordType === 'PATTERN') {
        if (patternNodes.length > 0) {
          finalPassword = `Desenho: ${patternNodes.join('-')}${patternNote.trim() ? ` (${patternNote.trim()})` : ''}`;
        }
      }

      const compiledAccessories = compileAccessoriesSummary();

      const historyList = orderToEdit
        ? [
            ...(orderToEdit.statusHistory || orderToEdit.history || []),
            {
              timestamp: new Date().toISOString(),
              changedAt: new Date().toISOString(),
              status: initialStatus,
              userName: currentUser.name,
              changedBy: currentUser.name,
              notes: `OS editada por ${currentUser.name}`,
            },
          ]
        : [
            {
              timestamp: new Date().toISOString(),
              changedAt: new Date().toISOString(),
              status: initialStatus,
              userName: currentUser.name,
              changedBy: currentUser.name,
              notes: 'Ordem de serviço cadastrada no sistema',
            },
          ];

      // Build checklist dictionary
      const checklistObj: Record<string, { present: boolean; details: string }> = {};
      customAccessories.forEach((acc) => {
        const state = customAccMap[acc.id] || { present: false, details: '' };
        checklistObj[acc.id] = { present: state.present, details: state.details.trim() };
      });

      // Legacy fallback keys
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
      checklistObj.caseCover = {
        present: !!customAccMap['acc-case']?.present,
        details: customAccMap['acc-case']?.details?.trim() || '',
      };
      checklistObj.charger = {
        present: !!customAccMap['acc-charger']?.present,
        details: customAccMap['acc-charger']?.details?.trim() || '',
      };
      checklistObj.others = {
        present: !!customAccMap['acc-others']?.present,
        details: customAccMap['acc-others']?.details?.trim() || '',
      };

      const finalOrder: ServiceOrder = {
        id: orderToEdit ? orderToEdit.id : 'os-' + Date.now(),
        orderNumber: nextNum,
        customerId: targetCust.id,
        customerName: targetCust.name,
        customerPhone: targetCust.phone || targetCust.whatsapp || '',
        customerWhatsapp: targetCust.whatsapp || targetCust.phone || '',
        customerDocument: targetCust.document,
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
        physicalCondition: hasNoDamages ? 'Sem avarias aparentes' : (physicalState.trim() || 'Avarias relatadas'),
        physicalState: hasNoDamages ? 'Sem avarias aparentes' : (physicalState.trim() || 'Avarias relatadas'),
        clientDefect: finalClientDefect,
        technicalDiagnosis: serviceToBeDone.trim(),
        requestedService: serviceToBeDone.trim(),
        performedService: serviceToBeDone.trim(),
        items: parts.map((p) => ({
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
        parts: parts.map((p) => ({
          ...p,
          total: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
          totalPrice: p.totalPrice || p.total || p.quantity * p.unitPrice - (p.discount || 0),
        })),
        laborPrice: laborPriceVal,
        partsPrice: partsTotal,
        discount: Number(discount) || 0,
        totalPrice: finalOrderTotal,
        paymentMethod:
          paymentMethod !== 'Não informado' ? (paymentMethod as PaymentMethod) : undefined,
        paymentStatus: orderToEdit ? orderToEdit.paymentStatus : 'PENDENTE',
        status: initialStatus,
        technicianName: currentUser.name,
        attendantName: currentUser.name,
        warrantyDays: 90,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      {/* Main Proportional Container */}
      <div
        className={`w-full max-w-[99vw] 2xl:max-w-[1720px] h-[98vh] max-h-[98vh] rounded-2xl border flex flex-col overflow-hidden cursor-default ${
          isDark
            ? 'bg-[#060e22] border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.18)] text-slate-100'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className={`px-3 py-1.5 sm:px-4 sm:py-2 border-b shrink-0 flex items-center justify-between ${
            isDark
              ? 'bg-[#07132e]/95 border-slate-800/90'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-xs sm:text-sm font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {orderToEdit
                    ? 'Editar Ordem de Serviço'
                    : 'Nova Ordem de Serviço'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isDark
                      ? 'bg-[#0c1f44] text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  OS #{nextOrderNumber}
                </span>
                {selectedCustomer && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
                    • Cliente:{' '}
                    <strong className="text-slate-200">
                      {selectedCustomer.name}
                    </strong>
                  </span>
                )}
                {(brand || model) && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400">
                    • Aparelho:{' '}
                    <strong className="text-slate-200">
                      {brand} {model}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#0a162e] border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Notice if any */}
        {error && (
          <div className="mx-3 mt-1.5 p-1.5 bg-rose-950/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main 3-Column Proportional Grid Body (Non-scrolling on desktop) */}
        <div
          className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2.5 p-2 sm:p-2.5 overflow-hidden ${
            isDark
              ? 'bg-gradient-to-b from-[#060e22] via-[#071129] to-[#050c1e]'
              : 'bg-slate-50/70'
          }`}
        >
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

          {/* COLUMN 2: PROBLEMA, SERVIÇO & ACESSÓRIOS */}
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
          />

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
            statusChoices={STATUS_CHOICES}
          />
        </div>

        {/* Bottom Action Footer Bar */}
        <div
          className={`px-3 py-1.5 sm:px-4 sm:py-2 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 ${
            isDark
              ? 'bg-[#07132e]/95 border-slate-800/90'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0">
            <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
              {selectedCustomer ? selectedCustomer.name : 'Cliente não selecionado'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 truncate max-w-[150px]">
              {brand || model ? `${brand} ${model}` : 'Sem aparelho'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-bold text-emerald-400">
              Total: {formatCurrency(finalOrderTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printAfterCreate}
                onChange={(e) => setPrintAfterCreate(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#091632] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
              />
              <span>Imprimir comprovante</span>
            </label>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-4 sm:px-5 py-1.5 rounded-lg font-black text-xs text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {orderToEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Normal Customer Registration / Edit Modal */}
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

      {/* Full Normal Product Registration Modal directly from Order */}
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
