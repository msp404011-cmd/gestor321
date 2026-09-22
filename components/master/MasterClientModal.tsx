import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Save, 
  Calendar, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Layers,
  Sparkles,
  Phone,
  Mail,
  User,
  Clock
} from 'lucide-react';
import { CanonicalAccount } from '../../services/accountSchema';
import { PlanType } from '../../types';
import { DeleteUserModal } from './DeleteUserModal';
import { AdminBackendService } from '../../services/adminBackendService';

interface MasterClientModalProps {
  client: any;
  onClose: () => void;
}

// Lista limpa dos planos comercializados no sistema
const AVAILABLE_SYSTEM_PLANS: Array<{
  id: PlanType;
  name: string;
  price: number;
  badge?: string;
  description: string;
}> = [
  {
    id: 'PDV_VENDAS',
    name: 'Plano PDV & Vendas',
    price: 34.90,
    badge: 'PDV / CAIXA',
    description: 'Frente de caixa balcão, vendas, produtos, clientes e caixa'
  },
  {
    id: 'ASSISTENCIA',
    name: 'Plano Assistência Técnica',
    price: 69.90,
    badge: 'MAIS POPULAR',
    description: 'Ordens de serviço ilimitadas, aparelhos, checklist e PDV'
  },
  {
    id: 'REVENDA',
    name: 'Plano Completo + Revenda',
    price: 79.90,
    badge: 'ATACADO & REVENDA',
    description: 'Tudo da Assistência Técnica + Revendedores, atacado e comissões'
  },
  {
    id: 'TRIAL',
    name: 'Teste Grátis (7 Dias)',
    price: 0.00,
    badge: '7 DIAS',
    description: 'Período de avaliação com recursos liberados'
  }
];

