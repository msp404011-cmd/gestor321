import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Edit2, Trash2, Check, ShoppingCart, 
  MessageSquare, MoreVertical, Search, Send, Settings, X, Box, DollarSign, Copy, Calendar, Filter,
  ChevronDown, ChevronUp, Truck, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, ExternalLink,
  Building2, Layers, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { StorageService } from '../../services/storage';
import { getTenantId } from '../../services/firestoreService';
import { CloudEngineBadge } from '../common/CloudEngineBadge';
import { SupplierPurchaseItem, SupplierPurchasesView, RegisteredSupplier } from './SupplierPurchasesView';

export interface SupplierOrderItem {
  id: string;
  title: string;
  typeName?: string;
  marca?: string;
  modelo?: string;
  estrutura?: string;
  qualidade?: string;
  tecnologia?: string;
  cor?: string;
  quantity: number;
  price: number;
  customFields?: Record<string, string>;
  sentToSupplier?: boolean;
  createdAt?: string;
}

interface CustomField {
  id: string;
  name: string;
  enabled: boolean;
}

interface FieldOption {
  id: string;
  value: string;
}

interface ItemTemplate {
  id: string;
  name: string;
  fields: {
    showMarca: boolean;
    showModelo: boolean;
    showEstrutura: boolean;
    showQualidade: boolean;
    showTecnologia: boolean;
    showCor: boolean;
  };
  options: {
    marca: FieldOption[];
    qualidade: FieldOption[];
    tecnologia: FieldOption[];
    estrutura: FieldOption[];
    cor: FieldOption[];
  };
}

interface SupplierFieldSettings {
  templates: ItemTemplate[];
  activeTemplateId: string | null;
}

interface SupplierOrderGroup {
  id: string;
  title: string;
  whatsapp: string;
  items: SupplierOrderItem[];
  createdAt: string;
  status?: string;
  obs?: string;
}

const STORAGE_KEY_GROUPS = 'msp_supplier_order_groups_v3';
const STORAGE_KEY_PURCHASES = 'msp_supplier_purchases_v3';
const STORAGE_KEY_SUPPLIERS = 'msp_registered_suppliers_v3';

const DEFAULT_SUPPLIERS: RegisteredSupplier[] = [
  { id: 'sup_diamond', name: 'DIAMOND', phone: '', pixKey: '', obs: 'Fornecedor de Telas', createdAt: new Date().toISOString() },
  { id: 'sup_mechanic', name: 'MECHANIC', phone: '', pixKey: '', obs: 'Fornecedor de Peças e Ferramentas', createdAt: new Date().toISOString() }
];

