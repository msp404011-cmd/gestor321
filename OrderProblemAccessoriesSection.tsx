import React from 'react';
import {
  AlertTriangle,
  Settings,
  Headphones,
  Zap,
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
  clientDefect,
  setClientDefect,
  serviceToBeDone,
  setServiceToBeDone,
  showServicePicker,
  setShowServicePicker,
  quickServices,
  deviceType,
  customAccessories,
  customAccMap,
  setCustomAccMap,
  onSelectQuickService,
}) => {
  const activeAccessories = customAccessories.filter((acc) =>
    isAccessoryForDeviceType(acc, deviceType)
  );

  const presentCount = activeAccessories.filter(
    (acc) => customAccMap[acc.id]?.present
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

  const handleUpdateAccessoryDetail = (accId: string, details: string) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: {
        present: prev[accId]?.present ?? true,
        details,
      },
    }));
  };

  // Split accessories into 2 neat columns
  const half = Math.ceil(activeAccessories.length / 2);
  const col1 = activeAccessories.slice(0, half);
  const col2 = activeAccessories.slice(half);

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
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

      {/* 5. CHECKLIST DE ACESSÓRIOS - AURORA PURPLE/VIOLET GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#140722]/95 via-[#0c0316]/90 to-[#07010d]/95 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35),0_0_50px_rgba(168,85,247,0.15)] text-white'
            : 'bg-white border-purple-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
              <Headphones className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-black tracking-wide leading-none text-white">
              CHECKLIST DE ACESSÓRIOS
            </h3>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
              {deviceType}
            </span>
          </div>

          <div className="text-[9px] text-slate-400 font-bold">
            {presentCount > 0 ? (
              <span className="text-emerald-400 font-black">
                {presentCount} marcado{presentCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span>Nenhum acessório</span>
            )}
          </div>
        </div>

        {/* 2-Column Checklist with Segmented Buttons AND Description Input */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-0.5 space-y-1">
          {activeAccessories.length === 0 ? (
            <div className="p-2 rounded-xl bg-[#06020c] border border-slate-800 text-center text-[10px] text-slate-400">
              Nenhum checklist de acessório cadastrado para este tipo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {/* Column 1 */}
              <div className="space-y-1">
                {col1.map((acc) => {
                  const isPresent = Boolean(customAccMap[acc.id]?.present);
                  const details = customAccMap[acc.id]?.details || '';
                  return (
                    <div
                      key={acc.id}
                      className={`p-1.5 rounded-xl border transition-all ${
                        isPresent
                          ? 'bg-[#10031c] border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                          : 'bg-[#07020d] border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className={`w-2 h-2 rounded-xs shrink-0 ${isPresent ? 'bg-purple-400' : 'bg-slate-600'}`} />
                          <span className="text-[11px] font-bold text-white truncate">
                            {acc.name}
                          </span>
                        </div>

                        <div className="flex items-center bg-[#030106] p-0.5 rounded-lg border border-slate-700/80 text-[9px] shrink-0 font-black">
                          <button
                            type="button"
                            onClick={() => handleToggleAccessory(acc.id, false)}
                            className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              !isPresent
                                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            NÃO
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAccessory(acc.id, true)}
                            className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)] font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            SIM
                          </button>
                        </div>
                      </div>

                      {/* Description / Details input */}
                      {isPresent && (
                        <div className="mt-1 pt-1 border-t border-purple-900/40">
                          <input
                            type="text"
                            value={details}
                            onChange={(e) => handleUpdateAccessoryDetail(acc.id, e.target.value)}
                            placeholder={`Descreva ${acc.name.toLowerCase()} (Ex: cor, marca, modelo)...`}
                            className="w-full px-1.5 py-0.5 bg-[#040108] border border-purple-500/40 rounded-lg text-[10px] text-purple-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-400 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Column 2 */}
              <div className="space-y-1">
                {col2.map((acc) => {
                  const isPresent = Boolean(customAccMap[acc.id]?.present);
                  const details = customAccMap[acc.id]?.details || '';
                  return (
                    <div
                      key={acc.id}
                      className={`p-1.5 rounded-xl border transition-all ${
                        isPresent
                          ? 'bg-[#10031c] border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                          : 'bg-[#07020d] border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className={`w-2 h-2 rounded-xs shrink-0 ${isPresent ? 'bg-purple-400' : 'bg-slate-600'}`} />
                          <span className="text-[11px] font-bold text-white truncate">
                            {acc.name}
                          </span>
                        </div>

                        <div className="flex items-center bg-[#030106] p-0.5 rounded-lg border border-slate-700/80 text-[9px] shrink-0 font-black">
                          <button
                            type="button"
                            onClick={() => handleToggleAccessory(acc.id, false)}
                            className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              !isPresent
                                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            NÃO
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAccessory(acc.id, true)}
                            className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)] font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            SIM
                          </button>
                        </div>
                      </div>

                      {/* Description / Details input */}
                      {isPresent && (
                        <div className="mt-1 pt-1 border-t border-purple-900/40">
                          <input
                            type="text"
                            value={details}
                            onChange={(e) => handleUpdateAccessoryDetail(acc.id, e.target.value)}
                            placeholder={`Descreva ${acc.name.toLowerCase()} (Ex: cor, marca, modelo)...`}
                            className="w-full px-1.5 py-0.5 bg-[#040108] border border-purple-500/40 rounded-lg text-[10px] text-purple-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-400 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
