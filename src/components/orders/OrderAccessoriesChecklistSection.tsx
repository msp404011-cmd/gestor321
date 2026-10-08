import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Check,
  X,
  RotateCcw,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Tag,
  FileText,
  Smartphone,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CustomAccessoryItem, DeviceType } from '../../types';
import { isAccessoryForDeviceType } from '../../services/storage';

interface OrderAccessoriesChecklistSectionProps {
  isDark?: boolean;
  deviceType: DeviceType;
  customAccessories: CustomAccessoryItem[];
  customAccMap: Record<string, { present: boolean; details: string }>;
  setCustomAccMap: React.Dispatch<
    React.SetStateAction<Record<string, { present: boolean; details: string }>>
  >;
  onNavigateToTab?: (tab: 'PROBLEMA' | 'CHECKLIST') => void;
  checklistFilledCount?: number;
}

const COMMON_DETAIL_TAGS = [
  'Original',
  'Paralelo',
  'Com avaria',
  'Arranhado',
  'Sem cabo',
  'Preto',
  'Branco',
  'Silicone',
];

export const OrderAccessoriesChecklistSection: React.FC<
  OrderAccessoriesChecklistSectionProps
> = ({
  isDark = true,
  deviceType = 'Smartphone',
  customAccessories = [],
  customAccMap = {},
  setCustomAccMap,
  onNavigateToTab,
  checklistFilledCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PRESENT' | 'NOT_PRESENT'>('ALL');

  // Filter accessories relevant for this device type
  const activeAccessories = useMemo(() => {
    return (customAccessories || []).filter((acc) =>
      isAccessoryForDeviceType(acc, deviceType)
    );
  }, [customAccessories, deviceType]);

  // Count how many are marked as SIM
  const presentCount = useMemo(() => {
    return activeAccessories.filter(
      (acc) => customAccMap?.[acc.id]?.present
    ).length;
  }, [activeAccessories, customAccMap]);

  // Filtered by search and mode
  const filteredAccessories = useMemo(() => {
    return activeAccessories.filter((acc) => {
      const isPresent = Boolean(customAccMap[acc.id]?.present);
      if (filterMode === 'PRESENT' && !isPresent) return false;
      if (filterMode === 'NOT_PRESENT' && isPresent) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchDetails = (customAccMap[acc.id]?.details || '').toLowerCase().includes(q);
      return matchName || matchDetails;
    });
  }, [activeAccessories, customAccMap, filterMode, searchQuery]);

  // Compiled summary text for print
  const accessoriesSummary = useMemo(() => {
    const list: string[] = [];
    activeAccessories.forEach((acc) => {
      const state = customAccMap[acc.id];
      if (state?.present) {
        const details = state.details?.trim();
        list.push(`${acc.name}${details ? ` (${details})` : ''}`);
      }
    });

    if (list.length === 0) {
      return 'Nenhum acessório adicional entregue (Aparelho avulso)';
    }
    return list.join(' • ');
  }, [activeAccessories, customAccMap]);

  const handleToggleAccessory = (accId: string, present: boolean) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: {
        present,
        details: prev[accId]?.details || '',
      },
    }));
  };

  const handleUpdateAccessoryDetail = (accId: string, details: string) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: {
        present: prev[accId]?.present ?? true,
        details,
      },
    }));
  };

  const handleAppendTag = (accId: string, tag: string) => {
    const current = customAccMap[accId]?.details || '';
    if (!current.trim()) {
      handleUpdateAccessoryDetail(accId, tag);
    } else if (!current.toLowerCase().includes(tag.toLowerCase())) {
      handleUpdateAccessoryDetail(accId, `${current.trim()}, ${tag}`);
    }
  };

  // Quick Action: Mark all active accessories as NÃO (Aparelho avulso)
  const handleMarkAllNone = () => {
    setCustomAccMap((prev) => {
      const updated = { ...prev };
      activeAccessories.forEach((acc) => {
        updated[acc.id] = {
          present: false,
          details: '',
        };
      });
      return updated;
    });
  };

  // Quick Action: Reset / clear all
  const handleClearAll = () => {
    setCustomAccMap((prev) => {
      const updated = { ...prev };
      activeAccessories.forEach((acc) => {
        delete updated[acc.id];
      });
      return updated;
    });
  };

  return (
    <div
      className={`rounded-2xl border-2 flex flex-col h-full min-h-0 overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-b from-[#140722]/95 via-[#0c0316]/90 to-[#07010d]/95 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.25)] text-white'
          : 'bg-white border-purple-400 shadow-xl text-slate-900'
      }`}
    >
      {/* 1. TOP HEADER - COMPLETE INFO & BATCH BUTTONS */}
      <div className="p-2.5 sm:p-3 border-b border-purple-500/30 shrink-0 bg-[#090212] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.45)] shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black tracking-wide leading-none text-white">
                CHECKLIST DE ACESSÓRIOS
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950/90 border border-cyan-500/50 text-cyan-300">
                {deviceType}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                presentCount > 0
                  ? 'bg-purple-950 text-purple-300 border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}>
                {presentCount} de {activeAccessories.length} entregue{presentCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Identifique se o cliente deixou carregador, chip, cartão, capinha ou cabos
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleMarkAllNone}
            className="px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black bg-[#160624] hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400 transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
            title="Marcar todos como NÃO (Aparelho veio avulso)"
          >
            <X className="w-3 h-3 text-rose-400" />
            <span>Nenhum (Aparelho Avulso)</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="Resetar checklist"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="px-2.5 py-1.5 border-b border-purple-900/40 bg-[#06010a] flex items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar acessório..."
            className="w-full pl-8 pr-2 py-1 bg-[#0d0317] border border-purple-900/60 focus:border-purple-400 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#0e0419]'
            }`}
          >
            Todos ({activeAccessories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('PRESENT')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'PRESENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-white bg-[#0e0419]'
            }`}
          >
            <span>SIM</span>
            <span className="px-1 py-0.2 rounded-full text-[9px] bg-black/40 font-black">{presentCount}</span>
          </button>
        </div>
      </div>

      {/* 3. SCROLLABLE ACCESSORIES LIST - ERGONOMIC, UNIFORM ON ALL DESKTOP SIZES */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 sm:p-2.5 space-y-2">
        {filteredAccessories.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-2 bg-[#090214] rounded-2xl border border-slate-800">
            <Headphones className="w-8 h-8 text-purple-400 mx-auto opacity-50" />
            <p className="text-xs text-slate-300 font-bold">
              {searchQuery
                ? `Nenhum acessório encontrado para "${searchQuery}"`
                : `Nenhum acessório configurado para o tipo "${deviceType}"`}
            </p>
            <p className="text-[11px] text-slate-500">
              Você pode cadastrar novos itens nas configurações do sistema.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredAccessories.map((acc) => {
              const isPresent = Boolean(customAccMap[acc.id]?.present);
              const details = customAccMap[acc.id]?.details || '';

              return (
                <div
                  key={acc.id}
                  className={`p-2.5 rounded-2xl border-2 transition-all ${
                    isPresent
                      ? 'bg-gradient-to-r from-[#170529] to-[#0f031b] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/30'
                      : 'bg-[#090213]/90 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Top Item Row: Title & SIM/NÃO Segmented Control */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isPresent
                          ? 'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {isPresent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs sm:text-sm font-extrabold truncate block ${
                          isPresent ? 'text-white' : 'text-slate-300'
                        }`}>
                          {acc.name}
                        </span>
                        {acc.placeholder && !details && (
                          <span className="text-[10px] text-slate-500 truncate block">
                            Dica: {acc.placeholder}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* High-visibility SIM / NÃO Toggle */}
                    <div className="flex items-center bg-[#05010a] p-1 rounded-xl border border-slate-700/80 text-[10px] sm:text-[11px] shrink-0 font-black shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleToggleAccessory(acc.id, false)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          !isPresent
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>NÃO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAccessory(acc.id, true)}
                        className={`px-3.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-black ${
                          isPresent
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] ring-1 ring-purple-300'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>SIM</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Container when SIM is active */}
                  {isPresent && (
                    <div className="mt-2 pt-2 border-t border-purple-900/50 space-y-1.5 animate-in fade-in duration-150">
                      <div className="relative">
                        <input
                          type="text"
                          value={details}
                          onChange={(e) => handleUpdateAccessoryDetail(acc.id, e.target.value)}
                          placeholder={acc.placeholder || `Descreva ${acc.name.toLowerCase()} (ex: cor, marca, voltagem, avaria)...`}
                          className="w-full px-2.5 py-1.5 bg-[#07010e] border border-purple-500/50 focus:border-purple-400 rounded-xl text-xs text-purple-100 placeholder-slate-500 focus:outline-hidden font-medium transition-colors shadow-inner"
                        />
                        {details && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAccessoryDetail(acc.id, '')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                            title="Limpar detalhe"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Quick Detail Tags */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] text-purple-300 font-bold flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Dica rápida:</span>
                        </span>
                        {COMMON_DETAIL_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAppendTag(acc.id, tag)}
                            className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-[#11041d] hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FOOTER: SUMMARY & FAST STEP NAVIGATION */}
      <div className="p-2 sm:p-2.5 border-t border-purple-500/30 bg-[#090212] shrink-0 space-y-2">
        {/* Live summary display for ticket */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[#06010a] border border-purple-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Saída na OS:</span>
            <span className="text-[11px] text-purple-200 truncate font-semibold">
              {accessoriesSummary}
            </span>
          </div>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/40 shrink-0">
            {presentCount} item{presentCount === 1 ? '' : 'ns'}
          </span>
        </div>

        {/* Navigation buttons to move between Intake Steps */}
        {onNavigateToTab && (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('PROBLEMA')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Defeito</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('CHECKLIST')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>Avançar para Checklist Técnico</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/30 font-black">
                {checklistFilledCount}/17
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
