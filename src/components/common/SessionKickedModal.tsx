import React from 'react';
import { ShieldAlert, LogIn, ArrowRight, Smartphone } from 'lucide-react';

interface SessionKickedModalProps {
  isOpen: boolean;
  maxAllowed?: number;
  onConfirm: () => void;
}

export const SessionKickedModal: React.FC<SessionKickedModalProps> = ({
  isOpen,
  maxAllowed = 1,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-[#1c0c16] to-[#0d050b] rounded-3xl border-2 border-rose-500/50 shadow-[0_0_60px_rgba(244,63,94,0.35)] p-6 sm:p-8 text-center text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient circle */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon Badge */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/20 rounded-3xl animate-ping opacity-60" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg border border-rose-300/40">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black tracking-wider uppercase mb-3">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Controle de Acessos Simultâneos</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Sessão Desconectada
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
          O limite de conexões simultâneas da sua conta (<strong className="text-rose-400 font-bold">{maxAllowed} {maxAllowed === 1 ? 'dispositivo' : 'dispositivos'}</strong>) foi atingido.
          Outro computador ou celular conectou-se com seu login, e por medida de segurança esta sessão anterior foi encerrada.
        </p>

        {/* Notice Info Box */}
        <div className="bg-slate-900/80 border border-rose-900/60 rounded-2xl p-4 text-xs text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Precisa usar mais aparelhos ao mesmo tempo?</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            O Super Administrador pode configurar o número permitido de logins simultâneos diretamente nas <strong className="text-slate-200">Configurações do Painel</strong> (1, 2, 3, 5, 10 ou Ilimitado).
          </p>
        </div>

        {/* Main CTA Action Button */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 hover:from-rose-400 hover:via-rose-500 hover:to-amber-500 text-white font-black text-base rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
        >
          <LogIn className="w-5 h-5" />
          <span>FAZER LOGIN NOVAMENTE</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
