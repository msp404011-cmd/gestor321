import { StorageService } from './storage';
import { PlanType, SubscriptionStatus, BillingCycle, SubscriptionPlanInfo, PlanLimits } from '../types';

export interface PlanDefinition {
  id: PlanType;
  name: string;
  tagline: string;
  badge?: string;
  monthlyPrice: number;
  popular?: boolean;
  limits: PlanLimits;
  features: { text: string; included: boolean; highlight?: boolean }[];
}

const TRIAL_PLAN: PlanDefinition = {
  id: 'TRIAL',
  name: 'Teste Grátis (7 Dias)',
  tagline: '7 dias com todos os recursos e módulos 100% liberados para teste.',
  badge: '7 DIAS GRÁTIS',
  monthlyPrice: 0,
  popular: false,
  limits: {
    maxMonthlyOrders: null,
    maxProducts: null,
    maxCollaborators: null,
    advancedReports: true,
    pdfExport: true,
    cloudBackup: true,
    auditLogs: true,
  },
  features: [
    { text: '7 Dias de Acesso Total com tudo 100% liberado', included: true, highlight: true },
    { text: 'Ordens de Serviço Ilimitadas durante o teste', included: true, highlight: true },
    { text: 'Produtos e Estoque Ilimitados', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) Rápido e Completo', included: true },
    { text: 'Gestão de Clientes e Aparelhos', included: true },
    { text: 'Checklist de Entrada e Saída com Fotos', included: true },
    { text: 'Emissão e Impressão Térmica de Recibos (80mm/58mm)', included: true },
    { text: 'Relatórios Gerenciais Avançados & DRE', included: true },
    { text: 'Múltiplos Técnicos e Vendedores', included: true },
  ],
};

const LOJA_PLAN: PlanDefinition = {
  id: 'LOJA',
  name: 'Plano Loja',
  tagline: 'Solução completa para assistência técnica e vendas balcão da sua loja.',
  badge: 'MAIS ESCOLHIDO',
  popular: true,
  monthlyPrice: 69.9,
  limits: {
    maxMonthlyOrders: null,
    maxProducts: null,
    maxCollaborators: null,
    advancedReports: true,
    pdfExport: true,
    cloudBackup: true,
    auditLogs: true,
  },
  features: [
    { text: 'Ordens de Serviço Ilimitadas todo mês', included: true, highlight: true },
    { text: 'Produtos e Peças no Estoque Ilimitados', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) Ágil e Completo', included: true, highlight: true },
    { text: 'Gestão Completa de Clientes e Aparelhos', included: true },
    { text: 'Checklist de Entrada e Saída com Fotos', included: true },
    { text: 'Emissão e Impressão Térmica de Recibos (80mm/58mm)', included: true },
    { text: 'Controle Financeiro de Caixa, Entradas e Despesas', included: true },
    { text: 'Relatórios Gerenciais de Faturamento & DRE', included: true },
    { text: 'Múltiplos Técnicos e Colaboradores', included: true },
  ],
};

const REVENDA_PLAN: PlanDefinition = {
  id: 'REVENDA',
  name: 'Plano Loja / Revenda',
  tagline: 'Para lojas que também trabalham com revendedores, atacado ou consignado.',
  badge: 'LOJA + REVENDA',
  popular: false,
  monthlyPrice: 119.9,
  limits: {
    maxMonthlyOrders: null,
    maxProducts: null,
    maxCollaborators: null,
    advancedReports: true,
    pdfExport: true,
    cloudBackup: true,
    auditLogs: true,
  },
  features: [
    { text: 'Tudo incluso do Plano Loja sem restrições', included: true, highlight: true },
    { text: 'Tabela de Preço Diferenciada (Cliente Final vs Revenda/Atacado)', included: true, highlight: true },
    { text: 'Cadastro e Gestão de Revendedores Parceiros', included: true, highlight: true },
    { text: 'Controle Automático de Comissões de Revenda', included: true, highlight: true },
    { text: 'Vendas Consignadas e Fechamento no PDV', included: true, highlight: true },
    { text: 'Relatórios de Desempenho e Margem por Revendedor', included: true },
    { text: 'Multi-setores e Níveis de Permissão de Acesso', included: true },
  ],
};

