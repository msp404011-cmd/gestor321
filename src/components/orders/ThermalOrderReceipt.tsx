import React from 'react';
import { ServiceOrder, CompanySettings } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../services/formatters';

interface ThermalOrderReceiptProps {
  order: ServiceOrder;
  company: CompanySettings;
  paperFormat?: '80mm' | '58mm';
  subtitle?: string;
}

export const ThermalOrderReceipt: React.FC<ThermalOrderReceiptProps> = ({
  order,
  company,
  paperFormat = '80mm',
  subtitle,
}) => {
  // Look up customer full details if available
  const customer = order.customerId
    ? StorageService.getCustomers().find((c) => c.id === order.customerId) || null
    : null;

  const totalGross = (order.partsPrice || 0) + (order.laborPrice || 0) || (order.totalPrice + (order.discount || 0));

  // Encontrar o contas a receber vinculado a esta ordem
  const receivable = StorageService.getReceivables().find(
    (r) => r.referenceId === order.id || r.referenceNumber === `OS #${order.orderNumber}`
  );

  let totalPaid = 0;
  let remainingAmount = order.totalPrice;
  const paymentsList: Array<{ method: string; amount: number; date?: string; label: string }> = [];

  const getPaymentMethodLabelLocal = (method: string) => {
    const map: Record<string, string> = {
      'PIX': 'PIX',
      'MONEY': 'Dinheiro',
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'BANK_TRANSFER': 'Transferência Bancária',
      'OTHER': 'Outros',
      'A_PRAZO': 'A Prazo / Fiado',
    };
    return map[method] || method;
  };

  if (receivable) {
    totalPaid = receivable.paidAmount || 0;
    remainingAmount = receivable.remainingAmount ?? (order.totalPrice - totalPaid);

    // Adiciona o sinal/entrada se houver
    if (receivable.downPayment && receivable.downPayment > 0) {
      paymentsList.push({
        method: receivable.downPaymentMethod || 'PIX',
        amount: receivable.downPayment,
        date: order.createdAt,
        label: 'Entrada / Sinal',
      });
    }

    // Adiciona os outros pagamentos parciais
    if (receivable.payments && receivable.payments.length > 0) {
      receivable.payments.forEach((p, idx) => {
        const isDownPaymentDuplicated = idx === 0 && receivable.downPayment && Math.abs(p.amount - receivable.downPayment) < 0.01;
        if (!isDownPaymentDuplicated) {
          paymentsList.push({
            method: p.paymentMethod || 'PIX',
            amount: p.amount,
            date: p.date,
            label: `Pagamento Parcial #${idx + (receivable.downPayment ? 0 : 1)}`,
          });
        }
      });
    }
  } else {
    if (order.paymentStatus === 'PAGO') {
      totalPaid = order.totalPrice;
      remainingAmount = 0;
      paymentsList.push({
        method: order.paymentMethod || 'PIX',
        amount: order.totalPrice,
        date: order.deliveredAt || order.updatedAt || order.createdAt,
        label: 'Valor Integral',
      });
    } else {
      totalPaid = 0;
      remainingAmount = order.totalPrice;
    }
  }

  return (
    <div
      className={`mx-auto bg-white text-slate-950 select-text ${
        paperFormat === '58mm'
          ? 'w-[58mm] max-w-[58mm] p-2 text-[9px] leading-tight font-mono'
          : 'w-[80mm] max-w-[80mm] p-3 text-[10px] leading-tight font-sans'
      }`}
      style={{ color: '#000000' }}
    >
      {/* 1. BRAND / LOGO HEADER */}
      <div className="text-center">
        {company.logoUrl ? (
          <div className="flex justify-center mb-1.5">
            <img
              src={company.logoUrl}
              alt="Logo"
              className="max-h-14 max-w-[150px] object-contain"
            />
          </div>
        ) : (
          <div className="mb-1">
            <div className="font-black tracking-wide leading-tight text-base uppercase font-sans">
              {company.commercialName || company.name || 'TECHNOVA ASSISTÊNCIA TÉCNICA'}
            </div>
            {company.slogan && (
              <div className="text-[8px] tracking-wider uppercase text-center mt-0.5 font-bold text-slate-700">
                {company.slogan}
              </div>
            )}
          </div>
        )}

        {/* Company address and identification */}
        <div className="text-center text-[9.5px] leading-snug mt-1 text-slate-900">
          <div className="font-black uppercase">{company.commercialName || company.name || 'TECHNOVA ASSISTÊNCIA TÉCNICA'}</div>
          {company.ownerName && <div>{company.ownerName}</div>}
          <div>
            CNPJ: {company.cnpj || company.cnpjCpf || '12.345.678/0001-90'}
            {company.zipCode ? ` CEP: ${company.zipCode}` : ''}
            {company.address ? ` - ${company.address}` : ''}
            {company.neighborhood ? ` - ${company.neighborhood}` : ''}
            {company.city ? ` - ${company.city}` : ''}{company.state ? `/${company.state}` : ''}
          </div>
          <div>Fone: {company.phone || company.whatsapp || '(11) 98765-4321'}</div>
        </div>
      </div>

      {/* 2. ORDER NUMBER & TITLE */}
      <div className="text-center my-2.5">
        <div className="text-[11px] font-bold tracking-wide">
          {company.osReceiptTitle || 'Ordem Servico'}
        </div>
        <div className="text-2xl font-black my-0.5 tracking-wider font-mono">
          {order.orderNumber}
        </div>
        <div className="text-[10px] font-semibold text-slate-800">
          {subtitle || company.osReceiptSubtitle || 'Comprovante de Recebimento'}
        </div>
      </div>

      {/* 3. STATUS & DATES */}
      <div className="my-1.5 text-[9.5px] leading-tight">
        <div className="flex justify-between items-center py-0.5">
          <span className="font-bold">Status OS:</span>
          <span className="font-black uppercase">
            {order.status === 'CONCLUIDO'
              ? 'P.P/ENTREGA'
              : order.status === 'ORCAMENTO'
              ? 'ORÇAMENTO'
              : order.status === 'EM_ANDAMENTO'
              ? 'EM ANDAMENTO'
              : order.status}
          </span>
        </div>
        <div className="flex justify-between pt-1">
          <div>
            <span className="font-bold block">Data Entrada:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="text-right">
            <span className="font-bold block">Data Saida:</span>
            <span>
              {order.deliveredAt
                ? formatDate(order.deliveredAt)
                : order.estimatedCompletionDate
                ? formatDate(order.estimatedCompletionDate)
                : formatDate(order.updatedAt || order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMER INFORMATION */}
      <div className="text-left text-[9.5px] leading-tight space-y-0.5 my-2 pt-1 border-t border-slate-300">
        <div className="flex">
          <span className="w-16 shrink-0 font-medium">Cliente:</span>
          <span className="font-black uppercase truncate">{order.customerName}</span>
        </div>
        <div className="flex">
          <span className="w-16 shrink-0 font-medium">WhatsApp:</span>
          <span>{order.customerPhone || customer?.phone || ''}</span>
        </div>
        {company.osShowCustomerAddress !== false && (
          <>
            <div className="flex">
              <span className="w-16 shrink-0 font-medium">Endereco:</span>
              <span className="truncate">{customer?.address || ''}</span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 font-medium">CPF/CNPJ:</span>
              <span>{order.customerDocument || customer?.document || ''}</span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 font-medium">Bairro:</span>
              <span>{company.neighborhood || ''}</span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 font-medium">Compl.:</span>
              <span></span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 font-medium">Cidade:</span>
              <span>
                {customer?.city
                  ? `${customer.city}${customer.state ? `/${customer.state}` : ''}`
                  : `${company.city || 'IPAPORANGA'}/${company.state || 'CE'}`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 5. DEVICE INFORMATION */}
      <div className="text-left text-[9.5px] leading-tight space-y-0.5 my-2 pt-1 border-t border-slate-300">
        <div className="flex">
          <span className="w-24 shrink-0 font-medium">Produto:</span>
          <span className="font-bold uppercase">
            {order.brand ? `${order.brand} ${order.model}` : order.model || 'Equipamento'}
          </span>
        </div>
        {(order.imei || order.serialNumber) && (
          <div className="flex">
            <span className="w-24 shrink-0 font-medium">Nº Serie / Imei:</span>
            <span className="font-mono">{order.imei || order.serialNumber}</span>
          </div>
        )}
        <div className="flex">
          <span className="w-24 shrink-0 font-medium">Tp. Prod.:</span>
          <span>{order.deviceType || 'Celular'}</span>
        </div>
      </div>

      {/* 6. OBSERVAÇÕES DO ATENDIMENTO / APARELHO (ESPAÇO DEDICADO ÀS OBSERVAÇÕES DA OS) */}
      <div className="my-2 text-left text-[9.5px] pt-1 border-t border-slate-300">
        <span className="font-bold block mb-0.5">Observações:</span>
        <div
          className="px-2 py-1.5 min-h-[38px] text-[9.5px] leading-relaxed whitespace-pre-line"
          style={{ border: '1px solid #000000' }}
        >
          {([
            order.accessories ? `Acessórios: ${order.accessories}` : '',
            order.physicalCondition ? `Condição física: ${order.physicalCondition}` : '',
            order.customerNotes ? `Obs: ${order.customerNotes}` : '',
            order.internalNotes && order.internalNotes !== order.customerNotes ? `Nota Técnica: ${order.internalNotes}` : '',
          ].filter(Boolean).join('\n')) || 'Sem observações adicionais.'}
        </div>
      </div>

      {/* 7. PROBLEM & LAUDO TÉCNICO (CAIXAS RETANGULARES COM BORDA) */}
      <div className="my-2 text-left text-[9.5px] space-y-2">
        {company.osShowProblemBox !== false && (
          <div>
            <span className="font-bold block mb-0.5">Problema:</span>
            <div
              className="px-2 py-1 min-h-[22px] font-black uppercase text-[10px] tracking-wide"
              style={{ border: '1px solid #000000' }}
            >
              {order.clientDefect || 'NÃO ESPECIFICADO'}
            </div>
          </div>
        )}

        {company.osShowLaudoBox !== false && (
          <div>
            <span className="font-bold block mb-0.5">Laudo:</span>
            <div
              className="px-2 py-1 min-h-[22px] font-black uppercase text-[10px] tracking-wide"
              style={{ border: '1px solid #000000' }}
            >
              {order.technicalDiagnosis || order.performedService || 'EM ANÁLISE / REPARO'}
            </div>
          </div>
        )}
      </div>

      {/* 8. PARTS AND LABOR TABLE */}
      <div className="my-2.5 text-left text-[9.5px] leading-tight">
        <div className="font-bold mb-1">Peças Utilizadas / Mão de Obra:</div>
        <div className="text-[9px] font-bold pb-0.5">Código / Descrição Produto</div>
        <div className="grid grid-cols-5 text-[9px] font-bold pb-1 border-b border-slate-400">
          <span>Un.</span>
          <span className="text-center">Qtde</span>
          <span className="text-right">V. Unit</span>
          <span className="text-right">Desc</span>
          <span className="text-right">T. Líquido</span>
        </div>

        <div className="divide-y divide-slate-200 text-[9px]">
          {((order.items && order.items.length > 0) ? order.items : (order.parts || [])).length > 0 ? (
            ((order.items && order.items.length > 0) ? order.items : (order.parts || [])).map((p, idx) => (
              <div key={idx} className="py-1">
                <div className="font-mono text-[9px] truncate font-semibold">
                  {p.productId ? `${p.productId} - ` : ''}{p.productName || p.name}
                </div>
                <div className="grid grid-cols-5 pt-0.5">
                  <span>UN</span>
                  <span className="text-center">{p.quantity},00</span>
                  <span className="text-right">{formatCurrency(p.unitPrice)}</span>
                  <span className="text-right">{p.discount > 0 ? formatCurrency(p.discount) : 'R$ 0,00'}</span>
                  <span className="text-right font-bold">{formatCurrency(p.totalPrice || p.total)}</span>
                </div>
              </div>
            ))
          ) : null}

          {order.laborPrice > 0 &&
            !((order.items && order.items.length > 0) ? order.items : (order.parts || [])).some(
              (p) => p.type === 'SERVICO'
            ) && (
              <div className="py-1">
                <div className="font-mono text-[9px] truncate font-semibold">
                  SRV-001 MÃO DE OBRA / SERVIÇO TÉCNICO
                </div>
                <div className="grid grid-cols-5 pt-0.5">
                  <span>UN</span>
                  <span className="text-center">1,00</span>
                  <span className="text-right">{formatCurrency(order.laborPrice)}</span>
                  <span className="text-right">{order.discount > 0 ? formatCurrency(order.discount) : 'R$ 0,00'}</span>
                  <span className="text-right font-bold">{formatCurrency(order.laborPrice)}</span>
                </div>
              </div>
            )}

          {(!order.items || order.items.length === 0) &&
            (!order.parts || order.parts.length === 0) &&
            (!order.laborPrice || order.laborPrice === 0) && (
              <div className="py-1">
                <div className="font-mono text-[9px] truncate font-semibold">
                  SRV-GERAL {order.technicalDiagnosis || order.clientDefect || 'SERVIÇO TÉCNICO'}
                </div>
                <div className="grid grid-cols-5 pt-0.5">
                  <span>UN</span>
                  <span className="text-center">1,00</span>
                  <span className="text-right">{formatCurrency(order.totalPrice)}</span>
                  <span className="text-right">{order.discount > 0 ? formatCurrency(order.discount) : 'R$ 0,00'}</span>
                  <span className="text-right font-bold">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 9. FINANCIAL TOTALS IN RECTANGULAR BOXES */}
      <div className="my-3 flex flex-col items-center justify-center text-[9.5px] space-y-1.5 w-full">
        <div className="text-center w-full max-w-[170px]">
          <span className="font-bold block text-[9.5px] mb-0.5 text-center">Total Bruto:</span>
          <div
            className="px-3 py-1 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(totalGross)}
          </div>
        </div>
        <div className="text-center w-full max-w-[170px]">
          <span className="font-bold block text-[9.5px] mb-0.5 text-center">Desconto:</span>
          <div
            className="px-3 py-1 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(order.discount || 0)}
          </div>
        </div>
        <div className="text-center w-full max-w-[170px]">
          <span className="font-bold block text-[9.5px] mb-0.5 text-center">Total Líquido:</span>
          <div
            className="px-3 py-1 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(order.totalPrice)}
          </div>
        </div>
        <div className="text-center w-full max-w-[170px]">
          <span className="font-bold block text-[9.5px] mb-0.5 text-center">Total Pago:</span>
          <div
            className="px-3 py-1 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(totalPaid)}
          </div>
        </div>
        {remainingAmount > 0 && (
          <div className="text-center w-full max-w-[170px]">
            <span className="font-bold block text-[9.5px] mb-0.5 text-center text-rose-600">Restante a Pagar:</span>
            <div
              className="px-3 py-1 text-center font-black w-full text-rose-600"
              style={{ border: '1px solid #e11d48' }}
            >
              {formatCurrency(remainingAmount)}
            </div>
          </div>
        )}
      </div>

      {/* 10. PAYMENT METHODS */}
      <div className="my-3 text-[9.5px] space-y-1.5 text-left border-t border-dashed border-slate-300 pt-2">
        <div className="font-bold mb-1">Detalhamento dos Recebimentos:</div>
        {paymentsList.length > 0 ? (
          paymentsList.map((p, idx) => (
            <div key={idx} className="flex justify-between items-start pb-1 last:pb-0">
              <div>
                <span className="font-bold block">{p.label}:</span>
                <span className="text-[8px] text-slate-500 uppercase">{getPaymentMethodLabelLocal(p.method)}</span>
              </div>
              <div className="text-right font-black">
                {formatCurrency(p.amount)}
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-500 italic">Sem pagamentos registrados</span>
            <span className="font-black text-slate-500">{formatCurrency(0)}</span>
          </div>
        )}
      </div>

      {/* 11. WARRANTY & LEGAL FOOTER */}
      <div className="text-center text-[8.5px] leading-tight text-slate-800 pt-2 space-y-0.5">
        {(
          company.osFooterTerms ||
          'Garantia de 90 dias sobre serviços e peças\nGuarde essa OS ela é a sua garantia do serviço\nA Garantia não cobre mau uso'
        )
          .split('\n')
          .map((line, i) => (
            <div key={i}>{line}</div>
          ))}
      </div>
    </div>
  );
};
