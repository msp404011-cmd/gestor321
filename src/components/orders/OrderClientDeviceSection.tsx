import React from 'react';
import { User, Plus, Search, Smartphone, Tablet, Laptop, ChevronDown, MessageCircle, Pencil, Shield, Star, Lock } from 'lucide-react';
import { Customer, DeviceType, CustomDeviceType } from '../../types';
import { OrderPasswordSection } from './OrderPasswordSection';

interface OrderClientDeviceSectionProps {
  isDark: boolean;
  customers: Customer[];
  filteredCustomers: Customer[];
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
  searchRef: React.RefObject<HTMLDivElement | null>;
  handleSelectCustomer: (cust: Customer) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;
  whatsappClean: string;
  pickupType?: 'OWNER_ONLY' | 'THIRD_PARTY';
  setPickupType?: (val: 'OWNER_ONLY' | 'THIRD_PARTY') => void;
  authorizedPickupName?: string;
  setAuthorizedPickupName?: (val: string) => void;
  authorizedPickupPhone?: string;
  setAuthorizedPickupPhone?: (val: string) => void;
  onOpenNewCustomer?: (prefill?: string) => void;
  onOpenEditCustomer?: (customer: Customer) => void;
  setShowQuickCustomerModal?: (val: boolean) => void;
  deviceType: DeviceType;
  setDeviceType: (val: DeviceType) => void;
  customDeviceTypes: CustomDeviceType[];
  brand: string;
  setBrand: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  commonBrands: string[];
  imei: string;
  setImei: (val: string) => void;
  hasNoDamages: boolean;
  setHasNoDamages: (val: boolean) => void;
  physicalState: string;
  setPhysicalState: (val: string) => void;
  passwordType: 'NONE' | 'PIN' | 'PATTERN';
  setPasswordType: (val: 'NONE' | 'PIN' | 'PATTERN') => void;
  passwordPin: string;
  setPasswordPin: (val: string) => void;
  patternNodes: number[];
  setPatternNodes: React.Dispatch<React.SetStateAction<number[]>>;
  patternNote: string;
  setPatternNote: (val: string) => void;
}

