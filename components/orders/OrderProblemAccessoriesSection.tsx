import React, { useRef } from 'react';
import {
  Settings,
  Headphones,
  CheckCircle2,
  Sparkles,
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
  'Tela quebrada / sem imagem',
  'Não carrega / conector ruim',
  'Bateria viciada / descarregando',
  'Sem áudio / microfone',
  'Molhou / oxidado',
  'Reiniciando sozinho',
  'Lento / travando',
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

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
      {/* 3. PROBLEMA RELATADO PELO CLIENTE */}
      <div
        className={`p-2.5 rounded-xl border shrink-0 space-y-1.5 ${
          isDark
            ? 'bg-[#07132c]/85 border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-400 font-black text-[11px] uppercase tracking-wider">
            <div className="w-3.5 h-3.5 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[9px]">
              !
            </div>
            <span className="text-slate-200">
              3. PROBLEMA RELATADO <span className="text-rose-400">*</span>
            </span>
          </div>
          <span className="text-[9px] text-slate-400">Clique para preencher rápido:</span>
        </div>

        {/* Quick defect tags */}
        <div className="flex flex-wrap gap-1">
          {COMMON_DEFECT_TAGS.slice(0, 6).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddDefectTag(tag)}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#091632] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={clientDefect}
          onChange={(e) => setClientDefect(e.target.value)}
          placeholder="Descreva o defeito reclamado pelo cliente (Ex: Não liga, tela trincada...)"
          className="w-full p-2 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
        />
      </div>

      {/* 4. SERVIÇO A SER FEITO / DIAGNÓSTICO */}
      <div
        className={`p-2.5 rounded-xl border shrink-0 space-y-1.5 ${
          isDark
            ? 'bg-[#07132c]/85 border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400 font-black text-[11px] uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200">4. SERVIÇO / DIAGNÓSTICO</span>
          </div>

          <button
            type="button"
            onClick={() => setShowServicePicker(!showServicePicker)}
            className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Zap className="w-2.5 h-2.5 text-cyan-400" />
            <span>{showServicePicker ? 'Ocultar Rápidos' : '⚡ Serviços Rápidos'}</span>
          </button>
        </div>

        {/* Quick services dropdown */}
        {showServicePicker && (
          <div className="p-2 rounded-lg bg-[#061024] border border-cyan-500/40 space-y-1 animate-in fade-in">
            <p className="text-[10px] font-bold text-cyan-300">Selecione para preencher:</p>
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
                  className="p-1 text-left rounded bg-[#081530] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate pr-1">{qs.name}</span>
                  <span className="font-bold text-emerald-400 shrink-0">
                    R$ {qs.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          rows={2}
          value={serviceToBeDone}
          onChange={(e) => setServiceToBeDone(e.target.value)}
          placeholder="Descreva o serviço/diagnóstico previsto (Ex: Troca de tela, limpeza química...)"
          className="w-full p-2 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
        />
      </div>

      {/* CHECKLIST DE ACESSÓRIOS DE ENTRADA */}
      <div
        className={`p-2.5 rounded-xl border flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden ${
          isDark
            ? 'bg-[#07132c]/85 border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              Checklist de Acessórios
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
              {deviceType}
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            {presentCount > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                {presentCount} marcado{presentCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span>Nenhum acessório</span>
            )}
          </div>
        </div>

        {/* Accessories container with compact items */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
          {activeAccessories.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#091632] border border-slate-800 text-center text-[10px] text-slate-400">
              Nenhum checklist de acessório cadastrado para este tipo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeAccessories.map((acc) => {
                const itemState = customAccMap[acc.id] || {
                  present: false,
                  details: '',
                };
                return (
                  <div
                    key={acc.id}
                    className={`p-1.5 rounded-lg border transition-all flex items-center justify-between gap-1.5 ${
                      itemState.present
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : 'bg-[#091632] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          itemState.present ? 'bg-emerald-400 shadow-xs' : 'bg-slate-500'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-white truncate">
                        {acc.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-[#060e22] p-0.2 rounded border border-slate-700">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomAccMap((prev) => ({
                              ...prev,
                              [acc.id]: {
                                ...(prev[acc.id] || { details: '' }),
                                present: false,
                              },
                            }))
                          }
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                            !itemState.present
                              ? 'bg-slate-700 text-slate-200'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          NÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAccMap((prev) => ({
                              ...prev,
                              [acc.id]: {
                                ...(prev[acc.id] || { details: '' }),
                                present: true,
                              },
                            }));
                            setTimeout(() => {
                              inputRefs.current[acc.id]?.focus();
                            }, 50);
                          }}
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                            itemState.present
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          SIM
                        </button>
                      </div>

                      {itemState.present && (
                        <input
                          ref={(el) => (inputRefs.current[acc.id] = el)}
                          type="text"
                          value={itemState.details}
                          onChange={(e) =>
                            setCustomAccMap((prev) => ({
                              ...prev,
                              [acc.id]: {
                                ...(prev[acc.id] || { present: true }),
                                details: e.target.value,
                              },
                            }))
                          }
                          placeholder={acc.placeholder || 'Detalhe...'}
                          className="w-20 px-1.5 py-0.2 bg-[#060e22] border border-emerald-500/50 rounded text-[10px] text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