export const SupplierOrdersManagement: React.FC = () => {
  // Safe initial state loaded synchronously from localStorage
  const [groups, setGroups] = useState<SupplierOrderGroup[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchaseItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PURCHASES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [suppliers, setSuppliers] = useState<RegisteredSupplier[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_SUPPLIERS;
    } catch {
      return DEFAULT_SUPPLIERS;
    }
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SupplierOrderGroup | null>(null);
  const [isItemsListExpanded, setIsItemsListExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Novo Pedido',
    whatsapp: '',
    items: [] as SupplierOrderItem[]
  });

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [cardCategoryFilter, setCardCategoryFilter] = useState<Record<string, string>>({});

  const [fieldSettings, setFieldSettings] = useState<SupplierFieldSettings>(() => {
    try {
      const raw = localStorage.getItem('msp_supplier_field_settings_v4');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.templates && parsed.templates.length > 0) return parsed;
      }
    } catch {}
    return {
      templates: [
        {
          id: 'cat_tela',
          name: 'Tela',
          fields: { showMarca: true, showModelo: true, showEstrutura: true, showQualidade: true, showTecnologia: true, showCor: true },
          options: {
            marca: [{ id: '1', value: 'Apple' }, { id: '2', value: 'Samsung' }, { id: '3', value: 'Xiaomi' }, { id: '4', value: 'Motorola' }],
            qualidade: [{ id: '1', value: 'DIAMONDS' }, { id: '2', value: 'CHINA GOLD PRO' }, { id: '3', value: 'Original' }, { id: '4', value: 'Premium' }],
            tecnologia: [{ id: '1', value: 'INCELL' }, { id: '2', value: 'OLED' }, { id: '3', value: 'AMOLED' }, { id: '4', value: 'IPS' }],
            estrutura: [{ id: '1', value: 'Com Aro' }, { id: '2', value: 'Sem Aro' }],
            cor: [{ id: '1', value: 'Preto' }, { id: '2', value: 'Branco' }, { id: '3', value: 'Azul' }, { id: '4', value: 'Dourado' }, { id: '5', value: 'Grafite' }]
          }
        },
        {
          id: 'cat_bateria',
          name: 'Bateria',
          fields: { showMarca: true, showModelo: true, showEstrutura: false, showQualidade: true, showTecnologia: false, showCor: false },
          options: {
            marca: [{ id: '1', value: 'Apple' }, { id: '2', value: 'Samsung' }, { id: '3', value: 'Xiaomi' }, { id: '4', value: 'Motorola' }],
            qualidade: [{ id: '1', value: 'Original' }, { id: '2', value: 'Gold' }, { id: '3', value: 'Prime' }],
            tecnologia: [],
            estrutura: [],
            cor: []
          }
        },
        {
          id: 'cat_doc',
          name: 'DOC',
          fields: { showMarca: true, showModelo: true, showEstrutura: false, showQualidade: true, showTecnologia: false, showCor: true },
          options: {
            marca: [{ id: '1', value: 'Apple' }, { id: '2', value: 'Samsung' }, { id: '3', value: 'Motorola' }],
            qualidade: [{ id: '1', value: 'Original Carga Rápida' }, { id: '2', value: 'Prime' }],
            tecnologia: [],
            estrutura: [],
            cor: [{ id: '1', value: 'Preto' }]
          }
        },
        {
          id: 'cat_outros',
          name: 'Outros',
          fields: { showMarca: true, showModelo: true, showEstrutura: true, showQualidade: true, showTecnologia: true, showCor: true },
          options: {
            marca: [{ id: '1', value: 'Geral' }],
            qualidade: [{ id: '1', value: 'Padrão' }],
            tecnologia: [],
            estrutura: [],
            cor: []
          }
        }
      ],
      activeTemplateId: 'cat_tela'
    };
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedSettingTemplateId, setSelectedSettingTemplateId] = useState<string>('cat_tela');
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [newOptionInput, setNewOptionInput] = useState<{ field: 'qualidade' | 'tecnologia' | 'estrutura' | 'cor' | 'marca'; value: string }>({ field: 'qualidade', value: '' });

  const [activeSubTab, setActiveSubTab] = useState<'PEDIDOS' | 'FORNECEDOR' | 'HISTORICO' | 'DEBITOS'>('PEDIDOS');

  const [currentItem, setCurrentItem] = useState<Partial<SupplierOrderItem>>({
    title: '', typeName: 'Tela', marca: '', modelo: '', estrutura: '', qualidade: '', tecnologia: '', cor: '', quantity: 1, price: 0
  });

  // State for item selection in Orders tab
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // WhatsApp sending modal
  const [sendModal, setSendModal] = useState<{
    isOpen: boolean;
    group: SupplierOrderGroup | null;
    itemsToSend: SupplierOrderItem[];
    selectedItemIds: string[];
  }>({
    isOpen: false,
    group: null,
    itemsToSend: [],
    selectedItemIds: []
  });

  // Modal to send items to Aba 2 (Fornecedor)
  const [supplierSendModal, setSupplierSendModal] = useState<{
    isOpen: boolean;
    itemsWithGroups: { item: SupplierOrderItem; groupTitle: string; groupCreatedAt?: string }[];
    supplierName: string;
    paymentStatus: 'Pendente' | 'Pago';
    isInlineNewSupplier: boolean;
    newSupplierPhone: string;
    useOriginalDate: boolean;
    customDate: string;
  }>({
    isOpen: false,
    itemsWithGroups: [],
    supplierName: '',
    paymentStatus: 'Pendente',
    isInlineNewSupplier: false,
    newSupplierPhone: '',
    useOriginalDate: true,
    customDate: new Date().toISOString().split('T')[0]
  });

  const getUserAccountEmail = (): string => {
    return getTenantId();
  };

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Rolling 12-month purge for history
  const purgeOldHistory = (list: SupplierPurchaseItem[], email: string): SupplierPurchaseItem[] => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const cutoffTime = twelveMonthsAgo.getTime();

    const toKeep: SupplierPurchaseItem[] = [];
    const toDeleteIds: string[] = [];

    list.forEach(item => {
      if (item.paymentStatus === 'Pago') {
        const itemDate = item.paidAt ? new Date(item.paidAt).getTime() : new Date(item.createdAt).getTime();
        if (!isNaN(itemDate) && itemDate < cutoffTime) {
          toDeleteIds.push(item.purchaseId);
          return;
        }
      }
      toKeep.push(item);
    });

    if (toDeleteIds.length > 0) {
      toDeleteIds.forEach(async (id) => {
        try {
          await deleteDoc(doc(db, `accounts/${email}/supplier_purchases`, id));
        } catch (e) {
          console.warn('Silent auto-clean history error:', e);
        }
      });
      try {
        localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(toKeep));
      } catch {}
    }
    return toKeep;
  };

  // Data Sync with Firestore and LocalStorage
  useEffect(() => {
    const userEmail = getUserAccountEmail();
    let isSubscribed = true;

    // 1. Settings listener
    const settingsRef = doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (!isSubscribed) return;
      if (docSnap.exists()) {
        setFieldSettings(docSnap.data() as SupplierFieldSettings);
      }
    }, (err) => {
      console.warn('Settings snapshot notice:', err.message);
    });

    // 2. Purchases listener (Aba 2, 3, 4)
    const purchasesRef = collection(db, `accounts/${userEmail}/supplier_purchases`);
    const unsubPurchases = onSnapshot(purchasesRef, (snapshot) => {
      if (!isSubscribed) return;
      const fetched: SupplierPurchaseItem[] = [];
      snapshot.forEach(d => {
        fetched.push({ purchaseId: d.id, ...d.data() } as SupplierPurchaseItem);
      });

      fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const cleaned = purgeOldHistory(fetched, userEmail);

      setSupplierPurchases(cleaned);
      try {
        localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(cleaned));
      } catch {}
    }, (err) => {
      console.warn('Purchases sync notice (using local data):', err.message);
    });

    // 3. Groups listener (Aba 1)
    const colRef = collection(db, `accounts/${userEmail}/supplier_orders`);
    const unsubGroups = onSnapshot(colRef, (snapshot) => {
      if (!isSubscribed) return;
      const loaded: SupplierOrderGroup[] = [];
      snapshot.forEach(d => {
        loaded.push({ id: d.id, ...d.data() } as SupplierOrderGroup);
      });
      loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      setGroups(loaded);
      try {
        localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(loaded));
      } catch {}
      setLoading(false);
    }, (err) => {
      console.warn('Supplier orders sync notice (using local data):', err.message);
      setLoading(false);
    });

    // 4. Registered Suppliers listener (Aba 2)
    const suppliersRef = collection(db, `accounts/${userEmail}/suppliers`);
    const unsubSuppliers = onSnapshot(suppliersRef, (snapshot) => {
      if (!isSubscribed) return;
      if (!snapshot.empty) {
        const loaded: RegisteredSupplier[] = [];
        snapshot.forEach(d => {
          loaded.push({ id: d.id, ...d.data() } as RegisteredSupplier);
        });
        loaded.sort((a, b) => a.name.localeCompare(b.name));
        setSuppliers(loaded);
        try {
          localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(loaded));
        } catch {}
      }
    }, (err) => {
      console.warn('Suppliers sync notice:', err.message);
    });

    return () => {
      isSubscribed = false;
      unsubSettings();
      unsubPurchases();
      unsubGroups();
      unsubSuppliers();
    };
  }, []);

  // Save changes helper to update both state & storage
  const savePurchasesLocallyAndRemote = async (updatedList: SupplierPurchaseItem[], actionFn?: () => Promise<void>) => {
    setSupplierPurchases(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(updatedList));
    } catch {}
    if (actionFn) {
      try {
        await actionFn();
      } catch (err) {
        console.warn('Remote sync non-blocking error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // SUPPLIER CRUD HANDLERS
  // -------------------------------------------------------------
  const handleAddSupplier = async (newSup: Omit<RegisteredSupplier, 'id' | 'createdAt'>) => {
    const userEmail = getUserAccountEmail();
    const newId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const supplierObj: RegisteredSupplier = {
      ...newSup,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const updated = [...suppliers, supplierObj].sort((a, b) => a.name.localeCompare(b.name));
    setSuppliers(updated);
    try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(updated)); } catch {}

    try {
      await setDoc(doc(db, `accounts/${userEmail}/suppliers`, newId), supplierObj);
      showToast(`Fornecedor "${newSup.name}" cadastrado com sucesso!`, 'success');
    } catch (e) {
      showToast(`Fornecedor "${newSup.name}" salvo localmente!`, 'success');
    }
  };

  const handleUpdateSupplierInfo = async (sup: RegisteredSupplier) => {
    const userEmail = getUserAccountEmail();
    const updated = suppliers.map(s => s.id === sup.id ? sup : s).sort((a, b) => a.name.localeCompare(b.name));
    setSuppliers(updated);
    try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(updated)); } catch {}

    try {
      await updateDoc(doc(db, `accounts/${userEmail}/suppliers`, sup.id), {
        name: sup.name,
        phone: sup.phone || '',
        pixKey: sup.pixKey || '',
        obs: sup.obs || ''
      });
      showToast(`Fornecedor "${sup.name}" atualizado!`, 'success');
    } catch (e) {
      showToast(`Fornecedor atualizado localmente!`, 'success');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    const sup = suppliers.find(s => s.id === supplierId);
    setConfirmDialog({
      message: `Deseja realmente excluir o cadastro do fornecedor "${sup?.name || 'selecionado'}"?`,
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const filtered = suppliers.filter(s => s.id !== supplierId);
        setSuppliers(filtered);
        try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(filtered)); } catch {}

        try {
          await deleteDoc(doc(db, `accounts/${userEmail}/suppliers`, supplierId));
          showToast('Fornecedor removido do cadastro!', 'success');
        } catch (e) {
          showToast('Removido localmente.', 'success');
        }
      }
    });
  };

  // -------------------------------------------------------------
  // SEND TO SUPPLIER (ABA 2) LOGIC
  // -------------------------------------------------------------
  const handleOpenSendToSupplier = (itemsWithGroups: { item: SupplierOrderItem; groupTitle: string; groupCreatedAt?: string }[]) => {
    if (itemsWithGroups.length === 0) {
      showToast('Selecione pelo menos uma peça para enviar.', 'error');
      return;
    }
    const defaultSupplier = suppliers[0]?.name || itemsWithGroups[0]?.groupTitle || 'DIAMOND';
    const firstDate = itemsWithGroups[0]?.item.createdAt || itemsWithGroups[0]?.groupCreatedAt || new Date().toISOString();
    const dateFormatted = firstDate.split('T')[0];

    setSupplierSendModal({
      isOpen: true,
      itemsWithGroups,
      supplierName: defaultSupplier,
      paymentStatus: 'Pendente',
      isInlineNewSupplier: false,
      newSupplierPhone: '',
      useOriginalDate: true,
      customDate: dateFormatted
    });
  };

  const handleConfirmSendToSupplier = async () => {
    const userEmail = getUserAccountEmail();
    let targetSupplier = supplierSendModal.supplierName.trim();
    if (!targetSupplier) {
      targetSupplier = suppliers[0]?.name || 'Fornecedor Principal';
    }

    // Auto-register if new
    const exists = suppliers.some(s => s.name.trim().toLowerCase() === targetSupplier.toLowerCase());
    if (!exists) {
      handleAddSupplier({
        name: targetSupplier,
        phone: supplierSendModal.newSupplierPhone.trim() || '',
        pixKey: '',
        obs: 'Cadastrado ao apontar peça'
      });
    }

    const now = new Date().toISOString();
    const isPaidOnTheSpot = supplierSendModal.paymentStatus === 'Pago';

    const newPurchases: SupplierPurchaseItem[] = supplierSendModal.itemsWithGroups.map(({ item, groupCreatedAt }) => {
      let finalDate = now;
      if (supplierSendModal.useOriginalDate) {
        finalDate = item.createdAt || groupCreatedAt || now;
      } else if (supplierSendModal.customDate) {
        finalDate = new Date(`${supplierSendModal.customDate}T12:00:00`).toISOString();
      }

      return {
        ...item,
        purchaseId: `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        supplierName: targetSupplier,
        paymentStatus: supplierSendModal.paymentStatus,
        createdAt: finalDate,
        paidAt: isPaidOnTheSpot ? now : null,
      };
    });

    const merged = [...newPurchases, ...supplierPurchases];
    await savePurchasesLocallyAndRemote(merged, async () => {
      const purchasesRef = collection(db, `accounts/${userEmail}/supplier_purchases`);
      for (const p of newPurchases) {
        await setDoc(doc(purchasesRef, p.purchaseId), {
          title: p.title,
          typeName: p.typeName || 'Peça',
          marca: p.marca || '',
          modelo: p.modelo || '',
          estrutura: p.estrutura || '',
          qualidade: p.qualidade || '',
          cor: p.cor || '',
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
          supplierName: p.supplierName,
          paymentStatus: p.paymentStatus,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
          isReturned: false,
          returnedAt: null,
          returnReason: null
        });
      }
    });

    const count = newPurchases.length;
    if (isPaidOnTheSpot) {
      showToast(`${count} ${count === 1 ? 'peça movida' : 'peças movidas'} para o Card de "${targetSupplier}" como PAGA NA HORA (Histórico)!`, 'success');
    } else {
      showToast(`${count} ${count === 1 ? 'peça movida' : 'peças movidas'} para o Card de "${targetSupplier}" A PRAZO (Débito)!`, 'success');
    }

    // REMOVE TRANSFERRED ITEMS FROM MEUS PEDIDOS (ABA 1) SO THEY LEAVE THE ORDER CARD
    const transferredItemIds = new Set(supplierSendModal.itemsWithGroups.map(({ item }) => item.id));
    const updatedGroups = groups.map(g => {
      const remainingItems = (g.items || []).filter(item => !transferredItemIds.has(item.id));
      return {
        ...g,
        items: remainingItems
      };
    });

    setGroups(updatedGroups);
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedGroups));
    } catch {}

    // Update in Firestore asynchronously for groups whose items changed
    for (const g of updatedGroups) {
      const orig = groups.find(og => og.id === g.id);
      if (orig && orig.items.length !== g.items.length) {
        try {
          const docRef = doc(db, `accounts/${userEmail}/supplier_orders`, g.id);
          await updateDoc(docRef, { items: g.items });
        } catch (e) {
          console.warn('Sync order group removal error:', e);
        }
      }
    }
    
    // Clear selection & close modal
    setSelectedItems({});
    setSupplierSendModal({
      isOpen: false,
      itemsWithGroups: [],
      supplierName: '',
      paymentStatus: 'Pendente',
      isInlineNewSupplier: false,
      newSupplierPhone: '',
      useOriginalDate: true,
      customDate: new Date().toISOString().split('T')[0]
    });
  };

  // -------------------------------------------------------------
  // ABA 2, 3, 4 ACTIONS
  // -------------------------------------------------------------
  const handleToggleReturnPurchase = async (purchaseId: string, isReturned: boolean, returnReason?: string) => {
    const userEmail = getUserAccountEmail();
    const now = new Date().toISOString();
    const updated = supplierPurchases.map(item => {
      if (item.purchaseId === purchaseId) {
        return {
          ...item,
          isReturned,
          returnedAt: isReturned ? now : null,
          returnReason: returnReason !== undefined ? returnReason : (item.returnReason || '')
        };
      }
      return item;
    });

    await savePurchasesLocallyAndRemote(updated, async () => {
      const docRef = doc(db, `accounts/${userEmail}/supplier_purchases`, purchaseId);
      await updateDoc(docRef, {
        isReturned,
        returnedAt: isReturned ? now : null,
        returnReason: returnReason !== undefined ? returnReason : ''
      });
    });

    if (isReturned) {
      showToast('Peça marcada como DEVOLVIDA! O valor foi retirado da contabilidade e não será cobrado.', 'success');
    } else {
      showToast('Devolução cancelada. Peça voltou a ser contabilizada normalmente.', 'success');
    }
  };
  const handleUpdatePaymentStatus = async (purchaseId: string, status: 'Pago' | 'Pendente') => {
    const userEmail = getUserAccountEmail();
    const paidAtTime = status === 'Pago' ? new Date().toISOString() : null;

    const updated = supplierPurchases.map(item => {
      if (item.purchaseId === purchaseId) {
        return {
          ...item,
          paymentStatus: status,
          paidAt: paidAtTime
        };
      }
      return item;
    });

    const cleaned = purgeOldHistory(updated, userEmail);

    await savePurchasesLocallyAndRemote(cleaned, async () => {
      const docRef = doc(db, `accounts/${userEmail}/supplier_purchases`, purchaseId);
      await updateDoc(docRef, { 
        paymentStatus: status,
        paidAt: paidAtTime
      });
    });

    if (status === 'Pago') {
      showToast('Peça marcada como PAGA! Movida para o Histórico (12 meses).', 'success');
    } else {
      showToast('Peça revertida para PENDENTE (Retornou aos Débitos).', 'success');
    }
  };

  const handleUpdatePurchaseSupplier = async (purchaseId: string, newSupplierName: string) => {
    const userEmail = getUserAccountEmail();
    const updated = supplierPurchases.map(item => {
      if (item.purchaseId === purchaseId) {
        return { ...item, supplierName: newSupplierName };
      }
      return item;
    });

    await savePurchasesLocallyAndRemote(updated, async () => {
      const docRef = doc(db, `accounts/${userEmail}/supplier_purchases`, purchaseId);
      await updateDoc(docRef, { supplierName: newSupplierName });
    });

    showToast(`Fornecedor alterado para "${newSupplierName}"!`, 'success');
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setConfirmDialog({
      message: "Deseja realmente excluir esta peça da lista de compras?",
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const filtered = supplierPurchases.filter(p => p.purchaseId !== purchaseId);
        await savePurchasesLocallyAndRemote(filtered, async () => {
          await deleteDoc(doc(db, `accounts/${userEmail}/supplier_purchases`, purchaseId));
        });
        showToast('Peça excluída com sucesso!', 'success');
      }
    });
  };

  const handleAddManualPurchase = async (newItem: Omit<SupplierPurchaseItem, 'purchaseId'>) => {
    const userEmail = getUserAccountEmail();
    const newId = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: SupplierPurchaseItem = {
      ...newItem,
      purchaseId: newId
    };

    const merged = [fullItem, ...supplierPurchases];
    await savePurchasesLocallyAndRemote(merged, async () => {
      const docRef = doc(db, `accounts/${userEmail}/supplier_purchases`, newId);
      await setDoc(docRef, newItem);
    });

    showToast('Nova peça apontada com sucesso para fornecedor!', 'success');
  };

  const handleBulkPayForSupplier = (supplierName: string) => {
    setConfirmDialog({
      message: `Deseja quitar todas as peças pendentes do fornecedor "${supplierName}"? Todas serão movidas para o Histórico.`,
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const now = new Date().toISOString();

        const updated = supplierPurchases.map(item => {
          if (item.supplierName === supplierName && item.paymentStatus === 'Pendente') {
            return {
              ...item,
              paymentStatus: 'Pago' as const,
              paidAt: now
            };
          }
          return item;
        });

        await savePurchasesLocallyAndRemote(updated, async () => {
          for (const item of updated) {
            if (item.supplierName === supplierName && item.paidAt === now) {
              const docRef = doc(db, `accounts/${userEmail}/supplier_purchases`, item.purchaseId);
              await updateDoc(docRef, { paymentStatus: 'Pago', paidAt: now });
            }
          }
        });

        showToast(`Todas as peças de "${supplierName}" foram quitadas!`, 'success');
      }
    });
  };

  // -------------------------------------------------------------
  // MEUS PEDIDOS (ABA 1) CRUD
  // -------------------------------------------------------------
  const handleOpenModal = (group?: SupplierOrderGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        title: group.title || 'Pedido',
        whatsapp: group.whatsapp || '',
        items: group.items || []
      });
    } else {
      setEditingGroup(null);
      setFormData({
        title: `Pedido ${groups.length + 1}`,
        whatsapp: '',
        items: []
      });
    }
    setCurrentItem({ title: '', marca: '', modelo: '', estrutura: '', qualidade: '', cor: '', quantity: 1, price: 0 });
    setIsItemsListExpanded(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setIsItemsListExpanded(false);
  };

  const handleAddItemToForm = () => {
    if (!currentItem.title?.trim()) {
      showToast('Preencha a descrição do item.', 'error');
      return;
    }
    const currentCategory = currentItem.typeName || 'Tela';
    
    const newItem: SupplierOrderItem = {
      id: Date.now().toString(),
      title: currentItem.title.trim(),
      typeName: currentCategory,
      marca: currentItem.marca || '',
      modelo: currentItem.modelo || '',
      estrutura: currentItem.estrutura || '',
      qualidade: currentItem.qualidade || '',
      tecnologia: currentItem.tecnologia || '',
      cor: currentItem.cor || '',
      quantity: Number(currentItem.quantity) || 1,
      price: Number(currentItem.price) || 0,
      createdAt: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({ title: '', typeName: currentCategory, marca: '', modelo: '', estrutura: '', qualidade: '', tecnologia: '', cor: '', quantity: 1, price: 0 });
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId)
    }));
  };

  const handleSaveGroup = async () => {
    if (isSavingRef.current) return;
    if (!formData.title?.trim()) return showToast("Título é obrigatório.", "error");

    isSavingRef.current = true;
    setIsSaving(true);
    const userEmail = getUserAccountEmail();

    try {
      if (editingGroup) {
        const updatedList = groups.map(g => {
          if (g.id === editingGroup.id) {
            return {
              ...g,
              title: formData.title.trim(),
              whatsapp: formData.whatsapp.trim(),
              items: formData.items
            };
          }
          return g;
        });
        setGroups(updatedList);
        try { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedList)); } catch {}

        const docRef = doc(db, `accounts/${userEmail}/supplier_orders`, editingGroup.id);
        await updateDoc(docRef, {
          title: formData.title.trim(),
          whatsapp: formData.whatsapp.trim(),
          items: formData.items
        });
        showToast("Pedido atualizado com sucesso!", "success");
      } else {
        const newId = Date.now().toString();
        const newGroup: SupplierOrderGroup = {
          id: newId,
          title: formData.title.trim(),
          whatsapp: formData.whatsapp.trim(),
          items: formData.items,
          createdAt: new Date().toISOString(),
          status: 'Em aberto'
        };

        const updatedList = [newGroup, ...groups];
        setGroups(updatedList);
        try { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedList)); } catch {}

        const docRef = doc(db, `accounts/${userEmail}/supplier_orders`, newId);
        await setDoc(docRef, newGroup);
        showToast("Novo pedido criado!", "success");
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      showToast("Salvo localmente (erro na nuvem)", "error");
      handleCloseModal();
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setConfirmDialog({
      message: "Deseja realmente excluir este pedido e todas as suas peças?",
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const updated = groups.filter(g => g.id !== groupId);
        setGroups(updated);
        try { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updated)); } catch {}

        try {
          await deleteDoc(doc(db, `accounts/${userEmail}/supplier_orders`, groupId));
          showToast("Pedido excluído!", "success");
        } catch (e) {
          showToast("Excluído localmente.", "success");
        }
      }
    });
  };

  const handleBulkDeleteSelectedItems = async () => {
    const userEmail = getUserAccountEmail();
    const updated = groups.map(g => ({
      ...g,
      items: (g.items || []).filter(i => !selectedItems[i.id])
    }));

    setGroups(updated);
    try { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updated)); } catch {}

    for (const g of updated) {
      try {
        const docRef = doc(db, `accounts/${userEmail}/supplier_orders`, g.id);
        await updateDoc(docRef, { items: g.items });
      } catch (_) {}
    }

    setSelectedItems({});
    showToast("Peças selecionadas foram excluídas!", "success");
  };

  // -------------------------------------------------------------
  // WHATSAPP SAFE SENDING (PREVENTS BLACK SCREEN)
  // -------------------------------------------------------------
  const formatMessage = (items: SupplierOrderItem[], withPrice: boolean): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    
    let text = `📦 Verifica pra mim por favor se vc tem as peças abaixo:\n`;
    text += `📅 Data: ${dateStr}\n`;
    text += `-----------------------------------\n\n`;

    const groupMap: Record<string, SupplierOrderItem[]> = {};
    items.forEach(item => {
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
        text += `${globalIndex}. 📱 ${typePrefix}${item.title}\n`;
        
        if (item.marca) text += `🏷️ ${item.marca} \n`;
        if (item.modelo) text += `📱 ${item.modelo}\n`;
        if (item.estrutura) text += `⭕ ${item.estrutura}\n`;
        if (item.qualidade) text += `⚡ ${item.qualidade}\n`;
        if (item.cor) text += `🎨 Cor: ${item.cor}\n`;
        
        if (withPrice && (Number(item.price) || 0) > 0) {
          text += `💵 R$ ${(Number(item.price) || 0).toFixed(2).replace('.', ',')}\n`;
          total += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        }
        totalPieces += (Number(item.quantity) || 1);
        text += `\n`;
        globalIndex++;
      });
      text += `-----------------------------------\n`;
    });

    if (withPrice && total > 0) {
      text += `💰 *TOTAL ESTIMADO: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
      text += `-----------------------------------\n`;
    }
    
    text += `🔢 *Total:* ${items.length} modelos (${totalPieces} peças no total)\n`;
    text += `Se tiver todas confirma pra mim, e as que não tiver descreve abaixo.\n`;
    text += `Por favor, confirma se está certo o valor e as peças.`;
    
    return encodeURIComponent(text);
  };

  const openWhatsAppSafely = (phone: string, items: SupplierOrderItem[], withPrice: boolean) => {
    const textEncoded = formatMessage(items, withPrice);
    const decodedText = decodeURIComponent(textEncoded);

    // 1. Always copy text to clipboard as bulletproof fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decodedText);
      }
    } catch (_) {}

    const cleanPhone = (phone || '').replace(/\D/g, '');
    let url = `https://api.whatsapp.com/send?text=${textEncoded}`;
    if (cleanPhone) {
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${textEncoded}`;
    }

    // 2. Open via transient anchor link to avoid iframe freeze or black screen
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      showToast('Texto copiado para a área de transferência e WhatsApp aberto!', 'success');
    } catch (e) {
      window.open(url, '_blank');
      showToast('Texto copiado com sucesso!', 'success');
    }
  };

  // -------------------------------------------------------------
  // FILTERED GROUPS & COUNTERS
  // -------------------------------------------------------------
  const filteredGroups = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return groups.filter(g => 
      (g.title || '').toLowerCase().includes(q) ||
      (g.items || []).some(i => (i.title || '').toLowerCase().includes(q) || (i.modelo || '').toLowerCase().includes(q))
    );
  }, [groups, searchTerm]);

  const totalPiecesCount = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.items?.reduce((iAcc, i) => iAcc + (Number(i.quantity) || 1), 0) || 0), 0);
  }, [groups]);

  const totalOrdersAmount = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.items?.reduce((iAcc, i) => iAcc + ((Number(i.quantity) || 1) * (Number(i.price) || 0)), 0) || 0), 0);
  }, [groups]);

  const selectedCount = useMemo(() => {
    return Object.keys(selectedItems).filter(k => selectedItems[k]).length;
  }, [selectedItems]);

  const allSelected = useMemo(() => {
    const allIds = groups.flatMap(g => (g.items || []).map(i => i.id));
    return allIds.length > 0 && allIds.every(id => selectedItems[id]);
  }, [groups, selectedItems]);

  return (
    <div className="h-screen flex flex-col space-y-4 p-4 font-sans text-slate-300 overflow-hidden bg-[#0B1221]">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[999] px-4 py-3 rounded-xl font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-[#00B86B] text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-white mb-2">Confirmação</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mandar Peças para o Card do Fornecedor */}
      {supplierSendModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Mover Peça(s) p/ Card do Fornecedor</h3>
                  <p className="text-[11px] text-slate-400">
                    {supplierSendModal.itemsWithGroups.length} {supplierSendModal.itemsWithGroups.length === 1 ? 'peça selecionada' : 'peças selecionadas'} para apontamento
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSupplierSendModal({
                  isOpen: false,
                  itemsWithGroups: [],
                  supplierName: '',
                  paymentStatus: 'Pendente',
                  isInlineNewSupplier: false,
                  newSupplierPhone: ''
                })}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* 1. SELEÇÃO DO FORNECEDOR CADASTRADO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    1. Card do Fornecedor Onde Vou Comprar *
                  </label>
                  <button
                    type="button"
                    onClick={() => setSupplierSendModal(prev => ({
                      ...prev,
                      isInlineNewSupplier: !prev.isInlineNewSupplier
                    }))}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1"
                  >
                    {supplierSendModal.isInlineNewSupplier ? '✕ Escolher da lista' : '+ Cadastrar Novo'}
                  </button>
                </div>

                {!supplierSendModal.isInlineNewSupplier ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {suppliers.map(sup => {
                        const isSelected = supplierSendModal.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase();
                        return (
                          <button
                            key={sup.id}
                            type="button"
                            onClick={() => setSupplierSendModal(prev => ({ ...prev, supplierName: sup.name }))}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-500/10'
                                : 'bg-[#0B1221] border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-black text-white truncate">{sup.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                            {sup.phone ? (
                              <span className="text-[10px] text-emerald-400 mt-1 truncate block">
                                {sup.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 mt-1 block">Cadastrado</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <input 
                        type="text"
                        value={supplierSendModal.supplierName}
                        onChange={(e) => setSupplierSendModal(prev => ({ ...prev, supplierName: e.target.value }))}
                        placeholder="Ou digite o nome de outro fornecedor..."
                        className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B1221] p-3 rounded-xl border border-purple-500/30 space-y-2.5 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Nome do Novo Fornecedor *
                      </label>
                      <input 
                        type="text"
                        required
                        value={supplierSendModal.supplierName}
                        onChange={(e) => setSupplierSendModal(prev => ({ ...prev, supplierName: e.target.value }))}
                        placeholder="Ex: Fornecedor Diamond, Mechanic, Brasil Peças..."
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        WhatsApp / Telefone (Opcional)
                      </label>
                      <input 
                        type="text"
                        value={supplierSendModal.newSupplierPhone}
                        onChange={(e) => setSupplierSendModal(prev => ({ ...prev, newSupplierPhone: e.target.value }))}
                        placeholder="Ex: (11) 99999-8888"
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CONDIÇÃO DE PAGAMENTO (PAGAR NA HORA VS A PRAZO) */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  2. Condição de Pagamento (Como você vai acertar?) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Opção 1: Pagar na Hora (Histórico) */}
                  <button
                    type="button"
                    onClick={() => setSupplierSendModal(prev => ({ ...prev, paymentStatus: 'Pago' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      supplierSendModal.paymentStatus === 'Pago'
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 bg-[#0B1221] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> ⚡ PAGAR NA HORA
                      </span>
                      {supplierSendModal.paymentStatus === 'Pago' && (
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          SELECIONADO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      A peça vai para o Card do Fornecedor já marcada como <strong className="text-emerald-400">PAGA</strong> e entra no <strong className="text-white">Histórico de 12 Meses (Aba 3)</strong>.
                    </p>
                  </button>

                  {/* Opção 2: A Prazo (Débito) */}
                  <button
                    type="button"
                    onClick={() => setSupplierSendModal(prev => ({ ...prev, paymentStatus: 'Pendente' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      supplierSendModal.paymentStatus === 'Pendente'
                        ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-[#0B1221] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> 💳 A PRAZO (EM DÉBITO)
                      </span>
                      {supplierSendModal.paymentStatus === 'Pendente' && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          SELECIONADO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      A peça vai para o Card do Fornecedor como <strong className="text-amber-400">A PRAZO</strong> e entra na aba <strong className="text-white">Débito com Fornecedor (Aba 4)</strong>.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. DATA DE ENTRADA NO FORNECEDOR (DIVIDIDO POR DATA NO CARD) */}
              <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    3. Data de Entrada no Card do Fornecedor *
                  </label>
                  <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={supplierSendModal.useOriginalDate}
                      onChange={e => setSupplierSendModal(prev => ({ ...prev, useOriginalDate: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 cursor-pointer"
                    />
                    <span>Manter data de cada peça</span>
                  </label>
                </div>

                {!supplierSendModal.useOriginalDate ? (
                  <div className="pt-1">
                    <input 
                      type="date"
                      value={supplierSendModal.customDate}
                      onChange={e => setSupplierSendModal(prev => ({ ...prev, customDate: e.target.value }))}
                      className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Todas as peças enviadas entrarão agrupadas sob esta data na cortina do fornecedor.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-indigo-400 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    ✓ Cada peça vai com a sua respectiva data de criação, caindo nas cortinas certas por data dentro do card!
                  </p>
                )}
              </div>

              {/* 4. RESUMO DOS ITENS */}
              <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                  <span>Itens que serão movidos:</span>
                  <span className="text-white font-black">
                    Total: R$ {supplierSendModal.itemsWithGroups.reduce((acc, { item }) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                  {supplierSendModal.itemsWithGroups.map(({ item, groupCreatedAt }, idx) => {
                    const pieceDate = item.createdAt || groupCreatedAt;
                    const dateDisplay = pieceDate ? new Date(pieceDate).toLocaleDateString('pt-BR') : 'Hoje';
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/40 text-slate-300">
                        <div className="truncate pr-2">
                          <span className="font-medium truncate block">{item.title}</span>
                          <span className="text-[10px] text-slate-500">Data: {dateDisplay}</span>
                        </div>
                        <span className="text-indigo-300 font-bold shrink-0">
                          {item.quantity}x • R$ {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AÇÕES DO MODAL */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSupplierSendModal({
                    isOpen: false,
                    itemsWithGroups: [],
                    supplierName: '',
                    paymentStatus: 'Pendente',
                    isInlineNewSupplier: false,
                    newSupplierPhone: ''
                  })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendToSupplier}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Check className="w-4 h-4" /> Confirmar e Mover ({supplierSendModal.itemsWithGroups.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Safe Modal */}
      {sendModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Enviar Itens pelo WhatsApp
              </h3>
              <button 
                onClick={() => setSendModal({ isOpen: false, group: null, itemsToSend: [], selectedItemIds: [] })}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Selecione as peças que deseja incluir na mensagem. O texto também é copiado automaticamente.
            </p>

            {/* List of selectable items */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 mb-4 bg-[#0B1221] p-3 rounded-xl border border-slate-800">
              {sendModal.itemsToSend.map((item) => (
                <label 
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                    sendModal.selectedItemIds.includes(item.id) 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={sendModal.selectedItemIds.includes(item.id)}
                    onChange={() => {
                      const newSelected = sendModal.selectedItemIds.includes(item.id)
                        ? sendModal.selectedItemIds.filter(id => id !== item.id)
                        : [...sendModal.selectedItemIds, item.id];
                      setSendModal({ ...sendModal, selectedItemIds: newSelected });
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-bold truncate">
                      {item.typeName && <span className="text-indigo-400 mr-1">{item.typeName}</span>}
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.marca} {item.modelo} - x{item.quantity} (R$ {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(0)})
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const filtered = sendModal.itemsToSend.filter(i => sendModal.selectedItemIds.includes(i.id));
                  if (filtered.length === 0) return showToast('Selecione pelo menos um item.', 'error');
                  openWhatsAppSafely(sendModal.group?.whatsapp || '', filtered, true);
                  setSendModal({ isOpen: false, group: null, itemsToSend: [], selectedItemIds: [] });
                }}
                disabled={sendModal.selectedItemIds.length === 0}
                className="w-full px-4 py-2.5 bg-[#00B86B] hover:bg-[#00a35e] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" /> Enviar com Preço ({sendModal.selectedItemIds.length})
              </button>

              <button
                onClick={() => {
                  const filtered = sendModal.itemsToSend.filter(i => sendModal.selectedItemIds.includes(i.id));
                  if (filtered.length === 0) return showToast('Selecione pelo menos um item.', 'error');
                  openWhatsAppSafely(sendModal.group?.whatsapp || '', filtered, false);
                  setSendModal({ isOpen: false, group: null, itemsToSend: [], selectedItemIds: [] });
                }}
                disabled={sendModal.selectedItemIds.length === 0}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Enviar sem Preço ({sendModal.selectedItemIds.length})
              </button>

              <button
                onClick={() => {
                  const filtered = sendModal.itemsToSend.filter(i => sendModal.selectedItemIds.includes(i.id));
                  if (filtered.length === 0) return showToast('Selecione pelo menos um item.', 'error');
                  const msg = decodeURIComponent(formatMessage(filtered, true));
                  navigator.clipboard.writeText(msg);
                  showToast('Texto copiado com sucesso!', 'success');
                }}
                className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Apenas Copiar Texto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Fornecedor & Pedidos</h1>
              <CloudEngineBadge />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aponte peças, envie para fornecedores, acompanhe débitos e histórico de 12 meses.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap w-full xl:w-auto justify-end">
          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2 px-3.5 flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg"><Box className="w-4 h-4"/></div>
            <div>
              <div className="text-sm font-black text-white">{groups.length}</div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Pedidos</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2 px-3.5 flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg"><Truck className="w-4 h-4"/></div>
            <div>
              <div className="text-sm font-black text-amber-400">{supplierPurchases.filter(p => p.paymentStatus === 'Pendente').length}</div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Peças em Débito</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2 px-3.5 flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><Clock className="w-4 h-4"/></div>
            <div>
              <div className="text-sm font-black text-emerald-400">{supplierPurchases.filter(p => p.paymentStatus === 'Pago').length}</div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Pagas (12m)</div>
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
            title="Configurar Categorias e Campos (Tela, Bateria, DOC, Outros, Qualidades, Tecnologias, Cores)"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Configurações</span>
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>
      
      {/* Subtabs Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#161B2B] p-2.5 rounded-xl border border-slate-800 shrink-0">
        <div className="flex gap-1.5 flex-wrap">
          <button 
            onClick={() => setActiveSubTab('PEDIDOS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'PEDIDOS' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>1. Meus Pedidos ({groups.length})</span>
          </button>
          
          <button 
            onClick={() => setActiveSubTab('FORNECEDOR')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'FORNECEDOR' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>2. Fornecedor ({supplierPurchases.length})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('HISTORICO')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'HISTORICO' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Histórico 12 Meses ({supplierPurchases.filter(p => p.paymentStatus === 'Pago').length})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('DEBITOS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'DEBITOS' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>4. Débito com Fornecedor ({supplierPurchases.filter(p => p.paymentStatus === 'Pendente').length})</span>
          </button>
        </div>

        {activeSubTab === 'PEDIDOS' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar pedido ou peça..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1221] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="flex justify-center p-12 shrink-0">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : activeSubTab === 'PEDIDOS' ? (
        filteredGroups.length === 0 ? (
          <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl shrink-0 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Nenhum pedido encontrado</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-xs mb-4">
              Crie seu primeiro pedido clicando no botão "Novo Pedido" para cadastrar peças e enviá-las para os fornecedores.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Pedido
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredGroups.map(group => {
                const groupItems = group.items || [];
                const groupTotal = groupItems.reduce((acc, i) => acc + ((Number(i.quantity) || 1) * (Number(i.price) || 0)), 0);
                const isExpanded = !!expandedCards[group.id]; // curtain closed by default
                const activeCategoryFilter = cardCategoryFilter[group.id] || 'TODAS';

                // Filter items by category inside card
                const displayedItems = groupItems.filter(item => {
                  if (activeCategoryFilter === 'TODAS') return true;
                  return (item.typeName || '').toLowerCase() === activeCategoryFilter.toLowerCase();
                });

                // Extract available categories in this group
                const categoriesInGroup = Array.from(new Set(groupItems.map(i => i.typeName || 'Outros')));

                return (
                  <div key={group.id} className="bg-[#161B2B] rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all">
                    <div>
                      {/* Card Header & Curtain Toggle (Always visible when card is closed) */}
                      <div className="flex justify-between items-start mb-2">
                        <div 
                          className="cursor-pointer group flex-1 pr-2"
                          onClick={() => setExpandedCards(prev => ({ ...prev, [group.id]: !isExpanded }))}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white truncate max-w-[170px] group-hover:text-indigo-400 transition-colors" title={group.title}>
                              {group.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>{isExpanded ? 'Ocultar' : `Ver Peças (${groupItems.length})`}</span>
                            </span>
                          </div>
                          
                          {/* Outside Summary Row: Total Value & Total Pieces */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              {group.createdAt && !isNaN(new Date(group.createdAt).getTime())
                                ? new Date(group.createdAt).toLocaleDateString()
                                : 'Recente'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                              R$ {groupTotal.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                              {groupItems.length} peça{groupItems.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="relative flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === group.id ? null : group.id);
                            }}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openDropdownId === group.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-[#0B1221] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handleOpenModal(group);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handleDeleteGroup(group.id);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Curtain Accordion Content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            {/* Category Filter Pills inside Curtain */}
                            {categoriesInGroup.length > 0 && (
                              <div className="flex items-center gap-1 mb-2.5 overflow-x-auto custom-scrollbar pb-1">
                                <button
                                  onClick={() => setCardCategoryFilter(prev => ({ ...prev, [group.id]: 'TODAS' }))}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                    activeCategoryFilter === 'TODAS'
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Todas ({groupItems.length})
                                </button>
                                {fieldSettings.templates.map(tmpl => {
                                  const count = groupItems.filter(i => (i.typeName || '').toLowerCase() === tmpl.name.toLowerCase()).length;
                                  if (count === 0) return null;
                                  return (
                                    <button
                                      key={tmpl.id}
                                      onClick={() => setCardCategoryFilter(prev => ({ ...prev, [group.id]: tmpl.name }))}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                        activeCategoryFilter.toLowerCase() === tmpl.name.toLowerCase()
                                          ? 'bg-purple-600 text-white shadow-sm'
                                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      <span>{tmpl.name}</span>
                                      <span className="opacity-70 text-[9px]">({count})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Items List inside curtain */}
                            <div className="space-y-1.5 mb-3 overflow-y-auto max-h-[220px] custom-scrollbar bg-[#0B1221] p-2 rounded-xl border border-slate-800/80">
                              {displayedItems.length === 0 ? (
                                <div className="text-xs text-slate-500 text-center py-4 italic">Nenhuma peça nesta categoria.</div>
                              ) : (
                                displayedItems.map((item) => {
                                  const itemDate = item.createdAt ? new Date(item.createdAt) : (group.createdAt ? new Date(group.createdAt) : null);
                                  const itemDateLabel = itemDate && !isNaN(itemDate.getTime()) ? itemDate.toLocaleDateString('pt-BR') : '';

                                  return (
                                    <div key={item.id} className="flex flex-col gap-1 py-2 px-2 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors rounded-lg bg-[#121827]">
                                      <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <input 
                                            type="checkbox" 
                                            checked={!!selectedItems[item.id]} 
                                            onChange={() => setSelectedItems(prev => ({...prev, [item.id]: !prev[item.id]}))}
                                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <div className="truncate min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                {item.typeName || 'Peça'}
                                              </span>
                                              <span className="font-bold text-white text-xs truncate">
                                                {item.title}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                          <div className="text-right">
                                            <span className="text-[11px] font-black text-emerald-400 block">
                                              R$ {((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(0)}
                                            </span>
                                            <span className="text-[9px] text-slate-500 block">x{item.quantity}</span>
                                          </div>

                                          {/* Send single item button */}
                                          <button 
                                            onClick={() => handleOpenSendToSupplier([{ item, groupTitle: group.title, groupCreatedAt: group.createdAt }])}
                                            className="px-1.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                            title="Mandar esta peça para o Card do Fornecedor"
                                          >
                                            <Truck className="w-3 h-3 text-purple-400" />
                                            <span className="text-[9px] font-black hidden sm:inline">Mandar</span>
                                          </button>

                                          {/* WhatsApp single item */}
                                          <button 
                                            onClick={() => setSendModal({ isOpen: true, group, itemsToSend: [item], selectedItemIds: [item.id] })}
                                            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                                            title="Enviar pelo WhatsApp"
                                          >
                                            <Send className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Tags Detail Row (Marca, Modelo, Qualidade, Tecnologia, Estrutura, Cor) */}
                                      <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-slate-400 pl-5 pt-0.5">
                                        {item.marca && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Marca: {item.marca}</span>}
                                        {item.modelo && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold">Mod: {item.modelo}</span>}
                                        {item.qualidade && <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black">{item.qualidade}</span>}
                                        {item.tecnologia && <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-black">{item.tecnologia}</span>}
                                        {item.estrutura && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{item.estrutura}</span>}
                                        {item.cor && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Cor: {item.cor}</span>}
                                        {itemDateLabel && <span className="text-slate-500 ml-auto">📅 {itemDateLabel}</span>}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Send all/selected from this group to Aba 2 */}
                      {groupItems.length > 0 && (() => {
                        const selectedInThisGroup = groupItems.filter(i => !!selectedItems[i.id]);
                        return (
                          <div className="space-y-1.5 mb-3">
                            {selectedInThisGroup.length > 0 && (
                              <button 
                                onClick={() => handleOpenSendToSupplier(selectedInThisGroup.map(i => ({ item: i, groupTitle: group.title, groupCreatedAt: group.createdAt })))}
                                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                              >
                                <Truck className="w-3.5 h-3.5" /> Mover Selecionadas deste Pedido ({selectedInThisGroup.length})
                              </button>
                            )}

                            <button 
                              onClick={() => handleOpenSendToSupplier(groupItems.map(i => ({ item: i, groupTitle: group.title, groupCreatedAt: group.createdAt })))}
                              className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" /> Mover TODAS deste Pedido p/ Card Fornecedor ({groupItems.length})
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card Footer & Total */}
                    <div>
                      <div className="flex justify-between items-center py-2 border-t border-slate-800/80 mb-3">
                        <span className="text-[11px] font-bold text-slate-400">Total do Pedido:</span>
                        <span className="text-sm font-black text-emerald-400">R$ {groupTotal.toFixed(2).replace('.', ',')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenModal(group)}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (groupItems.length === 0) return showToast('Nenhuma peça para enviar.', 'error');
                            setSendModal({ isOpen: true, group, itemsToSend: groupItems, selectedItemIds: groupItems.map(i => i.id) });
                          }}
                          disabled={groupItems.length === 0}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" /> WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* ABA 2, 3, 4: FORNECEDOR, HISTÓRICO, DÉBITOS */
        <SupplierPurchasesView 
          items={supplierPurchases} 
          subTab={activeSubTab as 'FORNECEDOR' | 'HISTORICO' | 'DEBITOS'}
          onUpdateStatus={handleUpdatePaymentStatus} 
          onUpdateSupplier={handleUpdatePurchaseSupplier}
          onDelete={handleDeletePurchase} 
          onAddPurchaseItem={handleAddManualPurchase}
          onBulkPayForSupplier={handleBulkPayForSupplier}
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          onUpdateSupplierInfo={handleUpdateSupplierInfo}
          onDeleteSupplier={handleDeleteSupplier}
          onToggleReturn={handleToggleReturnPurchase}
        />
      )}

      {/* Bottom Action Bar for ABA 1 (Meus Pedidos) */}
      {activeSubTab === 'PEDIDOS' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B1221] border-t border-slate-800 p-3 px-6 flex flex-wrap items-center justify-between gap-3 z-40 shadow-2xl">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    const map: Record<string, boolean> = {};
                    groups.forEach(g => g.items?.forEach(i => { map[i.id] = true; }));
                    setSelectedItems(map);
                  } else {
                    setSelectedItems({});
                  }
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 cursor-pointer"
              />
              <span>Selecionar Todas as Peças ({totalPiecesCount})</span>
            </label>
            {selectedCount > 0 && (
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => {
                const selectedList = groups.flatMap(g => 
                  (g.items || []).filter(i => selectedItems[i.id]).map(i => ({ item: i, groupTitle: g.title, groupCreatedAt: g.createdAt }))
                );
                if (selectedList.length === 0) return showToast('Selecione ao menos 1 peça na caixinha.', 'error');
                handleOpenSendToSupplier(selectedList);
              }}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Truck className="w-4 h-4" /> Mover Selecionados p/ Card do Fornecedor ({selectedCount})
            </button>

            <button 
              onClick={() => {
                const allList = groups.flatMap(g => 
                  (g.items || []).map(i => ({ item: i, groupTitle: g.title, groupCreatedAt: g.createdAt }))
                );
                if (allList.length === 0) return showToast('Nenhuma peça cadastrada para enviar.', 'error');
                handleOpenSendToSupplier(allList);
              }}
              disabled={totalPiecesCount === 0}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Truck className="w-4 h-4" /> Mover TODOS p/ Card do Fornecedor ({totalPiecesCount})
            </button>

            <button 
              onClick={() => {
                const marked = groups.flatMap(g => (g.items || []).filter(i => selectedItems[i.id]));
                if (marked.length === 0) return showToast('Selecione peças para enviar.', 'error');
                setSendModal({ isOpen: true, group: null, itemsToSend: marked, selectedItemIds: marked.map(i => i.id) });
              }}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" /> WhatsApp ({selectedCount})
            </button>

            {selectedCount > 0 && (
              <button 
                onClick={() => {
                  setConfirmDialog({
                    message: `Deseja realmente excluir as ${selectedCount} peças selecionadas dos pedidos?`,
                    onConfirm: () => handleBulkDeleteSelectedItems()
                  });
                }}
                className="px-3 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir ({selectedCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Order Group */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-3xl w-full max-w-2xl h-[92vh] shadow-2xl flex flex-col border border-slate-700/50 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">
                    {editingGroup ? 'Editar Pedido' : 'Criar Novo Pedido'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure os itens do pedido</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#161B2B] overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                
                {/* Order Details */}
                <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome / Fornecedor do Pedido *</label>
                      <input
                        type="text"
                        placeholder="Ex: Fornecedor Peças Centro"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: 11999999999"
                        value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Item Form with Curtain Category & Clickable Pills */}
                <div className="space-y-3.5 bg-[#0B1221] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Peça ao Pedido
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-[10px] font-bold text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-slate-800/60 px-2 py-1 rounded-md"
                    >
                      <Settings className="w-3 h-3 text-indigo-400" /> Configurar Campos
                    </button>
                  </div>

                  {/* Categoria Selector Curtain */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      1. Categoria da Peça
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap bg-[#161B2B] p-2 rounded-xl border border-slate-700/80">
                      {fieldSettings.templates.map(tmpl => {
                        const isSelected = (currentItem.typeName || 'Tela').toLowerCase() === tmpl.name.toLowerCase();
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => {
                              setCurrentItem(prev => ({ ...prev, typeName: tmpl.name }));
                              setFieldSettings(prev => ({ ...prev, activeTemplateId: tmpl.id }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <span>
                              {tmpl.name === 'Tela' ? '📱' : tmpl.name === 'Bateria' ? '🔋' : tmpl.name === 'DOC' ? '🔌' : '📦'}
                            </span>
                            <span>{tmpl.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Active Category Template Rules */}
                  {(() => {
                    const activeTmpl = fieldSettings.templates.find(
                      t => t.name.toLowerCase() === (currentItem.typeName || 'Tela').toLowerCase()
                    ) || fieldSettings.templates[0];

                    const fields = activeTmpl?.fields || { showMarca: true, showModelo: true, showEstrutura: true, showQualidade: true, showTecnologia: true, showCor: true };
                    const options = activeTmpl?.options || { marca: [], qualidade: [], tecnologia: [], estrutura: [], cor: [] };

                    return (
                      <div className="space-y-3 pt-1">
                        {/* Title Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Descrição / Nome da Peça *
                          </label>
                          <input
                            type="text"
                            placeholder={currentItem.typeName === 'Tela' ? 'Ex: Tela Display Frente Complete' : `Ex: ${currentItem.typeName || 'Peça'} Original`}
                            value={currentItem.title || ''}
                            onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                            className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                          />
                        </div>

                        {/* Standard Inputs: Marca & Modelo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {fields.showMarca && (
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Marca / Fabricante</label>
                              <input
                                type="text"
                                placeholder="Apple, Samsung, Xiaomi..."
                                value={currentItem.marca || ''}
                                onChange={e => setCurrentItem({ ...currentItem, marca: e.target.value })}
                                className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                              />
                              {/* Marca Clickable Pills */}
                              {options.marca && options.marca.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  {options.marca.map(m => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => setCurrentItem(prev => ({ ...prev, marca: m.value }))}
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                        currentItem.marca === m.value
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {m.value}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {fields.showModelo && (
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Modelo do Aparelho</label>
                              <input
                                type="text"
                                placeholder="iPhone 11, S20 FE, Redmi Note 10..."
                                value={currentItem.modelo || ''}
                                onChange={e => setCurrentItem({ ...currentItem, modelo: e.target.value })}
                                className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                              />
                            </div>
                          )}
                        </div>

                        {/* Qualidade Clickable Pills Row */}
                        {fields.showQualidade && (
                          <div className="bg-[#121827] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                            <label className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                              Qualidade (Selecione um botão ou digite)
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {options.qualidade?.map(q => (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => setCurrentItem(prev => ({ ...prev, qualidade: q.value }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    currentItem.qualidade === q.value
                                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {q.value}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Outra qualidade..."
                              value={currentItem.qualidade || ''}
                              onChange={e => setCurrentItem({ ...currentItem, qualidade: e.target.value })}
                              className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-amber-500 outline-none mt-1"
                            />
                          </div>
                        )}

                        {/* Tecnologia Clickable Pills Row */}
                        {fields.showTecnologia && (
                          <div className="bg-[#121827] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                            <label className="text-[9px] font-black text-cyan-400 uppercase tracking-wider block">
                              Tecnologia (INCELL, OLED, AMOLED...)
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {options.tecnologia?.map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setCurrentItem(prev => ({ ...prev, tecnologia: t.value }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    currentItem.tecnologia === t.value
                                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {t.value}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Outra tecnologia..."
                              value={currentItem.tecnologia || ''}
                              onChange={e => setCurrentItem({ ...currentItem, tecnologia: e.target.value })}
                              className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500 outline-none mt-1"
                            />
                          </div>
                        )}

                        {/* Estrutura & Cor Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {fields.showEstrutura && (
                            <div className="bg-[#121827] p-2.5 rounded-xl border border-slate-800 space-y-1">
                              <label className="text-[9px] font-black text-purple-400 uppercase tracking-wider block">Estrutura (Com Aro, Sem Aro...)</label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {options.estrutura?.map(eOpt => (
                                  <button
                                    key={eOpt.id}
                                    type="button"
                                    onClick={() => setCurrentItem(prev => ({ ...prev, estrutura: eOpt.value }))}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                      currentItem.estrutura === eOpt.value
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105 ring-2 ring-purple-400'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                  >
                                    {eOpt.value}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Digite outra estrutura..."
                                value={currentItem.estrutura || ''}
                                onChange={e => setCurrentItem({ ...currentItem, estrutura: e.target.value })}
                                className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-purple-500 outline-none mt-1"
                              />
                            </div>
                          )}

                          {fields.showCor && (
                            <div className="bg-[#121827] p-2.5 rounded-xl border border-slate-800 space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase block">Cor</label>
                              <div className="flex items-center gap-1 flex-wrap">
                                {options.cor?.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCurrentItem(prev => ({ ...prev, cor: c.value }))}
                                    className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                                      currentItem.cor === c.value
                                        ? 'bg-indigo-600 text-white font-black'
                                        : 'bg-slate-800 text-slate-300 hover:text-white'
                                    }`}
                                  >
                                    {c.value}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Preto, Branco, Azul..."
                                value={currentItem.cor || ''}
                                onChange={e => setCurrentItem({ ...currentItem, cor: e.target.value })}
                                className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:border-indigo-500 outline-none mt-1"
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity || 1}
                        onChange={e => setCurrentItem({...currentItem, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Preço Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentItem.price || 0}
                        onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Esta Peça à Lista
                  </button>
                </div>

                {/* Items added list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black text-white">Peças Adicionadas ({formData.items.length})</span>
                    <span className="text-xs font-bold text-emerald-400">
                      Total: R$ {formData.items.reduce((acc, i) => acc + ((Number(i.quantity) || 1) * (Number(i.price) || 0)), 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-[#0B1221] p-3 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                    {formData.items.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4 italic">Nenhuma peça no pedido ainda.</div>
                    ) : (
                      formData.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-[#161B2B] p-2 rounded-lg border border-slate-800 text-xs">
                          <div className="truncate pr-2">
                            <span className="font-bold text-white block">{item.title}</span>
                            <span className="text-[10px] text-slate-400 block">{item.marca} {item.modelo} {item.qualidade}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-emerald-400 font-bold">
                              {item.quantity}x R${(Number(item.price) || 0).toFixed(0)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromForm(item.id)}
                              className="p-1 text-slate-500 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-[#0B1221]">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  {isSaving ? (
                    <>Salvando...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Salvar Pedido</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settings / Configurações de Categorias e Campos */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col border border-slate-700/60 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">Configurações de Categorias & Campos</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Personalize a visibilidade de campos (Diamonds, China Gold Pro, Incell, OLED) e adicione novas categorias</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              
              {/* Category Selector & Adder */}
              <div className="space-y-3 bg-[#0B1221] p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Categorias de Peças
                  </h3>
                  <span className="text-[10px] text-slate-500">{fieldSettings.templates.length} categorias cadastradas</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {fieldSettings.templates.map(tmpl => {
                    const isSelected = selectedSettingTemplateId === tmpl.id;
                    return (
                      <div key={tmpl.id} className="relative group flex items-center">
                        <button
                          onClick={() => setSelectedSettingTemplateId(tmpl.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{tmpl.name}</span>
                        </button>
                        {!['cat_tela', 'cat_bateria', 'cat_doc', 'cat_outros'].includes(tmpl.id) && (
                          <button
                            onClick={() => {
                              const updated: SupplierFieldSettings = {
                                ...fieldSettings,
                                templates: fieldSettings.templates.filter(t => t.id !== tmpl.id)
                              };
                              setFieldSettings(updated);
                              setSelectedSettingTemplateId('cat_tela');
                              try {
                                const userEmail = getUserAccountEmail();
                                setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                              } catch(e){}
                            }}
                            className="ml-1 text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Remover esta categoria"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new Category input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <input
                    type="text"
                    placeholder="Nome da nova categoria (Ex: Vidro, Tampa, Placa, Flex)..."
                    value={newCategoryNameInput}
                    onChange={e => setNewCategoryNameInput(e.target.value)}
                    className="flex-1 bg-[#161B2B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!newCategoryNameInput.trim()) return;
                      const newId = `cat_${Date.now()}`;
                      const newTmpl: ItemTemplate = {
                        id: newId,
                        name: newCategoryNameInput.trim(),
                        fields: { showMarca: true, showModelo: true, showEstrutura: true, showQualidade: true, showTecnologia: true, showCor: true },
                        options: {
                          marca: [{ id: '1', value: 'Geral' }],
                          qualidade: [{ id: '1', value: 'Original' }, { id: '2', value: 'Premium' }],
                          tecnologia: [{ id: '1', value: 'INCELL' }, { id: '2', value: 'OLED' }],
                          estrutura: [{ id: '1', value: 'Com Aro' }, { id: '2', value: 'Sem Aro' }],
                          cor: [{ id: '1', value: 'Preto' }, { id: '2', value: 'Branco' }]
                        }
                      };
                      const updated: SupplierFieldSettings = {
                        ...fieldSettings,
                        templates: [...fieldSettings.templates, newTmpl]
                      };
                      setFieldSettings(updated);
                      setSelectedSettingTemplateId(newId);
                      setNewCategoryNameInput('');
                      try {
                        const userEmail = getUserAccountEmail();
                        setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                      } catch(e){}
                      showToast(`Categoria "${newTmpl.name}" criada na nuvem!`, 'success');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Categoria
                  </button>
                </div>
              </div>

              {/* Category Field Visibility Toggles & Options */}
              {(() => {
                const activeTmpl = fieldSettings.templates.find(t => t.id === selectedSettingTemplateId) || fieldSettings.templates[0];
                if (!activeTmpl) return null;

                const updateTmplName = (newName: string) => {
                  const updated: SupplierFieldSettings = {
                    ...fieldSettings,
                    templates: fieldSettings.templates.map(t => t.id === activeTmpl.id ? { ...t, name: newName } : t)
                  };
                  setFieldSettings(updated);
                  try {
                    const userEmail = getUserAccountEmail();
                    setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                  } catch(e){}
                };

                const updateTmplFields = (updater: (prevFields: typeof activeTmpl.fields) => typeof activeTmpl.fields) => {
                  const updated: SupplierFieldSettings = {
                    ...fieldSettings,
                    templates: fieldSettings.templates.map(t => t.id === activeTmpl.id ? { ...t, fields: updater(t.fields) } : t)
                  };
                  setFieldSettings(updated);
                  try {
                    const userEmail = getUserAccountEmail();
                    setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                  } catch(e){}
                };

                const updateTmplOptions = (field: 'qualidade' | 'tecnologia' | 'estrutura' | 'cor' | 'marca', updater: (prevOpts: FieldOption[]) => FieldOption[]) => {
                  const updated: SupplierFieldSettings = {
                    ...fieldSettings,
                    templates: fieldSettings.templates.map(t => t.id === activeTmpl.id ? {
                      ...t,
                      options: { ...t.options, [field]: updater(t.options[field] || []) }
                    } : t)
                  };
                  setFieldSettings(updated);
                  try {
                    const userEmail = getUserAccountEmail();
                    setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                  } catch(e){}
                };

                const editOptionValue = (field: 'qualidade' | 'tecnologia' | 'estrutura' | 'cor' | 'marca', optionId: string, newValue: string) => {
                  const updated: SupplierFieldSettings = {
                    ...fieldSettings,
                    templates: fieldSettings.templates.map(t => t.id === activeTmpl.id ? {
                      ...t,
                      options: {
                        ...t.options,
                        [field]: (t.options[field] || []).map(o => o.id === optionId ? { ...o, value: newValue } : o)
                      }
                    } : t)
                  };
                  setFieldSettings(updated);
                  try {
                    const userEmail = getUserAccountEmail();
                    setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), updated, { merge: true });
                  } catch(e){}
                };

                return (
                  <div className="space-y-5">
                    {/* Editable Category Name Banner */}
                    <div className="bg-[#0B1221] p-3.5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                            Nome da Categoria Selecionada
                          </label>
                          <span className="text-[10px] text-slate-400">Clique para renomear esta categoria</span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activeTmpl.name}
                        onChange={e => updateTmplName(e.target.value)}
                        className="w-full sm:w-64 bg-[#161B2B] border border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-black text-white focus:border-indigo-400 outline-none shadow-inner"
                        placeholder="Ex: Tela, Bateria, DOC, Placa..."
                      />
                    </div>

                    {/* Toggles Box */}
                    <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" /> Visibilidade de Campos para: <span className="text-white underline">{activeTmpl.name}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Marque quais campos devem aparecer no card e no formulário quando a categoria "{activeTmpl.name}" for selecionada:</p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showMarca}
                            onChange={e => updateTmplFields(f => ({ ...f, showMarca: e.target.checked }))}
                            className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white">Exibir Marca</span>
                        </label>

                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showModelo}
                            onChange={e => updateTmplFields(f => ({ ...f, showModelo: e.target.checked }))}
                            className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white">Exibir Modelo</span>
                        </label>

                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showQualidade}
                            onChange={e => updateTmplFields(f => ({ ...f, showQualidade: e.target.checked }))}
                            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-amber-300">Exibir Qualidade</span>
                        </label>

                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showTecnologia}
                            onChange={e => updateTmplFields(f => ({ ...f, showTecnologia: e.target.checked }))}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-cyan-300">Exibir Tecnologia</span>
                        </label>

                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showEstrutura}
                            onChange={e => updateTmplFields(f => ({ ...f, showEstrutura: e.target.checked }))}
                            className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-purple-300">Exibir Estrutura</span>
                        </label>

                        <label className="flex items-center gap-2 bg-[#161B2B] p-2.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeTmpl.fields.showCor}
                            onChange={e => updateTmplFields(f => ({ ...f, showCor: e.target.checked }))}
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-emerald-300">Exibir Cor</span>
                        </label>
                      </div>
                    </div>

                    {/* Button Options Management (Qualidade, Tecnologia, Estrutura, Cor, Marca) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Qualidades Options */}
                      <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <label className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                          Botões de Qualidade ({activeTmpl.options.qualidade?.length || 0})
                        </label>
                        <p className="text-[10px] text-slate-400">Edite o texto do botão diretamente na caixinha ou adicione novos:</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] bg-[#161B2B] p-2 rounded-xl border border-slate-800">
                          {activeTmpl.options.qualidade?.map(q => (
                            <div key={q.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-sm">
                              <input
                                type="text"
                                value={q.value}
                                onChange={e => editOptionValue('qualidade', q.id, e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-amber-300 focus:outline-none focus:bg-slate-900/80 rounded px-1 outline-none max-w-[130px]"
                                title="Clique para editar este nome de botão"
                              />
                              <button
                                onClick={() => updateTmplOptions('qualidade', opts => opts.filter(o => o.id !== q.id))}
                                className="text-amber-400 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                                title="Excluir este botão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nova qualidade (Ex: DIAMONDS, CHINA GOLD PRO)..."
                            value={newOptionInput.field === 'qualidade' ? newOptionInput.value : ''}
                            onChange={e => setNewOptionInput({ field: 'qualidade', value: e.target.value })}
                            className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-amber-500 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newOptionInput.field === 'qualidade' && newOptionInput.value.trim()) {
                                updateTmplOptions('qualidade', opts => [...opts, { id: Date.now().toString(), value: newOptionInput.value.trim() }]);
                                setNewOptionInput({ field: 'qualidade', value: '' });
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Tecnologia Options */}
                      <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <label className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                          Botões de Tecnologia ({activeTmpl.options.tecnologia?.length || 0})
                        </label>
                        <p className="text-[10px] text-slate-400">Edite o texto do botão diretamente na caixinha ou adicione novos:</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] bg-[#161B2B] p-2 rounded-xl border border-slate-800">
                          {activeTmpl.options.tecnologia?.map(t => (
                            <div key={t.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold shadow-sm">
                              <input
                                type="text"
                                value={t.value}
                                onChange={e => editOptionValue('tecnologia', t.id, e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-cyan-300 focus:outline-none focus:bg-slate-900/80 rounded px-1 outline-none max-w-[130px]"
                                title="Clique para editar este nome de botão"
                              />
                              <button
                                onClick={() => updateTmplOptions('tecnologia', opts => opts.filter(o => o.id !== t.id))}
                                className="text-cyan-400 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                                title="Excluir este botão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nova tecnologia (Ex: INCELL, OLED, AMOLED)..."
                            value={newOptionInput.field === 'tecnologia' ? newOptionInput.value : ''}
                            onChange={e => setNewOptionInput({ field: 'tecnologia', value: e.target.value })}
                            className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newOptionInput.field === 'tecnologia' && newOptionInput.value.trim()) {
                                updateTmplOptions('tecnologia', opts => [...opts, { id: Date.now().toString(), value: newOptionInput.value.trim() }]);
                                setNewOptionInput({ field: 'tecnologia', value: '' });
                              }
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Estrutura Options */}
                      <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <label className="text-xs font-black text-purple-400 uppercase tracking-widest block">
                          Botões de Estrutura ({activeTmpl.options.estrutura?.length || 0})
                        </label>
                        <p className="text-[10px] text-slate-400">Edite o texto do botão diretamente na caixinha ou adicione novos:</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] bg-[#161B2B] p-2 rounded-xl border border-slate-800">
                          {activeTmpl.options.estrutura?.map(eOpt => (
                            <div key={eOpt.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold shadow-sm">
                              <input
                                type="text"
                                value={eOpt.value}
                                onChange={e => editOptionValue('estrutura', eOpt.id, e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-purple-300 focus:outline-none focus:bg-slate-900/80 rounded px-1 outline-none max-w-[130px]"
                                title="Clique para editar este nome de botão"
                              />
                              <button
                                onClick={() => updateTmplOptions('estrutura', opts => opts.filter(o => o.id !== eOpt.id))}
                                className="text-purple-400 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                                title="Excluir este botão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nova estrutura (Ex: Com Aro, Sem Aro)..."
                            value={newOptionInput.field === 'estrutura' ? newOptionInput.value : ''}
                            onChange={e => setNewOptionInput({ field: 'estrutura', value: e.target.value })}
                            className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-purple-500 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newOptionInput.field === 'estrutura' && newOptionInput.value.trim()) {
                                updateTmplOptions('estrutura', opts => [...opts, { id: Date.now().toString(), value: newOptionInput.value.trim() }]);
                                setNewOptionInput({ field: 'estrutura', value: '' });
                              }
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Cores Options */}
                      <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <label className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
                          Botões de Cores ({activeTmpl.options.cor?.length || 0})
                        </label>
                        <p className="text-[10px] text-slate-400">Edite o texto do botão diretamente na caixinha ou adicione novos:</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] bg-[#161B2B] p-2 rounded-xl border border-slate-800">
                          {activeTmpl.options.cor?.map(c => (
                            <div key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-sm">
                              <input
                                type="text"
                                value={c.value}
                                onChange={e => editOptionValue('cor', c.id, e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-emerald-300 focus:outline-none focus:bg-slate-900/80 rounded px-1 outline-none max-w-[130px]"
                                title="Clique para editar este nome de botão"
                              />
                              <button
                                onClick={() => updateTmplOptions('cor', opts => opts.filter(o => o.id !== c.id))}
                                className="text-emerald-400 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                                title="Excluir este botão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nova cor (Ex: Preto, Branco, Grafite)..."
                            value={newOptionInput.field === 'cor' ? newOptionInput.value : ''}
                            onChange={e => setNewOptionInput({ field: 'cor', value: e.target.value })}
                            className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newOptionInput.field === 'cor' && newOptionInput.value.trim()) {
                                updateTmplOptions('cor', opts => [...opts, { id: Date.now().toString(), value: newOptionInput.value.trim() }]);
                                setNewOptionInput({ field: 'cor', value: '' });
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Marcas / Fabricantes Options */}
                      <div className="bg-[#0B1221] p-4 rounded-2xl border border-slate-800 space-y-2.5 md:col-span-2">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest block">
                          Botões de Marcas / Fabricantes ({activeTmpl.options.marca?.length || 0})
                        </label>
                        <p className="text-[10px] text-slate-400">Edite os botões de marca (Ex: Apple, Samsung, Xiaomi, Motorola, Realme) para seleção rápida:</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] bg-[#161B2B] p-2 rounded-xl border border-slate-800">
                          {(activeTmpl.options.marca || []).map(m => (
                            <div key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold shadow-sm">
                              <input
                                type="text"
                                value={m.value}
                                onChange={e => editOptionValue('marca', m.id, e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-indigo-300 focus:outline-none focus:bg-slate-900/80 rounded px-1 outline-none max-w-[130px]"
                                title="Clique para editar este nome de marca"
                              />
                              <button
                                onClick={() => updateTmplOptions('marca', opts => opts.filter(o => o.id !== m.id))}
                                className="text-indigo-400 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                                title="Excluir este botão"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nova marca (Ex: Apple, Samsung, Xiaomi)..."
                            value={newOptionInput.field === 'marca' ? newOptionInput.value : ''}
                            onChange={e => setNewOptionInput({ field: 'marca', value: e.target.value })}
                            className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-indigo-500 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newOptionInput.field === 'marca' && newOptionInput.value.trim()) {
                                updateTmplOptions('marca', opts => [...opts, { id: Date.now().toString(), value: newOptionInput.value.trim() }]);
                                setNewOptionInput({ field: 'marca', value: '' });
                              }
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Add Marca
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <span className="text-[10px] text-slate-500">As configurações são sincronizadas automaticamente em tempo real com o Firebase</span>
              <button
                onClick={async () => {
                  try {
                    localStorage.setItem('msp_supplier_field_settings_v4', JSON.stringify(fieldSettings));
                    const userEmail = getUserAccountEmail();
                    await setDoc(doc(db, `accounts/${userEmail}/settings`, 'supplierOrderFields'), fieldSettings);
                    showToast('Configurações salvas e sincronizadas na Nuvem Firebase!', 'success');
                  } catch (e) {
                    showToast('Erro ao sincronizar com Firebase.', 'error');
                  }
                  setIsSettingsModalOpen(false);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Check className="w-4 h-4" /> Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
