import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  Package,
  Check,
  Info
} from 'lucide-react';
import { prepareAccountForSave, CanonicalAccount } from '../../services/accountSchema';
import { PlanType } from '../../types';
import { AdminBackendService } from '../../services/adminBackendService';

interface ChangePlanModalProps {
  client: CanonicalAccount;
  onClose: () => void;
  onPlanChanged?: (updatedClient: CanonicalAccount) => void;
}

// Planos canônicos ativos do sistema
export interface AvailablePlanOption {
  id: PlanType;
  name: string;
  badge?: string;
  monthlyPrice: number;
  highlight?: boolean;
  tagline: string;
  modulesIncluded: string[];
  modulesExcluded?: string[];
  conditions: string;
}

export const SYSTEM_PLANS_LIST: AvailablePlanOption[] = [
  {
    id: 'PDV_VENDAS',
    name: 'Plano PDV & Vendas',
    badge: 'FRENTE DE CAIXA',
    monthlyPrice: 34.90,
    highlight: false,
    tagline: 'Exclusivo para vendas balcão, frente de caixa (PDV) e produtos.',
    modulesIncluded: [
      'Frente de Caixa (PDV) Rápido e Balcão',
      'Emissão de Recibos Térmicos (80mm/58mm)',
      'Controle de Estoque e Produtos',
      'Gestão de Clientes e Crediário / A Prazo',
      'Abertura, Sangria e Fechamento de Caixa',
      'Relatórios de Vendas e Faturamento'
    ],
    modulesExcluded: [
      'Sem Ordens de Serviço (OS)',
      'Sem Gestão de Aparelhos',
      'Sem Módulo de Revendedores'
    ],
    conditions: 'Cobrança mensal de R$ 34,90. O Gestor desativa os módulos de OS, Aparelhos e Revenda.'
  },
  {
    id: 'ASSISTENCIA',
    name: 'Plano Assistência Técnica',
    badge: 'MAIS POPULAR',
    monthlyPrice: 69.90,
    highlight: true,
    tagline: 'Solução completa para Assistência Técnica: OS, Aparelhos, Peças e PDV.',
    modulesIncluded: [
      'Ordens de Serviço Ilimitadas todo mês',
      'Gestão de Aparelhos, Equipamentos e IMEI',
      'Checklist de Entrada e Saída com Fotos',
      'Frente de Caixa (PDV) e Vendas Balcão',
      'Produtos, Peças e Estoque Ilimitados',
      'Controle Financeiro de Caixa e DRE'
    ],
    modulesExcluded: [
      'Sem Módulo de Revendedores/Atacado'
    ],
    conditions: 'Cobrança mensal de R$ 69,90. Todos os recursos de assistência técnica e vendas liberados.'
  },
  {
    id: 'REVENDA',
    name: 'Plano Completo + Revenda',
    badge: 'ATACADO & REVENDA',
    monthlyPrice: 79.90,
    highlight: false,
    tagline: 'Tudo da Assistência Técnica + Módulo de Revenda, Atacado e Consignados.',
    modulesIncluded: [
      'Tudo do Plano Assistência Técnica Incluso',
      'Módulo de Revendedores e Atacado Completo',
      'Tabela de Preços Varejo vs Atacado',
      'Controle Automático de Comissões',
      'Vendas Consignadas e Fechamento',
      'Ordens de Serviço e PDV Ilimitados'
    ],
    conditions: 'Cobrança mensal de R$ 79,90. 100% dos recursos do sistema habilitados.'
  },
  {
    id: 'TRIAL',
    name: 'Teste Grátis (7 Dias)',
    badge: 'AVALIAÇÃO',
    monthlyPrice: 0.00,
    highlight: false,
    tagline: 'Período promocional de teste com recursos 100% liberados.',
    modulesIncluded: [
      'Acesso total de avaliação a todos os módulos',
      'Ordens de Serviço e Aparelhos',
      'PDV Balcão e Estoque',
      'Revenda e Relatórios Financeiros'
    ],
    conditions: 'Período temporário de teste grátis (R$ 0,00).'
  }
];

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ client, onClose, onPlanChanged }) => {
  // Identificação do plano atual
  const currentPlanId: PlanType = (client.planoId || client.plano || '') as PlanType;
  const currentPlanName = client.planoNome || client.plano || '';
  const currentPrice = client.valorPlano !== undefined && client.valorPlano !== null ? Number(client.valorPlano) : (client.valorMensalidade !== undefined && client.valorMensalidade !== null ? Number(client.valorMensalidade) : (client.mensalidade !== undefined && client.mensalidade !== null ? Number(client.mensalidade) : 0));
  const currentVencimento = client.dataVencimento || client.vencimento || '';

  // Seleção inicial (aponta para o plano atual do usuário ou completo por padrão)
  const initialSelected = SYSTEM_PLANS_LIST.find(p => p.id === currentPlanId) || SYSTEM_PLANS_LIST[0];
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlanOption>(initialSelected);

  // Estados de confirmação, carregamento e mensagens
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const targetId = client.id || client.email || client.uid;
  const isChangingToSame = selectedPlan.id === currentPlanId && selectedPlan.monthlyPrice === currentPrice;

  const handleConfirmAndSave = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!targetId) {
        throw new Error('Identificador (ID/E-mail) da conta não encontrado.');
      }

      const isTrial = selectedPlan.id === 'TRIAL' || selectedPlan.name.toLowerCase().includes('teste') || selectedPlan.name.toLowerCase().includes('7 dias');
      const days = isTrial ? 7 : 30;
      const calcVencimento = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

      // Executa alteração no backend administrativo com Firebase Admin
      await AdminBackendService.changePlan({
        docId: targetId,
        uid: client.uid || (targetId.includes('@') ? '' : targetId),
        email: client.email || (targetId.includes('@') ? targetId : ''),
        planoId: selectedPlan.id,
        planoNome: selectedPlan.name,
        valorPlano: selectedPlan.monthlyPrice,
        dataVencimento: calcVencimento,
      });

      const updatedData: CanonicalAccount = {
        ...client,
        id: targetId,
        plano: selectedPlan.id,
        planoId: selectedPlan.id,
        planoNome: selectedPlan.name,
        planName: selectedPlan.name,
        valorPlano: selectedPlan.monthlyPrice,
        valorMensalidade: selectedPlan.monthlyPrice,
        mensalidade: selectedPlan.monthlyPrice,
        dataVencimento: calcVencimento,
        vencimento: calcVencimento,
        bloqueado: false,
        blocked: false,
        status: 'ativo',
        situacao: 'active',
      };

      setSuccessMessage(`Plano de "${client.nome || client.email}" alterado com sucesso para ${selectedPlan.name}!`);

      if (onPlanChanged) {
        onPlanChanged(updatedData);
      }

      onClose();

    } catch (err: any) {
      console.error('Erro ao atualizar plano no backend:', err);
      const msg = typeof err === 'string'
        ? (err === '[object Object]' ? 'Erro ao gravar alteração de plano no Firebase.' : err)
        : (err?.message && typeof err.message === 'string' && err.message !== '[object Object]')
        ? err.message
        : (err?.error && typeof err.error === 'string' && err.error !== '[object Object]')
        ? err.error
        : 'Erro ao gravar alteração de plano no Firebase.';
      setErrorMessage(msg);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-auto text-white flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Alterar Plano do Usuário</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  Firebase Sync
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Cliente: <span className="text-slate-200 font-semibold">{client.nome || client.name || client.empresa || 'Cliente'}</span> ({client.email})
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

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="m-5 mb-0 p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-5 mb-0 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Card: Plano Atual do Usuário */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              Plano Atual do Cliente
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div>
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {currentPlanName}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    ID: {currentPlanId}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    Valor Atual: <strong className="text-slate-200">R$ {currentPrice.toFixed(2)}/mês</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Vencimento: <strong className="text-slate-200">{currentVencimento || 'Preservado'}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  client.bloqueado ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${client.bloqueado ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  {client.bloqueado ? 'Conta Bloqueada' : 'Conta Ativa'}
                </span>
              </div>
            </div>
          </div>

          {/* Seção de Planos Disponíveis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Selecione o Novo Plano para o Cliente
              </label>
              <span className="text-[11px] text-slate-400">
                Dados oficiais do sistema Gestor
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SYSTEM_PLANS_LIST.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                const isCurrent = currentPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      if (!loading && !successMessage) {
                        setSelectedPlan(plan);
                        setIsConfirming(false);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      {/* Top bar with Badge & Selection */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Atual
                            </span>
                          )}
                        </div>

                        {plan.badge && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-300 border border-slate-700'
                          }`}>
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-slate-400 mb-3">
                        {plan.tagline}
                      </p>

                      {/* Included modules preview */}
                      <div className="space-y-1 mb-3 pt-2 border-t border-slate-800/80">
                        {plan.modulesIncluded.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                        {plan.modulesIncluded.length > 3 && (
                          <div className="text-[10px] text-slate-500 pl-4.5">
                            + {plan.modulesIncluded.length - 3} outros recursos liberados
                          </div>
                        )}
                        {plan.modulesExcluded && (
                          <div className="text-[10px] text-rose-400 pl-4.5 font-medium">
                            {plan.modulesExcluded.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Price and Select indicator */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
                      <div>
                        <span className="text-base font-black text-cyan-300">
                          {plan.monthlyPrice === 0 ? 'Grátis' : `R$ ${plan.monthlyPrice.toFixed(2)}`}
                        </span>
                        <span className="text-[11px] text-slate-400">/mês</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            Selecionado
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 hover:text-white font-semibold">
                            Escolher este
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destaque do Novo Plano Selecionado e Condições */}
          <div className="bg-cyan-950/20 border border-cyan-800/60 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Condições e Impacto da Alteração
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlan.conditions}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="text-slate-400">
                    Novo Valor a Salvar: <strong className="text-emerald-400 font-bold">R$ {selectedPlan.monthlyPrice.toFixed(2)}/mês</strong>
                  </span>
                  <span className="text-slate-400">
                    Vencimento: <strong className="text-slate-200 font-bold">{currentVencimento || 'Preservado (sem alteração)'}</strong>
                  </span>
                  <span className="text-slate-400">
                    Permissões do Gestor: <strong className="text-cyan-300 font-bold">Atualização em tempo real</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Etapa de Confirmação Obrigatória */}
          {isConfirming && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-600/70 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-200">
                    Confirmação de Alteração de Plano no Firebase
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você está prestes a alterar o plano do cliente <strong>"{client.nome || client.email}"</strong> de{' '}
                    <span className="text-slate-400 line-through">"{currentPlanName}" (R$ {currentPrice.toFixed(2)})</span> para{' '}
                    <strong className="text-cyan-300">"{selectedPlan.name}" (R$ {selectedPlan.monthlyPrice.toFixed(2)})</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    • O documento do usuário no Firebase (coleção <code className="text-cyan-400 font-mono">accounts</code>) será atualizado imediatamente.<br />
                    • A data de vencimento atual ({currentVencimento || 'vigente'}) será <strong>preservada</strong>.<br />
                    • O sistema Gestor receberá a atualização em tempo real, adaptando as abas e permissões instantaneamente.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 w-full sm:w-auto text-center sm:text-left">
            {!isChangingToSame ? (
              <span>
                Novo plano: <strong className="text-cyan-400">{selectedPlan.name}</strong> • R$ {selectedPlan.monthlyPrice.toFixed(2)}/mês
              </span>
            ) : (
              <span className="text-slate-500">
                Selecione um plano diferente para alterar
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {!isConfirming ? (
              <button
                type="button"
                disabled={loading || isChangingToSame || Boolean(successMessage)}
                onClick={() => setIsConfirming(true)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-900/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Avançar para Confirmação</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || Boolean(successMessage)}
                onClick={handleConfirmAndSave}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gravando no Firebase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Salvar no Firebase</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
