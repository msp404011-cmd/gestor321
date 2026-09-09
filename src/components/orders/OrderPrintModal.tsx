import React, { useState } from 'react';
import { Printer, X, Wrench, FileText, CheckCircle2 } from 'lucide-react';
import { ServiceOrder } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../services/formatters';
import { PatternLock } from './PatternLock';
import { ThermalOrderReceipt } from './ThermalOrderReceipt';

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  mode?: 'entrance' | 'internal' | 'receipt';
}

export type PaperFormat = 'a4' | '80mm' | '58mm';

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  mode = 'receipt',
}) => {
  const company = StorageService.getCompanySettings();
  const [printType, setPrintType] = useState<'entrance' | 'internal' | 'receipt'>(mode);
  const [paperFormat, setPaperFormat] = useState<PaperFormat>(() => (company.osDefaultPaperFormat as PaperFormat) || '80mm');

  // Encontrar o contas a receber vinculado a esta ordem se houver
  const receivable = order ? StorageService.getReceivables().find(
    (r) => r.referenceId === order.id || r.referenceNumber === `OS #${order.orderNumber}`
  ) : null;

  let totalPaid = 0;
  let remainingAmount = order ? order.totalPrice : 0;
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

  if (order) {
    if (receivable) {
      totalPaid = receivable.paidAmount || 0;
      remainingAmount = receivable.remainingAmount ?? (order.totalPrice - totalPaid);

      if (receivable.downPayment && receivable.downPayment > 0) {
        paymentsList.push({
          method: receivable.downPaymentMethod || 'PIX',
          amount: receivable.downPayment,
          date: order.createdAt,
          label: 'Entrada / Sinal',
        });
      }

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
  }

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitleLabel = () => {
    if (printType === 'entrance') return 'Comprovante de Recebimento';
    if (printType === 'internal') return 'Via Técnica de Bancada';
    return company.osReceiptSubtitle || 'Comprovante de Recebimento';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      
      {/* Dynamic Print CSS Injection for Exact Paper Sizes */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-order-container, #printable-order-container * {
            visibility: visible;
          }
          #printable-order-container {
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperFormat === '58mm' ? '58mm' : paperFormat === '80mm' ? '80mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          @page {
            size: ${paperFormat === '58mm' ? '58mm auto' : paperFormat === '80mm' ? '80mm auto' : 'A4 portrait'};
            margin: ${paperFormat === 'a4' ? '10mm' : '0mm'};
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-100 border border-slate-700 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header Controls Bar (Hidden on print) */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-3 py-3 sm:px-5 sm:py-3.5 bg-slate-850 border-b border-slate-750 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="font-black text-white text-sm sm:text-base block leading-tight">
                  Opções de Impressão • OS #{order.orderNumber}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">
                  Selecione a via e o tamanho do papel
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* 1. Document Type */}
            <div className="flex items-center bg-slate-800 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-bold text-slate-300 border border-slate-700 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setPrintType('entrance')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'entrance' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setPrintType('internal')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'internal' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Via Bancada
              </button>
              <button
                type="button"
                onClick={() => setPrintType('receipt')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'receipt' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Recibo / Garantia
              </button>
            </div>

            {/* 2. Paper Format Selector (A4, 80mm, 58mm) */}
            <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-bold text-slate-300 border border-slate-800">
              <button
                type="button"
                onClick={() => setPaperFormat('a4')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  paperFormat === 'a4' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-800'
                }`}
                title="Impressora A4 Padrão"
              >
                📄 Folha A4
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('80mm')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  paperFormat === '80mm' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-800'
                }`}
                title="Impressora Térmica 80mm"
              >
                🧾 80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('58mm')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  paperFormat === '58mm' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-800'
                }`}
                title="Impressora Térmica 58mm / 50mm"
              >
                📱 58mm
              </button>
            </div>

            {/* Print & Close */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0 ml-auto sm:ml-0"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Stage */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 flex justify-center">
          
          <div
            id="printable-order-container"
            className={`transition-all duration-300 ${
              paperFormat === 'a4'
                ? 'bg-white text-slate-900 font-sans shadow-xl rounded-xl w-full max-w-[210mm] p-6 sm:p-8 text-xs'
                : 'w-fit mx-auto bg-white shadow-2xl rounded-sm p-0'
            }`}
          >

            {/* A4 FORMAT LAYOUT */}
            {paperFormat === 'a4' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {company.name}
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">{company.slogan}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        CNPJ: {company.cnpj} • Tel/WhatsApp: {company.phone}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {company.address} - {company.city}/{company.state}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-sm rounded">
                      OS Nº {order.orderNumber}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 mt-1">
                      Data: {formatDate(order.createdAt)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Previsão: {formatDate(order.estimatedCompletionDate)}
                    </p>
                    <p className="text-[11px] font-bold text-blue-700 mt-0.5 uppercase">
                      {getTitleLabel()}
                    </p>
                  </div>
                </div>

                {/* Customer & Device */}
                <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                      Dados do Cliente
                    </h3>
                    <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                    <p className="text-slate-600">WhatsApp: {order.customerPhone}</p>
                    {order.customerDocument && (
                      <p className="text-slate-600">CPF/CNPJ: {order.customerDocument}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                      Aparelho / Equipamento
                    </h3>
                    <p className="font-bold text-slate-900 text-sm">
                      {order.deviceType}: {order.brand} {order.model}
                    </p>
                    {order.imei && <p className="text-slate-600 font-mono">IMEI: {order.imei}</p>}
                    {order.serialNumber && (
                      <p className="text-slate-600 font-mono">Nº Série: {order.serialNumber}</p>
                    )}
                    {printType === 'internal' && (
                      <div className="mt-1.5">
                        {order.passwordPattern && order.passwordPattern.length > 0 ? (
                          <div className="border border-slate-300 rounded p-2 bg-slate-50 inline-flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-800 uppercase block mb-1">
                              Padrão de Desenho:
                            </span>
                            <PatternLock
                              value={order.passwordPattern}
                              readOnly={true}
                              size={85}
                              theme="light"
                            />
                            <span className="text-[10px] font-mono font-bold text-blue-700 mt-1">
                              Seq: {order.passwordPattern.join(' ➔ ')}
                            </span>
                          </div>
                        ) : order.passwordPin ? (
                          <p className="text-slate-900 font-bold bg-amber-100 px-2 py-1 rounded inline-block">
                            Senha / PIN: {order.passwordPin}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Defect & Physical Condition */}
                <div className="space-y-2">
                  <div className="border border-slate-200 rounded-lg p-2.5">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                      Defeito Reclamado pelo Cliente:
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">{order.clientDefect}</p>
                  </div>

                  {order.accessories && (
                    <div className="border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700">
                      <span className="font-bold">Acessórios Deixados: </span>
                      {order.accessories}
                    </div>
                  )}

                  {order.physicalState && (
                    <div className="border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700">
                      <span className="font-bold">Estado Físico / Avarias na Entrada: </span>
                      {order.physicalState}
                    </div>
                  )}

                  {order.technicalDiagnosis && printType !== 'entrance' && (
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-blue-50/40">
                      <span className="font-bold text-blue-900 text-[11px] uppercase tracking-wider block mb-0.5">
                        Diagnóstico / Serviço a Executar:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {order.technicalDiagnosis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items & Services Table */}
                {printType !== 'entrance' && (
                  <div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                      Serviços e Peças Aplicadas
                    </h3>
                    <table className="w-full border-collapse border border-slate-200 text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <th className="border border-slate-200 p-2">Descrição</th>
                          <th className="border border-slate-200 p-2 text-center w-16">Qtd</th>
                          <th className="border border-slate-200 p-2 text-right w-24">Unitário</th>
                          <th className="border border-slate-200 p-2 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.parts.map((p, i) => (
                          <tr key={i} className="border-b border-slate-200">
                            <td className="p-2 border border-slate-200">Peça: {p.productName}</td>
                            <td className="p-2 border border-slate-200 text-center">{p.quantity}</td>
                            <td className="p-2 border border-slate-200 text-right">
                              {formatCurrency(p.unitPrice)}
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {formatCurrency(p.totalPrice)}
                            </td>
                          </tr>
                        ))}
                        {order.laborPrice > 0 && (
                          <tr className="border-b border-slate-200">
                            <td className="p-2 border border-slate-200" colSpan={3}>
                              Mão de Obra Técnica Especializada
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {formatCurrency(order.laborPrice)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end gap-4 flex-wrap sm:flex-nowrap">
                  {/* Detalhamento dos recebimentos se houver */}
                  {printType !== 'entrance' && paymentsList.length > 0 && (
                    <div className="flex-1 min-w-[280px] border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-[11px] self-start">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 border-b border-slate-200 pb-1">
                        Detalhamento de Pagamentos
                      </h4>
                      <div className="space-y-1.5">
                        {paymentsList.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-700">
                            <div>
                              <span className="font-semibold">{p.label}</span>
                              <span className="text-[9px] text-slate-500 ml-1.5 font-bold uppercase">
                                ({getPaymentMethodLabelLocal(p.method)})
                              </span>
                            </div>
                            <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="w-64 border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1 self-start shrink-0">
                    <div className="flex justify-between text-slate-600">
                      <span>Peças:</span>
                      <span>{formatCurrency(order.partsPrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Mão de Obra:</span>
                      <span>{formatCurrency(order.laborPrice)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-1 flex justify-between font-black text-xs text-slate-900">
                      <span>VALOR TOTAL:</span>
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>
                    {printType !== 'entrance' && (
                      <>
                        <div className="flex justify-between text-emerald-700 font-bold text-xs pt-1 border-t border-slate-200">
                          <span>TOTAL PAGO:</span>
                          <span>{formatCurrency(totalPaid)}</span>
                        </div>
                        {remainingAmount > 0 && (
                          <div className="flex justify-between text-rose-600 font-bold text-xs">
                            <span>RESTANTE:</span>
                            <span>{formatCurrency(remainingAmount)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Footer & Disclaimer */}
                {company.receiptDisclaimer && (
                  <div className="pt-3 border-t border-slate-300">
                    <p className="text-[10px] text-slate-500 text-justify leading-tight">
                      {company.receiptDisclaimer}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 80mm & 58mm THERMAL RECEIPT LAYOUT (MATCHING PHOTO AND FULLY CONFIGURABLE) */}
            {(paperFormat === '80mm' || paperFormat === '58mm') && (
              <ThermalOrderReceipt
                order={order}
                company={company}
                paperFormat={paperFormat}
                subtitle={getTitleLabel()}
              />
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
