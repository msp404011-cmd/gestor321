import { OrderStatus, PaymentMethod } from '../types';

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDateString;
  }
}

export function formatDateTime(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDateString;
  }
}

export function formatPhone(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function formatDocument(doc?: string): string {
  if (!doc) return '';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return doc;
}

export function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length <= 11 && !clean.startsWith('55')) {
    clean = '55' + clean;
  }
  return clean;
}

export type CanonicalStatus =
  | 'ORCAMENTO'
  | 'AGUARDANDO_AUTORIZACAO'
  | 'AUTORIZADO'
  | 'AGUARDANDO_PECA'
  | 'ATRASADO'
  | 'PRONTO'
  | 'ENTREGUE';

export function getCanonicalStatus(status?: string): CanonicalStatus {
  const s = (status || '').toUpperCase().trim();

  if (
    s === 'ORCAMENTO' ||
    s === 'NOVA' ||
    s === 'ABERTA' ||
    s === 'EM_ANALISE' ||
    s === 'AGUARDANDO_DIAGNOSTICO' ||
    s === 'AGUARDANDO_ORCAMENTO'
  ) {
    return 'ORCAMENTO';
  }

  if (
    s === 'AGUARDANDO_AUTORIZACAO' ||
    s === 'AGUARDANDO' ||
    s === 'AGUARDANDO_APROVACAO' ||
    s === 'NAO_APROVADA'
  ) {
    return 'AGUARDANDO_AUTORIZACAO';
  }

  if (
    s === 'AGUARDANDO_PECA' ||
    s === 'AGUARDANDO_PECAS' ||
    s === 'AGUARDANDO_PERCA'
  ) {
    return 'AGUARDANDO_PECA';
  }

  if (s === 'ATRASADO' || s === 'ATRASADA') {
    return 'ATRASADO';
  }

  if (
    s === 'PRONTO' ||
    s === 'PRONTA' ||
    s === 'PRONTO_ENTREGA' ||
    s === 'PRONTAS' ||
    s === 'TESTES_CONCLUIDOS' ||
    s === 'AVISADO_CLIENTE'
  ) {
    return 'PRONTO';
  }

  if (s === 'ENTREGUE' || s === 'ENTREGUES' || s === 'FINALIZADA') {
    return 'ENTREGUE';
  }

  if (
    s === 'AUTORIZADO' ||
    s === 'AUTORIZADA' ||
    s === 'APROVADA' ||
    s === 'EM_BANCADA' ||
    s === 'EM_MANUTENCAO' ||
    s === 'EM_REPARO'
  ) {
    return 'AUTORIZADO';
  }

  return 'ORCAMENTO';
}

export function getOrderStatusLabel(status: OrderStatus | string): string {
  const canonical = getCanonicalStatus(status);
  const map: Record<CanonicalStatus, string> = {
    ORCAMENTO: 'Orçamento',
    AGUARDANDO_AUTORIZACAO: 'Aguardando Autorização',
    AUTORIZADO: 'Autorizado',
    AGUARDANDO_PECA: 'Aguardando Peça',
    ATRASADO: 'Atrasado',
    PRONTO: 'Pronto',
    ENTREGUE: 'Entregue',
  };
  return map[canonical] || 'Orçamento';
}