export const OrderClientDeviceSection: React.FC<OrderClientDeviceSectionProps> = (props) => {
  const {
    isDark,
    customers = [],
    filteredCustomers = [],
    selectedCustomer,
    setSelectedCustomer,
    customerSearch,
    setCustomerSearch,
    isSearchOpen,
    setIsSearchOpen,
    searchRef,
    handleSelectCustomer,
    onOpenNewCustomer,
    onOpenEditCustomer,
    setShowQuickCustomerModal,
    pickupType,
    setPickupType,
    authorizedPickupName,
    setAuthorizedPickupName,
    authorizedPickupPhone,
    setAuthorizedPickupPhone,
    deviceType,
    setDeviceType,
    customDeviceTypes,
    brand,
    setBrand,
    model,
    setModel,
    commonBrands,
    imei,
    setImei,
    hasNoDamages,
    setHasNoDamages,
    physicalState,
    setPhysicalState,
  } = props;

  const topDeviceTypes = [
    { label: 'Celular', icon: Smartphone, matches: ['smartphone', 'celular'] },
    { label: 'Tablet', icon: Tablet, matches: ['tablet', 'ipad'] },
    { label: 'Notebook', icon: Laptop, matches: ['notebook', 'laptop'] },
  ];

  const handleSelectQuickType = (canonicalLabel: string) => {
    const norm = canonicalLabel.toLowerCase();
    const list = Array.isArray(customDeviceTypes) ? customDeviceTypes : [];
    const found = list.find((dt) => {
      const n = (dt.name || '').toLowerCase();
      if (norm === 'celular' && (n.includes('smartphone') || n.includes('celular'))) return true;
      if (norm === 'tablet' && (n.includes('tablet') || n.includes('ipad'))) return true;
      if (norm === 'notebook' && (n.includes('notebook') || n.includes('laptop'))) return true;
      return false;
    });

    if (found) {
      setDeviceType(found.name as DeviceType);
    } else {
      setDeviceType((canonicalLabel === 'Celular' ? 'Smartphone' : canonicalLabel) as DeviceType);
    }
  };

  const isQuickTypeActive = (matches: string[]) => {
    const current = (deviceType || '').toLowerCase();
    return matches.some((m) => current.includes(m));
  };

  // Dynamic search list of customers matching search query
  const searchResults = React.useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return [];
    return (customers || []).filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').replace(/\D/g, '');
      const whats = (c.whatsapp || '').replace(/\D/g, '');
      const doc = (c.document || '').replace(/\D/g, '');
      const cleanQ = query.replace(/\D/g, '');
      return (
        name.includes(query) ||
        (cleanQ && (phone.includes(cleanQ) || whats.includes(cleanQ) || doc.includes(cleanQ)))
      );
    }).slice(0, 8);
  }, [customers, customerSearch]);

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-4">
      {/* 1. CLIENTE */}
      <div
        className={`p-4 rounded-3xl border-2 shrink-0 space-y-3 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#08152e]/95 via-[#050f24]/90 to-[#030a1a]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white'
            : 'bg-white border-blue-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-none text-white">
                1. CLIENTE <span className="text-blue-400">*</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Identificação do proprietário do aparelho
              </p>
            </div>
          </div>
          {selectedCustomer ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Identificado</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-bold">
              Busca Automática
            </span>
          )}
        </div>

        {/* Selected Customer Highlight Card */}
        {selectedCustomer && (
          <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-600/40 flex items-center justify-between gap-2 shadow-inner">
            <div className="min-w-0">
              <p className="text-xs font-black text-cyan-300 truncate flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="truncate">{selectedCustomer.name}</span>
              </p>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {selectedCustomer.phone || selectedCustomer.whatsapp || 'Sem telefone'}
                {selectedCustomer.document ? ` • CPF/CNPJ: ${selectedCustomer.document}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onOpenEditCustomer && (
                <button
                  type="button"
                  onClick={() => onOpenEditCustomer(selectedCustomer)}
                  className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-cyan-300 text-[10px] font-bold border border-blue-700/60 transition-all cursor-pointer"
                  title="Editar dados deste cliente"
                >
                  <Pencil className="w-3 h-3 inline mr-0.5" />
                  <span>Editar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer?.(null);
                  setCustomerSearch('');
                  setIsSearchOpen(true);
                }}
                className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-800/60 transition-all cursor-pointer"
                title="Trocar ou desvincular cliente"
              >
                Trocar
              </button>
            </div>
          </div>
        )}

        {/* Campo de Busca de Cliente com Autocomplete */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  setIsSearchOpen(true);
                }}
                placeholder="Digite o nome, telefone ou CPF do cliente..."
                className="w-full pl-9 pr-3 py-2 bg-[#060309] border border-blue-900/80 focus:border-cyan-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden transition-colors shadow-inner"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                if (onOpenNewCustomer) onOpenNewCustomer(customerSearch);
                else if (setShowQuickCustomerModal) setShowQuickCustomerModal(true);
              }}
              title="Cadastrar Novo Cliente no Sistema"
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          </div>

          {/* Autocomplete Dropdown - Aparece ao digitar se o cliente tiver no sistema */}
          {isSearchOpen && customerSearch.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#040c1e] border-2 border-cyan-500/80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 max-h-60 overflow-y-auto divide-y divide-slate-800 scrollbar-thin">
              {searchResults.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 bg-blue-950/90 text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                    <span>Clientes no Sistema ({searchResults.length})</span>
                    <span className="text-[9px] text-slate-400">Clique para selecionar</span>
                  </div>
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        handleSelectCustomer(c);
                        setIsSearchOpen(false);
                      }}
                      className="p-3 hover:bg-blue-900/40 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          📞 {c.phone || c.whatsapp || 'Sem telefone'} {c.document ? ` • 📄 ${c.document}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-600/80 group-hover:bg-cyan-500 text-white shrink-0 shadow-xs transition-all">
                        Selecionar
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center space-y-2">
                  <p className="text-xs text-slate-300">
                    Nenhum cliente cadastrado com o nome &ldquo;<span className="text-cyan-400 font-bold">{customerSearch}</span>&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      if (onOpenNewCustomer) onOpenNewCustomer(customerSearch);
                      else if (setShowQuickCustomerModal) setShowQuickCustomerModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cadastrar &ldquo;{customerSearch}&rdquo; agora
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Opção de Retirada */}
        <div className="space-y-1.5">
          <select
            value={pickupType || 'OWNER_ONLY'}
            onChange={(e) => setPickupType?.(e.target.value as 'OWNER_ONLY' | 'THIRD_PARTY')}
            className="w-full bg-[#060309] text-white border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-hidden cursor-pointer"
          >
            <option value="OWNER_ONLY">Somente proprietário pode retirar</option>
            <option value="THIRD_PARTY">Autorizar outra pessoa a retirar</option>
          </select>
          {pickupType === 'THIRD_PARTY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
              <input
                type="text"
                value={authorizedPickupName || ''}
                onChange={(e) => setAuthorizedPickupName?.(e.target.value)}
                placeholder="Nome de quem retira..."
                className="w-full bg-[#060309] text-white border border-slate-800 rounded-xl px-3 py-1.5 sm:py-2 text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
              <input
                type="text"
                value={authorizedPickupPhone || ''}
                onChange={(e) => setAuthorizedPickupPhone?.(e.target.value)}
                placeholder="Telefone de quem retira..."
                className="w-full bg-[#060309] text-white border border-slate-800 rounded-xl px-3 py-1.5 sm:py-2 text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* SENHA / DESBLOQUEIO */}
      <OrderPasswordSection {...props} />

      {/* 2. EQUIPAMENTO */}
      <div
        className={`p-4 rounded-3xl border-2 shrink-0 space-y-3 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#08152e]/95 via-[#050f24]/90 to-[#030a1a]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white'
            : 'bg-white border-blue-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-none text-white">
                2. EQUIPAMENTO <span className="text-blue-400">*</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Aparelho e especificações técnicas
              </p>
            </div>
          </div>
          <span className="text-[11px] text-cyan-400 font-bold">
            Seleção Rápida
          </span>
        </div>

        {/* Tipos Rápidos (Proporcionais aos botões do Problema Relatado) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {topDeviceTypes.map((t) => {
            const Icon = t.icon;
            const active = isQuickTypeActive(t.matches);
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => handleSelectQuickType(t.label)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-[#0a050f] hover:bg-blue-950/70 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-blue-500/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setDeviceType('Outro'); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              deviceType === 'Outro'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-[#0a050f] hover:bg-blue-950/70 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-blue-500/60'
            }`}
          >
            <span>Outros</span>
          </button>
        </div>

        {(deviceType === 'Outro' || (deviceType !== 'Smartphone' && deviceType !== 'Tablet' && deviceType !== 'Laptop' && deviceType !== '')) && (
          <input
            type="text"
            value={deviceType === 'Outro' ? '' : deviceType}
            onChange={(e) => setDeviceType(e.target.value as DeviceType)}
            placeholder="Qual equipamento? (Ex: Smartwatch, Drone, Caixa de Som)..."
            autoFocus
            className="w-full px-3 py-2 bg-[#060309] border border-blue-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
          />
        )}

        {/* Marca e Modelo lado a lado */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              list="brands-list"
              placeholder="Marca (Ex: Samsung, Apple)..."
              className="w-full bg-[#060309] text-white border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden transition-colors shadow-inner"
            />
            <datalist id="brands-list">
              {commonBrands.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Modelo (Ex: A32, iPhone 11)..."
              className="w-full bg-[#060309] text-white border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* IMEI / Serial */}
        <input
          type="text"
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          placeholder="IMEI ou Número de Série (opcional)..."
          className="w-full px-3 py-2 bg-[#060309] border border-slate-800 focus:border-cyan-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors shadow-inner"
        />

        {/* Estado Físico e Avarias */}
        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasNoDamages}
              onChange={(e) => setHasNoDamages(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-[#060309] text-blue-600 cursor-pointer"
            />
            <span className="font-bold">Aparelho sem avarias aparentes</span>
          </label>
          {!hasNoDamages && (
            <input
              type="text"
              value={physicalState}
              onChange={(e) => setPhysicalState(e.target.value)}
              placeholder="Descreva as avarias (ex: tela trincada, aro amassado)..."
              className="w-full px-3 py-2 bg-[#060309] border border-amber-500/50 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 animate-in fade-in shadow-inner"
            />
          )}
        </div>
      </div>
    </div>
  );
};
