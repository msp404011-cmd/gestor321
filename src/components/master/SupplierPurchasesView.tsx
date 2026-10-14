import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, Trash2, Calendar, 
  DollarSign, Package, Truck, Plus, Search,
  Edit3, ArrowRight, Check, AlertCircle, RefreshCw, Layers,
  Phone, MessageSquare, ExternalLink, Copy, CheckCheck, UserPlus,
  Building2, ChevronDown, ChevronUp, RotateCcw, Undo2, Send, FileText,
  BarChart3, BarChart2, Filter, X, ShieldAlert, CheckSquare
} from 'lucide-react';

export interface RegisteredSupplier {
  id: string;
  name: string;
  phone?: string;
  pixKey?: string;
  obs?: string;
  createdAt: string;
}

export interface SupplierPurchaseItem {
  purchaseId: string;
  id: string;
  title: string;
  typeName?: string;
  marca?: string;
  modelo?: string;
  estrutura?: string;
  qualidade?: string;
  cor?: string;
  quantity: number;
  price: number;
  supplierName: string;
  paymentStatus: 'Pendente' | 'Pago';
  createdAt: string;
  paidAt?: string | null;
  isReturned?: boolean;
  returnedAt?: string | null;
  returnReason?: string;
  isReceived?: boolean;
  receivedAt?: string | null;
  isDeliveredToSupplier?: boolean;
}

export interface MonthSummaryGroup {
  monthKey: string;
  year: number;
  monthIndex: number;
  monthName: string;
  label: string;
  totalMade: number;
  totalPaid: number;
  totalPending: number;
  itemsCount: number;
  paidCount: number;
  pendingCount: number;
  items: SupplierPurchaseItem[];
}

export interface WeekSummaryGroup {
  weekKey: string;
  year: number;
  weekNum: number;
  label: string;
  totalMade: number;
  totalPaid: number;
  totalPending: number;
  itemsCount: number;
  paidCount: number;
  pendingCount: number;
  items: SupplierPurchaseItem[];
}

interface SupplierPurchasesViewProps {
  items: SupplierPurchaseItem[];
  subTab: 'HISTORICO' | 'DEBITOS' | 'DEVOLUCOES';
  fieldSettings?: any;
  onUpdateStatus: (id: string, status: 'Pago' | 'Pendente') => void;
  onUpdateSupplier: (id: string, newSupplierName: string) => void;
  onDelete: (id: string) => void;
  onBulkDeletePurchases?: (purchaseIds: string[]) => Promise<void> | void;
  onAddPurchaseItem: (item: Omit<SupplierPurchaseItem, 'purchaseId'>) => void;
  onUpdatePurchaseItem?: (updatedItem: SupplierPurchaseItem) => Promise<void> | void;
  onBulkPayForSupplier?: (supplierName: string) => void;
  suppliers: RegisteredSupplier[];
  onAddSupplier: (supplier: Omit<RegisteredSupplier, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSupplierInfo: (supplier: RegisteredSupplier) => Promise<void>;
  onDeleteSupplier: (supplierId: string) => Promise<void>;
  onToggleReturn?: (purchaseId: string, isReturned: boolean, returnReason?: string) => void;
  onToggleReceived?: (purchaseId: string, isReceived: boolean) => void;
}

export const SupplierPurchasesView: React.FC<SupplierPurchasesViewProps> = ({ 
  items, 
  subTab, 
  fieldSettings: passedFieldSettings,
  onUpdateStatus, 
  onUpdateSupplier, 
  onDelete, 
  onBulkDeletePurchases,
  onAddPurchaseItem,
  onUpdatePurchaseItem,
  onBulkPayForSupplier,
  suppliers,
  onAddSupplier,
  onUpdateSupplierInfo,
  onDeleteSupplier,
  onToggleReturn,
  onToggleReceived
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newReturnForm, setNewReturnForm] = useState({
    title: '',
    typeName: 'Tela',
    marca: '',
    modelo: '',
    estrutura: '',
    qualidade: 'Premium',
    cor: 'Preto',
    quantity: 1,
    price: 0,
    supplierName: '',
    returnReason: 'Defeito de fábrica',
    customDate: new Date().toISOString().slice(0, 10)
  });

  // Helper to determine field visibility for pieces based on category settings
  const getPieceFieldConfig = (typeName?: string) => {
    let settings = passedFieldSettings;
    if (!settings) {
      try {
        const ls = localStorage.getItem('msp_supplier_field_settings_v4');
        if (ls) settings = JSON.parse(ls);
      } catch (_) {}
    }
    const cat = (typeName || 'Tela').toLowerCase();
    const tmpl = (settings?.templates || []).find((t: any) => (t.name || '').toLowerCase() === cat) || settings?.templates?.[0];
    const isTela = (tmpl?.name || cat).toLowerCase() === 'tela';
    return {
      showMarca: tmpl?.fields?.showMarca !== undefined ? Boolean(tmpl.fields.showMarca) : true,
      showModelo: tmpl?.fields?.showModelo !== undefined ? Boolean(tmpl.fields.showModelo) : true,
      showQualidade: tmpl?.fields?.showQualidade !== undefined ? Boolean(tmpl.fields.showQualidade) : true,
      showTecnologia: Boolean(tmpl?.fields?.showTecnologia),
      showEstrutura: tmpl?.fields?.showEstrutura !== undefined ? Boolean(tmpl.fields.showEstrutura) : isTela,
      showCor: Boolean(tmpl?.fields?.showCor),
    };
  };
  const [editingSupplier, setEditingSupplier] = useState<RegisteredSupplier | null>(null);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Editing piece/order state across all tabs (Data, Valor, Todos os Dados)
  const [editingPiece, setEditingPiece] = useState<SupplierPurchaseItem | null>(null);
  const [editingPieceForm, setEditingPieceForm] = useState<{
    title: string;
    typeName: string;
    marca: string;
    modelo: string;
    estrutura: string;
    qualidade: string;
    cor: string;
    quantity: number;
    price: number;
    supplierName: string;
    paymentStatus: 'Pendente' | 'Pago';
    createdAt: string;
    isReceived: boolean;
    isReturned: boolean;
    returnReason: string;
  }>({
    title: '',
    typeName: 'Tela',
    marca: '',
    modelo: '',
    estrutura: '',
    qualidade: '',
    cor: '',
    quantity: 1,
    price: 0,
    supplierName: '',
    paymentStatus: 'Pendente',
    createdAt: new Date().toISOString().split('T')[0],
    isReceived: false,
    isReturned: false,
    returnReason: ''
  });

  const handleOpenEditPieceModal = (piece: SupplierPurchaseItem) => {
    let dateStr = new Date().toISOString().split('T')[0];
    if (piece.createdAt) {
      if (piece.createdAt.includes('T')) {
        dateStr = piece.createdAt.split('T')[0];
      } else {
        const parsed = new Date(piece.createdAt);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString().split('T')[0];
        }
      }
    }
    setEditingPiece(piece);
    setEditingPieceForm({
      title: piece.title || '',
      typeName: piece.typeName || 'Tela',
      marca: piece.marca || '',
      modelo: piece.modelo || '',
      estrutura: piece.estrutura || '',
      qualidade: piece.qualidade || '',
      cor: piece.cor || '',
      quantity: Number(piece.quantity) || 1,
      price: Number(piece.price) || 0,
      supplierName: piece.supplierName || '',
      paymentStatus: piece.paymentStatus || 'Pendente',
      createdAt: dateStr,
      isReceived: !!piece.isReceived,
      isReturned: !!piece.isReturned,
      returnReason: piece.returnReason || ''
    });
  };

