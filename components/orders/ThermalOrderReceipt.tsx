import React from 'react';
import { ServiceOrder, CompanySettings } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../services/formatters';

interface ThermalOrderReceiptProps {
  order: ServiceOrder;
  company: CompanySettings;
  paperFormat?: '80mm' | '58mm' | '50mm';
  subtitle?: string;
}

export const ThermalOrderReceipt: React.FC<ThermalOrderReceiptProps> = ({
  order,
  company,
  paperFormat = '80mm',
  subtitle,
}) => {
  if (!order) return null;

  const isMini = paperFormat === '50mm' || paperFormat === '58mm';

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
  let remainingAmount = Number(order.totalPrice) || 0;
  const paymentsList: Array<{ method: string; amount: number; date?: string; label: string }> = [];

  if (receivable) {
    totalPaid = Number(receivable.paidAmount) || 0;
    remainingAmount = receivable.remainingAmount ?? Math.max(0, (Number(order.totalPrice) || 0) - totalPaid);

    if (receivable.downPayment && receivable.downPayment > 0) {
      paymentsList.push({
        method: receivable.downPaymentMethod || 'PIX',
        amount: Number(receivable.downPayment),
        date: order.createdAt,
        label: 'Entrada / Sinal',
      });
    }

    if (receivable.payments && receivable.payments.length > 0) {
      receivable.payments.forEach((p, idx) => {
        const isDownPaymentDuplicated =
          idx === 0 && receivable.downPayment && Math.abs(Number(p.amount) - Number(receivable.downPayment)) < 0.01;
        if (!isDownPaymentDuplicated) {
          paymentsList.push({
            method: p.paymentMethod || 'PIX',
            amount: Number(p.amount),
            date: p.date,
            label: `Pagamento Parcial #${idx + (receivable.downPayment ? 1 : 1)}`,
          });
        }
      });
    }
  }

  // Se não houver pagamentos no contas a receber, verificar order.payments (múltiplas formas de pagamento no ato da entrega)
  if (paymentsList.length === 0 && order.payments && order.payments.length > 0) {
    const sumOrderPayments = order.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    totalPaid = sumOrderPayments;
    remainingAmount = Math.max(0, (Number(order.totalPrice) || 0) - totalPaid);
    order.payments.forEach((p, idx) => {
      if (Number(p.amount) > 0) {
        paymentsList.push({
          method: p.paymentMethod || order.paymentMethod || 'PIX',
          amount: Number(p.amount),
          date: p.date || order.deliveredAt || order.updatedAt || order.createdAt,
          label: order.payments!.length > 1 ? `Forma de Pagto #${idx + 1}` : 'Valor Integral',
        });
      }
    });
  }

  // Se ainda estiver vazio e a OS estiver como PAGO, gerar registro do pagamento integral
  if (paymentsList.length === 0 && order.paymentStatus === 'PAGO') {
    totalPaid = Number(order.totalPrice) || 0;
    remainingAmount = 0;
    paymentsList.push({
      method: order.paymentMethod || 'PIX',
      amount: totalPaid,
      date: order.deliveredAt || order.updatedAt || order.createdAt,
      label: 'Valor Integral',
    });
  }

  // Garantir que totalPaid bata com a soma dos pagamentos se paymentsList contiver itens
  if (paymentsList.length > 0) {
    const calculatedPaidSum = paymentsList.reduce((acc, p) => acc + p.amount, 0);
    if (calculatedPaidSum > totalPaid) {
      totalPaid = calculatedPaidSum;
      remainingAmount = Math.max(0, (Number(order.totalPrice) || 0) - totalPaid);
    }
  }

  return (
    <div
      className={`mx-auto bg-white text-black select-text ${
        isMini
          ? 'w-[50mm] max-w-[50mm] p-1.5 text-[8.5px] leading-tight font-sans'
          : 'w-[80mm] max-w-[80mm] p-3 text-[10px] leading-tight font-sans'
      }`}
      style={{ color: '#000000', wordBreak: 'break-word' }}
    >
      {/* 1. BRAND / LOGO HEADER */}
      <div className="text-center">
        {company.logoUrl ? (
          <div className="flex justify-center mb-1">
            <img
              src={company.logoUrl}
              alt="Logo"
              className={`${isMini ? 'max-h-10 max-w-[110px]' : 'max-h-14 max-w-[150px]'} object-contain`}
            />
          </div>
        ) : (
          <div className="mb-1">
            <div className={`font-black tracking-wide leading-tight ${isMini ? 'text-xs' : 'text-base'} uppercase font-sans`}>
              {company.commercialName || company.name || 'TECHNOVA ASSISTÊNCIA TÉCNICA'}
            </div>
            {company.slogan && (
              <div className="text-[7.5px] tracking-wider uppercase text-center mt-0.5 font-bold text-slate-700">
                {company.slogan}
              </div>
            )}
          </div>
        )}

        {/* Company address and identification */}
        <div className={`text-center ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-snug mt-1 text-slate-900`}>
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
      <div className="text-center my-2">
        <div className={`${isMini ? 'text-[9px]' : 'text-[11px]'} font-bold tracking-wide`}>
          {company.osReceiptTitle || 'Ordem Servico'}
        </div>
        <div className={`${isMini ? 'text-xl' : 'text-2xl'} font-black my-0.5 tracking-wider font-mono`}>
          {order.orderNumber}
        </div>
        <div className={`${isMini ? 'text-[8.5px]' : 'text-[10px]'} font-semibold text-slate-800`}>
          {subtitle || company.osReceiptSubtitle || 'Comprovante de Recebimento'}
        </div>
      </div>

      {/* 3. STATUS & DATES */}
      <div className={`my-1.5 ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-tight`}>
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
      <div className={`text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-tight space-y-0.5 my-1.5 pt-1 border-t border-slate-300`}>
        <div className="flex">
          <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>Cliente:</span>
          <span className="font-black uppercase truncate">{customer?.name || order.customerName}</span>
        </div>
        <div className="flex">
          <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>WhatsApp:</span>
          <span>{customer?.whatsapp || customer?.phone || order.customerWhatsapp || order.customerPhone || ''}</span>
        </div>
        {(customer?.whatsappAlt || customer?.alternativePhone) && (
          <div className="flex">
            <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>Recado:</span>
            <span>
              {customer.whatsappAlt || customer.alternativePhone}
              {customer.alternativeContactName ? ` (${customer.alternativeContactName})` : ''}
            </span>
          </div>
        )}
        {(customer?.document || order.customerDocument) && (
          <div className="flex">
            <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>CPF/CNPJ:</span>
            <span>{customer?.document || order.customerDocument}</span>
          </div>
        )}
        {company.osShowCustomerAddress !== false && customer?.address && (
          <>
            <div className="flex">
              <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>Endereço:</span>
              <span className="truncate">{customer.address}</span>
            </div>
            {customer.neighborhood && (
              <div className="flex">
                <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>Bairro:</span>
                <span>{customer.neighborhood}</span>
              </div>
            )}
            {(customer.city || customer.state) && (
              <div className="flex">
                <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-medium`}>Cidade/UF:</span>
                <span>
                  {customer.city || ''}
                  {customer.state ? `/${customer.state}` : ''}
                </span>
              </div>
            )}
          </>
        )}
        {order.pickupType === 'THIRD_PARTY' && order.authorizedPickupName && (
          <div className="flex font-bold text-black border-t border-slate-300 pt-0.5 mt-0.5">
            <span className={`${isMini ? 'w-12' : 'w-16'} shrink-0 font-bold`}>Retirada:</span>
            <span>
              {order.authorizedPickupName}
              {order.authorizedPickupPhone ? ` (${order.authorizedPickupPhone})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* 5. DEVICE INFORMATION */}
      <div className={`text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-tight space-y-0.5 my-1.5 pt-1 border-t border-slate-300`}>
        <div className="flex">
          <span className={`${isMini ? 'w-16' : 'w-24'} shrink-0 font-medium`}>Produto:</span>
          <span className="font-bold uppercase">
            {order.brand ? `${order.brand} ${order.model}` : order.model || 'Equipamento'}
          </span>
        </div>
        {(order.imei || order.serialNumber) && (
          <div className="flex">
            <span className={`${isMini ? 'w-16' : 'w-24'} shrink-0 font-medium`}>Nº Serie/Imei:</span>
            <span className="font-mono text-[8px]">{order.imei || order.serialNumber}</span>
          </div>
        )}
        <div className="flex">
          <span className={`${isMini ? 'w-16' : 'w-24'} shrink-0 font-medium`}>Tp. Prod.:</span>
          <span>{order.deviceType || 'Celular'}</span>
        </div>
        {(order.passwordPin || (order.passwordPattern && order.passwordPattern.length > 0)) && (
          <div className="flex">
            <span className={`${isMini ? 'w-16' : 'w-24'} shrink-0 font-bold`}>Senha / Desbl:</span>
            <span className="font-mono font-bold">
              {order.passwordPin ? `PIN: ${order.passwordPin}` : ''}
              {order.passwordPattern && order.passwordPattern.length > 0
                ? ` Desenho: ${order.passwordPattern.join(' ➔ ')}`
                : ''}
            </span>
          </div>
        )}
      </div>

      {/* 6. OBSERVAÇÕES DO ATENDIMENTO / APARELHO */}
      <div className={`my-1.5 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'} pt-1 border-t border-slate-300`}>
        <span className="font-bold block mb-0.5">Observações:</span>
        <div
          className={`px-1.5 py-1 min-h-[30px] ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-relaxed whitespace-pre-line`}
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

      {/* 7. PROBLEM & LAUDO TÉCNICO */}
      <div className={`my-1.5 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'} space-y-1.5`}>
        {company.osShowProblemBox !== false && (
          <div>
            <span className="font-bold block mb-0.5">Problema:</span>
            <div
              className={`px-1.5 py-0.5 min-h-[20px] font-black uppercase ${isMini ? 'text-[8.5px]' : 'text-[10px]'} tracking-wide`}
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
              className={`px-1.5 py-0.5 min-h-[20px] font-black uppercase ${isMini ? 'text-[8.5px]' : 'text-[10px]'} tracking-wide`}
              style={{ border: '1px solid #000000' }}
            >
              {order.technicalDiagnosis || order.performedService || 'EM ANÁLISE / REPARO'}
            </div>
          </div>
        )}
      </div>

      {/* 8. PARTS AND LABOR TABLE */}
      <div className={`my-2 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'} leading-tight`}>
        <div className="font-bold mb-1">Peças / Serviços:</div>

        {isMini ? (
          /* Mini (50mm/58mm) 2-line layout per item to prevent squeezing */
          <div className="divide-y divide-slate-300 border-t border-b border-slate-300 py-1 space-y-1">
            {((order.items && order.items.length > 0) ? order.items : (order.parts || [])).length > 0 ? (
              ((order.items && order.items.length > 0) ? order.items : (order.parts || [])).map((p, idx) => (
                <div key={idx} className="pt-1 first:pt-0">
                  <div className="font-semibold truncate">{p.productName || p.name}</div>
                  <div className="flex justify-between text-slate-800">
                    <span>{p.quantity}x {formatCurrency(p.unitPrice)}</span>
                    <span className="font-black">{formatCurrency(p.totalPrice || p.total)}</span>
                  </div>
                </div>
              ))
            ) : null}

            {order.laborPrice > 0 &&
              !((order.items && order.items.length > 0) ? order.items : (order.parts || [])).some(
                (p) => p.type === 'SERVICO'
              ) && (
                <div className="pt-1 first:pt-0">
                  <div className="font-semibold">SRV - MÃO DE OBRA TÉCNICA</div>
                  <div className="flex justify-between text-slate-800">
                    <span>1x {formatCurrency(order.laborPrice)}</span>
                    <span className="font-black">{formatCurrency(order.laborPrice)}</span>
                  </div>
                </div>
              )}

            {(!order.items || order.items.length === 0) &&
              (!order.parts || order.parts.length === 0) &&
              (!order.laborPrice || order.laborPrice === 0) && (
                <div className="pt-1 first:pt-0">
                  <div className="font-semibold">{order.technicalDiagnosis || order.clientDefect || 'SERVIÇO TÉCNICO'}</div>
                  <div className="flex justify-between text-slate-800">
                    <span>1x {formatCurrency(order.totalPrice)}</span>
                    <span className="font-black">{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* 80mm Full 5-column table */
          <>
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
          </>
        )}
      </div>

      {/* 9. FINANCIAL TOTALS IN RECTANGULAR BOXES */}
      <div className={`my-2 flex flex-col items-center justify-center ${isMini ? 'text-[8px] space-y-1' : 'text-[9.5px] space-y-1.5'} w-full`}>
        <div className={`text-center w-full ${isMini ? 'max-w-[125px]' : 'max-w-[170px]'}`}>
          <span className="font-bold block mb-0.5 text-center">Total Bruto:</span>
          <div
            className="px-2 py-0.5 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(totalGross)}
          </div>
        </div>
        {order.discount > 0 && (
          <div className={`text-center w-full ${isMini ? 'max-w-[125px]' : 'max-w-[170px]'}`}>
            <span className="font-bold block mb-0.5 text-center">Desconto:</span>
            <div
              className="px-2 py-0.5 text-center font-black w-full"
              style={{ border: '1px solid #000000' }}
            >
              {formatCurrency(order.discount || 0)}
            </div>
          </div>
        )}
        <div className={`text-center w-full ${isMini ? 'max-w-[125px]' : 'max-w-[170px]'}`}>
          <span className="font-bold block mb-0.5 text-center">Total Líquido:</span>
          <div
            className="px-2 py-0.5 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(order.totalPrice)}
          </div>
        </div>
        <div className={`text-center w-full ${isMini ? 'max-w-[125px]' : 'max-w-[170px]'}`}>
          <span className="font-bold block mb-0.5 text-center">Total Pago:</span>
          <div
            className="px-2 py-0.5 text-center font-black w-full"
            style={{ border: '1px solid #000000' }}
          >
            {formatCurrency(totalPaid)}
          </div>
        </div>
        {remainingAmount > 0 && (
          <div className={`text-center w-full ${isMini ? 'max-w-[125px]' : 'max-w-[170px]'}`}>
            <span className="font-bold block mb-0.5 text-center text-rose-600">Restante a Pagar:</span>
            <div
              className="px-2 py-0.5 text-center font-black w-full text-rose-600"
              style={{ border: '1px solid #e11d48' }}
            >
              {formatCurrency(remainingAmount)}
            </div>
          </div>
        )}
      </div>

      {/* 10. PAYMENT METHODS */}
      <div className={`my-2 ${isMini ? 'text-[8px]' : 'text-[9.5px]'} space-y-1 text-left border-t border-dashed border-slate-300 pt-1.5`}>
        <div className="font-bold mb-0.5">Detalhamento dos Recebimentos:</div>
        {paymentsList.length > 0 ? (
          paymentsList.map((p, idx) => (
            <div key={idx} className="flex justify-between items-start pb-0.5 last:pb-0">
              <div>
                <span className="font-bold block">{p.label}:</span>
                <span className={`${isMini ? 'text-[7.5px]' : 'text-[8px]'} text-slate-700 font-bold uppercase`}>
                  {getPaymentMethodLabel(p.method)}{p.date ? ` (${formatDate(p.date)})` : ''}
                </span>
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
      <div className={`text-center ${isMini ? 'text-[7.5px]' : 'text-[8.5px]'} leading-tight text-slate-800 pt-1.5 space-y-0.5`}>
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
