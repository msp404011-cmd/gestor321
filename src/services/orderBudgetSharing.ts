import { ServiceOrder, CompanySettings } from '../types';
import { formatCurrency } from './formatters';

export interface BudgetTotals {
  firstLineTotal: number;
  premiumTotal: number;
  chosenTotal: number;
  hasDualTier: boolean;
  partsWithTiers: {
    name: string;
    firstLinePrice: number;
    premiumPrice: number;
    chosenTier: 'FIRST_LINE' | 'PREMIUM';
  }[];
}

/**
 * Calculates financial totals for 1ª Linha vs Premium options
 */
export function calculateOrderBudgetTotals(order: ServiceOrder): BudgetTotals {
  const parts = order.items && order.items.length > 0 ? order.items : order.parts || [];
  const labor = Number(order.laborPrice) || 0;
  const discount = Number(order.discount) || 0;

  let firstLinePartsSum = 0;
  let premiumPartsSum = 0;
  let hasDualTier = false;
  const partsWithTiers: BudgetTotals['partsWithTiers'] = [];

  parts.forEach((p) => {
    const qty = Number(p.quantity) || 1;
    if (p.hasQualityTiers && (p.firstLinePrice !== undefined || p.premiumPrice !== undefined)) {
      hasDualTier = true;
      const fl = p.firstLinePrice !== undefined ? Number(p.firstLinePrice) : Number(p.unitPrice) || 0;
      const pr = p.premiumPrice !== undefined ? Number(p.premiumPrice) : Number(p.unitPrice) || 0;
      firstLinePartsSum += fl * qty;
      premiumPartsSum += pr * qty;
      partsWithTiers.push({
        name: p.name || p.productName || 'Peça',
        firstLinePrice: fl,
        premiumPrice: pr,
        chosenTier: p.chosenTier || 'FIRST_LINE',
      });
    } else {
      const standardPrice = Number(p.unitPrice) || 0;
      firstLinePartsSum += standardPrice * qty;
      premiumPartsSum += standardPrice * qty;
    }
  });

  const firstLineTotal = Math.max(0, firstLinePartsSum + labor - discount);
  const premiumTotal = Math.max(0, premiumPartsSum + labor - discount);
  const chosenTotal = Number(order.totalPrice) || (hasDualTier ? firstLineTotal : Number(order.totalPrice) || 0);

  return {
    firstLineTotal,
    premiumTotal,
    chosenTotal,
    hasDualTier,
    partsWithTiers,
  };
}

/**
 * Generates customer budget message for Option 1: 1ª Linha only
 */
export function generateFirstLineBudgetMessage(order: ServiceOrder, company: CompanySettings): string {
  const totals = calculateOrderBudgetTotals(order);
  const defectOrService = order.performedService || order.technicalDiagnosis || order.clientDefect || 'Manutenção';
  const warrantyDays = order.warrantyDays || 90;

  let msg = `Olá *${order.customerName}*, tudo bem?\n`;
  msg += `Aqui é da *${company.commercialName || company.name || 'Assistência Técnica'}* informando sobre sua OS *#${order.orderNumber}*.\n\n`;
  msg += `📱 *Aparelho:* ${order.brand} ${order.model}\n`;
  msg += `🔧 *Defeito/Serviço:* ${defectOrService}\n\n`;
  msg += `📋 *ORÇAMENTO (OPÇÃO 1ª LINHA):*\n`;

  if (totals.partsWithTiers.length > 0) {
    totals.partsWithTiers.forEach((p) => {
      msg += `• Peça: ${p.name} (1ª Linha): ${formatCurrency(p.firstLinePrice)}\n`;
    });
  }
  if (order.laborPrice > 0) {
    msg += `• Mão de obra técnica: ${formatCurrency(order.laborPrice)}\n`;
  }
  if (order.discount > 0) {
    msg += `• Desconto: -${formatCurrency(order.discount)}\n`;
  }

  msg += `💰 *VALOR TOTAL: ${formatCurrency(totals.firstLineTotal)}*\n`;
  msg += `🛡️ *Garantia:* ${warrantyDays} dias\n\n`;
  msg += `Podemos prosseguir com o serviço nesta opção? Por favor, responda com sua aprovação.`;

  return msg;
}

/**
 * Generates customer budget message for Option 2: Peça Premium only
 */
