import React from 'react';
import {
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface OrderProblemAccessoriesSectionProps {
  isDark: boolean;
  clientDefect: string;
  setClientDefect: React.Dispatch<React.SetStateAction<string>>;
  serviceToBeDone?: string;
  setServiceToBeDone?: React.Dispatch<React.SetStateAction<string>>;
  showServicePicker?: boolean;
  setShowServicePicker?: React.Dispatch<React.SetStateAction<boolean>>;
  quickServices?: { name: string; price: number }[];
  deviceType?: string;
  customAccessories?: any[];
  customAccMap?: any;
  setCustomAccMap?: any;
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
  'Travado no logo',
  'Touch não funciona',
  'Superaquecendo',
  'Câmera não abre',
];

export const OrderProblemAccessoriesSection: React.FC<
  OrderProblemAccessoriesSectionProps
> = ({
  isDark,
  clientDefect = '',
  setClientDefect,
}) => {
  const handleAddDefectTag = (tag: string) => {
    if (!clientDefect.trim()) {
      setClientDefect(tag);
    } else if (!clientDefect.toLowerCase().includes(tag.toLowerCase())) {
      setClientDefect((prev) => `${prev.trim()}, ${tag}`);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-2.5 overflow-y-auto scrollbar-thin pr-1 pb-1">
      {/* PROBLEMA RELATADO */}
      <div
        className={`p-3 rounded-2xl border-2 shrink-0 space-y-2 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#180812]/95 via-[#0e040b]/90 to-[#070206]/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.35),0_0_50px_rgba(244,63,94,0.15)] text-white'
            : 'bg-white border-rose-400 shadow-lg text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-600/30 border border-rose-400/60 flex items-center justify-center text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)] shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-wide leading-none text-white">
                PROBLEMA RELATADO <span className="text-rose-400">*</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Defeito e queixa informados pelo cliente
              </p>
            </div>
          </div>
          <span className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-rose-400" />
            <span>Preenchimento rápido:</span>
          </span>
        </div>

        {/* Quick Defect Tags */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {COMMON_DEFECT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddDefectTag(tag)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0a050f] hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/60 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              + {tag}
            </button>
          ))}
        </div>

        <div className="relative pt-1">
          <textarea
            rows={5}
            maxLength={500}
            value={clientDefect}
            onChange={(e) => setClientDefect(e.target.value)}
            placeholder="Descreva detalhadamente o defeito e problema relatado pelo cliente..."
            className="w-full p-3 pb-6 bg-[#060309] border border-rose-500/40 focus:border-rose-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed transition-colors shadow-inner"
          />
          <span className="absolute right-2.5 bottom-2 text-[9px] font-mono text-slate-500 pointer-events-none">
            {clientDefect.length}/500
          </span>
        </div>
      </div>
    </div>
  );
};
