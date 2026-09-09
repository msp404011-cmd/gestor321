import React, { useState } from 'react';
import { Printer, X, ShoppingCart, CheckCircle2, MessageCircle, FileText } from 'lucide-react';
import { Sale } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate, cleanPhoneForWhatsApp } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

export type PrintPaperFormat = '80mm' | '50mm' | 'A4';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  initialFormat?: PrintPaperFormat;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  initialFormat = '80mm',
}) => {
  const { isDark } = useTheme();
  const company = StorageService.getCompanySettings();
  const [paperFormat, setPaperFormat] = useState<PrintPaperFormat>(initialFormat);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    let text = `*COMPROVANTE DE VENDA - ${company.name.toUpperCase()}*\n`;
    text += `*Venda:* #${sale.saleNumber}\n`;
    text += `*Data:* ${formatDate(sale.date)}\n`;
    text += `*Cliente:* ${sale.customerName}\n`;
    text += `*Vendedor:* ${sale.sellerName}\n`;
    text += `--------------------------------\n`;
    text += `*ITENS:*\n`;
    sale.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.productName} (${it.quantity}x ${formatCurrency(it.unitPrice)}) = ${formatCurrency(it.total)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*Subtotal:* ${formatCurrency(sale.subtotal)}\n`;
    if (sale.discount > 0) {
      text += `*Desconto:* -${formatCurrency(sale.discount)}\n`;
    }
    text += `*TOTAL:* ${formatCurrency(sale.total)}\n`;
    text += `*Forma de Pagamento:* ${sale.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `Agradecemos a preferência!\n`;
    text += `${company.phone ? 'Contato: ' + company.phone : ''}`;

    const customers = StorageService.getCustomers();
    const customer = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
    const cleanPhone = cleanPhoneForWhatsApp(customer?.phone);

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, 'whatsapp_window');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className={`w-full ${
          paperFormat === 'A4' ? 'max-w-2xl' : paperFormat === '50mm' ? 'max-w-xs' : 'max-w-md'
        } rounded-2xl border-2 overflow-hidden flex flex-col max-h-[94vh] cursor-default transition-all duration-200 ${
          isDark
            ? 'bg-[#0c1626] border-slate-700/80 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
            : 'bg-white border-slate-200 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls Bar */}
        <div className={`no-print flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-b-2 gap-3 shrink-0 ${
          isDark ? 'bg-[#070e1d] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Comprovante de Venda
            </span>
          </div>

          {/* Paper Format Selector Buttons (80mm, 50mm, A4) */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setPaperFormat('80mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperFormat === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              80mm (Padrão)
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('50mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperFormat === '50mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              50mm (Mini)
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('A4')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperFormat === 'A4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A4 (Folha)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              title="Enviar comprovante para WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className={`overflow-y-auto flex-1 font-mono text-slate-900 bg-white printable-content ${
          paperFormat === '50mm' ? 'p-3 text-[10px]' : paperFormat === 'A4' ? 'p-8 text-xs' : 'p-6 text-xs'
        }`}>
          {paperFormat === 'A4' ? (
            /* A4 Full Page Format */
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{company.name}</h1>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">{company.slogan}</p>
                  <p className="text-xs text-slate-600 mt-1">CNPJ: {company.cnpj} | WhatsApp: {company.phone}</p>
                  <p className="text-xs text-slate-600">{company.address} - {company.city}/{company.state}</p>
                </div>
                <div className="text-right">
                  <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Comprovante de Venda</p>
                    <p className="text-lg font-black text-slate-900">#{sale.saleNumber}</p>
                    <p className="text-xs text-slate-600">{formatDate(sale.date)}</p>
                  </div>
                </div>
              </div>

              {/* Customer & Seller Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente:</span>
                  <p className="font-bold text-slate-900">{sale.customerName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Atendente / Vendedor:</span>
                  <p className="font-bold text-slate-900">{sale.sellerName}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[11px] uppercase text-slate-600">
                      <th className="py-2">Item / Descrição</th>
                      <th className="py-2 text-center w-16">Qtd</th>
                      <th className="py-2 text-right w-24">V. Unitário</th>
                      <th className="py-2 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {sale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-medium">{item.productName}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right font-bold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t-2 border-slate-300">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Desconto:</span>
                      <span>- {formatCurrency(sale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 text-slate-700">
                    <span>Forma de Pagamento:</span>
                    <span className="font-bold">{sale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="pt-8 text-center text-xs text-slate-500 border-t border-dashed border-slate-300 space-y-1 font-sans">
                <p className="font-bold">Obrigado pela preferência!</p>
                <p>Guarde este documento para comprovação e garantia de peças e acessórios.</p>
                <p className="text-[10px] text-slate-400">Documento Não Fiscal emitido em {formatDate(sale.date)}</p>
              </div>
            </div>
          ) : (
            /* Thermal Roll (80mm or 50mm) */
            <div>
              <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
                <h2 className={`${paperFormat === '50mm' ? 'text-xs' : 'text-sm'} font-black tracking-tight uppercase`}>
                  {company.name}
                </h2>
                <p className="text-[9px] text-slate-600">{company.slogan}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">CNPJ: {company.cnpj}</p>
                <p className="text-[9px] text-slate-500">
                  {company.address} - {company.city}/{company.state}
                </p>
                <p className="text-[9px] text-slate-500">Whats: {company.phone}</p>
              </div>

              {/* Sale details */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>VENDA Nº:</span>
                  <span className="font-bold">#{sale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATA:</span>
                  <span>{formatDate(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-bold truncate max-w-[140px]">{sale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>VENDEDOR:</span>
                  <span>{sale.sellerName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[9px] uppercase text-slate-500 pb-1">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>

                <div className="space-y-1.5 mt-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx}>
                      <p className="font-bold leading-tight truncate">{item.productName}</p>
                      <div className="flex justify-between text-slate-600">
                        <span>
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>DESCONTO:</span>
                    <span>- {formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-1 border-t border-slate-200 text-xs">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>PGTO:</span>
                  <span className="font-bold">{sale.paymentMethod}</span>
                </div>
              </div>

              {/* Footer note */}
              <div className="pt-3 text-center text-[9px] text-slate-500 space-y-0.5">
                <p className="font-bold">Obrigado pela preferência!</p>
                <p>Guarde este comprovante.</p>
                <p className="text-[8px] text-slate-400 mt-1">Documento Não Fiscal</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
