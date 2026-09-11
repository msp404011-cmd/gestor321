import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PlanType, SubscriptionPlanInfo } from '../../types';
import {
  SubscriptionService,
  SUBSCRIPTION_PLANS,
} from '../../services/subscriptionService';
import {
  MercadoPagoService,
  PixPaymentResponse,
  PaymentStatusResponse,
} from '../../services/mercadopagoService';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/formatters';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  onSuccess: (updatedPlan: SubscriptionPlanInfo) => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  planType,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const baseId = useId();

  // Normalized plan
  const normalizedPlan: PlanType =
    planType === 'PRO' ? 'LOJA' : planType === 'ENTERPRISE' ? 'REVENDA' : planType;
  const planDef = SUBSCRIPTION_PLANS[normalizedPlan] || SUBSCRIPTION_PLANS.LOJA;

  // Loading & payment states
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedPlanInfo, setApprovedPlanInfo] = useState<SubscriptionPlanInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Polling interval ref
  const pollingRef = useRef<any>(null);

  // Initialize credentials on open
  useEffect(() => {
    if (isOpen) {
      setIsApproved(false);
      setApprovedPlanInfo(null);
      setErrorMessage(null);
      setCopiedPix(false);
      setStatusCheckCount(0);

      // Generate PIX automatically when modal opens
      generatePix();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, normalizedPlan]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Generate PIX Payment via Mercado Pago
  const generatePix = async () => {
    setIsLoadingPix(true);
    setErrorMessage(null);
    stopPolling();

    try {
      const company = StorageService.getCompanySettings();
      const doc = company?.cnpjCpf || company?.cnpj || '19119119100';
      const response = await MercadoPagoService.createPixPayment({
        planType: normalizedPlan,
        planName: planDef.name,
        amount: planDef.monthlyPrice,
        payer: {
          email: company?.email || 'financeiro@assistencia.com.br',
          firstName: company?.commercialName?.split(' ')[0] || 'Gestor',
          lastName: company?.commercialName?.split(' ')[1] || 'Loja',
          cpf: doc,
        },
      });

      setPixData(response);
      setIsLoadingPix(false);

      // Start 5-second polling if payment was created
      if (response.paymentId) {
        startStatusPolling(response.paymentId);
      }
    } catch (err: any) {
      setIsLoadingPix(false);
      setErrorMessage(err?.message || 'Erro ao gerar PIX com o Mercado Pago.');
    }
  };

  // Start 3-second interval verification
  const startStatusPolling = (paymentId: string) => {
    stopPolling();
    setStatusCheckCount(0);

    pollingRef.current = setInterval(async () => {
      setIsCheckingStatus(true);
      setStatusCheckCount((c) => c + 1);

      try {
        const result: PaymentStatusResponse = await MercadoPagoService.checkPaymentStatus(paymentId);
        setIsCheckingStatus(false);

        if (result.isApproved) {
          stopPolling();
          handlePaymentSuccess(paymentId, planDef.monthlyPrice);
        }
      } catch (e) {
        setIsCheckingStatus(false);
      }
    }, 3000);
  };

  // Handle Payment Success (Immediate activation and auto reload)
  const handlePaymentSuccess = (paymentId: string, amount: number) => {
    const updated = SubscriptionService.activatePlanWithPayment(normalizedPlan, {
      method: 'pix',
      paymentId,
      amount,
      notes: `Assinatura ${planDef.name} confirmada via PIX Mercado Pago.`,
    });

    setIsApproved(true);
    setApprovedPlanInfo(updated);
    onSuccess(updated);

    // Auto reload after 2.5 seconds to refresh the application state with active plan
    setTimeout(() => {
      window.location.reload();
    }, 2500);
  };

  // Copy PIX Code to clipboard
  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto ${
          isDark
            ? 'bg-[#0a1224] border-blue-500/40 text-slate-100'
            : 'bg-white border-blue-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-[#0d1a38] via-[#0b162e] to-[#091124] border-blue-900/60'
              : 'bg-gradient-to-r from-blue-50 via-sky-50 to-white border-blue-100'
          }`}
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 shrink-0">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  PIX Mercado Pago
                </span>
                <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Ativação Imediata
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Pagamento via PIX: {planDef.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            className={`p-2 rounded-xl border transition-colors cursor-pointer relative z-10 ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* SUCCESS STATE */}
          {isApproved ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  PIX Confirmado com Sucesso!
                </span>
                <h4 className="text-2xl font-black tracking-tight mt-3">
                  Parabéns! O {planDef.name} está 100% Liberado.
                </h4>
                <p className={`text-xs mt-2 max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Sua assinatura mensal foi ativada por <strong>30 dias</strong> (até{' '}
                  {approvedPlanInfo?.expiryDate
                    ? new Date(approvedPlanInfo.expiryDate + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'próximo mês'}
                  ). Todos os módulos, limites e recursos foram desbloqueados!
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border max-w-md mx-auto text-left text-xs space-y-2 ${
                  isDark ? 'bg-[#0d172e] border-blue-900/60' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-400">Plano Ativado:</span>
                  <span className="font-black text-slate-200">{planDef.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Pago:</span>
                  <span className="font-black text-emerald-400">
                    {formatCurrency(planDef.monthlyPrice)}/mês
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Método de Pagamento:</span>
                  <span className="font-bold text-slate-200">
                    PIX Instantâneo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comprovante / ID Transação:</span>
                  <span className="font-mono text-[11px] text-sky-400">
                    {approvedPlanInfo?.contractNumber || 'MP-PIX-OK'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-after-approval"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full max-w-md mx-auto py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <span>Acessar Sistema com Plano Liberado</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* PLAN SUMMARY STRIP */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#0c162e] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Plano Selecionado
                  </span>
                  <span className="text-base font-black tracking-tight">{planDef.name}</span>
                  <span className="text-xs text-slate-400 block">
                    {planDef.tagline}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Valor da Assinatura
                  </span>
                  <div className="flex items-baseline sm:justify-end gap-1">
                    <span className="text-2xl font-black text-emerald-400">
                      {formatCurrency(planDef.monthlyPrice)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/mês</span>
                  </div>
                </div>
              </div>

              {/* ERROR NOTICE */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-bold block">Atenção</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* PIX PAYMENT VIEW */}
              <div className="space-y-4">
                {isLoadingPix ? (
                  <div className="py-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
                    <p className="text-xs font-bold text-slate-400">
                      Gerando cobrança PIX...
                    </p>
                  </div>
                ) : pixData ? (
                  <>
                    {/* QR Code Container */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 rounded-2xl bg-white text-slate-900 shadow-inner">
                      {/* Render QR Image */}
                      <div className="p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
                        {pixData.qrCodeBase64 ? (
                          <img
                            src={pixData.qrCodeBase64}
                            alt="QR Code PIX"
                            className="w-48 h-48 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg">
                            <QrCode className="w-20 h-20 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="text-xs space-y-2.5 max-w-xs text-left">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                          Pague com PIX e libere na hora!
                        </div>
                        <ol className="space-y-2 list-decimal list-inside text-slate-600 font-medium leading-relaxed">
                          <li>Abra o aplicativo do seu banco.</li>
                          <li>Escolha pagar via <strong>PIX QR Code</strong> ou Copia e Cola.</li>
                          <li>Escaneie o código ao lado ou copie a chave abaixo.</li>
                          <li>A liberação do sistema é instantânea!</li>
                        </ol>
                      </div>
                    </div>

                    {/* PIX Copia e Cola String & Copy Button */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${baseId}-pix-code`}
                        className={`text-xs font-bold flex items-center justify-between ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          Código PIX Copia e Cola:
                        </span>
                        <span className="text-[10px] text-slate-400">Válido por 30 minutos</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          id={`${baseId}-pix-code`}
                          type="text"
                          readOnly
                          value={pixData.qrCode}
                          className={`w-full py-2.5 px-3 rounded-xl font-mono text-[11px] border focus:outline-none truncate select-all ${
                            isDark
                              ? 'bg-[#080e1c] border-slate-700 text-emerald-300'
                              : 'bg-slate-100 border-slate-300 text-emerald-800'
                          }`}
                        />
                        <button
                          type="button"
                          id="btn-copy-pix-code"
                          onClick={handleCopyPix}
                          className={`px-4 py-2.5 rounded-xl font-black text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                            copiedPix
                              ? 'bg-emerald-500 text-slate-950 shadow-md'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {copiedPix ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Real-time Status Radar (5s checking) */}
                    <div
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark
                          ? 'bg-[#081124] border-emerald-900/50 text-slate-300'
                          : 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            Aguardando confirmação do pagamento...
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Assim que você transferir no banco, a tela aprova automaticamente.
                          </span>
                        </div>
                      </div>

                      {isCheckingStatus && (
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

