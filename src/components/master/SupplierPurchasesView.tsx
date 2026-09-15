import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, Trash2, Calendar, 
  DollarSign, Package, Truck, Plus, Search,
  Edit3, ArrowRight, Check, AlertCircle, RefreshCw, Layers,
  Phone, MessageSquare, ExternalLink, Copy, CheckCheck, UserPlus,
  Building2, ChevronDown, ChevronUp, RotateCcw, Undo2, Send, FileText
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
}

interface SupplierPurchasesViewProps {
  items: SupplierPurchaseItem[];
  subTab: 'FORNECEDOR' | 'HISTORICO' | 'DEBITOS';
  onUpdateStatus: (id: string, status: 'Pago' | 'Pendente') => void;
  onUpdateSupplier: (id: string, newSupplierName: string) => void;
  onDelete: (id: string) => void;
  onAddPurchaseItem: (item: Omit<SupplierPurchaseItem, 'purchaseId'>) => void;
  onBulkPayForSupplier?: (supplierName: string) => void;
  suppliers: RegisteredSupplier[];
  onAddSupplier: (supplier: Omit<RegisteredSupplier, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSupplierInfo: (supplier: RegisteredSupplier) => Promise<void>;
  onDeleteSupplier: (supplierId: string) => Promise<void>;
  onToggleReturn?: (purchaseId: string, isReturned: boolean, returnReason?: string) => void;
}

export const SupplierPurchasesView: React.FC<SupplierPurchasesViewProps> = ({ 
  items, 
  subTab, 
  onUpdateStatus, 
  onUpdateSupplier, 
  onDelete, 
  onAddPurchaseItem,
  onBulkPayForSupplier,
  suppliers,
  onAddSupplier,
  onUpdateSupplierInfo,
  onDeleteSupplier,
  onToggleReturn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<RegisteredSupplier | null>(null);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

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
    estrutura: '',
    qualidade: 'Premium',
    cor: 'Preto',
    quantity: 1,
    price: 0,
    supplierName: '',
    paymentStatus: 'Pendente' as 'Pendente' | 'Pago'
  });

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

  // Debts grouped by supplier for DEBITOS view (ignora peças devolvidas)
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
        text += `${globalIndex}. 📱 ${typePrefix}${item.title}\n`;
        
        if (item.marca) text += `🏷️ ${item.marca}\n`;
        if (item.modelo) text += `📱 ${item.modelo}\n`;
        if (item.estrutura) text += `⭕ ${item.estrutura}\n`;
        if (item.qualidade) text += `⚡ ${item.qualidade}\n`;
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

    // PEÇAS EM DEVOLUÇÃO (Ficam apenas embaixo, separadas das peças contabilizadas)
    if (returnedPieces.length > 0) {
      if (activePieces.length > 0) {
        text += `\n-----------------------------------\n`;
      }
      text += `🔄 *PEÇAS PARA DEVOLUÇÃO (${returnedPieces.length}):*\n`;
      returnedPieces.forEach((item, rIdx) => {
        const typePrefix = item.typeName ? `${item.typeName} ` : '';
        text += `${rIdx + 1}. 📱 ${typePrefix}${item.title}\n`;
        if (item.marca) text += `🏷️ Marca: ${item.marca}\n`;
        if (item.modelo) text += `📱 Modelo: ${item.modelo}\n`;
        if (item.estrutura) text += `⭕ Estrutura: ${item.estrutura}\n`;
        if (item.qualidade) text += `⚡ Qualidade: ${item.qualidade}\n`;
        if (item.cor) text += `🎨 Cor: ${item.cor}\n`;
        text += `🔢 Qtd: ${item.quantity}x | R$ ${(Number(item.price) || 0).toFixed(2).replace('.', ',')}\n`;
        if (item.returnReason) text += `📝 Motivo: ${item.returnReason}\n`;
        text += `\n`;
      });
      text += `-----------------------------------\n`;
    }

