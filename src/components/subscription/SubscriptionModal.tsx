import React from 'react';
import { X, Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SubscriptionTab } from './SubscriptionTab';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      id="subscription-plans-modal-overlay"
      className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="subscription-plans-modal-content"
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-[#070d1a] border-blue-500/50 text-white shadow-[0_0_60px_rgba(0,0,0,0.9)]'
            : 'bg-[#f8fafc] border-blue-300 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-[#091122]' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                Meu Plano & Gestão de Assinatura
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gerencie sua licença, limites de O.S. e estoque, e faça upgrades a qualquer momento.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-subscription-modal"
            onClick={onClose}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] scrollbar-thin">
          <SubscriptionTab onCloseModal={onClose} />
        </div>
      </div>
    </div>
  );
};
