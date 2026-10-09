import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, User, Phone, MapPin, DollarSign, CheckCircle2, 
  Send, Trash2, Edit2, Plus, Search, CheckSquare, 
  X, Check, AlertCircle, Clock, Copy, Smartphone, ShieldCheck
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTenantId } from '../../services/firestoreService';
import { setRamItem, getRamItem } from '../../services/storage';

export interface TechnicianServiceItem {
  id: string;
  clientName: string;
  deviceModel: string; // APARELHO
  serviceDescription: string; // SERVIÇO
  deviceLocation: string; // LOCAL ONDE TÁ
  isCompleted: boolean; // STATUS (A Fazer / Feito)
  status?: 'A_FAZER' | 'FALTA_A_PAGAR' | 'FEITO';
  repasseValue: number; // VALOR DO REPASSE
  costValue?: number; // VALOR DE CUSTO
  obs?: string; // OBSERVAÇÃO (Opcional - só sai na mensagem se preenchido)
  clientPhone?: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface TechnicianCard {
  id: string;
  technicianName: string;
  technicianPhone?: string;
  notes?: string;
  createdAt: string;
  services: TechnicianServiceItem[];
}

const STORAGE_KEY_TECH_CARDS = 'msp_technician_service_cards_v2';

export const formatServiceWhatsAppText = (
  technicianName: string,
  items: TechnicianServiceItem[],
  cardNotes?: string
): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');

  let text = `🛠️ *ORDEM DE SERVIÇO - TÉCNICO: ${technicianName.toUpperCase()}* 👨‍🔧\n`;
  text += `📅 *Data:* ${dateStr}\n`;
  if (cardNotes && cardNotes.trim()) {
    text += `📌 *Bancada / Técnico:* ${cardNotes.trim()}\n`;
  }
  text += `-----------------------------------\n\n`;

  let totalRepasse = 0;

  items.forEach((item, index) => {
    const statusEmoji = item.isCompleted ? '✅' : '⏳';
    const statusText = item.isCompleted ? 'Feito (Concluído)' : 'A Fazer (Pendente)';
    const itemRepasse = Number(item.repasseValue) || 0;

    if (items.length > 1) {
      text += `*${index + 1}️⃣* 📱 *${(item.deviceModel || 'Aparelho').toUpperCase()}*\n`;
    }
    text += `👤 *CLIENTE:* ${item.clientName || 'Não informado'}\n`;
    text += `📱 *APARELHO:* ${item.deviceModel || 'Não informado'}\n`;
    text += `🔧 *SERVIÇO:* ${item.serviceDescription || 'Não informado'}\n`;
    text += `📍 *LOCAL ONDE TÁ:* ${item.deviceLocation || 'Bancada'}\n`;
    text += `⚡ *STATUS:* ${statusEmoji} ${statusText}\n`;
    text += `💵 *VALOR DO REPASSE:* R$ ${itemRepasse.toFixed(2).replace('.', ',')}\n`;

    // SÓ APARECE NA MENSAGEM SE TIVER ALGO PREENCHIDO
    if (item.obs && item.obs.trim()) {
      text += `📝 *OBS:* ${item.obs.trim()}\n`;
    }
    text += `\n`;

    totalRepasse += itemRepasse;
  });

  text += `-----------------------------------\n`;
  text += `💰 *VALOR TOTAL DO REPASSE: R$ ${totalRepasse.toFixed(2).replace('.', ',')}*\n`;
  text += `-----------------------------------\n`;
  text += `🤝 *Por favor, confira os serviços acima e confirme o recebimento.*`;

  return text;
};

