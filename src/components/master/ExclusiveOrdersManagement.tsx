import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Edit2, Trash2, Search, Check, ShoppingCart, 
  Phone, Package, MessageSquare, SlidersHorizontal, 
  ChevronLeft, ChevronRight, FileText, Users, Calendar,
  DollarSign, Clock, X, MoreVertical
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { ExclusiveOrderGroup, ExclusiveOrderItem } from '../../types/exclusiveOrders';

// Helper component for copying text
const CopyButton = ({ text, title }: { text: string, title?: string }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`p-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center justify-center ${
        copied 
          ? 'bg-[#00B86B]/20 text-[#00B86B] border border-[#00B86B]/30' 
          : 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
      }`}
      title={title || "Copiar"}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
    </button>
  );
};

export const ExclusiveOrdersManagement: React.FC = () => {
  const [groups, setGroups] = useState<ExclusiveOrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PURCHASED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Interaction states
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = React.useRef(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExclusiveOrderGroup | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    whatsapp: '',
    items: [] as ExclusiveOrderItem[]
  });

  // Current sub-item being edited/added in modal
  const [currentItem, setCurrentItem] = useState<Partial<ExclusiveOrderItem>>({
    title: '', quantity: 1, price: 0, color: '', date: new Date().toISOString().split('T')[0]
  });

  // Fetch data
  useEffect(() => {
    const userEmail = "mmspmartins62@gmail.com"; 
    const ordersRef = collection(db, `accounts/${userEmail}/exclusive_orders`);
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExclusiveOrderGroup[];
      
      // Sort by creation date descending
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setGroups(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar Pedidos Exclusivos:", error);
      showToast("Erro ao carregar dados.", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Derived state
  const pendingGroups = useMemo(() => groups.filter(g => g.status === 'PENDING'), [groups]);
  const purchasedGroups = useMemo(() => groups.filter(g => g.status === 'PURCHASED'), [groups]);
  
  const displayedGroups = useMemo(() => {
    let list = activeTab === 'PENDING' ? pendingGroups : purchasedGroups;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(g => 
        (g.clientName || '').toLowerCase().includes(lower) || 
        (g.whatsapp || '').includes(lower) ||
        (g.items || []).some(i => (i.title || '').toLowerCase().includes(lower))
      );
    }
    return list;
  }, [activeTab, pendingGroups, purchasedGroups, searchTerm]);

  // Metrics
  const totalPendingCount = pendingGroups.reduce((acc, g) => acc + (g.items || []).length, 0);
  const totalPurchasedCount = purchasedGroups.reduce((acc, g) => acc + (g.items || []).length, 0);
  const totalCustomersWithOrders = new Set(groups.map(g => g.whatsapp || g.clientName)).size;
  
  // Total Value Calculation
  const totalRevenue = groups.reduce((acc, group) => {
    const groupSum = (group.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    return acc + groupSum;
  }, 0);

  // Handlers
  const handleOpenModal = (group?: ExclusiveOrderGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        clientName: group.clientName,
        whatsapp: group.whatsapp,
        items: [...group.items]
      });
    } else {
      setEditingGroup(null);
      setFormData({
        clientName: '',
        whatsapp: '',
        items: []
      });
    }
    setCurrentItem({
      title: '', quantity: 1, price: 0, color: '', date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleAddItemToForm = () => {
    if (!currentItem.title) return showToast("Preencha a descrição do pedido.", "error");
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: currentItem.id || Date.now().toString(),
        title: currentItem.title || '',
        quantity: currentItem.quantity || 1,
        price: currentItem.price || 0,
        color: currentItem.color || '',
        date: currentItem.date || new Date().toISOString().split('T')[0]
      }]
    }));
    
    // Reset current item
    setCurrentItem({
      title: '', quantity: 1, price: 0, color: '', date: new Date().toISOString().split('T')[0]
    });
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId)
    }));
  };

  const handleSaveGroup = async () => {
    if (isSavingRef.current) return;
    if (!formData.clientName) return showToast("Nome do cliente é obrigatório.", "error");
    if (formData.items.length === 0) return showToast("Adicione pelo menos um pedido.", "error");

    isSavingRef.current = true;
    setIsSaving(true);
    const userEmail = "mmspmartins62@gmail.com"; 
    
    try {
      if (editingGroup) {
        const docRef = doc(db, `accounts/${userEmail}/exclusive_orders`, editingGroup.id);
        await updateDoc(docRef, {
          clientName: formData.clientName,
          whatsapp: formData.whatsapp,
          items: formData.items
        });
        showToast("Pedidos atualizados com sucesso!", "success");
      } else {
        const newId = Date.now().toString();
        const docRef = doc(db, `accounts/${userEmail}/exclusive_orders`, newId);
        await setDoc(docRef, {
          clientName: formData.clientName,
          whatsapp: formData.whatsapp,
          status: 'PENDING',
          items: formData.items,
          createdAt: new Date().toISOString()
        });
        showToast("Novo cliente e pedidos criados!", "success");
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar dados.", "error");
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setConfirmDialog({
      message: "Deseja realmente excluir todos os pedidos deste cliente?",
      onConfirm: async () => {
        try {
          const userEmail = "mmspmartins62@gmail.com"; 
          await deleteDoc(doc(db, `accounts/${userEmail}/exclusive_orders`, groupId));
          showToast("Excluído com sucesso.", "success");
        } catch (error) {
          showToast("Erro ao excluir.", "error");
        }
      }
    });
  };

  const handleDeleteItem = (group: ExclusiveOrderGroup, itemId: string) => {
    setConfirmDialog({
      message: "Excluir este pedido específico?",
      onConfirm: async () => {
        try {
          const updatedItems = (group.items || []).filter(i => i.id !== itemId);
          const userEmail = "mmspmartins62@gmail.com"; 
          
          if (updatedItems.length === 0) {
            await deleteDoc(doc(db, `accounts/${userEmail}/exclusive_orders`, group.id));
          } else {
            await updateDoc(doc(db, `accounts/${userEmail}/exclusive_orders`, group.id), { 
              items: updatedItems 
            });
          }
          showToast("Pedido removido com sucesso.", "success");
        } catch (error) {
          console.error(error);
          showToast("Erro ao remover pedido.", "error");
        }
      }
    });
  };

  const handleConfirmPurchase = async (group: ExclusiveOrderGroup) => {
    try {
      const userEmail = "mmspmartins62@gmail.com"; 
      const docRef = doc(db, `accounts/${userEmail}/exclusive_orders`, group.id);
      await updateDoc(docRef, {
        status: 'PURCHASED',
        purchasedAt: new Date().toISOString()
      });
      showToast("Pedidos movidos para Comprados!", "success");
    } catch (error) {
      showToast("Erro ao confirmar compra.", "error");
    }
  };

  const handleRevertToPending = async (group: ExclusiveOrderGroup) => {
    try {
      const userEmail = "mmspmartins62@gmail.com"; 
      const docRef = doc(db, `accounts/${userEmail}/exclusive_orders`, group.id);
      await updateDoc(docRef, {
        status: 'PENDING'
      });
      showToast("Pedidos movidos para Pendentes!", "success");
    } catch (error) {
      showToast("Erro ao reverter.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-300">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1221] border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-transparent border border-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner matching user image */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center relative shrink-0">
            <ShoppingCart className="w-8 h-8 text-purple-400 relative z-10" />
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md"></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="text-[10px] font-bold text-white bg-purple-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Pedidos <span className="text-[#a855f7]">Exclusivos</span>
            </h1>
            <p className="text-xs text-slate-400">
              Gerencie pedidos individuais por cliente. Cada cliente pode ter vários pedidos no mesmo card.
            </p>
          </div>
        </div>

        {/* Top Metric Cards & Button */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
          <div className="bg-[#0B1221] border border-slate-800 px-5 py-3 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">{totalPendingCount}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Pedidos pendentes</div>
            </div>
          </div>

          <div className="bg-[#0B1221] border border-slate-800 px-5 py-3 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">{totalPurchasedCount}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Pedidos comprados</div>
            </div>
          </div>

          <div className="bg-[#0B1221] border border-slate-800 px-5 py-3 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">{totalCustomersWithOrders}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Clientes com pedidos</div>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto px-5 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido Exclusivo
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        {/* Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-transparent text-slate-300 hover:text-white border border-[#1E293B] hover:border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pendentes ({pendingGroups.length})
          </button>

          <button
            onClick={() => setActiveTab('PURCHASED')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'PURCHASED'
                ? 'bg-[#6D28D9] text-white'
                : 'bg-transparent text-slate-300 hover:text-white border border-[#1E293B] hover:border-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Comprados ({purchasedGroups.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, pedido ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0B1221] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <button
            className="px-4 py-2.5 bg-[#0B1221] border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Grid of Client Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm font-medium">Carregando pedidos exclusivos...</div>
      ) : displayedGroups.length === 0 ? (
        <div className="bg-[#0B1221] border border-slate-800 rounded-2xl p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            {activeTab === 'PENDING' ? <Clock className="w-6 h-6" /> : <Package className="w-6 h-6" />}
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum pedido encontrado</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {activeTab === 'PENDING' 
              ? 'Não há pedidos pendentes no momento. Clique em "Novo Pedido Exclusivo" para cadastrar.' 
              : 'Não há pedidos confirmados como comprados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
          {displayedGroups.map((group) => {
            const clientNameStr = group.clientName || '';
            const initials = clientNameStr
              .split(' ')
              .map(n => n?.[0] || '')
              .join('')
              .toUpperCase()
              .substring(0, 2);
            
            const groupItems = group.items || [];

            return (
              <div 
                key={group.id}
                className="bg-[#0B1221] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between gap-5 transition-all"
              >
                {/* Header: Avatar, Name, Phone & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {initials || 'CL'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{group.clientName}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-[#00B86B]" />
                        <span>{group.whatsapp || '-'}</span>
                        <CopyButton text={group.whatsapp} title="Copiar WhatsApp" />
                        {group.whatsapp && (
                          <a
                            href={`https://wa.me/55${group.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-5 h-5 rounded flex items-center justify-center bg-[#00B86B] text-white hover:bg-[#00a35e] transition-colors"
                            title="Abrir no WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      group.status === 'PENDING'
                        ? 'text-amber-500 border border-amber-500/50'
                        : 'text-emerald-500 border border-emerald-500/50'
                    }`}>
                      {group.status === 'PENDING' ? 'PENDENTE' : 'COMPRADO'}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === group.id ? null : group.id);
                        }}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer mt-0.5 p-1 rounded-md hover:bg-slate-800"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openDropdownId === group.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#161B2B] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              handleOpenModal(group);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              handleDeleteGroup(group.id);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-500 hover:bg-rose-950/50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtitle: X pedidos neste cliente */}
                <div className="text-[13px] font-medium text-slate-400 -mt-2">
                  {groupItems.length} {groupItems.length === 1 ? 'pedido neste cliente' : 'pedidos neste cliente'}
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-4">
                  {groupItems.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="flex gap-3"
                    >
                      {/* Product Thumbnail Placeholder */}
                      <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 p-1">
                        <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center relative">
                           {item.title.toLowerCase().includes('capa') ? (
                             <div className="w-8 h-12 bg-slate-800 rounded-sm border-2 border-slate-700 relative">
                               <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                             </div>
                          ) : item.title.toLowerCase().includes('carregador') || item.title.toLowerCase().includes('cabo') ? (
                             <div className="w-8 h-8 bg-slate-300 rounded-sm"></div>
                          ) : item.title.toLowerCase().includes('fone') ? (
                             <div className="w-10 h-7 bg-black rounded-xl"></div>
                          ) : item.title.toLowerCase().includes('película') ? (
                             <div className="w-8 h-12 bg-gradient-to-br from-blue-300 to-purple-300 rounded-sm border-2 border-blue-400"></div>
                          ) : (
                             <div className="w-8 h-12 bg-slate-800 rounded-sm border border-slate-600"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-white leading-tight pr-2">{item.title}</h4>
                          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(group);
                              }}
                              className="w-6 h-6 rounded bg-transparent border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(group, item.id);
                              }}
                              className="w-6 h-6 rounded bg-rose-950/20 border border-rose-900/50 flex items-center justify-center text-rose-500 hover:bg-rose-900/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {item.color && (
                          <p className="text-[12px] text-slate-400">Cor: <span className="text-slate-300">{item.color}</span></p>
                        )}
                        <p className="text-[12px] text-slate-400">Qtd: <span className="text-slate-300">{item.quantity}</span></p>
                        
                        <div className="flex items-end justify-between mt-0.5">
                          <p className="text-[14px] font-bold text-[#00B86B]">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* + Adicionar pedido button inside card */}
                <button
                  onClick={() => handleOpenModal(group)}
                  className="w-full py-2 bg-transparent border border-dashed border-[#7C3AED] hover:border-purple-400 rounded-lg text-[#7C3AED] hover:text-purple-300 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-auto"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar pedido
                </button>

                {/* Bottom Action Footer */}
                <div className="flex gap-3 pt-2">
                  {group.status === 'PENDING' ? (
                    <button
                      onClick={() => handleConfirmPurchase(group)}
                      className="flex-1 py-2.5 rounded-lg bg-[#00B86B] hover:bg-[#00a35e] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Confirmar Compra
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevertToPending(group)}
                      className="flex-1 py-2.5 rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      Reverter para Pendente
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenModal(group)}
                    className="flex-1 py-2.5 rounded-lg bg-transparent hover:bg-slate-800 border border-[#1E293B] text-slate-300 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && displayedGroups.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/50 mt-4">
          <div className="text-sm text-slate-400">
            Mostrando {displayedGroups.length} de {activeTab === 'PENDING' ? pendingGroups.length : purchasedGroups.length} pedidos {activeTab === 'PENDING' ? 'pendentes' : 'comprados'}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg bg-[#0B1221] border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer">
              1
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0B1221] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 font-bold text-sm transition-colors cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0B1221] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal - Add / Edit Client and Orders */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B1221] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0B1221] z-10">
              <h2 className="text-xl font-bold text-white">
                {editingGroup ? 'Editar Cliente e Pedidos' : 'Novo Pedido Exclusivo'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Client Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Nome do Cliente *</label>
                    <input
                      type="text"
                      placeholder="Ex: José Silva"
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">WhatsApp (com DDD)</label>
                    <input
                      type="text"
                      placeholder="Ex: (88) 9 9999-9999"
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Added Orders List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Pedidos Adicionados ({formData.items.length})</h3>
                {formData.items.length === 0 ? (
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg text-center text-sm text-slate-500">
                    Nenhum pedido adicionado ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm">{item.title}</div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                            {item.color && <span>Cor: {item.color}</span>}
                            <span>Qtd: {item.quantity}</span>
                            <span className="text-[#00B86B] font-semibold">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItemFromForm(item.id)}
                          className="p-2 rounded-md bg-rose-950/30 text-rose-500 hover:bg-rose-900/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Order Section */}
              <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300">Adicionar Novo Item</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Descrição do Produto *</label>
                  <input
                    type="text"
                    placeholder="Ex: Capinha Anti-Impacto"
                    value={currentItem.title}
                    onChange={e => setCurrentItem({...currentItem, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Cor</label>
                    <input
                      type="text"
                      placeholder="Ex: Preto"
                      value={currentItem.color}
                      onChange={e => setCurrentItem({...currentItem, color: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Preço Un (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={currentItem.price || ''}
                      onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity || ''}
                      onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Data</label>
                    <input
                      type="date"
                      value={currentItem.date}
                      onChange={e => setCurrentItem({...currentItem, date: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none style-color-scheme-dark"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddItemToForm}
                  className="w-full py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar à Lista do Cliente
                </button>
              </div>

            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-[#0B1221] sticky bottom-0">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#7C3AED]/50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Cliente e Pedidos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
