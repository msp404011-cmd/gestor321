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

export const SUPER_ADMIN_EMAIL = 'mmspmartins62@gmail.com';
export const SUPER_ADMIN_EMAILS = [
  'mmspmartins62@gmail.com',
  'msp404011@gmail.com',
];

export function isSuperAdminUser(email?: string | null): boolean {
  const normalize = (e?: string | null) => (e || '').trim().toLowerCase();
  const target = normalize(email);
  if (
    target &&
    (SUPER_ADMIN_EMAILS.includes(target) ||
      target === 'mmspmartins62@gmail.com' ||
      target === 'msp404011@gmail.com' ||
      target.includes('mmspmartins62') ||
      target.includes('msp404011'))
  ) {
    return true;
  }
  try {
    const session = StorageService.getAuthSession();
    const sessionEmail = normalize(session?.email);
    if (
      sessionEmail &&
      (SUPER_ADMIN_EMAILS.includes(sessionEmail) ||
        sessionEmail === 'mmspmartins62@gmail.com' ||
        sessionEmail === 'msp404011@gmail.com' ||
        sessionEmail.includes('mmspmartins62') ||
        sessionEmail.includes('msp404011'))
    ) {
      return true;
    }
    const user = StorageService.getCurrentUser();
    const userEmail = normalize(user?.email);
    if (
      userEmail &&
      (SUPER_ADMIN_EMAILS.includes(userEmail) ||
        userEmail === 'mmspmartins62@gmail.com' ||
        userEmail === 'msp404011@gmail.com' ||
        userEmail.includes('mmspmartins62') ||
        userEmail.includes('msp404011'))
    ) {
      return true;
    }
    const plan = StorageService.getSubscriptionPlan();
    if (plan?.planType === 'SUPER_ADMIN') {
      return true;
    }
  } catch {}
  return false;
}

