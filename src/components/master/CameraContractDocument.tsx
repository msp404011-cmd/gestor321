import React, { useState } from 'react';
import { CameraInstallationContract } from './CameraInstallationsManagement';
import { 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Cpu, 
  Play, 
  Fingerprint, 
  Download, 
  Printer, 
  Check, 
  PenTool, 
  Loader2 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CameraContractDocumentProps {
  contract: Partial<CameraInstallationContract>;
  onPrint?: () => void;
  onClose?: () => void;
}

export const CameraContractDocument: React.FC<CameraContractDocumentProps> = ({
  contract,
  onPrint,
  onClose
}) => {
  // Signature mode state: Traditional signature, thumbprint, or both
  const [signatureMode, setSignatureMode] = useState<'SIGNATURE' | 'THUMBPRINT' | 'BOTH'>(
    contract.signatureType || 'SIGNATURE'
  );

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const clientName = contract.clientName || '';
  const cpf = contract.cpf || '';
  const address = contract.address || '';
  const city = contract.city || 'Ipaporanga / CE';
  const whatsapp = contract.whatsapp || '';
  const cameraCount = contract.cameraCount || 1;
  const installationVal = contract.installationValue 
    ? `R$ ${Number(contract.installationValue).toFixed(2).replace('.', ',')}` 
    : 'R$ 100,00';
  const monthlyVal = contract.monthlyValue 
    ? `R$ ${Number(contract.monthlyValue).toFixed(2).replace('.', ',')}` 
    : 'R$ 25,00';

  // 1. Direct Native Print
  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // 2. Download high-res PDF directly
  const handleDownloadPdf = async () => {
    const element = document.getElementById('camera-contract-printable-area');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5, // 300dpi equivalent sharp rasterization
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const finalHeight = Math.min(pdfHeight, 297);
      const yOffset = pdfHeight < 297 ? (297 - pdfHeight) / 2 : 0;

      pdf.addImage(imgData, 'JPEG', 0, yOffset, pdfWidth, finalHeight);

      const safeName = (clientName || 'Cliente')
        .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      pdf.save(`Contrato_Locacao_EliteCam_${safeName}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar arquivo PDF:', error);
      // Fallback: browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ACTION BAR (Hidden during native printing) */}
      <div className="print:hidden w-full max-w-[850px] mb-3 bg-[#161B2B] p-3 sm:p-4 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Contrato de Locação de Câmeras</h3>
            <p className="text-[11px] text-slate-300">
              Escolha o formato de assinatura e baixe em PDF ou imprima direto.
            </p>
          </div>
        </div>

        {/* Signature selector pills */}
        <div className="flex items-center bg-[#0B1221] p-1 rounded-xl border border-slate-700/80 gap-1 self-start sm:self-center overflow-x-auto">
          <button
            type="button"
            onClick={() => setSignatureMode('SIGNATURE')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              signatureMode === 'SIGNATURE'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Contrato com linha de assinatura tradicional do cliente"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Assinatura</span>
            {signatureMode === 'SIGNATURE' && <Check className="w-3 h-3 text-cyan-200" />}
          </button>

          <button
            type="button"
            onClick={() => setSignatureMode('THUMBPRINT')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              signatureMode === 'THUMBPRINT'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Contrato com espaço reservado para carimbo do polegar (impressão digital)"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Polegar (Digital)</span>
            {signatureMode === 'THUMBPRINT' && <Check className="w-3 h-3 text-amber-200" />}
          </button>

          <button
            type="button"
            onClick={() => setSignatureMode('BOTH')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              signatureMode === 'BOTH'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Contrato com linha de assinatura E espaço para polegar"
          >
            <PenTool className="w-3 h-3" />
            <Fingerprint className="w-3 h-3" />
            <span>Ambos</span>
            {signatureMode === 'BOTH' && <Check className="w-3 h-3 text-purple-200" />}
          </button>
        </div>

        {/* Action Buttons: Baixar em PDF + Imprimir Direto + Fechar */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* BOTÃO BAIXAR EM PDF */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            title="Baixar arquivo PDF de alta definição para salvar ou enviar"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar em PDF</span>
              </>
            )}
          </button>

          {/* BOTÃO IMPRIMIR DIRETO */}
          <button
            type="button"
            onClick={handleNativePrint}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            title="Imprimir diretamente para impressora conectada ou salvar via navegador"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Direto</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE A4 CONTRACT SHEET */}
      <div 
        id="camera-contract-printable-area"
        className="printable-contract-document w-full max-w-[850px] bg-white text-slate-900 shadow-2xl p-5 sm:p-6 font-sans text-[10px] leading-tight border border-slate-300 select-text rounded-xl overflow-hidden"
        style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
      >
        {/* CONTRACT HEADER BANNER (Identical to uploaded Sem título-1.jpg) */}
        <div className="relative bg-[#050C1B] text-white p-3.5 sm:p-4 rounded-t-xl mb-3 shadow-xl overflow-hidden border-b-4 border-[#0084FF]">
          {/* Diagonal Corner Cutouts on Bottom Left & Bottom Right */}
          <div 
            className="absolute bottom-0 left-0 w-8 h-8 bg-[#0084FF]" 
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }}
          ></div>
          <div 
            className="absolute bottom-0 right-0 w-10 h-10 bg-[#0084FF]" 
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
          ></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-10">
            {/* LEFT SECTION: LOGO ELITECAM */}
            <div className="md:col-span-5 flex items-center gap-3">
              {/* Camera & Wi-Fi Vector Graphic matching Sem título-1.jpg */}
              <div className="shrink-0">
                <svg width="68" height="50" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Wi-Fi Signal Arcs */}
                  <path d="M42 16 C54 7, 70 7, 82 16" stroke="#00A3FF" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M49 24 C57 18, 67 18, 75 24" stroke="#0084FF" strokeWidth="5" strokeLinecap="round"/>
                  <circle cx="62" cy="30" r="3.5" fill="#00A3FF"/>

                  {/* Wall Bracket */}
                  <rect x="10" y="44" width="10" height="24" rx="3" fill="#0D1E36"/>
                  <rect x="20" y="52" width="14" height="8" rx="2" fill="#0D1E36"/>

                  {/* Camera Main Body */}
                  <rect x="30" y="42" width="68" height="30" rx="8" fill="#07152B" stroke="#0084FF" strokeWidth="1.5"/>
                  <path d="M30 42 L98 42 C102 42 104 45 102 49 L96 54 L32 54 Z" fill="url(#blue_hood_grad_header)"/>
                  
                  {/* Lens */}
                  <ellipse cx="98" cy="57" rx="5" ry="11" fill="#00A3FF"/>
                  <ellipse cx="98" cy="57" rx="3" ry="6" fill="#040A16"/>

                  <defs>
                    <linearGradient id="blue_hood_grad_header" x1="30" y1="42" x2="102" y2="54" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00A3FF"/>
                      <stop offset="1" stopColor="#0055CC"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Brand Typography */}
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none font-sans flex items-center">
                  <span>Elite</span>
                  <span className="text-[#0084FF]">Cam</span>
                </div>
                <div className="text-[8.5px] font-extrabold tracking-[0.28em] text-slate-200 uppercase mt-1">
                  SEGURANÇA EXCLUSIVA
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: CONTACT DETAILS */}
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-600/70 pl-3.5 pr-2 py-0.5 space-y-1.5 text-[9.5px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#0084FF]/20 border border-[#0084FF]/60 flex items-center justify-center shrink-0 text-[#00A3FF]">
                  <Shield className="w-2.5 h-2.5 text-[#00A3FF]" />
                </div>
                <span className="font-semibold text-slate-100">CNPJ: 46.686.632/0001-51</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#0084FF]/20 border border-[#0084FF]/60 flex items-center justify-center shrink-0 text-[#00A3FF]">
                  <Phone className="w-2.5 h-2.5 text-[#00A3FF]" />
                </div>
                <span className="font-semibold text-slate-100">(88) 9 8832 - 3089</span>
              </div>

              <div className="flex items-center gap-2 truncate">
                <div className="w-4 h-4 rounded bg-[#0084FF]/20 border border-[#0084FF]/60 flex items-center justify-center shrink-0 text-[#00A3FF]">
                  <Mail className="w-2.5 h-2.5 text-[#00A3FF]" />
                </div>
                <span className="font-semibold text-slate-100 truncate">mmspmartins62@gmail.com</span>
              </div>
            </div>

            {/* RIGHT SECTION: LOCATION */}
            <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-slate-600/70 pl-3.5 py-0.5 flex items-center gap-2.5 text-[9.5px]">
              <div className="p-1.5 bg-[#0084FF] rounded-full text-white shrink-0 shadow-md">
                <MapPin className="w-3.5 h-3.5 fill-white text-[#0084FF]" />
              </div>
              <div className="leading-tight text-slate-100">
                <div className="font-bold text-white">Rua Vicente Pereira Dias, 22</div>
                <div className="text-slate-200 text-[9px]">Ipaporanga/CE - CEP 62.215-000</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN TITLE WITH DECORATIVE LINE */}
        <div className="text-center my-2 pb-1.5">
          <h1 className="text-xl font-black text-[#07132B] uppercase tracking-tight">
            CONTRATO DE <span className="text-[#0084FF]">LOCAÇÃO</span>
          </h1>
          <h2 className="text-[11px] font-black text-[#07132B] uppercase tracking-wider mt-0.5">
            DE SISTEMA DE MONITORAMENTO POR CÂMERAS
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#0084FF]"></span>
            <span className="h-[1.5px] w-12 bg-[#0084FF]"></span>
            <span className="text-[9px] font-extrabold text-[#0084FF] uppercase tracking-widest px-1">
              LOCAÇÃO E MANUTENÇÃO DE EQUIPAMENTOS
            </span>
            <span className="h-[1.5px] w-12 bg-[#0084FF]"></span>
            <span className="w-2 h-2 rounded-full bg-[#0084FF]"></span>
          </div>
        </div>

        {/* BOX 1 & BOX 2: CONTRATANTE E INSTALAÇÃO (Side by Side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* BOX 1: DADOS DO CONTRATANTE */}
          <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/40 relative">
            <div className="bg-[#07132B] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              <span>DADOS DO CONTRATANTE</span>
            </div>

            <div className="space-y-1.5 text-[9.5px]">
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Nome / Razão Social:</span>
                <span className="border-b border-slate-400 flex-1 font-black text-[#07132B] px-1 truncate min-h-[14px]">
                  {clientName}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">CPF / CNPJ:</span>
                <span className="border-b border-slate-400 flex-1 font-black text-[#07132B] px-1 min-h-[14px]">
                  {cpf}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Endereço:</span>
                <span className="border-b border-slate-400 flex-1 font-semibold text-[#07132B] px-1 truncate min-h-[14px]">
                  {address}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline flex-1">
                  <span className="font-bold text-slate-800 shrink-0 mr-1">Cidade / Estado:</span>
                  <span className="border-b border-slate-400 flex-1 font-semibold text-[#07132B] px-1 min-h-[14px]">
                    {city}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Telefone / WhatsApp:</span>
                <span className="border-b border-slate-400 flex-1 font-black text-[#07132B] px-1 min-h-[14px]">
                  {whatsapp}
                </span>
              </div>
            </div>
          </div>

          {/* BOX 2: DADOS DA INSTALAÇÃO */}
          <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/40 relative">
            <div className="bg-[#07132B] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              <span>DADOS DA INSTALAÇÃO</span>
            </div>

            <div className="space-y-1.5 text-[9.5px]">
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Endereço da Instalação:</span>
                <span className="border-b border-slate-400 flex-1 font-semibold text-[#07132B] px-1 truncate min-h-[14px]">
                  {address}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Quantidade de Câmeras:</span>
                <span className="border-b border-slate-400 w-24 font-black text-[#07132B] px-1 text-center min-h-[14px]">
                  {cameraCount}
                </span>
                <span className="font-bold text-slate-700 ml-1">unidades</span>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Valor da Instalação (R$):</span>
                <span className="border-b border-slate-400 flex-1 font-black text-[#07132B] px-1 min-h-[14px]">
                  {installationVal}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-bold text-slate-800 shrink-0 mr-1">Valor da Mensalidade (R$):</span>
                <span className="border-b border-slate-400 flex-1 font-black text-[#07132B] px-1 min-h-[14px]">
                  {monthlyVal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CLAUSES GRID (1 to 9 in 2 COLUMNS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-2 text-[9.5px] text-justify leading-snug mb-2">
          {/* LEFT COLUMN: CLAUSES 1 to 6 */}
          <div className="space-y-2">
            {/* CLAUSE 1 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 1 – OBJETO DO CONTRATO: </span>
                <span>O presente contrato tem por objeto a locação e manutenção de sistema de monitoramento por câmeras, incluindo os equipamentos fornecidos pela empresa, conforme condições estabelecidas neste documento.</span>
              </div>
            </div>

            {/* CLAUSE 2 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 2 – VALORES: </span>
                <span>A instalação dos equipamentos terá o custo de R$ 100,00 (cem reais) por equipamento de câmera instalado. A mensalidade será de R$ 25,00 (vinte e cinco reais) por câmera instalada.</span>
              </div>
            </div>

            {/* CLAUSE 3 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 3 – ACESSO AO LOCAL: </span>
                <span>O contratante compromete-se a permitir o acesso da empresa ou de seus técnicos autorizados ao local de instalação sempre que necessário para instalação, manutenção, vistoria, reparos, substituição ou retirada dos equipamentos.</span>
              </div>
            </div>

            {/* CLAUSE 4 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 4 – FORNECIMENTO DE ENERGIA E INTERNET: </span>
                <span>É de responsabilidade do contratante manter disponíveis os serviços de energia elétrica e internet necessários para o funcionamento adequado dos equipamentos instalados.</span>
              </div>
            </div>

            {/* CLAUSE 5 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">5</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 5 – GARANTIA DOS EQUIPAMENTOS: </span>
                <span>A empresa oferece garantia dos equipamentos locados, cobrindo queima da câmera, queima da fonte, defeitos de funcionamento, danos causados por queda de energia, defeitos no cartão de memória e demais problemas relacionados ao funcionamento normal dos equipamentos. Casos de furto, roubo, remoção indevida ou intervenções não autorizadas seguirão as disposições previstas na Cláusula 7 deste contrato.</span>
              </div>
            </div>

            {/* CLAUSE 6 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">6</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 6 – INTERVENÇÃO DE TERCEIROS: </span>
                <span>Toda instalação, manutenção, configuração, remoção ou qualquer intervenção nos equipamentos deverá ser realizada exclusivamente pela empresa ou por técnico por ela autorizado. Caso terceiros não autorizados realizem qualquer intervenção nos equipamentos, a garantia e as responsabilidades assumidas pela empresa ficarão automaticamente suspensas até a realização de uma vistoria técnica. Sendo constatados danos ou alterações decorrentes da intervenção não autorizada, o contratante será responsável pelos custos de reparo ou substituição dos equipamentos.</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CLAUSES 7 to 9 */}
          <div className="space-y-2">
            {/* CLAUSE 7 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">7</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 7 – ROUBO, FURTO E RECUPERAÇÃO DOS EQUIPAMENTOS: </span>
                <span>Todos os equipamentos instalados permanecem sendo propriedade da empresa contratada. Em caso de furto, roubo, apropriação indevida ou qualquer retirada não autorizada dos equipamentos, a empresa realizará o bloqueio imediato dos dispositivos, utilizando os mecanismos de segurança disponíveis. A empresa mantém registro completo dos equipamentos instalados, incluindo números de série, identificações técnicas e demais informações necessárias para localização e recuperação dos bens. Constatada a ocorrência de furto ou roubo, a empresa poderá comunicar o fato às autoridades competentes e fornecer todas as informações necessárias para auxiliar na localização e recuperação dos equipamentos. O contratante ficará isento de qualquer responsabilidade financeira referente aos equipamentos furtados ou roubados, desde que não tenha participação direta ou indireta no ocorrido e comunique imediatamente o fato à empresa. Caso seja comprovado que o contratante participou do furto, roubo, ocultação, venda, dano proposital ou qualquer retirada indevida dos equipamentos, ele será responsável pelo ressarcimento integral dos prejuízos causados à empresa, além das medidas legais cabíveis.</span>
              </div>
            </div>

            {/* CLAUSE 8 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">8</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 8 – PAGAMENTO E INADIMPLÊNCIA: </span>
                <span>O contratante deverá efetuar o pagamento da mensalidade na data previamente combinada entre as partes. Em caso de atraso, a empresa poderá suspender temporariamente os serviços e garantias oferecidas até a regularização dos débitos. Permanecendo a inadimplência por mais de 30 (trinta) dias, a empresa poderá retirar os equipamentos instalados e realizar a cobrança dos valores pendentes. Os equipamentos permanecem sendo propriedade da empresa durante toda a vigência deste contrato, não podendo ser vendidos, emprestados, transferidos ou removidos sem autorização da contratada. Após a regularização dos pagamentos, os serviços serão restabelecidos conforme disponibilidade de atendimento da empresa.</span>
              </div>
            </div>

            {/* CLAUSE 9 */}
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">9</span>
              <div>
                <span className="font-black text-[#07132B]">CLÁUSULA 9 – CANCELAMENTO E RETIRADA DOS EQUIPAMENTOS: </span>
                <span>O contratante poderá solicitar o cancelamento do serviço a qualquer momento. A retirada dos equipamentos será agendada conforme a disponibilidade da empresa e realizada exclusivamente pela contratada ou técnico autorizado. Os equipamentos não poderão ser removidos por terceiros não autorizados. Caso isso ocorra, a empresa realizará testes técnicos e, sendo constatados danos decorrentes da remoção indevida, o contratante será responsável pelos custos de reparo ou substituição dos equipamentos.</span>
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH CLAUSES 10 & 11 */}
        <div className="space-y-2 text-[9.5px] text-justify leading-snug pt-1.5 border-t border-slate-200 mb-2">
          {/* CLAUSE 10 */}
          <div className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[8.5px] flex items-center justify-center shrink-0 mt-0.5">10</span>
            <div>
              <span className="font-black text-[#07132B]">CLÁUSULA 10 – LIMITAÇÃO DE RESPONSABILIDADE: </span>
              <span>Os equipamentos fornecidos pela empresa têm como finalidade auxiliar no monitoramento e registro de imagens do local instalado. A empresa não se responsabiliza por furtos, roubos, invasões, danos materiais ou quaisquer ocorrências ocorridas no imóvel, cabendo às câmeras apenas a função de monitoramento e gravação das imagens. O contratante declara estar ciente de que o sistema de monitoramento é uma ferramenta de apoio à segurança, não constituindo garantia de prevenção ou impedimento de ações criminosas.</span>
            </div>
          </div>

          {/* CLAUSE 11 */}
          <div className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#07132B] text-white font-black text-[8.5px] flex items-center justify-center shrink-0 mt-0.5">11</span>
            <div>
              <span className="font-black text-[#07132B]">CLÁUSULA 11 – DISPOSIÇÕES FINAIS: </span>
              <span>As partes declaram ter lido, compreendido e aceito todas as condições deste contrato, obrigando-se ao seu fiel cumprimento. O contratante declara ter recebido todas as informações necessárias sobre o funcionamento, utilização, garantias e responsabilidades previstas neste contrato. Fica eleito o foro da comarca competente da região para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato.</span>
            </div>
          </div>
        </div>

        {/* CLOSING & SIGNATURES */}
        <div className="pt-2 border-t border-slate-300 text-center space-y-2 mb-2">
          <p className="text-[9.5px] font-bold text-slate-800">
            E, por estarem de pleno acordo, as partes assinam o presente contrato em 2 (duas) vias de igual teor e forma.
          </p>

          {/* SIGNATURE BOXES (Adapts according to signatureMode) */}
          <div className="grid grid-cols-2 gap-5 px-3 pt-1">
            {/* BOX CONTRATANTE */}
            <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/40 text-center relative pt-4 flex flex-col justify-between min-h-[85px]">
              <div className="bg-[#07132B] text-white px-3 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider absolute -top-2.5 left-1/2 -translate-x-1/2 shadow-sm flex items-center gap-1 whitespace-nowrap">
                <span>CONTRATANTE</span>
                {signatureMode === 'THUMBPRINT' && <span className="text-amber-300 font-bold">(POLEGAR)</span>}
                {signatureMode === 'BOTH' && <span className="text-purple-300 font-bold">(ASSINATURA + POLEGAR)</span>}
              </div>

              {/* MODO 1: ASSINATURA TRADICIONAL */}
              {signatureMode === 'SIGNATURE' && (
                <div className="my-auto pt-2">
                  <div className="border-b border-slate-700 w-4/5 mx-auto mb-1 mt-4"></div>
                  <span className="text-[8.5px] text-slate-800 font-black uppercase block truncate">
                    {clientName || 'Assinatura do Cliente'}
                  </span>
                  {cpf && <span className="text-[7.5px] text-slate-500 font-semibold block">CPF: {cpf}</span>}
                </div>
              )}

              {/* MODO 2: APENAS POLEGAR (DIGITAL) COM ESPAÇO DEDICADO */}
              {signatureMode === 'THUMBPRINT' && (
                <div className="flex flex-col items-center justify-center my-auto py-1">
                  <div className="w-24 h-16 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center bg-white p-1 my-1 shadow-inner">
                    <Fingerprint className="w-7 h-7 text-slate-400 opacity-60 mb-0.5" />
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-tight">
                      Polegar Direito
                    </span>
                  </div>
                  <span className="text-[8.5px] text-slate-800 font-black block truncate mt-0.5">
                    {clientName || 'Polegar do Cliente'}
                  </span>
                  {cpf && <span className="text-[7.5px] text-slate-500 font-semibold block">CPF: {cpf}</span>}
                </div>
              )}

              {/* MODO 3: AMBOS (ASSINATURA E POLEGAR LADO A LADO) */}
              {signatureMode === 'BOTH' && (
                <div className="grid grid-cols-2 gap-2 items-center my-auto pt-1">
                  {/* Linha de Assinatura */}
                  <div className="flex flex-col justify-end">
                    <div className="border-b border-slate-700 w-full mb-1 mt-6"></div>
                    <span className="text-[7.5px] text-slate-800 font-black uppercase block truncate">
                      {clientName || 'Assinatura'}
                    </span>
                    {cpf && <span className="text-[7px] text-slate-500 block truncate">CPF: {cpf}</span>}
                  </div>

                  {/* Espaço para Polegar */}
                  <div className="flex flex-col items-center">
                    <div className="w-18 h-14 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center bg-white p-1 shadow-inner">
                      <Fingerprint className="w-5 h-5 text-slate-400 opacity-60" />
                      <span className="text-[6.5px] font-black text-slate-600 uppercase">Polegar</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOX CONTRATADA (EliteCam Segurança Exclusiva) */}
            <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/40 text-center relative pt-4 flex flex-col justify-between min-h-[85px]">
              <div className="bg-[#07132B] text-white px-3 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider absolute -top-2.5 left-1/2 -translate-x-1/2 shadow-sm whitespace-nowrap">
                CONTRATADA
              </div>

              <div className="my-auto pt-2">
                <div className="border-b border-slate-700 w-4/5 mx-auto mb-1 mt-4"></div>
                <span className="text-[8.5px] text-slate-800 font-black uppercase block">
                  EliteCam Segurança Exclusiva
                </span>
                <span className="text-[7.5px] text-slate-500 font-semibold block">
                  CNPJ: 46.686.632/0001-51
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BADGES BAR (Identical to CONTRATO.jpg) */}
        <div className="bg-[#07132B] text-white p-2 rounded-xl flex items-center justify-around gap-1 text-[8.5px] font-black uppercase tracking-wider border-t-2 border-[#0084FF]">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#00A3FF]" />
            <span>MONITORAMENTO 24 HORAS</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#00A3FF]" />
            <span>ACESSO REMOTO ONLINE</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1">
            <Play className="w-3 h-3 text-[#00A3FF]" />
            <span>GRAVAÇÃO SEGURA E CONFIÁVEL</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#00A3FF]" />
            <span>EQUIPAMENTOS DE ALTA PERFORMANCE</span>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Native Printing without UI elements */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #camera-contract-printable-area, #camera-contract-printable-area * {
            visibility: visible !important;
          }
          #camera-contract-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