export const TechnicianServicesView: React.FC = () => {
  // Safe initial state loaded synchronously from RAM store or localStorage
  const [cards, setCards] = useState<TechnicianCard[]>(() => {
    const inRam = getRamItem<TechnicianCard[]>(STORAGE_KEY_TECH_CARDS, []);
    if (inRam && inRam.length > 0) return inRam;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const local = window.localStorage.getItem(STORAGE_KEY_TECH_CARDS);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [
      {
        id: 'card_demo_1',
        technicianName: 'Técnico Principal',
        technicianPhone: '',
        notes: 'Bancada 1',
        createdAt: new Date().toISOString(),
        services: [
          {
            id: 'serv_1',
            clientName: 'Marcos Oliveira',
            deviceModel: 'iPhone 11',
            serviceDescription: 'Troca de Tela',
            deviceLocation: 'Bancada 1',
            isCompleted: false,
            repasseValue: 50.00,
            clientPhone: '',
            createdAt: new Date().toISOString(),
            completedAt: null
          }
        ]
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'A_FAZER' | 'FALTA_A_PAGAR' | 'FEITO' | 'TODOS'>('A_FAZER');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Selected services per card for targeted WhatsApp sending
  const [selectedForSend, setSelectedForSend] = useState<Record<string, string[]>>({});

  // Modals state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<TechnicianCard | null>(null);
  const [cardForm, setCardForm] = useState({
    technicianName: '',
    technicianPhone: '',
    notes: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [targetCardIdForService, setTargetCardIdForService] = useState<string>('');
  const [editingService, setEditingService] = useState<TechnicianServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    clientName: '',
    deviceModel: '',
    serviceDescription: '',
    deviceLocation: '',
    isCompleted: false,
    repasseValue: '',
    costValue: '',
    obs: '',
    clientPhone: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  // WhatsApp Send Modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    card: TechnicianCard | null;
    servicesToSend: TechnicianServiceItem[];
    targetPhone: string;
    sendMode: 'SINGLE' | 'PENDING' | 'SELECTED' | 'ALL';
  }>({
    isOpen: false,
    card: null,
    servicesToSend: [],
    targetPhone: '',
    sendMode: 'ALL'
  });

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getUserAccountEmail = (): string => {
    const tenant = getTenantId();
    if (tenant === 'msp404011@gmail.com' || tenant === 'mmspmartins62@gmail.com') {
      return 'mmspmartins62@gmail.com';
    }
    return tenant;
  };

  // Sync with Firestore
  useEffect(() => {
    const userEmail = getUserAccountEmail();
    let isSubscribed = true;

    try {
      const cardsRef = collection(db, `accounts/${userEmail}/technician_service_cards`);
      const unsub = onSnapshot(cardsRef, (snapshot) => {
        if (!isSubscribed) return;
        if (!snapshot.empty) {
          const loaded: TechnicianCard[] = [];
          snapshot.forEach(d => {
            const data = d.data();
            loaded.push({
              id: d.id,
              technicianName: data.technicianName || 'Técnico',
              technicianPhone: data.technicianPhone || '',
              notes: data.notes || '',
              createdAt: data.createdAt || new Date().toISOString(),
              services: Array.isArray(data.services) ? data.services.map((s: any) => {
                let st = s.status;
                if (!st) {
                  if (s.isCompleted || s.status === 'Feito') st = 'FEITO';
                  else st = 'A_FAZER';
                }
                return {
                  id: s.id || `s_${Date.now()}`,
                  clientName: s.clientName || '',
                  deviceModel: s.deviceModel || s.aparelho || '',
                  serviceDescription: s.serviceDescription || s.servico || '',
                  deviceLocation: s.deviceLocation || s.local || '',
                  isCompleted: Boolean(s.isCompleted || st === 'FEITO'),
                  status: st,
                  repasseValue: Number(s.repasseValue || s.repasse) || 0,
                  clientPhone: s.clientPhone || s.celular || '',
                  createdAt: s.createdAt || new Date().toISOString(),
                  completedAt: s.completedAt || null
                };
              }) : []
            });
          });
          loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setCards(loaded);
          setRamItem(STORAGE_KEY_TECH_CARDS, loaded);
          try {
            localStorage.setItem(STORAGE_KEY_TECH_CARDS, JSON.stringify(loaded));
          } catch (_) {}
        }
      }, (err) => {
        console.warn('Technician cards sync warning:', err.message);
      });

      return () => {
        isSubscribed = false;
        unsub();
      };
    } catch (e) {
      console.warn('Firestore subscription error:', e);
    }
  }, []);

  const saveCardsLocallyAndRemote = async (updatedList: TechnicianCard[], actionFn?: () => Promise<void>) => {
    setCards(updatedList);
    setRamItem(STORAGE_KEY_TECH_CARDS, updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_TECH_CARDS, JSON.stringify(updatedList));
    } catch (_) {}

    if (actionFn) {
      try {
        await actionFn();
      } catch (err) {
        console.warn('Remote sync non-blocking notice:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // CARD CRUD
  // -------------------------------------------------------------
  const handleOpenNewCard = () => {
    setEditingCard(null);
    setCardForm({
      technicianName: '',
      technicianPhone: '',
      notes: '',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: TechnicianCard) => {
    let dateStr = new Date().toISOString().split('T')[0];
    if (card.createdAt) {
      if (card.createdAt.includes('T')) {
        dateStr = card.createdAt.split('T')[0];
      } else {
        const parsed = new Date(card.createdAt);
        if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString().split('T')[0];
      }
    }
    setEditingCard(card);
    setCardForm({
      technicianName: card.technicianName || '',
      technicianPhone: card.technicianPhone || '',
      notes: card.notes || '',
      createdAt: dateStr
    });
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = cardForm.technicianName.trim();
    if (!name) {
      showToast('Por favor, informe o nome do técnico.', 'error');
      return;
    }

    const userEmail = getUserAccountEmail();
    const finalCreatedAt = cardForm.createdAt
      ? (cardForm.createdAt.includes('T') ? cardForm.createdAt : `${cardForm.createdAt}T12:00:00.000Z`)
      : (editingCard?.createdAt || new Date().toISOString());

    if (editingCard) {
      const updated = cards.map(c => {
        if (c.id === editingCard.id) {
          return {
            ...c,
            technicianName: name,
            technicianPhone: cardForm.technicianPhone.trim(),
            notes: cardForm.notes.trim(),
            createdAt: finalCreatedAt
          };
        }
        return c;
      });

      await saveCardsLocallyAndRemote(updated, async () => {
        const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, editingCard.id);
        await setDoc(docRef, {
          technicianName: name,
          technicianPhone: cardForm.technicianPhone.trim(),
          notes: cardForm.notes.trim(),
          createdAt: finalCreatedAt
        }, { merge: true });
      });

      showToast(`Card do técnico "${name}" atualizado!`);
    } else {
      const newCardId = `card_tech_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newCard: TechnicianCard = {
        id: newCardId,
        technicianName: name,
        technicianPhone: cardForm.technicianPhone.trim(),
        notes: cardForm.notes.trim(),
        createdAt: finalCreatedAt,
        services: []
      };

      const updated = [newCard, ...cards];
      await saveCardsLocallyAndRemote(updated, async () => {
        const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, newCardId);
        await setDoc(docRef, newCard);
      });

      showToast(`Card de "${name}" criado com sucesso!`);
    }

    setIsCardModalOpen(false);
  };

  const handleDeleteCard = (card: TechnicianCard) => {
    setConfirmDialog({
      message: `Tem certeza que deseja apagar o card do técnico "${card.technicianName}" e todos os serviços deste card?`,
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const updated = cards.filter(c => c.id !== card.id);
        await saveCardsLocallyAndRemote(updated, async () => {
          const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, card.id);
          await deleteDoc(docRef);
        });
        showToast(`Card de "${card.technicianName}" removido.`);
      }
    });
  };

  // -------------------------------------------------------------
  // SERVICE ITEM CRUD
  // -------------------------------------------------------------
  const handleOpenAddService = (cardId?: string) => {
    if (cards.length === 0) {
      handleOpenNewCard();
      showToast('Crie primeiro o card de um técnico para poder adicionar serviços.', 'error');
      return;
    }

    const targetId = cardId || cards[0].id;
    setTargetCardIdForService(targetId);
    setEditingService(null);
    setServiceForm({
      clientName: '',
      deviceModel: '',
      serviceDescription: '',
      deviceLocation: '',
      isCompleted: false,
      repasseValue: '',
      costValue: '',
      obs: '',
      clientPhone: '',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (cardId: string, service: TechnicianServiceItem) => {
    let dateStr = new Date().toISOString().split('T')[0];
    if (service.createdAt) {
      if (service.createdAt.includes('T')) {
        dateStr = service.createdAt.split('T')[0];
      } else {
        const parsed = new Date(service.createdAt);
        if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString().split('T')[0];
      }
    }
    setTargetCardIdForService(cardId);
    setEditingService(service);
    setServiceForm({
      clientName: service.clientName || '',
      deviceModel: service.deviceModel || '',
      serviceDescription: service.serviceDescription || '',
      deviceLocation: service.deviceLocation || '',
      isCompleted: Boolean(service.isCompleted),
      repasseValue: service.repasseValue ? String(service.repasseValue) : '',
      costValue: service.costValue ? String(service.costValue) : '',
      obs: service.obs || '',
      clientPhone: service.clientPhone || '',
      createdAt: dateStr
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCardIdForService) {
      showToast('Selecione o técnico para vincular o serviço.', 'error');
      return;
    }

    const client = serviceForm.clientName.trim();
    const model = serviceForm.deviceModel.trim();
    const serviceDesc = serviceForm.serviceDescription.trim();
    const location = serviceForm.deviceLocation.trim();

    if (!client) {
      showToast('Informe o nome do Cliente.', 'error');
      return;
    }
    if (!model) {
      showToast('Informe o Aparelho / Modelo.', 'error');
      return;
    }
    if (!serviceDesc) {
      showToast('Informe o Serviço a ser feito.', 'error');
      return;
    }

    const repVal = parseFloat(serviceForm.repasseValue.replace(',', '.')) || 0;
    const costVal = parseFloat(serviceForm.costValue.replace(',', '.')) || 0;
    const userEmail = getUserAccountEmail();
    const now = new Date().toISOString();
    const finalCreatedAt = serviceForm.createdAt
      ? (serviceForm.createdAt.includes('T') ? serviceForm.createdAt : `${serviceForm.createdAt}T12:00:00.000Z`)
      : (editingService?.createdAt || now);

    const targetCard = cards.find(c => c.id === targetCardIdForService);
    if (!targetCard) return;

    let updatedServices: TechnicianServiceItem[];

    if (editingService) {
      updatedServices = targetCard.services.map(s => {
        if (s.id === editingService.id) {
          const wasCompleted = s.isCompleted;
          const isNowCompleted = serviceForm.isCompleted;
          return {
            ...s,
            clientName: client,
            deviceModel: model,
            serviceDescription: serviceDesc,
            deviceLocation: location || 'Bancada',
            isCompleted: isNowCompleted,
            repasseValue: repVal,
            costValue: costVal,
            obs: serviceForm.obs.trim(),
            clientPhone: serviceForm.clientPhone.trim(),
            createdAt: finalCreatedAt,
            completedAt: isNowCompleted ? (wasCompleted ? s.completedAt : now) : null
          };
        }
        return s;
      });
    } else {
      const newService: TechnicianServiceItem = {
        id: `serv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientName: client,
        deviceModel: model,
        serviceDescription: serviceDesc,
        deviceLocation: location || 'Bancada',
        isCompleted: serviceForm.isCompleted,
        repasseValue: repVal,
        costValue: costVal,
        obs: serviceForm.obs.trim(),
        clientPhone: serviceForm.clientPhone.trim(),
        createdAt: finalCreatedAt,
        completedAt: serviceForm.isCompleted ? now : null
      };
      updatedServices = [...targetCard.services, newService];
    }

    const updatedCards = cards.map(c => {
      if (c.id === targetCardIdForService) {
        return {
          ...c,
          services: updatedServices
        };
      }
      return c;
    });

    await saveCardsLocallyAndRemote(updatedCards, async () => {
      const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, targetCardIdForService);
      await setDoc(docRef, { services: updatedServices }, { merge: true });
    });

    showToast(editingService ? 'Serviço atualizado com sucesso!' : 'Serviço adicionado com sucesso!');
    setIsServiceModalOpen(false);
  };

  const handleAdvanceServiceStatus = async (cardId: string, serviceId: string) => {
    const userEmail = getUserAccountEmail();
    const now = new Date().toISOString();

    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    let updatedMsg = '';
    const updatedServices = targetCard.services.map(s => {
      if (s.id === serviceId) {
        const curStatus = s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER');
        let nextStatus: 'A_FAZER' | 'FALTA_A_PAGAR' | 'FEITO' = 'FALTA_A_PAGAR';
        let isComp = false;

        if (curStatus === 'A_FAZER') {
          nextStatus = 'FALTA_A_PAGAR';
          isComp = false;
          updatedMsg = 'Serviço concluído! Movido para Falta a Pagar';
        } else if (curStatus === 'FALTA_A_PAGAR') {
          nextStatus = 'FEITO';
          isComp = true;
          updatedMsg = 'Pago! Movido para Feito';
        } else {
          nextStatus = 'A_FAZER';
          isComp = false;
          updatedMsg = 'Retornado para A Fazer';
        }

        return {
          ...s,
          status: nextStatus,
          isCompleted: isComp,
          completedAt: isComp ? (s.completedAt || now) : null
        };
      }
      return s;
    });

    const updatedCards = cards.map(c => {
      if (c.id === cardId) {
        return { ...c, services: updatedServices };
      }
      return c;
    });

    await saveCardsLocallyAndRemote(updatedCards, async () => {
      const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, cardId);
      await setDoc(docRef, { services: updatedServices }, { merge: true });
    });

    showToast(updatedMsg, 'success');
  };

  const handleDeleteService = (cardId: string, service: TechnicianServiceItem) => {
    setConfirmDialog({
      message: `Deseja realmente apagar o serviço "${service.serviceDescription}" (${service.deviceModel}) do cliente "${service.clientName}"?`,
      onConfirm: async () => {
        const userEmail = getUserAccountEmail();
        const targetCard = cards.find(c => c.id === cardId);
        if (!targetCard) return;

        const updatedServices = targetCard.services.filter(s => s.id !== service.id);
        const updatedCards = cards.map(c => {
          if (c.id === cardId) {
            return { ...c, services: updatedServices };
          }
          return c;
        });

        await saveCardsLocallyAndRemote(updatedCards, async () => {
          const docRef = doc(db, `accounts/${userEmail}/technician_service_cards`, cardId);
          await setDoc(docRef, { services: updatedServices }, { merge: true });
        });

        setSelectedForSend(prev => ({
          ...prev,
          [cardId]: (prev[cardId] || []).filter(id => id !== service.id)
        }));

        showToast('Serviço apagado com sucesso!');
      }
    });
  };

  // Toggle selection for WhatsApp multi-send
  const handleToggleSelectForSend = (cardId: string, serviceId: string) => {
    setSelectedForSend(prev => {
      const current = prev[cardId] || [];
      const exists = current.includes(serviceId);
      return {
        ...prev,
        [cardId]: exists ? current.filter(id => id !== serviceId) : [...current, serviceId]
      };
    });
  };

  const handleSelectAllForSend = (cardId: string, select: boolean) => {
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    setSelectedForSend(prev => ({
      ...prev,
      [cardId]: select ? targetCard.services.map(s => s.id) : []
    }));
  };

  // -------------------------------------------------------------
  // WHATSAPP BUSINESS SENDING
  // -------------------------------------------------------------
  const openWhatsAppSafely = (phone: string, text: string) => {
    // 1. Copy to clipboard
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
      showToast('Texto copiado e WhatsApp Business aberto!', 'success');
    } catch (e) {
      window.open(url, '_blank');
      showToast('Texto copiado para a área de transferência!', 'success');
    }
  };

  // Open 1 a 1 WhatsApp
  const handleOpenSingleWhatsApp = (card: TechnicianCard, service: TechnicianServiceItem) => {
    setWhatsAppModal({
      isOpen: true,
      card,
      servicesToSend: [service],
      targetPhone: card.technicianPhone || service.clientPhone || '',
      sendMode: 'SINGLE'
    });
  };

  // Open multi-send WhatsApp
  const handleOpenMultiWhatsApp = (card: TechnicianCard, mode: 'PENDING' | 'SELECTED' | 'ALL') => {
    let items: TechnicianServiceItem[] = [];
    if (mode === 'PENDING') {
      items = card.services.filter(s => !s.isCompleted);
      if (items.length === 0) {
        showToast('Não há serviços com status "A Fazer" para enviar!', 'error');
        return;
      }
    } else if (mode === 'SELECTED') {
      const selectedIds = selectedForSend[card.id] || [];
      items = card.services.filter(s => selectedIds.includes(s.id));
      if (items.length === 0) {
        showToast('Nenhum serviço foi marcado para envio na caixinha.', 'error');
        return;
      }
    } else {
      items = card.services;
      if (items.length === 0) {
        showToast('Este card não possui nenhum serviço cadastrado.', 'error');
        return;
      }
    }

    setWhatsAppModal({
      isOpen: true,
      card,
      servicesToSend: items,
      targetPhone: card.technicianPhone || '',
      sendMode: mode
    });
  };

  const handleConfirmSendWhatsApp = () => {
    if (!whatsAppModal.card || whatsAppModal.servicesToSend.length === 0) return;
    const text = formatServiceWhatsAppText(whatsAppModal.card.technicianName, whatsAppModal.servicesToSend, whatsAppModal.card.notes);
    openWhatsAppSafely(whatsAppModal.targetPhone, text);
    setWhatsAppModal({ isOpen: false, card: null, servicesToSend: [], targetPhone: '', sendMode: 'ALL' });
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return cards.map(card => {
      let filteredServices = card.services || [];
      if (filterStatus === 'A_FAZER') {
        filteredServices = filteredServices.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'A_FAZER');
      } else if (filterStatus === 'FALTA_A_PAGAR') {
        filteredServices = filteredServices.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FALTA_A_PAGAR');
      } else if (filterStatus === 'FEITO') {
        filteredServices = filteredServices.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FEITO');
      }

      if (q) {
        const matchesTechnician = card.technicianName.toLowerCase().includes(q) || (card.technicianPhone || '').includes(q);
        if (!matchesTechnician) {
          filteredServices = filteredServices.filter(s => 
            (s.clientName || '').toLowerCase().includes(q) ||
            (s.deviceModel || '').toLowerCase().includes(q) ||
            (s.serviceDescription || '').toLowerCase().includes(q) ||
            (s.deviceLocation || '').toLowerCase().includes(q)
          );
        }
      }

      return {
        ...card,
        filteredServices
      };
    }).filter(card => {
      if (!searchTerm && filterStatus === 'TODOS') return true;
      const q = searchTerm.toLowerCase();
      const matchesTech = card.technicianName.toLowerCase().includes(q);
      return matchesTech || card.filteredServices.length > 0;
    });
  }, [cards, searchTerm, filterStatus]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    let totalRepasses = 0;
    let totalFeito = 0;
    let totalFaltaPagar = 0;
    let totalAFazer = 0;
    let countTotal = 0;
    let countFeito = 0;
    let countFaltaPagar = 0;
    let countAFazer = 0;

    cards.forEach(c => {
      (c.services || []).forEach(s => {
        countTotal++;
        const val = Number(s.repasseValue) || 0;
        totalRepasses += val;
        const st = s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER');
        if (st === 'FEITO') {
          countFeito++;
          totalFeito += val;
        } else if (st === 'FALTA_A_PAGAR') {
          countFaltaPagar++;
          totalFaltaPagar += val;
        } else {
          countAFazer++;
          totalAFazer += val;
        }
      });
    });

    return { totalRepasses, totalFeito, totalFaltaPagar, totalAFazer, countTotal, countFeito, countFaltaPagar, countAFazer };
  }, [cards]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans text-slate-300">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[999] px-4 py-3 rounded-xl font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2 border ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500 text-emerald-200' 
            : 'bg-rose-950 border-rose-500 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-xs">{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Confirmação</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
        <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{cards.length}</div>
            <div className="text-[9px] text-slate-400 uppercase font-bold">Cards / Técnicos</div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-slate-800 p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-cyan-400">
              R$ {overallTotals.totalRepasses.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-slate-400 uppercase font-bold">Total Geral Repasses ({overallTotals.countTotal})</div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-emerald-500/30 p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-emerald-400">
              R$ {overallTotals.totalFeito.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-emerald-400 uppercase font-bold">Já Feito ({overallTotals.countFeito})</div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-purple-500/30 p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-purple-400">
              R$ {overallTotals.totalFaltaPagar.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-purple-400 uppercase font-bold">Falta a Pagar ({overallTotals.countFaltaPagar})</div>
          </div>
        </div>

        <div className="bg-[#161B2B] rounded-xl border border-amber-500/30 p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-amber-400">
              R$ {overallTotals.totalAFazer.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[9px] text-amber-400 uppercase font-bold">A Fazer ({overallTotals.countAFazer})</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters and New Card/Service Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-2 bg-[#161B2B] p-2 sm:p-2.5 rounded-xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar cliente, aparelho, serviço, local..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1221] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center bg-[#0B1221] p-1 rounded-lg border border-slate-800 text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('A_FAZER')}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'A_FAZER' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" /> A Fazer
            </button>
            <button
              onClick={() => setFilterStatus('FALTA_A_PAGAR')}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'FALTA_A_PAGAR' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3 h-3" /> Falta a Pagar
            </button>
            <button
              onClick={() => setFilterStatus('FEITO')}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'FEITO' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Feito
            </button>
            <button
              onClick={() => setFilterStatus('TODOS')}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                filterStatus === 'TODOS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleOpenAddService()}
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/25"
          >
            <Plus className="w-4 h-4" />
            <span className="truncate">+ Adicionar Serviço</span>
          </button>

          <button
            onClick={handleOpenNewCard}
            className="px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/25"
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">+ Novo Técnico</span>
          </button>
        </div>
      </div>

      {/* Falta a Pagar Active Tab Banner */}
      {filterStatus === 'FALTA_A_PAGAR' && (
        <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-purple-200 shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Resumo da Aba - Falta a Pagar:</span>
              <p className="text-[10px] text-purple-300/80">Estes serviços aguardam pagamento. Ao marcar como Pago, o valor é zerado desta aba e o item vai para Feito.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-400 font-bold uppercase">Total a Pagar</div>
            <div className="text-sm font-black text-purple-200">
              R$ {overallTotals.totalFaltaPagar.toFixed(2).replace('.', ',')} ({overallTotals.countFaltaPagar})
            </div>
          </div>
        </div>
      )}

      {/* Main Cards List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 min-h-0">
        {filteredCards.length === 0 ? (
          <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-10 text-center shadow-xl flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Wrench className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Nenhum card de técnico encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Crie um novo card de técnico para controlar os serviços (Cliente, Aparelho, Serviço, Local, Status e Repasse).
            </p>
            <button
              onClick={handleOpenNewCard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" /> Criar Card de Técnico
            </button>
          </div>
        ) : (
          filteredCards.map(card => {
            const services = card.services || [];
            const displayServices = card.filteredServices || [];

            // Card Totals
            const totalRepasse = services.reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
            const totalFeito = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FEITO').reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
            const totalFaltaPagar = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FALTA_A_PAGAR').reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
            const totalAFazer = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'A_FAZER').reduce((acc, s) => acc + (Number(s.repasseValue) || 0), 0);
            
            const doneCount = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FEITO').length;
            const faltaPagarCount = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'FALTA_A_PAGAR').length;
            const pendingCount = services.filter(s => (s.status || (s.isCompleted ? 'FEITO' : 'A_FAZER')) === 'A_FAZER').length;

            const selectedIds = selectedForSend[card.id] || [];
            const selectedCount = selectedIds.length;
            const allSelectedForSend = displayServices.length > 0 && displayServices.every(s => selectedIds.includes(s.id));

            return (
              <div 
                key={card.id} 
                className="bg-[#161B2B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all hover:border-slate-700 flex flex-col"
              >
                {/* Card Header Bar */}
                <div className="bg-[#1B2236] p-3 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
                  {/* Left: Tech Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                      {card.technicianName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white truncate">
                          {card.technicianName}
                        </h3>
                        {card.technicianPhone && (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {card.technicianPhone}
                          </span>
                        )}
                        {card.notes && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {card.notes}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{services.length} serviços</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{doneCount} feitos</span>
                        <span>•</span>
                        <span className="text-purple-400 font-bold">{faltaPagarCount} falta pagar</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{pendingCount} a fazer</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Financial Repasses Breakdown */}
                  <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
                    <div className="bg-[#0B1221] px-2 py-1 rounded-lg border border-slate-700/60 text-left">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Total Repasse</div>
                      <div className="text-xs font-black text-cyan-400">
                        R$ {totalRepasse.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div className="bg-[#0B1221] px-2 py-1 rounded-lg border border-emerald-500/30 text-left">
                      <div className="text-[9px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Já Feito
                      </div>
                      <div className="text-xs font-black text-emerald-400">
                        R$ {totalFeito.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div className="bg-[#0B1221] px-2 py-1 rounded-lg border border-purple-500/30 text-left">
                      <div className="text-[9px] text-purple-400 uppercase font-bold flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" /> Falta a Pagar
                      </div>
                      <div className="text-xs font-black text-purple-400">
                        R$ {totalFaltaPagar.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div className="bg-[#0B1221] px-2 py-1 rounded-lg border border-amber-500/30 text-left">
                      <div className="text-[9px] text-amber-400 uppercase font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> A Fazer
                      </div>
                      <div className="text-xs font-black text-amber-400">
                        R$ {totalAFazer.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto lg:ml-2">
                      {/* WhatsApp Buttons */}
                      <button
                        onClick={() => handleOpenMultiWhatsApp(card, 'PENDING')}
                        className="px-2.5 py-1.5 bg-[#00B86B] hover:bg-[#00a35e] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        title="Enviar serviços A Fazer para o WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp (A Fazer)</span>
                      </button>

                      {/* + Add Service to this Card */}
                      <button
                        onClick={() => handleOpenAddService(card.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        title="Adicionar serviço a este técnico"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Serviço</span>
                      </button>

                      {/* Edit Card Info */}
                      <button
                        onClick={() => handleOpenEditCard(card)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                        title="Editar técnico"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Card */}
                      <button
                        onClick={() => handleDeleteCard(card)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                        title="Apagar card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-bar for Multi-select controls */}
                <div className="bg-[#121624] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300 hover:text-white select-none">
                      <input 
                        type="checkbox" 
                        checked={allSelectedForSend}
                        onChange={(e) => handleSelectAllForSend(card.id, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 checked:bg-cyan-500 cursor-pointer"
                      />
                      <span>Marcar todos para envio</span>
                    </label>
                    {selectedCount > 0 && (
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        {selectedCount} selecionado(s)
                      </span>
                    )}
                  </div>

                  {selectedCount > 0 && (
                    <button
                      onClick={() => handleOpenMultiWhatsApp(card, 'SELECTED')}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Send className="w-3 h-3" /> Enviar apenas os marcados ({selectedCount})
                    </button>
                  )}
                </div>

                {/* Services Table List */}
                <div className="p-2 divide-y divide-slate-800/60">
                  {displayServices.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      {services.length === 0 
                        ? 'Nenhum serviço lançado para este técnico ainda. Clique em "+ Serviço" acima.'
                        : 'Nenhum serviço corresponde ao filtro aplicado.'}
                    </div>
                  ) : (
                    displayServices.map(service => {
                      const isSelected = selectedIds.includes(service.id);

                      return (
                        <div 
                          key={service.id}
                          className={`p-2.5 rounded-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                            service.isCompleted 
                              ? 'bg-emerald-950/10 hover:bg-emerald-950/20 border border-emerald-500/10' 
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          {/* Left: Selection, Status and Required Fields (CLIENTE, APARELHO, SERVIÇO, LOCAL ONDE TÁ, STATUS) */}
                          <div className="flex items-start md:items-center gap-2.5 min-w-0 flex-1">
                            {/* Checkbox for WhatsApp selection */}
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectForSend(card.id, service.id)}
                              title="Marcar para envio via WhatsApp"
                              className="mt-1 md:mt-0 w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 checked:bg-cyan-500 cursor-pointer shrink-0"
                            />

                            {/* Status Workflow Button */}
                            {(() => {
                              const st = service.status || (service.isCompleted ? 'FEITO' : 'A_FAZER');
                              if (st === 'A_FAZER') {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceServiceStatus(card.id, service.id)}
                                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                    title="Clique para marcar como Feito o Serviço (Vai para Falta a Pagar)"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Feito o Serviço</span>
                                  </button>
                                );
                              } else if (st === 'FALTA_A_PAGAR') {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceServiceStatus(card.id, service.id)}
                                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
                                    title="Clique para marcar como Pago (Vai para Feito)"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Pago</span>
                                  </button>
                                );
                              } else {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceServiceStatus(card.id, service.id)}
                                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 bg-emerald-500 text-white border-emerald-400 shadow-sm"
                                    title="Serviço Feito e Pago (Clique para reverter)"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Feito</span>
                                  </button>
                                );
                              }
                            })()}

                            {/* 4 Core Fields: CLIENTE, APARELHO, SERVIÇO, LOCAL ONDE TÁ + ESPAÇO DE OBS */}
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
                                {/* 1. CLIENTE */}
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Cliente</span>
                                  <span className="text-xs font-black text-white truncate block">
                                    {service.clientName || 'Não informado'}
                                  </span>
                                </div>

                                {/* 2. APARELHO */}
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                    <Smartphone className="w-2.5 h-2.5 text-indigo-400" /> Aparelho
                                  </span>
                                  <span className="text-xs font-bold text-indigo-300 truncate block">
                                    {service.deviceModel || 'Não informado'}
                                  </span>
                                </div>

                                {/* 3. SERVIÇO */}
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                    <Wrench className="w-2.5 h-2.5 text-amber-400" /> Serviço
                                  </span>
                                  <span className="text-xs font-bold text-slate-200 truncate block">
                                    {service.serviceDescription || 'Não informado'}
                                  </span>
                                </div>

                                {/* 4. LOCAL ONDE TÁ */}
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-rose-400" /> Local onde tá
                                  </span>
                                  <span className="text-xs font-medium text-amber-300 truncate block bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 inline-block max-w-full">
                                    {service.deviceLocation || 'Bancada'}
                                  </span>
                                </div>
                              </div>

                              {/* Espaço de OBS no Card */}
                              <div className="mt-1.5 pt-1 border-t border-slate-800/40 flex items-center gap-2 flex-wrap text-xs">
                                <span className="text-[10px] font-black text-amber-400 flex items-center gap-1 shrink-0">
                                  📝 OBS:
                                </span>
                                {service.obs && service.obs.trim() ? (
                                  <span className="text-[11px] text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 truncate max-w-md font-medium" title={service.obs}>
                                    {service.obs}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic">
                                    (Sem observação — não sairá na mensagem de envio)
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditService(card.id, service)}
                                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer ml-auto"
                                >
                                  {service.obs ? 'Alterar' : '+ Adicionar Obs'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right: Repasse Value & Row Actions */}
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                            {/* Valor do Repasse & Custo / 100% */}
                            <div className="text-right space-y-0.5">
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Repasse</div>
                              <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                                R$ {(Number(service.repasseValue) || 0).toFixed(2).replace('.', ',')}
                              </div>
                              {Number(service.costValue) > 0 ? (
                                <div className="text-[10px] text-rose-400 font-mono">
                                  Custo: R$ {(Number(service.costValue) || 0).toFixed(2).replace('.', ',')}
                                </div>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                                  100% Lucro
                                </span>
                              )}
                            </div>

                            {/* Actions: 1 a 1 WhatsApp, Edit, Delete */}
                            <div className="flex items-center gap-1">
                              {/* Send 1 a 1 via WhatsApp */}
                              <button
                                onClick={() => handleOpenSingleWhatsApp(card, service)}
                                className="px-2 py-1 bg-[#00B86B]/20 hover:bg-[#00B86B] text-emerald-300 hover:text-white rounded-lg border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title="Enviar este serviço via WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Edit Service */}
                              <button
                                onClick={() => handleOpenEditService(card.id, service)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                                title="Editar serviço"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Service */}
                              <button
                                onClick={() => handleDeleteService(card.id, service)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                                title="Apagar serviço"
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
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR CARD DE TÉCNICO */}
      {/* ========================================================= */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                {editingCard ? 'Editar Card do Técnico' : 'Novo Card de Técnico'}
              </h3>
              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Técnico *
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Carlos Manutenção, João Reparos..." 
                  value={cardForm.technicianName}
                  onChange={(e) => setCardForm({ ...cardForm, technicianName: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  WhatsApp do Técnico (para envio direto)
                </label>
                <input 
                  type="text" 
                  placeholder="(DDD) 99999-9999" 
                  value={cardForm.technicianPhone}
                  onChange={(e) => setCardForm({ ...cardForm, technicianPhone: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observações / Bancada (opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Bancada 1, Especialidade Telas..." 
                  value={cardForm.notes}
                  onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR / EDITAR SERVIÇO (CLIENTE, APARELHO, SERVIÇO, LOCAL, STATUS, REPASSE) */}
      {/* ========================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                {editingService ? 'Editar Serviço' : 'Novo Serviço p/ Técnico'}
              </h3>
              <button 
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              {/* Select Technician Card if more than 1 */}
              {cards.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Card do Técnico *
                  </label>
                  <select
                    value={targetCardIdForService}
                    onChange={(e) => setTargetCardIdForService(e.target.value)}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.technicianName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. CLIENTE */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Cliente *
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Carlos Alberto" 
                  value={serviceForm.clientName}
                  onChange={(e) => setServiceForm({ ...serviceForm, clientName: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              {/* 2. APARELHO */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Aparelho / Modelo *
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: iPhone 11, Samsung A32, Moto G22..." 
                  value={serviceForm.deviceModel}
                  onChange={(e) => setServiceForm({ ...serviceForm, deviceModel: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 3. SERVIÇO */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Serviço a ser feito *
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Troca de tela, Troca conector tipo C..." 
                  value={serviceForm.serviceDescription}
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceDescription: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 4. LOCAL ONDE TÁ & VALOR DO REPASSE */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Local onde tá
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Bancada 1, Gaveta 2..." 
                    value={serviceForm.deviceLocation}
                    onChange={(e) => setServiceForm({ ...serviceForm, deviceLocation: e.target.value })}
                    className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Valor Repasse (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                    <input 
                      type="text" 
                      placeholder="50,00" 
                      value={serviceForm.repasseValue}
                      onChange={(e) => setServiceForm({ ...serviceForm, repasseValue: e.target.value })}
                      className="w-full bg-[#0B1221] border border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-xs text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. ESPAÇO DE OBS (OPCIONAL) */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>📝 Espaço de Obs (Opcional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    *Só sai na mensagem de envio se preenchido
                  </span>
                </label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Trazer cabo, testar biometria, cliente busca às 18h..." 
                  value={serviceForm.obs}
                  onChange={(e) => setServiceForm({ ...serviceForm, obs: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* 6. STATUS (A FAZER / FEITO) */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Status Inicial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, isCompleted: false })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !serviceForm.isCompleted 
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>A Fazer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, isCompleted: true })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      serviceForm.isCompleted 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Feito</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  {editingService ? 'Salvar Serviço' : 'Adicionar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: WHATSAPP BUSINESS SENDING */}
      {/* ========================================================= */}
      {whatsAppModal.isOpen && whatsAppModal.card && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Enviar para WhatsApp Business
              </h3>
              <button 
                onClick={() => setWhatsAppModal({ isOpen: false, card: null, servicesToSend: [], targetPhone: '', sendMode: 'ALL' })}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número de Destino (WhatsApp)
                </label>
                <input 
                  type="text" 
                  placeholder="(DDD) 99999-9999 ou deixe em branco" 
                  value={whatsAppModal.targetPhone}
                  onChange={(e) => setWhatsAppModal({ ...whatsAppModal, targetPhone: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Prévia da Mensagem Formatada:
                </label>
                <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[11px] text-slate-200 whitespace-pre-wrap select-all">
                  {formatServiceWhatsAppText(whatsAppModal.card.technicianName, whatsAppModal.servicesToSend, whatsAppModal.card.notes)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = formatServiceWhatsAppText(whatsAppModal.card!.technicianName, whatsAppModal.servicesToSend, whatsAppModal.card!.notes);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(text);
                    showToast('Texto copiado com sucesso!');
                  }
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>

              <button
                type="button"
                onClick={handleConfirmSendWhatsApp}
                className="flex-1 px-4 py-2 bg-[#00B86B] hover:bg-[#00a35e] text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