    text += `Por favor, confirma se está certo o valor e as peças.`;

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
    text += `📱 ${typePrefix}${piece.title}\n`;
    if (piece.marca) text += `🏷️ Marca: ${piece.marca}\n`;
    if (piece.modelo) text += `📱 Modelo: ${piece.modelo}\n`;
    if (piece.estrutura) text += `⭕ Estrutura: ${piece.estrutura}\n`;
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

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* TOP BANNERS FOR HISTÓRICO & DÉBITOS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'HISTORICO' && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Histórico de Compras Pagas (Janela Rotativa de 12 Meses)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  Auto-limpeza ativa
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Peças marcadas como pagas na hora ou quitadas a prazo ficam arquivadas aqui por 12 meses. O sistema remove automaticamente registros anteriores a 1 ano.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400 uppercase font-bold">Total Pago (12m)</div>
            <div className="text-xl font-black text-emerald-400">R$ {totalPaidAmount.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      )}

      {subTab === 'DEBITOS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-[#161B2B] rounded-xl border border-amber-500/30 p-4 flex items-center gap-3 shadow-lg">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">
                R$ {totalPendingAmount.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Total em Débito (A Prazo)</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-4 flex items-center gap-3 shadow-lg">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {items.filter(i => i.paymentStatus === 'Pendente').reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Peças Aguardando Pagamento</div>
            </div>
          </div>

          <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-4 flex items-center gap-3 shadow-lg">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-purple-400">
                {Object.keys(debtsBySupplier).length}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Fornecedores com Débito Aberto</div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SEARCH / ACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#161B2B] p-3 rounded-xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por peça, marca, modelo ou fornecedor..."
              className="w-full bg-[#0B1221] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Filter by supplier */}
          <div className="flex items-center gap-1.5 bg-[#0B1221] border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161B2B]">Todos os Fornecedores</option>
              {allSuppliersList.map(s => (
                <option key={s.id} value={s.name} className="bg-[#161B2B]">{s.name}</option>
              ))}
            </select>
          </div>

          {/* SubTab 2 actions: + Cadastrar Fornecedor & + Apontar Peça */}
          {subTab === 'FORNECEDOR' && (
            <>
              <button
                onClick={handleOpenAddSupplier}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> + Cadastrar Fornecedor
              </button>

              <button
                onClick={() => {
                  setNewItemForm(prev => ({
                    ...prev,
                    supplierName: allSuppliersList[0]?.name || ''
                  }));
                  setIsAddPieceModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Apontar Peça
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: FORNECEDOR (CARDS DE FORNECEDORES) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'FORNECEDOR' && (
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {allSuppliersList
                .filter(s => supplierFilter === 'ALL' || s.name === supplierFilter)
                .map(supplier => {
                  const supplierPieces = items.filter(
                    i => (i.supplierName || '').trim().toLowerCase() === supplier.name.trim().toLowerCase()
                  );

                  // Peças normais (não devolvidas) para contabilidade
                  const pendingPieces = supplierPieces.filter(i => i.paymentStatus === 'Pendente' && !i.isReturned);
                  const paidPieces = supplierPieces.filter(i => i.paymentStatus === 'Pago' && !i.isReturned);
                  const returnedPieces = supplierPieces.filter(i => !!i.isReturned);

                  const pendingTotal = pendingPieces.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
                  const paidTotal = paidPieces.reduce((acc, i) => acc + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
                  const totalCardAmount = pendingTotal + paidTotal;

                  const currentCardFilter = cardPieceFilters[supplier.id] || 'ALL';

                  const displayedPieces = supplierPieces
                    .filter(i => {
                      if (currentCardFilter === 'PENDENTE') return i.paymentStatus === 'Pendente' && !i.isReturned;
                      if (currentCardFilter === 'PAGO') return i.paymentStatus === 'Pago' && !i.isReturned;
                      if (currentCardFilter === 'DEVOLUCAO') return !!i.isReturned;
                      return true;
                    })
                    .filter(i => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase();
                      return (i.title || '').toLowerCase().includes(q) || (i.modelo || '').toLowerCase().includes(q);
                    });

                  // Group displayed pieces by Date
                  const dateGroupsMap: Record<string, {
                    dateKey: string;
                    displayDate: string;
                    dayBadge?: string;
                    weekday: string;
                    pieces: SupplierPurchaseItem[];
                    subtotal: number;
                    pendingSubtotal: number;
                    paidSubtotal: number;
                    returnedCount: number;
                  }> = {};

                  displayedPieces.forEach(piece => {
                    const { dateKey, displayDate, weekday, dayBadge } = getDateKeyAndLabels(piece.createdAt);
                    if (!dateGroupsMap[dateKey]) {
                      dateGroupsMap[dateKey] = {
                        dateKey,
                        displayDate,
                        dayBadge,
                        weekday,
                        pieces: [],
                        subtotal: 0,
                        pendingSubtotal: 0,
                        paidSubtotal: 0,
                        returnedCount: 0
                      };
                    }
                    const itemTotal = (Number(piece.price) || 0) * (Number(piece.quantity) || 1);
                    dateGroupsMap[dateKey].pieces.push(piece);

                    // Peça devolvida NÃO contabiliza mais no valor dele nem no total do card
                    if (piece.isReturned) {
                      dateGroupsMap[dateKey].returnedCount += 1;
                    } else {
                      dateGroupsMap[dateKey].subtotal += itemTotal;
                      if (piece.paymentStatus === 'Pendente') {
                        dateGroupsMap[dateKey].pendingSubtotal += itemTotal;
                      } else {
                        dateGroupsMap[dateKey].paidSubtotal += itemTotal;
                      }
                    }
                  });

                  // Sort date groups descending (most recent date first)
                  const dateGroups = Object.values(dateGroupsMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                  const dateKeys = dateGroups.map(g => g.dateKey);
                  const isCardCollapsed = !!collapsedSuppliers[supplier.id];

                  return (
                    <div 
                      key={supplier.id}
                      className="bg-[#161B2B] rounded-2xl border border-slate-800 hover:border-slate-700/80 p-5 flex flex-col shadow-xl transition-all gap-4"
                    >
                      {/* Card Header: Supplier Info & Actions */}
                      <div>
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80 flex-wrap">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-black text-white truncate" title={supplier.name}>
                                  {supplier.name}
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {supplierPieces.length} {supplierPieces.length === 1 ? 'peça' : 'peças'}
                                </span>
                                {returnedPieces.length > 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                    <RotateCcw className="w-2.5 h-2.5" /> {returnedPieces.length} {returnedPieces.length === 1 ? 'devolução' : 'devoluções'}
                                  </span>
                                )}
                              </div>

                              {supplier.obs && (
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  {supplier.obs}
                                </p>
                              )}

                              {/* Contact, Pix & Extrato Pills */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {supplier.phone ? (
                                  <button
                                    onClick={() => handleOpenWhatsApp(supplier.phone!, supplier.name, pendingPieces)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                                    title="Chamar no WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> {supplier.phone}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic">Sem WhatsApp</span>
                                )}

                                {supplier.pixKey && (
                                  <button
                                    onClick={() => handleCopyPix(supplier.pixKey!, supplier.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                                    title="Clique para copiar a Chave PIX"
                                  >
                                    {copiedPixId === supplier.id ? (
                                      <>
                                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> PIX Copiado!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" /> PIX: {supplier.pixKey}
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* BOTÃO EXTRATO FORNECEDOR (WHATSAPP) */}
                                <button
                                  onClick={() => handleSendExtratoWhatsApp(supplier.phone || '', supplier.name, supplierPieces)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                                  title="Enviar Extrato completo de conferência de peças e devoluções para o fornecedor"
                                >
                                  <Send className="w-3.5 h-3.5" /> Extrato (WhatsApp)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Header controls: Collapse entire card + Edit / Delete */}
                          <div className="flex items-center gap-1.5 shrink-0 mt-2 sm:mt-0">
                            <button
                              onClick={() => toggleSupplierCollapse(supplier.id)}
                              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
                              title={isCardCollapsed ? 'Expandir Card do Fornecedor' : 'Recolher Card do Fornecedor'}
                            >
                              {isCardCollapsed ? (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> Expandir Card
                                </>
                              ) : (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> Recolher Card
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditSupplier(supplier)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                              title="Editar Fornecedor"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteSupplier(supplier.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              title="Excluir Fornecedor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* VALOR TOTAL DO CARD - Destacado no topo */}
                        <div className="mt-3 bg-gradient-to-r from-slate-950 via-[#0D1527] to-slate-950 p-3 rounded-xl border border-indigo-500/30 shadow-inner">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1 truncate">
                                  <DollarSign className="w-3.5 h-3.5 shrink-0" /> VALOR TOTAL DO CARD ({supplier.name})
                                </span>
                              </div>
                              <div className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                                R$ {totalCardAmount.toFixed(2).replace('.', ',')}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                Total de {supplierPieces.length} {supplierPieces.length === 1 ? 'peça' : 'peças'} agrupadas em {dateGroups.length} {dateGroups.length === 1 ? 'data' : 'datas diferentes'}.
                              </div>
                            </div>

                            {/* A Prazo, Pago e Devolução em uma linha na frente do outro, reduzidos e com espacinho bem pouquinho */}
                            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full md:w-auto shrink-0">
                              {/* A Prazo Subtotal */}
                              <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-amber-500/30 min-w-0 text-center sm:text-left flex flex-col justify-center">
                                <div className="text-[8px] sm:text-[9px] font-black uppercase text-amber-400 flex items-center justify-center sm:justify-start gap-1 truncate">
                                  <Clock className="w-2.5 h-2.5 shrink-0" /> A Prazo
                                </div>
                                <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 truncate">
                                  R$ {pendingTotal.toFixed(2).replace('.', ',')}
                                </div>
                                <span className="text-[8px] text-slate-400 block truncate">{pendingPieces.length} {pendingPieces.length === 1 ? 'peça' : 'peças'}</span>
                              </div>

                              {/* Pago Subtotal */}
                              <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-emerald-500/30 min-w-0 text-center sm:text-left flex flex-col justify-center">
                                <div className="text-[8px] sm:text-[9px] font-black uppercase text-emerald-400 flex items-center justify-center sm:justify-start gap-1 truncate">
                                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Pago
                                </div>
                                <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5 truncate">
                                  R$ {paidTotal.toFixed(2).replace('.', ',')}
                                </div>
                                <span className="text-[8px] text-slate-400 block truncate">{paidPieces.length} {paidPieces.length === 1 ? 'peça' : 'peças'}</span>
                              </div>

                              {/* Devoluções Indicator */}
                              <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-rose-500/30 min-w-0 text-center sm:text-left flex flex-col justify-center">
                                <div className="text-[8px] sm:text-[9px] font-black uppercase text-rose-400 flex items-center justify-center sm:justify-start gap-1 truncate">
                                  <RotateCcw className="w-2.5 h-2.5 shrink-0" /> Devolução
                                </div>
                                <div className="text-xs sm:text-sm font-black text-rose-300 mt-0.5 truncate">
                                  {returnedPieces.length} {returnedPieces.length === 1 ? 'peça' : 'peças'}
                                </div>
                                <span className="text-[8px] text-slate-400 block truncate">Não cobrado</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* If NOT collapsed: Quick actions + Filter tabs + Curtain controls */}
                        {!isCardCollapsed && (
                          <>
                            {/* Quick actions for Supplier */}
                            <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                              {pendingPieces.length > 0 && onBulkPayForSupplier ? (
                                <button
                                  onClick={() => onBulkPayForSupplier(supplier.name)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Quitar Todas a Prazo ({pendingPieces.length})
                                </button>
                              ) : (
                                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Nenhum débito em aberto
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  setNewItemForm(prev => ({ ...prev, supplierName: supplier.name }));
                                  setIsAddPieceModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Apontar Peça Neste Card
                              </button>
                            </div>

                            {/* Pieces Filter Tabs + Accordion Curtain Bulk Controls */}
                            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/60 flex-wrap">
                              <div className="flex items-center gap-1 flex-nowrap overflow-x-auto max-w-full pb-0.5">
                                <button
                                  onClick={() => setCardPieceFilters(prev => ({ ...prev, [supplier.id]: 'ALL' }))}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    currentCardFilter === 'ALL'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Todas ({supplierPieces.length})
                                </button>
                                <button
                                  onClick={() => setCardPieceFilters(prev => ({ ...prev, [supplier.id]: 'PENDENTE' }))}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    currentCardFilter === 'PENDENTE'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-amber-400'
                                  }`}
                                >
                                  A Prazo ({pendingPieces.length})
                                </button>
                                <button
                                  onClick={() => setCardPieceFilters(prev => ({ ...prev, [supplier.id]: 'PAGO' }))}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    currentCardFilter === 'PAGO'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                                  }`}
                                >
                                  Pagas ({paidPieces.length})
                                </button>
                                <button
                                  onClick={() => setCardPieceFilters(prev => ({ ...prev, [supplier.id]: 'DEVOLUCAO' }))}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    currentCardFilter === 'DEVOLUCAO'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                                  }`}
                                >
                                  Devolução ({returnedPieces.length})
                                </button>
                              </div>

                              {dateKeys.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setAllCurtainsForSupplier(supplier.id, dateKeys, true)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title="Descer todas as cortinas de datas deste card"
                                  >
                                    <ChevronDown className="w-3 h-3 text-indigo-400" /> Abrir Cortinas
                                  </button>
                                  <button
                                    onClick={() => setAllCurtainsForSupplier(supplier.id, dateKeys, false)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title="Recolher todas as cortinas de datas deste card"
                                  >
                                    <ChevronUp className="w-3 h-3 text-slate-400" /> Recolher Cortinas
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* DATE GROUP ACCORDION CURTAINS (DIVIDIDO POR DATA) */}
                      {!isCardCollapsed && (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                          {dateGroups.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-xs bg-[#0B1221] rounded-xl border border-slate-800">
                              Nenhuma peça encontrada neste status para este fornecedor.
                            </div>
                          ) : (
                            dateGroups.map(group => {
                              const curtainKey = `${supplier.id}_${group.dateKey}`;
                              // IMPORTANTE: Por padrão, a cortina SEMPRE fica recolhida (false), só desce quando clica
                              const isCurtainOpen = !!openCurtains[curtainKey];

                              return (
                                <div 
                                  key={group.dateKey}
                                  className="rounded-xl border border-slate-800/90 overflow-hidden bg-[#0B1221] transition-all shadow-sm hover:border-slate-700"
                                >
                                  {/* CURTAIN HEADER (Click to open / close like a curtain) */}
                                  <button
                                    type="button"
                                    onClick={() => toggleCurtain(curtainKey)}
                                    className={`w-full p-3 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer border-b ${
                                      isCurtainOpen 
                                        ? 'bg-gradient-to-r from-slate-900 via-[#111A2E] to-slate-900 border-indigo-500/30' 
                                        : 'bg-[#0E1524] hover:bg-slate-850 border-slate-800/60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`p-2 rounded-lg border shrink-0 ${
                                        isCurtainOpen 
                                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                                          : 'bg-slate-800 text-slate-400 border-slate-700'
                                      }`}>
                                        <Calendar className="w-4 h-4" />
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-black text-white">
                                            {group.displayDate}
                                          </span>
                                          {group.dayBadge && (
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                              {group.dayBadge}
                                            </span>
                                          )}
                                          {group.weekday && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                              • {group.weekday}
                                            </span>
                                          )}
                                          <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">
                                            {group.pieces.length} {group.pieces.length === 1 ? 'peça' : 'peças'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] flex-wrap">
                                          {group.pendingSubtotal > 0 && (
                                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                              <Clock className="w-2.5 h-2.5" /> A Prazo: R$ {group.pendingSubtotal.toFixed(2).replace('.', ',')}
                                            </span>
                                          )}
                                          {group.paidSubtotal > 0 && (
                                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                              <CheckCircle2 className="w-2.5 h-2.5" /> Pago: R$ {group.paidSubtotal.toFixed(2).replace('.', ',')}
                                            </span>
                                          )}
                                          {group.returnedCount > 0 && (
                                            <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                              <RotateCcw className="w-2.5 h-2.5" /> {group.returnedCount} {group.returnedCount === 1 ? 'devolução' : 'devoluções'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* VALOR DELE (Desta data) & Curtain Toggle Indicator */}
                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                      <div className="text-right">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                          VALOR DELE
                                        </span>
                                        <span className="text-xs sm:text-sm font-black text-indigo-300 block">
                                          R$ {group.subtotal.toFixed(2).replace('.', ',')}
                                        </span>
                                      </div>

                                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all ${
                                        isCurtainOpen 
                                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}>
                                        <span className="hidden sm:inline">{isCurtainOpen ? 'Recolher' : 'Descer'}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCurtainOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'}`} />
                                      </div>
                                    </div>
                                  </button>

                                  {/* CURTAIN BODY (Descida como cortina ao clicar) */}
                                  {isCurtainOpen && (
                                    <div className="p-3 space-y-2 bg-[#090E1A]/80 border-t border-slate-800/40">
                                      {group.pieces.map(piece => {
                                        const isReturned = !!piece.isReturned;
                                        const isPaid = piece.paymentStatus === 'Pago' && !isReturned;
                                        const itemTotal = (Number(piece.price) || 0) * (Number(piece.quantity) || 1);

                                        return (
                                          <div
                                            key={piece.purchaseId}
                                            className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                                              isReturned
                                                ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                                                : isPaid 
                                                  ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40' 
                                                  : 'bg-[#111726] border-slate-800 hover:border-amber-500/30'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase">
                                                    {piece.typeName || 'Peça'}
                                                  </span>
                                                  <span className="font-black text-xs text-white truncate" title={piece.title}>
                                                    {piece.title}
                                                  </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                  {piece.marca} {piece.modelo} {piece.qualidade ? `• ${piece.qualidade}` : ''} {piece.cor ? `• ${piece.cor}` : ''}
                                                </div>
                                                {isReturned && piece.returnReason && (
                                                  <div className="text-[10px] text-rose-400/90 mt-1 font-medium bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
                                                    Motivo: {piece.returnReason}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="text-right shrink-0">
                                                <div className={`text-xs font-black ${
                                                  isReturned 
                                                    ? 'line-through text-slate-500' 
                                                    : isPaid 
                                                      ? 'text-emerald-400' 
                                                      : 'text-amber-400'
                                                }`}>
                                                  R$ {itemTotal.toFixed(2).replace('.', ',')}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                  {isReturned ? (
                                                    <span className="text-rose-400 font-bold">Devolução (R$ 0,00)</span>
                                                  ) : (
                                                    `${piece.quantity}x R$ ${(Number(piece.price) || 0).toFixed(2).replace('.', ',')}`
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Piece Controls: Status Badge + Return Actions */}
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 flex-wrap gap-1">
                                              <div>
                                                {isReturned ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                                                    <RotateCcw className="w-3 h-3 text-rose-400" /> DEVOLVIDA (NÃO COBRAR)
                                                  </span>
                                                ) : isPaid ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                                    <CheckCircle2 className="w-3 h-3" /> PAGO NA HORA (HISTÓRICO)
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                                                    <Clock className="w-3 h-3" /> A PRAZO (EM DÉBITO)
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {isReturned ? (
                                                  <>
                                                    {/* OPÇÃO DE ENVIAR AO FORNECEDOR QUE ELA VAI SER DEVOLVIDA */}
                                                    <button
                                                      onClick={() => handleSendSinglePieceReturn(supplier.phone || '', supplier.name, piece)}
                                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                                      title="Enviar aviso de devolução no WhatsApp do fornecedor"
                                                    >
                                                      <Send className="w-3 h-3" /> Enviar ao Fornecedor
                                                    </button>
                                                    <button
                                                      onClick={() => onToggleReturn && onToggleReturn(piece.purchaseId, false)}
                                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                      title="Cancelar devolução e voltar a contabilizar a peça"
                                                    >
                                                      <Undo2 className="w-3 h-3" /> Reativar Peça
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {isPaid ? (
                                                      <button
                                                        onClick={() => onUpdateStatus(piece.purchaseId, 'Pendente')}
                                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                        title="Reverter para A Prazo (Débito)"
                                                      >
                                                        <RefreshCw className="w-3 h-3" /> Reverter p/ A Prazo
                                                      </button>
                                                    ) : (
                                                      <button
                                                        onClick={() => onUpdateStatus(piece.purchaseId, 'Pago')}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-600/20"
                                                        title="Pagar na Hora (Vai p/ Histórico)"
                                                      >
                                                        <Check className="w-3 h-3" /> ⚡ Pagar na Hora
                                                      </button>
                                                    )}

                                                    {/* BOTÃO DE DEVOLUÇÃO */}
                                                    <button
                                                      onClick={() => handleOpenReturnModal(piece, supplier.name, supplier.phone || '')}
                                                      className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                      title="Marcar peça para devolução (o valor não será mais contabilizado)"
                                                    >
                                                      <RotateCcw className="w-3 h-3 text-rose-400" /> Devolução
                                                    </button>
                                                  </>
                                                )}

                                                <button
                                                  onClick={() => onDelete(piece.purchaseId)}
                                                  className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer transition-all"
                                                  title="Excluir peça"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {/* Curtain Footer: Extrato Desta Data + Quitar Peças Desta Data */}
                                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-slate-800/60 mt-2">
                                        <button
                                          onClick={() => handleSendExtratoWhatsApp(supplier.phone || '', supplier.name, group.pieces, group.displayDate)}
                                          className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                          title="Enviar extrato de conferência desta data para o fornecedor no WhatsApp"
                                        >
                                          <Send className="w-3.5 h-3.5 text-emerald-400" /> Extrato Desta Data (WhatsApp)
                                        </button>

                                        {group.pendingSubtotal > 0 && (
                                          <button
                                            onClick={() => {
                                              group.pieces
                                                .filter(p => p.paymentStatus === 'Pendente' && !p.isReturned)
                                                .forEach(p => onUpdateStatus(p.purchaseId, 'Pago'));
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                            title="Quitar todas as peças a prazo desta data específica"
                                          >
                                            <Check className="w-3.5 h-3.5" /> Quitar Peças Desta Data (R$ {group.pendingSubtotal.toFixed(2).replace('.', ',')})
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 3 & 4: HISTÓRICO & DÉBITOS LIST VIEW */}
      {/* ------------------------------------------------------------- */}
      {subTab !== 'FORNECEDOR' && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-16">
          {subTab === 'DEBITOS' && Object.keys(debtsBySupplier).length > 0 && (
            <div className="mb-4 bg-[#161B2B] p-4 rounded-xl border border-amber-500/20">
              <div className="text-xs font-black uppercase text-amber-400 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Resumo de Débito por Fornecedor
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {Object.entries(debtsBySupplier).map(([supName, data]: [string, { total: number; count: number; items: SupplierPurchaseItem[] }]) => (
                  <div 
                    key={supName} 
                    className="bg-[#121828] border border-amber-500/20 rounded-xl p-3.5 flex flex-col justify-between gap-2 shadow-sm hover:border-amber-500/40 transition-all"
                  >
                    <div>
                      <div className="font-black text-white text-xs truncate flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {supName}
                      </div>
                      <div className="text-amber-400 font-black text-sm mt-1">
                        R$ {data.total.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {data.count} {data.count === 1 ? 'peça pendente' : 'peças pendentes'}
                      </div>
                    </div>
                    {onBulkPayForSupplier && (
                      <button
                        onClick={() => onBulkPayForSupplier(supName)}
                        className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Quitar Débito
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                {subTab === 'HISTORICO' ? (
                  <Clock className="w-8 h-8 text-slate-600" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {subTab === 'HISTORICO' ? 'Nenhum histórico encontrado' : 'Nenhum débito pendente! Tudo quitado.'}
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto text-xs">
                {subTab === 'HISTORICO'
                  ? 'Quando você marcar peças como "Pago" na aba Fornecedor ou Débito, elas serão arquivadas aqui por 12 meses.'
                  : 'Parabéns! Todas as compras com fornecedores estão com pagamento em dia.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                const isPaid = item.paymentStatus === 'Pago';

                return (
                  <div 
                    key={item.purchaseId}
                    className={`bg-[#161B2B] rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-lg ${
                      isPaid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase">
                                {item.typeName || 'Peça'}
                              </span>
                              <h4 className="text-sm font-black text-white truncate" title={item.title}>
                                {item.title}
                              </h4>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3" />
                              {item.createdAt && !isNaN(new Date(item.createdAt).getTime())
                                ? new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'Recentemente'}
                            </div>
                          </div>
                        </div>

                        {/* Price & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="text-right">
                            <div className={`text-xs font-black ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              R$ {itemTotal.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {item.quantity}x R$ {(Number(item.price) || 0).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <button 
                            onClick={() => onDelete(item.purchaseId)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Excluir peça"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="grid grid-cols-2 gap-2 py-2 mt-2 border-y border-slate-800/60 text-[11px]">
                        <div className="col-span-2 bg-[#0B1221] p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-indigo-400" /> Fornecedor:
                          </span>
                          <div className="font-black text-white text-xs mt-0.5">
                            {item.supplierName || 'Fornecedor Principal'}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Marca/Modelo</span>
                          <span className="font-bold text-slate-300 truncate block">
                            {item.marca || '-'} {item.modelo || ''}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Qualidade/Cor</span>
                          <span className="font-bold text-slate-300 truncate block">
                            {item.qualidade || '-'} / {item.cor || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer & Status Controls */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            PAGO {item.paidAt && !isNaN(new Date(item.paidAt).getTime()) ? `EM ${new Date(item.paidAt).toLocaleDateString()}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            A PRAZO (EM DÉBITO)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPaid ? (
                          <button
                            onClick={() => onUpdateStatus(item.purchaseId, 'Pendente')}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Reverter status para A Prazo"
                          >
                            <RefreshCw className="w-3 h-3" /> Reverter p/ A Prazo
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item.purchaseId, 'Pago')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" /> ⚡ PAGAR NA HORA
                          </button>
                        )}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Marca</label>
                  <input 
                    type="text"
                    placeholder="Ex: Apple, Samsung, Xiaomi..."
                    value={newItemForm.marca}
                    onChange={(e) => setNewItemForm({ ...newItemForm, marca: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Modelo</label>
                  <input 
                    type="text"
                    placeholder="Ex: iPhone 11, A32, Redmi Note 11..."
                    value={newItemForm.modelo}
                    onChange={(e) => setNewItemForm({ ...newItemForm, modelo: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Qualidade</label>
                  <input 
                    type="text"
                    placeholder="Ex: OLED, Incell, Original, Premium..."
                    value={newItemForm.qualidade}
                    onChange={(e) => setNewItemForm({ ...newItemForm, qualidade: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cor</label>
                  <input 
                    type="text"
                    placeholder="Ex: Preto, Branco, Azul..."
                    value={newItemForm.cor}
                    onChange={(e) => setNewItemForm({ ...newItemForm, cor: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};
