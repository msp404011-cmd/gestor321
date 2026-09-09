import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Settings,
  ArrowRight,
  RefreshCw,
  Store,
  Users,
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

  // Tabs: 'pix' | 'card'
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Loading & payment states
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedPlanInfo, setApprovedPlanInfo] = useState<SubscriptionPlanInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credit card form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  // Credentials config toggle
  const [showConfig, setShowConfig] = useState(false);
  const [tempPublicKey, setTempPublicKey] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Polling interval ref
  const pollingRef = useRef<any>(null);

  // Initialize credentials on open
  useEffect(() => {
    if (isOpen) {
      const creds = MercadoPagoService.getCredentials();
      setTempPublicKey(creds.publicKey);
      setTempAccessToken(creds.accessToken);
      setIsApproved(false);
      setApprovedPlanInfo(null);
      setErrorMessage(null);
      setCopiedPix(false);
      setStatusCheckCount(0);

      // Pre-fill card CPF with company CNPJ/CPF if available
      const company = StorageService.getCompanySettings();
      const doc = company?.cnpjCpf || company?.cnpj || '';
      if (doc) {
        setCardCpf(doc);
      }
      if (company?.commercialName) {
        setCardHolder(company.commercialName.toUpperCase());
      }

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

  // Start 5-second interval verification
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
          handlePaymentSuccess('pix', paymentId, planDef.monthlyPrice);
        }
      } catch (e) {
        setIsCheckingStatus(false);
      }
    }, 5000);
  };

  // Handle Payment Success (Immediate activation)
  const handlePaymentSuccess = (
    method: 'pix' | 'credit_card',
    paymentId: string,
    amount: number
  ) => {
    const updated = SubscriptionService.activatePlanWithPayment(normalizedPlan, {
      method,
      paymentId,
      amount,
      notes: `Assinatura ${planDef.name} confirmada via Mercado Pago (${method === 'pix' ? 'PIX' : 'Cartão'}).`,
    });

    setIsApproved(true);
    setApprovedPlanInfo(updated);
    onSuccess(updated);
  };

  // Copy PIX Code to clipboard
  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Process Credit Card
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      setErrorMessage('Por favor, preencha todos os campos do cartão de crédito.');
      return;
    }

    setIsProcessingCard(true);
    setErrorMessage(null);

    const [month, year] = cardExpiry.split('/');

    try {
      const result = await MercadoPagoService.processCardPayment({
        planType: normalizedPlan,
        planName: planDef.name,
        amount: planDef.monthlyPrice,
        cardNumber,
        cardHolderName: cardHolder,
        cardExpiryMonth: month || '12',
        cardExpiryYear: year ? (year.length === 2 ? `20${year}` : year) : '2028',
        securityCode: cardCvv,
        installments: 1,
        payer: {
          email: 'contato@assistencia.com.br',
          cpf: cardCpf || '19119119100',
        },
      });

      setIsProcessingCard(false);

      if (result.isApproved) {
        handlePaymentSuccess('credit_card', result.id, planDef.monthlyPrice);
      } else {
        setErrorMessage(result.error || 'Pagamento com cartão não autorizado. Verifique os dados ou pague via PIX.');
      }
    } catch (err: any) {
      setIsProcessingCard(false);
      setErrorMessage(err?.message || 'Falha ao processar cartão.');
    }
  };

  // Save custom credentials
  const handleSaveCredentials = () => {
    MercadoPagoService.saveCredentials(tempPublicKey, tempAccessToken);
    setConfigSavedNotice(true);
    setTimeout(() => {
      setConfigSavedNotice(false);
      setShowConfig(false);
      generatePix();
    }, 1500);
  };

  // Quick simulate approval button
  const handleForceApproveSimulated = () => {
    if (pixData?.paymentId) {
      MercadoPagoService.approveSimulatedPayment(pixData.paymentId);
      handlePaymentSuccess('pix', pixData.paymentId, planDef.monthlyPrice);
    }
  };

  if (!isOpen) return null;

  const credentials = MercadoPagoService.getCredentials();

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30 shrink-0">
              {normalizedPlan === 'TESTE_REAL' ? (
                <Zap className="w-6 h-6 text-white" />
              ) : normalizedPlan === 'LOJA' ? (
                <Store className="w-6 h-6 text-white" />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/30">
                  Mercado Pago Oficial
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Ativação Automática
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Checkout de Assinatura: {planDef.name}
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
                  Pagamento Aprovado com Sucesso!
                </span>
                <h4 className="text-2xl font-black tracking-tight mt-3">
                  Parabéns! O {planDef.name} está 100% Ativo.
                </h4>
                <p className={`text-xs mt-2 max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Sua assinatura mensal foi renovada por <strong>30 dias</strong> (até{' '}
                  {approvedPlanInfo?.expiryDate
                    ? new Date(approvedPlanInfo.expiryDate + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'próximo mês'}
                  ). Todos os limites e recursos foram liberados imediatamente!
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border max-w-md mx-auto text-left text-xs space-y-2 ${
                  isDark ? 'bg-[#0d172e] border-blue-900/60' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-400">Plano:</span>
                  <span className="font-black text-slate-200">{planDef.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Pago:</span>
                  <span className="font-black text-emerald-400">
                    {formatCurrency(planDef.monthlyPrice)}/mês
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="font-bold text-slate-200">
                    {approvedPlanInfo?.paymentMethod || 'Mercado Pago'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Código de Autorização:</span>
                  <span className="font-mono text-[11px] text-sky-400">
                    {approvedPlanInfo?.contractNumber || 'MP-OK'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-after-approval"
                onClick={onClose}
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
                    Plano Escolhido
                  </span>
                  <span className="text-base font-black tracking-tight">{planDef.name}</span>
                  <span className="text-xs text-slate-400 block">
                    {planDef.tagline}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Valor Mensal
                  </span>
                  <div className="flex items-baseline sm:justify-end gap-1">
                    <span className="text-2xl font-black text-sky-400">
                      {formatCurrency(planDef.monthlyPrice)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/mês</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR TABS */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  id="tab-payment-pix"
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-sky-600 text-white shadow-md'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>PIX (Instantâneo)</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Recomendado
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-payment-card"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-sky-600 text-white shadow-md'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>Cartão de Crédito</span>
                </button>
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
              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  {isLoadingPix ? (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-400" />
                      <p className="text-xs font-bold text-slate-400">
                        Gerando cobrança PIX no Mercado Pago...
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
                              alt="QR Code PIX Mercado Pago"
                              className="w-44 h-44 object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg">
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
                          <ol className="space-y-1.5 list-decimal list-inside text-slate-600 font-medium leading-relaxed">
                            <li>Abra o app do seu banco ou Mercado Pago.</li>
                            <li>Escolha pagar via <strong>PIX QR Code</strong> ou Copia e Cola.</li>
                            <li>Escaneie o código ou copie a chave abaixo.</li>
                            <li>A confirmação e ativação acontecem em segundos!</li>
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
                          <span>Código PIX Copia e Cola:</span>
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
                                ? 'bg-[#080e1c] border-slate-700 text-sky-300'
                                : 'bg-slate-100 border-slate-300 text-sky-800'
                            }`}
                          />
                          <button
                            type="button"
                            id="btn-copy-pix-code"
                            onClick={handleCopyPix}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                              copiedPix
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
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
                                <span>Copiar Código PIX</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Real-time Status Radar (5s checking) */}
                      <div
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isDark
                            ? 'bg-[#081124] border-sky-900/50 text-slate-300'
                            : 'bg-sky-50/70 border-sky-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">
                              Verificando aprovação bancária a cada 5s...
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {statusCheckCount > 0
                                ? `${statusCheckCount} consultas efetuadas • Aguardando pagamento`
                                : 'Aguardando transferência...'}
                            </span>
                          </div>
                        </div>

                        {isCheckingStatus && (
                          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                        )}
                      </div>

                      {/* Developer / Sandbox Quick Simulator Button */}
                      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          {pixData.isSimulation
                            ? '💡 Modo demonstração (chaves de teste ativas).'
                            : '⚡ Conectado à API do Mercado Pago.'}
                        </span>

                        <button
                          type="button"
                          id="btn-simulate-pix-approval"
                          onClick={handleForceApproveSimulated}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          🧪 Simular Confirmação Bancária Imediata
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* CREDIT CARD VIEW */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleCardSubmit} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor={`${baseId}-card-number`}
                      className={`text-xs font-bold block mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Número do Cartão de Crédito
                    </label>
                    <div className="relative">
                      <input
                        id={`${baseId}-card-number`}
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value
                            .replace(/\D/g, '')
                            .replace(/(\d{4})/g, '$1 ')
                            .trim();
                          setCardNumber(v);
                        }}
                        className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? 'bg-[#080e1c] border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${baseId}-card-holder`}
                      className={`text-xs font-bold block mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Nome Impresso no Cartão
                    </label>
                    <input
                      id={`${baseId}-card-holder`}
                      type="text"
                      required
                      placeholder="NOME COMO NO CARTAO"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className={`w-full py-2.5 px-3.5 rounded-xl border text-xs uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark
                          ? 'bg-[#080e1c] border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-1">
                      <label
                        htmlFor={`${baseId}-card-expiry`}
                        className={`text-xs font-bold block mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Validade
                      </label>
                      <input
                        id={`${baseId}-card-expiry`}
                        type="text"
                        required
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length >= 2) v = `${v.substring(0, 2)}/${v.substring(2, 4)}`;
                          setCardExpiry(v);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? 'bg-[#080e1c] border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="col-span-1">
                      <label
                        htmlFor={`${baseId}-card-cvv`}
                        className={`text-xs font-bold block mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        CVV
                      </label>
                      <input
                        id={`${baseId}-card-cvv`}
                        type="password"
                        required
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? 'bg-[#080e1c] border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="col-span-1">
                      <label
                        htmlFor={`${baseId}-card-cpf`}
                        className={`text-xs font-bold block mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        CPF Titular
                      </label>
                      <input
                        id={`${baseId}-card-cpf`}
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(e.target.value)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? 'bg-[#080e1c] border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-card-payment"
                    disabled={isProcessingCard}
                    className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingCard ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando Cobrança no Mercado Pago...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>
                          Pagar {formatCurrency(planDef.monthlyPrice)} e Ativar Imediatamente
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* COLLAPSIBLE CREDENTIALS ACCORDION */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Credenciais Mercado Pago: {credentials.isConfigured ? '🟢 Produção Ativa' : '🟡 Modo Demonstração'}
                  </span>
                  <span className="text-[11px] underline">
                    {showConfig ? 'Ocultar' : 'Configurar Chaves'}
                  </span>
                </button>

                {showConfig && (
                  <div
                    className={`mt-2 p-3.5 rounded-2xl border text-xs space-y-3 ${
                      isDark ? 'bg-[#070c18] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Insira suas credenciais reais de produção do Mercado Pago (ou preencha no arquivo <code>.env</code> com <code>VITE_MP_ACCESS_TOKEN</code>).
                    </p>

                    <div>
                      <label
                        htmlFor={`${baseId}-public-key`}
                        className="text-[11px] font-bold block mb-1 text-slate-300"
                      >
                        Public Key (VITE_MP_PUBLIC_KEY):
                      </label>
                      <input
                        id={`${baseId}-public-key`}
                        type="text"
                        placeholder="APP_USR-xxxxxx..."
                        value={tempPublicKey}
                        onChange={(e) => setTempPublicKey(e.target.value)}
                        className={`w-full py-1.5 px-3 rounded-lg font-mono text-[11px] border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${baseId}-access-token`}
                        className="text-[11px] font-bold block mb-1 text-slate-300"
                      >
                        Access Token de Produção (VITE_MP_ACCESS_TOKEN):
                      </label>
                      <input
                        id={`${baseId}-access-token`}
                        type="password"
                        placeholder="APP_USR-xxxxxx..."
                        value={tempAccessToken}
                        onChange={(e) => setTempAccessToken(e.target.value)}
                        className={`w-full py-1.5 px-3 rounded-lg font-mono text-[11px] border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {configSavedNotice ? (
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Salvo! Recarregando PIX...
                        </span>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={handleSaveCredentials}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Salvar e Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
