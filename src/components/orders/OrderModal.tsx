import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  X,
  User,
  Plus,
  Search,
  Smartphone,
  Tag,
  Lock,
  Headphones,
  FileText,
  AlertTriangle,
  Settings,
  Coins,
  Calendar,
  DollarSign,
  CreditCard,
  Flag,
  Check,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  Barcode,
  Package,
  Trash2,
  Sparkles,
  Grid,
  KeyRound,
  Shield,
  Layers,
  Cpu,
  HardDrive,
  BatteryCharging,
  Minus,
  Calculator,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
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
import { PatternLock } from './PatternLock';
import { useTheme } from '../../context/ThemeContext';

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

const COMMON_COLORS = [
  'Preto',
  'Branco',
  'Azul',
  'Dourado',
  'Prata',
  'Grafite / Cinza Espacial',
  'Vermelho',
  'Verde',
  'Roxo',
  'Rosa',
  'Titânio Natural',
  'Outra',
];

const COMMON_CAPACITIES = [
  '32GB',
  '64GB',
  '128GB',
  '256GB',
  '512GB',
  '1TB',
  'Não se aplica',
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
  const [color, setColor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [physicalState, setPhysicalState] = useState('');
  const [hasNoDamages, setHasNoDamages] = useState(true);

  // Password Options (Alphanumeric/PIN or Pattern Lock)
  const [passwordType, setPasswordType] = useState<'NONE' | 'PIN' | 'PATTERN'>('NONE');
  const [passwordPin, setPasswordPin] = useState('');
  const [patternNodes, setPatternNodes] = useState<number[]>([]);
  const [patternNote, setPatternNote] = useState('');

  // Dynamic Accessories Checklist State (Mapped by accessory ID or name)
  const [customAccMap, setCustomAccMap] = useState<Record<string, { present: boolean; details: string }>>({});

  // Problems & Services
  const [clientDefect, setClientDefect] = useState('');
  const [serviceToBeDone, setServiceToBeDone] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Forecast & Pricing
  const [entryDate, setEntryDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isDeliveryOptional, setIsDeliveryOptional] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Não informado');

  // Status
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('ORCAMENTO');

  // Options
  const [printAfterCreate, setPrintAfterCreate] = useState(true);
  const [error, setError] = useState('');

  // Quick Inline New Customer Modal State
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustDoc, setQuickCustDoc] = useState('');
  const [quickCustEmail, setQuickCustEmail] = useState('');

  // Inline Edit Selected Customer State
  const [isEditingSelectedCustomer, setIsEditingSelectedCustomer] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustDoc, setEditCustDoc] = useState('');

  // Parts list & Stock Products for OS Accounting
  const [parts, setParts] = useState<OrderPartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [partInputMode, setPartInputMode] = useState<'ESTOQUE' | 'AVULSO'>('ESTOQUE');
  const [partSearch, setPartSearch] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [showStockCatalog, setShowStockCatalog] = useState(false);
  const [showManualPartForm, setShowManualPartForm] = useState(false);
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

  const searchRef = useRef<HTMLDivElement>(null);
  const partSearchRef = useRef<HTMLDivElement>(null);

  // Subscribe to Storage updates (e.g. when customer is created or settings change)
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
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const twoDaysAhead = inTwoDays.toISOString().split('T')[0];

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
      setColor('');
      setCapacity('');
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
      setEstimatedPrice(orderToEdit.totalPrice || initialPartsTotal);
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
          // Check legacy keys
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
            // Check in accessories text
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
        setColor(defaultDevice.color || '');
        setImei(defaultDevice.imei || '');
        setSerialNumber(defaultDevice.serialNumber || '');
        setPasswordPin(defaultDevice.passwordPin || '');
        setPhysicalState(defaultDevice.physicalCondition || '');
      } else {
        setDeviceId('');
        setDeviceType((loadedDevTypes[0]?.name as DeviceType) || 'Smartphone');
        setBrand('');
        setModel('');
        setColor('');
        setCapacity('');
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
      setEstimatedPrice(0);
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
      setShowManualPartForm(false);
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
      setColor(dev.color || '');
      setImei(dev.imei || '');
      setSerialNumber(dev.serialNumber || '');
      setPasswordPin(dev.passwordPin || '');
      setPhysicalState(dev.physicalCondition || '');
    }
  };

  const handleQuickCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim() || !quickCustPhone.trim()) {
      alert('Nome e WhatsApp são obrigatórios.');
      return;
    }

    const allCustomers = StorageService.getCustomers();
    const normalizedNewName = quickCustName.trim().toLowerCase();
    const normalizedNewPhone = quickCustPhone.replace(/\D/g, '');

    const duplicateNameCust = allCustomers.find(c => 
      c.name.trim().toLowerCase() === normalizedNewName
    );

    const duplicatePhoneCust = normalizedNewPhone ? allCustomers.find(c => 
      c.phone.replace(/\D/g, '') === normalizedNewPhone
    ) : null;

    if (duplicateNameCust) {
      alert(`Já existe um cliente cadastrado com o nome "${duplicateNameCust.name}"!`);
      return;
    }

    if (duplicatePhoneCust) {
      alert(`O número de telefone "${quickCustPhone}" já está cadastrado para o cliente "${duplicatePhoneCust.name}"!`);
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: quickCustName.trim(),
      phone: quickCustPhone.trim(),
      whatsapp: quickCustPhone.trim(),
      document: quickCustDoc.trim(),
      email: quickCustEmail.trim(),
      address: '',
      city: '',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveCustomer(newCust);
    setSelectedCustomer(newCust);
    setCustomerSearch(newCust.name);
    setShowQuickCustomerModal(false);
    setQuickCustName('');
    setQuickCustPhone('');
    setQuickCustDoc('');
    setQuickCustEmail('');
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
    const unitCost = Number(manualPartCost) || 0;
    const qty = Math.max(1, Number(manualPartQty) || 1);
    const sub = qty * unitPrice;
    const newItem: OrderPartItem = {
      id: `part-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PECA',
      productName: manualPartName.trim(),
      name: manualPartName.trim(),
      quantity: qty,
      unitPrice: unitPrice,
      unitCost: unitCost,
      costPrice: unitCost,
      discount: 0,
      total: sub,
      totalPrice: sub,
    };
    setParts([...parts, newItem]);
    setManualPartName('');
    setManualPartQty(1);
    setManualPartPrice(0);
    setManualPartCost(0);
    setShowManualPartForm(false);
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
  const effectiveBasePrice = customTotalPrice !== null ? customTotalPrice : partsTotal;
  const finalOrderTotal = Math.max(0, effectiveBasePrice - (Number(discount) || 0));

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

  const handleApplyQuickService = (serv: { name: string; price: number }) => {
    if (!serviceToBeDone.trim()) {
      setServiceToBeDone(serv.name);
    } else {
      setServiceToBeDone((prev) => `${prev}, ${serv.name}`);
    }
    if (serv.price > 0) {
      setCustomTotalPrice((prev) => (prev === null || prev === 0 ? serv.price : prev + serv.price));
      setIsPriceUnlocked(true);
    }
    setShowServicePicker(false);
  };

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
          // Create new customer on the fly with the typed text
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
          // Fallback to default walk-in customer so OS creation NEVER fails
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

      // Build checklist dictionary preserving both legacy and dynamic IDs
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
        laborPrice: 0,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      {/* Main Container */}
      <div
        className={`w-full max-w-6xl rounded-3xl border flex flex-col my-auto max-h-[96vh] overflow-hidden cursor-default ${
          isDark
            ? 'bg-[#060e22] border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.2)] text-slate-100'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className={`px-5 py-4 sm:px-6 sm:py-4.5 border-b flex items-center justify-between ${
          isDark ? 'bg-[#07132e]/90 border-slate-800/90' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg lg:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {orderToEdit ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                </h2>
                <span className="text-blue-400 font-bold text-xs">✦</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                  isDark ? 'bg-[#0c1f44] text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  OS Rápida #{nextOrderNumber}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cadastre uma nova ordem de serviço de forma simples e rápida com campos zerados e checklist detalhado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#0a162e] border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body with 2-Column Desktop Layout */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin ${
          isDark ? 'bg-gradient-to-b from-[#060e22] via-[#071129] to-[#050c1e]' : 'bg-slate-50/70'
        }`}>
          
          {error && (
            <div className="p-3 bg-rose-950/50 text-rose-300 border border-rose-500/40 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start gap-4">
            
            {/* Left Main Form Sections (1 to 6) */}
            <div className="flex-1 w-full space-y-4 min-w-0">

              {/* 1. CLIENTE */}
              <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>1. CLIENTE</span>
                  </span>
                </div>

                {/* Customer Search & Quick Add */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" ref={searchRef}>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="Digite o nome, WhatsApp, CPF ou selecione..."
                      className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-all shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isSearchOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#081530] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/70">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left p-2.5 hover:bg-blue-600/20 transition-colors flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-white truncate">{c.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {c.phone} {c.document ? `• CPF: ${c.document}` : ''}
                                </p>
                              </div>
                              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-md font-bold shrink-0">
                                Selecionar
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            Nenhum cliente encontrado.{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchOpen(false);
                                setShowQuickCustomerModal(true);
                                setQuickCustName(customerSearch);
                              }}
                              className="text-cyan-400 font-bold hover:underline cursor-pointer ml-1"
                            >
                              Cadastrar agora?
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenNewCustomer) {
                        onOpenNewCustomer();
                      } else {
                        setShowQuickCustomerModal(true);
                      }
                    }}
                    className="px-3.5 py-2 sm:py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-400 border border-cyan-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Cliente</span>
                  </button>
                </div>

                {/* Selected Customer Preview Card */}
                {selectedCustomer && (
                  <div className="p-4 rounded-xl bg-[#091734] border border-slate-700/80">
                    {isEditingSelectedCustomer ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Alterar Dados do Cliente</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">NOME DO CLIENTE</label>
                            <input
                              type="text"
                              value={editCustName}
                              onChange={(e) => setEditCustName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#040a17] border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">WHATSAPP</label>
                            <input
                              type="text"
                              value={editCustPhone}
                              onChange={(e) => setEditCustPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#040a17] border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">CPF / CNPJ</label>
                            <input
                              type="text"
                              value={editCustDoc}
                              onChange={(e) => setEditCustDoc(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#040a17] border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-400 focus:outline-hidden"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingSelectedCustomer(false)}
                            className="px-3 py-1.5 text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editCustName.trim()) {
                                alert('O nome do cliente é obrigatório.');
                                return;
                              }
                              const updated: Customer = {
                                ...selectedCustomer,
                                name: editCustName.trim(),
                                phone: editCustPhone.trim(),
                                whatsapp: editCustPhone.trim(),
                                document: editCustDoc.trim(),
                              };
                              StorageService.saveCustomer(updated);
                              setSelectedCustomer(updated);
                              setIsEditingSelectedCustomer(false);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white truncate">
                                {selectedCustomer.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                Cliente selecionado
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                {selectedCustomer.whatsapp || selectedCustomer.phone || 'Sem WhatsApp'}
                              </span>
                              {selectedCustomer.document && (
                                <span className="text-slate-400">CPF: {selectedCustomer.document}</span>
                              )}
                              {whatsappClean && (
                                <a
                                  href={`https://wa.me/${whatsappClean}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCustName(selectedCustomer.name);
                              setEditCustPhone(selectedCustomer.whatsapp || selectedCustomer.phone || '');
                              setEditCustDoc(selectedCustomer.document || '');
                              setIsEditingSelectedCustomer(true);
                            }}
                            className="px-2.5 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-cyan-950/40 border border-cyan-800/40 rounded-lg font-bold"
                          >
                            Editar Dados
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setCustomerSearch('');
                            }}
                            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5"
                          >
                            Trocar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. EQUIPAMENTO */}
              <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      <Smartphone className="w-3 h-3" />
                    </div>
                    <span>2. EQUIPAMENTO</span>
                  </span>
                </div>

                {/* Row 1: Tipo, Marca, Modelo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Tipo
                    </label>
                    <div className="relative">
                      <select
                        value={deviceType}
                        onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                        className="w-full px-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-7"
                      >
                        {customDeviceTypes.map((dt) => (
                          <option key={dt.id} value={dt.name}>
                            {dt.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Marca <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="brands-list"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ex: Samsung, Apple..."
                        className="w-full px-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                      />
                      <datalist id="brands-list">
                        {COMMON_BRANDS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Modelo <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: Galaxy A32, iPhone 13..."
                      className="w-full px-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Row 2: IMEI e Avarias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      IMEI (Celular)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-mono text-[10px]">
                        ||||||||
                      </span>
                      <input
                        type="text"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        placeholder="Informe o IMEI (opcional)"
                        className="w-full pl-8 pr-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Avarias / Estado Físico
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 cursor-pointer select-none bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
                        <input
                          type="checkbox"
                          checked={hasNoDamages}
                          onChange={(e) => {
                            setHasNoDamages(e.target.checked);
                            if (e.target.checked) setPhysicalState('');
                          }}
                          className="w-3.5 h-3.5 rounded bg-[#091632] border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                        />
                        <span>Sem Avarias (Não mostrar na OS)</span>
                      </label>
                    </div>

                    {!hasNoDamages ? (
                      <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-amber-400">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={physicalState}
                          onChange={(e) => setPhysicalState(e.target.value)}
                          placeholder="Ex: Tampa traseira trincada, marcas de uso, arranhões..."
                          className="w-full pl-8 pr-2.5 py-2 bg-[#091632] border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    ) : (
                      <div className="px-2.5 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-emerald-400/90 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aparelho sem avarias relatadas na entrada</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: SENHA DO APARELHO (Texto/PIN ou Senha de Desenho / Padrão 3x3) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Senha / Desbloqueio do Aparelho</span>
                    </label>

                    {/* Mode Selector */}
                    <div className="flex items-center bg-[#091632] p-1 rounded-xl border border-slate-700/80 gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordType('NONE');
                          setPasswordPin('');
                          setPatternNodes([]);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          passwordType === 'NONE'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sem Senha
                      </button>

                      <button
                        type="button"
                        onClick={() => setPasswordType('PIN')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          passwordType === 'PIN'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>PIN / Senha Texto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPasswordType('PATTERN')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          passwordType === 'PATTERN'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-cyan-300'
                        }`}
                      >
                        <Grid className="w-3 h-3" />
                        <span>Senha de Desenho (Padrão)</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Input Views */}
                  {passwordType === 'PIN' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="relative max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={passwordPin}
                          onChange={(e) => setPasswordPin(e.target.value)}
                          placeholder="Digite a senha alfanumérica ou PIN de 4/6 dígitos..."
                          className="w-full pl-8 pr-2.5 py-2 bg-[#091632] border border-cyan-500/50 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  )}

                  {passwordType === 'PATTERN' && (
                    <div className="p-3.5 rounded-2xl bg-[#091632]/90 border border-cyan-500/40 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col md:flex-row items-center gap-5">
                      {/* Pattern Grid */}
                      <div className="shrink-0">
                        <PatternLock
                          value={patternNodes}
                          onChange={setPatternNodes}
                          size={150}
                          theme="dark"
                        />
                      </div>

                      {/* Instructions & Sequence Details */}
                      <div className="flex-1 w-full space-y-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#060e22] border border-slate-700/80">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300">Sequência Conectada:</span>
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">
                              {patternNodes.length} pontos
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-mono font-bold text-cyan-300 tracking-wider">
                            {patternNodes.length > 0
                              ? patternNodes.join(' ➔ ')
                              : 'Clique ou arraste nos círculos para desenhar o padrão'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Observação / Formato do Desenho (opcional)
                          </label>
                          <input
                            type="text"
                            value={patternNote}
                            onChange={(e) => setPatternNote(e.target.value)}
                            placeholder="Ex: Formato em L, Z começando em cima à esquerda..."
                            className="w-full px-2.5 py-1.5 bg-[#060e22] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 4: CHECKLIST DE ACESSÓRIOS DINÂMICO CONFORME TIPO DE EQUIPAMENTO (Configurável nas Configurações) */}
                <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                  {(() => {
                    const activeAccessories = customAccessories.filter((acc) =>
                      isAccessoryForDeviceType(acc, deviceType)
                    );
                    const presentCount = activeAccessories.filter((acc) => customAccMap[acc.id]?.present).length;

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Checklist de Entrada de Acessórios</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-semibold text-cyan-300">
                              {deviceType || 'Geral'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {presentCount > 0 ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {presentCount} {presentCount === 1 ? 'item marcado' : 'itens marcados'}
                              </span>
                            ) : (
                              <span>Nenhum item marcado</span>
                            )}
                            <span>•</span>
                            <span className="text-slate-500">
                              {activeAccessories.length} {activeAccessories.length === 1 ? 'item disponível' : 'itens disponíveis'}
                            </span>
                          </div>
                        </div>

                        {activeAccessories.length === 0 ? (
                          <div className="p-4 rounded-xl bg-[#091632] border border-slate-800 text-center text-xs text-slate-400">
                            Nenhum checklist de acessório específico cadastrado para este tipo de equipamento. Você pode configurar nas Configurações do Sistema.
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {activeAccessories.map((acc) => {
                              const itemState = customAccMap[acc.id] || { present: false, details: '' };
                              return (
                                <div
                                  key={acc.id}
                                  className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
                                    itemState.present
                                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                                      : 'bg-[#091632] border-slate-700/80 hover:border-slate-600'
                                  }`}
                                >
                                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                                        itemState.present
                                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                          : 'bg-slate-500'
                                      }`}
                                    ></span>
                                    <span>{acc.name}</span>
                                  </span>

                                  <div className="flex items-center gap-0.5 bg-[#060e22] p-0.5 rounded-lg border border-slate-700 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomAccMap((prev) => ({
                                          ...prev,
                                          [acc.id]: { ...(prev[acc.id] || { details: '' }), present: false },
                                        }))
                                      }
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                        !itemState.present ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      NÃO
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomAccMap((prev) => ({
                                          ...prev,
                                          [acc.id]: { ...(prev[acc.id] || { details: '' }), present: true },
                                        }))
                                      }
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                        itemState.present
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'text-slate-400 hover:text-emerald-400'
                                      }`}
                                    >
                                      SIM
                                    </button>
                                  </div>

                                  {itemState.present && (
                                    <input
                                      type="text"
                                      value={itemState.details}
                                      onChange={(e) =>
                                        setCustomAccMap((prev) => ({
                                          ...prev,
                                          [acc.id]: { ...(prev[acc.id] || { present: true }), details: e.target.value },
                                        }))
                                      }
                                      placeholder={acc.placeholder || 'Detalhes...'}
                                      className="w-28 px-2 py-0.5 bg-[#060e22] border border-emerald-500/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 animate-in fade-in"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 3 & 4. PROBLEMA RELATADO & SERVIÇO A SER FEITO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 3. PROBLEMA RELATADO PELO CLIENTE */}
                <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs uppercase tracking-wider">
                    <div className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                      !
                    </div>
                    <span className="text-slate-200">3. PROBLEMA RELATADO PELO CLIENTE <span className="text-rose-400">*</span></span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={clientDefect}
                      onChange={(e) => setClientDefect(e.target.value)}
                      placeholder="Descreva o problema reclamado pelo cliente (Ex: Não liga, tela trincada, bateria descarregando rápido...)"
                      className="w-full p-2.5 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 4. SERVIÇO A SER FEITO */}
                <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-black text-xs uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-200">4. SERVIÇO A SER FEITO</span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={serviceToBeDone}
                      onChange={(e) => setServiceToBeDone(e.target.value)}
                      placeholder="Descreva o serviço/diagnóstico previsto (Ex: Troca de tela original, reparo de conector, análise de placa...)"
                      className="w-full p-2.5 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* 5. PEÇAS E COMPONENTES UTILIZADOS (CONTABILIZAÇÃO NA OS) */}
              <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-200">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>5. PEÇAS E COMPONENTES UTILIZADOS</span>
                    <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                      Contabiliza na OS ({parts.length} itens)
                    </span>
                  </div>

                  {/* Dual Mode Switcher: Estoque vs Peça Avulsa */}
                  <div className="inline-flex p-0.5 bg-[#050e1f] border border-slate-700/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setPartInputMode('ESTOQUE');
                        setShowStockCatalog(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        partInputMode === 'ESTOQUE'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>📦 Peça do Estoque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartInputMode('AVULSO')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        partInputMode === 'AVULSO'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ Peça Avulsa / Manual</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: ADICIONAR PEÇA DO ESTOQUE */}
                {partInputMode === 'ESTOQUE' && (
                  <div className="space-y-2.5">
                    <div ref={partSearchRef} className="relative">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
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
                            placeholder="Buscar no estoque por nome, código de barras, SKU ou categoria..."
                            className="w-full pl-9 pr-8 py-2.5 bg-[#091632] border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 shadow-inner"
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

                        <button
                          type="button"
                          onClick={() => setShowStockCatalog(!showStockCatalog)}
                          className="px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          title="Visualizar catálogo de produtos cadastrados no estoque"
                        >
                          <Layers className="w-4 h-4" />
                          <span>{showStockCatalog ? 'Ocultar Catálogo' : 'Catálogo de Peças'}</span>
                        </button>
                      </div>

                      {/* Search Results Dropdown */}
                      {isPartSearchOpen && filteredProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#091632] border border-cyan-500/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-800">
                          {filteredProducts.map((p) => {
                            const price = p.sellingPrice || (p as any).price || 0;
                            const stock = p.stockQuantity !== undefined ? p.stockQuantity : p.stock || 0;
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleAddProductAsPart(p)}
                                className="p-2.5 hover:bg-cyan-950/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      Estoque
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    {p.category && <span>{p.category}</span>}
                                    {p.barcode && <span>Cód: {p.barcode}</span>}
                                    <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                      stock > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                    }`}>
                                      {stock > 0 ? `${stock} em estoque` : 'Sem estoque'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-emerald-400 block">
                                    {formatCurrency(price)}
                                  </span>
                                  <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                                    <Plus className="w-3 h-3" /> Inserir na OS
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Not found in stock message with one-click conversion to avulso */}
                      {isPartSearchOpen && partSearch.trim() && filteredProducts.length === 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#091632] border border-amber-500/50 rounded-xl shadow-xl z-50 p-3.5 text-center text-xs">
                          <p className="text-slate-300 font-medium">
                            Nenhum produto cadastrado no estoque com o nome "{partSearch}".
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setManualPartName(partSearch);
                              setPartInputMode('AVULSO');
                              setIsPartSearchOpen(false);
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar "{partSearch}" como Peça Avulsa</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stock Catalog Browser (Quick Select) */}
                    {showStockCatalog && (
                      <div className="p-3 bg-[#061024] border border-blue-900/60 rounded-xl space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Produtos do Estoque Disponíveis ({products.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Clique para adicionar à OS</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                          {products.map((p) => {
                            const price = p.sellingPrice || (p as any).price || 0;
                            const stock = p.stockQuantity !== undefined ? p.stockQuantity : p.stock || 0;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddProductAsPart(p)}
                                className="p-2 text-left bg-[#081530] hover:bg-blue-600/20 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg transition-all cursor-pointer flex flex-col justify-between group"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                    {p.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                    <span className={`px-1 py-0.2 rounded font-semibold ${
                                      stock > 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      {stock > 0 ? `${stock} em estoque` : '0 em estoque'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800">
                                  <span className="text-xs font-bold text-emerald-400">
                                    {formatCurrency(price)}
                                  </span>
                                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-0.5">
                                    <Plus className="w-3 h-3" /> Inserir
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: ADICIONAR PEÇA AVULSA / MANUAL (SEM ESTOQUE) */}
                {partInputMode === 'AVULSO' && (
                  <div className="p-3.5 rounded-xl bg-[#081532] border border-amber-500/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Inserir Peça Avulsa / Externa (Sem Vínculo com Estoque)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Esta peça será contabilizada no total da OS e detalhada no comprovante
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Nome / Descrição da Peça <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualPartName}
                          onChange={(e) => setManualPartName(e.target.value)}
                          placeholder="Ex: Conector de Carga C, Tela Original, Bateria G7..."
                          className="w-full px-3 py-2 bg-[#050e1f] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Qtd
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={manualPartQty}
                          onChange={(e) => setManualPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 bg-[#050e1f] border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400 text-center font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Preço Venda (R$) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={manualPartPrice}
                          onChange={(e) => setManualPartPrice(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full px-3 py-2 bg-[#050e1f] border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-end">
                        <button
                          type="button"
                          onClick={handleAddManualPart}
                          disabled={!manualPartName.trim()}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Peça Avulsa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table of Added Parts */}
                {parts.length === 0 ? (
                  <div className="py-4 px-3 rounded-xl border border-dashed border-slate-800 bg-[#091632]/40 text-center">
                    <Package className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-slate-300">
                      Nenhuma peça vinculada a esta Ordem de Serviço
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Busque peças no estoque acima ou clique em "+ Peça Avulsa / Manual" para adicionar e contabilizar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#091632]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0b1b3d] text-slate-400 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2 text-[11px]">Peça / Componente</th>
                            <th className="px-3 py-2 text-[11px] text-center w-28">Qtd</th>
                            <th className="px-3 py-2 text-[11px] text-right w-28">Valor Unit.</th>
                            <th className="px-3 py-2 text-[11px] text-right w-28">Subtotal</th>
                            <th className="px-2 py-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {parts.map((p, idx) => {
                            const sub = p.totalPrice || p.total || (p.quantity * p.unitPrice) - (p.discount || 0);
                            return (
                              <tr key={p.id || idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {p.productId ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        <Package className="w-2.5 h-2.5" />
                                        <span>Estoque</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Avulso</span>
                                      </span>
                                    )}
                                    <span className="font-bold text-white">
                                      {p.name || p.productName || 'Peça'}
                                    </span>
                                  </div>
                                  {p.productId && (
                                    <span className="text-[10px] text-cyan-400/90 font-mono block mt-0.5">
                                      Cód: {p.productId}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="inline-flex items-center gap-1 bg-[#07132c] border border-slate-700 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePartQty(idx, p.quantity - 1)}
                                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center font-bold text-white text-xs">
                                      {p.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePartQty(idx, p.quantity + 1)}
                                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {isPriceUnlocked ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={p.unitPrice}
                                      onChange={(e) => handleUpdatePartPrice(idx, parseFloat(e.target.value) || 0)}
                                      className="w-20 px-1.5 py-0.5 bg-[#07132c] border border-amber-500/60 rounded text-xs text-right font-bold text-amber-300 focus:outline-hidden focus:border-amber-400"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setManagerPassError('');
                                        setManagerPassInput('');
                                        setShowManagerAuthModal(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-amber-300 px-1.5 py-0.5 rounded border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                      title="Clique para autorizar alteração de valor com a Senha do Gerente"
                                    >
                                      <span>{formatCurrency(p.unitPrice)}</span>
                                      <Lock className="w-2.5 h-2.5 text-slate-500 hover:text-amber-400" />
                                    </button>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-400">
                                  {formatCurrency(sub)}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="Remover peça"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Subtotal Bar */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#091632] border border-slate-800 text-xs">
                      <span className="text-slate-400 font-medium">
                        Total de itens: <strong className="text-white">{parts.length}</strong> {parts.length === 1 ? 'peça' : 'peças'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold uppercase text-[11px]">
                          Subtotal Peças:
                        </span>
                        <span className="text-sm font-black text-cyan-400">
                          {formatCurrency(partsTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. VALORES, PREVISÃO & FORMA DE PAGAMENTO */}
              <div className="p-4 rounded-2xl bg-[#07132c]/70 border border-slate-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-200">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>6. VALORES, PREVISÃO E PAGAMENTO</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Cálculo: Itens / Valor da OS - Desconto
                  </span>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Card 1: Peças */}
                  <div className="p-3 rounded-xl bg-[#091632] border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Peças / Itens
                    </span>
                    <span className="text-sm font-black text-cyan-400 block">
                      {formatCurrency(partsTotal)}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      {parts.length} item(ns) na lista
                    </span>
                  </div>

                  {/* Card 2: Valor da OS / Serviço (Editável com Senha do Gerente) */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    isPriceUnlocked 
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-[#091632] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-300 block truncate">
                        Valor da OS (R$)
                      </label>
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
                          title="Clique para autorizar alteração de valor com senha do gerente"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>

                    {isPriceUnlocked ? (
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none text-amber-400 font-bold text-xs">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customTotalPrice !== null ? customTotalPrice : partsTotal}
                          onChange={(e) => setCustomTotalPrice(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full pl-7 pr-1.5 py-1 bg-[#07132c] border border-amber-500/50 rounded-lg text-xs font-black text-amber-300 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setManagerPassError('');
                          setManagerPassInput('');
                          setShowManagerAuthModal(true);
                        }}
                        className="cursor-pointer group flex items-center justify-between py-1"
                        title="Clique para editar com senha do gerente"
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

                  {/* Card 3: Desconto */}
                  <div className="p-3 rounded-xl bg-[#091632] border border-slate-800">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Desconto (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none text-rose-400/80 font-bold text-xs">
                        -
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full pl-5 pr-1.5 py-1 bg-[#07132c] border border-slate-700 rounded-lg text-xs font-bold text-rose-400 focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 block">
                      Abatimento
                    </span>
                  </div>

                  {/* Card 4: TOTAL DA ORDEM */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                      VALOR TOTAL DA OS
                    </span>
                    <span className="text-base font-black text-emerald-300 block">
                      {formatCurrency(finalOrderTotal)}
                    </span>
                    <span className="text-[9px] text-emerald-500/80 mt-0.5 block font-semibold">
                      Total a cobrar do cliente
                    </span>
                  </div>
                </div>

                {/* Entry, Delivery, Payment, and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Data de Entrada
                    </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Previsão de Entrega
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-cyan-300 cursor-pointer select-none bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                        <input
                          type="checkbox"
                          checked={isDeliveryOptional}
                          onChange={(e) => {
                            setIsDeliveryOptional(e.target.checked);
                            if (e.target.checked) setDeliveryDate('');
                          }}
                          className="w-3.5 h-3.5 rounded bg-[#091632] border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                        />
                        <span>A combinar / Sem data</span>
                      </label>
                    </div>
                    {!isDeliveryOptional ? (
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#091632] border border-cyan-500/50 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 animate-in fade-in"
                      />
                    ) : (
                      <div className="px-2.5 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 font-medium italic">
                        📅 Sem data definida (A combinar)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Forma de Pagamento
                    </label>
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#091632] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-7"
                      >
                        <option value="Não informado">Não informado</option>
                        {customPaymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.name}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Status Inicial
                    </label>
                    <div className="relative">
                      <select
                        value={initialStatus}
                        onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                        className="w-full px-3 py-2 bg-[#091632] border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer appearance-none pr-8 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      >
                        {STATUS_CHOICES.map((s) => (
                          <option key={s.status} value={s.status}>
                            {s.icon} {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Live Preview: "Resumo da OS" */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0">
              <div className="p-4 rounded-2xl bg-[#07132c]/90 border border-cyan-500/35 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-3.5 lg:sticky lg:top-0">
                
                {/* Header */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/90">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Resumo da OS
                  </h3>
                </div>

                {/* Live Fields */}
                <div className="space-y-3 text-xs">
                  
                  {/* Cliente */}
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Cliente</span>
                      <p className="font-bold text-white truncate">
                        {selectedCustomer ? selectedCustomer.name : 'Nenhum cliente selecionado'}
                      </p>
                    </div>
                  </div>

                  {/* Aparelho */}
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Aparelho</span>
                      <p className="font-bold text-white truncate">
                        {brand || model ? `${brand} ${model}` : 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Senha / Desbloqueio</span>
                      <p className="text-slate-200 font-mono text-[11px]">
                        {passwordType === 'NONE' && 'Sem senha informada'}
                        {passwordType === 'PIN' && (passwordPin ? `PIN: ${passwordPin}` : 'PIN não digitado')}
                        {passwordType === 'PATTERN' &&
                          (patternNodes.length > 0
                            ? `Padrão (${patternNodes.length} pts): ${patternNodes.join('➜')}`
                            : 'Desenho não configurado')}
                      </p>
                    </div>
                  </div>

                  {/* Acessórios */}
                  <div className="flex items-start gap-2.5">
                    <Headphones className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Acessórios Deixados</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {customAccessories
                          .filter((acc) => customAccMap[acc.id]?.present)
                          .map((acc) => (
                            <span
                              key={acc.id}
                              className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold"
                            >
                              {acc.name} {customAccMap[acc.id]?.details ? `(${customAccMap[acc.id].details})` : ''}
                            </span>
                          ))}
                        {customAccessories.every((acc) => !customAccMap[acc.id]?.present) && (
                          <span className="text-slate-400 text-[11px]">Nenhum item adicional</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Previsão de Entrega */}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Previsão</span>
                      <p className="text-slate-200">
                        {isDeliveryOptional || !deliveryDate
                          ? 'A combinar / Sem previsão'
                          : new Date(deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Problema */}
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Problema</span>
                      <p className="text-slate-200 line-clamp-2">
                        {clientDefect || 'Não descrito'}
                      </p>
                    </div>
                  </div>

                  {/* Serviço */}
                  <div className="flex items-start gap-2.5">
                    <Wrench className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block font-medium">Serviço</span>
                      <p className="text-slate-200 line-clamp-2">
                        {serviceToBeDone || 'A definir / Diagnóstico'}
                      </p>
                    </div>
                  </div>

                  {/* Peças Utilizadas (Live Breakdown) */}
                  <div className="pt-2.5 border-t border-slate-800/90 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-cyan-400" />
                        Peças ({parts.length})
                      </span>
                      <span className="font-bold text-cyan-400">
                        {formatCurrency(partsTotal)}
                      </span>
                    </div>

                    {parts.length > 0 && (
                      <div className="pl-4 space-y-0.5 max-h-20 overflow-y-auto">
                        {parts.map((p, i) => (
                          <div key={p.id || i} className="flex items-center justify-between text-[10px] text-slate-300">
                            <span className="truncate pr-1">• {p.quantity}x {p.name || p.productName}</span>
                            <span className="shrink-0 font-medium text-slate-400">
                              {formatCurrency((p.quantity * p.unitPrice) - (p.discount || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {effectiveBasePrice > 0 && parts.length === 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Valor do Serviço</span>
                        <span className="font-bold text-white">
                          {formatCurrency(effectiveBasePrice)}
                        </span>
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-rose-400">Desconto</span>
                        <span className="font-bold text-rose-400">
                          - {formatCurrency(discount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Valor Total da OS */}
                  <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-800/90 bg-[#091632]/70 -mx-4 -mb-3.5 p-4 rounded-b-2xl">
                    <DollarSign className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-emerald-400 block font-black uppercase tracking-wider">
                        TOTAL DA OS
                      </span>
                      <p className="text-xl font-black text-emerald-300">
                        {formatCurrency(finalOrderTotal)}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Actions Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-800/90 bg-[#07132e]/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700/80 bg-transparent hover:bg-slate-800/80 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Cancelar</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printAfterCreate}
                onChange={(e) => setPrintAfterCreate(e.target.checked)}
                className="w-4 h-4 rounded-sm bg-[#091632] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
              />
              <span>Imprimir após criar</span>
            </label>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{orderToEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in cursor-pointer"
          onClick={() => setShowQuickCustomerModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#081530] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-white cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Cadastro Rápido de Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nome Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  placeholder="Ex: Rafael Lima"
                  className="w-full px-3 py-2 bg-[#091632] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  WhatsApp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCustPhone}
                  onChange={(e) => setQuickCustPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-[#091632] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
                />
                {(() => {
                  const cleanNum = quickCustPhone.replace(/\D/g, '');
                  if (!cleanNum || cleanNum.length < 8) return null;
                  const all = StorageService.getCustomers();
                  const owner = all.find(c => 
                    c.phone.replace(/\D/g, '') === cleanNum || c.whatsapp?.replace(/\D/g, '') === cleanNum
                  );
                  if (!owner) return null;
                  return (
                    <div className="mt-2 p-2 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-300 text-xs font-semibold">
                      ⚠️ Este WhatsApp já pertence ao cliente: <strong>{owner.name}</strong>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={quickCustDoc}
                  onChange={(e) => setQuickCustDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 bg-[#091632] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">E-mail</label>
                <input
                  type="email"
                  value={quickCustEmail}
                  onChange={(e) => setQuickCustEmail(e.target.value)}
                  placeholder="rafael.lima@email.com"
                  className="w-full px-3 py-2 bg-[#091632] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
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
