import React, { useState, useMemo } from 'react';
import { 
  Wrench, User, Phone, MapPin, DollarSign, CheckCircle2, Clock, 
  Trash2, Edit3, Plus, Search, Send, Copy, CheckCheck, 
  ChevronDown, ChevronUp, AlertCircle, X, Check, MessageSquare, 
  Smartphone, Filter, CheckSquare, Square, Share2
} from 'lucide-react';

export interface TechnicianServiceItem {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceDescription: string;
  repasseValue: number;
  location: string;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
  notes?: string;
}

export interface TechnicianServiceCard {
  id: string;
  technicianName: string;
  technicianPhone?: string;
  technicianPix?: string;
  createdAt: string;
  updatedAt?: string;
  services: TechnicianServiceItem[];
}

interface SupplierTechnicianServicesViewProps {
  cards: TechnicianServiceCard[];
  onAddCard: (technicianName: string, technicianPhone?: string, technicianPix?: string) => Promise<void>;
  onUpdateCard: (card: TechnicianServiceCard) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onAddService: (cardId: string, service: Omit<TechnicianServiceItem, 'id' | 'createdAt' | 'isCompleted'>) => Promise<void>;
  onUpdateService: (cardId: string, service: TechnicianServiceItem) => Promise<void>;
  onDeleteService: (cardId: string, serviceId: string) => Promise<void>;
  onToggleServiceDone: (cardId: string, serviceId: string) => Promise<void>;
}

