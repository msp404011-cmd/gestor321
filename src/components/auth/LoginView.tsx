import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Sparkles,
  Store,
  Receipt,
  CreditCard,
  AlertCircle,
  Mail,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Phone,
  Building2,
  User,
} from 'lucide-react';
import { Employee, SubscriptionPlanInfo } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

interface LoginViewProps {
  onLoginSuccess: (result: {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess?: boolean;
    isExpiredOrCanceled?: boolean;
  }) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form Fields - Register
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Form Fields - Forgot Password / Direct Reset
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // 1. Submit Login (Email + Password)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (!loginPassword) {
      setError('Por favor, digite sua senha.');
      return;
    }

    try {
      setIsLoading(true);
      const result = StorageService.loginWithEmailPassword({
        email: loginEmail,
        password: loginPassword,
      });

      setSuccessMsg('Login realizado com sucesso! Carregando sistema...');
      setTimeout(() => {
        onLoginSuccess(result);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique seus dados.');
      setIsLoading(false);
    }
  };

  // 2. Submit Register (Create Shop Account + 7 Days Free Trial)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regShopName.trim()) {
      setError('Informe o nome da sua assistência técnica ou loja.');
      return;
    }

    if (!regOwnerName.trim()) {
      setError('Informe o seu nome completo ou do responsável.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Informe um e-mail válido para a sua conta.');
      return;
    }

    if (regPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('As senhas digitadas não coincidem. Digite novamente.');
      return;
    }

    try {
      setIsLoading(true);
      const result = StorageService.registerUserAccount({
        shopName: regShopName,
        ownerName: regOwnerName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
      });

      setSuccessMsg('🎉 Conta criada com sucesso! 7 dias grátis ativados.');
      setTimeout(() => {
        onLoginSuccess({
          user: result.user,
          plan: result.plan,
          isFirstAccess: true,
        });
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente outro e-mail.');
      setIsLoading(false);
    }
  };

  // 3. Submit Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setError('Informe o e-mail cadastrado da sua conta.');
      return;
    }

    if (resetNewPassword.length < 4) {
      setError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    try {
      setIsLoading(true);
      StorageService.resetPasswordDirect({
        email: resetEmail,
        newPassword: resetNewPassword,
      });

      setSuccessMsg('Senha alterada com sucesso! Você já pode entrar com sua nova senha.');
      setTimeout(() => {
        setLoginEmail(resetEmail);
        setLoginPassword(resetNewPassword);
        setMode('login');
        setIsLoading(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
      setIsLoading(false);
    }
  };

  // 4. Demo Login Access
  const handleDemoLogin = () => {
    setIsLoading(true);
    try {
      const result = StorageService.loginAsDemo();
      onLoginSuccess(result);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
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
            <span>Acesso Demonstrativo</span>
          </button>
        </div>
      </header>

      {/* Hero Presentation & Login/Register Form */}
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
            O <strong>MSP Informática</strong> é o sistema completo para gestão de assistências de celulares, informática e revendas. Crie sua conta em menos de 1 minuto e ganhe <strong>7 dias de teste grátis</strong> sem compromisso.
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

        {/* Right Column: Direct Auth Card */}
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
              {/* Tabs Switcher: Entrar / Criar Conta */}
              {mode !== 'forgot_password' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#030712] rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    id="tab-btn-login"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Entrar</span>
                  </button>

                  <button
                    type="button"
                    id="tab-btn-register"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta</span>
                  </button>
                </div>
              )}

              {/* Title & Badge */}
              <div className="text-center space-y-1.5">
                {mode === 'register' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>7 Dias Grátis no Cadastro</span>
                  </div>
                )}

                <h3 className="text-2xl font-black tracking-tight text-white dark:text-white">
                  {mode === 'login' && 'Acessar Minha Conta'}
                  {mode === 'register' && 'Cadastrar Assistência'}
                  {mode === 'forgot_password' && 'Redefinir Minha Senha'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {mode === 'login' && 'Digite seu e-mail e senha para entrar no sistema.'}
                  {mode === 'register' && 'Preencha os dados da sua loja para iniciar seu teste grátis.'}
                  {mode === 'forgot_password' && 'Digite seu e-mail e defina uma nova senha de acesso.'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* --- 1. FORM DE LOGIN --- */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>E-mail:</span>
                    </label>
                    <input
                      type="email"
                      id="input-login-email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ex: contato@minhaloja.com"
                      className="w-full px-3.5 py-2.5 bg-[#030712] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Senha:</span>
                      </label>
                      <button
                        type="button"
                        id="btn-forgot-password-link"
                        onClick={() => {
                          setMode('forgot_password');
                          setError(null);
                          setSuccessMsg(null);
                          setResetEmail(loginEmail);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        id="input-login-password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 bg-[#030712] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-login"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Entrar no Sistema</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* --- 2. FORM DE CADASTRO / CRIAR CONTA --- */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nome da Loja / Assistência:</span>
                    </label>
                    <input
                      type="text"
                      id="input-reg-shop"
                      required
                      value={regShopName}
                      onChange={(e) => setRegShopName(e.target.value)}
                      placeholder="Ex: TechCell Celulares & Informática"
                      className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Seu Nome (Responsável):</span>
                    </label>
                    <input
                      type="text"
                      id="input-reg-owner"
                      required
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>E-mail:</span>
                      </label>
                      <input
                        type="email"
                        id="input-reg-email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="contato@loja.com"
                        className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp / Telefone:</span>
                      </label>
                      <input
                        type="tel"
                        id="input-reg-phone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Criar Senha:</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="input-reg-password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 4 dígitos"
                        className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirmar Senha:</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="input-reg-password-confirm"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3 py-2 bg-[#030712] border border-slate-700 focus:border-emerald-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRegPassword ? 'Ocultar Senhas' : 'Ver Senhas'}</span>
                    </button>
                    <span className="text-emerald-400 font-bold">✓ Teste Grátis de 7 Dias</span>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-register"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Criando sua conta...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Criar Conta & Iniciar Teste Grátis</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* --- 3. FORM DE REDEFINIÇÃO DE SENHA DIRETA --- */}
              {mode === 'forgot_password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      <span>E-mail da sua conta:</span>
                    </label>
                    <input
                      type="email"
                      id="input-reset-email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="ex: contato@minhaloja.com"
                      className="w-full px-3.5 py-2.5 bg-[#030712] border border-slate-700 focus:border-purple-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Nova Senha:</span>
                    </label>
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      id="input-reset-new-password"
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Digite a nova senha (mínimo 4 dígitos)"
                      className="w-full px-3.5 py-2.5 bg-[#030712] border border-slate-700 focus:border-purple-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Confirmar Nova Senha:</span>
                    </label>
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      id="input-reset-confirm-password"
                      required
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3.5 py-2.5 bg-[#030712] border border-slate-700 focus:border-purple-400 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-reset-password"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Redefinindo Senha...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Salvar Nova Senha</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                    >
                      ← Voltar para a tela de Login
                    </button>
                  </div>
                </form>
              )}

              {/* Demo Mode Action Divider */}
              <div className="relative py-1 flex items-center justify-center">
                <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
                <span className={`px-3 text-[10px] font-bold uppercase tracking-wider absolute ${
                  isDark ? 'bg-[#060d1f] text-slate-500' : 'bg-white text-slate-400'
                }`}>
                  Ou experimente agora
                </span>
              </div>

              {/* Secondary Demo / Test Button */}
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

              {/* Security & Guarantee Info */}
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Acesso individual e banco de dados 100% isolado por loja.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sem necessidade de cartão de crédito para os 7 dias grátis.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800/40">
        MSP Informática &copy; {new Date().getFullYear()} — Plataforma Especializada para Assistências Técnicas e Lojas de Eletrônicos.
      </footer>
    </div>
  );
};
