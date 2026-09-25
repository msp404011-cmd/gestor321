import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Smartphone, 
  DollarSign, 
  User, 
  Phone, 
  RotateCcw, 
  Share2, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Search, 
  Send,
  Zap,
  Star,
  Coins,
  ShieldCheck,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storage';
import { Customer, BudgetCard } from '../../types';
import { db } from '../../lib/firebase';
import { getTenantId } from '../../services/firestoreService';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'msp_budget_cards_v2';

// Helper for copying text to clipboard in iframe/sandboxed environments
const copyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-99999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Erro ao copiar texto:", err);
    return false;
  }
};

const formatCurrency = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPriceNumber = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const cleanPhoneForWhatsApp = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
};

export const MessageBudgetsView: React.FC = () => {
  const { isDark } = useTheme();

  // Company Settings
  const company = StorageService.getCompanySettings();
  const defaultStoreName = company.commercialName || company.name || 'MSP Informática';

  // State: Saved Budget Cards List
  // Starts with clean/empty fields so the options only appear when the user fills the spaces!
  const [cards, setCards] = useState<BudgetCard[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'card-default-1',
        title: 'Novo Orçamento',
        clientName: '',
        clientPhone: '',
        deviceModel: '',
        serviceType: 'VALOR DA TROCA DE TELA',
        goodPrice: 0,
        cheapPrice: 0,
        storeName: defaultStoreName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  });

  const [activeCardId, setActiveCardId] = useState<string>(() => cards[0]?.id || 'card-default-1');

  // Currently active card
  const activeCard = useMemo(() => {
    return cards.find(c => c.id === activeCardId) || cards[0] || {
      id: 'fallback',
      title: 'Novo Orçamento',
      clientName: '',
      clientPhone: '',
      deviceModel: '',
      serviceType: 'VALOR DA TROCA DE TELA',
      goodPrice: 0,
      cheapPrice: 0,
      storeName: defaultStoreName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [cards, activeCardId, defaultStoreName]);

  // Toast feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Customer search & autocomplete
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  useEffect(() => {
    setCustomersList(StorageService.getCustomers());
  }, []);

  // Save to LocalStorage
  const persistCards = (updated: BudgetCard[]) => {
    setCards(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar localmente:", err);
    }
  };

  // Sync with Firestore in background if available
  useEffect(() => {
    try {
      const tenant = getTenantId();
      if (!tenant || !db) return;
      const ref = collection(db, 'accounts', tenant, 'budget_message_cards');
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.empty) {
          const list: BudgetCard[] = [];
          snap.forEach(docSnap => {
            list.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          if (list.length > 0) {
            setCards(list);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
            } catch {}
          }
        }
      }, (err) => {
        console.warn("Firestore sync optional error for budget cards:", err);
      });
      return () => unsub();
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Update fields in active card
  const handleUpdateActiveCard = (field: keyof BudgetCard, value: any) => {
    const updated = cards.map(c => {
      if (c.id === activeCard.id) {
        return {
          ...c,
          [field]: value,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    persistCards(updated);

    // Sync to Firestore quietly
    try {
      const tenant = getTenantId();
      if (tenant && db) {
        const cardRef = doc(db, 'accounts', tenant, 'budget_message_cards', activeCard.id);
        setDoc(cardRef, { [field]: value, updatedAt: new Date().toISOString() }, { merge: true });
      }
    } catch {}
  };

  // Create new Card (starts with empty spaces so user fills in)
  const handleAddNewCard = () => {
    const newCard: BudgetCard = {
      id: `card-${Date.now()}`,
      title: `Orçamento #${cards.length + 1}`,
      clientName: '',
      clientPhone: '',
      deviceModel: '',
      serviceType: 'VALOR DA TROCA DE TELA',
      goodPrice: 0,
      cheapPrice: 0,
      storeName: defaultStoreName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newCard, ...cards];
    persistCards(updated);
    setActiveCardId(newCard.id);
    showToast("Novo card de orçamento criado!");
  };

  // Delete active card
  const handleDeleteCard = (cardId: string) => {
    if (cards.length <= 1) {
      // Just reset the single card to clean state
      const reset: BudgetCard = {
        id: 'card-default-1',
        title: 'Novo Orçamento',
        clientName: '',
        clientPhone: '',
        deviceModel: '',
        serviceType: 'VALOR DA TROCA DE TELA',
        goodPrice: 0,
        cheapPrice: 0,
        storeName: defaultStoreName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistCards([reset]);
      setActiveCardId(reset.id);
      showToast("Card redefinido!");
      return;
    }

    const filtered = cards.filter(c => c.id !== cardId);
    persistCards(filtered);
    setActiveCardId(filtered[0].id);
    showToast("Card de orçamento removido!");

    try {
      const tenant = getTenantId();
      if (tenant && db) {
        deleteDoc(doc(db, 'accounts', tenant, 'budget_message_cards', cardId));
      }
    } catch {}
  };

  // Quick Preset Models
  const quickModels = [
    'iPhone 11',
    'iPhone 12',
    'iPhone 13',
    'Samsung Galaxy A14',
    'Samsung Galaxy A54',
    'Moto G52',
    'Moto G84',
    'Xiaomi Redmi Note 12'
  ];

  // Price calculations
  const priceDifference = Math.max(0, (activeCard.goodPrice || 0) - (activeCard.cheapPrice || 0));

  // Determine which options should appear based on what spaces/inputs are filled
  const hasGoodPrice = Boolean(activeCard.goodPrice && activeCard.goodPrice > 0);
  const hasCheapPrice = Boolean(activeCard.cheapPrice && activeCard.cheapPrice > 0);
  const hasBothPrices = hasGoodPrice && hasCheapPrice;
  const hasAnyPrice = hasGoodPrice || hasCheapPrice;

  // Build Default Text for Peça Boa (Exact as user requested with client name support)
  const generateGoodMessage = (c: BudgetCard): string => {
    const headerGreeting = c.clientName?.trim()
      ? `Olá, ${c.clientName.trim()}! Tudo bem? Segue o orçamento:\n\n`
      : `Olá! Tudo bem? Segue o orçamento:\n\n`;

    const modelLine = c.deviceModel?.trim() ? ` para *${c.deviceModel.trim()}*` : '';

    return `${headerGreeting}📱🔧 *${c.serviceType || 'VALOR DA TROCA DE TELA'}*${modelLine}

⭐ *TELA DE BOA QUALIDADE*
💰 *R$ ${formatPriceNumber(c.goodPrice)}*

✨ Toque mais leve e preciso 👆
☀️ Brilho mais forte
🖼️ Imagem mais bonita e nítida
📱 Qualidade *mais próxima da tela original*

🛠️ *Já colocada no aparelho!*

👉 *Uma tela mais caprichada para quem quer qualidade.*

📲 *${c.storeName || defaultStoreName}*`;
  };

  // Build Default Text for Peça Mais em Conta (Exact as user requested with client name support)
  const generateCheapMessage = (c: BudgetCard): string => {
    const headerGreeting = c.clientName?.trim()
      ? `Olá, ${c.clientName.trim()}! Tudo bem? Segue o orçamento:\n\n`
      : `Olá! Tudo bem? Segue o orçamento:\n\n`;

    const modelLine = c.deviceModel?.trim() ? ` para *${c.deviceModel.trim()}*` : '';

    return `${headerGreeting}📱🔧 *${c.serviceType || 'VALOR DA TROCA DE TELA'}*${modelLine}

💰 *TELA MAIS EM CONTA*
💵 *R$ ${formatPriceNumber(c.cheapPrice)}*

👍 Funciona normalmente
👆 Toque um pouco mais pesado
🌙 Brilho um pouco mais escuro
🖼️ Imagem mais simples

👉 *Uma opção para quem quer gastar menos.*

🛠️ *Já colocada no aparelho!*

📲 *${c.storeName || defaultStoreName}*`;
  };

  // Build Default Full Comparison Message (Both options together for client to choose)
  const generateFullComparisonMessage = (c: BudgetCard): string => {
    const headerGreeting = c.clientName?.trim()
      ? `Olá, ${c.clientName.trim()}! Tudo bem? Segue as duas opções de tela${c.deviceModel?.trim() ? ` para seu *${c.deviceModel.trim()}*` : ''}:\n\n`
      : `Olá! Tudo bem? Segue as duas opções de tela${c.deviceModel?.trim() ? ` para seu *${c.deviceModel.trim()}*` : ''}:\n\n`;

    return `${headerGreeting}📱🔧 *${c.serviceType || 'VALOR DA TROCA DE TELA'}*

⭐ *OPÇÃO 1: TELA DE BOA QUALIDADE*
💰 *R$ ${formatPriceNumber(c.goodPrice)}*
✨ Toque mais leve e preciso 👆
☀️ Brilho mais forte
🖼️ Imagem mais bonita e nítida
📱 Qualidade *mais próxima da tela original*
🛠️ *Já colocada no aparelho!*
👉 *Uma tela mais caprichada para quem quer qualidade.*

━━━━━━━━━━━━━━━━━━━

💰 *OPÇÃO 2: TELA MAIS EM CONTA*
💵 *R$ ${formatPriceNumber(c.cheapPrice)}*
👍 Funciona normalmente
👆 Toque um pouco mais pesado
🌙 Brilho um pouco mais escuro
🖼️ Imagem mais simples
🛠️ *Já colocada no aparelho!*
👉 *Uma opção para quem quer gastar menos.*

${priceDifference > 0 ? `💡 *Diferença de apenas R$ ${formatPriceNumber(priceDifference)} pela tela de boa qualidade!*\n\n` : ''}Qual das duas opções prefere colocar no seu aparelho? Ficamos à sua disposição!

📲 *${c.storeName || defaultStoreName}*`;
  };

  // Editable live texts: uses custom text if edited, or default template
  const currentGoodText = activeCard.customGoodText !== undefined 
    ? activeCard.customGoodText 
    : generateGoodMessage(activeCard);

  const currentCheapText = activeCard.customCheapText !== undefined 
    ? activeCard.customCheapText 
    : generateCheapMessage(activeCard);

  const currentComparisonText = activeCard.customComparisonText !== undefined 
    ? activeCard.customComparisonText 
    : generateFullComparisonMessage(activeCard);

  // Copy handler
  const handleCopy = (text: string, key: string) => {
    const ok = copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast("Texto copiado para a área de transferência!");
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // WhatsApp send handler
  const handleSendWhatsApp = (text: string) => {
    const cleanPhone = cleanPhoneForWhatsApp(activeCard.clientPhone);
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Customer filter
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const q = customerSearchQuery.toLowerCase();
    return customersList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q)) ||
      (c.whatsapp && c.whatsapp.includes(q))
    ).slice(0, 5);
  }, [customerSearchQuery, customersList]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] px-4 py-3 rounded-2xl shadow-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center gap-2 border border-cyan-300/40 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER BANNER - SUPER ADMIN EXCLUSIVE */}
      <section className={`p-4 sm:p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark
          ? 'bg-gradient-to-r from-[#030917] via-[#05142e] to-[#040e24] border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.18)] text-white'
          : 'bg-gradient-to-r from-blue-50 via-white to-cyan-50 border-cyan-300 shadow-md text-slate-900'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-[0_0_20px_rgba(6,182,212,0.45)] shrink-0 border border-cyan-400/40">
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Central de Orçamentos WhatsApp</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                ⭐ SUPER ADMIN EXCLUSIVO
              </span>
            </div>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Preencha os valores nos espaços para liberar as mensagens. Você pode <strong>editar qualquer palavra do texto</strong> livremente antes de copiar ou disparar no WhatsApp!
            </p>
          </div>
        </div>

        {/* Action Button: Criar Novo Card de Orçamento */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleAddNewCard}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 border border-cyan-300/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </section>

      {/* 2. CARD SELECTOR TABS (SE HOUVER MAIS DE UM CARD) */}
      {cards.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
            Seus Cards:
          </span>
          {cards.map((c, idx) => {
            const isSelected = c.id === activeCard.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCardId(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : isDark
                    ? 'bg-[#050f24] text-slate-300 border-blue-950 hover:bg-[#091a3b] hover:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{c.clientName ? `${c.clientName} (${c.deviceModel || 'Tela'})` : c.title || `Card #${idx + 1}`}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse" />}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. MAIN WORKSPACE: CONFIGURATION CARD & CONTROLS */}
      <section className={`p-4 sm:p-5 rounded-3xl border-2 transition-all ${
        isDark ? 'bg-[#040b1a] border-blue-900/60 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Preencha os Espaços do Orçamento
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                As opções de mensagens só aparecem abaixo quando o seu respectivo preço for preenchido.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cards.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteCard(activeCard.id)}
                className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Excluir este card de orçamento"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Card</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          
          {/* Campo 1: Nome do Cliente */}
          <div className="relative">
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nome do Cliente</span>
              </span>
            </label>
            <input
              type="text"
              value={activeCard.clientName || ''}
              onChange={(e) => {
                handleUpdateActiveCard('clientName', e.target.value);
                setCustomerSearchQuery(e.target.value);
              }}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              placeholder="Ex: Carlos Eduardo, Dra. Camila..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                isDark 
                  ? 'bg-[#020612] border-blue-900 text-white placeholder-slate-600 focus:border-cyan-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />

            {/* Quick autocomplete dropdown for registered customers */}
            {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl border p-2 shadow-2xl space-y-1 ${
                isDark ? 'bg-[#061126] border-cyan-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}>
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1">
                  Clientes cadastrados encontrados:
                </div>
                {filteredCustomers.map(cust => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      handleUpdateActiveCard('clientName', cust.name);
                      if (cust.phone || cust.whatsapp) {
                        handleUpdateActiveCard('clientPhone', cust.whatsapp || cust.phone || '');
                      }
                      setIsCustomerDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      isDark ? 'hover:bg-blue-950 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span>{cust.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{cust.whatsapp || cust.phone || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo 2: WhatsApp / Telefone */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp do Cliente</span>
              </span>
            </label>
            <input
              type="text"
              value={activeCard.clientPhone || ''}
              onChange={(e) => handleUpdateActiveCard('clientPhone', e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                isDark 
                  ? 'bg-[#020612] border-blue-900 text-white placeholder-slate-600 focus:border-emerald-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Campo 3: Modelo do Aparelho / Serviço */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modelo do Aparelho</span>
              </span>
            </label>
            <input
              type="text"
              value={activeCard.deviceModel || ''}
              onChange={(e) => handleUpdateActiveCard('deviceModel', e.target.value)}
              placeholder="Ex: iPhone 11, Moto G52, Galaxy A54..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                isDark 
                  ? 'bg-[#020612] border-blue-900 text-white placeholder-slate-600 focus:border-cyan-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Campo 4: Nome da Loja / Assinatura */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nome da Loja (Rodapé)</span>
              </span>
            </label>
            <input
              type="text"
              value={activeCard.storeName || defaultStoreName}
              onChange={(e) => handleUpdateActiveCard('storeName', e.target.value)}
              placeholder="Ex: MSP Informática"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark 
                  ? 'bg-[#020612] border-blue-900 text-white placeholder-slate-600 focus:border-indigo-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

        </div>

        {/* Row 2: PREÇO PEÇA BOA & PREÇO PEÇA ECONÔMICA (OS ESPAÇOS QUE LIBERAM AS OPÇÕES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-950/60">
          
          {/* Card Preço: ⭐ TELA DE BOA QUALIDADE */}
          <div className={`p-4 rounded-2xl transition-all border-2 flex flex-col justify-between ${
            hasGoodPrice
              ? 'bg-gradient-to-br from-emerald-950/40 via-[#03151b] to-[#041a15] border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
              : 'bg-[#020713]/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                <Star className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                <span>Preço: Tela de Boa Qualidade (Peça Boa)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                hasGoodPrice
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasGoodPrice ? '✓ OPÇÃO 1 ATIVA' : 'PREENCHA P/ LIBERAR'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-emerald-400 text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={activeCard.goodPrice && activeCard.goodPrice > 0 ? activeCard.goodPrice : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = val === '' ? 0 : parseFloat(val) || 0;
                    handleUpdateActiveCard('goodPrice', num);
                  }}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-emerald-500/60 bg-[#020a0d] text-emerald-400 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-600"
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveCard('goodPrice', (activeCard.goodPrice || 0) + 10)}
                  className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs cursor-pointer active:scale-95"
                  title="Aumentar R$ 10"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveCard('goodPrice', (activeCard.goodPrice || 0) + 50)}
                  className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs cursor-pointer active:scale-95"
                  title="Aumentar R$ 50"
                >
                  +50
                </button>
                {hasGoodPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateActiveCard('goodPrice', 0);
                      handleUpdateActiveCard('customGoodText', undefined);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer"
                    title="Limpar preço e ocultar Opção 1"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-2">
              {hasGoodPrice 
                ? 'Opção 1 liberada abaixo! Toque na mensagem se desejar editar o texto.' 
                : 'Insira o valor desta peça para que o card da Opção 1 apareça abaixo.'}
            </p>
          </div>

          {/* Card Preço: 💰 TELA MAIS EM CONTA */}
          <div className={`p-4 rounded-2xl transition-all border-2 flex flex-col justify-between ${
            hasCheapPrice
              ? 'bg-gradient-to-br from-amber-950/40 via-[#1b1203] to-[#1a0e04] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : 'bg-[#020713]/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Preço: Tela Mais em Conta (Econômica)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                hasCheapPrice
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasCheapPrice ? '✓ OPÇÃO 2 ATIVA' : 'PREENCHA P/ LIBERAR'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-amber-400 text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={activeCard.cheapPrice && activeCard.cheapPrice > 0 ? activeCard.cheapPrice : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = val === '' ? 0 : parseFloat(val) || 0;
                    handleUpdateActiveCard('cheapPrice', num);
                  }}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-amber-500/60 bg-[#0d0902] text-amber-400 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-600"
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveCard('cheapPrice', (activeCard.cheapPrice || 0) + 10)}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs cursor-pointer active:scale-95"
                  title="Aumentar R$ 10"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveCard('cheapPrice', (activeCard.cheapPrice || 0) + 50)}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs cursor-pointer active:scale-95"
                  title="Aumentar R$ 50"
                >
                  +50
                </button>
                {hasCheapPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateActiveCard('cheapPrice', 0);
                      handleUpdateActiveCard('customCheapText', undefined);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer"
                    title="Limpar preço e ocultar Opção 2"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-amber-300/80 mt-2">
              {hasCheapPrice 
                ? 'Opção 2 liberada abaixo! Toque na mensagem se desejar editar o texto.' 
                : 'Insira o valor desta peça para que o card da Opção 2 apareça abaixo.'}
            </p>
          </div>

        </div>

        {/* Quick Model Pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-950/60 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Modelos Rápidos:
          </span>
          {quickModels.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => handleUpdateActiveCard('deviceModel', m)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/60 hover:bg-blue-900 border border-blue-900 text-cyan-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* 4. SE NENHUM PREÇO FOI PREENCHIDO: MOSTRA AVISO CLARO */}
      {!hasAnyPrice && (
        <section className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-cyan-500/30 bg-[#020713]/80 text-center space-y-3.5 shadow-inner animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Preencha os valores nos espaços acima para liberar as mensagens
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed mt-1">
              Conforme solicitado, as opções de mensagens só aparecem quando você realmente preencher o valor da <strong>Tela de Boa Qualidade</strong> e/ou da <strong>Tela Mais em Conta</strong>!
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleUpdateActiveCard('goodPrice', 250);
                handleUpdateActiveCard('cheapPrice', 180);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preencher Valores de Exemplo (R$ 250 e R$ 180)</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. AS OPÇÕES DE MENSAGENS (SÓ APARECEM QUANDO FOR PREENCHIDO!) */}
      {hasAnyPrice && (
        <section className={`grid gap-5 items-stretch ${
          hasBothPrices ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          
          {/* CARD 1: MENSAGEM DA PEÇA BOA (SÓ APARECE SE O PREÇO ESTIVER PREENCHIDO) */}
          {hasGoodPrice && (
            <div className="rounded-3xl border-2 border-emerald-500/50 bg-[#030d17] p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(16,185,129,0.12)] animate-in fade-in duration-200">
              <div>
                {/* Header com Badge e Valor */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                      ⭐
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Opção 1: Peça de Boa Qualidade</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          EDITÁVEL
                        </span>
                      </h4>
                      <p className="text-[10px] text-emerald-400/80">Você pode digitar e editar o texto diretamente abaixo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeCard.customGoodText !== undefined && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateActiveCard('customGoodText', undefined);
                          showToast("Texto da Opção 1 restaurado para o modelo padrão!");
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Restaurar texto padrão gerado pelos campos acima"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Padrão</span>
                      </button>
                    )}
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Preço</span>
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-400 leading-tight">
                        {formatCurrency(activeCard.goodPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TEXTO DA MENSAGEM EDITÁVEL (TEXTAREA INTERATIVA) */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Texto da Mensagem (Edição Livre):</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {currentGoodText.length} caracteres
                    </span>
                  </div>

                  <textarea
                    rows={13}
                    value={currentGoodText}
                    onChange={(e) => handleUpdateActiveCard('customGoodText', e.target.value)}
                    placeholder="Digite a mensagem para o cliente..."
                    className="w-full p-3.5 rounded-2xl bg-[#061714] border-2 border-emerald-500/40 hover:border-emerald-500/70 focus:border-emerald-400 text-slate-100 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner resize-y transition-all"
                  />
                  <p className="text-[10px] text-emerald-400/80 italic">
                    Dica: Qualquer alteração que você fizer no texto acima será copiada ou enviada exatamente como digitou!
                  </p>
                </div>
              </div>

              {/* Action Buttons para a Peça Boa */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => handleCopy(currentGoodText, 'good')}
                  className="py-2.5 px-3 rounded-xl border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {copiedKey === 'good' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(currentGoodText)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD 2: MENSAGEM DA PEÇA MAIS EM CONTA (SÓ APARECE SE O PREÇO ESTIVER PREENCHIDO) */}
          {hasCheapPrice && (
            <div className="rounded-3xl border-2 border-amber-500/50 bg-[#0d0903] p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(245,158,11,0.12)] animate-in fade-in duration-200">
              <div>
                {/* Header com Badge e Valor */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                      💰
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Opção 2: Peça Mais em Conta</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          EDITÁVEL
                        </span>
                      </h4>
                      <p className="text-[10px] text-amber-400/80">Você pode digitar e editar o texto diretamente abaixo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeCard.customCheapText !== undefined && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateActiveCard('customCheapText', undefined);
                          showToast("Texto da Opção 2 restaurado para o modelo padrão!");
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Restaurar texto padrão gerado pelos campos acima"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Padrão</span>
                      </button>
                    )}
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Preço</span>
                      <span className="text-base sm:text-lg font-black font-mono text-amber-400 leading-tight">
                        {formatCurrency(activeCard.cheapPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TEXTO DA MENSAGEM EDITÁVEL (TEXTAREA INTERATIVA) */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Texto da Mensagem (Edição Livre):</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {currentCheapText.length} caracteres
                    </span>
                  </div>

                  <textarea
                    rows={13}
                    value={currentCheapText}
                    onChange={(e) => handleUpdateActiveCard('customCheapText', e.target.value)}
                    placeholder="Digite a mensagem para o cliente..."
                    className="w-full p-3.5 rounded-2xl bg-[#1a1205] border-2 border-amber-500/40 hover:border-amber-500/70 focus:border-amber-400 text-slate-100 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner resize-y transition-all"
                  />
                  <p className="text-[10px] text-amber-400/80 italic">
                    Dica: Qualquer alteração que você fizer no texto acima será copiada ou enviada exatamente como digitou!
                  </p>
                </div>
              </div>

              {/* Action Buttons para a Peça Mais em Conta */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-amber-500/30">
                <button
                  type="button"
                  onClick={() => handleCopy(currentCheapText, 'cheap')}
                  className="py-2.5 px-3 rounded-xl border border-amber-500/50 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {copiedKey === 'cheap' ? (
                    <>
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(currentCheapText)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>
          )}

        </section>
      )}

      {/* 6. CARD EXTRA: COMPARATIVO COMPLETO (SÓ APARECE QUANDO OS DOIS PREÇOS ESTIVEREM PREENCHIDOS!) */}
      {hasBothPrices && (
        <section className="rounded-3xl border-2 border-cyan-500/60 bg-gradient-to-r from-[#030917] via-[#04122b] to-[#030917] p-4 sm:p-6 shadow-[0_0_35px_rgba(6,182,212,0.18)] animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-black">
                ⚖️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Comparativo Completo (As 2 Opções Juntas)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      EDITÁVEL
                    </span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-xs text-cyan-300/80">
                  Envia as duas opções em uma única mensagem para o cliente ler, comparar e escolher a que preferir!
                </p>
              </div>
            </div>

            {/* Action Buttons do Comparativo Completo */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {activeCard.customComparisonText !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateActiveCard('customComparisonText', undefined);
                    showToast("Comparativo restaurado para o modelo padrão!");
                  }}
                  className="text-[10px] text-cyan-300 hover:text-white border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Restaurar comparativo padrão"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Padrão</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopy(currentComparisonText, 'both')}
                className="py-2.5 px-4 rounded-xl border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {copiedKey === 'both' ? (
                  <>
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Copiar Comparativo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsApp(currentComparisonText)}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/40"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Ambas no WhatsApp</span>
              </button>
            </div>
          </div>

          {/* TEXTO DA MENSAGEM COMPARATIVA EDITÁVEL */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Texto do Comparativo (Clique para editar qualquer linha):</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {currentComparisonText.length} caracteres
              </span>
            </div>

            <textarea
              rows={15}
              value={currentComparisonText}
              onChange={(e) => handleUpdateActiveCard('customComparisonText', e.target.value)}
              placeholder="Digite o comparativo aqui..."
              className="w-full p-4 rounded-2xl bg-[#020713] border-2 border-cyan-500/40 hover:border-cyan-500/70 focus:border-cyan-400 text-slate-100 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-inner resize-y transition-all"
            />
            <p className="text-[10px] text-cyan-300/80 italic">
              Você pode adicionar prazos, formas de pagamento (ex: Pix com desconto, cartão em até 3x) ou qualquer aviso personalizado diretamente no quadro acima.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default MessageBudgetsView;