export const SupplierTechnicianServicesView: React.FC<SupplierTechnicianServicesViewProps> = ({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddService,
  onUpdateService,
  onDeleteService,
  onToggleServiceDone,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [selectedServices, setSelectedServices] = useState<Record<string, Record<string, boolean>>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<TechnicianServiceCard | null>(null);
  const [cardForm, setCardForm] = useState({
    technicianName: '',
    technicianPhone: '',
    technicianPix: ''
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [activeCardIdForService, setActiveCardIdForService] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<TechnicianServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    clientName: '',
    clientPhone: '',
    serviceDescription: '',
    repasseValue: '',
    location: '',
    notes: '',
    isCompleted: false
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'card' | 'service';
    cardId: string;
    serviceId?: string;
    title: string;
  } | null>(null);

  // WhatsApp Preview Modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    technicianName: string;
    phone: string;
    messageText: string;
  }>({
    isOpen: false,
    technicianName: '',
    phone: '',
    messageText: ''
  });

  // Calculate Overall Statistics
  const overallStats = useMemo(() => {
    let totalValue = 0;
    let completedValue = 0;
    let pendingValue = 0;
    let totalServices = 0;
    let completedServices = 0;
    let pendingServices = 0;

    cards.forEach(card => {
      card.services.forEach(srv => {
        const val = Number(srv.repasseValue) || 0;
        totalValue += val;
        totalServices++;
        if (srv.isCompleted) {
          completedValue += val;
          completedServices++;
        } else {
          pendingValue += val;
          pendingServices++;
        }
      });
    });

    return {
      totalValue,
      completedValue,
      pendingValue,
      totalServices,
      completedServices,
      pendingServices,
      techniciansCount: cards.length
    };
  }, [cards]);

  // Clean phone string for WhatsApp API
  const cleanPhone = (phone?: string): string => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    return digits;
  };

  // Toggle Collapse
  const toggleCollapse = (cardId: string) => {
    setCollapsedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Open Add Card Modal
  const handleOpenAddCard = () => {
    setEditingCard(null);
    setCardForm({ technicianName: '', technicianPhone: '', technicianPix: '' });
    setIsCardModalOpen(true);
  };

  // Open Edit Card Modal
  const handleOpenEditCard = (card: TechnicianServiceCard) => {
    setEditingCard(card);
    setCardForm({
      technicianName: card.technicianName,
      technicianPhone: card.technicianPhone || '',
      technicianPix: card.technicianPix || ''
    });
    setIsCardModalOpen(true);
  };

  // Save Card
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.technicianName.trim()) return;

    if (editingCard) {
      await onUpdateCard({
        ...editingCard,
        technicianName: cardForm.technicianName.trim(),
        technicianPhone: cardForm.technicianPhone.trim(),
        technicianPix: cardForm.technicianPix.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await onAddCard(
        cardForm.technicianName.trim(),
        cardForm.technicianPhone.trim(),
        cardForm.technicianPix.trim()
      );
    }
    setIsCardModalOpen(false);
  };

  // Open Add Service Modal
  const handleOpenAddService = (cardId: string) => {
    setActiveCardIdForService(cardId);
    setEditingService(null);
    setServiceForm({
      clientName: '',
      clientPhone: '',
      serviceDescription: '',
      repasseValue: '',
      location: 'Bancada',
      notes: '',
      isCompleted: false
    });
    setIsServiceModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditService = (cardId: string, service: TechnicianServiceItem) => {
    setActiveCardIdForService(cardId);
    setEditingService(service);
    setServiceForm({
      clientName: service.clientName,
      clientPhone: service.clientPhone,
      serviceDescription: service.serviceDescription,
      repasseValue: service.repasseValue.toString(),
      location: service.location,
      notes: service.notes || '',
      isCompleted: service.isCompleted
    });
    setIsServiceModalOpen(true);
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCardIdForService || !serviceForm.clientName.trim() || !serviceForm.serviceDescription.trim()) return;

    const repasseNum = parseFloat(serviceForm.repasseValue.replace(',', '.')) || 0;

    if (editingService) {
      await onUpdateService(activeCardIdForService, {
        ...editingService,
        clientName: serviceForm.clientName.trim(),
        clientPhone: serviceForm.clientPhone.trim(),
        serviceDescription: serviceForm.serviceDescription.trim(),
        repasseValue: repasseNum,
        location: serviceForm.location.trim() || 'Bancada',
        notes: serviceForm.notes.trim(),
        isCompleted: serviceForm.isCompleted,
        completedAt: serviceForm.isCompleted ? (editingService.completedAt || new Date().toISOString()) : null
      });
    } else {
      await onAddService(activeCardIdForService, {
        clientName: serviceForm.clientName.trim(),
        clientPhone: serviceForm.clientPhone.trim(),
        serviceDescription: serviceForm.serviceDescription.trim(),
        repasseValue: repasseNum,
        location: serviceForm.location.trim() || 'Bancada',
        notes: serviceForm.notes.trim()
      });
    }
    setIsServiceModalOpen(false);
  };

  // Toggle selection for bulk WhatsApp sending
  const toggleSelectService = (cardId: string, serviceId: string) => {
    setSelectedServices(prev => {
      const cardSelections = prev[cardId] || {};
      const current = !!cardSelections[serviceId];
      return {
        ...prev,
        [cardId]: {
          ...cardSelections,
          [serviceId]: !current
        }
      };
    });
  };

  // Select all or deselect all in a card
  const toggleSelectAllInCard = (card: TechnicianServiceCard) => {
    setSelectedServices(prev => {
      const cardSelections = prev[card.id] || {};
      const allSelected = card.services.length > 0 && card.services.every(s => cardSelections[s.id]);
      const updated: Record<string, boolean> = {};
      if (!allSelected) {
        card.services.forEach(s => { updated[s.id] = true; });
      }
      return {
        ...prev,
        [card.id]: updated
      };
    });
  };

  // FORMAT WHATSAPP MESSAGE: Single Service (1 a 1)
  const formatSingleServiceWhatsApp = (card: TechnicianServiceCard, service: TechnicianServiceItem): string => {
    let text = `🛠️ *REPASSE DE SERVIÇO*\n`;
    text += `👨‍🔧 *Técnico:* ${card.technicianName}\n`;
    text += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `-----------------------------------\n`;
    text += `👤 *Cliente:* ${service.clientName}\n`;
    if (service.clientPhone) text += `📱 *Celular:* ${service.clientPhone}\n`;
    text += `🔧 *Serviço a Fazer:* ${service.serviceDescription}\n`;
    text += `📍 *Local onde está:* ${service.location}\n`;
    text += `💵 *Valor do Repasse:* R$ ${service.repasseValue.toFixed(2).replace('.', ',')}\n`;
    text += `📊 *Status:* ${service.isCompleted ? '✅ CONCLUÍDO' : '⏳ A FAZER / PENDENTE'}\n`;
    if (service.notes) text += `📝 *Observação:* ${service.notes}\n`;
    text += `-----------------------------------\n`;
    text += `Por favor, confirme o recebimento do aparelho para iniciar o serviço.`;
    return text;
  };

  // FORMAT WHATSAPP MESSAGE: Multiple Services (All Pending or Selected)
  const formatMultipleServicesWhatsApp = (card: TechnicianServiceCard, servicesList: TechnicianServiceItem[], title: string): string => {
    const total = servicesList.reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
    let text = `📋 *${title.toUpperCase()}*\n`;
    text += `👨‍🔧 *Técnico Responsável:* ${card.technicianName}\n`;
    text += `📅 *Data de Envio:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `===================================\n`;
    text += `💰 *TOTAL DOS REPASSES: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
    text += `📦 *Quantidade de Serviços:* ${servicesList.length}\n`;
    text += `===================================\n\n`;

    servicesList.forEach((s, idx) => {
      text += `*${idx + 1}.* 👤 *${s.clientName}*\n`;
      if (s.clientPhone) text += `   📱 Celular: ${s.clientPhone}\n`;
      text += `   🔧 Serviço: ${s.serviceDescription}\n`;
      text += `   📍 Local: ${s.location}\n`;
      text += `   💵 Repasse: R$ ${s.repasseValue.toFixed(2).replace('.', ',')}\n`;
      text += `   Status: [ ${s.isCompleted ? '✅ CONCLUÍDO' : '⏳ A FAZER'} ]\n`;
      if (s.notes) text += `   📝 Obs: ${s.notes}\n`;
      text += `\n`;
    });

    if (card.technicianPix) {
      text += `💳 *Chave PIX:* ${card.technicianPix}\n\n`;
    }

    text += `Por favor, confira os aparelhos e valores dos repasses informados acima.`;
    return text;
  };

  // Dispatch WhatsApp
  const handleSendWhatsApp = (phone: string, text: string) => {
    const cleaned = cleanPhone(phone);
    const encoded = encodeURIComponent(text);
    const url = cleaned 
      ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Trigger Send Single Service (1 a 1)
  const handleTriggerSingleServiceSend = (card: TechnicianServiceCard, service: TechnicianServiceItem) => {
    const text = formatSingleServiceWhatsApp(card, service);
    setWhatsAppModal({
      isOpen: true,
      technicianName: card.technicianName,
      phone: card.technicianPhone || '',
      messageText: text
    });
  };

  // Trigger Send All Pending Services for Card
  const handleTriggerAllPendingSend = (card: TechnicianServiceCard) => {
    const pendingList = card.services.filter(s => !s.isCompleted);
    if (pendingList.length === 0) {
      alert('Não há nenhum serviço pendente (a fazer) para este técnico.');
      return;
    }
    const text = formatMultipleServicesWhatsApp(card, pendingList, `Serviços a Fazer (Repasses) - ${card.technicianName}`);
    setWhatsAppModal({
      isOpen: true,
      technicianName: card.technicianName,
      phone: card.technicianPhone || '',
      messageText: text
    });
  };

  // Trigger Send Selected Services
  const handleTriggerSelectedSend = (card: TechnicianServiceCard) => {
    const cardSelections = selectedServices[card.id] || {};
    const selectedList = card.services.filter(s => cardSelections[s.id]);
    if (selectedList.length === 0) {
      alert('Selecione ao menos 1 serviço nas caixinhas de seleção para enviar.');
      return;
    }
    const text = formatMultipleServicesWhatsApp(card, selectedList, `Serviços Selecionados - ${card.technicianName}`);
    setWhatsAppModal({
      isOpen: true,
      technicianName: card.technicianName,
      phone: card.technicianPhone || '',
      messageText: text
    });
  };

  // Copy text to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText('Copiado!');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Filtered Cards and Services
  const filteredCards = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return cards.map(card => {
      const filteredServices = card.services.filter(s => {
        // Status filter
        if (statusFilter === 'PENDING' && s.isCompleted) return false;
        if (statusFilter === 'COMPLETED' && !s.isCompleted) return false;

        // Search query
        if (!q) return true;
        return (
          card.technicianName.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.clientPhone.toLowerCase().includes(q) ||
          s.serviceDescription.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
        );
      });

      return {
        ...card,
        filteredServices
      };
    }).filter(card => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase().trim();
      return card.technicianName.toLowerCase().includes(q) || card.filteredServices.length > 0;
    });
  }, [cards, searchTerm, statusFilter]);

  return (
    <div className="flex-1 flex flex-col space-y-3 overflow-hidden pb-12">
      
      {/* 1. TOP STATS BAR (Repasses Gerais) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-[#161B2B] rounded-xl border border-indigo-500/30 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-md">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-white truncate">
              R$ {overallStats.totalValue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-slate-400 uppercase font-black truncate">
              Total Geral dos Repasses ({overallStats.totalServices})
            </div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-emerald-500/30 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-md">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-emerald-400 truncate">
              R$ {overallStats.completedValue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-slate-400 uppercase font-black truncate">
              Já Feitos / Concluídos ({overallStats.completedServices})
            </div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-amber-500/30 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-md">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-amber-400 truncate">
              R$ {overallStats.pendingValue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-slate-400 uppercase font-black truncate">
              A Fazer / Pendentes ({overallStats.pendingServices})
            </div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-purple-500/30 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-md">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-purple-400 truncate">
              {overallStats.techniciansCount}
            </div>
            <div className="text-[9px] text-slate-400 uppercase font-black truncate">
              Técnicos com Cards
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & ACTION HEADER */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center bg-[#161B2B] p-2.5 rounded-xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por técnico, cliente, celular, serviço ou local..."
              className="w-full bg-[#0B1221] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded cursor-pointer shrink-0"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              A Fazer
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Já Feitos
            </button>
          </div>

          {/* Button: + Novo Card de Técnico */}
          <button
            onClick={handleOpenAddCard}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> + Novo Card de Técnico
          </button>
        </div>
      </div>

      {/* 3. TECHNICIAN CARDS LIST */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        {filteredCards.length === 0 ? (
          <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-10 text-center shadow-xl flex flex-col items-center justify-center">
            <Wrench className="w-14 h-14 text-slate-600 mb-3" />
            <h3 className="text-base font-black text-white mb-1">Nenhum Card de Técnico Cadastrado</h3>
            <p className="text-slate-400 max-w-md mx-auto text-xs mb-5">
              Crie cards para organizar os serviços repassados aos seus técnicos parceiros ou de bancada. Adicione os clientes, serviços, locais onde estão e envie as listas com 1 clique no WhatsApp Business!
            </p>
            <button
              onClick={handleOpenAddCard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Card de Técnico
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredCards.map(card => {
              const services = card.services;
              const cardTotal = services.reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
              const cardDone = services.filter(s => s.isCompleted).reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
              const cardPending = services.filter(s => !s.isCompleted).reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);

              const doneCount = services.filter(s => s.isCompleted).length;
              const pendingCount = services.filter(s => !s.isCompleted).length;
              const isCollapsed = !!collapsedCards[card.id];

              const cardSelections = selectedServices[card.id] || {};
              const selectedCount = services.filter(s => cardSelections[s.id]).length;
              const allSelected = services.length > 0 && selectedCount === services.length;

              return (
                <div 
                  key={card.id}
                  className="bg-[#161B2B] rounded-2xl border border-slate-800 hover:border-slate-700/80 p-3.5 sm:p-4 flex flex-col shadow-xl transition-all gap-3"
                >
                  {/* Card Header: Technician Info & Top Actions */}
                  <div>
                    <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-black text-white truncate" title={card.technicianName}>
                              {card.technicianName}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
                            </span>
                          </div>
                          {card.technicianPhone ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {card.technicianPhone}
                              </span>
                              {card.technicianPix && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                  • PIX: {card.technicianPix}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">Sem telefone informado</span>
                          )}
                        </div>
                      </div>

                      {/* Header controls: Add Service, Edit, Delete, Collapse */}
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <button
                          onClick={() => handleOpenAddService(card.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                          title="Apontar novo serviço para este técnico"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Serviço
                        </button>
                        <button
                          onClick={() => handleOpenEditCard(card)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                          title="Editar Card do Técnico"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({
                            type: 'card',
                            cardId: card.id,
                            title: `Deseja realmente excluir o Card do técnico "${card.technicianName}" e todos os seus ${services.length} serviços cadastrados?`
                          })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Excluir Card do Técnico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleCollapse(card.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          title={isCollapsed ? 'Expandir' : 'Recolher'}
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* VALORES DO REPASSE NO CARD (Total Geral, Já Feito, A Fazer) */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 bg-[#0E1526] p-2 rounded-xl border border-slate-800/80">
                      <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-indigo-500/30 min-w-0 flex flex-col justify-center">
                        <div className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-300 flex items-center gap-1 truncate">
                          <DollarSign className="w-2.5 h-2.5 shrink-0" /> Total Repasses
                        </div>
                        <div className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
                          R$ {cardTotal.toFixed(2).replace('.', ',')}
                        </div>
                        <span className="text-[8px] text-slate-400 block truncate">{services.length} peças/srv</span>
                      </div>

                      <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-emerald-500/30 min-w-0 flex flex-col justify-center">
                        <div className="text-[8px] sm:text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Já Feito
                        </div>
                        <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5 truncate">
                          R$ {cardDone.toFixed(2).replace('.', ',')}
                        </div>
                        <span className="text-[8px] text-slate-400 block truncate">{doneCount} concluído{doneCount !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="bg-[#161B2B] px-2 py-1.5 rounded-lg border border-amber-500/30 min-w-0 flex flex-col justify-center">
                        <div className="text-[8px] sm:text-[9px] font-black uppercase text-amber-400 flex items-center gap-1 truncate">
                          <Clock className="w-2.5 h-2.5 shrink-0" /> A Fazer
                        </div>
                        <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 truncate">
                          R$ {cardPending.toFixed(2).replace('.', ',')}
                        </div>
                        <span className="text-[8px] text-slate-400 block truncate">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* WHATSAPP ACTION BUTTONS & BULK CONTROLS */}
                  {!isCollapsed && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSelectAllInCard(card)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {allSelected ? <CheckSquare className="w-3 h-3 text-indigo-400" /> : <Square className="w-3 h-3 text-slate-500" />}
                          <span>{allSelected ? 'Desmarcar' : 'Marcar Todos'}</span>
                        </button>
                        {selectedCount > 0 && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {selectedCount} marcado{selectedCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Send Selected */}
                        {selectedCount > 0 && (
                          <button
                            onClick={() => handleTriggerSelectedSend(card)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                            title="Enviar serviços marcados no WhatsApp"
                          >
                            <Send className="w-3 h-3" /> Enviar Marcados ({selectedCount})
                          </button>
                        )}

                        {/* Send All Pending (A Fazer) */}
                        <button
                          onClick={() => handleTriggerAllPendingSend(card)}
                          disabled={pendingCount === 0}
                          className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                          title="Enviar todos os serviços a fazer para o WhatsApp do técnico"
                        >
                          <Send className="w-3 h-3" /> Enviar A Fazer ({pendingCount})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SERVICES LIST INSIDE THE CARD */}
                  {!isCollapsed && (
                    <div className="space-y-2 mt-1">
                      {card.filteredServices.length === 0 ? (
                        <div className="bg-[#0B1221] rounded-xl p-6 text-center border border-slate-800">
                          <p className="text-xs text-slate-500 italic">
                            {services.length === 0 
                              ? 'Nenhum serviço apontado para este técnico ainda.' 
                              : 'Nenhum serviço corresponde ao filtro ou busca.'}
                          </p>
                          <button
                            onClick={() => handleOpenAddService(card.id)}
                            className="mt-2.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Apontar Serviço
                          </button>
                        </div>
                      ) : (
                        card.filteredServices.map((srv, idx) => {
                          const isSelected = !!cardSelections[srv.id];
                          return (
                            <div 
                              key={srv.id}
                              className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                                srv.isCompleted 
                                  ? 'bg-[#0B1221]/80 border-emerald-500/30 hover:border-emerald-500/50' 
                                  : 'bg-[#111726] border-slate-800 hover:border-indigo-500/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  {/* Checkbox to select for bulk WhatsApp sending */}
                                  <button
                                    onClick={() => toggleSelectService(card.id, srv.id)}
                                    className="mt-0.5 text-slate-500 hover:text-white cursor-pointer"
                                    title="Marcar para envio no WhatsApp"
                                  >
                                    {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-black text-slate-400 font-mono">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-xs font-black text-white truncate" title={srv.clientName}>
                                        {srv.clientName}
                                      </span>
                                      {srv.clientPhone && (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-medium">
                                          • <Phone className="w-2.5 h-2.5" /> {srv.clientPhone}
                                        </span>
                                      )}
                                    </div>

                                    {/* Service Description */}
                                    <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                                      <Wrench className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span className="break-words">{srv.serviceDescription}</span>
                                    </div>

                                    {/* Location & Notes */}
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                                      <span className="inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                        <MapPin className="w-2.5 h-2.5 text-rose-400" /> {srv.location || 'Bancada'}
                                      </span>
                                      {srv.notes && (
                                        <span className="text-slate-400 italic line-clamp-1" title={srv.notes}>
                                          Obs: {srv.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Repasse Value */}
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Repasse</span>
                                  <span className="text-xs sm:text-sm font-black text-emerald-400 block">
                                    R$ {srv.repasseValue.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>

                              {/* Footer of item: Toggle Completed + 1 a 1 WhatsApp + Edit + Delete */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 flex-wrap gap-1.5">
                                {/* Checkbox / Button to mark as Feito */}
                                <button
                                  onClick={() => onToggleServiceDone(card.id, srv.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                    srv.isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                  title="Clique para alternar entre Feito e A Fazer"
                                >
                                  {srv.isCompleted ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> JÁ FEITO (CONCLUÍDO)
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-400" /> MARCAR COMO FEITO
                                    </>
                                  )}
                                </button>

                                {/* Action Buttons: WhatsApp 1 a 1, Edit, Delete */}
                                <div className="flex items-center gap-1">
                                  {/* Send 1 a 1 WhatsApp */}
                                  <button
                                    onClick={() => handleTriggerSingleServiceSend(card, srv)}
                                    className="px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Mandar este serviço individual (1 a 1) no WhatsApp do técnico"
                                  >
                                    <Send className="w-2.5 h-2.5" /> Mandar 1 a 1
                                  </button>

                                  <button
                                    onClick={() => handleOpenEditService(card.id, srv)}
                                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    title="Editar Serviço"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setConfirmDelete({
                                      type: 'service',
                                      cardId: card.id,
                                      serviceId: srv.id,
                                      title: `Deseja realmente apagar o serviço de "${srv.clientName}" (${srv.serviceDescription})?`
                                    })}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    title="Apagar Serviço"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Criar / Editar Card de Técnico */}
      {/* ------------------------------------------------------------- */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-2xl w-full max-w-md shadow-2xl flex flex-col border border-slate-700/60 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {editingCard ? 'Editar Card do Técnico' : 'Novo Card de Técnico'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Organize os serviços e repasses por profissional</p>
                </div>
              </div>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Nome do Técnico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Bancada, Marcos Placas, Técnico Lucas..."
                  value={cardForm.technicianName}
                  onChange={e => setCardForm({ ...cardForm, technicianName: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  WhatsApp / Celular do Técnico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 98765-4321"
                  value={cardForm.technicianPhone}
                  onChange={e => setCardForm({ ...cardForm, technicianPhone: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                />
                <span className="text-[9px] text-slate-500 mt-0.5 block">Usado para enviar os serviços com 1 clique</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Chave PIX do Técnico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: pix@tecnico.com ou CPF"
                  value={cardForm.technicianPix}
                  onChange={e => setCardForm({ ...cardForm, technicianPix: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Apontar / Editar Serviço no Card */}
      {/* ------------------------------------------------------------- */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col border border-slate-700/60 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {editingService ? 'Editar Serviço' : 'Apontar Novo Serviço no Card'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Preencha os dados do cliente, serviço, repasse e localização</p>
                </div>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Oliveira"
                    value={serviceForm.clientName}
                    onChange={e => setServiceForm({ ...serviceForm, clientName: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Celular do Cliente (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 97654-3210"
                    value={serviceForm.clientPhone}
                    onChange={e => setServiceForm({ ...serviceForm, clientPhone: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Serviço a Ser Feito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de Tela Moto G22, Troca Conector Tipo C, Reparo Placa..."
                  value={serviceForm.serviceDescription}
                  onChange={e => setServiceForm({ ...serviceForm, serviceDescription: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Valor do Repasse (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 50,00 ou 80"
                    value={serviceForm.repasseValue}
                    onChange={e => setServiceForm({ ...serviceForm, repasseValue: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 focus:border-emerald-500 outline-none font-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Local Onde Tá *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bancada 1, Gaveta 2, Caixa Entrada..."
                    value={serviceForm.location}
                    onChange={e => setServiceForm({ ...serviceForm, location: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                  {/* Quick location tags */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {['Bancada 1', 'Bancada 2', 'Gaveta 1', 'Gaveta 2', 'Prateleira'].map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setServiceForm(prev => ({ ...prev, location: loc }))}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Observações / Detalhes (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Peça já comprada na caixa; Testar biometria após trocar..."
                  value={serviceForm.notes}
                  onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {editingService && (
                <div className="p-2.5 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Status do Serviço:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceForm.isCompleted}
                      onChange={e => setServiceForm({ ...serviceForm, isCompleted: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className={`text-xs font-black ${serviceForm.isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {serviceForm.isCompleted ? '✓ JÁ FEITO (CONCLUÍDO)' : '⏳ A FAZER (PENDENTE)'}
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingService ? 'Salvar Alterações' : 'Adicionar ao Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Enviar WhatsApp com Preview e Cópia */}
      {/* ------------------------------------------------------------- */}
      {whatsAppModal.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col border border-emerald-500/30 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Enviar Repasse de Serviços no WhatsApp
                  </h3>
                  <p className="text-[10px] text-slate-400">Técnico: {whatsAppModal.technicianName}</p>
                </div>
              </div>
              <button 
                onClick={() => setWhatsAppModal({ isOpen: false, technicianName: '', phone: '', messageText: '' })}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Número do WhatsApp / WhatsApp Business do Técnico
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 98765-4321 ou deixe vazio para escolher o contato no WhatsApp"
                  value={whatsAppModal.phone}
                  onChange={e => setWhatsAppModal({ ...whatsAppModal, phone: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Texto Formatado que será Enviado
                  </label>
                  <button
                    onClick={() => handleCopyText(whatsAppModal.messageText)}
                    className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" /> {copiedText}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copiar Texto
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={9}
                  readOnly
                  value={whatsAppModal.messageText}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none custom-scrollbar"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsAppModal.messageText)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsAppModal({ isOpen: false, technicianName: '', phone: '', messageText: '' })}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendWhatsApp(whatsAppModal.phone, whatsAppModal.messageText);
                      setWhatsAppModal({ isOpen: false, technicianName: '', phone: '', messageText: '' });
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Abrir no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ------------------------------------------------------------- */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161B2B] rounded-2xl w-full max-w-sm p-4 border border-rose-500/40 shadow-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-white">Confirmação de Exclusão</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDelete.title}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (confirmDelete.type === 'card') {
                    await onDeleteCard(confirmDelete.cardId);
                  } else if (confirmDelete.type === 'service' && confirmDelete.serviceId) {
                    await onDeleteService(confirmDelete.cardId, confirmDelete.serviceId);
                  }
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