const TESTE_REAL_PLAN: PlanDefinition = {
  id: 'TESTE_REAL',
  name: 'Plano Teste Real',
  tagline: 'Plano temporário de R$ 1,00 para testar pagamento real no Mercado Pago.',
  badge: 'TESTE R$ 1,00',
  popular: false,
  monthlyPrice: 1.0,
  limits: {
    maxMonthlyOrders: null,
    maxProducts: null,
    maxCollaborators: null,
    advancedReports: true,
    pdfExport: true,
    cloudBackup: true,
    auditLogs: true,
  },
  features: [
    { text: 'Valor simbólico de R$ 1,00 para testar cobrança real', included: true, highlight: true },
    { text: 'Gera cobrança PIX oficial de R$ 1,00 via Mercado Pago', included: true, highlight: true },
    { text: 'Aceita Cartão de Crédito e PIX Dinâmico', included: true, highlight: true },
    { text: 'Ativação automática imediata por 30 dias após pagar', included: true, highlight: true },
    { text: 'Plano temporário: pode ser excluído a qualquer momento', included: true },
  ],
};

export const SUBSCRIPTION_PLANS: Record<PlanType, PlanDefinition> = {
  TRIAL: TRIAL_PLAN,
  FREE: TRIAL_PLAN,
  LOJA: LOJA_PLAN,
  PRO: LOJA_PLAN,
  REVENDA: REVENDA_PLAN,
  ENTERPRISE: REVENDA_PLAN,
  TESTE_REAL: TESTE_REAL_PLAN,
};

export interface SubscriptionCheckResult {
  currentPlan: SubscriptionPlanInfo;
  planDefinition: PlanDefinition;
  isTrial: boolean;
  isFreePlan: boolean;
  isActive: boolean;
  isExpired: boolean;
  isCanceled: boolean;
  daysRemaining: number | null;
  formattedExpiryDate: string;
  osCountThisMonth: number;
  maxMonthlyOrders: number | null;
  canCreateOrder: boolean;
  orderLimitReason?: string;
  productsCount: number;
  maxProducts: number | null;
  canCreateProduct: boolean;
  productLimitReason?: string;
  canAccessAdvancedReports: boolean;
  canExportPdf: boolean;
}