export function generatePremiumBudgetMessage(order: ServiceOrder, company: CompanySettings): string {
  const totals = calculateOrderBudgetTotals(order);
  const defectOrService = order.performedService || order.technicalDiagnosis || order.clientDefect || 'Manutenção';
  const warrantyDays = order.warrantyDays || 90;

  let msg = `Olá *${order.customerName}*, tudo bem?\n`;
  msg += `Aqui é da *${company.commercialName || company.name || 'Assistência Técnica'}* informando sobre sua OS *#${order.orderNumber}*.\n\n`;
  msg += `📱 *Aparelho:* ${order.brand} ${order.model}\n`;
  msg += `🔧 *Defeito/Serviço:* ${defectOrService}\n\n`;
  msg += `💎 *ORÇAMENTO (OPÇÃO PEÇA PREMIUM):*\n`;

  if (totals.partsWithTiers.length > 0) {
    totals.partsWithTiers.forEach((p) => {
      msg += `• Peça: ${p.name} (Premium): ${formatCurrency(p.premiumPrice)}\n`;
    });
  }
  if (order.laborPrice > 0) {
    msg += `• Mão de obra técnica: ${formatCurrency(order.laborPrice)}\n`;
  }
  if (order.discount > 0) {
    msg += `• Desconto: -${formatCurrency(order.discount)}\n`;
  }

  msg += `💰 *VALOR TOTAL: ${formatCurrency(totals.premiumTotal)}*\n`;
  msg += `🛡️ *Garantia:* ${warrantyDays} dias\n\n`;
  msg += `✨ *Diferencial da Peça Premium:* Qualidade superior, cores fiéis, touch sensível e durabilidade máxima (a mais próxima da original).\n\n`;
  msg += `Podemos prosseguir com o serviço na Peça Premium? Por favor, responda com sua aprovação.`;

  return msg;
}

/**
 * Generates customer budget message for Option 3: Both options (Comparativo 1ª Linha x Premium)
 * with the quality explanation
 */
export function generateComparisonBudgetMessage(order: ServiceOrder, company: CompanySettings): string {
  const totals = calculateOrderBudgetTotals(order);
  const defectOrService = order.performedService || order.technicalDiagnosis || order.clientDefect || 'Manutenção';
  const warrantyDays = order.warrantyDays || 90;

  let msg = `Olá *${order.customerName}*, tudo bem?\n`;
  msg += `Aqui é da *${company.commercialName || company.name || 'Assistência Técnica'}* informando sobre sua OS *#${order.orderNumber}*.\n\n`;
  msg += `📱 *Aparelho:* ${order.brand} ${order.model}\n`;
  msg += `🔧 *Defeito/Serviço:* ${defectOrService}\n\n`;
  msg += `Temos *2 opções de peças* para a realização do serviço no seu aparelho:\n\n`;

  // Opção 1
  msg += `1️⃣ *OPÇÃO 1: PEÇA 1ª LINHA*\n`;
  if (totals.partsWithTiers.length > 0) {
    totals.partsWithTiers.forEach((p) => {
      msg += `   • Peça (1ª Linha): ${formatCurrency(p.firstLinePrice)}\n`;
    });
  }
  msg += `   💰 *Total: ${formatCurrency(totals.firstLineTotal)}*\n`;
  msg += `   🛡️ Garantia: ${warrantyDays} dias\n\n`;

  // Opção 2
  msg += `2️⃣ *OPÇÃO 2: PEÇA PREMIUM (RECOMENDADA)*\n`;
  if (totals.partsWithTiers.length > 0) {
    totals.partsWithTiers.forEach((p) => {
      msg += `   • Peça (Premium): ${formatCurrency(p.premiumPrice)}\n`;
    });
  }
  msg += `   💰 *Total: ${formatCurrency(totals.premiumTotal)}*\n`;
  msg += `   🛡️ Garantia: ${warrantyDays} dias\n\n`;

  // Explicação de qualidade
  msg += `💡 *SOBRE A QUALIDADE DAS PEÇAS:*\n`;
  msg += `Na opção com *Peça Premium*, a qualidade da peça é superior e sempre a *mais próxima da original*, garantindo maior fidelidade de cores, resolução, sensibilidade no toque e alta durabilidade.\n\n`;
  msg += `Qual das duas opções você prefere aprovar para que possamos iniciar o conserto? Ficamos no aguardo de sua resposta! 😊`;

  return msg;
}

export type BudgetCopyType = 'FIRST_LINE' | 'PREMIUM' | 'COMPARATIVE';

