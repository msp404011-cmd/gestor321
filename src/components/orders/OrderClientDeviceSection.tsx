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
  const { isDark, selectedCustomer, customerSearch, setCustomerSearch, setIsSearchOpen, searchRef, handleSelectCustomer, 
          onOpenNewCustomer, setShowQuickCustomerModal, pickupType, setPickupType, authorizedPickupName, 
          setAuthorizedPickupName, authorizedPickupPhone, setAuthorizedPickupPhone, deviceType, setDeviceType, 
          customDeviceTypes, brand, setBrand, model, setModel, commonBrands, imei, setImei, hasNoDamages, 
          setHasNoDamages, physicalState, setPhysicalState } = props;

  const topDeviceTypes = [
    { label: 'Celular', icon: Smartphone, matches: ['smartphone', 'celular'] },
    { label: 'Tablet', icon: Tablet, matches: ['tablet', 'ipad'] },
    { label: 'Notebook', icon: Laptop, matches: ['notebook', 'laptop'] },
  ];

  const topBrands = ['Samsung', 'Xiaomi', 'Motorola', 'Apple'];

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

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-4">
      {/* 1. CLIENTE */}
      <div className={`p-4 rounded-3xl border-2 shrink-0 space-y-3 transition-all ${isDark ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white' : 'bg-white border-blue-400 shadow-lg text-slate-900'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black tracking-wide leading-none text-white">1. CLIENTE</h3>
          </div>
          {selectedCustomer && <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identificado</span>}
        </div>
        <div className="flex items-center gap-2 relative" ref={searchRef}>
          <input type="text" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setIsSearchOpen(true); }} placeholder="Buscar cliente..." className="w-full pl-4 pr-4 py-3 bg-[#040c1e] border border-blue-900/80 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-400" />
          <button type="button" onClick={() => { setIsSearchOpen(false); if (onOpenNewCustomer) onOpenNewCustomer(customerSearch); else if (setShowQuickCustomerModal) setShowQuickCustomerModal(true); }} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-black text-sm transition-all shadow-md shrink-0 cursor-pointer">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <select value={pickupType || 'OWNER_ONLY'} onChange={(e) => setPickupType?.(e.target.value as 'OWNER_ONLY' | 'THIRD_PARTY')} className="bg-[#040c1e] text-white border border-slate-800 rounded-xl p-3">
            <option value="OWNER_ONLY">Somente proprietário</option>
            <option value="THIRD_PARTY">Autorizar terceiros</option>
          </select>
          {pickupType === 'THIRD_PARTY' && (
            <>
              <input type="text" value={authorizedPickupName || ''} onChange={(e) => setAuthorizedPickupName?.(e.target.value)} placeholder="Nome de quem retira..." className="bg-[#040c1e] text-white border border-slate-800 rounded-xl p-3" />
              <input type="text" value={authorizedPickupPhone || ''} onChange={(e) => setAuthorizedPickupPhone?.(e.target.value)} placeholder="Telefone..." className="bg-[#040c1e] text-white border border-slate-800 rounded-xl p-3" />
            </>
          )}
        </div>
      </div>

      {/* SENHA / DESBLOQUEIO */}
      <OrderPasswordSection {...props} />

      {/* 3. EQUIPAMENTO */}
      <div className={`p-4 rounded-3xl border-2 flex-1 flex flex-col space-y-3 transition-all ${isDark ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white' : 'bg-white border-blue-400 shadow-lg text-slate-900'}`}>
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black tracking-wide leading-none text-white">3. EQUIPAMENTO</h3>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid grid-cols-2 gap-2 col-span-2">
              {topDeviceTypes.map((t) => {
                const Icon = t.icon;
                const active = isQuickTypeActive(t.matches);
                return (
                  <button key={t.label} type="button" onClick={() => handleSelectQuickType(t.label)} className={`py-3 px-2 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${active ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400' : 'bg-[#040c1e] border-slate-800 text-slate-300 hover:text-white'}`}>
                    <Icon className="w-5 h-5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
              <button type="button" onClick={() => { setDeviceType('Outro'); }} className={`py-3 px-2 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${deviceType === 'Outro' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400' : 'bg-[#040c1e] border-slate-800 text-slate-300 hover:text-white'}`}>
                <span>Outros</span>
              </button>
            </div>
            {(deviceType === 'Outro' || (deviceType !== 'Smartphone' && deviceType !== 'Tablet' && deviceType !== 'Laptop' && deviceType !== '')) && (
              <input 
                type="text" 
                value={deviceType === 'Outro' ? '' : deviceType} 
                onChange={(e) => setDeviceType(e.target.value as DeviceType)} 
                placeholder="Qual equipamento?" 
                autoFocus
                className="col-span-2 w-full px-4 py-3 bg-[#040c1e] border border-slate-800 rounded-xl text-sm text-white" 
              />
            )}
            <input 
              type="text" 
              value={brand} 
              onChange={(e) => setBrand(e.target.value)} 
              list="brands-list"
              placeholder="Marca..." 
              className="bg-[#040c1e] text-white border border-slate-800 rounded-xl p-3 text-sm col-span-2" 
            />
            <datalist id="brands-list">
              {commonBrands.map(b => <option key={b} value={b} />)}
            </datalist>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo..." className="col-span-2 w-full px-4 py-3 bg-[#040c1e] border border-slate-800 rounded-xl text-sm text-white" />
          </div>
          <input type="text" value={imei} onChange={(e) => setImei(e.target.value)} placeholder="IMEI / Serial..." className="w-full px-4 py-3 bg-[#040c1e] border border-slate-800 rounded-xl text-sm text-white" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={hasNoDamages} onChange={(e) => setHasNoDamages(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-[#040c1e] text-blue-600" />
              Sem avarias
            </label>
          </div>
          <input type="text" value={physicalState} onChange={(e) => setPhysicalState(e.target.value)} placeholder="Detalhes de avarias..." className="w-full px-4 py-3 bg-[#040c1e] border border-slate-800 rounded-xl text-sm text-white" />
        </div>
      </div>
    </div>
  );
};