export const MasterClientModal: React.FC<MasterClientModalProps> = ({ client, onClose }) => {
  const [formData, setFormData] = useState({
    planoId: client.planoId || client.plano || '',
    planoNome: client.planoNome || client.plano || '',
    valorMensalidade: client.valorPlano !== undefined && client.valorPlano !== null ? Number(client.valorPlano) : (client.valorMensalidade !== undefined && client.valorMensalidade !== null ? Number(client.valorMensalidade) : (client.mensalidade !== undefined && client.mensalidade !== null ? Number(client.mensalidade) : 0)),
    status: (client.bloqueado ? 'bloqueado' : client.status || 'ativo') as 'ativo' | 'bloqueado' | 'vencido',
    dataVencimento: client.dataVencimento || client.vencimento || ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Dialog de confirmação para ações de alto impacto (Bloquear, Desbloquear, Excluir, Alterar Plano)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'block' | 'unblock' | 'delete' | 'save_plan';
    title: string;
    message: string;
    confirmText: string;
    confirmButtonClass: string;
  } | null>(null);

  const targetId = client.id || client.email || client.uid;
  const isCurrentlyBlocked = client.bloqueado === true || client.blocked === true || client.status === 'bloqueado';

  // Seleciona um dos planos disponíveis no sistema e atualiza nome e valor automaticamente
  const handleSelectPlan = (plan: typeof AVAILABLE_SYSTEM_PLANS[0]) => {
    const days = plan.id === 'TRIAL' ? 7 : 30;
    const calcVencimento = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      planoId: plan.id,
      planoNome: plan.name,
      valorMensalidade: plan.price,
      dataVencimento: calcVencimento
    }));
  };

  // Executa salvamento real após confirmação
  const executeSavePlan = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!targetId) throw new Error('Identificador (ID ou E-mail) do cliente não encontrado.');

      await AdminBackendService.updateUser({
        docId: targetId,
        uid: client.uid || (targetId.includes('@') ? '' : targetId),
        email: client.email || (targetId.includes('@') ? targetId : ''),
        planoId: formData.planoId,
        planoNome: formData.planoNome,
        valorPlano: Number(formData.valorMensalidade),
        status: formData.status,
        dataVencimento: formData.dataVencimento,
      });

      setSuccessMsg('Plano e dados atualizados com sucesso no Firebase!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err);
      setErrorMsg(err.message || 'Erro ao salvar alterações no Firebase.');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar confirmação antes de salvar alterações do plano/dados
  const handleSave = () => {
    const isPlanChange = formData.planoId !== client.planoId || formData.planoNome !== client.planoNome;
    const planChangeDesc = isPlanChange 
      ? `Você está alterando o plano de "${client.planoNome || client.plano || 'Atual'}" para "${formData.planoNome}" com valor de R$ ${Number(formData.valorMensalidade).toFixed(2)}/mês.`
      : `Confirma a atualização dos dados cadastrais e vencimento (${formData.dataVencimento || 'Preservado'}) no Firebase?`;

    setConfirmDialog({
      isOpen: true,
      type: 'save_plan',
      title: isPlanChange ? 'Confirmar Alteração de Plano?' : 'Confirmar Atualização de Dados?',
      message: `${planChangeDesc} Esta alteração será gravada diretamente no Firebase e sincronizada com o Gestor em tempo real.`,
      confirmText: 'Sim, Salvar no Firebase',
      confirmButtonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white'
    });
  };

  // Solicitar confirmação para Bloquear
  const promptBlock = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'block',
      title: 'Bloquear Usuário?',
      message: `Tem certeza que deseja bloquear o acesso de "${client.nome || client.name || client.email}"? O usuário terá seu acesso imediatamente interrompido e uma tela de bloqueio será exibida no Gestor.`,
      confirmText: 'Sim, Bloquear Usuário',
      confirmButtonClass: 'bg-rose-600 hover:bg-rose-500 text-white'
    });
  };

  // Solicitar confirmação para Desbloquear
  const promptUnblock = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'unblock',
      title: 'Desbloquear Usuário?',
      message: `Deseja reativar o acesso de "${client.nome || client.name || client.email}"? O usuário poderá voltar a acessar normalmente o sistema Gestor.`,
      confirmText: 'Sim, Desbloquear e Ativar',
      confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    });
  };

  // Solicitar confirmação para Excluir (Abre Modal com 2 confirmações e exclusão real)
  const promptDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // Execução após confirmação no diálogo
  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    const { type } = confirmDialog;
    setConfirmDialog(null);

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!targetId) throw new Error('Identificador do cliente não encontrado.');

      if (type === 'delete') {
        await AdminBackendService.deleteUser({
          docId: targetId,
          uid: client.uid || (targetId.includes('@') ? '' : targetId),
          email: client.email || (targetId.includes('@') ? targetId : ''),
        });
        onClose();
        return;
      }

      if (type === 'save_plan') {
        await executeSavePlan();
        return;
      }

      if (type === 'block') {
        await AdminBackendService.toggleBlock({
          docId: targetId,
          uid: client.uid || (targetId.includes('@') ? '' : targetId),
          email: client.email || (targetId.includes('@') ? targetId : ''),
          block: true,
          reason: 'Bloqueio aplicado pelo Painel Master',
        });

        setFormData(prev => ({ ...prev, status: 'bloqueado' }));
        setSuccessMsg('Usuário bloqueado com sucesso no Firebase!');
        setTimeout(() => onClose(), 1000);
      } else if (type === 'unblock') {
        await AdminBackendService.toggleBlock({
          docId: targetId,
          uid: client.uid || (targetId.includes('@') ? '' : targetId),
          email: client.email || (targetId.includes('@') ? targetId : ''),
          block: false,
          reason: 'Conta desbloqueada pelo Master Admin',
        });

        setFormData(prev => ({ ...prev, status: 'ativo' }));
        setSuccessMsg('Usuário desbloqueado com sucesso! Acesso restaurado.');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      console.error('Erro na ação:', err);
      setErrorMsg(err.message || 'Erro ao processar solicitação no Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="master-client-modal-overlay"
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="master-client-modal-card"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-white shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
              formData.status === 'bloqueado'
                ? 'bg-rose-950 border border-rose-600 text-rose-300'
                : 'bg-cyan-950 border border-cyan-500 text-cyan-300'
            }`}>
              {formData.status === 'bloqueado' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <User className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Gerenciar Cliente
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  formData.status === 'bloqueado'
                    ? 'bg-rose-900/60 border-rose-600 text-rose-300'
                    : formData.status === 'vencido'
                    ? 'bg-amber-900/60 border-amber-600 text-amber-300'
                    : 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                }`}>
                  {formData.status === 'bloqueado' ? 'BLOQUEADO' : formData.status === 'vencido' ? 'VENCIDO' : 'ATIVO'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{client.nome || client.name || 'Cliente'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-mono">{client.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Banner Ação Rápida de Bloqueio/Desbloqueio com destaque visual */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            formData.status === 'bloqueado'
              ? 'bg-rose-950/30 border-rose-800/80'
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-0.5">
                Controle de Acesso ao Gestor
              </p>
              <p className="text-sm font-medium text-slate-200">
                {formData.status === 'bloqueado'
                  ? 'Acesso atualmente SUSPENSO/BLOQUEADO no sistema.'
                  : 'Acesso LIBERADO às funcionalidades da plataforma.'}
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {formData.status === 'bloqueado' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={promptUnblock}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Desbloquear Usuário</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={promptBlock}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Bloquear Usuário</span>
                </button>
              )}
            </div>
          </div>

          {/* Seção 1: Planos Disponíveis no Sistema (Clique para mudar) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Planos Disponíveis no Sistema (Clique para aplicar)
              </label>
              <span className="text-[11px] text-cyan-400 font-mono">
                Plano Atual: {formData.planoNome}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SYSTEM_PLANS.map((plan) => {
                const isSelected = 
                  formData.planoId === plan.id || 
                  formData.planoNome.toLowerCase() === plan.name.toLowerCase();

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-100 line-clamp-1">
                        {plan.name}
                      </span>
                      {plan.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">
                      {plan.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-xs font-bold text-cyan-300">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`}
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Selecionado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 hover:text-slate-300">
                          Mudar para este
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Edição dos Dados do Plano & Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-1">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                Nome do Plano
              </label>
              <input 
                type="text"
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-sm focus:border-cyan-500 outline-none" 
                value={formData.planoNome} 
                onChange={e => setFormData({ ...formData, planoNome: e.target.value })} 
                placeholder="Ex: Plano Completo"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor da Mensalidade (R$)
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-sm focus:border-cyan-500 outline-none font-mono" 
                value={formData.valorMensalidade} 
                onChange={e => setFormData({ ...formData, valorMensalidade: parseFloat(e.target.value) || 0 })} 
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Data de Vencimento
              </label>
              <input 
                type="date" 
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-sm focus:border-cyan-500 outline-none" 
                value={formData.dataVencimento} 
                onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })} 
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Status do Cliente
              </label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-sm focus:border-cyan-500 outline-none" 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ativo">Ativo (Acesso Liberado)</option>
                <option value="bloqueado">Bloqueado (Acesso Travado)</option>
                <option value="vencido">Vencido (Inadimplente)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button 
            type="button"
            disabled={loading}
            onClick={promptDelete} 
            className="flex items-center gap-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Excluir este cliente do Firebase"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Cliente</span>
          </button>

          <div className="flex gap-2">
            <button 
              type="button"
              disabled={loading}
              onClick={onClose} 
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              disabled={loading}
              onClick={handleSave} 
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando no Firebase...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div 
          id="master-confirm-dialog-overlay"
          className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4"
          onClick={() => setConfirmDialog(null)}
        >
          <div 
            id="master-confirm-dialog-card"
            className="bg-slate-900 border-2 border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                {confirmDialog.type === 'block' ? (
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                ) : confirmDialog.type === 'unblock' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : confirmDialog.type === 'save_plan' ? (
                  <Layers className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Trash2 className="w-6 h-6 text-rose-500" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${confirmDialog.confirmButtonClass}`}
              >
                {loading ? 'Processando...' : confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Dedicado de Exclusão com 2 Confirmações e Exclusão Real */}
      {isDeleteModalOpen && (
        <DeleteUserModal
          client={client}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
