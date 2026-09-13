import React from 'react';
import { ShieldAlert, Phone, Mail, LogOut, MessageCircle } from 'lucide-react';

interface BlockedAccountModalProps {
  isOpen: boolean;
  email?: string;
  name?: string;
  onLogout: () => void;
}

export const BlockedAccountModal: React.FC<BlockedAccountModalProps> = ({
  isOpen,
  email,
  name,
  onLogout,
}) => {
  if (!isOpen) return null;

  const handleSupportWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá, sou ${name || 'cliente'} (${email || ''}) e minha conta no sistema Gestor consta como suspensa/bloqueada. Gostaria de solicitar suporte ou regularização.`
    );
    window.open(`https://wa.me/5588996924840?text=${text}`, '_blank');
  };

  return (
    <div
      id="blocked-account-modal-overlay"
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 select-none"
    >
      <div
        id="blocked-account-modal-card"
        className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/80 rounded-3xl p-6 sm:p-8 text-white shadow-[0_0_80px_rgba(225,29,72,0.35)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse">
          <ShieldAlert className="w-10 h-10 stroke-[2.5]" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700/80 mb-3">
          Acesso Temporariamente Suspenso
        </span>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          Conta Bloqueada
        </h2>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 max-w-md">
          O acesso da sua loja <span className="font-bold text-white">({name || email})</span> às funcionalidades do Gestor foi bloqueado pelo administrador.
        </p>

        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 text-left space-y-2 mb-6">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            Motivos frequentes:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Mensalidade da assinatura pendente ou vencida</li>
            <li>Manutenção ou verificação cadastral de segurança</li>
            <li>Suspensão administrativa direta da licença</li>
          </ul>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            id="btn-blocked-contact-whatsapp"
            onClick={handleSupportWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Falar com Administrador</span>
          </button>

          <button
            type="button"
            id="btn-blocked-logout"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 px-5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
