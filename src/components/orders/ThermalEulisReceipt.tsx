import React from 'react';
import { ServiceOrder, CompanySettings, EulisDispatchInfo } from '../../types';
import { StorageService } from '../../services/storage';
import { formatDate } from '../../services/formatters';

interface ThermalEulisReceiptProps {
  order: ServiceOrder;
  company: CompanySettings;
  dispatchInfo: EulisDispatchInfo;
  paperFormat?: '80mm' | '58mm' | '50mm';
}

export const ThermalEulisReceipt: React.FC<ThermalEulisReceiptProps> = ({
  order,
  company,
  dispatchInfo,
  paperFormat = '80mm',
}) => {
  if (!order) return null;

  const isMini = paperFormat === '50mm' || paperFormat === '58mm';

  // Look up customer full details if available
  const customer = order.customerId
    ? StorageService.getCustomers().find((c) => c.id === order.customerId) || null
    : null;

  const customerName = customer?.name || order.customerName || '';
  const customerPhone = customer?.whatsapp || customer?.phone || order.customerWhatsapp || order.customerPhone || '';

  return (
    <div
      className={`mx-auto bg-white text-black select-text ${
        isMini
          ? 'w-[48mm] max-w-[48mm] p-1 text-[8px] leading-tight font-sans'
          : 'w-[72mm] max-w-[72mm] p-2 text-[9px] leading-tight font-sans'
      }`}
      style={{ color: '#000000', wordBreak: 'break-word', boxSizing: 'border-box' }}
    >
      {/* 1. BRAND / LOGO HEADER (Same as standard OS) */}
      <div className="text-center">
        {company.logoUrl ? (
          <div className="flex justify-center mb-1">
            <img
              src={company.logoUrl}
              alt="Logo"
              className={`${isMini ? 'max-h-9 max-w-[105px]' : 'max-h-12 max-w-[140px]'} object-contain`}
            />
          </div>
        ) : (
          <div className="mb-1">
            <div className={`font-black tracking-wide leading-tight ${isMini ? 'text-[11px]' : 'text-sm'} uppercase font-sans break-words`}>
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
        <div className={`text-center ${isMini ? 'text-[7.5px]' : 'text-[8.5px]'} leading-snug mt-1 text-slate-900`}>
          <div className="font-black uppercase break-words">{company.commercialName || company.name || 'TECHNOVA ASSISTÊNCIA TÉCNICA'}</div>
          {company.ownerName && <div>{company.ownerName}</div>}
          <div className="break-words">
            CNPJ: {company.cnpj || company.cnpjCpf || '12.345.678/0001-90'}
            {company.zipCode ? ` CEP: ${company.zipCode}` : ''}
            {company.address ? ` - ${company.address}` : ''}
            {company.neighborhood ? ` - ${company.neighborhood}` : ''}
            {company.city ? ` - ${company.city}` : ''}{company.state ? `/${company.state}` : ''}
          </div>
          <div>Fone: {company.phone || company.whatsapp || '(11) 98765-4321'}</div>
        </div>
      </div>

      {/* 2. ORDER NUMBER & TITLE (EXCLUSIVE C/ EULIS) */}
      <div className="text-center my-1.5 pb-1 border-b border-black">
        <div className={`${isMini ? 'text-[8.5px]' : 'text-[10px]'} font-extrabold tracking-wide uppercase`}>
          ORDEM DE SERVIÇO • GUIA DE REMESSA
        </div>
        <div className={`${isMini ? 'text-lg' : 'text-xl'} font-black my-0.5 tracking-wider font-mono`}>
          OS #{order.orderNumber}
        </div>
        <div className="inline-block px-2 py-0.5 bg-black text-white font-black text-[8.5px] uppercase tracking-wider rounded-sm my-0.5">
          VIA C/ EUKLIS (TERCEIRIZADO)
        </div>
        <div className="flex justify-between text-[8px] font-semibold text-slate-800 mt-1">
          <span>Entrada: {formatDate(order.createdAt)}</span>
          <span>Envio: {formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* 3. DADOS DO CLIENTE (APENAS NOME) */}
      <div className={`text-left ${isMini ? 'text-[7.5px]' : 'text-[8.5px]'} leading-tight space-y-0.5 my-1.5 py-1 border-b border-slate-300`}>
        <div className="flex">
          <span className={`${isMini ? 'w-11' : 'w-14'} shrink-0 font-bold text-slate-700`}>Cliente:</span>
          <span className="font-black uppercase break-words">{customerName}</span>
        </div>
      </div>

      {/* 4. DADOS DO APARELHO */}
      <div className={`text-left ${isMini ? 'text-[7.5px]' : 'text-[8.5px]'} leading-tight space-y-0.5 my-1.5 py-1 border-b border-slate-300`}>
        <div className="flex">
          <span className={`${isMini ? 'w-13' : 'w-16'} shrink-0 font-bold text-slate-700`}>Aparelho:</span>
          <span className="font-black uppercase break-words">
            {order.brand ? `${order.brand} ${order.model}` : order.model || 'Equipamento'}
          </span>
        </div>
        <div className="flex">
          <span className={`${isMini ? 'w-13' : 'w-16'} shrink-0 font-bold text-slate-700`}>Tipo:</span>
          <span>{order.deviceType || 'Smartphone'}</span>
        </div>
        {(order.imei || order.serialNumber) && (
          <div className="flex">
            <span className={`${isMini ? 'w-13' : 'w-16'} shrink-0 font-bold text-slate-700`}>IMEI/Serial:</span>
            <span className="font-mono text-[7.5px] font-semibold break-all">{order.imei || order.serialNumber}</span>
          </div>
        )}
        {order.passwordPin && (
          <div className="flex">
            <span className={`${isMini ? 'w-16' : 'w-20'} shrink-0 font-bold text-slate-700`}>Senha/PIN:</span>
            <span className="font-mono font-bold bg-slate-100 px-1">{order.passwordPin}</span>
          </div>
        )}
        {order.passwordPattern && order.passwordPattern.length > 0 && (
          <div className="flex">
            <span className={`${isMini ? 'w-16' : 'w-20'} shrink-0 font-bold text-slate-700`}>Padrão:</span>
            <span className="font-mono font-bold text-[8.5px]">Seq: {order.passwordPattern.join(' ➔ ')}</span>
          </div>
        )}
      </div>

      {/* 5. ITENS ENVIADOS JUNTO (GAVETA, CHIP, CARTÃO, ETC.) - EXCLUSIVO */}
      <div className={`my-2 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'}`}>
        <div className="font-black uppercase tracking-wide mb-1 border-b border-black pb-0.5 flex items-center justify-between">
          <span>O que está sendo enviado:</span>
          <span className="text-[7.5px] font-bold text-slate-600">(Checklist de Remessa)</span>
        </div>

        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 py-1 text-[9px]">
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.hasChipTray ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.hasChipTray ? 'font-black' : 'text-slate-500'}>Gaveta de Chip</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.chip1 ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.chip1 ? 'font-black' : 'text-slate-500'}>Chip 1 (SIM)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.chip2 ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.chip2 ? 'font-black' : 'text-slate-500'}>Chip 2 (SIM)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.memoryCard ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.memoryCard ? 'font-black' : 'text-slate-500'}>Cartão Memória</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.caseCover ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.caseCover ? 'font-black' : 'text-slate-500'}>Capa / Case</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.screenFilm ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.screenFilm ? 'font-black' : 'text-slate-500'}>Película</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.charger ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.charger ? 'font-black' : 'text-slate-500'}>Carregador / Cabo</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">{dispatchInfo.battery ? '[X]' : '[  ]'}</span>
            <span className={dispatchInfo.battery ? 'font-black' : 'text-slate-500'}>Bateria</span>
          </div>
        </div>

        {dispatchInfo.accessoriesNotes && (
          <div className="text-[8px] text-slate-800 mt-0.5 pt-0.5 border-t border-dotted border-slate-300">
            <span className="font-bold">Outros itens: </span>
            {dispatchInfo.accessoriesNotes}
          </div>
        )}
      </div>

      {/* 6. DEFEITO RECLAMADO (DEFEITO ABAIXO) */}
      <div className={`my-2 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'}`}>
        <span className="font-black uppercase tracking-wide block mb-0.5">
          Defeito a Resolver / Reclamado:
        </span>
        <div
          className={`p-1.5 font-bold uppercase ${isMini ? 'text-[8.5px]' : 'text-[10px]'} leading-snug`}
          style={{ border: '1.5px solid #000000', backgroundColor: '#fafafa' }}
        >
          {order.clientDefect || 'DEFEITO NÃO ESPECIFICADO'}
        </div>
      </div>

      {/* 7. ESTADO DO APARELHO (DESMONTADO / COMPLETA / SÓ UMA PARTE) - EXCLUSIVO C/ EULIS */}
      <div className={`my-2 text-left ${isMini ? 'text-[8px]' : 'text-[9.5px]'}`}>
        <span className="font-black uppercase tracking-wide block mb-0.5">
          Estado do Aparelho no Envio:
        </span>
        
        {/* Opções de estado */}
        <div className="flex flex-col gap-0.5 mb-1.5 text-[8.5px] font-semibold">
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">
              {dispatchInfo.assemblyState === 'COMPLETO' ? '[X]' : '[  ]'}
            </span>
            <span className={dispatchInfo.assemblyState === 'COMPLETO' ? 'font-black' : 'text-slate-600'}>
              APARELHO COMPLETO (MONTADO)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">
              {dispatchInfo.assemblyState === 'DESMONTADO' ? '[X]' : '[  ]'}
            </span>
            <span className={dispatchInfo.assemblyState === 'DESMONTADO' ? 'font-black' : 'text-slate-600'}>
              APARELHO DESMONTADO (ABERTO)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold">
              {dispatchInfo.assemblyState === 'SO_PARTE' ? '[X]' : '[  ]'}
            </span>
            <span className={dispatchInfo.assemblyState === 'SO_PARTE' ? 'font-black' : 'text-slate-600'}>
              SÓ UMA PARTE (APENAS PLACA / TELA / CARCAÇA)
            </span>
          </div>
        </div>

        {/* Espaço para descrever o estado / peças */}
        <span className="font-bold text-[8px] uppercase tracking-wider block mb-0.5 text-slate-700">
          Descrição do Estado / Partes Enviadas:
        </span>
        <div
          className={`p-1.5 min-h-[32px] ${isMini ? 'text-[8px]' : 'text-[9px]'} leading-relaxed whitespace-pre-line`}
          style={{ border: '1px solid #000000', backgroundColor: '#ffffff' }}
        >
          {dispatchInfo.assemblyStateDescription?.trim() ||
            'Aparelho enviado para reparo especializado com o parceiro Euklis.'}
        </div>

        {/* Observações adicionais exclusivas para C/ Euklis */}
        {dispatchInfo.dispatchNotes && dispatchInfo.dispatchNotes.trim() && (
          <div className="mt-1.5 pt-1 border-t border-slate-300">
            <span className="font-bold text-[8px] uppercase tracking-wider block mb-0.5 text-slate-700">
              Observações / Recados para C/ Euklis:
            </span>
            <div
              className={`p-1.5 ${isMini ? 'text-[8px]' : 'text-[9px]'} leading-snug font-medium whitespace-pre-line`}
              style={{ border: '1px dashed #000000', backgroundColor: '#fafafa' }}
            >
              {dispatchInfo.dispatchNotes}
            </div>
          </div>
        )}
      </div>

      {/* 8. PROTOCOLO DE ENVIO E ASSINATURAS */}
      <div className={`mt-3 pt-2 border-t-2 border-black text-center ${isMini ? 'text-[7.5px]' : 'text-[8.5px]'} space-y-3`}>
        <div className="flex justify-between items-end gap-2 pt-2">
          <div className="flex-1 text-center">
            <div className="border-b border-black mb-1 w-full mx-auto" />
            <span className="font-bold block uppercase">Enviado por (Loja)</span>
            <span className="text-[7.5px] text-slate-600">Assinatura / Visto</span>
          </div>
          <div className="flex-1 text-center">
            <div className="border-b border-black mb-1 w-full mx-auto" />
            <span className="font-bold block uppercase">Recebido p/ Euklis</span>
            <span className="text-[7.5px] text-slate-600">Assinatura / Visto</span>
          </div>
        </div>

        <div className="text-[7.5px] text-slate-600 font-mono text-center">
          Guia de controle de bancada e remessa técnica externa • {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
};
