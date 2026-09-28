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
    const container = document.getElementById('printable-pos-receipt');
    if (!container) {
      window.print();
      return;
    }

    try {
      const existingFrame = document.getElementById('pos-print-iframe');
      if (existingFrame) {
        existingFrame.remove();
      }

      const printFrame = document.createElement('iframe');
      printFrame.id = 'pos-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '0';
      const iframePixelWidth = paperFormat === 'A4' ? '794px' : paperFormat === '80mm' ? '302px' : '220px';
      printFrame.style.width = iframePixelWidth;
      printFrame.style.height = '1200px';
      printFrame.style.border = '0';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      // Collect all document styles BUT filter out any styles that set visibility: hidden
      const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .filter((el) => {
          const content = el.innerHTML || '';
          return !content.includes('body * {') && !content.includes('visibility: hidden');
        })
        .map((el) => el.outerHTML)
        .join('\n');

      const contentHtml = container.innerHTML;
      const printWidth = paperFormat === '50mm' ? '48mm' : paperFormat === '80mm' ? '70mm' : '100%';
      const pageMargin = paperFormat === 'A4' ? '8mm' : '0mm';
      const pageSize = paperFormat === 'A4' ? 'A4 portrait' : paperFormat === '80mm' ? '80mm auto' : '58mm auto';
      const bodyWidth = paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm';

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Venda #${sale.saleNumber} - ${company.commercialName || company.name || 'Comprovante'}</title>
            ${styleTags}
            <style>
              @page {
                size: ${pageSize};
                margin: ${pageMargin} !important;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                filter: none !important;
                visibility: visible !important;
              }
              html {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100% !important;
                visibility: visible !important;
              }
              body {
                margin: 0 auto !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                width: ${bodyWidth} !important;
                max-width: ${bodyWidth} !important;
                min-width: ${bodyWidth} !important;
                font-family: monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                visibility: visible !important;
                display: block !important;
              }
              body * {
                visibility: visible !important;
              }
              #printable-pos-receipt, .print-pos-wrapper {
                width: ${printWidth} !important;
                max-width: ${printWidth} !important;
                min-width: ${printWidth} !important;
                margin-left: auto !important;
                margin-right: auto !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-sizing: border-box !important;
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div id="printable-pos-receipt" class="print-pos-wrapper">
              ${contentHtml}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.onafterprint = () => {
              onClose();
            };
          }
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            onClose();
          }, 350);
        }
      };

      const images = Array.from(frameDoc.images || []);
      if (images.length > 0) {
        let loadedCount = 0;
        const total = images.length;
        const checkDone = () => {
          loadedCount++;
          if (loadedCount >= total) {
            setTimeout(triggerPrint, 150);
          }
        };
        images.forEach((img) => {
          if (img.complete) {
            checkDone();
          } else {
            img.onload = checkDone;
            img.onerror = checkDone;
          }
        });
        setTimeout(triggerPrint, 500);
      } else {
        setTimeout(triggerPrint, 250);
      }
    } catch {
      window.print();
    }
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
      {/* Dynamic Print CSS Injection */}
      <style>{`
        @media print {
          *, *::before, *::after {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            filter: none !important;
            text-shadow: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            visibility: visible !important;
          }
          body {
            margin: 0 auto !important;
            padding: 0 !important;
            width: ${paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm'} !important;
            max-width: ${paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm'} !important;
            min-width: ${paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm'} !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            visibility: visible !important;
            display: block !important;
          }
          header, aside, nav, button, .no-print {
            display: none !important;
          }
          .fixed.inset-0 {
            position: static !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            overflow: visible !important;
            height: auto !important;
            width: ${paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm'} !important;
            max-width: ${paperFormat === 'A4' ? '100%' : paperFormat === '80mm' ? '80mm' : '58mm'} !important;
          }
          #printable-pos-receipt, #printable-pos-receipt * {
            visibility: visible !important;
          }
          #printable-pos-receipt {
            position: static !important;
            width: ${paperFormat === '50mm' ? '48mm' : paperFormat === '80mm' ? '70mm' : '100%'} !important;
            max-width: ${paperFormat === '50mm' ? '48mm' : paperFormat === '80mm' ? '70mm' : '100%'} !important;
            min-width: ${paperFormat === '50mm' ? '48mm' : paperFormat === '80mm' ? '70mm' : '100%'} !important;
            margin-left: auto !important;
            margin-right: auto !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          @page {
            size: ${paperFormat === 'A4' ? 'A4 portrait' : paperFormat === '80mm' ? '80mm auto' : '58mm auto'};
            margin: ${paperFormat === 'A4' ? '8mm' : '0mm'} !important;
          }
        }
      `}</style>

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
              80mm (Elgin i9)
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
        <div 
          id="printable-pos-receipt"
          className={`overflow-y-auto flex-1 font-mono text-slate-900 bg-white printable-content ${
            paperFormat === '50mm' ? 'p-2 text-[9px] w-[48mm] max-w-[48mm] mx-auto' : paperFormat === 'A4' ? 'p-8 text-xs' : 'p-3 text-xs w-[72mm] max-w-[72mm] mx-auto'
          }`}
          style={{ color: '#000000', wordBreak: 'break-word', boxSizing: 'border-box' }}
        >
          {paperFormat === 'A4' ? (
            /* A4 Full Page Format */
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt="Logo" className="max-h-12 max-w-[160px] object-contain mb-2" />
                  )}
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{company.commercialName || company.name}</h1>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">{company.slogan}</p>
                  <p className="text-xs text-slate-600 mt-1">CNPJ: {company.cnpj || company.cnpjCpf} | WhatsApp: {company.phone || company.whatsapp}</p>
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
            <div className={`mx-auto ${paperFormat === '50mm' ? 'w-[48mm] max-w-[48mm] p-1 text-[8px]' : 'w-[70mm] max-w-[70mm] p-1.5 text-[9px]'} font-mono select-text`} style={{ boxSizing: 'border-box' }}>
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                {company.logoUrl && (
                  <div className="flex justify-center mb-1">
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className={`${paperFormat === '50mm' ? 'max-h-10 max-w-[110px]' : 'max-h-12 max-w-[140px]'} object-contain`}
                    />
                  </div>
                )}
                <h2 className={`${paperFormat === '50mm' ? 'text-[11px]' : 'text-sm'} font-black tracking-tight uppercase`}>
                  {company.commercialName || company.name}
                </h2>
                {company.slogan && <p className="text-[8px] text-slate-600">{company.slogan}</p>}
                <p className="text-[8px] text-slate-600 mt-0.5">CNPJ: {company.cnpj || company.cnpjCpf}</p>
                <p className="text-[8px] text-slate-600">
                  {company.address} - {company.city}/{company.state}
                </p>
                <p className="text-[8px] text-slate-600">Fone: {company.phone || company.whatsapp}</p>
              </div>

              {/* Sale details */}
              <div className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5 text-[9px]">
                <div className="flex justify-between">
                  <span>VENDA Nº:</span>
                  <span className="font-black">#{sale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATA:</span>
                  <span>{formatDate(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-bold truncate max-w-[120px]">{sale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>VENDEDOR:</span>
                  <span>{sale.sellerName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-1.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[8.5px] uppercase text-slate-600 pb-0.5">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>

                <div className="space-y-1 mt-0.5">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="text-[8.5px]">
                      <p className="font-bold leading-tight truncate">{item.productName}</p>
                      <div className="flex justify-between text-slate-700">
                        <span>
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="font-black text-black">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5 text-[9px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>DESCONTO:</span>
                    <span>- {formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-1 border-t border-slate-300 text-[10px]">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
                <div className="flex justify-between pt-0.5 text-[8.5px]">
                  <span>FORMA PGTO:</span>
                  <span className="font-bold">{sale.paymentMethod}</span>
                </div>
              </div>

              {/* Footer note */}
              <div className="pt-2 text-center text-[8px] text-slate-600 space-y-0.5">
                <p className="font-bold">Obrigado pela preferência!</p>
                <p>Guarde este comprovante.</p>
                <p className="text-[7.5px] text-slate-400 mt-0.5">Documento Não Fiscal</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
