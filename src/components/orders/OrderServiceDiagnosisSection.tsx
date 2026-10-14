import React from 'react';
import {
  Settings,
  Zap,
} from 'lucide-react';

interface OrderServiceDiagnosisSectionProps {
  isDark: boolean;
  serviceToBeDone: string;
  setServiceToBeDone: React.Dispatch<React.SetStateAction<string>>;
  showServicePicker: boolean;
  setShowServicePicker: React.Dispatch<React.SetStateAction<boolean>>;
  quickServices: { name: string; price: number }[];
  onSelectQuickService?: (serviceName: string, price: number) => void;
}

export const OrderServiceDiagnosisSection: React.FC<
  OrderServiceDiagnosisSectionProps
> = ({
  isDark,
  serviceToBeDone = '',
  setServiceToBeDone,
  showServicePicker = false,
  setShowServicePicker,
  quickServices = [],
  onSelectQuickService,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2.5 overflow-y-auto scrollbar-thin pr-1 pb-1">
      {/* SERVIÇO / DIAGNÓSTICO */}
      <div
        className={`p-3 rounded-2xl border-2 shrink-0 space-y-2 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#181105]/95 via-[#0e0a02]/90 to-[#070501]/95 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.35),0_0_50px_rgba(245,158,11,0.15)] text-white'
            : 'bg-white border-amber-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-600/30 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-wide leading-none text-white">
                SERVIÇO & DIAGNÓSTICO
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Serviço a ser realizado e diagnóstico técnico preliminar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowServicePicker(!showServicePicker)}
            className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/60 flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)] active:scale-95"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{showServicePicker ? 'Ocultar' : '⚡ Serviços Rápidos'}</span>
          </button>
        </div>

        {/* Quick services picker */}
        {showServicePicker && (
          <div className="p-2.5 rounded-xl bg-[#080502] border border-cyan-500/50 space-y-1.5 animate-in fade-in">
            <span className="text-[10px] font-bold text-cyan-300 block uppercase">
              Selecione um serviço rápido com preço sugerido:
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
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
                  className="p-1.5 text-left rounded-lg bg-[#0e0904] hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/60 text-xs text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate pr-1 font-medium">{qs.name}</span>
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
            rows={4}
            maxLength={500}
            value={serviceToBeDone}
            onChange={(e) => setServiceToBeDone(e.target.value)}
            placeholder="Descreva detalhadamente o serviço ou diagnóstico previsto a ser executado..."
            className="w-full p-2.5 pb-6 bg-[#080502] border border-amber-500/40 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed transition-colors shadow-inner"
          />
          <span className="absolute right-2.5 bottom-1.5 text-[9px] font-mono text-slate-500 pointer-events-none">
            {serviceToBeDone.length}/500
          </span>
        </div>
      </div>
    </div>
  );
};
