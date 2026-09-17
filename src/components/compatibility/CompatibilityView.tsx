import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Layers,
  Smartphone,
  BatteryCharging,
  Shield,
  Plug,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  X,
  Tag,
  Info,
  Cpu,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
  Share2,
  Camera,
  Headphones,
  Volume2,
  Wrench,
  Watch,
  Laptop,
  Usb,
  Radio,
  Gamepad2,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { CompatibilitySector, CompatibilityCard } from '../../types';
import { StorageService } from '../../services/storage';
import { defaultCompatibilitySectors, defaultCompatibilityCards } from '../../data/defaultCompatibility';

interface CompatibilityViewProps {
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CompatibilityView: React.FC<CompatibilityViewProps> = ({ showToast: showToastProp }) => {
  // Local Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToastProp) showToastProp(message, type);
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // States
  const [sectors, setSectors] = useState<CompatibilitySector[]>(() => StorageService.getCompatibilitySectors());
  const [cards, setCards] = useState<CompatibilityCard[]>(() => StorageService.getCompatibilityCards());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('ALL');

  // Copied Card ID state for feedback
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CompatibilityCard | null>(null);

  // Sector Manager Modal
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<CompatibilitySector | null>(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorDesc, setNewSectorDesc] = useState('');
  const [newSectorIcon, setNewSectorIcon] = useState('Layers');
  const [newSectorColor, setNewSectorColor] = useState('blue');

  // Custom Confirmation Modals State (replaces window.confirm for iframe compatibility)
  const [sectorToDelete, setSectorToDelete] = useState<{ id: string; name: string } | null>(null);
  const [cardToDelete, setCardToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Card Form State
  const [cardSectorId, setCardSectorId] = useState<string>('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardMainModel, setCardMainModel] = useState('');
  const [cardBrand, setCardBrand] = useState('Samsung');
  const [cardPartCode, setCardPartCode] = useState('');
  const [cardType, setCardType] = useState<'EXACT' | 'PARTIAL' | 'ADAPTATION'>('EXACT');
  const [cardNotes, setCardNotes] = useState('');
  const [compatibleModelsList, setCompatibleModelsList] = useState<string[]>([]);
  const [modelInput, setModelInput] = useState('');

  // Sync state changes with StorageService
  const handleSaveCards = (updated: CompatibilityCard[]) => {
    setCards(updated);
    StorageService.saveCompatibilityCards(updated);
  };

  const handleSaveSectors = (updated: CompatibilitySector[]) => {
    setSectors(updated);
    StorageService.saveCompatibilitySectors(updated);
  };

  // List of available sector icons for picker UI
  const availableSectorIcons = [
    { id: 'Smartphone', label: 'Telas / Celular', icon: Smartphone },
    { id: 'BatteryCharging', label: 'Bateria', icon: BatteryCharging },
    { id: 'Shield', label: 'Película / Proteção', icon: Shield },
    { id: 'Plug', label: 'Conector / Carga', icon: Plug },
    { id: 'Camera', label: 'Câmera / Lentes', icon: Camera },
    { id: 'Headphones', label: 'Fones / Áudio', icon: Headphones },
    { id: 'Volume2', label: 'Alto-Falantes', icon: Volume2 },
    { id: 'Wrench', label: 'Ferramentas', icon: Wrench },
    { id: 'Watch', label: 'Smartwatch', icon: Watch },
    { id: 'Laptop', label: 'Notebook', icon: Laptop },
    { id: 'Usb', label: 'Cabos / USB', icon: Usb },
    { id: 'Cpu', label: 'Placa / CPU', icon: Cpu },
    { id: 'Radio', label: 'Antena / Sinal', icon: Radio },
    { id: 'Gamepad2', label: 'Console / Game', icon: Gamepad2 },
    { id: 'Wifi', label: 'Rede / Wi-Fi', icon: Wifi },
    { id: 'HardDrive', label: 'Memória / HD', icon: HardDrive },
    { id: 'Sparkles', label: 'Acessórios', icon: Sparkles },
    { id: 'Tag', label: 'Etiqueta', icon: Tag },
    { id: 'Layers', label: 'Geral / Camadas', icon: Layers },
  ];

  // Helper for Icon rendering
  const renderSectorIcon = (iconName?: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'BatteryCharging':
        return <BatteryCharging className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Plug':
        return <Plug className={className} />;
      case 'Camera':
        return <Camera className={className} />;
      case 'Headphones':
        return <Headphones className={className} />;
      case 'Volume2':
        return <Volume2 className={className} />;
      case 'Wrench':
        return <Wrench className={className} />;
      case 'Watch':
        return <Watch className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      case 'Usb':
        return <Usb className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      case 'Wifi':
        return <Wifi className={className} />;
      case 'HardDrive':
        return <HardDrive className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Tag':
        return <Tag className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Sector color theme mapping
  const getSectorColorClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        };
      default: // blue
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
    }
  };

  // Filter Cards by Search Query & Selected Sector
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return cards.filter((card) => {
      // Sector filter
      if (selectedSectorId !== 'ALL' && card.sectorId !== selectedSectorId) {
        return false;
      }

      if (!q) return true;

      // Match against Title, MainModel, Brand, PartCode, Notes, SectorName, or Compatible Models
      const titleMatch = card.title?.toLowerCase().includes(q);
      const modelMatch = card.mainModel?.toLowerCase().includes(q);
      const brandMatch = card.brand?.toLowerCase().includes(q);
      const codeMatch = card.partCode?.toLowerCase().includes(q);
      const notesMatch = card.notes?.toLowerCase().includes(q);
      const sectorMatch = card.sectorName?.toLowerCase().includes(q);
      const tagMatch = card.compatibleModels?.some((m) => m.toLowerCase().includes(q));

      return titleMatch || modelMatch || brandMatch || codeMatch || notesMatch || sectorMatch || tagMatch;
    });
  }, [cards, searchQuery, selectedSectorId]);

  // Group Cards by Sector for render
  const groupedSectors = useMemo(() => {
    return sectors.map((sec) => {
      const secCards = filteredCards.filter((c) => c.sectorId === sec.id);
      return {
        sector: sec,
        cards: secCards,
      };
    }).filter((group) => {
      // If a specific sector is selected, only keep that sector
      if (selectedSectorId !== 'ALL' && group.sector.id !== selectedSectorId) {
        return false;
      }
      // If searching, only show sectors with matching cards (or show all if no query)
      if (searchQuery.trim()) {
        return group.cards.length > 0;
      }
      return true;
    });
  }, [sectors, filteredCards, selectedSectorId, searchQuery]);

  // Handle Add Model Tag to Card Form
  const handleAddModelTag = () => {
    const val = modelInput.trim();
    if (!val) return;
    if (compatibleModelsList.includes(val)) {
      notify('Modelo já adicionado na lista!', 'info');
      setModelInput('');
      return;
    }
    setCompatibleModelsList([...compatibleModelsList, val]);
    setModelInput('');
  };

  const handleRemoveModelTag = (tagToRemove: string) => {
    setCompatibleModelsList(compatibleModelsList.filter((m) => m !== tagToRemove));
  };

  // Open Modal for New Card
  const handleOpenNewCard = (defaultSecId?: string) => {
    setEditingCard(null);
    const targetSector = sectors.find((s) => s.id === defaultSecId) || sectors[0];
    setCardSectorId(targetSector?.id || '');
    setCardTitle('');
    setCardMainModel('');
    setCardBrand('Samsung');
    setCardPartCode('');
    setCardType('EXACT');
    setCardNotes('');
    setCompatibleModelsList([]);
    setModelInput('');
    setIsCardModalOpen(true);
  };

  // Open Modal for Edit Card
  const handleOpenEditCard = (card: CompatibilityCard) => {
    setEditingCard(card);
    setCardSectorId(card.sectorId);
    setCardTitle(card.title);
    setCardMainModel(card.mainModel || '');
    setCardBrand(card.brand || 'Samsung');
    setCardPartCode(card.partCode || '');
    setCardType(card.type || 'EXACT');
    setCardNotes(card.notes || '');
    setCompatibleModelsList(card.compatibleModels || []);
    setModelInput('');
    setIsCardModalOpen(true);
  };

  // Save Card (Create or Edit)
  const handleSaveCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardTitle.trim()) {
      notify('Por favor, informe o título da compatibilidade.', 'error');
      return;
    }

    const sec = sectors.find((s) => s.id === cardSectorId) || sectors[0];

    // Combine input if user forgot to press Add
    let finalModels = [...compatibleModelsList];
    if (modelInput.trim() && !finalModels.includes(modelInput.trim())) {
      finalModels.push(modelInput.trim());
    }

    if (finalModels.length === 0 && cardMainModel.trim()) {
      finalModels.push(cardMainModel.trim());
    }

    if (editingCard) {
      const updated: CompatibilityCard = {
        ...editingCard,
        sectorId: sec.id,
        sectorName: sec.name,
        title: cardTitle.trim(),
        mainModel: cardMainModel.trim(),
        brand: cardBrand,
        partCode: cardPartCode.trim(),
        type: cardType,
        notes: cardNotes.trim(),
        compatibleModels: finalModels,
        updatedAt: new Date().toISOString(),
      };
      const list = cards.map((c) => (c.id === editingCard.id ? updated : c));
      handleSaveCards(list);
      notify('Compatibilidade atualizada com sucesso!', 'success');
    } else {
      const newCard: CompatibilityCard = {
        id: 'card_' + Date.now(),
        sectorId: sec.id,
        sectorName: sec.name,
        title: cardTitle.trim(),
        mainModel: cardMainModel.trim(),
        brand: cardBrand,
        partCode: cardPartCode.trim(),
        type: cardType,
        notes: cardNotes.trim(),
        compatibleModels: finalModels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      handleSaveCards([newCard, ...cards]);
      notify('Nova compatibilidade cadastrada!', 'success');
    }

    setIsCardModalOpen(false);
  };

  // Delete Card
  const handleDeleteCard = (id: string, title: string) => {
    setCardToDelete({ id, title });
  };

  const confirmDeleteCard = () => {
    if (!cardToDelete) return;
    const updated = cards.filter((c) => c.id !== cardToDelete.id);
    handleSaveCards(updated);
    notify('Compatibilidade removida com sucesso.', 'info');
    setCardToDelete(null);
  };

  // Duplicate Card
  const handleDuplicateCard = (card: CompatibilityCard) => {
    const dup: CompatibilityCard = {
      ...card,
      id: 'card_' + Date.now(),
      title: `${card.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleSaveCards([dup, ...cards]);
    notify('Compatibilidade duplicada!', 'success');
  };

  // Copy Compatible Models to Clipboard
  const handleCopyModels = (card: CompatibilityCard) => {
    const modelsText = card.compatibleModels.join(' = ');
    const fullText = `*COMPATIBILIDADE [${card.sectorName}]*\n📌 *${card.title}*\n📱 *Modelos Compatíveis:* ${modelsText}\n${card.partCode ? `🏷️ *Código:* ${card.partCode}\n` : ''}${card.notes ? `📝 *Obs:* ${card.notes}` : ''}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedCardId(card.id);
      notify('Lista de compatibilidades copiada para a área de transferência!', 'success');
      setTimeout(() => setCopiedCardId(null), 2500);
    }).catch(() => {
      notify('Erro ao copiar texto.', 'error');
    });
  };

  // Open Sector Modal for Creation
  const handleOpenNewSectorModal = () => {
    setEditingSector(null);
    setNewSectorName('');
    setNewSectorDesc('');
    setNewSectorIcon('Layers');
    setNewSectorColor('blue');
    setIsSectorModalOpen(true);
  };

  // Open Sector Modal for Editing
  const handleOpenEditSectorModal = (sec: CompatibilitySector) => {
    setEditingSector(sec);
    setNewSectorName(sec.name);
    setNewSectorDesc(sec.description || '');
    setNewSectorIcon(sec.icon || 'Layers');
    setNewSectorColor(sec.color || 'blue');
    setIsSectorModalOpen(true);
  };

  // Create or Edit Sector
  const handleSaveSectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) {
      notify('Informe o nome do setor.', 'error');
      return;
    }

    if (editingSector) {
      // Updating existing sector
      const updatedSectors = sectors.map((s) =>
        s.id === editingSector.id
          ? {
              ...s,
              name: newSectorName.trim(),
              description: newSectorDesc.trim(),
              icon: newSectorIcon,
              color: newSectorColor,
            }
          : s
      );
      // Also update sectorName on any cards linked to this sector
      const updatedCards = cards.map((c) =>
        c.sectorId === editingSector.id
          ? { ...c, sectorName: newSectorName.trim() }
          : c
      );
      handleSaveSectors(updatedSectors);
      handleSaveCards(updatedCards);
      notify(`Setor "${newSectorName.trim()}" atualizado com sucesso!`, 'success');
    } else {
      // Creating new sector
      const newSec: CompatibilitySector = {
        id: 'sec_' + Date.now(),
        name: newSectorName.trim(),
        icon: newSectorIcon,
        color: newSectorColor,
        description: newSectorDesc.trim(),
        isDefault: false,
      };
      handleSaveSectors([...sectors, newSec]);
      notify(`Setor "${newSec.name}" criado com sucesso!`, 'success');
    }

    setEditingSector(null);
    setNewSectorName('');
    setNewSectorDesc('');
    setIsSectorModalOpen(false);
  };

  // Delete Sector
  const handleDeleteSector = (sectorId: string, sectorName: string) => {
    setSectorToDelete({ id: sectorId, name: sectorName });
  };

  const confirmDeleteSector = () => {
    if (!sectorToDelete) return;
    const { id: sectorId, name: sectorName } = sectorToDelete;
    const updatedSectors = sectors.filter((s) => s.id !== sectorId);
    handleSaveSectors(updatedSectors);
    if (selectedSectorId === sectorId) setSelectedSectorId('ALL');
    if (editingSector?.id === sectorId) {
      setEditingSector(null);
      setNewSectorName('');
      setNewSectorDesc('');
    }
    notify(`Setor "${sectorName}" removido com sucesso.`, 'info');
    setSectorToDelete(null);
  };

  // Reset to Default Seed Data
  const handleResetDefaults = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetDefaults = () => {
    handleSaveSectors(defaultCompatibilitySectors);
    handleSaveCards(defaultCompatibilityCards);
    setSearchQuery('');
    setSelectedSectorId('ALL');
    notify('Banco de compatibilidade restaurado para os padrões originais!', 'success');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-[#1a1f2c] space-y-5">
      {/* 1. TOP HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-4 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-indigo-500 text-slate-950 uppercase tracking-widest shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> RECURSO GENIAL
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                {cards.length} {cards.length === 1 ? 'Compatibilidade' : 'Compatibilidades'} no Banco
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-400 shrink-0" />
              Banco de Compatibilidades de Peças e Acessórios
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-3xl leading-relaxed">
              Consulte e guarde peças 100% idênticas ou compatíveis entre modelos de celulares (Telas, Baterias, Películas, Capas e Conectores). Comece a digitar qualquer modelo ou código no buscador abaixo!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewCard()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Compatibilidade</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNewSectorModal()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              title="Criar novo setor ou gerenciar existentes"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Gerenciar Setores</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
              title="Restaurar dados padrão de fábrica"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. INSTANT GLOBAL SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-indigo-400 pointer-events-none">
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Comece a digitar o que procura... Ex: A10, iPhone 11, BN46, V8, G8 Play, Película, Bateria..."
            className="w-full pl-12 sm:pl-13 pr-12 py-3.5 sm:py-4 bg-slate-950 border-2 border-indigo-500/40 focus:border-indigo-400 text-white text-sm sm:text-base font-semibold placeholder:text-slate-500 rounded-xl outline-none shadow-inner transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Status & Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1 flex-wrap gap-2">
          <span>
            {searchQuery ? (
              <span className="text-amber-400 font-bold">
                Buscando por "{searchQuery}": {filteredCards.length} {filteredCards.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </span>
            ) : (
              <span>Exibindo <strong>{filteredCards.length}</strong> compatibilidades em <strong>{sectors.length}</strong> setores.</span>
            )}
          </span>

          <span className="text-[11px] text-slate-500 hidden sm:inline-block">
            💡 Dica: Digite qualquer marca, modelo de tela, bateria, película ou código para filtrar instantaneamente.
          </span>
        </div>
      </div>

      {/* 3. SECTOR FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => setSelectedSectorId('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            selectedSectorId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Todos os Setores ({cards.length})</span>
        </button>

        {sectors.map((sec) => {
          const count = cards.filter((c) => c.sectorId === sec.id).length;
          const isSelected = selectedSectorId === sec.id;
          const colors = getSectorColorClasses(sec.color);

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSectorId(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? `${colors.bg} ${colors.text} border-current ring-2 ring-current shadow-md`
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              {renderSectorIcon(sec.icon, 'w-3.5 h-3.5')}
              <span>{sec.name}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${colors.badge}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. CARDS GRID BY SECTORS */}
      {groupedSectors.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhuma compatibilidade encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não encontramos registros para o termo "{searchQuery}". Tente buscar por outro modelo ou cadastre uma nova compatibilidade.
          </p>
          <button
            type="button"
            onClick={() => handleOpenNewCard()}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Cadastrar Agora
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSectors.map(({ sector, cards: secCards }) => {
            const colors = getSectorColorClasses(sector.color);

            return (
              <div key={sector.id} className="space-y-3">
                {/* Sector Section Header */}
                <div className={`p-3.5 sm:p-4 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-between gap-3 flex-wrap`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg} border shadow-sm`}>
                      {renderSectorIcon(sector.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`text-base sm:text-lg font-black tracking-tight ${colors.text}`}>
                          {sector.name}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${colors.badge}`}>
                          {secCards.length} {secCards.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      {sector.description && (
                        <p className="text-xs text-slate-400 font-medium">
                          {sector.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenNewCard(sector.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${colors.badge} hover:opacity-90`}
                    >
                      <Plus className="w-3.5 h-3.5" /> + Adicionar neste setor
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditSectorModal(sector)}
                      className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                      title="Editar nome, ícone ou cor deste setor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSector(sector.id, sector.name)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                      title="Excluir este setor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {secCards.map((card) => {
                    const isExact = card.type === 'EXACT';
                    const isAdaptation = card.type === 'ADAPTATION';

                    return (
                      <div
                        key={card.id}
                        className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col justify-between"
                      >
                        {/* Top Row: Brand & Type Badges */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {card.brand || 'Multimarcas'}
                            </span>

                            {isExact ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 100% Idêntica
                              </span>
                            ) : isAdaptation ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Requer Atenção
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Compatível
                              </span>
                            )}
                          </div>

                          {/* Card Title */}
                          <h3 className="text-sm font-black text-white leading-snug group-hover:text-indigo-300 transition-colors">
                            {card.title}
                          </h3>

                          {/* Base Model & Part Code */}
                          <div className="text-xs space-y-1">
                            {card.mainModel && (
                              <div className="text-slate-400 font-semibold flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Aparelho Base:</span>
                                <strong className="text-white">{card.mainModel}</strong>
                              </div>
                            )}

                            {card.partCode && (
                              <div className="text-slate-400 font-semibold flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Código/Flex:</span>
                                <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 text-[11px]">
                                  {card.partCode}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Compatible Models Tags List */}
                          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                              Modelos Compatíveis ({card.compatibleModels?.length || 0}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {card.compatibleModels?.map((modelName, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 shadow-sm"
                                >
                                  {modelName}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Technical Notes */}
                          {card.notes && (
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{card.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyModels(card)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              copiedCardId === card.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                            title="Copiar lista de compatibilidades formatada"
                          >
                            {copiedCardId === card.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copiar
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateCard(card)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Duplicar para criar similar"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditCard(card)}
                              className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id, card.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Excluir"
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

      {/* =========================================
          MODAL: CADASTRAR / EDITAR COMPATIBILIDADE
         ========================================= */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  {editingCard ? 'Editar Compatibilidade' : 'Nova Compatibilidade de Peça / Acessório'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Setor */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Setor / Categoria *
                  </label>
                  <select
                    value={cardSectorId}
                    onChange={(e) => setCardSectorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-bold rounded-xl outline-none focus:border-indigo-500"
                  >
                    {sectors.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Marca Principal
                  </label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-bold rounded-xl outline-none focus:border-indigo-500"
                  >
                    <option value="Samsung">Samsung</option>
                    <option value="Apple">Apple (iPhone)</option>
                    <option value="Motorola">Motorola</option>
                    <option value="Xiaomi">Xiaomi / Poco / Redmi</option>
                    <option value="LG">LG</option>
                    <option value="Realme">Realme</option>
                    <option value="Multimarcas">Multimarcas / Universal</option>
                  </select>
                </div>
              </div>

              {/* Título da Compatibilidade */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                  Título Descritivo *
                </label>
                <input
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="Ex: Display LCD Samsung A10, A10s e M10 ou Bateria BN46"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-bold rounded-xl outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Modelo Base */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Modelo Referência (Aparelho Base)
                  </label>
                  <input
                    type="text"
                    value={cardMainModel}
                    onChange={(e) => setCardMainModel(e.target.value)}
                    placeholder="Ex: Samsung Galaxy A10"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-medium rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Código de Peça / Flex */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Código da Peça / Flex / Part Number
                  </label>
                  <input
                    type="text"
                    value={cardPartCode}
                    onChange={(e) => setCardPartCode(e.target.value)}
                    placeholder="Ex: SM-A105F, BN46, V8-180"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Nível de Compatibilidade */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                  Grau de Compatibilidade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardType('EXACT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      cardType === 'EXACT'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    100% Idêntica
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardType('PARTIAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      cardType === 'PARTIAL'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Compatível
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardType('ADAPTATION')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      cardType === 'ADAPTATION'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Requer Atenção
                  </button>
                </div>
              </div>

              {/* Modelos Compatíveis (Tag List) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase">
                  Adicionar Modelos de Aparelho Compatíveis
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModelTag();
                      }
                    }}
                    placeholder="Digite o modelo (Ex: Samsung A10s) e clique Adicionar ou pressione Enter"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModelTag}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {compatibleModelsList.length === 0 ? (
                    <span className="text-slate-500 text-xs italic">Nenhum modelo adicionado ainda.</span>
                  ) : (
                    compatibleModelsList.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-900/60 text-indigo-200 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveModelTag(m)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                  Observações / Dicas Técnicas
                </label>
                <textarea
                  rows={2}
                  value={cardNotes}
                  onChange={(e) => setCardNotes(e.target.value)}
                  placeholder="Ex: Serve no A10 e A10s perfeitamente. Atenção ao sensor de proximidade no aro..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Salvar Compatibilidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: GERENCIAR / CRIAR / EDITAR SETOR
         ========================================= */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Gerenciar Setores de Compatibilidade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSectorModalOpen(false);
                  setEditingSector(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs sm:text-sm">
              {/* Section 1: Existing Sectors List */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Setores Cadastrados ({sectors.length})
                </label>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {sectors.map((sec) => {
                    const cardCount = cards.filter((c) => c.sectorId === sec.id).length;
                    const isCurrentlyEditing = editingSector?.id === sec.id;
                    const colors = getSectorColorClasses(sec.color);

                    return (
                      <div
                        key={sec.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isCurrentlyEditing
                            ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${colors.iconBg} border shrink-0`}>
                            {renderSectorIcon(sec.icon, 'w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">{sec.name}</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${colors.badge}`}>
                                {cardCount} {cardCount === 1 ? 'item' : 'itens'}
                              </span>
                            </div>
                            {sec.description && (
                              <p className="text-[11px] text-slate-400 truncate">{sec.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSectorModal(sec)}
                            className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Editar este setor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSector(sec.id, sec.name)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Excluir este setor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Section 2: Form to Create or Edit Sector */}
              <form onSubmit={handleSaveSectorSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    {editingSector ? (
                      <>
                        <Edit2 className="w-3.5 h-3.5" /> Editando Setor: "{editingSector.name}"
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Cadastrar Novo Setor
                      </>
                    )}
                  </span>

                  {editingSector && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSector(null);
                        setNewSectorName('');
                        setNewSectorDesc('');
                        setNewSectorIcon('Layers');
                        setNewSectorColor('blue');
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      + Criar Novo em vez disso
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Nome do Setor *
                  </label>
                  <input
                    type="text"
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    placeholder="Ex: Câmeras, Botões Flex, Alto-Falantes..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white font-bold rounded-xl outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Descrição Curta (opcional)
                  </label>
                  <input
                    type="text"
                    value={newSectorDesc}
                    onChange={(e) => setNewSectorDesc(e.target.value)}
                    placeholder="Ex: Câmeras frontais e traseiras intercambiáveis"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                {/* VISUAL ICON PICKER GRID */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                    <span>Escolha o Ícone do Setor *</span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      Selecionado: {availableSectorIcons.find(i => i.id === newSectorIcon)?.label || newSectorIcon}
                    </span>
                  </label>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                    {availableSectorIcons.map((ico) => {
                      const IconComp = ico.icon;
                      const isSelected = newSectorIcon === ico.id;

                      return (
                        <button
                          key={ico.id}
                          type="button"
                          onClick={() => setNewSectorIcon(ico.id)}
                          className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span className="text-[10px] font-bold truncate max-w-full leading-none">
                            {ico.label.split('/')[0].trim()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                    Cor Tema
                  </label>
                  <select
                    value={newSectorColor}
                    onChange={(e) => setNewSectorColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-amber-500 font-medium cursor-pointer"
                  >
                    <option value="blue">Azul (Padrão)</option>
                    <option value="amber">Amarelo / Âmbar</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="purple">Roxo / Púrpura</option>
                    <option value="cyan">Ciano</option>
                    <option value="rose">Rosa / Vermelho</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSectorModalOpen(false);
                      setEditingSector(null);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {editingSector ? 'Salvar Alterações' : 'Criar Setor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE SETOR
         ========================================= */}
      {sectorToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Excluir Setor</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Tem certeza que deseja remover o setor <strong className="text-white">"{sectorToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                As compatibilidades cadastradas continuarão salvas no sistema.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSectorToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSector}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sim, Excluir Setor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CARD
         ========================================= */}
      {cardToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Excluir Compatibilidade</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Deseja realmente remover a compatibilidade <strong className="text-white">"{cardToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCard}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: RESTAURAR PADRÕES DE FÁBRICA
         ========================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Restaurar Padrões de Fábrica</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Deseja restaurar o banco com as compatibilidades e setores de fábrica originais?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetDefaults}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce border ${
          toast.type === 'error'
            ? 'bg-rose-900/90 text-rose-100 border-rose-500/50 shadow-rose-950/50'
            : toast.type === 'info'
            ? 'bg-cyan-900/90 text-cyan-100 border-cyan-500/50 shadow-cyan-950/50'
            : 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 shadow-emerald-950/50'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