export const SUPER_ADMIN_PLAN: PlanDefinition = {
  id: 'SUPER_ADMIN',
  name: 'Plano Super Admin Vitalício',
  tagline: 'Plano exclusivo de Super Administrador: acesso vitalício ilimitado, sem vencimento, sem dias e sem valor.',
  badge: 'SUPER ADMIN VITALÍCIO',
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
    prioritySupport: true,
  },
  features: [
    { text: 'Acesso Vitalício Permanente Sem Vencimento', included: true, highlight: true },
    { text: 'Sem data de expiração e sem contagem de dias', included: true, highlight: true },
    { text: 'Sem Mensalidade ou Custo (Plano Exclusivo)', included: true, highlight: true },
    { text: 'Ordens de Serviço 100% Ilimitadas', included: true, highlight: true },
    { text: 'Frente de Caixa (PDV) e Vendas Balcão Ilimitado', included: true, highlight: true },
    { text: 'Módulo de Revenda, Atacado e Consignação Liberados', included: true, highlight: true },
    { text: 'Cadastro de Produtos, Peças e Estoque Ilimitado', included: true, highlight: true },
    { text: 'Gestão de Clientes e Aparelhos Ilimitados', included: true, highlight: true },
    { text: 'Relatórios Financeiros Avançados, DRE e Auditoria', included: true, highlight: true },
    { text: 'Acesso Irrestrito ao Painel Master e Todas as Funções', included: true, highlight: true },
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
  SUPER_ADMIN: SUPER_ADMIN_PLAN,
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

export function normalizePlanType(rawInput: any): PlanType {
  if (!rawInput) return 'ASSISTENCIA';
  const str = String(rawInput)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (str.includes('SUPER') || str.includes('MASTER') || str.includes('VITALICIO')) {
    return 'SUPER_ADMIN';
  }
  if (str.includes('PDV')) {
    return 'PDV_VENDAS';
  }
  if (str.includes('REVENDA') || str.includes('ATACADO')) {
    return 'REVENDA';
  }
  if (str.includes('ASSISTENCIA') || str.includes('LOJA') || str.includes('PRO')) {
    return 'ASSISTENCIA';
  }
  if (
    str.includes('TRIAL') ||
    str.includes('FREE') ||
    str.includes('TESTE') ||
    str.includes('GRATIS') ||
    str.includes('7 DIAS') ||
    str.includes('7DIAS')
  ) {
    return 'TRIAL';
  }

  if (str === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (str === 'PDV_VENDAS') return 'PDV_VENDAS';
  if (str === 'ASSISTENCIA') return 'ASSISTENCIA';
  if (str === 'REVENDA') return 'REVENDA';
  if (str === 'TRIAL') return 'TRIAL';

  return 'ASSISTENCIA';
}

export const SubscriptionService = {
  getCurrentPlan(): SubscriptionPlanInfo {
    if (isSuperAdminUser()) {
      return {
        planType: 'SUPER_ADMIN',
        planName: 'Plano Super Admin Vitalício',
        planPrice: 0,
        billingCycle: 'monthly',
        billingPeriod: 'VITALÍCIO',
        expiryDate: '', // Sem vencimento, sem data!
        status: 'active',
        clientName: 'Painel Master Gestor',
        accountEmail: SUPER_ADMIN_EMAIL,
        autoRenew: false,
        paymentMethod: 'Acesso Exclusivo Super Admin',
        notes: 'Acesso Vitalício Ilimitado Exclusivo do Super Administrador sem vencimento, sem dias e sem valor.',
        startDate: '2025-01-01',
        isTrial: false,
      };
    }
    return StorageService.getSubscriptionPlan();
  },

  getPlanDefinition(planType: PlanType): PlanDefinition {
    const norm = normalizePlanType(planType);
    return SUBSCRIPTION_PLANS[norm] || SUBSCRIPTION_PLANS.ASSISTENCIA;
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
    if (isSuperAdminUser()) {
      const currentPlan = this.getCurrentPlan();
      return {
        currentPlan,
        planDefinition: SUPER_ADMIN_PLAN,
        isTrial: false,
        isFreePlan: false,
        isActive: true,
        isExpired: false,
        isCanceled: false,
        daysRemaining: null, // Sem contagem de dias para o Super Admin
        formattedExpiryDate: 'Sem Vencimento (Vitalício)',
        osCountThisMonth: this.getOrdersCountThisMonth(),
        maxMonthlyOrders: null,
        canCreateOrder: true,
        productsCount: this.getProductsCount(),
        maxProducts: null,
        canCreateProduct: true,
        canAccessAdvancedReports: true,
        canExportPdf: true,
      };
    }

    const currentPlan = StorageService.getSubscriptionPlan();
    const planType: PlanType = normalizePlanType(currentPlan.planType);
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

    if (planType === 'PDV_VENDAS') {
      canCreateOrder = false;
      orderLimitReason = 'O Plano PDV & Vendas não inclui o módulo de Ordens de Serviço. Atualize para o Plano Assistência Técnica ou Revenda para utilizar este recurso.';
    } else if (isExpired) {
      canCreateOrder = false;
      orderLimitReason = isTrial
        ? 'Seu período de teste grátis de 7 dias expirou. Escolha um plano para continuar emitindo Ordens de Serviço.'
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
        ? 'Seu período de teste grátis de 7 dias expirou. Escolha um plano para cadastrar novos produtos.'
        : 'Sua assinatura mensal está vencida. Renove para cadastrar novos produtos.';
    } else if (isCanceled) {
      canCreateProduct = false;
      productLimitReason = 'Sua assinatura foi cancelada. Reative para cadastrar novos produtos.';
    }

    // Advanced reports & PDF export access
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
    const normalized: PlanType = normalizePlanType(targetPlan);
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);

    const isTrial = normalized === 'TRIAL';

    if (isTrial) {
      expiry.setDate(expiry.getDate() + 7);
    } else {
      expiry.setDate(expiry.getDate() + 30);
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
    const normalized: PlanType = normalizePlanType(targetPlan);
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);

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
    const normalized: PlanType = normalizePlanType(planType);
    const planDef = this.getPlanDefinition(normalized);
    const now = new Date();
    const expiry = new Date(now);

    const isTrial = normalized === 'TRIAL';

    if (customExpiryDays !== undefined) {
      expiry.setDate(expiry.getDate() + customExpiryDays);
    } else if (status === 'expired' || status === 'VENCIDO') {
      expiry.setDate(expiry.getDate() - 2);
    } else if (isTrial) {
      expiry.setDate(expiry.getDate() + 7);
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
    if (isSuperAdminUser()) {
      return true; // Super Admin tem todas as funções 100% liberadas exclusivamente para ele
    }

    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType = targetPlanType || currentPlan.planType;
    const norm: PlanType = normalizePlanType(rawType);

    if (norm === 'SUPER_ADMIN' || norm === 'TRIAL' || norm === 'REVENDA') {
      return true; // Todos os módulos 100% liberados
    }

    if (norm === 'PDV_VENDAS') {
      // Plano PDV & Vendas: Sem OS (ORDERS), Sem Aparelhos (DEVICES), Sem Revenda (RESELLERS)
      if (tab === 'ORDERS' || tab === 'DEVICES' || tab === 'RESELLERS') {
        return false;
      }
      return true;
    }

    if (norm === 'ASSISTENCIA') {
      // Plano Assistência Técnica: Com OS, Aparelhos, PDV. Sem Revenda
      if (tab === 'RESELLERS') {
        return false;
      }
      return true;
    }

    return true;
  },

  isTechnicalAssistanceAllowed(targetPlanType?: PlanType): boolean {
    if (isSuperAdminUser()) return true;

    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType = targetPlanType || currentPlan.planType;
    const norm: PlanType = normalizePlanType(rawType);

    if (norm === 'SUPER_ADMIN' || norm === 'TRIAL' || norm === 'REVENDA' || norm === 'ASSISTENCIA') {
      return true;
    }

    return false;
  },

  isResellerFeatureAllowed(targetPlanType?: PlanType): boolean {
    if (isSuperAdminUser()) return true;

    const currentPlan = StorageService.getSubscriptionPlan();
    const rawType = targetPlanType || currentPlan.planType;
    const norm: PlanType = normalizePlanType(rawType);

    return norm === 'SUPER_ADMIN' || norm === 'REVENDA' || norm === 'TRIAL';
  },

  isSuperAdminUser(email?: string | null): boolean {
    return isSuperAdminUser(email);
  },
};

