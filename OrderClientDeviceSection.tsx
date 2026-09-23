import React from 'react';
import {
  User,
  Plus,
  Search,
  Smartphone,
  Tablet,
  Laptop,
  ChevronDown,
  CheckCircle2,
  Lock,
  KeyRound,
  Grid,
  MessageCircle,
  Pencil,
  RotateCcw,
  Shield,
  Star,
} from 'lucide-react';
import { Customer, DeviceType, CustomDeviceType } from '../../types';
import { PatternLock } from './PatternLock';

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
  setQuickCustName?: (val: string) => void;
  isEditingSelectedCustomer?: boolean;
  setIsEditingSelectedCustomer?: (val: boolean) => void;
  editCustName?: string;
  setEditCustName?: (val: string) => void;
  editCustPhone?: string;
  setEditCustPhone?: (val: string) => void;
  editCustDoc?: string;
  setEditCustDoc?: (val: string) => void;
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

export const OrderClientDeviceSection: React.FC<OrderClientDeviceSectionProps> = ({
  isDark,
  filteredCustomers,
  customerSearch,
  setCustomerSearch,
  isSearchOpen,
  setIsSearchOpen,
  searchRef,
  handleSelectCustomer,
  selectedCustomer,
  setSelectedCustomer,
  whatsappClean,
  pickupType = 'OWNER_ONLY',
  setPickupType,
  authorizedPickupName = '',
  setAuthorizedPickupName,
  authorizedPickupPhone = '',
  setAuthorizedPickupPhone,
  onOpenNewCustomer,
  onOpenEditCustomer,
  setShowQuickCustomerModal,
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
  passwordType,
  setPasswordType,
  passwordPin,
  setPasswordPin,
  patternNodes,
  setPatternNodes,
  patternNote,
  setPatternNote,
}) => {
  const topDeviceTypes = [
    { label: 'Celular', icon: Smartphone, matches: ['smartphone', 'celular'] },
    { label: 'Tablet', icon: Tablet, matches: ['tablet', 'ipad'] },
    { label: 'Notebook', icon: Laptop, matches: ['notebook', 'laptop'] },
  ];

  const topBrands = ['Samsung', 'Xiaomi', 'Motorola', 'Apple'];

  const handleSelectQuickType = (canonicalLabel: string) => {
    const norm = canonicalLabel.toLowerCase();
    const found = customDeviceTypes.find((dt) => {
      const n = dt.name.toLowerCase();
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

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
      {/* 1. CLIENTE - AURORA BLUE GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 shrink-0 space-y-2 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white'
            : 'bg-white border-blue-400 shadow-lg text-slate-900'
        }`}
      >
        {/* Header 1. CLIENTE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <User className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wide leading-none text-white">
                1. CLIENTE
              </h3>
            </div>
          </div>
          {selectedCustomer && (
            <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              ✓ Identificado
            </span>
          )}
        </div>

        {/* Customer Search & Quick Add */}
        <div className="flex items-center gap-1.5 relative" ref={searchRef}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Buscar cliente por nome, telefone ou CPF..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#040c1e] border border-blue-900/80 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden transition-all shadow-inner"
            />

            {/* Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#07132a] border border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-2 hover:bg-blue-600/30 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate text-xs">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c.phone} {c.document ? `• CPF: ${c.document}` : ''}
                        </p>
                      </div>
                      <span className="text-[9px] text-cyan-300 bg-cyan-950/80 border border-cyan-700 px-1.5 py-0.5 rounded-lg font-bold shrink-0">
                        Selecionar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-2.5 text-center text-xs text-slate-400">
                    Nenhum cliente encontrado.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        if (onOpenNewCustomer) {
                          onOpenNewCustomer(customerSearch);
                        } else if (setShowQuickCustomerModal) {
                          setShowQuickCustomerModal(true);
                        }
                      }}
                      className="text-cyan-400 font-bold hover:underline cursor-pointer ml-1"
                    >
                      Cadastrar?
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              if (onOpenNewCustomer) {
                onOpenNewCustomer(customerSearch);
              } else if (setShowQuickCustomerModal) {
                setShowQuickCustomerModal(true);
              }
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0 cursor-pointer"
            title="Cadastrar Novo Cliente"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <div className="p-2 rounded-xl bg-[#040c1e] border border-blue-500/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate leading-tight">
                    {selectedCustomer.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <span className="text-emerald-400 font-semibold truncate">
                      {selectedCustomer.whatsapp || selectedCustomer.phone}
                    </span>
                    {whatsappClean && (
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEditCustomer) {
                      onOpenEditCustomer(selectedCustomer);
                    }
                  }}
                  className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-lg transition-colors cursor-pointer"
                  title="Editar Cadastro do Cliente"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="px-1.5 py-0.5 text-[9px] text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800/90 rounded-md font-bold"
                >
                  Trocar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUEM RETIRA O APARELHO? */}
        {setPickupType && (
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>QUEM RETIRA O APARELHO?</span>
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPickupType('OWNER_ONLY');
                  if (setAuthorizedPickupName) setAuthorizedPickupName('');
                  if (setAuthorizedPickupPhone) setAuthorizedPickupPhone('');
                }}
                className={`py-1.5 px-2 rounded-xl font-black text-[11px] transition-all cursor-pointer flex items-center justify-center ${
                  pickupType === 'OWNER_ONLY'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.55)] border border-blue-400'
                    : 'bg-[#040c1e] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>Só o Dono</span>
              </button>

              <button
                type="button"
                onClick={() => setPickupType('THIRD_PARTY')}
                className={`py-1.5 px-2 rounded-xl font-black text-[11px] transition-all cursor-pointer flex items-center justify-center ${
                  pickupType === 'THIRD_PARTY'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.55)] border border-amber-400'
                    : 'bg-[#040c1e] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>Outra Pessoa</span>
              </button>
            </div>

            {pickupType === 'THIRD_PARTY' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80 animate-in fade-in">
                <div>
                  <input
                    type="text"
                    value={authorizedPickupName}
                    onChange={(e) => setAuthorizedPickupName && setAuthorizedPickupName(e.target.value)}
                    placeholder="Nome da pessoa..."
                    className="w-full px-2 py-1 bg-[#040c1e] border border-amber-500/50 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={authorizedPickupPhone}
                    onChange={(e) => setAuthorizedPickupPhone && setAuthorizedPickupPhone(e.target.value)}
                    placeholder="WhatsApp..."
                    className="w-full px-2 py-1 bg-[#040c1e] border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. EQUIPAMENTO - AURORA BLUE GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white'
            : 'bg-white border-blue-400 shadow-lg text-slate-900'
        }`}
      >
        {/* Header 2. EQUIPAMENTO */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <Smartphone className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wide leading-none text-white">
                2. EQUIPAMENTO
              </h3>
            </div>
          </div>
          {brand && model && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/40 truncate max-w-[130px]">
              {brand} {model}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5">
          {/* Top 3 Quick Types */}
          <div className="grid grid-cols-3 gap-1">
            {topDeviceTypes.map((t) => {
              const Icon = t.icon;
              const active = isQuickTypeActive(t.matches);
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleSelectQuickType(t.label)}
                  className={`py-1.5 px-1 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.55)] border-blue-400'
                      : 'bg-[#040c1e] border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Outro tipo Select */}
          <div className="relative">
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="w-full px-2 py-1 bg-[#040c1e] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-7"
            >
              {customDeviceTypes.map((dt) => (
                <option key={dt.id} value={dt.name}>
                  Outro tipo: {dt.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Marcas Mais Usadas */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <span>Marca <span className="text-cyan-400 font-bold">(Mais Usadas)</span></span>
                <Star className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {topBrands.map((bName) => {
                const active = brand.trim().toLowerCase() === bName.toLowerCase();
                return (
                  <button
                    key={bName}
                    type="button"
                    onClick={() => setBrand(bName)}
                    className={`py-1 px-1 rounded-lg border text-[11px] font-black flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.55)] border-blue-400'
                        : 'bg-[#040c1e] border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{bName}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div>
                <input
                  type="text"
                  list="brands-list"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Marca (Ex: Samsung)..."
                  className="w-full px-2 py-1 bg-[#040c1e] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
                <datalist id="brands-list">
                  {commonBrands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Modelo * (Ex: A32 / iPhone 13)..."
                  className="w-full px-2 py-1 bg-[#040c1e] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Row: IMEI / Nº Série & Estado Físico */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-slate-800/80">
            <div>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="IMEI / Serial (opcional)"
                className="w-full px-2 py-1 bg-[#040c1e] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div>
              {!hasNoDamages ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={physicalState}
                    onChange={(e) => setPhysicalState(e.target.value)}
                    placeholder="Avarias..."
                    className="flex-1 px-2 py-1 bg-[#040c1e] border border-amber-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setHasNoDamages(true);
                      setPhysicalState('');
                    }}
                    className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setHasNoDamages(false)}
                  className="px-2 py-1 bg-[#040c1e] border border-emerald-500/40 rounded-lg text-[11px] text-emerald-300 font-bold flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Sem avarias</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-normal">Alterar</span>
                </div>
              )}
            </div>
          </div>

          {/* Senha / Desbloqueio */}
          <div className="pt-1 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase text-cyan-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Senha / Desbloqueio</span>
              </label>

              {/* Mode Selector */}
              <div className="flex items-center bg-[#040c1e] p-0.5 rounded-lg border border-slate-800 gap-0.5 text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordType('NONE');
                    setPasswordPin('');
                    setPatternNodes([]);
                  }}
                  className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer ${
                    passwordType === 'NONE'
                      ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sem Senha
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordType('PIN')}
                  className={`px-2 py-0.5 rounded font-black transition-all flex items-center gap-0.5 cursor-pointer ${
                    passwordType === 'PIN'
                      ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-2.5 h-2.5" />
                  <span>PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordType('PATTERN')}
                  className={`px-2 py-0.5 rounded font-black transition-all flex items-center gap-0.5 cursor-pointer ${
                    passwordType === 'PATTERN'
                      ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <Grid className="w-2.5 h-2.5" />
                  <span>Desenho</span>
                </button>
              </div>
            </div>

            {/* Password Views */}
            {passwordType === 'PIN' && (
              <div className="relative animate-in fade-in">
                <input
                  type="text"
                  value={passwordPin}
                  onChange={(e) => setPasswordPin(e.target.value)}
                  placeholder="Senha / PIN de desbloqueio..."
                  className="w-full px-2 py-1 bg-[#040c1e] border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            )}

            {passwordType === 'PATTERN' && (
              <div className="p-2 rounded-xl bg-[#040c1e] border border-cyan-500/50 flex items-center gap-2 animate-in fade-in">
                <div className="shrink-0">
                  <PatternLock
                    value={patternNodes}
                    onChange={setPatternNodes}
                    size={90}
                    theme="dark"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="p-1 rounded-lg bg-[#07132a] border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-300">Sequência:</span>
                      <button
                        type="button"
                        onClick={() => setPatternNodes([])}
                        className="text-[9px] text-slate-400 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Limpar
                      </button>
                    </div>
                    <p className="text-[10px] font-mono font-black text-cyan-300 truncate">
                      {patternNodes.length > 0 ? patternNodes.join(' ➔ ') : 'Arraste nos pontos'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {passwordType === 'NONE' && (
              <p className="text-[9px] text-slate-400 italic">
                Aparelho liberado sem senha de desbloqueio.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