  const handleSaveEditedPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPiece) return;

    let finalCreatedAt = editingPiece.createdAt;
    if (editingPieceForm.createdAt) {
      if (editingPieceForm.createdAt.includes('T')) {
        finalCreatedAt = editingPieceForm.createdAt;
      } else {
        finalCreatedAt = `${editingPieceForm.createdAt}T12:00:00.000Z`;
      }
    }

    const updated: SupplierPurchaseItem = {
      ...editingPiece,
      title: editingPieceForm.title.trim() || `${editingPieceForm.typeName} ${editingPieceForm.modelo || ''}`.trim() || 'Peça',
      typeName: editingPieceForm.typeName || 'Tela',
      marca: editingPieceForm.marca.trim(),
      modelo: editingPieceForm.modelo.trim(),
      estrutura: editingPieceForm.estrutura.trim(),
      qualidade: editingPieceForm.qualidade.trim(),
      cor: editingPieceForm.cor.trim(),
      quantity: Math.max(1, Number(editingPieceForm.quantity) || 1),
      price: Math.max(0, Number(editingPieceForm.price) || 0),
      supplierName: editingPieceForm.supplierName.trim() || editingPiece.supplierName,
      paymentStatus: editingPieceForm.paymentStatus,
      paidAt: editingPieceForm.paymentStatus === 'Pago' ? (editingPiece.paidAt || new Date().toISOString()) : null,
      createdAt: finalCreatedAt,
      isReceived: editingPieceForm.isReceived,
      receivedAt: editingPieceForm.isReceived ? (editingPiece.receivedAt || new Date().toISOString()) : null,
      isReturned: editingPieceForm.isReturned,
      returnedAt: editingPieceForm.isReturned ? (editingPiece.returnedAt || new Date().toISOString()) : null,
      returnReason: editingPieceForm.returnReason.trim()
    };

    if (onUpdatePurchaseItem) {
      onUpdatePurchaseItem(updated);
    }
    setEditingPiece(null);
  };

  // Conference modal state for generating debt report for supplier
  const [conferenceModal, setConferenceModal] = useState<{
    isOpen: boolean;
    supplierName: string;
    supplierInfo?: RegisteredSupplier;
    dateGroups: any[];
    pendingItems: SupplierPurchaseItem[];
    copiedText: boolean;
    filterMode: 'ALL' | 'DAY' | 'SELECTED';
    selectedDayKey: string;
    selectedPieceIds: string[];
    pieceSearch: string;
  }>({
    isOpen: false,
    supplierName: '',
    supplierInfo: undefined,
    dateGroups: [],
    pendingItems: [],
    copiedText: false,
    filterMode: 'ALL',
    selectedDayKey: '',
    selectedPieceIds: [],
    pieceSearch: '',
  });

  const [returnsConferenceModal, setReturnsConferenceModal] = useState<{
    isOpen: boolean;
    supplierName: string;
    supplierInfo?: RegisteredSupplier;
    items: SupplierPurchaseItem[];
    copiedText?: boolean;
    onlyInStore?: boolean;
  }>({
    isOpen: false,
    supplierName: '',
    items: [],
    onlyInStore: false
  });

  // Return modal state
  const [returnModal, setReturnModal] = useState<{
    isOpen: boolean;
    piece: SupplierPurchaseItem | null;
    supplierName: string;
    supplierPhone: string;
    reason: string;
  }>({
    isOpen: false,
    piece: null,
    supplierName: '',
    supplierPhone: '',
    reason: 'Defeito de fábrica'
  });

  // Filter inside card by status
  const [cardPieceFilters, setCardPieceFilters] = useState<Record<string, 'ALL' | 'PENDENTE' | 'PAGO' | 'DEVOLUCAO'>>({});

  // Collapsed suppliers state (true = whole supplier card is collapsed)
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Record<string, boolean>>({});

  // Open curtains state for date groups within supplier cards (key: `${supplierId}_${dateKey}`)
  // By default, ALL curtains start RECOLHIDAS (closed = false), descending only when clicked
  const [openCurtains, setOpenCurtains] = useState<Record<string, boolean>>({});

  const toggleSupplierCollapse = (supplierId: string) => {
    setCollapsedSuppliers(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const toggleCurtain = (curtainKey: string) => {
    setOpenCurtains(prev => ({
      ...prev,
      [curtainKey]: !prev[curtainKey]
    }));
  };

  const setAllCurtainsForSupplier = (supplierId: string, dateKeys: string[], open: boolean) => {
    setOpenCurtains(prev => {
      const next = { ...prev };
      dateKeys.forEach(k => {
        next[`${supplierId}_${k}`] = open;
      });
      return next;
    });
  };

  // Helper to extract date key and display labels
  const getDateKeyAndLabels = (dateStr?: string | null) => {
    if (!dateStr) {
      const today = new Date();
      const key = today.toISOString().split('T')[0];
      return {
        dateKey: key,
        displayDate: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        weekday: today.toLocaleDateString('pt-BR', { weekday: 'long' }),
        dayBadge: 'Hoje'
      };
    }

    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return {
          dateKey: 'sem_data',
          displayDate: 'Data não informada',
          weekday: '',
          dayBadge: undefined
        };
      }

      const key = d.toISOString().split('T')[0];
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const displayDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });

      let dayBadge: string | undefined = undefined;
      if (isToday) dayBadge = 'Hoje';
      else if (isYesterday) dayBadge = 'Ontem';

      return {
        dateKey: key,
        displayDate,
        weekday,
        dayBadge
      };
    } catch {
      return {
        dateKey: 'sem_data',
        displayDate: 'Data não informada',
        weekday: '',
        dayBadge: undefined
      };
    }
  };

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    pixKey: '',
    obs: ''
  });

  // Manual Piece Form State
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    typeName: 'Tela',
    marca: '',
    modelo: '',
    estrutura: 'Com Aro',
    qualidade: 'Premium',
    cor: 'Preto',
    quantity: 1,
    price: 0,
    supplierName: '',
    paymentStatus: 'Pendente' as 'Pendente' | 'Pago'
  });

  // Configurable options for manual purchase form
  const [estruturaOpts, setEstruturaOpts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('msp_purch_est_opts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          const hasC = arr.some(a => a.trim().toUpperCase() === 'C/ ARO');
          const hasS = arr.some(a => a.trim().toUpperCase() === 'S/ ARO');
          const merged = [...arr];
          if (!hasC) merged.unshift('C/ ARO');
          if (!hasS) merged.splice(1, 0, 'S/ ARO');
          return merged;
        }
      }
    } catch(e){}
    return ['C/ ARO', 'S/ ARO', 'Com Aro', 'Sem Aro'];
  });

  const [qualidadeOpts, setQualidadeOpts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('msp_purch_qual_opts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch(e){}
    return ['DIAMONDS', 'CHINA GOLD PRO', 'Original', 'Premium', 'OLED', 'INCELL'];
  });

  const [corOpts, setCorOpts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('msp_purch_cor_opts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch(e){}
    return ['Preto', 'Branco', 'Azul', 'Dourado', 'Grafite', 'Prata'];
  });

  const [marcaOpts, setMarcaOpts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('msp_purch_marca_opts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch(e){}
    return ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Realme'];
  });

  const [quickAddPurchase, setQuickAddPurchase] = useState<Record<string, string>>({});

  const handleAddPurchOption = (category: 'estrutura'|'qualidade'|'cor'|'marca', valToAdd?: string) => {
    const val = (valToAdd || quickAddPurchase[category] || '').trim();
    if (!val) return;
    if (category === 'estrutura') {
      if (!estruturaOpts.includes(val)) {
        const next = [...estruturaOpts, val];
        setEstruturaOpts(next);
        try { localStorage.setItem('msp_purch_est_opts', JSON.stringify(next)); } catch(e){}
      }
      setNewItemForm(prev => ({ ...prev, estrutura: val }));
    } else if (category === 'qualidade') {
      if (!qualidadeOpts.includes(val)) {
        const next = [...qualidadeOpts, val];
        setQualidadeOpts(next);
        try { localStorage.setItem('msp_purch_qual_opts', JSON.stringify(next)); } catch(e){}
      }
      setNewItemForm(prev => ({ ...prev, qualidade: val }));
    } else if (category === 'cor') {
      if (!corOpts.includes(val)) {
        const next = [...corOpts, val];
        setCorOpts(next);
        try { localStorage.setItem('msp_purch_cor_opts', JSON.stringify(next)); } catch(e){}
      }
      setNewItemForm(prev => ({ ...prev, cor: val }));
    } else if (category === 'marca') {
      if (!marcaOpts.includes(val)) {
        const next = [...marcaOpts, val];
        setMarcaOpts(next);
        try { localStorage.setItem('msp_purch_marca_opts', JSON.stringify(next)); } catch(e){}
      }
      setNewItemForm(prev => ({ ...prev, marca: val }));
    }
    setQuickAddPurchase(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemovePurchOption = (category: 'estrutura'|'qualidade'|'cor'|'marca', val: string) => {
    if (category === 'estrutura') {
      const next = estruturaOpts.filter(o => o !== val);
      setEstruturaOpts(next);
      try { localStorage.setItem('msp_purch_est_opts', JSON.stringify(next)); } catch(e){}
    } else if (category === 'qualidade') {
      const next = qualidadeOpts.filter(o => o !== val);
      setQualidadeOpts(next);
      try { localStorage.setItem('msp_purch_qual_opts', JSON.stringify(next)); } catch(e){}
    } else if (category === 'cor') {
      const next = corOpts.filter(o => o !== val);
      setCorOpts(next);
      try { localStorage.setItem('msp_purch_cor_opts', JSON.stringify(next)); } catch(e){}
    } else if (category === 'marca') {
      const next = marcaOpts.filter(o => o !== val);
      setMarcaOpts(next);
      try { localStorage.setItem('msp_purch_marca_opts', JSON.stringify(next)); } catch(e){}
    }
  };

  // Filter items based on subTab
  const currentTabItems = useMemo(() => {
    if (subTab === 'HISTORICO') {
      return items.filter(i => i.paymentStatus === 'Pago' && !i.isReturned);
    }
    if (subTab === 'DEBITOS') {
      return items.filter(i => i.paymentStatus === 'Pendente' && !i.isReturned);
    }
    return items;
  }, [items, subTab]);

  // Combined list of suppliers (from registered + any existing in items)
  const allSuppliersList = useMemo(() => {
    const map = new Map<string, RegisteredSupplier>();
    
    suppliers.forEach(s => {
      if (s.name && s.name.trim()) {
        map.set(s.name.trim().toLowerCase(), s);
      }
    });

    // Auto-detect any supplier name in purchases that isn't registered yet
    items.forEach(i => {
      const name = i.supplierName?.trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: name,
          phone: '',
          pixKey: '',
          obs: 'Adicionado automaticamente via pedido',
          createdAt: new Date().toISOString()
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, items]);

  // Filtered Items for lists
  const filteredItems = useMemo(() => {
    return currentTabItems.filter(item => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.modelo || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSupplier = supplierFilter === 'ALL' || item.supplierName === supplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [currentTabItems, searchTerm, supplierFilter]);

  // Metrics (Devoluções NÃO são contabilizadas no total a pagar ou em aberto)
  const totalPendingAmount = useMemo(() => {
    return items
      .filter(i => i.paymentStatus === 'Pendente' && !i.isReturned)
      .reduce((acc, curr) => acc + ((Number(curr.price) || 0) * (Number(curr.quantity) || 1)), 0);
  }, [items]);

  const totalPaidAmount = useMemo(() => {
    return items
      .filter(i => i.paymentStatus === 'Pago' && !i.isReturned)
      .reduce((acc, curr) => acc + ((Number(curr.price) || 0) * (Number(curr.quantity) || 1)), 0);
  }, [items]);

  const totalReturnedCount = useMemo(() => {
    return items.filter(i => !!i.isReturned).length;
  }, [items]);

  // Debts grouped by supplier AND divided by date for DEBITOS view (ignora peças devolvidas)
  const debtsBySupplierAndDate = useMemo(() => {
    const pendingItems = items.filter(i => i.paymentStatus === 'Pendente' && !i.isReturned);
    const searchLower = searchTerm.trim().toLowerCase();

    const filteredPending = pendingItems.filter(item => {
      const matchesSupplier = supplierFilter === 'ALL' || item.supplierName === supplierFilter;
      if (!matchesSupplier) return false;

      if (!searchLower) return true;

      const dateObj = getDateKeyAndLabels(item.createdAt);
      const fullSearchText = `${item.title || ''} ${item.typeName || ''} ${item.supplierName || ''} ${item.marca || ''} ${item.modelo || ''} ${item.cor || ''} ${item.qualidade || ''} ${item.estrutura || ''} ${dateObj.displayDate} ${dateObj.weekday}`;
      return fullSearchText.toLowerCase().includes(searchLower);
    });

    const supplierMap = new Map<string, {
      supplierName: string;
      supplierInfo?: RegisteredSupplier;
      total: number;
      totalReceived: number;
      totalMissing: number;
      count: number;
      countReceived: number;
      countMissing: number;
      dateMap: Map<string, {
        dateKey: string;
        displayDate: string;
        weekday: string;
        dayBadge?: string;
        dateTotal: number;
        dateTotalReceived: number;
        dateTotalMissing: number;
        dateCount: number;
        dateCountReceived: number;
        dateCountMissing: number;
        items: SupplierPurchaseItem[];
      }>;
    }>();

    filteredPending.forEach(item => {
      const supName = item.supplierName?.trim() || 'Fornecedor Desconhecido';
      if (!supplierMap.has(supName)) {
        const foundSupplierInfo = allSuppliersList.find(s => s.name.trim().toLowerCase() === supName.toLowerCase());
        supplierMap.set(supName, {
          supplierName: supName,
          supplierInfo: foundSupplierInfo,
          total: 0,
          totalReceived: 0,
          totalMissing: 0,
          count: 0,
          countReceived: 0,
          countMissing: 0,
          dateMap: new Map(),
        });
      }

      const supGroup = supplierMap.get(supName)!;
      const itemQty = Number(item.quantity) || 1;
      const itemSubtotal = (Number(item.price) || 0) * itemQty;
      const isItemReceived = !!item.isReceived;

      supGroup.total += itemSubtotal;
      supGroup.count += itemQty;

      if (isItemReceived) {
        supGroup.totalReceived += itemSubtotal;
        supGroup.countReceived += itemQty;
      } else {
        supGroup.totalMissing += itemSubtotal;
        supGroup.countMissing += itemQty;
      }

      const { dateKey, displayDate, weekday, dayBadge } = getDateKeyAndLabels(item.createdAt);
      if (!supGroup.dateMap.has(dateKey)) {
        supGroup.dateMap.set(dateKey, {
          dateKey,
          displayDate,
          weekday,
          dayBadge,
          dateTotal: 0,
          dateTotalReceived: 0,
          dateTotalMissing: 0,
          dateCount: 0,
          dateCountReceived: 0,
          dateCountMissing: 0,
          items: [],
        });
      }

      const dGroup = supGroup.dateMap.get(dateKey)!;
      dGroup.dateTotal += itemSubtotal;
      dGroup.dateCount += itemQty;

      if (isItemReceived) {
        dGroup.dateTotalReceived += itemSubtotal;
        dGroup.dateCountReceived += itemQty;
      } else {
        dGroup.dateTotalMissing += itemSubtotal;
        dGroup.dateCountMissing += itemQty;
      }

      dGroup.items.push(item);
    });

    return Array.from(supplierMap.values()).map(sup => {
      const sortedDates = Array.from(sup.dateMap.values()).sort((a, b) => {
        if (a.dateKey === 'sem_data') return 1;
        if (b.dateKey === 'sem_data') return -1;
        return b.dateKey.localeCompare(a.dateKey);
      });

      return {
        supplierName: sup.supplierName,
        supplierInfo: sup.supplierInfo,
        total: sup.total,
        totalReceived: sup.totalReceived,
        totalMissing: sup.totalMissing,
        count: sup.count,
        countReceived: sup.countReceived,
        countMissing: sup.countMissing,
        dateGroups: sortedDates,
      };
    }).sort((a, b) => b.total - a.total);
  }, [items, searchTerm, supplierFilter, allSuppliersList]);

  // Debts grouped by supplier for DEBITOS summary header (ignora peças devolvidas)
  const debtsBySupplier = useMemo(() => {
    const groups: Record<string, { total: number; count: number; items: SupplierPurchaseItem[] }> = {};
    items
      .filter(i => i.paymentStatus === 'Pendente' && !i.isReturned)
      .forEach(item => {
        const sup = item.supplierName || 'Fornecedor Desconhecido';
        if (!groups[sup]) {
          groups[sup] = { total: 0, count: 0, items: [] };
        }
        groups[sup].total += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        groups[sup].count += Number(item.quantity) || 1;
        groups[sup].items.push(item);
      });
    return groups;
  }, [items]);

  // Returns grouped by supplier for DEVOLUCOES tab (pending payments with isReturned true)
  const returnsBySupplier = useMemo(() => {
    const returnedItems = items.filter(i => !!i.isReturned && i.paymentStatus === 'Pendente');
    const searchLower = searchTerm.trim().toLowerCase();

    const filtered = returnedItems.filter(item => {
      const matchesSupplier = supplierFilter === 'ALL' || item.supplierName === supplierFilter;
      if (!matchesSupplier) return false;
      if (!searchLower) return true;
      const fullSearchText = `${item.title || ''} ${item.typeName || ''} ${item.supplierName || ''} ${item.marca || ''} ${item.modelo || ''} ${item.returnReason || ''}`;
      return fullSearchText.toLowerCase().includes(searchLower);
    });

    const supMap = new Map<string, {
      supplierName: string;
      supplierInfo?: RegisteredSupplier;
      items: SupplierPurchaseItem[];
      totalDesconsidered: number;
      count: number;
    }>();

    filtered.forEach(item => {
      const supName = item.supplierName?.trim() || 'Fornecedor Desconhecido';
      if (!supMap.has(supName)) {
        const foundSup = allSuppliersList.find(s => s.name.trim().toLowerCase() === supName.toLowerCase());
        supMap.set(supName, {
          supplierName: supName,
          supplierInfo: foundSup,
          items: [],
          totalDesconsidered: 0,
          count: 0
        });
      }
      const group = supMap.get(supName)!;
      const sub = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      group.items.push(item);
      group.totalDesconsidered += sub;
      group.count += Number(item.quantity) || 1;
    });

    return Array.from(supMap.values()).sort((a, b) => b.count - a.count);
  }, [items, searchTerm, supplierFilter, allSuppliersList]);

  const formatReturnsConferenceWhatsApp = (supplierName: string, returnedItems: SupplierPurchaseItem[], onlyInStore = false): string => {
    const listToProcess = onlyInStore 
      ? returnedItems.filter(i => !i.isDeliveredToSupplier)
      : returnedItems;

    let totalDesconsidered = 0;
    let totalCount = 0;
    listToProcess.forEach(i => {
      const qty = Number(i.quantity) || 1;
      totalDesconsidered += (Number(i.price) || 0) * qty;
      totalCount += qty;
    });

    let text = `🔄 *RELATÓRIO DE CONFERÊNCIA DE DEVOLUÇÃO* 🔄\n`;
    text += `🏢 *Fornecedor:* ${supplierName}\n`;
    text += `📅 *Data da Emissão:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    if (onlyInStore) {
      text += `📦 *Foco:* Apenas Peças na Loja (Aguardando Envio)\n`;
    }
    text += `-----------------------------------\n\n`;

    text += `⚠️ *ATENÇÃO: LISTA DE PEÇAS DEVOLVIDAS*\n`;
    text += `💰 *Valor Total Desconsiderado:* R$ ${totalDesconsidered.toFixed(2).replace('.', ',')}\n`;
    text += `🔢 *Total de Peças:* ${listToProcess.length} modelos (${totalCount} peças no total)\n\n`;
    text += `-----------------------------------\n\n`;

    listToProcess.forEach((item, idx) => {
      const typePrefix = item.typeName ? `${item.typeName} ` : '';
      let cleanTitle = (item.title || '').trim();
      if (item.typeName && cleanTitle.toLowerCase().startsWith(item.typeName.toLowerCase() + ' ')) {
        cleanTitle = cleanTitle.slice(item.typeName.length + 1).trim();
      }
      const estUpper = (item.estrutura || '').trim().toUpperCase();
      const estBadge = estUpper ? ` - ${estUpper}` : '';

      text += `${idx + 1}. 📱 ~${typePrefix}${cleanTitle}${estBadge}~ 🔄 [DEVOLVIDA]\n`;
      if (item.marca) text += `🏷️ Marca: ${item.marca}\n`;
      if (item.modelo) text += `📱 Modelo: ${item.modelo}\n`;
      if (estUpper) text += `⭕ Estrutura: ${estUpper}\n`;
      if (item.qualidade) text += `⚡ Qualidade: ${item.qualidade}\n`;
      if (item.cor) text += `🎨 Cor: ${item.cor}\n`;
      
      const sub = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      text += `💵 Valor Original: ~R$ ${sub.toFixed(2).replace('.', ',')}~ (${item.quantity}x R$ ${(Number(item.price) || 0).toFixed(2).replace('.', ',')})\n`;
      if (item.returnReason) text += `📝 Motivo: ${item.returnReason}\n`;
      
      const deliveryStatusText = item.isDeliveredToSupplier 
        ? `🚚 Status: Já Entregue ao Fornecedor` 
        : `📦 Status: Ainda na Loja (Aguardando Entrega)`;
      text += `${deliveryStatusText}\n\n`;
    });

    text += `-----------------------------------\n`;
    text += `Por favor, confirme a relação e o valor destas devoluções.`;
    return text;
  };

  const handleSendReturnsWhatsApp = (phone: string, supplierName: string, returnedItems: SupplierPurchaseItem[], onlyInStore = false) => {
    const listToProcess = onlyInStore ? returnedItems.filter(i => !i.isDeliveredToSupplier) : returnedItems;
    if (listToProcess.length === 0) return;
    const msg = formatReturnsConferenceWhatsApp(supplierName, returnedItems, onlyInStore);
    openWhatsAppMessageSafely(phone, msg);
  };

  // -------------------------------------------------------------
  // HISTÓRICO CONSOLIDADO POR MÊS E POR SEMANA & GERENCIAMENTO
  // -------------------------------------------------------------
  const parsePurchaseDate = (dateStr?: string | null): Date => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const groupPurchasesByMonth = (list: SupplierPurchaseItem[]): MonthSummaryGroup[] => {
    const map: Record<string, MonthSummaryGroup> = {};
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    list.forEach(item => {
      const d = parsePurchaseDate(item.createdAt);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIndex]} de ${year}`;

      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          year,
          monthIndex,
          monthName: monthNames[monthIndex],
          label,
          totalMade: 0,
          totalPaid: 0,
          totalPending: 0,
          itemsCount: 0,
          paidCount: 0,
          pendingCount: 0,
          items: []
        };
      }

      const group = map[monthKey];
      const qty = Number(item.quantity) || 1;
      const subtotal = (Number(item.price) || 0) * qty;

      group.items.push(item);
      group.itemsCount += qty;

      if (!item.isReturned) {
        group.totalMade += subtotal;
        if (item.paymentStatus === 'Pago') {
          group.totalPaid += subtotal;
          group.paidCount += qty;
        } else {
          group.totalPending += subtotal;
          group.pendingCount += qty;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const groupPurchasesByWeek = (list: SupplierPurchaseItem[]): WeekSummaryGroup[] => {
    const map: Record<string, WeekSummaryGroup> = {};

    list.forEach(item => {
      const d = parsePurchaseDate(item.createdAt);
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = date.getDay();
      const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(date.setDate(diffToMonday));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const year = startOfWeek.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const numberOfDays = Math.floor((startOfWeek.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.max(1, Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7));

      const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
      const startStr = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const endStr = endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const label = `Semana ${weekNum} (${startStr} a ${endStr})`;

      if (!map[weekKey]) {
        map[weekKey] = {
          weekKey,
          year,
          weekNum,
          label,
          totalMade: 0,
          totalPaid: 0,
          totalPending: 0,
          itemsCount: 0,
          paidCount: 0,
          pendingCount: 0,
          items: []
        };
      }

      const group = map[weekKey];
      const qty = Number(item.quantity) || 1;
      const subtotal = (Number(item.price) || 0) * qty;

      group.items.push(item);
      group.itemsCount += qty;

      if (!item.isReturned) {
        group.totalMade += subtotal;
        if (item.paymentStatus === 'Pago') {
          group.totalPaid += subtotal;
          group.paidCount += qty;
        } else {
          group.totalPending += subtotal;
          group.pendingCount += qty;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  };

  // State for History Modal & Deletion Management
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyModalSupplierName, setHistoryModalSupplierName] = useState<string | null>(null);
  const [historyViewMode, setHistoryViewMode] = useState<'MES' | 'SEMANA'>('MES');
  const [historySelectedYear, setHistorySelectedYear] = useState<string>('ALL');
  const [historySelectedMonths, setHistorySelectedMonths] = useState<Record<string, boolean>>({});
  const [historyDeleteScope, setHistoryDeleteScope] = useState<'PAID_ONLY' | 'ALL'>('PAID_ONLY');
  const [historyExpandedKey, setHistoryExpandedKey] = useState<string | null>(null);
  const [historyConfirmDialog, setHistoryConfirmDialog] = useState<{
    title: string;
    message: string;
    itemsCount: number;
    totalValue: number;
    purchaseIds: string[];
  } | null>(null);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    items.forEach(i => {
      const d = parsePurchaseDate(i.createdAt);
      years.add(String(d.getFullYear()));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // Items filtered for the History Modal
  const historyModalItems = useMemo(() => {
    let list = items;
    if (historyModalSupplierName) {
      list = list.filter(i => (i.supplierName || '').trim().toLowerCase() === historyModalSupplierName.trim().toLowerCase());
    }
    if (historySelectedYear !== 'ALL') {
      list = list.filter(i => {
        const d = parsePurchaseDate(i.createdAt);
        return String(d.getFullYear()) === historySelectedYear;
      });
    }
    return list;
  }, [items, historyModalSupplierName, historySelectedYear]);

  // Grouped by Month
  const historyByMonth = useMemo(() => {
    return groupPurchasesByMonth(historyModalItems);
  }, [historyModalItems]);

  // Grouped by Week
  const historyByWeek = useMemo(() => {
    return groupPurchasesByWeek(historyModalItems);
  }, [historyModalItems]);

  // Request deletion of checked months
  const handleRequestDeleteSelectedMonths = () => {
    const selectedMonthKeys = Object.keys(historySelectedMonths).filter(k => historySelectedMonths[k]);
    if (selectedMonthKeys.length === 0) return;

    let targetItems = historyModalItems.filter(i => {
      const d = parsePurchaseDate(i.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return selectedMonthKeys.includes(mKey);
    });

    if (historyDeleteScope === 'PAID_ONLY') {
      targetItems = targetItems.filter(i => i.paymentStatus === 'Pago');
    }

    if (targetItems.length === 0) {
      alert('Nenhuma compra encontrada para os critérios selecionados.');
      return;
    }

    const totalVal = targetItems.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const scopeLabel = historyDeleteScope === 'PAID_ONLY' ? 'compras PAGAS' : 'TODAS as compras (pagas e pendentes)';

    setHistoryConfirmDialog({
      title: `Apagar Histórico de ${selectedMonthKeys.length} Mês(es)`,
      message: `Deseja realmente apagar ${targetItems.length} ${scopeLabel} no valor total de R$ ${totalVal.toFixed(2).replace('.', ',')} referente aos meses: ${selectedMonthKeys.join(', ')}?`,
      itemsCount: targetItems.length,
      totalValue: totalVal,
      purchaseIds: targetItems.map(i => i.purchaseId)
    });
  };

  // Request deletion of a single month
  const handleRequestDeleteSingleMonth = (monthKey: string, monthLabel: string, monthItems: SupplierPurchaseItem[]) => {
    let targetItems = monthItems;
    if (historyDeleteScope === 'PAID_ONLY') {
      targetItems = targetItems.filter(i => i.paymentStatus === 'Pago');
    }

    if (targetItems.length === 0) {
      alert(`Nenhuma compra ${historyDeleteScope === 'PAID_ONLY' ? 'paga' : ''} para apagar em ${monthLabel}.`);
      return;
    }

    const totalVal = targetItems.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const scopeLabel = historyDeleteScope === 'PAID_ONLY' ? 'compras PAGAS' : 'TODAS as compras';

    setHistoryConfirmDialog({
      title: `Apagar Mês: ${monthLabel}`,
      message: `Deseja realmente apagar ${targetItems.length} ${scopeLabel} do mês de ${monthLabel} no valor de R$ ${totalVal.toFixed(2).replace('.', ',')}?`,
      itemsCount: targetItems.length,
      totalValue: totalVal,
      purchaseIds: targetItems.map(i => i.purchaseId)
    });
  };

  // Request deletion of an entire year
  const handleRequestDeleteYear = (year: string) => {
    let targetItems = historyModalItems.filter(i => {
      const d = parsePurchaseDate(i.createdAt);
      return String(d.getFullYear()) === year;
    });

    if (historyDeleteScope === 'PAID_ONLY') {
      targetItems = targetItems.filter(i => i.paymentStatus === 'Pago');
    }

    if (targetItems.length === 0) {
      alert(`Nenhuma compra ${historyDeleteScope === 'PAID_ONLY' ? 'paga' : ''} encontrada no ano de ${year}.`);
      return;
    }

    const totalVal = targetItems.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const scopeLabel = historyDeleteScope === 'PAID_ONLY' ? 'compras PAGAS' : 'TODAS as compras';

    setHistoryConfirmDialog({
      title: `Apagar Ano Completo (${year})`,
      message: `Deseja realmente apagar ${targetItems.length} ${scopeLabel} de todo o ano de ${year} no valor total de R$ ${totalVal.toFixed(2).replace('.', ',')}?`,
      itemsCount: targetItems.length,
      totalValue: totalVal,
      purchaseIds: targetItems.map(i => i.purchaseId)
    });
  };

  // Execute deletion
  const handleExecuteDeleteHistory = async () => {
    if (!historyConfirmDialog) return;
    const ids = historyConfirmDialog.purchaseIds;
    if (onBulkDeletePurchases) {
      await onBulkDeletePurchases(ids);
    } else {
      ids.forEach(id => onDelete(id));
    }
    setHistorySelectedMonths({});
    setHistoryConfirmDialog(null);
  };

  // Quick action: Pay all pieces for a specific date group
  const handlePayDateGroup = (dateItems: SupplierPurchaseItem[]) => {
    if (!dateItems || dateItems.length === 0) return;
    dateItems.forEach(item => {
      onUpdateStatus(item.purchaseId, 'Pago');
    });
  };

  // Handle open Supplier Modal
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ name: '', phone: '', pixKey: '', obs: '' });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: RegisteredSupplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      pixKey: supplier.pixKey || '',
      obs: supplier.obs || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;

    if (editingSupplier) {
      await onUpdateSupplierInfo({
        ...editingSupplier,
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim(),
        pixKey: supplierForm.pixKey.trim(),
        obs: supplierForm.obs.trim()
      });
    } else {
      await onAddSupplier({
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim(),
        pixKey: supplierForm.pixKey.trim(),
        obs: supplierForm.obs.trim()
      });
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierForm({ name: '', phone: '', pixKey: '', obs: '' });
  };

  // Handle Copy PIX
  const handleCopyPix = (pixKey: string, id: string) => {
    if (!pixKey) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pixKey);
      }
    } catch (_) {}
    setCopiedPixId(id);
    setTimeout(() => setCopiedPixId(null), 2500);
  };

  // Safe WhatsApp sender (copies to clipboard and opens via <a> tag)
  const openWhatsAppMessageSafely = (phone: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch (_) {}

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    if (cleanPhone) {
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encoded}`;
    }

    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      window.open(url, '_blank');
    }
  };

  // FORMAT EXTRATO / CONFERÊNCIA COM MESMO MODELO DE "MEUS PEDIDOS"
  // As peças em devolução saem da lista contabilizada e ficam apenas no bloco inferior (embaixo)
  // Finaliza com a frase: "Por favor, confirma se está certo o valor e as peças."
  const formatSupplierStatementWhatsApp = (
    supplierName: string, 
    pieces: SupplierPurchaseItem[], 
    dateLabel?: string
  ): string => {
    const now = new Date();
    const dateStr = dateLabel || now.toLocaleDateString('pt-BR');
    const isReturnedPiece = (p: SupplierPurchaseItem) => p.isReturned === true || (p.isReturned as any) === 'true';
    const activePieces = pieces.filter(p => !isReturnedPiece(p));
    const returnedPieces = pieces.filter(p => isReturnedPiece(p));

    let text = `📦 *EXTRATO / CONFERÊNCIA DE PEÇAS*\n`;
    text += `🏢 *Fornecedor:* ${supplierName}\n`;
    text += `📅 Data: ${dateStr}\n`;
    text += `-----------------------------------\n\n`;

    const groupMap: Record<string, SupplierPurchaseItem[]> = {};
    activePieces.forEach(item => {
      const type = item.typeName || 'Peça';
      if (!groupMap[type]) groupMap[type] = [];
      groupMap[type].push(item);
    });

    let total = 0;
    let totalPieces = 0;
    let globalIndex = 1;

    Object.entries(groupMap).forEach(([type, groupItems]) => {
      const typeLabel = type.toUpperCase();
      text += `📦 *${typeLabel} (${groupItems.length} ${groupItems.length === 1 ? 'item' : 'itens'})*\n`;
      
      groupItems.forEach((item) => {
        const typePrefix = item.typeName ? `${item.typeName} ` : '';
        let cleanTitle = (item.title || '').trim();
        if (item.typeName && cleanTitle.toLowerCase().startsWith(item.typeName.toLowerCase() + ' ')) {
          cleanTitle = cleanTitle.slice(item.typeName.length + 1).trim();
        }

        const estUpper = (item.estrutura || '').trim().toUpperCase();
        const estBadge = estUpper ? ` - ${estUpper}` : '';

        text += `${globalIndex}. 📱 ${typePrefix}${cleanTitle}${estBadge}\n`;
        
        if (item.marca) text += `🏷️ Marca: ${item.marca}\n`;
        if (item.modelo) text += `📱 Modelo: ${item.modelo}\n`;
        if (estUpper) text += `⭕ Estrutura: ${estUpper}\n`;
        if (item.qualidade) text += `⚡ Qualidade: ${item.qualidade}\n`;
        if (item.cor) text += `🎨 Cor: ${item.cor}\n`;
        
        const sub = (Number(item.price) || 0) * (Number(item.quantity) || 1);
        if (sub > 0) {
          text += `💵 R$ ${sub.toFixed(2).replace('.', ',')} (${item.quantity}x R$ ${(Number(item.price) || 0).toFixed(2).replace('.', ',')})\n`;
          total += sub;
        }
        totalPieces += (Number(item.quantity) || 1);
        text += `\n`;
        globalIndex++;
      });
      text += `-----------------------------------\n`;
    });

    // TOTAL DAS PEÇAS CONTABILIZADAS
    if (activePieces.length > 0) {
      if (total > 0) {
        text += `💰 *TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
        text += `-----------------------------------\n`;
      }
      text += `🔢 *Total:* ${activePieces.length} modelos (${totalPieces} peças no total)\n`;
    }

    // PEÇAS EM DEVOLUÇÃO (Ficam destacadas, riscadas e separadas das peças contabilizadas)
    if (returnedPieces.length > 0) {
      if (activePieces.length > 0) {
        text += `\n-----------------------------------\n`;
      }
      text += `🔄 *PEÇAS EM DEVOLUÇÃO (${returnedPieces.length}) - NÃO CONTABILIZADAS:*\n`;
      text += `⚠️ *Atenção: Estas peças foram devolvidas e NÃO constam no valor total acima.*\n\n`;
      returnedPieces.forEach((item, rIdx) => {
        const typePrefix = item.typeName ? `${item.typeName} ` : '';
        const estUpper = (item.estrutura || '').trim().toUpperCase();
        const estBadge = estUpper ? ` - ${estUpper}` : '';

        text += `${rIdx + 1}. 📱 ~${typePrefix}${item.title}${estBadge}~ 🔄 [DEVOLVIDA]\n`;
        if (item.marca) text += `🏷️ Marca: ${item.marca}\n`;
        if (item.modelo) text += `📱 Modelo: ${item.modelo}\n`;
        if (estUpper) text += `⭕ Estrutura: ${estUpper}\n`;
        if (item.qualidade) text += `⚡ Qualidade: ${item.qualidade}\n`;
        if (item.cor) text += `🎨 Cor: ${item.cor}\n`;
        text += `🔢 Qtd: ${item.quantity}x | Valor desconsiderado: ~R$ ${(Number(item.price) || 0).toFixed(2).replace('.', ',')}~ (R$ 0,00)\n`;
        if (item.returnReason) text += `📝 Motivo da Devolução: ${item.returnReason}\n`;
        text += `\n`;
      });
      text += `-----------------------------------\n`;
    }

    text += `Por favor, confirma se está certo o valor e as peças.`;

    return text;
  };

  // FORMAT COMPLETO DE CONFERÊNCIA DE DÉBITO SOLICITADO PELO USUÁRIO:
  // - Topo: RELATÓRIO DE CONFERÊNCIA DE DÉBITOS + DO DIA ... AO DIA ...
  // - Separado mais embaixo: VALOR TOTAL + QUANTIDADE DE PEÇAS
  // - Separado mais embaixo: Lista de peças por data com ordens, estruturas e valores
  // - Peças devolvidas: Ficam riscadas e destacadas com aviso de devolução não contabilizada
  // - SEM status de recebido/não recebido
  // - No fim: Pergunta se está certo o débito
  const formatSupplierConferenceWhatsAppText = (
    supplierName: string,
    supplierInfo?: RegisteredSupplier,
    dateGroups?: {
      dateKey: string;
      displayDate: string;
      weekday: string;
      dateTotal: number;
      dateCount: number;
      items: SupplierPurchaseItem[];
    }[],
    allSupplierPendingItems?: SupplierPurchaseItem[]
  ): string => {
    const itemsToUse = allSupplierPendingItems || [];
    // Apenas itens em débito ativos (não devolvidos) contam para o valor total e contagem
    const activePendingItems = itemsToUse.filter(p => p.paymentStatus === 'Pendente' && !p.isReturned);
    const returnedItemsList = itemsToUse.filter(p => p.isReturned);

    let grandTotal = 0;
    let totalPiecesCount = 0;

    activePendingItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const sub = (Number(item.price) || 0) * qty;
      grandTotal += sub;
      totalPiecesCount += qty;
    });

    // Período: DO DIA mais antigo AO DIA mais recente
    let oldestDate = '';
    let newestDate = '';
    if (dateGroups && dateGroups.length > 0) {
      const validDates = dateGroups.map(dg => dg.displayDate).filter(Boolean);
      if (validDates.length > 0) {
        newestDate = validDates[0];
        oldestDate = validDates[validDates.length - 1];
      }
    }

    let periodStr = '';
    if (oldestDate && newestDate && oldestDate !== newestDate) {
      periodStr = `DO DIA ${oldestDate} AO DIA ${newestDate}`;
    } else if (newestDate) {
      periodStr = `DO DIA ${newestDate} AO DIA ${newestDate}`;
    } else {
      const today = new Date().toLocaleDateString('pt-BR');
      periodStr = `DO DIA ${today} AO DIA ${today}`;
    }

    let text = `📋 *RELATÓRIO DE CONFERÊNCIA DE DÉBITOS*\n`;
    text += `🏢 *Fornecedor:* ${supplierName}\n`;
    text += `📅 *Período:* ${periodStr}\n\n`;

    text += `-----------------------------------\n`;
    text += `💰 *VALOR TOTAL: R$ ${grandTotal.toFixed(2).replace('.', ',')}*\n`;
    text += `📦 *QUANTIDADE DE PEÇAS A PAGAR: ${totalPiecesCount}*\n`;
    if (returnedItemsList.length > 0) {
      text += `🔄 *DEVOLUÇÕES: ${returnedItemsList.length} peça(s) devolvida(s) (NÃO CONTABILIZADAS NO TOTAL)*\n`;
    }
    text += `-----------------------------------\n\n`;

    if (returnedItemsList.length > 0) {
      text += `⚠️ *AVISO DE DEVOLUÇÃO:* Houve ${returnedItemsList.length} peça(s) devolvida(s). Elas aparecem riscadas ~assim~ e com valor R$ 0,00 no relatório abaixo.\n\n`;
    }

    text += `📋 *DETALHAMENTO DE PEÇAS E PEDIDOS:*\n\n`;

    if (dateGroups && dateGroups.length > 0) {
      dateGroups.forEach(dg => {
        const weekdayStr = dg.weekday ? ` (${dg.weekday})` : '';
        text += `📅 *DIA: ${dg.displayDate}${weekdayStr}*\n`;

        dg.items.forEach((item, idx) => {
          const typePrefix = item.typeName ? `${item.typeName} ` : '';
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.price) || 0;
          const sub = unitPrice * qty;

          const estUpper = (item.estrutura || '').trim().toUpperCase();
          const estBadge = estUpper ? ` - ${estUpper}` : '';

          if (item.isReturned) {
            text += `  Ordem ${idx + 1}: 📱 ~${typePrefix}${item.title}${estBadge}~ 🔄 *[ DEVOLUÇÃO - NÃO COBRAR ]*\n`;
            if (item.marca || item.modelo) text += `   🏷️ Aparelho: ~${item.marca || ''} ${item.modelo || ''}~\n`;
            if (estUpper) text += `   ⭕ Estrutura: ~${estUpper}~\n`;
            if (item.qualidade) text += `   ⚡ Qualidade: ~${item.qualidade}~\n`;
            if (item.cor) text += `   🎨 Cor: ~${item.cor}~\n`;
            text += `   💵 Valor: ~R$ ${sub.toFixed(2).replace('.', ',')}~ (R$ 0,00 - DEVOLVIDA)\n`;
            if (item.returnReason) text += `   📝 Motivo da Devolução: ${item.returnReason}\n`;
          } else {
            text += `  Ordem ${idx + 1}: 📱 ${typePrefix}${item.title}${estBadge}\n`;
            if (item.marca || item.modelo) text += `   🏷️ Aparelho: ${item.marca || ''} ${item.modelo || ''}\n`;
            if (estUpper) text += `   ⭕ Estrutura: ${estUpper}\n`;
            if (item.qualidade) text += `   ⚡ Qualidade: ${item.qualidade}\n`;
            if (item.cor) text += `   🎨 Cor: ${item.cor}\n`;
            text += `   💵 Valor: R$ ${sub.toFixed(2).replace('.', ',')} (${qty}x R$ ${unitPrice.toFixed(2).replace('.', ',')})\n`;
          }
          text += `\n`;
        });
      });
      text += `-----------------------------------\n`;
    }

    if (supplierInfo?.pixKey) {
      text += `💳 *Chave PIX:* ${supplierInfo.pixKey}\n\n`;
    }

    text += `Por gentileza, confirma se está certo o débito?`;

    return text;
  };

  // FORMAT AVISO INDIVIDUAL DE DEVOLUÇÃO
  const formatSinglePieceReturnWhatsApp = (
    supplierName: string, 
    piece: SupplierPurchaseItem,
    reason?: string
  ): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    let text = `🔄 *AVISO DE DEVOLUÇÃO DE PEÇA*\n`;
    text += `🏢 *Fornecedor:* ${supplierName}\n`;
    text += `📅 Data: ${dateStr}\n`;
    text += `-----------------------------------\n`;
    const typePrefix = piece.typeName ? `${piece.typeName} ` : '';
    const estUpper = (piece.estrutura || '').trim().toUpperCase();
    const estBadge = estUpper ? ` - ${estUpper}` : '';

    text += `📱 ${typePrefix}${piece.title}${estBadge}\n`;
    if (piece.marca) text += `🏷️ Marca: ${piece.marca}\n`;
    if (piece.modelo) text += `📱 Modelo: ${piece.modelo}\n`;
    if (estUpper) text += `⭕ Estrutura: ${estUpper}\n`;
    if (piece.qualidade) text += `⚡ Qualidade: ${piece.qualidade}\n`;
    if (piece.cor) text += `🎨 Cor: ${piece.cor}\n`;
    text += `🔢 Quantidade: ${piece.quantity}x\n`;
    text += `💵 Valor: R$ ${(Number(piece.price) || 0).toFixed(2).replace('.', ',')}\n`;
    const finalReason = reason || piece.returnReason || 'Defeito / Peça a devolver';
    text += `📝 Motivo da Devolução: ${finalReason}\n`;
    text += `-----------------------------------\n`;
    text += `Por favor, confirma se está certo o valor e as peças.`;
    return text;
  };

  // Send statement via WhatsApp
  const handleSendExtratoWhatsApp = (
    phone: string, 
    supplierName: string, 
    pieces: SupplierPurchaseItem[], 
    dateLabel?: string
  ) => {
    if (pieces.length === 0) return;
    const msg = formatSupplierStatementWhatsApp(supplierName, pieces, dateLabel);
    openWhatsAppMessageSafely(phone, msg);
  };

  // Send single return via WhatsApp
  const handleSendSinglePieceReturn = (
    phone: string, 
    supplierName: string, 
    piece: SupplierPurchaseItem
  ) => {
    const msg = formatSinglePieceReturnWhatsApp(supplierName, piece);
    openWhatsAppMessageSafely(phone, msg);
  };

  // Open return modal
  const handleOpenReturnModal = (piece: SupplierPurchaseItem, supplierName: string, supplierPhone: string) => {
    setReturnModal({
      isOpen: true,
      piece,
      supplierName,
      supplierPhone,
      reason: piece.returnReason || 'Defeito de fábrica'
    });
  };

  // Confirm return action
  const handleConfirmReturn = (sendViaWhatsApp: boolean) => {
    if (!returnModal.piece) return;
    const { piece, supplierName, supplierPhone, reason } = returnModal;
    
    if (onToggleReturn) {
      onToggleReturn(piece.purchaseId, true, reason);
    }

    if (sendViaWhatsApp) {
      const msg = formatSinglePieceReturnWhatsApp(supplierName, piece, reason);
      openWhatsAppMessageSafely(supplierPhone, msg);
    }

    setReturnModal({
      isOpen: false,
      piece: null,
      supplierName: '',
      supplierPhone: '',
      reason: 'Defeito de fábrica'
    });
  };

  // Open WhatsApp general greeting
  const handleOpenWhatsApp = (phone: string, supplierName: string, pendingItems?: SupplierPurchaseItem[]) => {
    if (pendingItems && pendingItems.length > 0) {
      handleSendExtratoWhatsApp(phone, supplierName, pendingItems);
      return;
    }
    const msg = `Olá ${supplierName}! Tudo bem? Gostaria de conferir algumas informações sobre os pedidos de peças.`;
    openWhatsAppMessageSafely(phone, msg);
  };

  // Handle Save Manual Piece
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title.trim()) return;
    
    const supplier = newItemForm.supplierName.trim() || 'Fornecedor Principal';

    onAddPurchaseItem({
      id: `manual_${Date.now()}`,
      title: newItemForm.title.trim(),
      typeName: newItemForm.typeName,
      marca: newItemForm.marca,
      modelo: newItemForm.modelo,
      estrutura: newItemForm.estrutura,
      qualidade: newItemForm.qualidade,
      cor: newItemForm.cor,
      quantity: Number(newItemForm.quantity) || 1,
      price: Number(newItemForm.price) || 0,
      supplierName: supplier,
      paymentStatus: newItemForm.paymentStatus,
      createdAt: new Date().toISOString(),
      paidAt: newItemForm.paymentStatus === 'Pago' ? new Date().toISOString() : null
    });

    setIsAddPieceModalOpen(false);
    setNewItemForm({
      title: '',
      typeName: 'Tela',
      marca: '',
      modelo: '',
      estrutura: '',
      qualidade: 'Premium',
      cor: 'Preto',
      quantity: 1,
      price: 0,
      supplierName: '',
      paymentStatus: 'Pendente'
    });
  };

  const handleSaveNewReturnItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturnForm.title.trim()) return;

    const supplier = newReturnForm.supplierName.trim() || 'Fornecedor Principal';
    const dateObj = newReturnForm.customDate ? new Date(newReturnForm.customDate + 'T12:00:00') : new Date();

    onAddPurchaseItem({
      id: `return_manual_${Date.now()}`,
      title: newReturnForm.title.trim(),
      typeName: newReturnForm.typeName,
      marca: newReturnForm.marca,
      modelo: newReturnForm.modelo,
      estrutura: newReturnForm.estrutura,
      qualidade: newReturnForm.qualidade,
      cor: newReturnForm.cor,
      quantity: Number(newReturnForm.quantity) || 1,
      price: Number(newReturnForm.price) || 0,
      supplierName: supplier,
      paymentStatus: 'Pendente',
      createdAt: dateObj.toISOString(),
      isReturned: true,
      returnedAt: dateObj.toISOString(),
      returnReason: newReturnForm.returnReason.trim(),
      isDeliveredToSupplier: false
    });

    setIsAddReturnModalOpen(false);
    setNewReturnForm({
      title: '',
      typeName: 'Tela',
      marca: '',
      modelo: '',
      estrutura: '',
      qualidade: 'Premium',
      cor: 'Preto',
      quantity: 1,
      price: 0,
      supplierName: '',
      returnReason: 'Defeito de fábrica',
      customDate: new Date().toISOString().slice(0, 10)
    });
  };

  return (
    <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-hidden">

      {subTab === 'DEBITOS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <div className="bg-[#161B2B] rounded-xl border border-amber-500/30 p-2.5 flex items-center gap-2.5 shadow-md">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-amber-400 truncate">
                R$ {totalPendingAmount.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[9px] text-slate-400 uppercase font-bold truncate">Total em Débito (A Prazo)</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2.5 flex items-center gap-2.5 shadow-md">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-white truncate">
                {items.filter(i => i.paymentStatus === 'Pendente').reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)}
              </div>
              <div className="text-[9px] text-slate-400 uppercase font-bold truncate">Peças Aguardando Pagamento</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2.5 flex items-center gap-2.5 shadow-md">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-purple-400 truncate">
                {Object.keys(debtsBySupplier).length}
              </div>
              <div className="text-[9px] text-slate-400 uppercase font-bold truncate">Fornecedores com Débito</div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'DEVOLUCOES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <div className="bg-[#161B2B] rounded-xl border border-rose-500/30 p-2.5 flex items-center gap-2.5 shadow-md">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-rose-400 truncate">
                {items.filter(i => !!i.isReturned && i.paymentStatus === 'Pendente').reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)} peças
              </div>
              <div className="text-[9px] text-slate-400 uppercase font-bold truncate">Total de Devoluções Pendentes</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-rose-500/30 p-2.5 flex items-center gap-2.5 shadow-md">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-rose-400 truncate">
                R$ {items.filter(i => !!i.isReturned && i.paymentStatus === 'Pendente').reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[9px] text-slate-400 uppercase font-bold truncate">Valor Retirado da Contabilidade</div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SEARCH / ACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center bg-[#161B2B] p-2.5 sm:p-3 rounded-2xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por peça, marca, modelo ou fornecedor..."
              className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-2 bg-slate-800 rounded-xl cursor-pointer shrink-0 font-bold"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Filter by supplier */}
          <div className="flex items-center gap-1.5 bg-[#0B1221] border border-slate-700/80 px-2.5 py-2 rounded-xl flex-1 sm:flex-none">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer w-full"
            >
              <option value="ALL" className="bg-[#161B2B]">Todos os Fornecedores</option>
              {allSuppliersList.map(s => (
                <option key={s.id} value={s.name} className="bg-[#161B2B]">{s.name}</option>
              ))}
            </select>
          </div>

          {subTab === 'DEVOLUCOES' && (
            <button
              type="button"
              onClick={() => {
                setNewReturnForm(prev => ({
                  ...prev,
                  supplierName: allSuppliersList[0]?.name || ''
                }));
                setIsAddReturnModalOpen(true);
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/30 shrink-0"
              title="Adicionar peça diretamente para devolução informando a data desejada"
            >
              <RotateCcw className="w-4 h-4" /> + Nova Devolução Direta
            </button>
          )}


        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 3: DEVOLUÇÕES PENDENTES */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'DEVOLUCOES' && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-16 space-y-6">
          {returnsBySupplier.length === 0 ? (
            <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/40">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Nenhuma Peça em Devolução Pendente!
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto text-xs leading-relaxed">
                As peças marcadas para devolução aparecerão aqui até que a nota da aba Débitos seja quitada.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {returnsBySupplier.map((supGroup) => {
                const supInfo = supGroup.supplierInfo;
                const phone = supInfo?.phone || '';
                const cleanPhone = phone.replace(/\D/g, '');

                return (
                  <div 
                    key={supGroup.supplierName}
                    className="bg-[#13192B] border-2 border-rose-500/30 hover:border-rose-500/50 rounded-xl p-4 shadow-xl transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-rose-400" />
                          <h4 className="text-sm sm:text-base font-black text-white">{supGroup.supplierName}</h4>
                          <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                            {supGroup.count} {supGroup.count === 1 ? 'peça devolvida' : 'peças devolvidas'}
                          </span>
                        </div>
                        {phone && <p className="text-xs text-slate-400 mt-0.5">📞 {phone}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setReturnsConferenceModal({
                            isOpen: true,
                            supplierName: supGroup.supplierName,
                            supplierInfo: supInfo,
                            items: supGroup.items,
                            onlyInStore: false
                          })}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          title="Gerar texto formatado de conferência de todas as devoluções"
                        >
                          <FileText className="w-3.5 h-3.5" /> Texto (Todas)
                        </button>

                        <button
                          type="button"
                          onClick={() => setReturnsConferenceModal({
                            isOpen: true,
                            supplierName: supGroup.supplierName,
                            supplierInfo: supInfo,
                            items: supGroup.items,
                            onlyInStore: true
                          })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          title="Gerar texto formatado apenas das peças na loja"
                        >
                          <Package className="w-3.5 h-3.5" /> Texto (Na Loja)
                        </button>

                        {cleanPhone && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendReturnsWhatsApp(cleanPhone, supGroup.supplierName, supGroup.items, false)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1"
                              title="Enviar todas via WhatsApp"
                            >
                              <Send className="w-3 h-3" /> Wpp (Todas)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReturnsWhatsApp(cleanPhone, supGroup.supplierName, supGroup.items, true)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1"
                              title="Enviar via WhatsApp apenas as peças que estão na loja"
                            >
                              <Send className="w-3 h-3" /> Wpp (Na Loja)
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Lista de Peças Devolvidas */}
                    <div className="divide-y divide-slate-800/60">
                      {supGroup.items.map((item) => {
                        const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                        return (
                          <div key={item.purchaseId} className="py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                                  Devolução
                                </span>
                                <h5 className="text-xs sm:text-sm font-black text-rose-200 line-through truncate">
                                  {item.title}
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.marca} {item.modelo} {item.qualidade ? `• ${item.qualidade}` : ''} ({item.quantity}x R$ {(Number(item.price) || 0).toFixed(2).replace('.', ',')})
                              </p>
                              {item.returnReason && (
                                <div className="mt-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1.5 w-fit">
                                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span><strong>Motivo:</strong> {item.returnReason}</span>
                                </div>
                              )}
                              
                              {/* Delivery Status Toggle */}
                              <div className="mt-1.5">
                                {onUpdatePurchaseItem && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdatePurchaseItem({ ...item, isDeliveredToSupplier: !item.isDeliveredToSupplier })}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer inline-flex items-center gap-1 border ${
                                      item.isDeliveredToSupplier
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                    }`}
                                    title="Clique para alternar entre Já Entregue ou Na Loja"
                                  >
                                    {item.isDeliveredToSupplier ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Já Entregue ao Fornecedor
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-400" /> Ainda na Loja (Vai Ser Devolvida)
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-xs font-black text-slate-500 line-through">
                                  R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                                </div>
                                <div className="text-[10px] font-black text-rose-400">
                                  R$ 0,00 (Desconsiderado)
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {onToggleReturn && (
                                  <button
                                    type="button"
                                    onClick={() => onToggleReturn(item.purchaseId, false)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700"
                                    title="Desfazer devolução e voltar a contabilizar"
                                  >
                                    <Undo2 className="w-3 h-3" /> Desfazer
                                  </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleOpenEditPieceModal(item)}
                                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                    title="Editar motivo ou dados"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button 
                                  type="button"
                                  onClick={() => onDelete(item.purchaseId)}
                                  className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                  title="Excluir peça"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: FORNECEDOR (CARDS DE FORNECEDORES) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'HISTORICO' && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-16 space-y-4">
          {allSuppliersList.length === 0 ? (
            <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
              <Building2 className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhum Fornecedor Cadastrado Ainda</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs mb-6">
                Cadastre seus fornecedores clicando no botão abaixo. Quando cadastrados, eles aparecerão automaticamente na Aba 1 (Meus Pedidos) para você mover peças diretamente para o card de cada um!
              </p>
              <button
                onClick={handleOpenAddSupplier}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" /> Cadastrar Meu Primeiro Fornecedor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Resumo Geral do Histórico com Soma Total */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Histórico Geral dos Fornecedores</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                        Últimos 25 Meses Salvos
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Totais mensais salvos por fornecedor e histórico com efeito cortina.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 bg-[#0B1221] px-4 py-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-black">Soma Total Geral</div>
                  <div className="text-base sm:text-xl font-black text-emerald-400">
                    R$ {items.filter(i => {
                      if (i.isReturned) return false;
                      if (!i.createdAt) return true;
                      const d = new Date(i.createdAt);
                      const cutoff = new Date(new Date().getFullYear(), new Date().getMonth() - 25, 1);
                      return isNaN(d.getTime()) || d >= cutoff;
                    }).reduce((sub, i) => sub + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {allSuppliersList
                  .filter(s => supplierFilter === 'ALL' || s.name === supplierFilter)
                .map(supplier => {
                  const supplierPieces = items.filter(
                    i => (i.supplierName || '').trim().toLowerCase() === supplier.name.trim().toLowerCase()
                  );

                  // 25-month limit and current month calculation
                  const now = new Date();
                  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 25, 1);

                  const validSupplierPieces = supplierPieces.filter(i => {
                    if (!i.createdAt) return true;
                    const d = new Date(i.createdAt);
                    return isNaN(d.getTime()) || d >= cutoffDate;
                  });

                  const currentMonthPieces = validSupplierPieces.filter(i => {
                    const d = i.createdAt ? new Date(i.createdAt) : now;
                    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return k === currentMonthKey;
                  });
                  const currentMonthTotal = currentMonthPieces
                    .filter(i => !i.isReturned)
                    .reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

                  const pastMonthsMap: Record<string, { monthKey: string; monthLabel: string; pieces: SupplierPurchaseItem[]; total: number }> = {};
                  validSupplierPieces.forEach(piece => {
                    const d = piece.createdAt ? new Date(piece.createdAt) : now;
                    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (k !== currentMonthKey) {
                      if (!pastMonthsMap[k]) {
                        pastMonthsMap[k] = {
                          monthKey: k,
                          monthLabel: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                          pieces: [],
                          total: 0
                        };
                      }
                      pastMonthsMap[k].pieces.push(piece);
                      if (!piece.isReturned) {
                        pastMonthsMap[k].total += (Number(piece.price) || 0) * (Number(piece.quantity) || 1);
                      }
                    }
                  });

                  const pastMonthsList = Object.values(pastMonthsMap)
                    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
                    .slice(0, 25);

                  const supplierGrandTotal = validSupplierPieces
                    .filter(i => !i.isReturned)
                    .reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

                  const isCurtainOpen = !!openCurtains[`history_curtain_${supplier.id}`];

                  return (
                    <div 
                      key={supplier.id}
                      className="bg-[#161B2B] rounded-2xl border border-slate-800 p-5 flex flex-col shadow-xl transition-all gap-4"
                    >
                      {/* Supplier Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-white truncate" title={supplier.name}>
                            {supplier.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Fornecedor
                          </span>
                        </div>
                      </div>

                      {/* 1. SOMA TOTAL DO FORNECEDOR */}
                      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0B1A24] to-slate-900 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                              Soma Total de Compras
                            </span>
                            <div className="text-xl font-black text-emerald-300 mt-0.5">
                              R$ {supplierGrandTotal.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                            {validSupplierPieces.length} {validSupplierPieces.length === 1 ? 'item total' : 'itens totais'}
                          </span>
                        </div>
                      </div>

                      {/* 2. TOTAL DO MÊS ATUAL */}
                      <div className="bg-gradient-to-r from-indigo-950/60 via-[#111A2E] to-slate-900 border border-indigo-500/30 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Total do Mês Atual ({currentMonthName})</span>
                          </div>
                          <div className="text-xl font-black text-white mt-1">
                            R$ {currentMonthTotal.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 inline-block">
                            {currentMonthPieces.length} {currentMonthPieces.length === 1 ? 'peça' : 'peças'}
                          </span>
                        </div>
                      </div>

                      {/* 3. HISTÓRICO DE MESES ANTERIORES (CADA MÊS COM SEU TOTAL) */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between px-1">
                          <span>Histórico de Meses Anteriores</span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {pastMonthsList.length}/25 meses
                          </span>
                        </div>

                        {pastMonthsList.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500 bg-[#0B1221] rounded-xl border border-slate-800/80">
                            Nenhum histórico de mês anterior ainda.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                            {pastMonthsList.map(pm => (
                              <div 
                                key={pm.monthKey} 
                                className="bg-[#0B1221] border border-slate-800 hover:border-slate-700/80 p-2.5 rounded-xl flex items-center justify-between shadow-sm transition-all"
                              >
                                <div>
                                  <div className="text-xs font-bold text-white capitalize">
                                    {pm.monthLabel}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {pm.pieces.length} {pm.pieces.length === 1 ? 'peça comprada' : 'peças compradas'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-black text-emerald-400">
                                    R$ {pm.total.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 4. EFEITO CORTINA: MOSTRAR TUDO QUE FOI COMPRADO */}
                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0B1221] shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleCurtain(`history_curtain_${supplier.id}`)}
                          className={`w-full p-3 transition-colors flex items-center justify-between gap-2.5 text-left cursor-pointer border-b ${
                            isCurtainOpen
                              ? 'bg-gradient-to-r from-slate-900 via-[#111A2E] to-slate-900 border-indigo-500/30'
                              : 'bg-[#0E1524] hover:bg-slate-800/60 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              📜 Ver Tudo Que Foi Comprado ({validSupplierPieces.length} itens)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold">
                            <span>{isCurtainOpen ? 'Recolher Cortina' : 'Abrir Cortina'}</span>
                            {isCurtainOpen ? (
                              <ChevronUp className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                        </button>

                        {/* CORPO DA CORTINA RETRÁTIL */}
                        {isCurtainOpen && (
                          <div className="p-2.5 space-y-2 bg-[#080D18] max-h-72 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                            {validSupplierPieces.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-500">
                                Nenhuma compra registrada ainda.
                              </div>
                            ) : (
                              validSupplierPieces
                                .slice()
                                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                                .map((piece, pIdx) => {
                                  const pieceTotal = (Number(piece.price) || 0) * (Number(piece.quantity) || 1);
                                  const isReturned = !!piece.isReturned;
                                  const isPaid = piece.paymentStatus === 'Pago';
                                  const dateFormatted = piece.createdAt && !isNaN(new Date(piece.createdAt).getTime())
                                    ? new Date(piece.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    : 'Recente';

                                  return (
                                    <div
                                      key={piece.purchaseId || pIdx}
                                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                        isReturned
                                          ? 'bg-rose-950/20 border-rose-500/30 line-through opacity-75'
                                          : isPaid
                                            ? 'bg-[#121826] border-slate-800'
                                            : 'bg-amber-950/10 border-amber-500/20'
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[10px] text-slate-400 font-bold">{dateFormatted}</span>
                                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                            {piece.typeName || 'Peça'}
                                          </span>
                                          <span className="font-bold text-white truncate max-w-[180px]" title={piece.title}>
                                            {piece.title}
                                          </span>
                                          {isReturned && (
                                            <span className="text-[9px] font-black px-1 rounded bg-rose-500/20 text-rose-300">
                                              Devolvido
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                          {piece.modelo ? `Mod: ${piece.modelo}` : ''} {piece.qualidade ? `• Qual: ${piece.qualidade}` : ''} {piece.cor ? `• Cor: ${piece.cor}` : ''}
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className={`font-black ${isReturned ? 'text-rose-400' : isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                          R$ {pieceTotal.toFixed(2).replace('.', ',')}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {piece.quantity}x R$ {(Number(piece.price) || 0).toFixed(2).replace('.', ',')}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 4: DÉBITO COM FORNECEDORES (CARDS COM VALOR TOTAL E DIVIDIDO POR DATA) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'DEBITOS' && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-16 space-y-6">
          {debtsBySupplierAndDate.length === 0 ? (
            <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Nenhum Débito Pendente com Fornecedores!
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto text-xs leading-relaxed">
                Parabéns! Todas as compras de peças e pedidos com fornecedores estão 100% quitados e em dia.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {debtsBySupplierAndDate.map((sup) => {
                const supplierInfo = sup.supplierInfo;
                const pixKey = supplierInfo?.pixKey || '';
                const phone = supplierInfo?.phone || '';
                const cleanPhone = phone.replace(/\D/g, '');

                return (
                  <div 
                    key={sup.supplierName}
                    className="bg-[#13192B] border-2 border-amber-500/30 hover:border-amber-500/50 rounded-xl p-3.5 sm:p-4 shadow-xl transition-all"
                  >

                    {/* -------------------------------------------------- */}
                    {/* CABEÇALHO DO CARD DE DÉBITO COMPACTO (TUDO SUBIDO) */}
                    {/* -------------------------------------------------- */}
                    <div className="pb-3 border-b border-slate-800/80 space-y-2.5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Lado Esquerdo: Identificação do Fornecedor */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shrink-0">
                            <Truck className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-black text-white truncate">
                                {sup.supplierName}
                              </h3>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                {sup.count} {sup.count === 1 ? 'peça a prazo' : 'peças a prazo'}
                              </span>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                {sup.dateGroups.length} {sup.dateGroups.length === 1 ? 'data' : 'datas'}
                              </span>
                            </div>

                            {/* Contatos / Chave PIX */}
                            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs">
                              {pixKey && (
                                <div className="flex items-center gap-1 bg-[#0B1221] px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                                  <Copy className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="font-mono text-[10px] truncate max-w-[140px] sm:max-w-[200px]">
                                    PIX: {pixKey}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPix(pixKey, `pix_${sup.supplierName}`)}
                                    className="ml-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0"
                                  >
                                    {copiedPixId === `pix_${sup.supplierName}` ? (
                                      <span className="text-emerald-400 flex items-center gap-0.5">
                                        <CheckCheck className="w-3 h-3" /> Copiado!
                                      </span>
                                    ) : (
                                      'Copiar'
                                    )}
                                  </button>
                                </div>
                              )}

                              {phone && (
                                <div className="flex items-center gap-1 bg-[#0B1221] px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                                  <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="text-[10px] font-medium">{phone}</span>
                                  {cleanPhone && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Olá ${sup.supplierName}! Estou verificando nossos pedidos em aberto no valor total de R$ ${sup.total.toFixed(2).replace('.', ',')} (${sup.count} peças).`;
                                        openWhatsAppMessageSafely(cleanPhone, text);
                                      }}
                                      className="ml-1 text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-0.5"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {supplierInfo && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSupplier(supplierInfo)}
                                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Editar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lado Direito: Ações de Texto p/ Conferência e Quitar Tudo */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const pendingItems = sup.dateGroups.flatMap(g => g.items);
                              setConferenceModal({
                                isOpen: true,
                                supplierName: sup.supplierName,
                                supplierInfo: sup.supplierInfo,
                                dateGroups: sup.dateGroups,
                                pendingItems: pendingItems,
                                copiedText: false,
                                filterMode: 'ALL',
                                selectedDayKey: '',
                                selectedPieceIds: [],
                                pieceSearch: ''
                              });
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 border border-indigo-400/30"
                            title="Gerar texto estruturado para conferência de débito dividido por data"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Texto p/ Conferência</span>
                          </button>

                          {onBulkPayForSupplier && (
                            <button
                              type="button"
                              onClick={() => onBulkPayForSupplier(sup.supplierName)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" /> Quitar Débito Total
                            </button>
                          )}
                        </div>
                      </div>

                      {/* -------------------------------------------------- */}
                      {/* RESUMO DE RECEBIMENTO ELEVADO (COMPACTO EM 1 FAIXA) */}
                      {/* -------------------------------------------------- */}
                      <div className="grid grid-cols-3 gap-2 p-2 bg-[#0B1221] rounded-xl border border-amber-500/20">
                        {/* TOTAL GERAL */}
                        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#13192B]/90 border border-amber-500/30 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-amber-300 block truncate">
                              💰 Total Geral
                            </span>
                            <span className="text-xs sm:text-sm font-black text-amber-400 block truncate">
                              R$ {sup.total.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0 hidden sm:inline">
                            {sup.count} pcs
                          </span>
                        </div>

                        {/* TOTAL RECEBIDO */}
                        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#13192B]/90 border border-emerald-500/30 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-emerald-400 block truncate">
                              ✅ Já Recebido
                            </span>
                            <span className="text-xs sm:text-sm font-black text-emerald-400 block truncate">
                              R$ {sup.totalReceived.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0 hidden sm:inline">
                            {sup.countReceived}/{sup.count} pcs
                          </span>
                        </div>

                        {/* O QUE FALTA */}
                        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#13192B]/90 border border-rose-500/30 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-rose-400 block truncate">
                              ⏳ Falta Receber
                            </span>
                            <span className="text-xs sm:text-sm font-black text-rose-400 block truncate">
                              R$ {sup.totalMissing.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 font-black px-1.5 py-0.5 rounded border border-rose-500/30 shrink-0 hidden sm:inline">
                            {sup.countMissing}/{sup.count} pcs
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* SEÇÃO: PEDIDOS DIVIDIDOS POR DATA (SUBIDO) */}
                    {/* -------------------------------------------------- */}
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" /> 
                          Pedidos Divididos por Data ({sup.dateGroups.length} {sup.dateGroups.length === 1 ? 'dia' : 'dias'})
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {sup.dateGroups.map((dGroup) => (
                          <div 
                            key={dGroup.dateKey}
                            className="bg-[#0B1221] border border-slate-800/90 rounded-xl overflow-hidden shadow-md"
                          >
                            {/* Barra de Cabeçalho da Data com Subtotal do Dia e Quitar Dia */}
                            <div className="p-2 sm:p-2.5 bg-gradient-to-r from-[#0E172A] via-[#111C33] to-[#0E172A] border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                                  <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs sm:text-sm font-black text-white">
                                      {dGroup.displayDate}
                                    </span>
                                    {dGroup.weekday && (
                                      <span className="text-[11px] text-slate-400 capitalize font-medium">
                                        ({dGroup.weekday})
                                      </span>
                                    )}
                                    {dGroup.dayBadge && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                                        {dGroup.dayBadge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {dGroup.dateCount} {dGroup.dateCount === 1 ? 'peça pedida nesta data' : 'peças pedidas nesta data'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                    Subtotal do Dia
                                  </span>
                                  <span className="text-sm sm:text-base font-black text-amber-400">
                                    R$ {dGroup.dateTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handlePayDateGroup(dGroup.items)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1"
                                  title={`Quitar todas as peças de ${dGroup.displayDate}`}
                                >
                                  <Check className="w-3 h-3" /> Quitar Dia (R$ {dGroup.dateTotal.toFixed(2).replace('.', ',')})
                                </button>
                              </div>
                            </div>

                            {/* Lista de Peças Pedidas nesta Data */}
                            <div className="divide-y divide-slate-800/60">
                              {dGroup.items.map((item) => {
                                const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                                const timeStr = item.createdAt && !isNaN(new Date(item.createdAt).getTime())
                                  ? new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                  : '';

                                return (
                                  <div 
                                    key={item.purchaseId}
                                    className="p-2 sm:p-2.5 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5"
                                  >
                                    {/* Detalhes da Peça */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                                          {item.typeName || 'Peça'}
                                        </span>
                                        <h5 className="text-xs sm:text-sm font-black text-white truncate" title={item.title}>
                                          {item.title}
                                        </h5>
                                        {timeStr && (
                                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                            <Clock className="w-3 h-3" /> {timeStr}
                                          </span>
                                        )}
                                      </div>

                                      {/* Tags de Marca, Modelo, Qualidade e Cor */}
                                      {(() => {
                                        const cfg = getPieceFieldConfig(item.typeName);
                                        return (
                                          <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-slate-400">
                                            {(item.marca || item.modelo) && (
                                              <span className="bg-[#161B2B] px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                                                <strong className="text-slate-400">Aparelho:</strong> {item.marca || ''} {item.modelo || ''}
                                              </span>
                                            )}
                                            {cfg.showQualidade && item.qualidade && (
                                              <span className="bg-[#161B2B] px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                                                <strong className="text-slate-400">Qualidade:</strong> {item.qualidade}
                                              </span>
                                            )}
                                            {cfg.showCor && item.cor && (
                                              <span className="bg-[#161B2B] px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                                                <strong className="text-slate-400">Cor:</strong> {item.cor}
                                              </span>
                                            )}
                                            {cfg.showEstrutura && item.estrutura && (
                                              <span className="bg-[#161B2B] px-1.5 py-0.5 rounded border border-slate-800 text-purple-300 font-black">
                                                <strong className="text-purple-400">Estrutura:</strong> {item.estrutura}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>

                                    {/* Valores e Ações Individuais */}
                                    <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                                      <div className="text-left md:text-right">
                                        <div className="text-xs sm:text-sm font-black text-amber-400">
                                          R$ {itemTotal.toFixed(2).replace('.', ',')}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {item.quantity}x R$ {(Number(item.price) || 0).toFixed(2).replace('.', ',')}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => onToggleReceived && onToggleReceived(item.purchaseId, !item.isReceived)}
                                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                            item.isReceived
                                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                          }`}
                                          title={item.isReceived ? 'Clique para marcar como NÃO RECEBIDO' : 'Clique para marcar como JÁ RECEBI'}
                                        >
                                          {item.isReceived ? (
                                            <>
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Já Recebi
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="w-3.5 h-3.5 text-amber-400" /> Não Recebi
                                            </>
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => onUpdateStatus(item.purchaseId, 'Pago')}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1"
                                          title="Dar baixa e marcar esta peça como Paga"
                                        >
                                          <Check className="w-3.5 h-3.5" /> Pagar Peça
                                        </button>

                                        {onToggleReturn && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReturnModal({
                                                isOpen: true,
                                                piece: item,
                                                supplierName: sup.supplierName,
                                                supplierPhone: phone,
                                                reason: 'Defeito de fábrica'
                                              });
                                            }}
                                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                            title="Devolver peça com defeito/garantia"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" /> Devolver
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditPieceModal(item)}
                                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                          title="Editar todos os dados da peça (data, valor, modelo, etc.)"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        <button 
                                          type="button"
                                          onClick={() => onDelete(item.purchaseId)}
                                          className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                          title="Excluir peça"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



      {/* ------------------------------------------------------------- */}
      {/* MODAL: CADASTRAR / EDITAR FORNECEDOR */}
      {/* ------------------------------------------------------------- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1221]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ele ficará disponível na Aba 1 para você apontar peças diretamente.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nome do Fornecedor *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Fornecedor Diamond, Mechanic Centro, Brasil Peças..."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp / Telefone
                </label>
                <input 
                  type="text"
                  placeholder="Ex: (11) 99999-8888"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5 text-indigo-400" /> Chave PIX (Para Pagamento Rápido)
                </label>
                <input 
                  type="text"
                  placeholder="Ex: pix@fornecedor.com ou CPF/CNPJ"
                  value={supplierForm.pixKey}
                  onChange={(e) => setSupplierForm({ ...supplierForm, pixKey: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Observações / Endereço / Notas
                </label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Vendedor João, entrega no mesmo dia, pagar toda sexta..."
                  value={supplierForm.obs}
                  onChange={(e) => setSupplierForm({ ...supplierForm, obs: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: APONTAR NOVA PEÇA MANUALMENTE */}
      {/* ------------------------------------------------------------- */}
      {isAddPieceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1221]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Apontar Nova Peça p/ Fornecedor</h3>
                  <p className="text-xs text-slate-400">Cadastre a peça e selecione onde irá comprar.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddPieceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Card do Fornecedor Onde Vou Comprar *
                </label>
                <div className="relative">
                  <select
                    required
                    value={newItemForm.supplierName}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplierName: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Selecione um fornecedor cadastrado...</option>
                    {allSuppliersList.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nome da Peça / Produto *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Tela iPhone 11 Pro, Bateria Moto G22, Conector..."
                  value={newItemForm.title}
                  onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Marca & Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Marca</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {marcaOpts.map(m => {
                      const isSelected = newItemForm.marca === m;
                      return (
                        <div key={m} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => setNewItemForm(prev => ({ ...prev, marca: m }))}
                            className={`px-2 py-0.5 rounded-l text-[10px] font-bold cursor-pointer transition-all ${
                              isSelected ? 'bg-indigo-600 text-white font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePurchOption('marca', m)}
                            className={`px-1 py-0.5 rounded-r text-[10px] cursor-pointer transition-colors border-l border-slate-700/50 ${
                              isSelected ? 'bg-indigo-700 text-indigo-200 hover:bg-red-600 hover:text-white' : 'bg-slate-800 text-slate-500 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Ex: Apple, Samsung..."
                      value={newItemForm.marca}
                      onChange={(e) => setNewItemForm({ ...newItemForm, marca: e.target.value })}
                      className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPurchOption('marca', newItemForm.marca)}
                      className="px-2 py-1 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      title="Salvar como botão fixo"
                    >
                      + Botão
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Modelo</label>
                  <input 
                    type="text"
                    placeholder="Ex: iPhone 11, A32, Redmi Note 11..."
                    value={newItemForm.modelo}
                    onChange={(e) => setNewItemForm({ ...newItemForm, modelo: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Qualidade & Estrutura */}
              {(() => {
                const addCfg = getPieceFieldConfig(newItemForm.typeName);
                if (!addCfg.showQualidade && !addCfg.showEstrutura) return null;
                return (
                  <div className={`grid grid-cols-1 ${addCfg.showQualidade && addCfg.showEstrutura ? 'sm:grid-cols-2' : ''} gap-3`}>
                    {addCfg.showQualidade && (
                      <div className="bg-[#0B1221] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <label className="block text-xs font-bold text-amber-400 uppercase">Qualidade</label>
                        <div className="flex items-center gap-1 flex-wrap">
                          {qualidadeOpts.map(q => {
                            const isSelected = newItemForm.qualidade === q;
                            return (
                              <div key={q} className="inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setNewItemForm(prev => ({ ...prev, qualidade: q }))}
                                  className={`px-2 py-1 rounded-l text-xs font-black transition-all cursor-pointer ${
                                    isSelected ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {q}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchOption('qualidade', q)}
                                  className={`px-1 py-1 rounded-r text-xs cursor-pointer transition-colors border-l border-slate-700/50 ${
                                    isSelected ? 'bg-amber-600 text-slate-950 hover:bg-red-600 hover:text-white' : 'bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white'
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            placeholder="Outra qualidade..."
                            value={newItemForm.qualidade}
                            onChange={(e) => setNewItemForm({ ...newItemForm, qualidade: e.target.value })}
                            className="w-full bg-[#121827] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddPurchOption('qualidade', newItemForm.qualidade)}
                            className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                            title="Salvar como botão"
                          >
                            + Botão
                          </button>
                        </div>
                      </div>
                    )}

                    {addCfg.showEstrutura && (
                      <div className="bg-[#0B1221] p-2.5 rounded-xl border border-slate-800 space-y-2">
                        <label className="block text-xs font-bold text-purple-400 uppercase">Estrutura (C/ Aro, S/ Aro...)</label>

                        {/* Quick Direct Buttons: C/ ARO vs S/ ARO */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewItemForm(prev => {
                              const isCurrentlyCAro = (prev.estrutura || '').trim().toUpperCase() === 'C/ ARO' || (prev.estrutura || '').trim().toLowerCase() === 'com aro';
                              return { ...prev, estrutura: isCurrentlyCAro ? '' : 'C/ ARO' };
                            })}
                            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              (newItemForm.estrutura || '').trim().toUpperCase() === 'C/ ARO' || (newItemForm.estrutura || '').trim().toLowerCase() === 'com aro'
                                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 ring-2 ring-purple-400 scale-[1.02]'
                                : 'bg-slate-800/90 text-purple-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <span>⭕ C/ ARO</span>
                            {((newItemForm.estrutura || '').trim().toUpperCase() === 'C/ ARO' || (newItemForm.estrutura || '').trim().toLowerCase() === 'com aro') && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewItemForm(prev => {
                              const isCurrentlySAro = (prev.estrutura || '').trim().toUpperCase() === 'S/ ARO' || (prev.estrutura || '').trim().toLowerCase() === 'sem aro';
                              return { ...prev, estrutura: isCurrentlySAro ? '' : 'S/ ARO' };
                            })}
                            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              (newItemForm.estrutura || '').trim().toUpperCase() === 'S/ ARO' || (newItemForm.estrutura || '').trim().toLowerCase() === 'sem aro'
                                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 ring-2 ring-purple-400 scale-[1.02]'
                                : 'bg-slate-800/90 text-purple-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <span>⭕ S/ ARO</span>
                            {((newItemForm.estrutura || '').trim().toUpperCase() === 'S/ ARO' || (newItemForm.estrutura || '').trim().toLowerCase() === 'sem aro') && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {estruturaOpts.map(eOpt => {
                            const isSelected = (newItemForm.estrutura || '').trim().toUpperCase() === eOpt.trim().toUpperCase();
                            return (
                              <div key={eOpt} className="inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setNewItemForm(prev => ({ 
                                    ...prev, 
                                    estrutura: (prev.estrutura || '').trim().toUpperCase() === eOpt.trim().toUpperCase() ? '' : eOpt 
                                  }))}
                                  className={`px-2.5 py-1 rounded-l text-xs font-black transition-all cursor-pointer ${
                                    isSelected ? 'bg-purple-600 text-white font-black shadow-sm ring-1 ring-purple-400' : 'bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {eOpt}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchOption('estrutura', eOpt)}
                                  className={`px-1 py-1 rounded-r text-xs cursor-pointer transition-colors border-l border-slate-700/50 ${
                                    isSelected ? 'bg-purple-700 text-purple-200 hover:bg-red-600 hover:text-white' : 'bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white'
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            placeholder="Outra estrutura..."
                            value={newItemForm.estrutura}
                            onChange={(e) => setNewItemForm({ ...newItemForm, estrutura: e.target.value })}
                            className="w-full bg-[#121827] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddPurchOption('estrutura', newItemForm.estrutura)}
                            className="px-2 py-1 bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                            title="Salvar como botão"
                          >
                            + Botão
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Cor & Quantidade/Preço */}
              {(() => {
                const addCfg = getPieceFieldConfig(newItemForm.typeName);
                return (
                  <div className={`grid grid-cols-1 ${addCfg.showCor ? 'sm:grid-cols-2' : ''} gap-3`}>
                    {addCfg.showCor && (
                      <div className="bg-[#0B1221] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 uppercase">Cor</label>
                        <div className="flex items-center gap-1 flex-wrap">
                          {corOpts.map(c => {
                            const isSelected = newItemForm.cor === c;
                            return (
                              <div key={c} className="inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setNewItemForm(prev => ({ ...prev, cor: c }))}
                                  className={`px-2 py-1 rounded-l text-xs font-bold cursor-pointer transition-all ${
                                    isSelected ? 'bg-indigo-600 text-white font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {c}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchOption('cor', c)}
                                  className={`px-1 py-1 rounded-r text-xs cursor-pointer transition-colors border-l border-slate-700/50 ${
                                    isSelected ? 'bg-indigo-700 text-indigo-200 hover:bg-red-600 hover:text-white' : 'bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white'
                                  }`}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            placeholder="Ex: Preto, Branco..."
                            value={newItemForm.cor}
                            onChange={(e) => setNewItemForm({ ...newItemForm, cor: e.target.value })}
                            className="w-full bg-[#121827] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddPurchOption('cor', newItemForm.cor)}
                            className="px-2 py-1 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                            title="Salvar como botão"
                          >
                            + Botão
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                        <input 
                          type="number"
                          min="1"
                          value={newItemForm.quantity}
                          onChange={(e) => setNewItemForm({ ...newItemForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Preço Unitário (R$)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={newItemForm.price}
                          onChange={(e) => setNewItemForm({ ...newItemForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Status Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Condição de Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemForm({ ...newItemForm, paymentStatus: 'Pendente' })}
                    className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-left flex flex-col gap-1 ${
                      newItemForm.paymentStatus === 'Pendente'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black">
                      <Clock className="w-3.5 h-3.5" /> 💳 A Prazo (Em Débito)
                    </div>
                    <span className="text-[10px] font-normal text-slate-400">
                      Vai para Débito com Fornecedor (Aba 4)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemForm({ ...newItemForm, paymentStatus: 'Pago' })}
                    className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-left flex flex-col gap-1 ${
                      newItemForm.paymentStatus === 'Pago'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ⚡ Pagar na Hora (À Vista)
                    </div>
                    <span className="text-[10px] font-normal text-slate-400">
                      Entra direto no Histórico 12 Meses (Aba 3)
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPieceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar e Apontar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DEVOLUÇÃO DE PEÇA AO FORNECEDOR */}
      {/* ------------------------------------------------------------- */}
      {returnModal.isOpen && returnModal.piece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161B2B] border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Devolução de Peça</h3>
                  <p className="text-xs text-rose-300">Fornecedor: {returnModal.supplierName}</p>
                </div>
              </div>
              <button 
                onClick={() => setReturnModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Piece Details Card */}
              <div className="bg-[#0B1221] p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 block w-fit mb-1">
                      {returnModal.piece.typeName || 'Peça'}
                    </span>
                    <h4 className="text-sm font-black text-white truncate">{returnModal.piece.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {returnModal.piece.marca} {returnModal.piece.modelo} {returnModal.piece.qualidade ? `• ${returnModal.piece.qualidade}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-rose-400">
                      R$ {((Number(returnModal.piece.price) || 0) * (Number(returnModal.piece.quantity) || 1)).toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {returnModal.piece.quantity}x R$ {(Number(returnModal.piece.price) || 0).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  ⚠️ <strong>Regra de Devolução:</strong> Ao confirmar, esta peça NÃO será mais contabilizada no valor do card nem no total a pagar deste fornecedor.
                </div>
              </div>

              {/* Motivo da Devolução */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Motivo da Devolução
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    'Defeito de fábrica',
                    'Peça com falha / touch',
                    'Modelo incorreto',
                    'Cliente desistiu'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReturnModal(prev => ({ ...prev, reason: preset }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-all border cursor-pointer ${
                        returnModal.reason === preset
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input 
                  type="text"
                  placeholder="Ou descreva outro motivo detalhado..."
                  value={returnModal.reason}
                  onChange={(e) => setReturnModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleConfirmReturn(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Confirmar e Enviar Aviso no WhatsApp
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmReturn(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Apenas Marcar Devolução
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE CONFERÊNCIA DE DÉBITO PARA FORNECEDOR (GERAÇÃO DE TEXTO) */}
      {/* ------------------------------------------------------------- */}
      {conferenceModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col border border-slate-700/50 overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Relatório de Conferência de Débito ({conferenceModal.supplierName})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Total em débito dividido por datas e com status de recebimento
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setConferenceModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Textarea */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="bg-[#0B1221] p-3 rounded-xl border border-indigo-500/30 text-xs text-slate-300">
                <p className="font-bold text-white mb-1">
                  💡 Texto pronto para conferência!
                </p>
                <p className="text-slate-400 text-[11px]">
                  O texto abaixo inicia com o <strong>total geral devido</strong>, a situação de recebimento (quanto já recebeu e quanto falta), as <strong>datas e dias da semana respectivos</strong> do débito, e a lista de peças pedidas divididas por data.
                </p>
              </div>

              {(() => {
                const fullText = formatSupplierConferenceWhatsAppText(
                  conferenceModal.supplierName,
                  conferenceModal.supplierInfo,
                  conferenceModal.dateGroups,
                  conferenceModal.pendingItems
                );

                return (
                  <div className="space-y-3">
                    <textarea 
                      readOnly
                      rows={12}
                      value={fullText}
                      className="w-full bg-[#080D18] border border-slate-700/80 rounded-2xl p-4 text-xs font-mono text-emerald-300 leading-relaxed focus:outline-none select-all custom-scrollbar shadow-inner"
                    />

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(fullText);
                            }
                          } catch (_) {}
                          setConferenceModal(prev => ({ ...prev, copiedText: true }));
                          setTimeout(() => {
                            setConferenceModal(prev => ({ ...prev, copiedText: false }));
                          }, 2500);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                      >
                        {conferenceModal.copiedText ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-emerald-300" />
                            <span className="text-emerald-300">Copiado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Texto Completo</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const phone = conferenceModal.supplierInfo?.phone || '';
                          openWhatsAppMessageSafely(phone, fullText);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE CONFERÊNCIA DE DEVOLUÇÕES PARA FORNECEDOR */}
      {/* ------------------------------------------------------------- */}
      {returnsConferenceModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col border border-slate-700/50 overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Conferência de Devolução ({returnsConferenceModal.supplierName})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Relatório detalhado de peças devolvidas com somas e emojis
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setReturnsConferenceModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Textarea */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="bg-[#0B1221] p-3 rounded-xl border border-rose-500/30 text-xs text-slate-300">
                <p className="font-bold text-white mb-1">
                  💡 Texto pronto para conferência de devolução!
                </p>
                <p className="text-slate-400 text-[11px]">
                  O texto abaixo traz a relação completa das peças devolvidas, valores desconsiderados, motivos e emojis formatados para envio no WhatsApp.
                </p>
              </div>

              {/* Option toggle inside modal: Todas vs Apenas na Loja */}
              <div className="flex items-center gap-2 bg-[#0B1221] p-1.5 rounded-xl border border-slate-700/80 w-fit">
                <button
                  type="button"
                  onClick={() => setReturnsConferenceModal(prev => ({ ...prev, onlyInStore: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    !returnsConferenceModal.onlyInStore 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 Todas as Devoluções
                </button>
                <button
                  type="button"
                  onClick={() => setReturnsConferenceModal(prev => ({ ...prev, onlyInStore: true }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    returnsConferenceModal.onlyInStore 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📦 Apenas Peças na Loja
                </button>
              </div>

              {(() => {
                const fullText = formatReturnsConferenceWhatsApp(
                  returnsConferenceModal.supplierName,
                  returnsConferenceModal.items,
                  !!returnsConferenceModal.onlyInStore
                );

                return (
                  <div className="space-y-3">
                    <textarea 
                      readOnly
                      rows={12}
                      value={fullText}
                      className="w-full bg-[#080D18] border border-slate-700/80 rounded-2xl p-4 text-xs font-mono text-emerald-300 leading-relaxed focus:outline-none select-all custom-scrollbar shadow-inner"
                    />

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(fullText);
                            }
                          } catch (_) {}
                          setReturnsConferenceModal(prev => ({ ...prev, copiedText: true }));
                          setTimeout(() => {
                            setReturnsConferenceModal(prev => ({ ...prev, copiedText: false }));
                          }, 2500);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                      >
                        {returnsConferenceModal.copiedText ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-emerald-300" />
                            <span className="text-emerald-300">Copiado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Texto Completo</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const phone = returnsConferenceModal.supplierInfo?.phone || '';
                          openWhatsAppMessageSafely(phone, fullText);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PEÇA / PEDIDO DE FORNECEDOR (DATA, VALOR E TODOS OS DADOS) */}
      {editingPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1221] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Editar Peça / Pedido de Fornecedor</h3>
                  <p className="text-xs text-slate-400">Altere a data, valor, fornecedor, modelo e todos os dados</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingPiece(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditedPiece} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {/* Data da Compra / Pedido & Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Data do Pedido / Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingPieceForm.createdAt}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, createdAt: e.target.value })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Fornecedor *
                  </label>
                  <select
                    value={editingPieceForm.supplierName}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, supplierName: e.target.value })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Selecione o fornecedor...</option>
                    {allSuppliersList.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categoria & Nome / Descrição */}
              <div className="space-y-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                    Categoria da Peça
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Tela', 'Bateria', 'DOC / Conector', 'Placa', 'Câmera', 'Carcaça', 'Acessórios', 'Outros'].map(cat => {
                      const isSel = (editingPieceForm.typeName || '').toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditingPieceForm({ ...editingPieceForm, typeName: cat })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                    Descrição / Nome da Peça *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Tela Display Frente Complete, Bateria Original..."
                    value={editingPieceForm.title}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, title: e.target.value })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Marca & Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-300 uppercase">Marca / Fabricante</label>
                  <input
                    type="text"
                    placeholder="Apple, Samsung, Xiaomi, Motorola..."
                    value={editingPieceForm.marca}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, marca: e.target.value })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Realme'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditingPieceForm(prev => ({ ...prev, marca: m }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          editingPieceForm.marca.toLowerCase() === m.toLowerCase()
                            ? 'bg-indigo-600 text-white font-black'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-300 uppercase">Modelo do Aparelho</label>
                  <input 
                    type="text"
                    placeholder="Ex: iPhone 11, S20 FE, Redmi Note 10..."
                    value={editingPieceForm.modelo}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, modelo: e.target.value })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Estrutura, Qualidade & Cor */}
              {(() => {
                const editCfg = getPieceFieldConfig(editingPieceForm.typeName);
                if (!editCfg.showEstrutura && !editCfg.showQualidade && !editCfg.showCor) return null;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                    {editCfg.showEstrutura && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-purple-400 uppercase">Estrutura</label>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingPieceForm(prev => ({
                              ...prev,
                              estrutura: (prev.estrutura || '').toUpperCase() === 'C/ ARO' ? '' : 'C/ ARO'
                            }))}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${
                              (editingPieceForm.estrutura || '').toUpperCase() === 'C/ ARO'
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                                : 'bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            C/ ARO
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPieceForm(prev => ({
                              ...prev,
                              estrutura: (prev.estrutura || '').toUpperCase() === 'S/ ARO' ? '' : 'S/ ARO'
                            }))}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${
                              (editingPieceForm.estrutura || '').toUpperCase() === 'S/ ARO'
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                                : 'bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            S/ ARO
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Outra estrutura..."
                          value={editingPieceForm.estrutura}
                          onChange={(e) => setEditingPieceForm({ ...editingPieceForm, estrutura: e.target.value })}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    {editCfg.showQualidade && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-amber-400 uppercase">Qualidade</label>
                        <input
                          type="text"
                          placeholder="Original, Gold Pro, Incell..."
                          value={editingPieceForm.qualidade}
                          onChange={(e) => setEditingPieceForm({ ...editingPieceForm, qualidade: e.target.value })}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {['Original', 'China Gold', 'Incell', 'OLED'].map(q => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setEditingPieceForm(prev => ({ ...prev, qualidade: q }))}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                editingPieceForm.qualidade.toLowerCase() === q.toLowerCase()
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {editCfg.showCor && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-300 uppercase">Cor</label>
                        <input
                          type="text"
                          placeholder="Preto, Branco, Azul..."
                          value={editingPieceForm.cor}
                          onChange={(e) => setEditingPieceForm({ ...editingPieceForm, cor: e.target.value })}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {['Preto', 'Branco', 'Azul', 'Dourado'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditingPieceForm(prev => ({ ...prev, cor: c }))}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                editingPieceForm.cor.toLowerCase() === c.toLowerCase()
                                  ? 'bg-indigo-600 text-white font-black'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Quantidade & Preço Unitário (VALOR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-300 uppercase">Quantidade</label>
                  <input 
                    type="number"
                    min="1"
                    value={editingPieceForm.quantity}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-emerald-400 uppercase flex items-center justify-between">
                    <span>Preço Unitário (R$) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Subtotal: R$ {((Number(editingPieceForm.quantity) || 1) * (Number(editingPieceForm.price) || 0)).toFixed(2).replace('.', ',')}
                    </span>
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPieceForm.price}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161B2B] border border-emerald-500/50 rounded-xl px-3 py-2 text-sm font-black text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Status de Pagamento & Recebimento & Devolução */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B1221] p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-300 uppercase">Pagamento</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, paymentStatus: 'Pendente' })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        editingPieceForm.paymentStatus === 'Pendente'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> A Prazo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, paymentStatus: 'Pago' })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        editingPieceForm.paymentStatus === 'Pago'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Pago
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-300 uppercase">Recebimento</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, isReceived: false })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        !editingPieceForm.isReceived
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> Falta
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, isReceived: true })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        editingPieceForm.isReceived
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Check className="w-3 h-3" /> Recebido
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-rose-400 uppercase">Devolução</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, isReturned: false, returnReason: '' })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        !editingPieceForm.isReturned
                          ? 'border-slate-600 bg-slate-800 text-slate-200'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPieceForm({ ...editingPieceForm, isReturned: true, returnReason: editingPieceForm.returnReason || 'Defeito de fábrica' })}
                      className={`p-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        editingPieceForm.isReturned
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" /> Devolvida
                    </button>
                  </div>
                </div>
              </div>

              {editingPieceForm.isReturned && (
                <div className="space-y-1 bg-rose-950/20 p-3 rounded-2xl border border-rose-500/30 animate-in fade-in">
                  <label className="block text-xs font-black text-rose-400 uppercase">
                    Motivo da Devolução
                  </label>
                  <input
                    type="text"
                    value={editingPieceForm.returnReason}
                    onChange={(e) => setEditingPieceForm({ ...editingPieceForm, returnReason: e.target.value })}
                    placeholder="Ex: Touch falhando, defeito de fábrica, peça incompatível..."
                    className="w-full bg-[#161B2B] border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPiece(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: HISTÓRICO CONSOLIDADO POR MÊS E POR SEMANA & GERENCIAMENTO */}
      {/* ============================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#10172A] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    <span>Histórico de Compras & Pagamentos</span>
                    {historyModalSupplierName ? (
                      <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-bold">
                        {historyModalSupplierName}
                      </span>
                    ) : (
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold">
                        Todos os Fornecedores
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Soma de todas as compras feitas e pagas, agrupadas por mês e por semana com ferramenta de exclusão por período.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistorySelectedMonths({});
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-[#0B1221]/80 border-b border-slate-800/80 shrink-0">
              <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase truncate">Total de Compras Feitas</div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5">
                  R$ {historyModalItems.filter(i => !i.isReturned).reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
                </div>
                <div className="text-[10px] text-slate-500">{historyModalItems.length} peças totais</div>
              </div>

              <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-bold uppercase truncate">Total Já Pago</div>
                <div className="text-base sm:text-lg font-black text-emerald-300 mt-0.5">
                  R$ {historyModalItems.filter(i => i.paymentStatus === 'Pago' && !i.isReturned).reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
                </div>
                <div className="text-[10px] text-emerald-500">{historyModalItems.filter(i => i.paymentStatus === 'Pago' && !i.isReturned).length} peças pagas</div>
              </div>

              <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-amber-500/30">
                <div className="text-[10px] text-amber-400 font-bold uppercase truncate">Total a Prazo (Pendente)</div>
                <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                  R$ {historyModalItems.filter(i => i.paymentStatus === 'Pendente' && !i.isReturned).reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
                </div>
                <div className="text-[10px] text-amber-500">{historyModalItems.filter(i => i.paymentStatus === 'Pendente' && !i.isReturned).length} peças em aberto</div>
              </div>

              <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-rose-500/30">
                <div className="text-[10px] text-rose-400 font-bold uppercase truncate">Devoluções</div>
                <div className="text-base sm:text-lg font-black text-rose-300 mt-0.5">
                  {historyModalItems.filter(i => !!i.isReturned).length} peças
                </div>
                <div className="text-[10px] text-slate-500">Não cobradas</div>
              </div>
            </div>

            {/* Controls Bar: Grouping Selector (Mês / Semana) & Year Filter & Deletion Scope */}
            <div className="p-3 sm:p-4 bg-[#131B2E] border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('MES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyViewMode === 'MES'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Separado por Mês ({historyByMonth.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryViewMode('SEMANA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyViewMode === 'SEMANA'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Separado por Semana ({historyByWeek.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Ano filter */}
                <div className="flex items-center gap-1.5 bg-[#0B1221] border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ano:</span>
                  <select
                    value={historySelectedYear}
                    onChange={(e) => setHistorySelectedYear(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#161B2B]">Todos os Anos</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr} className="bg-[#161B2B]">{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Fornecedor selector inside modal if global */}
                {!historyModalSupplierName && (
                  <div className="flex items-center gap-1.5 bg-[#0B1221] border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={supplierFilter}
                      onChange={(e) => setSupplierFilter(e.target.value)}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#161B2B]">Todos Fornecedores</option>
                      {allSuppliersList.map(s => (
                        <option key={s.id} value={s.name} className="bg-[#161B2B]">{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbox: Selection & Deletion Management */}
            <div className="p-3 bg-gradient-to-r from-rose-950/20 via-[#161B2B] to-slate-900 border-b border-rose-500/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Opção de Apagar Histórico:
                </span>
                
                {/* Scope selector */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHistoryDeleteScope('PAID_ONLY')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      historyDeleteScope === 'PAID_ONLY'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Apaga apenas as peças que já foram pagas, mantendo débitos ativos"
                  >
                    Somente Compras Pagas
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryDeleteScope('ALL')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      historyDeleteScope === 'ALL'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Apaga todas as compras do período selecionado (pagas e pendentes)"
                  >
                    Todas (Pagas + Pendentes)
                  </button>
                </div>
              </div>

              {/* Bulk select and delete buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {historyViewMode === 'MES' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const allMap: Record<string, boolean> = {};
                        historyByMonth.forEach(m => { allMap[m.monthKey] = true; });
                        setHistorySelectedMonths(allMap);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Selecionar Todos Meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorySelectedMonths({})}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Desmarcar
                    </button>
                    <button
                      type="button"
                      disabled={Object.values(historySelectedMonths).filter(Boolean).length === 0}
                      onClick={handleRequestDeleteSelectedMonths}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Apagar Meses Selecionados ({Object.values(historySelectedMonths).filter(Boolean).length})</span>
                    </button>
                  </>
                )}

                {historySelectedYear !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteYear(historySelectedYear)}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-rose-700/20 cursor-pointer"
                    title={`Apagar todas as compras do ano de ${historySelectedYear}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Apagar Ano {historySelectedYear}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Month or Week View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {historyViewMode === 'MES' ? (
                historyByMonth.length === 0 ? (
                  <div className="text-center py-12 bg-[#161B2B] rounded-2xl border border-slate-800">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Nenhuma compra encontrada para este filtro</h4>
                    <p className="text-xs text-slate-500 mt-1">Selecione outro ano ou fornecedor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyByMonth.map(group => {
                      const isSelected = !!historySelectedMonths[group.monthKey];
                      const isExpanded = historyExpandedKey === group.monthKey;

                      return (
                        <div
                          key={group.monthKey}
                          className={`bg-[#161B2B] rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-rose-500/80 shadow-lg shadow-rose-500/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Month Header Card */}
                          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Selection checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  setHistorySelectedMonths(prev => ({
                                    ...prev,
                                    [group.monthKey]: e.target.checked
                                  }));
                                }}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-rose-500 cursor-pointer shrink-0"
                                title="Selecionar este mês para apagar"
                              />

                              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                                <Calendar className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-black text-white">
                                    {group.label}
                                  </h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {group.itemsCount} {group.itemsCount === 1 ? 'peça' : 'peças'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Total de {group.items.length} pedidos registrados neste mês
                                </div>
                              </div>
                            </div>

                            {/* Totals Breakdown */}
                            <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
                              <div className="flex items-center gap-2 text-right">
                                <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                                  <div className="text-[9px] text-slate-400 uppercase font-bold">Total Feito</div>
                                  <div className="text-xs sm:text-sm font-black text-white">
                                    R$ {group.totalMade.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>

                                <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-emerald-500/30 text-center">
                                  <div className="text-[9px] text-emerald-400 uppercase font-bold">Total Pago</div>
                                  <div className="text-xs sm:text-sm font-black text-emerald-300">
                                    R$ {group.totalPaid.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>

                                {group.totalPending > 0 && (
                                  <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-amber-500/30 text-center">
                                    <div className="text-[9px] text-amber-400 uppercase font-bold">A Prazo</div>
                                    <div className="text-xs sm:text-sm font-black text-amber-300">
                                      R$ {group.totalPending.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setHistoryExpandedKey(isExpanded ? null : group.monthKey)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-3.5 h-3.5" /> Recolher
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" /> Ver Peças ({group.items.length})
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRequestDeleteSingleMonth(group.monthKey, group.label, group.items)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                  title={`Apagar compras de ${group.label}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Pieces Table */}
                          {isExpanded && (
                            <div className="border-t border-slate-800/80 bg-[#0B1221]/60 p-3 sm:p-4 space-y-2 animate-in fade-in">
                              <div className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2">
                                Peças e Compras de {group.label}:
                              </div>
                              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto custom-scrollbar">
                                {group.items.map(piece => {
                                  const pieceTotal = (Number(piece.price) || 0) * (Number(piece.quantity) || 1);
                                  return (
                                    <div key={piece.purchaseId} className="py-2 flex items-center justify-between gap-3 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                            {piece.typeName || 'Peça'}
                                          </span>
                                          <span className="font-bold text-white truncate">{piece.title}</span>
                                          <span className="text-[10px] text-slate-500">({piece.supplierName})</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          Data: {new Date(piece.createdAt).toLocaleDateString('pt-BR')} • {piece.quantity}x R$ {Number(piece.price).toFixed(2).replace('.', ',')}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2.5 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                          piece.isReturned
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : piece.paymentStatus === 'Pago'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}>
                                          {piece.isReturned ? 'Devolvida' : piece.paymentStatus}
                                        </span>
                                        <div className="font-black text-white text-right">
                                          R$ {pieceTotal.toFixed(2).replace('.', ',')}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => onDelete(piece.purchaseId)}
                                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                                          title="Excluir peça"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Week View */
                historyByWeek.length === 0 ? (
                  <div className="text-center py-12 bg-[#161B2B] rounded-2xl border border-slate-800">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Nenhuma semana encontrada para este filtro</h4>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyByWeek.map(group => {
                      const isExpanded = historyExpandedKey === group.weekKey;

                      return (
                        <div
                          key={group.weekKey}
                          className="bg-[#161B2B] rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
                                <Clock className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm sm:base font-black text-white">
                                    {group.label}
                                  </h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {group.itemsCount} peças
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {group.items.length} pedidos na semana
                                </div>
                              </div>
                            </div>

                            {/* Totals */}
                            <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
                              <div className="flex items-center gap-2 text-right">
                                <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                                  <div className="text-[9px] text-slate-400 uppercase font-bold">Total Feito</div>
                                  <div className="text-xs sm:text-sm font-black text-white">
                                    R$ {group.totalMade.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>

                                <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-emerald-500/30 text-center">
                                  <div className="text-[9px] text-emerald-400 uppercase font-bold">Total Pago</div>
                                  <div className="text-xs sm:text-sm font-black text-emerald-300">
                                    R$ {group.totalPaid.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>

                                {group.totalPending > 0 && (
                                  <div className="bg-[#0B1221] px-2.5 py-1 rounded-lg border border-amber-500/30 text-center">
                                    <div className="text-[9px] text-amber-400 uppercase font-bold">A Prazo</div>
                                    <div className="text-xs sm:text-sm font-black text-amber-300">
                                      R$ {group.totalPending.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setHistoryExpandedKey(isExpanded ? null : group.weekKey)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700 shrink-0"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" /> Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" /> Ver Peças ({group.items.length})
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded pieces */}
                          {isExpanded && (
                            <div className="border-t border-slate-800/80 bg-[#0B1221]/60 p-3 sm:p-4 space-y-2 animate-in fade-in">
                              <div className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2">
                                Peças da {group.label}:
                              </div>
                              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto custom-scrollbar">
                                {group.items.map(piece => {
                                  const pieceTotal = (Number(piece.price) || 0) * (Number(piece.quantity) || 1);
                                  return (
                                    <div key={piece.purchaseId} className="py-2 flex items-center justify-between gap-3 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                            {piece.typeName || 'Peça'}
                                          </span>
                                          <span className="font-bold text-white truncate">{piece.title}</span>
                                          <span className="text-[10px] text-slate-500">({piece.supplierName})</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          Data: {new Date(piece.createdAt).toLocaleDateString('pt-BR')} • {piece.quantity}x R$ {Number(piece.price).toFixed(2).replace('.', ',')}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2.5 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                          piece.isReturned
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : piece.paymentStatus === 'Pago'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}>
                                          {piece.isReturned ? 'Devolvida' : piece.paymentStatus}
                                        </span>
                                        <div className="font-black text-white text-right">
                                          R$ {pieceTotal.toFixed(2).replace('.', ',')}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-[#0B1221] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400">
                Total consolidado: <strong className="text-white">{historyModalItems.length} compras</strong> no histórico
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistorySelectedMonths({});
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting History */}
      {historyConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-rose-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-white">
                {historyConfirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {historyConfirmDialog.message}
            </p>

            <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 space-y-1">
              <div>⚠️ <strong>Atenção:</strong> Esta ação é definitiva e removerá as compras selecionadas da memória e do banco de dados.</div>
              <div>Quantidade: <strong>{historyConfirmDialog.itemsCount} compras</strong></div>
              <div>Valor total: <strong>R$ {historyConfirmDialog.totalValue.toFixed(2).replace('.', ',')}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHistoryConfirmDialog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteHistory}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADICIONAR NOVA PEÇA PARA DEVOLUÇÃO DIRETAMENTE (IDÊNTICO A PEDIDOS) */}
      {/* ------------------------------------------------------------- */}
      {isAddReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161B2B] border border-rose-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/35 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Adicionar Peça p/ Devolução</h3>
                  <p className="text-xs text-rose-300">Cadastre a peça devolvida com os mesmos dados de pedidos.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddReturnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewReturnItem} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Card do Fornecedor *
                </label>
                <select
                  required
                  value={newReturnForm.supplierName}
                  onChange={(e) => setNewReturnForm({ ...newReturnForm, supplierName: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="">Selecione um fornecedor cadastrado...</option>
                  {allSuppliersList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria / TypeName */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                  Categoria da Peça
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Tela', 'Bateria', 'DOC / Conector', 'Placa', 'Câmera', 'Carcaça', 'Acessórios', 'Outros'].map(cat => {
                    const isSel = (newReturnForm.typeName || '').toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewReturnForm({ ...newReturnForm, typeName: cat })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isSel
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nome da Peça / Produto *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Tela iPhone 11 Pro, Bateria..."
                  value={newReturnForm.title}
                  onChange={(e) => setNewReturnForm({ ...newReturnForm, title: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Marca & Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Marca</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {marcaOpts.map(m => {
                      const isSelected = newReturnForm.marca === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setNewReturnForm(prev => ({ ...prev, marca: m }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            isSelected ? 'bg-rose-600 text-white font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Apple, Samsung..."
                    value={newReturnForm.marca}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, marca: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 mt-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Modelo</label>
                  <input 
                    type="text"
                    placeholder="Ex: iPhone 11, A32..."
                    value={newReturnForm.modelo}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, modelo: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>
              </div>

              {/* Qualidade & Estrutura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0B1221] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-amber-400 uppercase">Qualidade</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {qualidadeOpts.map(q => {
                      const isSelected = newReturnForm.qualidade === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setNewReturnForm(prev => ({ ...prev, qualidade: q }))}
                          className={`px-2 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                            isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#0B1221] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-purple-400 uppercase">Estrutura</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewReturnForm(prev => ({ ...prev, estrutura: prev.estrutura === 'C/ ARO' ? '' : 'C/ ARO' }))}
                      className={`py-1 px-2 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                        newReturnForm.estrutura === 'C/ ARO'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-800 text-purple-300 border-slate-700'
                      }`}
                    >
                      C/ ARO
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewReturnForm(prev => ({ ...prev, estrutura: prev.estrutura === 'S/ ARO' ? '' : 'S/ ARO' }))}
                      className={`py-1 px-2 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                        newReturnForm.estrutura === 'S/ ARO'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-800 text-purple-300 border-slate-700'
                      }`}
                    >
                      S/ ARO
                    </button>
                  </div>
                </div>
              </div>

              {/* Data da Devolução & Motivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Data da Devolução *
                  </label>
                  <input 
                    type="date"
                    required
                    value={newReturnForm.customDate}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, customDate: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Motivo da Devolução
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Defeito de fábrica..."
                    value={newReturnForm.returnReason}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, returnReason: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Quantidade & Preço */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={newReturnForm.quantity}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor Original (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newReturnForm.price}
                    onChange={(e) => setNewReturnForm({ ...newReturnForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddReturnModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Devolução Direta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
