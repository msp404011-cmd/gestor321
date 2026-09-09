import React, { useState, useMemo } from 'react';
import {
  Crown,
  Check,
  X as LucideX,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Flame,
  FlaskConical,
  Store,
  Users,
  Clock,
  FileCheck,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  SubscriptionService,
  SUBSCRIPTION_PLANS,
  SubscriptionCheckResult,
} from '../../services/subscriptionService';
import { PlanType, SubscriptionStatus } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';

interface SubscriptionTabProps {
  onCloseModal?: () => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ onCloseModal }) => {
  const { isDark } = useTheme();
  const [tick, setTick] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Check limits and subscription state dynamically
  const subData: SubscriptionCheckResult = useMemo(() => {
    return SubscriptionService.checkSubscriptionLimits();
  }, [tick]);

  const { currentPlan, isTrial, isActive, isExpired, isCanceled, daysRemaining } = subData;

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  const handleSelectPlan = (planId: PlanType) => {
    const normalized: PlanType =
      planId === 'FREE' ? 'TRIAL' : planId === 'PRO' ? 'LOJA' : planId === 'ENTERPRISE' ? 'REVENDA' : planId;

    if (normalized === currentPlan.planType && isActive) {
      return;
    }

    // Trial is activated directly without charge
    if (normalized === 'TRIAL') {
      SubscriptionService.upgradePlan('TRIAL', 'monthly');
      setTick((t) => t + 1);
      showNotification('Teste Grátis de 7 Dias com tudo 100% liberado ativado com sucesso!');
      return;
    }

    // Paid plans (LOJA and REVENDA) open the Mercado Pago checkout modal
    setCheckoutPlan(normalized);
  };

  const handleCancelSubscription = () => {
    SubscriptionService.cancelSubscription();
    setShowCancelModal(false);
    setTick((t) => t + 1);
    showNotification('Assinatura cancelada. O acesso permanecerá ativo até o fim do período mensal atual.', 'info');
  };

  const handleReactivate = () => {
    SubscriptionService.reactivateSubscription();
    setTick((t) => t + 1);
    showNotification('Assinatura reativada com sucesso!');
  };

  // Administrative simulation handlers
  const handleSimulate = (plan: PlanType, status: SubscriptionStatus = 'active', days?: number) => {
    SubscriptionService.simulatePlan(plan, status, days);
    setTick((t) => t + 1);
    const statusLabels: Record<string, string> = {
      active: 'Ativo',
      expired: 'Expirado / Vencido',
      canceled: 'Cancelado',
      trial: 'Teste Grátis',
    };
    showNotification(
      `Simulação aplicada: ${SUBSCRIPTION_PLANS[plan]?.name || plan} [${statusLabels[status] || status}]!`,
      'info'
    );
  };

  const isCurrentPlanTrial = currentPlan.planType === 'TRIAL' || currentPlan.planType === 'FREE' || Boolean(currentPlan.isTrial);
  const isCurrentPlanLoja = currentPlan.planType === 'LOJA' || currentPlan.planType === 'PRO';
  const isCurrentPlanRevenda = currentPlan.planType === 'REVENDA' || currentPlan.planType === 'ENTERPRISE';
  const isCurrentPlanTesteReal = currentPlan.planType === 'TESTE_REAL';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className="fixed top-6 right-6 z-[120] max-w-md p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 bg-emerald-600 border-emerald-400 text-white">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold leading-tight">{actionFeedback.message}</p>
        </div>
      )}

      {/* 1. CURRENT SUBSCRIPTION HERO CARD */}
      <div
        className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-[#0b162e] via-[#091122] to-[#060a14] border-blue-500/40 shadow-xl'
            : 'bg-white border-blue-200 shadow-md'
        }`}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                  Status da Assinatura
                </span>

                {isCurrentPlanTrial && isActive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    <Clock className="w-3 h-3 text-blue-400 animate-spin" />
                    TESTE GRÁTIS (7 DIAS)
                  </span>
                )}

                {!isCurrentPlanTrial && isActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ATIVO
                  </span>
                )}

                {isExpired && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <AlertTriangle className="w-3 h-3" />
                    {isCurrentPlanTrial ? 'TESTE DE 7 DIAS EXPIRADO' : 'MENSALIDADE VENCIDA'}
                  </span>
                )}

                {isCanceled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <LucideX className="w-3 h-3" />
                    CANCELADO
                  </span>
                )}

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isCurrentPlanTrial ? '7 Dias Grátis' : 'Pagamento Mensal'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentPlan.planName || (isCurrentPlanTrial ? 'Teste Grátis (7 Dias)' : 'Plano Loja')}
              </h2>
              <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isCurrentPlanTrial
                  ? 'Período de teste grátis com 100% dos recursos, relatórios e ordens liberados sem limites.'
                  : currentPlan.notes || 'Plano ativo com faturamento mensal sem fidelidade.'}
              </p>
            </div>
          </div>

          {/* Quick Dates & Management Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`p-3 rounded-2xl border text-right ${
                isDark ? 'bg-[#0e1a36] border-blue-900/60' : 'bg-blue-50/70 border-blue-100'
              }`}
            >
              <span className={`text-[10px] uppercase font-black block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isCurrentPlanTrial ? 'Fim do Teste de 7 Dias' : 'Vencimento / Renovação Mensal'}
              </span>
              <span className="text-sm font-black text-blue-500">{subData.formattedExpiryDate}</span>
              {daysRemaining !== null && (
                <span
                  className={`text-[11px] block font-bold ${
                    daysRemaining < 0
                      ? 'text-rose-400'
                      : daysRemaining <= 3
                      ? 'text-amber-400'
                      : 'text-emerald-500'
                  }`}
                >
                  {daysRemaining < 0
                    ? `Expirou há ${Math.abs(daysRemaining)} dias`
                    : daysRemaining === 0
                    ? 'Termina hoje'
                    : isCurrentPlanTrial
                    ? `${daysRemaining} dias restantes de teste grátis`
                    : `${daysRemaining} dias restantes`}
                </span>
              )}
            </div>

            {/* Action buttons */}
            {isCanceled ? (
              <button
                type="button"
                id="btn-reactivate-subscription"
                onClick={handleReactivate}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reativar Assinatura</span>
              </button>
            ) : !isCurrentPlanTrial ? (
              <button
                type="button"
                id="btn-open-cancel-modal"
                onClick={() => setShowCancelModal(true)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                Cancelar Assinatura
              </button>
            ) : isExpired ? (
              <button
                type="button"
                id="btn-upgrade-from-trial"
                onClick={() => handleSelectPlan('LOJA')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:brightness-105"
              >
                <Crown className="w-4 h-4" />
                <span>Assinar Plano Loja</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Real-time Resource Usage & Status (Everything unlocked during Trial & Paid!) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/20 dark:border-slate-800">
          {/* 1. Ordens de Serviço */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#081020] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Ordens de Serviço (Mês Atual)
              </span>
              <span
                className={`font-black ${
                  !subData.canCreateOrder ? 'text-rose-400' : 'text-blue-500'
                }`}
              >
                {subData.osCountThisMonth} Criadas / Ilimitadas
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            </div>
            <p className={`text-[11px] mt-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isExpired
                ? 'Emissão bloqueada por término do período. Assine um plano para continuar.'
                : isCurrentPlanTrial
                ? 'Ordens de Serviço 100% ilimitadas durante o teste grátis.'
                : 'Ordens de Serviço ilimitadas inclusas no seu plano mensal.'}
            </p>
          </div>

          {/* 2. Produtos no Estoque */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#081020] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Produtos & Peças no Estoque
              </span>
              <span
                className={`font-black ${
                  !subData.canCreateProduct ? 'text-rose-400' : 'text-emerald-500'
                }`}
              >
                {subData.productsCount} Cadastrados / Ilimitados
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            </div>
            <p className={`text-[11px] mt-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isExpired
                ? 'Cadastro bloqueado por término do período.'
                : 'Cadastre quantos produtos, peças e serviços desejar.'}
            </p>
          </div>

          {/* 3. Relatórios Avançados & PDF */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#081020] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Relatórios, DRE & Exportação PDF
              </span>
              <span
                className={`font-black ${
                  subData.canAccessAdvancedReports ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {subData.canAccessAdvancedReports ? '100% Liberado' : 'Bloqueado'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  subData.canAccessAdvancedReports
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {subData.canAccessAdvancedReports ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <p className={`text-[11px] font-medium leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subData.canAccessAdvancedReports
                  ? 'Acesso completo a DRE, comparativos e exportação de PDF.'
                  : 'Assine um plano mensal para liberar relatórios e exportações.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION HEADER (MONTHLY ONLY, NO ANNUAL, NO DISCOUNTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h3 className="text-xl font-black tracking-tight">Planos de Assinatura & Teste Grátis</h3>
          <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pagamento mensal simples • Cancele quando quiser • Sem fidelidade ou taxas adicionais.
          </p>
        </div>

        {/* Monthly Payment Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Faturamento Mensal • Sem Fidelidade</span>
        </div>
      </div>

      {/* 🧪 BANNER TEMPORÁRIO: PLANO TESTE REAL (R$ 1,00) MERCADO PAGO */}
      <div
        id="card-plano-teste-real"
        className={`p-5 sm:p-6 rounded-3xl border-2 transition-all relative overflow-hidden ${
          isCurrentPlanTesteReal && isActive
            ? 'bg-gradient-to-r from-emerald-950/60 via-[#071920] to-[#04121a] border-emerald-500 ring-2 ring-emerald-500/30'
            : isDark
            ? 'bg-gradient-to-r from-[#0d1c3a] via-[#09152b] to-[#050e20] border-sky-500/60 shadow-xl'
            : 'bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-sky-300 shadow-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Modo de Teste Real Oficial
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Temporário (R$ 1,00)
              </span>
              {isCurrentPlanTesteReal && isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativo no Sistema
                </span>
              )}
            </div>

            <div>
              <h4 className="text-xl sm:text-2xl font-black tracking-tight">
                Plano Teste Real — {formatCurrency(SUBSCRIPTION_PLANS.TESTE_REAL.monthlyPrice)}
              </h4>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Gere uma cobrança PIX Dinâmica oficial de <strong>R$ 1,00</strong> com suas credenciais do Mercado Pago para conferir o recebimento bancário real e a liberação imediata do sistema.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> PIX Dinâmico com QR Code oficial de R$ 1,00
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Verificação bancária automática a cada 5s
              </span>
              <span className="flex items-center gap-1 text-sky-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Liberação de 30 dias de acesso
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Valor do Teste Real
              </span>
              <span className="text-3xl sm:text-4xl font-black text-sky-400">
                {formatCurrency(1.0)}
              </span>
            </div>

            {isCurrentPlanTesteReal && isActive ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto py-3 px-5 rounded-2xl font-black text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Plano Teste (R$ 1,00) Ativo</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-testar-pagamento-1-real"
                onClick={() => handleSelectPlan('TESTE_REAL')}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all cursor-pointer transform active:scale-95"
              >
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Testar Pagamento de R$ 1,00 (Mercado Pago)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. THREE CARDS: TESTE GRÁTIS (7 DIAS), PLANO LOJA, PLANO LOJA / REVENDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: TESTE GRÁTIS (7 DIAS) */}
        <div
          id="card-plano-trial"
          className={`rounded-3xl border-2 p-6 flex flex-col justify-between transition-all relative ${
            isCurrentPlanTrial
              ? isDark
                ? 'bg-[#0c162e] border-blue-500 ring-2 ring-blue-500/30 shadow-xl'
                : 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
              : isDark
              ? 'bg-[#091122] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                7 Dias Grátis
              </span>
              {isCurrentPlanTrial && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PLANO ATUAL
                </span>
              )}
            </div>

            <h4 className="text-xl font-black tracking-tight">{SUBSCRIPTION_PLANS.TRIAL.name}</h4>
            <p className={`text-xs mt-1 min-h-[32px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {SUBSCRIPTION_PLANS.TRIAL.tagline}
            </p>

            <div className="mt-5 mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black">R$ 0</span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  / 7 dias
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-500 block mt-1">
                Tudo 100% liberado sem restrições
              </span>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              {SUBSCRIPTION_PLANS.TRIAL.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span
                    className={
                      feat.highlight
                        ? 'font-bold text-slate-900 dark:text-white'
                        : isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }
                  >
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {isCurrentPlanTrial && isActive ? (
              <button
                type="button"
                disabled
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs border text-center cursor-default ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                ✓ Teste Grátis Ativo ({daysRemaining !== null ? `${daysRemaining} dias restantes` : '7 Dias'})
              </button>
            ) : (
              <button
                type="button"
                id="btn-activate-trial"
                onClick={() => handleSelectPlan('TRIAL')}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                Iniciar Teste Grátis (7 Dias)
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: PLANO LOJA (VALOR 1: R$ 69,90/mês) */}
        <div
          id="card-plano-loja"
          className={`rounded-3xl border-2 p-6 flex flex-col justify-between transition-all relative overflow-hidden ${
            isCurrentPlanLoja
              ? isDark
                ? 'bg-gradient-to-b from-[#0e1d3e] to-[#091228] border-amber-500 ring-2 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
                : 'bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-xl'
              : isDark
              ? 'bg-[#0a142c] border-blue-500/50 hover:border-blue-400 shadow-xl'
              : 'bg-white border-blue-300 hover:border-blue-400 shadow-md'
          }`}
        >
          {/* Top highlight ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-2xl shadow-md">
            ⭐ MAIS ESCOLHIDO
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                Assistência & Loja
              </span>
              {isCurrentPlanLoja && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  PLANO ATUAL
                </span>
              )}
            </div>

            <h4 className="text-xl font-black tracking-tight">{SUBSCRIPTION_PLANS.LOJA.name}</h4>
            <p className={`text-xs mt-1 min-h-[32px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {SUBSCRIPTION_PLANS.LOJA.tagline}
            </p>

            <div className="mt-5 mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-amber-500">
                  {formatCurrency(SUBSCRIPTION_PLANS.LOJA.monthlyPrice)}
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  /mês
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-500 block mt-1">
                Faturamento mensal recorrente
              </span>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              {SUBSCRIPTION_PLANS.LOJA.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span
                    className={
                      feat.highlight
                        ? 'font-bold text-slate-900 dark:text-white'
                        : isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }
                  >
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {isCurrentPlanLoja && isActive ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-center cursor-default"
              >
                ✓ Plano Atual Ativo
              </button>
            ) : (
              <button
                type="button"
                id="btn-upgrade-loja"
                onClick={() => handleSelectPlan('LOJA')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>
                  {isCurrentPlanLoja ? 'Reativar Plano Loja' : `Assinar Plano Loja (${formatCurrency(SUBSCRIPTION_PLANS.LOJA.monthlyPrice)}/mês)`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* CARD 3: PLANO LOJA / REVENDA (VALOR 2: R$ 119,90/mês) */}
        <div
          id="card-plano-revenda"
          className={`rounded-3xl border-2 p-6 flex flex-col justify-between transition-all relative ${
            isCurrentPlanRevenda
              ? isDark
                ? 'bg-gradient-to-b from-[#121c3b] to-[#0a1124] border-purple-500 ring-2 ring-purple-500/30 shadow-xl'
                : 'bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
              : isDark
              ? 'bg-[#091122] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                Loja & Revendedores
              </span>
              {isCurrentPlanRevenda && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  PLANO ATUAL
                </span>
              )}
            </div>

            <h4 className="text-xl font-black tracking-tight">{SUBSCRIPTION_PLANS.REVENDA.name}</h4>
            <p className={`text-xs mt-1 min-h-[32px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {SUBSCRIPTION_PLANS.REVENDA.tagline}
            </p>

            <div className="mt-5 mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-purple-400">
                  {formatCurrency(SUBSCRIPTION_PLANS.REVENDA.monthlyPrice)}
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  /mês
                </span>
              </div>
              <span className="text-[11px] font-semibold text-purple-400 block mt-1">
                Faturamento mensal recorrente
              </span>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              {SUBSCRIPTION_PLANS.REVENDA.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span
                    className={
                      feat.highlight
                        ? 'font-bold text-slate-900 dark:text-white'
                        : isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }
                  >
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {isCurrentPlanRevenda && isActive ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs bg-purple-500/20 text-purple-400 border border-purple-500/40 text-center cursor-default"
              >
                ✓ Plano Atual Ativo
              </button>
            ) : (
              <button
                type="button"
                id="btn-upgrade-revenda"
                onClick={() => handleSelectPlan('REVENDA')}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isCurrentPlanRevenda
                    ? 'Reativar Plano Loja / Revenda'
                    : `Assinar Loja / Revenda (${formatCurrency(SUBSCRIPTION_PLANS.REVENDA.monthlyPrice)}/mês)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. ADMIN TEST SIMULATOR */}
      <div
        id="admin-plan-simulator-box"
        className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#080e1c] border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                Painel Administrativo: Simulador de Planos & Testes
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/40">
                  MODO DESENVOLVEDOR
                </span>
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Simule cenários instantaneamente para testar o Teste Grátis de 7 dias, Plano Loja, Plano Loja / Revenda e expirações.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => handleSimulate('TRIAL', 'active')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isCurrentPlanTrial && isActive
                ? 'bg-blue-600 text-white border-blue-400'
                : isDark
                ? 'bg-[#0c162e] hover:bg-[#112040] text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-blue-400">1. Teste Grátis</span>
            <span className="font-extrabold mt-1">7 Dias (Tudo Liberado)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulate('LOJA', 'active')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isCurrentPlanLoja && isActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : isDark
                ? 'bg-[#0c162e] hover:bg-[#112040] text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-amber-400">2. Plano Loja</span>
            <span className="font-extrabold mt-1">R$ 69,90/mês Ativo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulate('REVENDA', 'active')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isCurrentPlanRevenda && isActive
                ? 'bg-purple-600 text-white border-purple-400'
                : isDark
                ? 'bg-[#0c162e] hover:bg-[#112040] text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-purple-400">3. Loja / Revenda</span>
            <span className="font-extrabold mt-1">R$ 119,90/mês Ativo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulate('TRIAL', 'expired')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isExpired && isCurrentPlanTrial
                ? 'bg-rose-600 text-white border-rose-400'
                : isDark
                ? 'bg-[#0c162e] hover:bg-[#112040] text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-rose-400">4. Teste Expirado</span>
            <span className="font-extrabold mt-1">Fim dos 7 Dias</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulate('LOJA', 'expired')}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isExpired && !isCurrentPlanTrial
                ? 'bg-rose-600 text-white border-rose-400'
                : isDark
                ? 'bg-[#0c162e] hover:bg-[#112040] text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-rose-400">5. Vencido</span>
            <span className="font-extrabold mt-1">Mensalidade Vencida</span>
          </button>

          <button
            type="button"
            onClick={() => {
              SubscriptionService.resetToDefaultPlan();
              setTick((t) => t + 1);
              showNotification('Restaurado para Plano Loja Padrão (Mensal)!');
            }}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer flex flex-col justify-between ${
              isDark
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-blue-400">6. Resetar</span>
            <span className="font-extrabold mt-1">Plano Loja Padrão</span>
          </button>
        </div>
      </div>

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              isDark ? 'bg-[#0a1224] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black tracking-tight">Deseja cancelar sua assinatura mensal?</h4>
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Ao cancelar, você continuará tendo acesso aos recursos até{' '}
              <strong>{subData.formattedExpiryDate}</strong>. Após essa data, sua conta ficará pausada até a escolha de um novo plano ou reativação, sem fidelidade.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Voltar / Manter Plano
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-subscription"
                onClick={handleCancelSubscription}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MERCADO PAGO CHECKOUT MODAL (PIX & CARTÃO) */}
      {checkoutPlan && (
        <SubscriptionCheckoutModal
          isOpen={Boolean(checkoutPlan)}
          planType={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={(updatedPlan) => {
            setTick((t) => t + 1);
            showNotification(
              `🎉 Pagamento aprovado! O ${updatedPlan.planName} foi ativado por 30 dias com sucesso!`
            );
            if (onCloseModal) {
              setTimeout(() => {
                onCloseModal();
              }, 2200);
            }
          }}
        />
      )}
    </div>
  );
};
