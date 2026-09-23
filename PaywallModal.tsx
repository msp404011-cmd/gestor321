import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SubscriptionService } from '../../services/subscriptionService';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';
import { PlanType } from '../../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  feature?: 'ORDERS_LIMIT' | 'PRODUCTS_LIMIT' | 'REPORTS' | 'PDF_EXPORT' | 'GENERAL';
  onOpenPlans: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  feature = 'GENERAL',
  onOpenPlans,
}) => {
  const { isDark } = useTheme();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen && !showCheckout) return null;

  const handleQuickUpgrade = () => {
    setShowCheckout(true);
  };

  return (
    <div
      id="paywall-modal-overlay"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="paywall-modal-content"
        className={`w-full max-w-lg rounded-3xl border-2 p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-[#0a1226] border-amber-500/50 text-white shadow-[0_0_50px_rgba(245,158,11,0.25)]'
            : 'bg-white border-amber-400 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          id="btn-close-paywall"
          onClick={onClose}
          className={`absolute top-5 right-5 w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade Recomendado
            </div>
            <h3 className="text-xl font-black tracking-tight mt-1">{title}</h3>
          </div>
        </div>

        {/* Main description */}
        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {description}
        </p>

        {/* Feature comparison highlight box */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border mb-6 ${
            isDark
              ? 'bg-gradient-to-br from-blue-950/40 via-[#0c1630] to-slate-900 border-blue-500/30'
              : 'bg-blue-50/70 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/20">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-500">
              <Zap className="w-4 h-4 text-amber-400" />
              Liberado no Plano Loja
            </span>
            <span className="text-xs font-extrabold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-lg">
              Sem Limitações
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                <strong>Ordens de Serviço Ilimitadas</strong> todo mês
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                <strong>Produtos e Estoque Ilimitados</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                Frente de Caixa (PDV) Ágil & Gestão Financeira
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                Relatórios Gerenciais Avançados e Exportação em PDF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                Checklist de Entrada e Saída com Fotos e Assinatura
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            id="btn-upgrade-pro-instant"
            onClick={handleQuickUpgrade}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>Assinar Plano Assistência (R$ 69,90/mês)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="btn-view-all-plans"
            onClick={() => {
              onClose();
              onOpenPlans();
            }}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Ver Todos os Planos & Teste Grátis</span>
          </button>
        </div>
      </div>

      {showCheckout && (
        <SubscriptionCheckoutModal
          isOpen={showCheckout}
          planType="ASSISTENCIA"
          onClose={() => {
            setShowCheckout(false);
            onClose();
          }}
          onSuccess={() => {
            setShowCheckout(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
