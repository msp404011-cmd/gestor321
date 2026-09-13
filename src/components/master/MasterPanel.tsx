import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Search, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  RefreshCw,
  LogOut,
  Calendar,
  DollarSign,
  Layers,
  UserPlus,
  Clock,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Filter,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { MasterClientModal } from './MasterClientModal';
import { ChangePlanModal } from './ChangePlanModal';
import { CreateUserModal } from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { normalizeAccountData, CanonicalAccount } from '../../services/accountSchema';
import { AdminBackendService } from '../../services/adminBackendService';

interface MetricCardProps {
  title: string;
  value: string | number;
  color: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color, subtitle, icon }) => (
  <div className="bg-slate-900/90 border border-slate-800/90 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
      {icon && <div className="text-slate-400">{icon}</div>}
    </div>
    <p className={`text-2xl sm:text-3xl font-black tracking-tight ${color}`}>{value}</p>
    {subtitle && <p className="text-[11px] text-slate-400 mt-1 truncate">{subtitle}</p>}
  </div>
);

interface MasterPanelProps {
  onClose?: () => void;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({ onClose }) => {
  const [data, setData] = useState<CanonicalAccount[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<CanonicalAccount | null>(null);
  const [changePlanClient, setChangePlanClient] = useState<CanonicalAccount | null>(null);
  const [deleteUserClient, setDeleteUserClient] = useState<CanonicalAccount | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'bloqueado' | 'vencido' | 'vencendo'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUpcomingDrawer, setShowUpcomingDrawer] = useState(true);

  // Dialog de confirmação rápida para ações diretas na tabela
  const [tableConfirmDialog, setTableConfirmDialog] = useState<{
    isOpen: boolean;
    client: CanonicalAccount;
    action: 'block' | 'unblock' | 'delete';
  } | null>(null);

  // Carregamento e sincronização em tempo real com Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      // De-duplicação limpa para evitar registros duplicados por e-mail ou UID
      const uniqueAccountsMap = new Map<string, CanonicalAccount>();
      
      snapshot.docs.forEach(docSnap => {
        const norm = normalizeAccountData(docSnap.id, docSnap.data());
        const key = (norm.email || norm.uid || norm.id).toLowerCase();
        
        // Se já existir, dá preferência para o registro com UID ou ID limpo
        if (!uniqueAccountsMap.has(key) || (norm.uid && !norm.id.includes('@'))) {
          uniqueAccountsMap.set(key, norm);
        }
      });

      setData(Array.from(uniqueAccountsMap.values()));
    });
    return () => unsub();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Funções utilitárias de data e contagem
  const calculateDaysRemaining = (vencimentoStr?: string) => {
    if (!vencimentoStr) return 0;
    try {
      if (vencimentoStr.includes('-')) {
        const parts = vencimentoStr.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const dueDate = new Date(year, month, day);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diffTime = dueDate.getTime() - today.getTime();
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
      const exp = new Date(vencimentoStr);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Cálculos Reais do Dashboard com dados do Firebase
  const metrics = useMemo(() => {
    const total = data.length;
    let ativos = 0;
    let bloqueados = 0;
    let vencidos = 0;
    let vencendo = 0;
    let totalAssinaturas = 0;
    let totalAReceber = 0;

    data.forEach(c => {
      const days = calculateDaysRemaining(c.dataVencimento);
      const isBlocked = Boolean(c.bloqueado || c.blocked || c.status === 'bloqueado');
      const isExpired = days < 0 || c.status === 'vencido';
      const isExpiringSoon = !isBlocked && !isExpired && days >= 0 && days <= 7;
      const planValue = Number(c.valorPlano || c.valorMensalidade || c.mensalidade || 0);

      if (isBlocked) {
        bloqueados++;
      } else if (isExpired) {
        vencidos++;
      } else {
        ativos++;
      }

      if (isExpiringSoon) {
        vencendo++;
      }

      // Soma do valor total das assinaturas
      totalAssinaturas += planValue;

      // Lógica de cálculo real de valor a receber do sistema:
      // Usuários com pagamento 'pendente' ou 'atrasado', ou cujo status é 'vencido', ou com vencimento nos próximos 7 dias
      const isPaid = c.situacaoPagamento === 'em_dia';
      const isTrial = c.plano === 'TRIAL' || planValue === 0;

      if (!isTrial) {
        if (c.situacaoPagamento === 'atrasado' || c.situacaoPagamento === 'pendente' || isExpired || isExpiringSoon || !isPaid) {
          totalAReceber += planValue;
        }
      }
    });

    return {
      total,
      ativos,
      bloqueados,
      vencidos,
      vencendo,
      totalAssinaturas,
      totalAReceber
    };
  }, [data]);

  // Lista de vencimentos próximos para visão rápida (<= 7 dias ou vencidos)
  const upcomingExpirations = useMemo(() => {
    return data
      .map(c => ({
        ...c,
        days: calculateDaysRemaining(c.dataVencimento)
      }))
      .filter(c => c.days <= 7 && !c.bloqueado)
      .sort((a, b) => a.days - b.days);
  }, [data]);

  // Lista de Planos únicos para o filtro dropdown
  const uniquePlans = useMemo(() => {
    const plansSet = new Set<string>();
    data.forEach(c => {
      const name = c.planoNome || c.plano;
      if (name) plansSet.add(name);
    });
    return Array.from(plansSet);
  }, [data]);

  // Filtragem e Pesquisa
  const filtered = useMemo(() => {
    return data.filter(c => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        (c.nome && c.nome.toLowerCase().includes(q)) || 
        (c.name && c.name.toLowerCase().includes(q)) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefone && c.telefone.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.whatsapp && c.whatsapp.toLowerCase().includes(q)) ||
        (c.empresa && c.empresa.toLowerCase().includes(q)) ||
        (c.planoNome && c.planoNome.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const days = calculateDaysRemaining(c.dataVencimento);
      const isBlocked = Boolean(c.bloqueado || c.blocked || c.status === 'bloqueado');
      const isExpired = days < 0 || c.status === 'vencido';
      const isExpiringSoon = !isBlocked && !isExpired && days >= 0 && days <= 7;

      if (statusFilter === 'ativo') {
        if (isBlocked || isExpired) return false;
      } else if (statusFilter === 'bloqueado') {
        if (!isBlocked) return false;
      } else if (statusFilter === 'vencido') {
        if (!isExpired) return false;
      } else if (statusFilter === 'vencendo') {
        if (!isExpiringSoon) return false;
      }

      if (planFilter !== 'all') {
        const planName = c.planoNome || c.plano;
        if (planName !== planFilter) return false;
      }

      return true;
    });
  }, [data, search, statusFilter, planFilter]);

  // Ação rápida direta de Bloquear / Desbloquear
  const handleToggleBlock = async (client: CanonicalAccount) => {
    const isCurrentlyBlocked = Boolean(client.bloqueado || client.blocked || client.status === 'bloqueado');
    setTableConfirmDialog({
      isOpen: true,
      client,
      action: isCurrentlyBlocked ? 'unblock' : 'block'
    });
  };

  // Execução da confirmação rápida (bloquear / desbloquear)
  const executeTableConfirmAction = async () => {
    if (!tableConfirmDialog) return;
    const { client, action } = tableConfirmDialog;
    setTableConfirmDialog(null);

    const targetId = client.id || client.email || client.uid;
    if (!targetId) {
      showToast('Identificador do cliente não encontrado.', 'error');
      return;
    }

    try {
      setLoadingAction(targetId);

      if (action === 'block') {
        await AdminBackendService.toggleBlock({
          docId: targetId,
          uid: client.uid || (targetId.includes('@') ? '' : targetId),
          email: client.email || (targetId.includes('@') ? targetId : ''),
          block: true,
          reason: 'Bloqueado diretamente pelo Painel Master',
        });
        showToast(`Usuário ${client.nome || client.email} BLOQUEADO com sucesso!`);
      } else if (action === 'unblock') {
        await AdminBackendService.toggleBlock({
          docId: targetId,
          uid: client.uid || (targetId.includes('@') ? '' : targetId),
          email: client.email || (targetId.includes('@') ? targetId : ''),
          block: false,
          reason: 'Desbloqueado pelo Master Admin',
        });
        showToast(`Usuário ${client.nome || client.email} DESBLOQUEADO com sucesso!`);
      }
    } catch (err: any) {
      console.error('Erro ao executar ação:', err);
      const msg = typeof err === 'string'
        ? (err === '[object Object]' ? 'Erro ao comunicar com o servidor administrativo.' : err)
        : (err?.message && typeof err.message === 'string' && err.message !== '[object Object]')
        ? err.message
        : 'Erro ao comunicar com o servidor administrativo.';
      showToast(msg, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Formatação de Situação de Pagamento
  const getPaymentStatusBadge = (client: CanonicalAccount) => {
    const planVal = Number(client.valorPlano || client.valorMensalidade || 0);
    if (client.plano === 'TRIAL' || planVal === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
          Isento / Grátis
        </span>
      );
    }

    const days = calculateDaysRemaining(client.dataVencimento);
    const sit = client.situacaoPagamento;

    if (sit === 'atrasado' || days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-700">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Atrasado
        </span>
      );
    }

    if (sit === 'pendente' || days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-700">
          <Clock className="w-3 h-3 text-amber-400" />
          Pendente
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Em Dia
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#060a12] p-4 sm:p-6 lg:p-8 z-50 overflow-auto text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[130] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 border border-emerald-600 text-emerald-200' 
            : 'bg-rose-950 border border-rose-600 text-rose-200'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                PAINEL MASTER
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 rounded-full">
                  Centro Administrativo Real
                </span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Gerenciamento central de usuários, assinaturas, vencimentos e acessos no Firebase
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Usuário</span>
          </button>

          <button
            type="button"
            onClick={() => (onClose ? onClose() : window.location.reload())}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </div>
      
      {/* Cards de Métricas Reais do Sistema */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
        <MetricCard 
          title="Total Usuários" 
          value={metrics.total} 
          color="text-white" 
          subtitle="Base total Firebase"
          icon={<Users className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard 
          title="Ativos" 
          value={metrics.ativos} 
          color="text-emerald-400" 
          subtitle="Acesso liberado"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard 
          title="Bloqueados" 
          value={metrics.bloqueados} 
          color="text-rose-400" 
          subtitle="Acesso travado"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
        />
        <MetricCard 
          title="Vencendo" 
          value={metrics.vencendo} 
          color="text-amber-400" 
          subtitle="Próximos 7 dias"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard 
          title="Vencidos" 
          value={metrics.vencidos} 
          color="text-rose-500" 
          subtitle="Inadimplentes"
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
        />
        <MetricCard 
          title="Assinaturas" 
          value={`R$ ${metrics.totalAssinaturas.toFixed(2)}`} 
          color="text-cyan-400" 
          subtitle="Valor mensal total"
          icon={<DollarSign className="w-4 h-4 text-cyan-400" />}
        />
        <MetricCard 
          title="A Receber" 
          value={`R$ ${metrics.totalAReceber.toFixed(2)}`} 
          color="text-amber-300" 
          subtitle="Saldo em aberto"
          icon={<CreditCard className="w-4 h-4 text-amber-300" />}
        />
      </div>

      {/* Seção 📅 Vencimentos Próximos (Visão Rápida) */}
      {upcomingExpirations.length > 0 && (
        <div className="mb-6 bg-slate-900/90 border border-amber-900/50 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                Vencimentos Próximos & Atenção ({upcomingExpirations.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowUpcomingDrawer(!showUpcomingDrawer)}
              className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
            >
              {showUpcomingDrawer ? 'Recolher' : 'Expandir'}
            </button>
          </div>

          {showUpcomingDrawer && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingExpirations.map((client, idx) => {
                const isOverdue = client.days < 0;
                return (
                  <div 
                    key={client.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      isOverdue 
                        ? 'bg-rose-950/30 border-rose-800/80' 
                        : 'bg-amber-950/20 border-amber-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {client.nome || client.empresa || client.email}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {client.planoNome} • <span className="font-mono text-cyan-400">R$ {Number(client.valorPlano || 0).toFixed(2)}</span>
                      </p>
                      <p className={`text-[10px] font-bold mt-0.5 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                        {isOverdue 
                          ? `Vencido há ${Math.abs(client.days)} dia(s) (${formatDateBR(client.dataVencimento)})` 
                          : client.days === 0 
                          ? `Vence HOJE (${formatDateBR(client.dataVencimento)})` 
                          : `Vence em ${client.days} dia(s) (${formatDateBR(client.dataVencimento)})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Gerenciar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabela Principal de Usuários */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
        {/* Controles de Busca e Filtros */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5">
          {/* Barra de Pesquisa */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Pesquisar por nome, e-mail, telefone ou empresa..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtros: Status Tabs + Filtro Por Plano */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor Dropdown por Plano */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-semibold outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900 text-white">Todos os Planos</option>
                {uniquePlans.map((planName) => (
                  <option key={planName} value={planName} className="bg-slate-900 text-white">
                    {planName}
                  </option>
                ))}
              </select>
            </div>

            {/* Abas de Filtro de Status */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ativo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'ativo'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Ativos ({metrics.ativos})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('bloqueado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'bloqueado'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Bloqueados ({metrics.bloqueados})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('vencendo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'vencendo'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Vencendo ({metrics.vencendo})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('vencido')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'vencido'
                    ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Vencidos ({metrics.vencidos})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-black tracking-wider">
                <th className="p-3.5">Nome / Empresa</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Plano</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Dias Restantes</th>
                <th className="p-3.5">Situação Pagamento</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">Nenhum usuário encontrado</p>
                    <p className="text-xs text-slate-600 mt-1">Tente ajustar a busca ou os filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((client, index) => {
                  const days = calculateDaysRemaining(client.dataVencimento);
                  const isBlocked = Boolean(client.bloqueado || client.blocked || client.status === 'bloqueado');
                  const uniqueKey = client.uid || client.id || client.email || `client_${index}`;
                  const isActionLoading = loadingAction === (client.id || client.email || client.uid);

                  return (
                    <tr 
                      key={uniqueKey} 
                      className={`transition-colors ${
                        isBlocked ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Nome / Empresa */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{client.nome || client.name || 'Cliente'}</span>
                        </div>
                        {client.empresa && client.empresa !== client.nome && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>{client.empresa}</span>
                          </div>
                        )}
                        {client.telefone && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{client.telefone}</span>
                          </div>
                        )}
                      </td>

                      {/* E-mail */}
                      <td className="p-3.5">
                        <div className="text-xs text-slate-300 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{client.email}</span>
                        </div>
                      </td>

                      {/* Plano */}
                      <td className="p-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {client.planoNome || client.plano || '---'}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="p-3.5">
                        <div className="text-cyan-400 font-black font-mono text-xs sm:text-sm">
                          R$ {client.valorPlano !== undefined && client.valorPlano !== null ? Number(client.valorPlano).toFixed(2) : (client.valorMensalidade !== undefined && client.valorMensalidade !== null ? Number(client.valorMensalidade).toFixed(2) : '---')}
                        </div>
                      </td>

                      {/* Status de Acesso */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isBlocked 
                            ? 'bg-rose-900/40 text-rose-300 border-rose-700' 
                            : client.status === 'vencido' 
                            ? 'bg-amber-900/40 text-amber-300 border-amber-700' 
                            : 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isBlocked ? 'bg-rose-400' : client.status === 'vencido' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          {isBlocked ? 'BLOQUEADO' : client.status === 'vencido' ? 'VENCIDO' : 'ATIVO'}
                        </span>
                      </td>

                      {/* Data de Vencimento */}
                      <td className="p-3.5">
                        <div className="text-slate-200 font-mono text-xs">
                          {formatDateBR(client.dataVencimento)}
                        </div>
                      </td>

                      {/* Dias Restantes */}
                      <td className="p-3.5">
                        <div className={`text-xs font-bold ${
                          days < 0 
                            ? 'text-rose-400' 
                            : days === 0
                            ? 'text-amber-300 font-black'
                            : days <= 7 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }`}>
                          {days < 0 
                            ? `Vencido há ${Math.abs(days)}d` 
                            : days === 0 
                            ? 'Vence hoje' 
                            : `${days} dias restantes`}
                        </div>
                      </td>

                      {/* Situação do Pagamento */}
                      <td className="p-3.5">
                        {getPaymentStatusBadge(client)}
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bloquear / Desbloquear */}
                          {isBlocked ? (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleToggleBlock(client)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Desbloquear acesso do usuário"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Desbloquear</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleToggleBlock(client)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Bloquear acesso do usuário imediatamente"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Bloquear</span>
                            </button>
                          )}

                          {/* Alterar Plano */}
                          <button 
                            type="button"
                            onClick={() => setChangePlanClient(client)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Alterar plano do usuário no Firebase"
                          >
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">Plano</span>
                          </button>

                          {/* Editar Dados Permitidos */}
                          <button 
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Editar dados permitidos (Nome, Empresa, Telefone, Vencimento)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden md:inline">Editar</span>
                          </button>

                          {/* Excluir Usuário */}
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => setDeleteUserClient(client)}
                            className="p-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                            title="Excluir usuário do Firebase Auth e Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Dedicado de Criação de Usuário (Firebase Auth + Firestore UID) */}
      {isCreateUserOpen && (
        <CreateUserModal
          onClose={() => setIsCreateUserOpen(false)}
          onUserCreated={(created) => {
            showToast(`Conta criada com sucesso para ${created.nome} (${created.email}) no Firebase!`, 'success');
          }}
        />
      )}

      {/* Modal Dedicado de Alteração de Plano (Totalmente vinculado ao Firebase) */}
      {changePlanClient && (
        <ChangePlanModal 
          client={changePlanClient} 
          onClose={() => setChangePlanClient(null)} 
          onPlanChanged={(updated) => {
            showToast(`Plano de ${updated.nome || updated.email} atualizado no Firebase com sucesso!`, 'success');
          }}
        />
      )}

      {/* Modal Dedicado de Exclusão Real de Usuário (2 confirmações + Firebase Auth + Firestore) */}
      {deleteUserClient && (
        <DeleteUserModal
          client={deleteUserClient}
          onClose={() => setDeleteUserClient(null)}
          onDeleted={(deleted) => {
            showToast(`Usuário excluído com sucesso. (${deleted.nome || deleted.email})`, 'success');
            setDeleteUserClient(null);
          }}
        />
      )}

      {/* Modal de Edição de Dados Permitidos do Cliente */}
      {selectedClient && (
        <MasterClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}

      {/* Confirmation Dialog para ações rápidas da tabela */}
      {tableConfirmDialog && tableConfirmDialog.isOpen && (
        <div 
          id="table-confirm-dialog-overlay"
          className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4"
          onClick={() => setTableConfirmDialog(null)}
        >
          <div 
            id="table-confirm-dialog-card"
            className="bg-slate-900 border-2 border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                {tableConfirmDialog.action === 'block' ? (
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                ) : tableConfirmDialog.action === 'unblock' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Trash2 className="w-6 h-6 text-rose-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {tableConfirmDialog.action === 'block'
                    ? 'Bloquear Usuário?'
                    : tableConfirmDialog.action === 'unblock'
                    ? 'Desbloquear Usuário?'
                    : 'Excluir Usuário?'}
                </h3>
                <p className="text-xs text-slate-400">
                  {tableConfirmDialog.client.nome || tableConfirmDialog.client.email}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {tableConfirmDialog.action === 'block'
                ? 'Tem certeza que deseja bloquear este usuário? O acesso ao Gestor será interrompido imediatamente e a tela de bloqueio será acionada.'
                : tableConfirmDialog.action === 'unblock'
                ? 'Deseja reativar o acesso deste usuário? Ele poderá voltar a utilizar o sistema Gestor normalmente.'
                : 'Deseja excluir permanentemente este usuário do Firebase? Esta ação não pode ser desfeita.'}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTableConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeTableConfirmAction}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                  tableConfirmDialog.action === 'block'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : tableConfirmDialog.action === 'unblock'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                {tableConfirmDialog.action === 'block'
                  ? 'Confirmar Bloqueio'
                  : tableConfirmDialog.action === 'unblock'
                  ? 'Confirmar Desbloqueio'
                  : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
