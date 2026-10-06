import { ServiceOrder, CompanySettings } from '../types';
import { formatCurrency } from '../services/formatters';

export type BudgetCopyType = 'FIRST_LINE' | 'PREMIUM' | 'COMPARATIVE';

export const generateOrderBudgetWhatsAppText = (
  order: Partial<ServiceOrder>,
  copyType: BudgetCopyType,
  company?: Partial<CompanySettings>
): string => {
  const shopName = company?.commercialName || company?.name || 'Assistência Técnica';
  const shopPhone = company?.phone || company?.whatsapp || '';
  const orderNum = order.orderNumber ? `#${order.orderNumber}` : 'Orçamento';
  const clientName = order.customerName ? order.customerName.split(' ')[0] : 'Cliente';
  const device = `${order.brand || ''} ${order.model || ''}`.trim() || 'Aparelho';
  const defect = order.clientDefect || order.technicalDiagnosis || 'Avaliação técnica';
  const laborPrice = Number(order.laborPrice) || 0;
  const warranty = order.warrantyDays || company?.defaultWarrantyDays || 90;

  const priceFirstLine = Number(order.partPriceFirstLine) || 0;
  const pricePremium = Number(order.partPricePremium) || 0;
  const partName = order.partTierDescription || 'Peça / Componente';

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