export const generateOrderBudgetWhatsAppText = (
  order: Partial<ServiceOrder>,
  copyType: BudgetCopyType,
  company?: Partial<CompanySettings>
): string => {
  const shopName = company?.commercialName || company?.name || 'Assistência Técnica';
  const orderNum = order.orderNumber ? `#${order.orderNumber}` : 'Orçamento';
  const clientName = order.customerName ? order.customerName.split(' ')[0] : 'Cliente';
  const device = `${order.brand || ''} ${order.model || ''}`.trim() || 'Aparelho';
  const defect = order.clientDefect || order.technicalDiagnosis || 'Avaliação técnica';
  const laborPrice = Number(order.laborPrice) || 0;
  const warranty = order.warrantyDays || company?.defaultWarrantyDays || 90;

  const priceFirstLine = Number(order.partPriceFirstLine) || 0;
  const pricePremium = Number(order.partPricePremium) || 0;

  const totalFirstLine = laborPrice + priceFirstLine;
  const totalPremium = laborPrice + pricePremium;

  if (copyType === 'FIRST_LINE') {
    return `👋 Olá, *${clientName}*!
🏢 Aqui é da *${shopName}*!
📋 Seguem as informações da sua Ordem de Serviço *${orderNum}*:

📱 *Aparelho / Equipamento:* ${device}
⚠️ *Defeito Relatado:* ${defect}

─────────────────────────
💰 *OPÇÃO 1ª LINHA:* *${formatCurrency(totalFirstLine)}*
💡 *Serviço Econômico:* É um serviço econômico para menor custo, lembrando que são realizadas com peças de menor custo e qualidade inferior em relação à linha Premium.
🛡️ *Garantia:* ${warranty} dias

─────────────────────────
❓ Podemos dar andamento no serviço? Por favor, nos confirme sua aprovação!
💬 Qualquer dúvida estamos à disposição!`.trim();
  }

  if (copyType === 'PREMIUM') {
    return `👋 Olá, *${clientName}*!
🏢 Aqui é da *${shopName}*!
📋 Seguem as informações da sua Ordem de Serviço *${orderNum}*:

📱 *Aparelho / Equipamento:* ${device}
⚠️ *Defeito Relatado:* ${defect}

─────────────────────────
💰 *OPÇÃO PREMIUM:* *${formatCurrency(totalPremium)}*
✨ *Diferencial Premium:* Conta com tecnologia e peças com o desempenho e qualidade mais próximos da original de fábrica, garantindo altíssima durabilidade e acabamento impecável!
🛡️ *Garantia:* ${warranty} dias

─────────────────────────
❓ Podemos dar andamento no serviço? Por favor, nos confirme sua aprovação!
💬 Qualquer dúvida estamos à disposição!`.trim();
  }

  // COMPARATIVE (BOTH OPTIONS) - Premium FIRST
  return `👋 Olá, *${clientName}*!
🏢 Aqui é da *${shopName}*!
📋 Seguem as informações da sua Ordem de Serviço *${orderNum}*:

📱 *Aparelho / Equipamento:* ${device}
⚠️ *Defeito Relatado:* ${defect}

─────────────────────────
💰 *OPÇÕES DE ORÇAMENTO DISPONÍVEIS:*

💎 *1. OPÇÃO PREMIUM:* *${formatCurrency(totalPremium)}*
✨ *Diferencial Premium:* Conta com tecnologia e peças com o desempenho e qualidade mais próximos da original de fábrica, garantindo altíssima durabilidade e acabamento impecável!

⭐ *2. OPÇÃO 1ª LINHA:* *${formatCurrency(totalFirstLine)}*
💡 *Serviço Econômico:* É um serviço econômico para menor custo, lembrando que são realizadas com peças de menor custo e qualidade inferior em relação à linha Premium.

─────────────────────────
🛡️ *Garantia de ${warranty} dias* inclusa.
❓ Por favor, nos informe qual das opções você prefere para darmos andamento!
💬 Qualquer dúvida estamos à disposição!`.trim();
};

export const copyOrderBudgetText = async (
  order: Partial<ServiceOrder>,
  copyType: BudgetCopyType,
  company?: Partial<CompanySettings>
): Promise<boolean> => {
  const text = generateOrderBudgetWhatsAppText(order, copyType, company);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch (err) {
    console.error('Erro ao copiar orçamento:', err);
    return false;
  }
};
