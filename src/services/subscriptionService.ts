import { StorageService } from './storage';
import { PlanType, SubscriptionStatus, BillingCycle, SubscriptionPlanInfo, PlanLimits, NavigationTab } from '../types';

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
    { text: 'Ordens de Serviço e Aparelhos Ilimitados', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) Rápido e Completo', included: true },
    { text: 'Módulo de Revenda e Tabela de Atacado Liberados', included: true },
    { text: 'Produtos e Peças no Estoque Ilimitados', included: true },
    { text: 'Controle de Caixa e Relatórios Financeiros', included: true },
  ],
};

const PDV_VENDAS_PLAN: PlanDefinition = {
  id: 'PDV_VENDAS',
  name: 'Plano PDV & Vendas',
  tagline: 'Focado exclusivamente em Frente de Caixa (PDV), Vendas Balcão, Estoque e Clientes.',
  badge: 'SÓ VENDAS & PDV',
  popular: false,
  monthlyPrice: 34.90,
  limits: {
    maxMonthlyOrders: 0,
    maxProducts: null,
    maxCollaborators: null,
    advancedReports: true,
    pdfExport: true,
    cloudBackup: true,
    auditLogs: true,
  },
  features: [
    { text: 'Frente de Caixa (PDV) Rápido e Ágil', included: true, highlight: true },
    { text: 'Vendas Balcão e Emissão de Recibos Térmicos', included: true, highlight: true },
    { text: 'Cadastro de Produtos e Controle de Estoque', included: true, highlight: true },
    { text: 'Gestão de Clientes e Crediário / A Prazo', included: true },
    { text: 'Abertura, Sangria e Fechamento de Caixa', included: true },
    { text: 'Relatórios de Vendas e Faturamento Balcão', included: true },
  ],
};

const ASSISTENCIA_PLAN: PlanDefinition = {
  id: 'ASSISTENCIA',
  name: 'Plano Assistência Técnica',
  tagline: 'Solução completa para Assistência Técnica: OS, Aparelhos, Checklists, PDV e Peças.',
  badge: 'MAIS POPULAR',
  popular: true,
  monthlyPrice: 69.90,
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
    { text: 'Gestão de Aparelhos e Equipamentos', included: true, highlight: true },
    { text: 'Checklist de Entrada e Saída com Fotos', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) e Vendas Balcão', included: true },
    { text: 'Produtos, Peças e Insumos Ilimitados', included: true },
    { text: 'Controle Financeiro de Caixa e DRE', included: true },
    { text: 'Relatórios Gerenciais e Exportação PDF', included: true },
  ],
};

const REVENDA_PLAN: PlanDefinition = {
  id: 'REVENDA',
  name: 'Plano Completo + Revenda',
  tagline: 'Tudo da Assistência Técnica + Módulo de Revenda, Atacado e Consignados.',
  badge: 'COMPLETO + REVENDA',
  popular: false,
  monthlyPrice: 79.90,
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
    { text: 'Tudo do Plano Assistência Técnica incluso', included: true, highlight: true },
    { text: 'Módulo de Revendedores e Atacado Completo', included: true, highlight: true },
    { text: 'Tabela de Preços Diferenciada (Varejo vs Revenda)', included: true, highlight: true },
    { text: 'Cadastro e Gestão de Revendedores Parceiros', included: true },
    { text: 'Controle Automático de Comissões de Revenda', included: true },
    { text: 'Vendas Consignadas e Fechamento no PDV', included: true },
  ],
};

const COMPLETO_50_PLAN: PlanDefinition = {
  id: 'COMPLETO_50',
  name: 'Plano Completo (R$ 0,50)',
  tagline: 'Todos os módulos do sistema (OS, PDV, Revenda, Relatórios e Estoque) 100% liberados por R$ 0,50.',
  badge: 'COMPLETO R$ 0,50',
  popular: true,
  monthlyPrice: 0.50,
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
    { text: 'Acesso 100% Completo ao sistema por apenas R$ 0,50', included: true, highlight: true },
    { text: 'Ordens de Serviço e Aparelhos Ilimitados', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) Rápido e Ágil', included: true, highlight: true },
    { text: 'Módulo de Revenda e Atacado Liberados', included: true, highlight: true },
    { text: 'Produtos, Peças e Estoque Ilimitados', included: true },
    { text: 'Relatórios Financeiros, DRE e PDF Liberados', included: true },
  ],
};

export const SUBSCRIPTION_PLANS: Record<PlanType, PlanDefinition> = {
  TRIAL: TRIAL_PLAN,
  FREE: TRIAL_PLAN,
  PDV_VENDAS: PDV_VENDAS_PLAN,
  ASSISTENCIA: ASSISTENCIA_PLAN,
  LOJA: ASSISTENCIA_PLAN,
  PRO: ASSISTENCIA_PLAN,
  REVENDA: REVENDA_PLAN,
  ENTERPRISE: REVENDA_PLAN,
  TESTE_REAL: COMPLETO_50_PLAN,
  COMPLETO_50: COMPLETO_50_PLAN,
  COMPLETO_PROMO: COMPLETO_50_PLAN,
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
      targetPlan === 'PRO' ? 'LOJA' : targetPlan === 'ENTERPRISE' ? 'REVENDA' : targetPlan === 'COMPLETO_PROMO' ? 'COMPLETO_50' : targetPlan === 'TESTE_REAL' ? 'COMPLETO_50' : targetPlan;
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
    return this.upgradePlan('ASSISTENCIA', 'monthly');
  },

  isTabAllowed(tab: NavigationTab, targetPlanType?: PlanType): boolean {
    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType: PlanType = targetPlanType || currentPlan.planType || 'ASSISTENCIA';
    const norm: PlanType =
      rawType === 'PRO' || rawType === 'LOJA' ? 'ASSISTENCIA' :
      rawType === 'ENTERPRISE' ? 'REVENDA' :
      rawType === 'FREE' ? 'TRIAL' : rawType;

    if (norm === 'TRIAL' || norm === 'REVENDA' || norm === 'TESTE_REAL') {
      return true; // Todos os módulos 100% liberados
    }

    if (norm === 'PDV_VENDAS') {
      // Plano PDV & Vendas R$ 34,90: Sem OS, Sem Aparelhos, Sem Revenda
      if (tab === 'ORDERS' || tab === 'DEVICES' || tab === 'RESELLERS') {
        return false;
      }
      return true;
    }

    if (norm === 'ASSISTENCIA') {
      // Plano Assistência Técnica R$ 69,90: Com OS, Aparelhos, PDV. Sem Revenda
      if (tab === 'RESELLERS') {
        return false;
      }
      return true;
    }

    return true;
  },

  isResellerFeatureAllowed(targetPlanType?: PlanType): boolean {
    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType: PlanType = targetPlanType || currentPlan.planType || 'ASSISTENCIA';
    const norm: PlanType =
      rawType === 'PRO' || rawType === 'LOJA' ? 'ASSISTENCIA' :
      rawType === 'ENTERPRISE' ? 'REVENDA' :
      rawType === 'FREE' ? 'TRIAL' : rawType;

    return norm === 'REVENDA' || norm === 'TRIAL' || norm === 'TESTE_REAL';
  },
};

