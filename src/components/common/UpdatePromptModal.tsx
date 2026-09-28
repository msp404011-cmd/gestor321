import React from 'react';
import { RefreshCw, Sparkles, LogIn, ArrowRight } from 'lucide-react';

interface UpdatePromptModalProps {
  isOpen: boolean;
  onApplyUpdate: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  isOpen,
  onApplyUpdate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-[#0a152d] to-[#040916] rounded-3xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.35)] p-6 sm:p-8 text-center text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient circle */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon Badge */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl animate-ping opacity-60" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-3xl flex items-center justify-center shadow-lg border border-cyan-300/40">
            <RefreshCw className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atualização Detectada</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Nova Versão do Sistema Disponível!
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
          Uma atualização foi aplicada no servidor com novas melhorias e correções.
          Para garantir o funcionamento pleno e a integridade dos seus dados, 
          é necessário <strong className="text-cyan-400 font-bold">atualizar a página e fazer login novamente</strong>.
        </p>

        {/* Notice Info Box */}
        <div className="bg-slate-900/80 border border-cyan-900/60 rounded-2xl p-4 text-xs text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 font-bold text-cyan-400">
            <LogIn className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Por que é necessário entrar de novo?</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Novas rotas, regras de segurança e novos recursos requerem a renovação da sua chave de acesso segura na versão atualizada.
          </p>
        </div>

        {/* Main CTA Action Button */}
        <button
          type="button"
          onClick={onApplyUpdate}
          className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-base rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
        >
          <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>ATUALIZAR AGORA E ENTRAR</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-[10px] text-slate-500 mt-4">
          Seus dados e ordens de serviço continuam 100% salvos e sincronizados na nuvem.
        </p>
      </div>
    </div>
  );
};
