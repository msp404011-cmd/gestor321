import React from 'react';
import {
  User,
  Plus,
  Search,
  Smartphone,
  ChevronDown,
  FileText,
  CheckCircle2,
  Lock,
  KeyRound,
  Grid,
  MessageCircle,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { Customer, DeviceType, CustomDeviceType } from '../../types';
import { PatternLock } from './PatternLock';
import { StorageService } from '../../services/storage';

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
  customers,
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
  onOpenNewCustomer,
  onOpenEditCustomer,
  setShowQuickCustomerModal,
  setQuickCustName,
  isEditingSelectedCustomer,
  setIsEditingSelectedCustomer,
  editCustName,
  setEditCustName,
  editCustPhone,
  setEditCustPhone,
  editCustDoc,
  setEditCustDoc,
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
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
      {/* 1. CLIENTE */}
      <div className={`p-2.5 rounded-xl border shrink-0 space-y-2 ${
        isDark ? 'bg-[#07132c]/85 border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. CLIENTE</span>
          </span>
          {selectedCustomer && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Identificado
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
              className="w-full pl-8 pr-3 py-1.5 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-all shadow-inner"
            />

            {/* Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#081530] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-2 hover:bg-blue-600/25 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate text-xs">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c.phone} {c.document ? `• CPF: ${c.document}` : ''}
                        </p>
                      </div>
                      <span className="text-[9px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded font-bold shrink-0">
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
                      Cadastrar agora?
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
            className="px-2.5 py-1.5 bg-blue-600/25 hover:bg-blue-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
            title="Cadastrar Novo Cliente"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>

        {/* Selected Customer Compact Card */}
        {selectedCustomer && (
          <div className="p-2 rounded-lg bg-[#091734] border border-slate-700/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate leading-tight">
                    {selectedCustomer.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-300 mt-0.5">
                    <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                      <MessageCircle className="w-2.5 h-2.5" />
                      {selectedCustomer.whatsapp || selectedCustomer.phone}
                    </span>
                    {(selectedCustomer.whatsappAlt || selectedCustomer.alternativePhone) && (
                      <span className="text-cyan-300 truncate">
                        Recado: {selectedCustomer.whatsappAlt || selectedCustomer.alternativePhone}
                        {selectedCustomer.alternativeContactName ? ` (${selectedCustomer.alternativeContactName})` : ''}
                      </span>
                    )}
                    {selectedCustomer.document && (
                      <span className="text-slate-400 truncate">Doc: {selectedCustomer.document}</span>
                    )}
                    {whatsappClean && (
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300"
                        title="Abrir WhatsApp"
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
                  className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-md transition-colors cursor-pointer"
                  title="Editar Cadastro Completo do Cliente"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/80 rounded"
                  title="Trocar cliente"
                >
                  Trocar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. EQUIPAMENTO */}
      <div className={`p-2.5 rounded-xl border flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden ${
        isDark ? 'bg-[#07132c]/85 border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. EQUIPAMENTO</span>
          </span>
          {brand && model && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30 truncate max-w-[140px]">
              {brand} {model}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-2 pr-0.5">
          {/* Row 1: Tipo, Marca, Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">Tipo</label>
              <div className="relative">
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                  className="w-full px-2 py-1.5 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-6"
                >
                  {customDeviceTypes.map((dt) => (
                    <option key={dt.id} value={dt.name}>
                      {dt.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                Marca <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="brands-list"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Samsung"
                  className="w-full px-2 py-1.5 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
                <datalist id="brands-list">
                  {commonBrands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                Modelo <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Galaxy A32"
                className="w-full px-2 py-1.5 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Row 2: IMEI / Nº Série & Avarias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                IMEI / Nº Série
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="IMEI ou Serial (opcional)"
                className="w-full px-2 py-1.5 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold text-slate-300">
                  Estado Físico / Avarias
                </label>
                <label className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 cursor-pointer select-none bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={hasNoDamages}
                    onChange={(e) => {
                      setHasNoDamages(e.target.checked);
                      if (e.target.checked) setPhysicalState('');
                    }}
                    className="w-3 h-3 rounded bg-[#091632] border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  <span>Sem Avarias</span>
                </label>
              </div>

              {!hasNoDamages ? (
                <input
                  type="text"
                  value={physicalState}
                  onChange={(e) => setPhysicalState(e.target.value)}
                  placeholder="Ex: Tela riscada, tampa trincada..."
                  className="w-full px-2 py-1.5 bg-[#091632] border border-amber-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              ) : (
                <div className="px-2 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Sem avarias aparentes</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: SENHA DO APARELHO */}
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Senha / Desbloqueio</span>
              </label>

              {/* Mode Selector */}
              <div className="flex items-center bg-[#091632] p-0.5 rounded-lg border border-slate-700/80 gap-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordType('NONE');
                    setPasswordPin('');
                    setPatternNodes([]);
                  }}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    passwordType === 'NONE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sem Senha
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordType('PIN')}
                  className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    passwordType === 'PIN'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-2.5 h-2.5" />
                  <span>PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordType('PATTERN')}
                  className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    passwordType === 'PATTERN'
                      ? 'bg-cyan-600 text-white shadow-xs'
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
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3 h-3" />
                </span>
                <input
                  type="text"
                  value={passwordPin}
                  onChange={(e) => setPasswordPin(e.target.value)}
                  placeholder="Digite a senha alfanumérica ou PIN..."
                  className="w-full pl-7 pr-2 py-1.5 bg-[#091632] border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            )}

            {passwordType === 'PATTERN' && (
              <div className="p-2 rounded-xl bg-[#091632]/90 border border-cyan-500/40 flex items-center gap-3">
                <div className="shrink-0">
                  <PatternLock
                    value={patternNodes}
                    onChange={setPatternNodes}
                    size={110}
                    theme="dark"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="p-1.5 rounded-lg bg-[#060e22] border border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300">Sequência:</span>
                      <button
                        type="button"
                        onClick={() => setPatternNodes([])}
                        className="text-[9px] text-slate-400 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                        title="Limpar desenho"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Limpar
                      </button>
                    </div>
                    <p className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider truncate mt-0.5">
                      {patternNodes.length > 0
                        ? patternNodes.join(' ➔ ')
                        : 'Arraste nos círculos'}
                    </p>
                  </div>

                  <input
                    type="text"
                    value={patternNote}
                    onChange={(e) => setPatternNote(e.target.value)}
                    placeholder="Obs do desenho (Ex: Formato em L)..."
                    className="w-full px-2 py-1 bg-[#060e22] border border-slate-700/80 rounded text-[10px] text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            {passwordType === 'NONE' && (
              <p className="text-[10px] text-slate-400 italic">
                Aparelho liberado sem senha ou PIN de desbloqueio.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