export function getOrderStatusBadgeClasses(status: OrderStatus | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const canonical = getCanonicalStatus(status);
  switch (canonical) {
    case 'ORCAMENTO':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-400' };

    case 'AGUARDANDO_AUTORIZACAO':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/40', dot: 'bg-purple-400' };

    case 'AUTORIZADO':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/40', dot: 'bg-cyan-400' };

    case 'AGUARDANDO_PECA':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40', dot: 'bg-orange-400' };

    case 'ATRASADO':
      return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-400' };

    case 'PRONTO':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-400' };

    case 'ENTREGUE':
      return { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/40', dot: 'bg-teal-400' };

    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/40', dot: 'bg-slate-400' };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod | string): string {
  const map: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_DEBITO: 'Cartão de Débito',
    CARTAO_CREDITO: 'Cartão de Crédito',
    TRANSFERENCIA: 'Transferência Bancária',
    FIADO: 'A Prazo / Fiado',
    A_PRAZO: 'A Prazo',
    'A PRAZO': 'A Prazo',
    MULTIPLO: 'Múltiplos Meios',
    BOLETO: 'Crediário / Boleto',
  };
  return map[method] || method;
}

export function generateReceivableWhatsAppMessage(params: {
  customerName: string;
  referenceNumber: string;
  deviceInfo?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  companyName?: string;
  companyPhone?: string;
  pixKey?: string;
  lastPaymentAmount?: number;
  lastPaymentMethod?: string;
  createdAt?: string;
  serviceDescription?: string;
  payments?: { amount: number; paymentMethod: string; date: string }[];
}): string {
  const compName = params.companyName || 'MSP INFORMÁTICA';
  const total = formatCurrency(params.totalAmount);
  const paid = formatCurrency(params.paidAmount);
  const remaining = formatCurrency(params.remainingAmount);
  const due = params.dueDate ? formatDate(params.dueDate) : 'A combinar';
  const creationDay = params.createdAt ? formatDate(params.createdAt) : 'Não informado';

  let msg = `✨ *${compName.toUpperCase()}* ✨\n`;
  msg += `📋 *EXTRATO DE CONTA / FIADO VENCIDO OU A PRAZO*\n\n`;
  msg += `Olá, *${params.customerName}*! Segue abaixo o detalhamento detalhado do seu débito:\n\n`;

  msg += `🚨 *DÉBITO ATUAL:*\n`;
  msg += `📝 *O que é o Débito:* ${params.referenceNumber}${params.deviceInfo ? ` - ${params.deviceInfo}` : ''}${params.serviceDescription ? ` (${params.serviceDescription})` : ''}\n`;
  msg += `💵 *Valor:* ${total}\n`;
  msg += `📅 *Dia do Débito:* ${creationDay}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `✅ *HISTÓRICO DE PAGAMENTOS:*\n`;

  let paymentsCount = 0;

  // If there's detailed historical payments
  if (params.payments && params.payments.length > 0) {
    params.payments.forEach((p, idx) => {
      paymentsCount++;
      msg += `🔹 *Pagamento #${idx + 1}:*\n`;
      msg += `💰 *Valor que foi Pago:* ${formatCurrency(p.amount)}\n`;
      msg += `💳 *Em que foi Pago:* ${getPaymentMethodLabel(p.paymentMethod || 'PIX')}\n`;
      msg += `📅 *Data do Pagamento:* ${formatDate(p.date)}\n`;
      msg += `─────────────────────────\n`;
    });
  } else if (params.paidAmount > 0) {
    // If there's an entry / paid amount but no detailed payment objects yet (compatibility/legacy)
    paymentsCount++;
    msg += `💰 *Valor que foi Pago:* ${paid}\n`;
    msg += `💳 *Em que foi Pago:* ${getPaymentMethodLabel(params.lastPaymentMethod || 'PIX')}\n`;
    msg += `📅 *Data do Pagamento:* ${creationDay}\n`;
    msg += `─────────────────────────\n`;
  }

  if (paymentsCount === 0) {
    msg += `❌ Nenhum pagamento parcial realizado ainda.\n`;
    msg += `─────────────────────────\n`;
  }

  msg += `\n📊 *RESUMO DO SALDO:*\n`;
  msg += `🔹 *Valor Total:* ${total}\n`;
  msg += `💵 *Total Pago:* ${paid}\n`;
  msg += `⏳ *RESTANTE A PAGAR:* *${remaining}*\n`;
  msg += `🗓️ *Vencimento da Conta:* ${due}\n\n`;

  if (params.remainingAmount > 0) {
    if (params.pixKey) {
      msg += `🔑 *Chave PIX para Pagamento:* \`${params.pixKey}\`\n`;
      msg += `🏢 *Favorecido:* ${compName}\n\n`;
    }
  } else {
    msg += `🎉 *CONTA TOTALMENTE QUITADA!* Muito obrigado pela pontualidade e preferência! 🤝💙\n\n`;
  }

  msg += `Qualquer dúvida estamos à sua inteira disposição. Tenha um excelente dia! 🚀⭐`;

  return encodeURIComponent(msg);
}

/**
 * Super-robust helper to open or reuse an existing WhatsApp tab/window
 * without creating endless new tabs, bypassing browser pop-up quirks.
 */
export function openWhatsAppLink(url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Standard native browser window targeting for named windows is extremely robust.
    // If a tab with the target name 'whatsapp_window' already exists, calling this 
    // will instantly reload or navigate that exact tab to the new URL.
    window.open(url, 'whatsapp_window');
  } catch (e) {
    // Safe fallback to dynamic anchor click
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = 'whatsapp_window';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Direct location set as final fallback
      window.location.href = url;
    }
  }
}