export const SubscriptionService = {
  getCurrentPlan(): SubscriptionPlanInfo {
    return StorageService.getSubscriptionPlan();
  },

  getPlanDefinition(planType: PlanType): PlanDefinition {
    return SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS.LOJA;
  },

  getOrdersCountThisMonth(): number {
    const orders = StorageService.getOrders();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const d = new Date(order.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  },

  getProductsCount(): number {
    return StorageService.getProducts().length;
  },

  checkSubscriptionLimits(): SubscriptionCheckResult {
    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType: PlanType = currentPlan.planType || 'LOJA';
    const planType: PlanType = rawType === 'PRO' ? 'LOJA' : rawType === 'ENTERPRISE' ? 'REVENDA' : rawType === 'FREE' ? 'TRIAL' : rawType;
    const planDefinition = this.getPlanDefinition(planType);

    const isTrial = planType === 'TRIAL' || Boolean(currentPlan.isTrial);
    const isFreePlan = isTrial;

    // Expiry and status logic
    let daysRemaining: number | null = null;
    let isExpired = currentPlan.status === 'expired' || currentPlan.status === 'VENCIDO';
    const isCanceled = currentPlan.status === 'canceled';

    if (currentPlan.expiryDate) {
      const [y, m, d] = currentPlan.expiryDate.split('-').map(Number);
      const expiry = new Date(y, (m || 1) - 1, d || 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diff = expiry.getTime() - today.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        isExpired = true;
      }
    }

    const isActive = !isExpired && !isCanceled;

    // Monthly orders count
    const osCountThisMonth = this.getOrdersCountThisMonth();
    const maxMonthlyOrders = planDefinition.limits.maxMonthlyOrders;

    let canCreateOrder = true;
    let orderLimitReason: string | undefined;

    if (isExpired) {
      canCreateOrder = false;
      orderLimitReason = isTrial
        ? 'Seu período de teste grátis de 7 dias expirou. Escolha o Plano Loja ou Plano Loja / Revenda para continuar emitindo Ordens de Serviço.'
        : 'Sua assinatura mensal está vencida. Renove para continuar criando Ordens de Serviço.';
    } else if (isCanceled) {
      canCreateOrder = false;
      orderLimitReason = 'Sua assinatura foi cancelada. Reative o plano para criar novas Ordens de Serviço.';
    }

    // Products count
    const productsCount = this.getProductsCount();
    const maxProducts = planDefinition.limits.maxProducts;

    let canCreateProduct = true;
    let productLimitReason: string | undefined;

    if (isExpired) {
      canCreateProduct = false;
      productLimitReason = isTrial
        ? 'Seu período de teste grátis de 7 dias expirou. Escolha o Plano Loja ou Plano Loja / Revenda para cadastrar novos produtos.'
        : 'Sua assinatura mensal está vencida. Renove para cadastrar novos produtos.';
    } else if (isCanceled) {
      canCreateProduct = false;
      productLimitReason = 'Sua assinatura foi cancelada. Reative para cadastrar novos produtos.';
    }

    // Advanced reports & PDF export access (unlocked in active Trial, Loja, and Revenda!)
    const canAccessAdvancedReports = isActive;
    const canExportPdf = isActive;

    const formattedExpiryDate = currentPlan.expiryDate
      ? new Date(currentPlan.expiryDate + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Indeterminada';

    return {
      currentPlan,
      planDefinition,
      isTrial,
      isFreePlan,
      isActive,
      isExpired,
      isCanceled,
      daysRemaining,
      formattedExpiryDate,
      osCountThisMonth,
      maxMonthlyOrders,
      canCreateOrder,
      orderLimitReason,
      productsCount,
      maxProducts,
      canCreateProduct,
      productLimitReason,
      canAccessAdvancedReports,
      canExportPdf,
    };
  },

  upgradePlan(targetPlan: PlanType, billingCycle: BillingCycle = 'monthly'): SubscriptionPlanInfo {
    const normalized: PlanType = targetPlan === 'FREE' ? 'TRIAL' : targetPlan === 'PRO' ? 'LOJA' : targetPlan === 'ENTERPRISE' ? 'REVENDA' : targetPlan;
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);

    const isTrial = normalized === 'TRIAL';

    if (isTrial) {
      expiry.setDate(expiry.getDate() + 7); // 7 days trial with everything unlocked!
    } else {
      expiry.setDate(expiry.getDate() + 30); // 30 days monthly billing
    }

    const expiryStr = expiry.toISOString().split('T')[0];
    const price = isTrial ? 0 : planDef.monthlyPrice;

    const updatedPlan: SubscriptionPlanInfo = {
      planType: normalized,
      planName: planDef.name,
      planPrice: price,
      billingCycle: 'monthly',
      billingPeriod: 'MENSAL',
      expiryDate: expiryStr,
      status: 'active',
      clientName: StorageService.getCompanySettings()?.commercialName || 'Assistência Técnica',
      autoRenew: !isTrial,
      contractNumber: `MSP-${normalized}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: isTrial ? 'Teste Grátis (7 Dias)' : 'Cartão de Crédito / PIX Mensal',
      notes: isTrial
        ? 'Teste grátis de 7 dias ativado com 100% dos recursos liberados.'
        : `${planDef.name} ativado com sucesso em ${new Date().toLocaleDateString('pt-BR')}. Pagamento Mensal.`,
      startDate: new Date().toISOString().split('T')[0],
      canceledAt: undefined,
      isTrial,
    };

    StorageService.saveSubscriptionPlan(updatedPlan);
    return updatedPlan;
  },

  activatePlanWithPayment(
    targetPlan: PlanType,
    paymentInfo: {
      method: 'pix' | 'credit_card';
      paymentId: string;
      amount: number;
      notes?: string;
    }
  ): SubscriptionPlanInfo {
    const normalized: PlanType =
      targetPlan === 'PRO' ? 'LOJA' : targetPlan === 'ENTERPRISE' ? 'REVENDA' : targetPlan;
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30); // 30 days monthly billing

    const expiryStr = expiry.toISOString().split('T')[0];
    const methodLabel =
      paymentInfo.method === 'pix' ? 'Mercado Pago (PIX)' : 'Mercado Pago (Cartão)';

    const updatedPlan: SubscriptionPlanInfo = {
      planType: normalized,
      planName: planDef.name,
      planPrice: paymentInfo.amount || planDef.monthlyPrice,
      billingCycle: 'monthly',
      billingPeriod: 'MENSAL',
      expiryDate: expiryStr,
      status: 'active',
      clientName: StorageService.getCompanySettings()?.commercialName || 'Assistência Técnica',
      autoRenew: true,
      contractNumber: `MP-${paymentInfo.paymentId}`,
      paymentMethod: methodLabel,
      notes:
        paymentInfo.notes ||
        `${planDef.name} aprovado via ${methodLabel} (Transação ${paymentInfo.paymentId}) em ${new Date().toLocaleDateString('pt-BR')}.`,
      startDate: new Date().toISOString().split('T')[0],
      canceledAt: undefined,
      isTrial: false,
    };

    StorageService.saveSubscriptionPlan(updatedPlan);
    return updatedPlan;
  },

  startTrial(days: number = 7): SubscriptionPlanInfo {
    return this.upgradePlan('TRIAL', 'monthly');
  },

  cancelSubscription(): SubscriptionPlanInfo {
    const current = StorageService.getSubscriptionPlan();
    const updated: SubscriptionPlanInfo = {
      ...current,
      status: 'canceled',
      autoRenew: false,
      canceledAt: new Date().toISOString().split('T')[0],
      notes: `Assinatura cancelada pelo usuário em ${new Date().toLocaleDateString('pt-BR')}.`,
    };
    StorageService.saveSubscriptionPlan(updated);
    return updated;
  },

  reactivateSubscription(): SubscriptionPlanInfo {
    const current = StorageService.getSubscriptionPlan();
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);

    const updated: SubscriptionPlanInfo = {
      ...current,
      status: 'active',
      autoRenew: true,
      expiryDate: expiry.toISOString().split('T')[0],
      canceledAt: undefined,
      notes: `Assinatura reativada com sucesso em ${new Date().toLocaleDateString('pt-BR')}.`,
    };
    StorageService.saveSubscriptionPlan(updated);
    return updated;
  },

  simulatePlan(
    planType: PlanType,
    status: SubscriptionStatus = 'active',
    customExpiryDays?: number
  ): SubscriptionPlanInfo {
    const normalized: PlanType = planType === 'FREE' ? 'TRIAL' : planType === 'PRO' ? 'LOJA' : planType === 'ENTERPRISE' ? 'REVENDA' : planType;
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);

    const isTrial = normalized === 'TRIAL';

    if (customExpiryDays !== undefined) {
      expiry.setDate(expiry.getDate() + customExpiryDays);
    } else if (status === 'expired' || status === 'VENCIDO') {
      expiry.setDate(expiry.getDate() - 2); // 2 days in past
    } else if (isTrial) {
      expiry.setDate(expiry.getDate() + 7); // 7 days trial
    } else {
      expiry.setDate(expiry.getDate() + 30);
    }

    const updated: SubscriptionPlanInfo = {
      planType: normalized,
      planName: planDef.name,
      planPrice: isTrial ? 0 : planDef.monthlyPrice,
      billingCycle: 'monthly',
      billingPeriod: 'MENSAL',
      expiryDate: expiry.toISOString().split('T')[0],
      status,
      clientName: StorageService.getCompanySettings()?.commercialName || 'Assistência Técnica',
      autoRenew: status === 'active' && !isTrial,
      contractNumber: `SIM-${normalized}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: isTrial ? 'Teste Grátis (7 Dias)' : 'Simulação de Pagamento Mensal',
      notes: isTrial
        ? 'Simulação do Teste Grátis de 7 Dias com tudo liberado.'
        : `Simulação de ambiente: ${planDef.name} (${status}).`,
      isTrial,
    };

    StorageService.saveSubscriptionPlan(updated);
    return updated;
  },

  resetToDefaultPlan(): SubscriptionPlanInfo {
    return this.upgradePlan('LOJA', 'monthly');
  },
};

