import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Wrench,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Store,
  Layers,
  Receipt,
  Smartphone,
  CreditCard,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Mail,
  Sun,
  Moon,
  Users,
  KeyRound,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Employee, SubscriptionPlanInfo, GoogleUserProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { AccountRecoveryModal } from './AccountRecoveryModal';
import { GoogleDriveBackupService } from '../../services/googleDriveBackupService';

interface LoginViewProps {
  onLoginSuccess: (result: {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess?: boolean;
    isExpiredOrCanceled?: boolean;
  }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualGoogleModal, setShowManualGoogleModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // List of saved/remembered accounts on this device
  const [savedAccounts, setSavedAccounts] = useState<GoogleUserProfile[]>(() =>
    StorageService.getSavedAccounts()
  );

  // Process login with user profile data & Drive sync
  const processGoogleLogin = async (profile: GoogleUserProfile, token?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      if (token) {
        GoogleDriveBackupService.setAccessToken(token);
      }
      const result = StorageService.loginWithGoogle(profile);
      setSavedAccounts(StorageService.getSavedAccounts());

      // If token is present, attempt automatic isolated restore or backup on login
      if (token) {
        try {
          if (!result.isFirstAccess) {
            // Backup fresh state to user's Google Drive
            GoogleDriveBackupService.uploadBackupToGoogleDrive(profile.email, token).catch(console.warn);
          } else {
            // First access on this device: check if existing backup in Google Drive
            GoogleDriveBackupService.restoreBackupFromGoogleDrive(profile.email, token).catch(console.warn);
          }
        } catch (e) {
          console.warn('Drive sync background warning:', e);
        }
      }

      onLoginSuccess(result);
    } catch (err) {
      console.error('Erro ao processar login:', err);
      setError('Ocorreu um erro ao processar seu login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth hook - configured with prompt: 'select_account' to allow choosing existing accounts and Drive scopes
  const handleGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        const accessToken = tokenResponse.access_token;
        GoogleDriveBackupService.setAccessToken(accessToken);

        // Fetch user profile from Google API
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Falha ao obter dados da conta Google');
        }

        const data = await res.json();
        const profile: GoogleUserProfile = {
          email: data.email || 'usuario@gmail.com',
          name: data.name || data.given_name || 'Usuário Google',
          picture: data.picture,
          sub: data.sub,
        };

        await processGoogleLogin(profile, accessToken);
      } catch (err: any) {
        console.warn('Falha na requisição ao endpoint do Google:', err);
        // Fallback to manual selection modal
        setShowManualGoogleModal(true);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Google Login Error:', err);
      // If blocked by iframe or browser restrictions, offer account modal
      setShowManualGoogleModal(true);
    },
    // CRITICAL: Forces Google to show the account picker so the client can pick between multiple Google accounts
    prompt: 'select_account',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
  });

  const handleDemoLogin = () => {
    setIsLoading(true);
    try {
      const result = StorageService.loginAsDemo();
      onLoginSuccess({
        user: result.user,
        plan: result.plan,
        isFirstAccess: false,
        isExpiredOrCanceled: false,
      });
    } catch (err) {
      setError('Erro ao iniciar modo demonstrativo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Informe um e-mail Google válido (ex: seuemail@gmail.com)');
      return;
    }

    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];

    const profile: GoogleUserProfile = {
      email: cleanEmail,
      name: cleanName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=ffffff&size=128`,
    };

    setShowManualGoogleModal(false);
    processGoogleLogin(profile);
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    StorageService.removeSavedAccount(email);
    setSavedAccounts(StorageService.getSavedAccounts());
  };

  return (
    <div
      id="login-landing-container"
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        isDark ? 'bg-[#040814] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Floating Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/30">
            <Wrench className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                MSP INFORMÁTICA
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                v2.5 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Sistema de Gestão & Ordens de Serviço
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-nav-recover-account"
            onClick={() => setShowRecoveryModal(true)}
            className={`hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isDark
                ? 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-500/30'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span>Recuperar Conta</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-400 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-blue-600 border-slate-200 shadow-xs'
            }`}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            id="btn-login-demo-top"
            onClick={handleDemoLogin}
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isDark
                ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Acesso Rápido Demo</span>
          </button>
        </div>
      </header>

      {/* Hero Presentation & Login Card */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 relative z-10">
        {/* Left Column: Software Showcase & Highlights */}
        <div className="flex-1 space-y-6 text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Plataforma Oficial para Assistências Técnicas & Lojas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Controle total de suas{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Ordens de Serviço
            </span>
            , Estoque e Frente de Caixa.
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            O <strong>MSP Informática</strong> foi desenvolvido sob medida para assistências técnicas de celulares, computadores, eletrônicos e revendas. Escolha sua conta Google ou recupere seu acesso para começar com <strong>7 dias grátis</strong>.
          </p>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-[#081226]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Ordens de Serviço</h4>
                <p className="text-[11px] text-slate-400">Laudo técnico, fotos, checklist e status em tempo real.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-[#081226]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Frente de Caixa (PDV)</h4>
                <p className="text-[11px] text-slate-400">Vendas rápidas, leitor de código de barras e emissão de recibo.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-[#081226]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Contas a Receber ("A Prazo")</h4>
                <p className="text-[11px] text-slate-400">Carnê de clientes, pagamentos parciais e juros automáticos.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-[#081226]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">PIX Dinâmico Oficial</h4>
                <p className="text-[11px] text-slate-400">Integração Mercado Pago com QR Code e liberação instantânea.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Google Sign-In & Accounts Card */}
        <div className="w-full max-w-md shrink-0">
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all ${
              isDark
                ? 'bg-[#060d1f] border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)]'
                : 'bg-white border-cyan-300 shadow-xl'
            }`}
          >
            {/* Top Glow Accent */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Header Box */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>7 Dias Grátis no 1º Acesso</span>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-white dark:text-white">
                  Acessar Sistema
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Escolha sua conta Google ou selecione uma conta existente para entrar.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Saved Accounts Quick Picker (If exists) */}
              {savedAccounts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Contas Existentes Neste Dispositivo:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualGoogleModal(true)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                    >
                      + Outra Conta
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {savedAccounts.map((acc) => (
                      <div
                        key={acc.email}
                        onClick={() => processGoogleLogin(acc)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer group ${
                          isDark
                            ? 'bg-[#08152e] hover:bg-[#0c1f44] border-cyan-500/30 hover:border-cyan-400'
                            : 'bg-slate-50 hover:bg-cyan-50 border-slate-200 hover:border-cyan-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={acc.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}`}
                            alt={acc.name}
                            className="w-8 h-8 rounded-xl object-cover shrink-0 border border-cyan-500/40"
                          />
                          <div className="min-w-0 text-left">
                            <h4 className="text-xs font-bold truncate group-hover:text-cyan-400 transition-colors">
                              {acc.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Entrar
                          </span>
                          {savedAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveAccount(e, acc.email)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded"
                              title="Remover da lista rápida"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                {/* 1. Main Google Sign-In Button (Opens Google Account Picker) */}
                <button
                  type="button"
                  id="btn-login-google-main"
                  onClick={() => handleGoogleOAuth()}
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 border-slate-200 shadow-lg shadow-white/10 flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>{isLoading ? 'Conectando...' : 'Escolher Conta Google'}</span>
                </button>

                {/* 2. Direct Account Recovery Button */}
                <button
                  type="button"
                  id="btn-trigger-account-recovery"
                  onClick={() => setShowRecoveryModal(true)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    isDark
                      ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-500/40'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recuperar Conta (Código / Gmail / Celular)</span>
                </button>

                <div className="relative py-1 flex items-center justify-center">
                  <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
                  <span className={`px-3 text-[10px] font-bold uppercase tracking-wider absolute ${
                    isDark ? 'bg-[#060d1f] text-slate-500' : 'bg-white text-slate-400'
                  }`}>
                    Ou teste agora
                  </span>
                </div>

                {/* 3. Secondary Demo / Test Button */}
                <button
                  type="button"
                  id="btn-login-demo-main"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Entrar como Demonstrativo / Teste</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              {/* Security & Guarantee Info */}
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Acesso protegido com autenticação oficial Google.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sem necessidade de cartão para os 7 primeiros dias.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Manual / Existing Google Account Selector Modal */}
      {showManualGoogleModal && (
        <div
          id="modal-manual-google-login"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowManualGoogleModal(false)}
        >
          <div
            className={`w-full max-w-md p-6 rounded-3xl border-2 shadow-2xl space-y-5 ${
              isDark ? 'bg-[#070e22] border-cyan-500/50 text-white' : 'bg-white border-blue-300 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Escolher ou Adicionar Conta</h3>
                <p className="text-xs text-slate-400">Digite seu e-mail do Google para vincular sua conta</p>
              </div>
            </div>

            {/* Saved Accounts if any exist */}
            {savedAccounts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Contas Salvas Neste Dispositivo:
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {savedAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setCustomEmail(acc.email);
                        setCustomName(acc.name);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                        customEmail === acc.email
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#040814] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block text-xs font-bold truncate">{acc.email}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{acc.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 shrink-0">Selecionar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleManualGoogleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">E-mail do Google:</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-[#030712] border border-cyan-500/40 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Nome do Usuário / Loja (Opcional):</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Carlos - Tech Cell"
                  className="w-full px-3.5 py-2.5 bg-[#030712] border border-cyan-500/40 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualGoogleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 cursor-pointer"
                >
                  Entrar com este E-mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Account Recovery Modal */}
      <AccountRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onRecoverySuccess={(result) => {
          setShowRecoveryModal(false);
          onLoginSuccess(result);
        }}
      />

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-800/40 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 MSP Informática — Gestão Especializada para Assistências Técnicas</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRecoveryModal(true)}
            className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>Recuperar Conta</span>
          </button>
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ambiente Seguro com Criptografia & Backup em Nuvem</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
