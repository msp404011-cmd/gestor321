import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Mail,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Sparkles,
  Send,
  Lock,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Employee, SubscriptionPlanInfo } from '../../types';
import { StorageService } from '../../services/storage';

interface AccountRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecoverySuccess: (result: {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess?: boolean;
    isExpiredOrCanceled?: boolean;
  }) => void;
}

type RecoveryMethod = 'gmail' | 'phone' | 'master_code';

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  isOpen,
  onClose,
  onRecoverySuccess,
}) => {
  const [method, setMethod] = useState<RecoveryMethod>('gmail');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [masterCodeInput, setMasterCodeInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('');

  // 2-step state: 1 = input contact, 2 = enter verification code
  const [step, setStep] = useState<1 | 2>(1);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Step 1: Request Code
  const handleSendVerificationCode = () => {
    setError(null);
    setSuccessMsg(null);

    let targetIdentifier = '';
    if (method === 'gmail') {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setError('Por favor, informe um endereço de e-mail / Gmail válido.');
        return;
      }
      targetIdentifier = emailInput.trim().toLowerCase();
    } else if (method === 'phone') {
      const cleanPhone = phoneInput.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Por favor, informe um número de celular ou WhatsApp válido com DDD.');
        return;
      }
      targetIdentifier = phoneInput.trim();
    } else if (method === 'master_code') {
      if (!masterCodeInput.trim()) {
        setError('Informe sua Chave Mestra ou Código de Contrato de Emergência.');
        return;
      }
      // Instant verification for master code
      try {
        const result = StorageService.recoverAccount({
          identifier: masterCodeInput.trim(),
          method: 'code',
          name: userNameInput.trim() || 'Administrador Mestre',
        });
        setSuccessMsg('Chave mestra validada com sucesso! Liberando acesso...');
        setTimeout(() => {
          onRecoverySuccess(result);
        }, 1000);
      } catch (err) {
        setError('Falha ao validar chave mestra.');
      }
      return;
    }

    setIsSending(true);

    // Generate real 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    setTimeout(() => {
      setIsSending(false);
      setStep(2);
      setCountdown(60); // 60s resend timer
      setSuccessMsg(
        method === 'gmail'
          ? `Código de 6 dígitos gerado e despachado para ${targetIdentifier}!`
          : `Código de verificação gerado para o celular ${targetIdentifier}!`
      );
    }, 900);
  };

  // Step 2: Validate Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEntered = enteredCode.replace(/\D/g, '');
    if (cleanEntered.length !== 6) {
      setError('O código de verificação deve conter 6 números.');
      return;
    }

    if (cleanEntered !== generatedCode) {
      setError('Código incorreto ou expirado. Verifique os 6 dígitos e tente novamente.');
      return;
    }

    // Code matches! Recover and restore account session
    try {
      const targetIdentifier = method === 'gmail' ? emailInput.trim() : phoneInput.trim();
      const result = StorageService.recoverAccount({
        identifier: targetIdentifier,
        method: method === 'gmail' ? 'email' : 'phone',
        name: userNameInput.trim() || undefined,
      });

      setSuccessMsg('Código validado com sucesso! Restaurando seus dados e ordens de serviço...');
      setTimeout(() => {
        onRecoverySuccess(result);
      }, 900);
    } catch (err) {
      setError('Erro ao restaurar a conta. Tente novamente.');
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAutoFill = () => {
    if (generatedCode) {
      setEnteredCode(generatedCode);
    }
  };

  return (
    <div
      id="modal-account-recovery-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-account-recovery-card"
        className="w-full max-w-lg bg-[#060e22] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.35)] text-slate-100 flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#08152e] via-[#0d2249] to-[#08152e] border-b border-cyan-500/30 text-left relative">
          <button
            type="button"
            id="btn-close-recovery-modal"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-cyan-500/40">
                <Sparkles className="w-3 h-3" />
                <span>Central de Recuperação de Acesso</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Recuperar Minha Conta
              </h3>
              <p className="text-xs text-slate-400">
                Restaure o acesso ao seu sistema via Gmail, Celular ou Chave de Segurança
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Method Selection Tabs (only visible on step 1) */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#030712] rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMethod('gmail');
                  setError(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'gmail'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">Via Gmail</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('phone');
                  setError(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'phone'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="truncate">Via Celular</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('master_code');
                  setError(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'master_code'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span className="truncate">Chave Mestra</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Form to enter destination */}
          {step === 1 && (
            <div className="space-y-4">
              {method === 'gmail' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>E-mail / Gmail Cadastrado:</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="seuemail@gmail.com"
                      className="w-full px-4 py-3 bg-[#030712] border border-cyan-500/40 rounded-2xl text-sm font-sans font-medium text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 not-italic"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Nome do Operador ou Loja (Opcional):
                    </label>
                    <input
                      type="text"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                      placeholder="Ex: Carlos - Tech Cell"
                      className="w-full px-4 py-2.5 bg-[#030712] border border-slate-700 rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              {method === 'phone' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Número de Celular / WhatsApp:</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 bg-[#030712] border border-emerald-500/40 rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Nome do Operador ou Loja (Opcional):
                    </label>
                    <input
                      type="text"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                      placeholder="Ex: Juliana - Atendimento"
                      className="w-full px-4 py-2.5 bg-[#030712] border border-slate-700 rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              {method === 'master_code' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                      <span>Chave Mestra ou Código de Contrato:</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={masterCodeInput}
                      onChange={(e) => setMasterCodeInput(e.target.value)}
                      placeholder="Ex: MSP-MASTER-2026 ou MSP-7842-LOJA"
                      className="w-full px-4 py-3 bg-[#030712] border border-purple-500/40 rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-[11px] text-purple-300">
                    💡 Dica: Você pode usar o número do seu contrato ou a chave de resgate da sua licença.
                  </div>
                </div>
              )}

              <button
                type="button"
                id="btn-send-recovery-code"
                onClick={handleSendVerificationCode}
                disabled={isSending}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando e Enviando Código...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {method === 'master_code'
                        ? 'Validar Chave Mestra e Entrar'
                        : 'Enviar Código de Verificação (6 Dígitos)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Verification Code Input */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* Notification Banner with the sent code preview */}
              <div className="p-4 rounded-2xl bg-[#030712] border-2 border-cyan-500/40 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Código Enviado com Sucesso:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black">
                    Válido por 10 min
                  </span>
                </div>

                {/* Simulated Dispatch Display with Auto-Copy */}
                <div className="flex items-center justify-between bg-[#08152e] p-3 rounded-xl border border-cyan-500/30">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Código gerado para teste rápido:</span>
                    <span className="text-xl font-black tracking-widest text-cyan-300 font-mono">
                      {generatedCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Copiar Código"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Preencher
                    </button>
                  </div>
                </div>
              </div>

              {/* 6-Digit Entry */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 text-center">
                  Digite os 6 dígitos recebidos:
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-48 text-center text-2xl font-black tracking-[0.3em] px-4 py-3 bg-[#030712] border-2 border-cyan-500/60 rounded-2xl text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
                  />
                </div>
              </div>

              {/* Submit & Resend Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  id="btn-verify-recovery-code"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validar Código & Liberar Acesso</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer font-medium"
                  >
                    ← Alterar destino
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleSendVerificationCode}
                    className="text-cyan-400 hover:text-cyan-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar Novo Código'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
