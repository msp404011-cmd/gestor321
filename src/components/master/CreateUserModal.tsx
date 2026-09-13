import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  Calendar,
  DollarSign,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { AdminAuthService, CreatedUserResult } from '../../services/adminAuthService';
import { SYSTEM_PLANS_LIST, AvailablePlanOption } from './ChangePlanModal';

interface CreateUserModalProps {
  onClose: () => void;
  onUserCreated?: (result: CreatedUserResult) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onUserCreated }) => {
  // Estado do formulário
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [telefone, setTelefone] = useState('');

  // Plano selecionado
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlanOption>(SYSTEM_PLANS_LIST[0]);
  const [valorCustom, setValorCustom] = useState<number>(SYSTEM_PLANS_LIST[0].monthlyPrice);

  // Data de vencimento inicial (30 dias ou 7 dias para teste)
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [dataVencimento, setDataVencimento] = useState(defaultDueDate());

  // Status inicial (ativo ou bloqueado)
  const [isBlocked, setIsBlocked] = useState(false);

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<CreatedUserResult | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // Atualiza valor e vencimento sugerido ao trocar o plano
  const handleSelectPlan = (plan: AvailablePlanOption) => {
    setSelectedPlan(plan);
    setValorCustom(plan.monthlyPrice);

    const d = new Date();
    if (plan.id === 'TRIAL') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 30);
    }
    setDataVencimento(d.toISOString().split('T')[0]);
  };

  // Formatação de telefone / WhatsApp
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setTelefone(formatted);
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações
    if (!nome.trim()) {
      setErrorMsg('Informe o nome completo do responsável/usuário.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha inicial deve conter pelo menos 6 caracteres.');
      return;
    }

    if (!dataVencimento) {
      setErrorMsg('Selecione uma data de vencimento válida.');
      return;
    }

    try {
      setLoading(true);

      const result = await AdminAuthService.adminCreateUser({
        nome: nome.trim(),
        empresa: empresa.trim() || nome.trim(),
        email: cleanEmail,
        password: password,
        telefone: telefone.trim(),
        planoId: selectedPlan.id,
        planoNome: selectedPlan.name,
        valorPlano: Number(valorCustom),
        dataVencimento: dataVencimento,
        bloqueado: isBlocked,
      });

      setCreatedResult(result);
      if (onUserCreated) {
        onUserCreated(result);
      }
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setErrorMsg(err.message || 'Erro inesperado ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-white flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Criar Nova Conta de Usuário</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  Auth + Firestore
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Cria o login real no Firebase Authentication e inicializa o documento no Firestore com o UID.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback de Erro */}
        {errorMsg && (
          <div className="m-5 mb-0 p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-3 animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* SE O USUÁRIO FOI CRIADO: TELA DE SUCESSO E DADOS DE CONFERÊNCIA */}
        {createdResult ? (
          <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-600/80 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-300">
                  Usuário criado com sucesso.
                </h3>
                <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                  A conta foi devidamente provisionada no <strong>Firebase Authentication</strong> e o documento correspondente foi criado no <strong>Firestore</strong> utilizando o UID exato do usuário.
                </p>
              </div>
            </div>

            {/* Painel de Conferência de Dados Não Sensíveis */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Dados da Conta para Conferência
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Nome do Responsável</div>
                  <div className="text-sm font-bold text-white mt-0.5">{createdResult.nome}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Loja / Empresa</div>
                  <div className="text-sm font-bold text-white mt-0.5">{createdResult.empresa}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">E-mail de Acesso</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{createdResult.email}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Status Inicial</div>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      createdResult.status === 'Ativo'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${createdResult.status === 'Ativo' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {createdResult.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Plano Atribuído</div>
                  <div className="text-sm font-bold text-white mt-0.5">{createdResult.planoNome}</div>
                  <div className="text-[11px] text-cyan-400 font-semibold">R$ {createdResult.valorPlano.toFixed(2)}/mês</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Data de Vencimento</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{createdResult.dataVencimento}</div>
                </div>
              </div>

              {/* UID do Firebase Authentication */}
              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                    Firebase Auth UID (Identificador Único no Firestore)
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-0.5 select-all break-all">
                    {createdResult.uid}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(createdResult.uid)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar UID</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                • O usuário já aparece na listagem do Painel em tempo real.<br />
                • O usuário já pode efetuar login diretamente na tela de acesso do Gestor utilizando o e-mail e a senha inicial cadastrados.
              </p>
            </div>

            {/* Ações da Tela de Sucesso */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin">
            
            {/* Bloco 1: Dados Pessoais e Empresa */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                Dados do Responsável e Estabelecimento
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Loja / Assistência
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Ex: Silva Cell Assistência"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Credenciais de Acesso (Auth) */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                Credenciais de Acesso (Firebase Authentication)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail de Login <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha Inicial <span className="text-rose-400">*</span> (mínimo 6 dígitos)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Segurança: Gerenciada pelo Firebase Auth. Nunca salva em texto puro.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Seleção do Plano do Sistema */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Plano e Assinatura
                </div>
                <span className="text-[11px] text-cyan-400">
                  {selectedPlan.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SYSTEM_PLANS_LIST.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400 shadow-md shadow-cyan-900/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white leading-tight">
                            {plan.name}
                          </span>
                          {plan.badge && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                          {plan.tagline}
                        </p>
                      </div>

                      <div className="text-xs font-black text-cyan-300 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                        <span>{plan.monthlyPrice === 0 ? 'Grátis' : `R$ ${plan.monthlyPrice.toFixed(2)}`}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Valores e Vencimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Mensal da Assinatura (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorCustom}
                      onChange={(e) => setValorCustom(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Vencimento <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4: Status Inicial da Conta */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Status Inicial da Conta</div>
                <div className="text-[11px] text-slate-400">
                  {isBlocked ? 'A conta será criada com status Bloqueado (sem acesso).' : 'A conta será criada com status Ativo (acesso liberado).'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlocked(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isBlocked ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setIsBlocked(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isBlocked ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Bloqueado
                </button>
              </div>
            </div>

            {/* Footer do formulário */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-900/40 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Criando no Firebase...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta no Firebase</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
