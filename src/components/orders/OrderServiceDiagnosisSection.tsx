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
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-4">
      {/* SERVIÇO / DIAGNÓSTICO */}
      <div
        className={`p-4 rounded-3xl border-2 shrink-0 space-y-3 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#181105]/95 via-[#0e0a02]/90 to-[#070501]/95 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.35),0_0_50px_rgba(245,158,11,0.15)] text-white'
            : 'bg-white border-amber-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-none text-white">
                SERVIÇO & DIAGNÓSTICO
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Serviço a ser realizado e diagnóstico técnico preliminar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowServicePicker(!showServicePicker)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/60 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)] active:scale-95"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{showServicePicker ? 'Ocultar' : '⚡ Serviços Rápidos'}</span>
          </button>
        </div>

        {/* Quick services picker */}
        {showServicePicker && (
          <div className="p-4 rounded-2xl bg-[#080502] border border-cyan-500/50 space-y-3 animate-in fade-in">
            <span className="text-xs font-bold text-cyan-300 block uppercase">
              Selecione um serviço rápido:
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
                  className="p-3 text-left rounded-xl bg-[#0e0904] hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/60 text-xs text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate pr-2 font-medium">{qs.name}</span>
                  <span className="font-black text-emerald-400 shrink-0 font-mono text-xs">
                    R$ {qs.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={5}
            maxLength={500}
            value={serviceToBeDone}
            onChange={(e) => setServiceToBeDone(e.target.value)}
            placeholder="Descreva detalhadamente o serviço ou diagnóstico previsto..."
            className="w-full p-4 pb-8 bg-[#080502] border border-amber-500/40 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed transition-colors shadow-inner"
          />
          <span className="absolute right-4 bottom-3 text-[10px] font-mono text-slate-500 pointer-events-none">
            {serviceToBeDone.length}/500
          </span>
        </div>
      </div>
    </div>
  );
};
