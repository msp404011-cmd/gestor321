import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, Wrench, FileText, CheckCircle2, Save, Send, Smartphone, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { ServiceOrder, EulisDispatchInfo } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../services/formatters';
import { PatternLock } from './PatternLock';
import { ThermalOrderReceipt } from './ThermalOrderReceipt';
import { ThermalEulisReceipt } from './ThermalEulisReceipt';

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  mode?: 'entrance' | 'internal' | 'receipt' | 'eulis';
}

export type PaperFormat = 'a4' | '80mm' | '58mm' | '50mm';

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  mode = 'receipt',
}) => {
  const company = StorageService.getCompanySettings();

  const isEulisStatus = (st?: string) => {
    if (!st) return false;
    const upper = st.toUpperCase();
    return upper.includes('EULIS') || upper.includes('EUKLIS');
  };

  const [printType, setPrintType] = useState<'entrance' | 'internal' | 'receipt' | 'eulis'>(() => {
    if (mode === 'eulis' || isEulisStatus(order?.status)) return 'eulis';
    return mode;
  });

  const [paperFormat, setPaperFormat] = useState<PaperFormat>(() => {
    const defaultFormat = company.osDefaultPaperFormat as PaperFormat;
    if (defaultFormat === '50mm' || defaultFormat === '58mm') return '50mm';
    if (defaultFormat === '80mm') return '80mm';
    if (defaultFormat === 'a4') return 'a4';
    return '80mm';
  });

  const [isSavedInOrder, setIsSavedInOrder] = useState(false);

  // Initialize Eulis dispatch info
  const initialDispatch = useMemo((): EulisDispatchInfo => {
    const d = order?.eulisDispatchInfo;
    const accText = (order?.accessories || '').toLowerCase();
    const ca = order?.checklistAccessories || {};

    return {
      hasChipTray: d?.hasChipTray ?? (accText.includes('gaveta') || accText.includes('gav.') || accText.includes('gaveta de chip')),
      chip1: d?.chip1 ?? (Boolean(ca.chip1?.present) || accText.includes('chip 1') || accText.includes('c/ chip') || accText.includes('com chip')),
      chip2: d?.chip2 ?? (Boolean(ca.chip2?.present) || accText.includes('chip 2')),
      memoryCard: d?.memoryCard ?? (Boolean(ca.memoryCard?.present) || accText.includes('cartão') || accText.includes('cartao') || accText.includes('sd')),
      caseCover: d?.caseCover ?? (Boolean(ca.caseCover?.present) || accText.includes('capa')),
      screenFilm: d?.screenFilm ?? (accText.includes('película') || accText.includes('pelicula')),
      charger: d?.charger ?? (Boolean(ca.charger?.present) || accText.includes('carregador')),
      battery: d?.battery ?? (accText.includes('bateria')),
      accessoriesNotes: d?.accessoriesNotes ?? (order?.accessories || ''),
      assemblyState: d?.assemblyState || 'COMPLETO',
      assemblyStateDescription: d?.assemblyStateDescription || (order?.physicalState || order?.physicalCondition || ''),
      dispatchNotes: d?.dispatchNotes ?? '',
      dispatchedAt: d?.dispatchedAt || new Date().toISOString(),
      dispatchedBy: d?.dispatchedBy || order?.technicianName || 'Balcão',
    };
  }, [order?.id, order?.eulisDispatchInfo, order?.accessories, order?.physicalState, order?.physicalCondition, order?.technicianName]);

  const [dispatchInfo, setDispatchInfo] = useState<EulisDispatchInfo>(initialDispatch);

  useEffect(() => {
    if (isOpen) {
      if (mode) {
        setPrintType(mode);
      } else if (isEulisStatus(order?.status)) {
        setPrintType('eulis');
      }
    }
  }, [isOpen, mode, order?.status]);

  useEffect(() => {
    if (isOpen) {
      setDispatchInfo(initialDispatch);
      setIsSavedInOrder(false);
    }
  }, [isOpen, initialDispatch]);

  if (!isOpen || !order) return null;

  // Recuperar dados mais recentes do cliente
  const customer = order.customerId
    ? StorageService.getCustomers().find((c) => c.id === order.customerId) || null
    : null;

  const customerName = customer?.name || order.customerName || '';
  const customerPhone = customer?.whatsapp || customer?.phone || order.customerWhatsapp || order.customerPhone || '';
  const customerAltPhone = customer?.whatsappAlt || customer?.alternativePhone;
  const customerAltContact = customer?.alternativeContactName;
  const customerDocument = customer?.document || order.customerDocument || '';
  const customerAddress = customer?.address
    ? [
        customer.address,
        customer.neighborhood,
        customer.city && customer.state
          ? `${customer.city}/${customer.state}`
          : customer.city || customer.state || '',
        customer.zipCode ? `CEP: ${customer.zipCode}` : '',
      ]
        .filter(Boolean)
        .join(' - ')
    : '';

  // Encontrar o contas a receber vinculado a esta ordem se houver
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

  if (paymentsList.length > 0) {
    const calculatedPaidSum = paymentsList.reduce((acc, p) => acc + p.amount, 0);
    if (calculatedPaidSum > totalPaid) {
      totalPaid = calculatedPaidSum;
      remainingAmount = Math.max(0, (Number(order.totalPrice) || 0) - totalPaid);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleSaveDispatchInfoToOrder = () => {
    if (!order) return;
    const updatedOrder: ServiceOrder = {
      ...order,
      eulisDispatchInfo: {
        ...dispatchInfo,
        dispatchedAt: dispatchInfo.dispatchedAt || new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveOrder(updatedOrder);
    setIsSavedInOrder(true);
    setTimeout(() => setIsSavedInOrder(false), 3000);
  };

  const getTitleLabel = () => {
    if (printType === 'eulis') return 'Guia de Remessa Técnica • C/ Euklis';
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
            width: ${paperFormat === '50mm' || paperFormat === '58mm' ? '50mm' : paperFormat === '80mm' ? '80mm' : '100%'} !important;
            max-width: ${paperFormat === '50mm' || paperFormat === '58mm' ? '50mm' : paperFormat === '80mm' ? '80mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          @page {
            size: ${paperFormat === '50mm' || paperFormat === '58mm' ? '50mm auto' : paperFormat === '80mm' ? '80mm auto' : 'A4 portrait'};
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
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="font-black text-white text-sm sm:text-base block leading-tight">
                  Opções de Impressão • OS #{order.orderNumber}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">
                  {printType === 'eulis' ? 'Via Exclusiva de Envio para C/ Euklis' : 'Selecione a via e o tamanho do papel'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'entrance' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setPrintType('internal')}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'internal' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Via Bancada
              </button>
              <button
                type="button"
                onClick={() => setPrintType('receipt')}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  printType === 'receipt' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-700'
                }`}
              >
                Recibo / Garantia
              </button>
              <button
                type="button"
                onClick={() => setPrintType('eulis')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  printType === 'eulis'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-indigo-400 hover:text-white hover:bg-indigo-500/20'
                }`}
              >
                <Send className="w-3 h-3" />
                <span>Via C/ Euklis</span>
              </button>
            </div>

            {/* 2. Paper Format Selector (A4, 80mm, 50mm) */}
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
                onClick={() => setPaperFormat('50mm')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  paperFormat === '50mm' || paperFormat === '58mm'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
                title="Impressora Térmica 50mm / 58mm"
              >
                📱 50mm
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

        {/* EXCLUSIVE C/ EUKLIS CONFIGURATION PANEL (Interactive checklist & state editor) */}
        {printType === 'eulis' && (
          <div className="no-print bg-indigo-950/60 border-b border-indigo-500/30 px-4 py-3 sm:px-6 text-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-indigo-500/20">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-black text-[10px] uppercase tracking-wider">
                  Configuração Exclusiva C/ Euklis
                </span>
                <span className="text-xs text-slate-300">
                  Marque o que está sendo enviado e o estado do aparelho antes de imprimir:
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveDispatchInfoToOrder}
                className="self-start md:self-auto px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {isSavedInOrder ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Salvo na OS!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Dados na OS</span>
                  </>
                )}
              </button>
            </div>

            {/* Checkbox Chips for Accessories */}
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-indigo-300 uppercase block mb-1">
                Itens enviados junto (Clique para marcar/desmarcar):
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                {[
                  { key: 'hasChipTray', label: 'Gaveta de Chip' },
                  { key: 'chip1', label: 'Chip 1' },
                  { key: 'chip2', label: 'Chip 2' },
                  { key: 'memoryCard', label: 'Cartão de Memória' },
                  { key: 'caseCover', label: 'Capa' },
                  { key: 'screenFilm', label: 'Película' },
                  { key: 'charger', label: 'Carregador/Cabo' },
                  { key: 'battery', label: 'Bateria' },
                ].map((item) => {
                  const isChecked = Boolean((dispatchInfo as any)[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setDispatchInfo((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof EulisDispatchInfo],
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assembly State & Description Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-2.5 border-t border-indigo-500/20 items-start">
              <div>
                <label className="text-[11px] font-bold text-indigo-300 uppercase block mb-1">
                  Estado do Aparelho no Envio:
                </label>
                <div className="flex flex-col gap-1 text-xs">
                  {[
                    { id: 'COMPLETO', label: 'Aparelho Completo (Montado)' },
                    { id: 'DESMONTADO', label: 'Aparelho Desmontado (Aberto)' },
                    { id: 'SO_PARTE', label: 'Só uma Parte (Placa / Tela / etc.)' },
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                        dispatchInfo.assemblyState === st.id
                          ? 'bg-indigo-600/40 text-white font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="assemblyStateRadio"
                        value={st.id}
                        checked={dispatchInfo.assemblyState === st.id}
                        onChange={() => setDispatchInfo((prev) => ({ ...prev, assemblyState: st.id }))}
                        className="text-indigo-600"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-indigo-300 uppercase block mb-1">
                    Espaço para Descrever o Estado / Partes Enviadas:
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchInfo.assemblyStateDescription}
                    onChange={(e) =>
                      setDispatchInfo((prev) => ({ ...prev, assemblyStateDescription: e.target.value }))
                    }
                    placeholder="Ex: Aparelho desmontado, placa com tela no chassi, parafusos em saco plástico, tampa traseira separada..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-indigo-300 uppercase block mb-1">
                    Observação Exclusiva C/ Euklis (Fica apenas na nota dele abaixo do estado):
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchInfo.dispatchNotes || ''}
                    onChange={(e) =>
                      setDispatchInfo((prev) => ({ ...prev, dispatchNotes: e.target.value }))
                    }
                    placeholder="Ex: Prioridade alta, cliente tem urgência, testar consumo na fonte após trocar CI de carga, guardar parafusos..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
              <>
                {/* 1. SE VIA C/ EUKLIS (LAYOUT EXCLUSIVO) */}
                {printType === 'eulis' ? (
                  <div className="space-y-4 text-slate-900">
                    {/* Cabeçalho da Empresa (Igual à outra) */}
                    <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt="Logo"
                            className="max-h-16 max-w-[170px] object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-950 text-white flex items-center justify-center font-bold shrink-0">
                            <Wrench className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            {company.commercialName || company.name}
                          </h1>
                          <p className="text-xs text-slate-600 font-medium">{company.slogan}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            CNPJ: {company.cnpj || company.cnpjCpf} • Tel/WhatsApp: {company.phone || company.whatsapp}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {company.address} - {company.city}/{company.state}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-indigo-950 text-white font-black text-sm rounded tracking-wider font-mono">
                          OS Nº {order.orderNumber}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1">
                          Entrada: {formatDate(order.createdAt)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Envio p/ Euklis: {formatDate(new Date().toISOString())}
                        </p>
                        <div className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 font-black text-[10px] rounded mt-1 uppercase">
                          GUIA DE REMESSA • VIA C/ EUKLIS
                        </div>
                      </div>
                    </div>

                    {/* Cliente (Apenas o nome do cliente) */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                        Identificação do Cliente
                      </h3>
                      <div>
                        <span className="text-slate-500 text-xs mr-2">Nome:</span>
                        <span className="font-black text-slate-900 text-sm uppercase">{customerName}</span>
                      </div>
                    </div>

                    {/* Dados do Aparelho & Desbloqueio */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                        Equipamento / Aparelho
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Modelo:</span>
                          <span className="font-black text-slate-900 text-sm uppercase">
                            {order.brand ? `${order.brand} ${order.model}` : order.model}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Tipo / Cor:</span>
                          <span className="font-bold text-slate-800">
                            {order.deviceType} {order.physicalCondition ? `• ${order.physicalCondition}` : ''}
                          </span>
                        </div>
                        {(order.imei || order.serialNumber) && (
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">IMEI / Nº Série:</span>
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {order.imei || order.serialNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Senha ou Padrão de Desenho */}
                      {(order.passwordPin || (order.passwordPattern && order.passwordPattern.length > 0)) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-4">
                          <span className="text-xs font-bold text-slate-700 uppercase">Senha de Acesso:</span>
                          {order.passwordPin && (
                            <span className="font-mono font-black text-xs bg-amber-100 px-2.5 py-1 rounded border border-amber-300">
                              PIN: {order.passwordPin}
                            </span>
                          )}
                          {order.passwordPattern && order.passwordPattern.length > 0 && (
                            <div className="flex items-center gap-3">
                              <PatternLock
                                value={order.passwordPattern}
                                readOnly={true}
                                size={70}
                                theme="light"
                              />
                              <span className="font-mono font-bold text-indigo-700 text-xs">
                                Seq: {order.passwordPattern.join(' ➔ ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* O Que Está Sendo Enviado (Gaveta, Chip, Cartão, etc.) */}
                    <div className="border border-slate-300 rounded-lg p-3">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                        <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">
                          O que está sendo enviado (Checklist de Acessórios & Itens)
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold">Conferência no Envio</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs py-1">
                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.hasChipTray ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.hasChipTray ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Gaveta de Chip
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.chip1 ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.chip1 ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Chip 1 (SIM)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.chip2 ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.chip2 ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Chip 2 (SIM)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.memoryCard ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.memoryCard ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Cartão de Memória
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.caseCover ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.caseCover ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Capa de Proteção
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.screenFilm ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.screenFilm ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Película na Tela
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.charger ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.charger ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Carregador / Cabo
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded bg-slate-50">
                          <span className="font-mono font-black text-sm">
                            {dispatchInfo.battery ? '[X]' : '[  ]'}
                          </span>
                          <span className={dispatchInfo.battery ? 'font-black text-slate-900' : 'text-slate-500'}>
                            Bateria
                          </span>
                        </div>
                      </div>

                      {dispatchInfo.accessoriesNotes && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Outros Itens / Acessórios Deixados: </span>
                          <span>{dispatchInfo.accessoriesNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Defeito Abaixo (Destacado) */}
                    <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50">
                      <span className="font-black text-slate-900 text-xs uppercase tracking-wider block mb-1">
                        Defeito Reclamado pelo Cliente / Problema a Resolver:
                      </span>
                      <p className="text-slate-950 font-bold text-sm leading-relaxed whitespace-pre-line">
                        {order.clientDefect || 'Defeito não informado.'}
                      </p>
                    </div>

                    {/* Estado do Aparelho (Completo, Desmontado, Só uma Parte) + Espaço para Descrever */}
                    <div className="border border-slate-400 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                        <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                          Estado do Aparelho no Envio
                        </span>
                        <span className="text-[10px] font-bold text-indigo-900 uppercase">
                          Exclusivo Via C/ Euklis
                        </span>
                      </div>

                      {/* Opções de estado */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <div
                          className={`p-2 border rounded flex items-center gap-2 ${
                            dispatchInfo.assemblyState === 'COMPLETO'
                              ? 'border-slate-900 bg-slate-100 font-black'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono text-sm font-bold">
                            {dispatchInfo.assemblyState === 'COMPLETO' ? '[X]' : '[  ]'}
                          </span>
                          <span className="text-xs">Aparelho Completo (Montado)</span>
                        </div>

                        <div
                          className={`p-2 border rounded flex items-center gap-2 ${
                            dispatchInfo.assemblyState === 'DESMONTADO'
                              ? 'border-slate-900 bg-slate-100 font-black'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono text-sm font-bold">
                            {dispatchInfo.assemblyState === 'DESMONTADO' ? '[X]' : '[  ]'}
                          </span>
                          <span className="text-xs">Aparelho Desmontado (Aberto)</span>
                        </div>

                        <div
                          className={`p-2 border rounded flex items-center gap-2 ${
                            dispatchInfo.assemblyState === 'SO_PARTE'
                              ? 'border-slate-900 bg-slate-100 font-black'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono text-sm font-bold">
                            {dispatchInfo.assemblyState === 'SO_PARTE' ? '[X]' : '[  ]'}
                          </span>
                          <span className="text-xs">Só uma Parte / Placa / Chassi</span>
                        </div>
                      </div>

                      {/* Espaço para descrever o estado / partes enviadas */}
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block mb-1">
                        Descrição do Estado / Partes Enviadas:
                      </span>
                      <div className="border border-slate-300 rounded p-2.5 min-h-[45px] bg-slate-50 text-xs text-slate-900 leading-relaxed whitespace-pre-line">
                        {dispatchInfo.assemblyStateDescription?.trim() ||
                          'Nenhuma avaria ou ressalva específica registrada. Aparelho encaminhado para bancada terceirizada.'}
                      </div>

                      {/* Observações adicionais exclusivas para C/ Euklis */}
                      {dispatchInfo.dispatchNotes && dispatchInfo.dispatchNotes.trim() && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200">
                          <span className="font-black text-indigo-950 text-xs uppercase tracking-wider block mb-1">
                            Observações / Recados para C/ Euklis:
                          </span>
                          <div className="border border-indigo-200 rounded p-2.5 bg-indigo-50/50 text-xs text-slate-900 leading-relaxed whitespace-pre-line font-medium">
                            {dispatchInfo.dispatchNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Protocolo de Envio e Assinaturas */}
                    <div className="pt-4 border-t-2 border-slate-900">
                      <div className="grid grid-cols-2 gap-8 text-center text-xs">
                        <div>
                          <div className="border-b border-slate-900 mb-1.5 w-4/5 mx-auto" />
                          <span className="font-bold uppercase block text-slate-900">Responsável pelo Envio (Loja)</span>
                          <span className="text-[10px] text-slate-500">Nome e Assinatura</span>
                        </div>
                        <div>
                          <div className="border-b border-slate-900 mb-1.5 w-4/5 mx-auto" />
                          <span className="font-bold uppercase block text-slate-900">Recebido por (C/ Euklis)</span>
                          <span className="text-[10px] text-slate-500">Assinatura / Data e Hora</span>
                        </div>
                      </div>

                      <div className="text-center text-[10px] text-slate-500 mt-4 font-mono">
                        Documento interno de controle de remessa técnica • Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. VIAS PADRÃO (ENTRADA / VIA BANCADA / RECIBO GARANTIA) */
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt="Logo"
                            className="max-h-16 max-w-[170px] object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                            <Wrench className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            {company.commercialName || company.name}
                          </h1>
                          <p className="text-xs text-slate-600 font-medium">{company.slogan}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            CNPJ: {company.cnpj || company.cnpjCpf} • Tel/WhatsApp: {company.phone || company.whatsapp}
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
                        <p className="font-bold text-slate-900 text-sm">{customerName}</p>
                        {customerPhone && <p className="text-slate-600">WhatsApp: {customerPhone}</p>}
                        {customerAltPhone && (
                          <p className="text-slate-600">
                            WhatsApp Recado: {customerAltPhone} {customerAltContact ? `(${customerAltContact})` : ''}
                          </p>
                        )}
                        {customerDocument && (
                          <p className="text-slate-600">CPF/CNPJ: {customerDocument}</p>
                        )}
                        {customerAddress && (
                          <p className="text-slate-600 text-[11px] leading-tight mt-0.5">Endereço: {customerAddress}</p>
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
                            {order.parts && order.parts.map((p, i) => (
                              <tr key={i} className="border-b border-slate-200">
                                <td className="p-2 border border-slate-200">Peça: {p.productName || p.name}</td>
                                <td className="p-2 border border-slate-200 text-center">{p.quantity}</td>
                                <td className="p-2 border border-slate-200 text-right">
                                  {formatCurrency(p.unitPrice)}
                                </td>
                                <td className="p-2 border border-slate-200 text-right font-medium">
                                  {formatCurrency(p.totalPrice || p.total)}
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
                                  <span className="text-[9px] text-slate-600 ml-1.5 font-bold uppercase">
                                    ({getPaymentMethodLabel(p.method)})
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
              </>
            )}

            {/* THERMAL RECEIPT LAYOUT (80mm & 58mm / 50mm) */}
            {paperFormat !== 'a4' && (
              <>
                {printType === 'eulis' ? (
                  <ThermalEulisReceipt
                    order={order}
                    company={company}
                    dispatchInfo={dispatchInfo}
                    paperFormat={paperFormat}
                  />
                ) : (
                  <ThermalOrderReceipt
                    order={order}
                    company={company}
                    paperFormat={paperFormat}
                    subtitle={getTitleLabel()}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
