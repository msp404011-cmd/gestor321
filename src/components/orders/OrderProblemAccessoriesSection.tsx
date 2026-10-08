import React from 'react';
import {
  AlertTriangle,
  Settings,
  Headphones,
  Zap,
  CheckSquare,
  ChevronRight,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { CustomAccessoryItem, DeviceType } from '../../types';
import { isAccessoryForDeviceType } from '../../services/storage';

interface OrderProblemAccessoriesSectionProps {
  isDark: boolean;
  clientDefect: string;
  setClientDefect: React.Dispatch<React.SetStateAction<string>>;
  serviceToBeDone: string;
  setServiceToBeDone: React.Dispatch<React.SetStateAction<string>>;
  showServicePicker: boolean;
  setShowServicePicker: React.Dispatch<React.SetStateAction<boolean>>;
  quickServices: { name: string; price: number }[];
  deviceType: DeviceType;
  customAccessories: CustomAccessoryItem[];
  customAccMap: Record<string, { present: boolean; details: string }>;
  setCustomAccMap: React.Dispatch<
    React.SetStateAction<Record<string, { present: boolean; details: string }>>
  >;
  onSelectQuickService?: (serviceName: string, price: number) => void;
  onOpenAccessoriesTab?: () => void;
  onOpenChecklistTab?: () => void;
  checklistFilledCount?: number;
}

const COMMON_DEFECT_TAGS = [
  'Não liga',
  'Tela quebrada',
  'Não carrega',
  'Bateria viciada',
  'Sem áudio',
  'Molhou / oxidado',
];

export const OrderProblemAccessoriesSection: React.FC<
  OrderProblemAccessoriesSectionProps
> = ({
  isDark,
  clientDefect = '',
  setClientDefect,
  serviceToBeDone = '',
  setServiceToBeDone,
  showServicePicker = false,
  setShowServicePicker,
  quickServices = [],
  deviceType = 'Smartphone',
  customAccessories = [],
  customAccMap = {},
  setCustomAccMap,
  onSelectQuickService,
  onOpenAccessoriesTab,
  onOpenChecklistTab,
  checklistFilledCount = 0,
}) => {
  const activeAccessories = (customAccessories || []).filter((acc) =>
    isAccessoryForDeviceType(acc, deviceType)
  );

  const presentCount = activeAccessories.filter(
    (acc) => customAccMap?.[acc.id]?.present
  ).length;

  const handleAddDefectTag = (tag: string) => {
    if (!clientDefect.trim()) {
      setClientDefect(tag);
    } else if (!clientDefect.toLowerCase().includes(tag.toLowerCase())) {
      setClientDefect((prev) => `${prev.trim()}, ${tag}`);
    }
  };

  const handleToggleAccessory = (accId: string, present: boolean) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: {
        present,
        details: prev[accId]?.details || '',
      },
    }));
  };

  // Compile present accessories into a short string
  const presentSummaryText = React.useMemo(() => {
    const list: string[] = [];
    activeAccessories.forEach((acc) => {
      const state = customAccMap[acc.id];
      if (state?.present) {
        list.push(acc.name + (state.details ? ` (${state.details})` : ''));
      }
    });
    return list.length > 0 ? list.join(', ') : 'Nenhum acessório marcado (Aparelho avulso)';
  }, [activeAccessories, customAccMap]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-2.5 overflow-y-auto scrollbar-thin pr-1 pb-1">
      {/* 3. PROBLEMA RELATADO - AURORA ROSE/RED GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 shrink-0 space-y-1.5 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#180812]/95 via-[#0e040b]/90 to-[#070206]/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.35),0_0_50px_rgba(244,63,94,0.15)] text-white'
            : 'bg-white border-rose-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-rose-600/30 border border-rose-400/60 flex items-center justify-center text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)] shrink-0">
              <AlertTriangle className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-black tracking-wide leading-none text-white">
              3. PROBLEMA RELATADO <span className="text-rose-400">*</span>
            </h3>
          </div>
          <span className="text-[9px] text-rose-300 font-bold flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-rose-400" />
            <span>Preenchimento rápido:</span>
          </span>
        </div>

        {/* Quick Defect Tags */}
        <div className="flex flex-wrap gap-1">
          {COMMON_DEFECT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddDefectTag(tag)}
              className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#0a050f] hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/60 transition-all cursor-pointer shadow-xs"
            >
              + {tag}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            rows={2}
            maxLength={500}
            value={clientDefect}
            onChange={(e) => setClientDefect(e.target.value)}
            placeholder="Descreva o defeito reclamado pelo cliente..."
            className="w-full p-2 pb-5 bg-[#060309] border border-rose-500/40 focus:border-rose-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-tight transition-colors shadow-inner"
          />
          <span className="absolute right-2 bottom-1 text-[9px] font-mono text-slate-500 pointer-events-none">
            {clientDefect.length}/500
          </span>
        </div>
      </div>

      {/* 4. SERVIÇO / DIAGNÓSTICO - AURORA AMBER GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 shrink-0 space-y-1.5 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#181105]/95 via-[#0e0a02]/90 to-[#070501]/95 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.35),0_0_50px_rgba(245,158,11,0.15)] text-white'
            : 'bg-white border-amber-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-600/30 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0">
              <Settings className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-black tracking-wide leading-none text-white">
              4. SERVIÇO / DIAGNÓSTICO
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowServicePicker(!showServicePicker)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/60 flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)]"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{showServicePicker ? 'Ocultar' : '⚡ Serviços Rápidos'}</span>
          </button>
        </div>

        {/* Quick services picker */}
        {showServicePicker && (
          <div className="p-2 rounded-xl bg-[#080502] border border-cyan-500/50 space-y-1 animate-in fade-in">
            <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-0.5">
              {quickServices.map((qs) => (
                <button
                  key={qs.name}
                  type="button"
                  onClick={() => {
                    if (onSelectQuickService) {
                      onSelectQuickService(qs.name, qs.price);
                    } else {
                      setServiceToBeDone(qs.name);
                    }
                    setShowServicePicker(false);
                  }}
                  className="p-1 text-left rounded-lg bg-[#0e0904] hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/60 text-[11px] text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate pr-1">{qs.name}</span>
                  <span className="font-black text-emerald-400 shrink-0 font-mono text-[10px]">
                    R$ {qs.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={2}
            maxLength={500}
            value={serviceToBeDone}
            onChange={(e) => setServiceToBeDone(e.target.value)}
            placeholder="Descreva o serviço ou diagnóstico previsto..."
            className="w-full p-2 pb-5 bg-[#080502] border border-amber-500/40 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-tight transition-colors shadow-inner"
          />
          <span className="absolute right-2 bottom-1 text-[9px] font-mono text-slate-500 pointer-events-none">
            {serviceToBeDone.length}/500
          </span>
        </div>
      </div>

      {/* 5. CHECKLIST DE ACESSÓRIOS - INTERACTIVE INTEGRATION CARD */}
      <div
        className={`p-3 rounded-2xl border-2 shrink-0 space-y-2 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#140722]/95 via-[#0c0316]/90 to-[#07010d]/95 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] text-white'
            : 'bg-white border-purple-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black tracking-wide leading-none text-white flex items-center gap-1.5 truncate">
                <span>CHECKLIST DE ACESSÓRIOS</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                  {deviceType}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {presentCount > 0 ? presentSummaryText : 'Identifique se o cliente entregou acessórios'}
              </p>
            </div>
          </div>

          {onOpenAccessoriesTab && (
            <button
              type="button"
              onClick={onOpenAccessoriesTab}
              className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <span>{presentCount > 0 ? `Ver Acessórios (${presentCount})` : 'Abrir Checklist'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick row of accessories buttons for fast toggling directly from Defect tab */}
        {activeAccessories.length > 0 && (
          <div className="pt-1.5 border-t border-purple-900/40">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-slate-400">
                Acesso Rápido ({presentCount} marcado{presentCount === 1 ? '' : 's'}):
              </span>
              {onOpenAccessoriesTab && (
                <button
                  type="button"
                  onClick={onOpenAccessoriesTab}
                  className="text-[10px] text-purple-300 hover:text-white font-bold underline cursor-pointer"
                >
                  Editar detalhes e cores →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {activeAccessories.slice(0, 6).map((acc) => {
                const isPresent = Boolean(customAccMap[acc.id]?.present);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleToggleAccessory(acc.id, !isPresent)}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 text-[11px] font-bold ${
                      isPresent
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                        : 'bg-[#080210] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{acc.name}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-black shrink-0 ${
                      isPresent ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isPresent ? 'SIM' : 'NÃO'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. CHECKLIST TÉCNICO - SHORTCUT BANNER */}
      {onOpenChecklistTab && (
        <button
          type="button"
          onClick={onOpenChecklistTab}
          className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#071922] to-cyan-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 text-white text-xs font-black flex items-center justify-between cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 group active:scale-98"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-400/60 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-white">CHECKLIST TÉCNICO DO APARELHO</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  {checklistFilledCount > 0 ? `${checklistFilledCount}/17` : '17 testes'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Testes de tela, som, câmeras, biometria e botões
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-[11px] font-black text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <span>{checklistFilledCount > 0 ? 'Ver Testes' : 'Abrir Testes'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
};
