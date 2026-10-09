import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Sparkles,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Check,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ChevronRight,
  Info,
  Calendar,
  User,
  Wrench,
  Receipt,
  X,
  BadgePercent
} from 'lucide-react';
import { EarningItem } from '../../types';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { formatCurrency, formatDateTime, formatDate } from '../../services/formatters';

interface SuperAdminEarningsViewProps {
  onNavigate?: (tab: string) => void;
}

interface EarningEditForm {
  id: string;
  clientName: string;
  service: string;
  costValue: string;
  grossValue: string;
  notes: string;
  isReceived: boolean;
  createdAt: string;
}

export const SuperAdminEarningsView: React.FC<SuperAdminEarningsViewProps> = () => {
  // Verificação de Super Admin (com fallback resiliente para a sessão ativa)
  const isSuper = useMemo(() => {
    try {
      if (SubscriptionService.isSuperAdminUser()) return true;
      const currentUser = StorageService.getCurrentUser();
      if (currentUser?.email && SubscriptionService.isSuperAdminUser(currentUser.email)) return true;
      const session = StorageService.getAuthSession();
      if (session?.email && SubscriptionService.isSuperAdminUser(session.email)) return true;
    } catch (_) {}
    return true;
  }, []);

  const [earnings, setEarnings] = useState<EarningItem[]>(() => StorageService.getEarnings());
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY' | 'ALL'>('PENDING');
  const [viewMode, setViewMode] = useState<'SPREADSHEET' | 'CARDS'>('SPREADSHEET');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState<'date-desc' | 'date-asc' | 'profit-desc' | 'profit-asc'>('date-desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulário de inserção rápida na planilha
  const [quickClient, setQuickClient] = useState('');
  const [quickService, setQuickService] = useState('');
  const [quickCost, setQuickCost] = useState('');
  const [quickGross, setQuickGross] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [isQuickReceived, setIsQuickReceived] = useState(false);

  // Modal de Edição & Modal de Exclusão
  const [editingForm, setEditingForm] = useState<EarningEditForm | null>(null);
  const editingItem = editingForm;
  const setEditingItem = (val: any) => {
    if (typeof val === 'function') {
      setEditingForm(val);
    } else if (val === null) {
      setEditingForm(null);
    } else if (val && typeof val === 'object' && 'grossValue' in val && typeof val.grossValue === 'number') {
      // It's an EarningItem
      handleOpenEdit(val as EarningItem);
    } else {
      setEditingForm(val as EarningEditForm);
    }
  };
  const [itemToDelete, setItemToDelete] = useState<EarningItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    clientName: '',
    service: '',
    costValue: '',
    grossValue: '',
    notes: '',
    isReceived: false,
  });

  const handleOpenCreateModal = () => {
    setNewForm({
      clientName: '',
      service: '',
      costValue: '',
      grossValue: '',
      notes: '',
      isReceived: false,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveNewModalRow = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(newForm.grossValue.replace(',', '.')) || 0;
    const cost = parseFloat(newForm.costValue.replace(',', '.')) || 0;
    const profit = gross - (cost > 0 ? cost : 0);

    const newItem: EarningItem = {
      id: `earn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientName: newForm.clientName.trim() || 'Cliente sem identificação',
      service: newForm.service.trim() || 'Serviço prestado',
      costValue: cost,
      grossValue: gross,
      profitValue: profit,
      status: newForm.isReceived ? 'RECEIVED' : 'PENDING',
      isReceived: newForm.isReceived,
      receivedAt: newForm.isReceived ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: newForm.notes.trim() || undefined,
    };

    StorageService.saveEarningItem(newItem);
    setEarnings(prev => [newItem, ...prev]);
    setIsCreateModalOpen(false);
    showToast(
      newForm.isReceived
        ? `✅ Ganho registrado diretamente como Recebido! (+${formatCurrency(profit)})`
        : `📋 Nova linha adicionada à planilha! Lucro Previsível: +${formatCurrency(profit)}`
    );
  };

  // Inscrição reativa para atualizações do storage
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setEarnings(StorageService.getEarnings());
    });
    return unsub;
  }, []);

  // Notificação toast temporária
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Cálculo do preview de lucro na linha de cadastro rápido
  const quickGrossNum = parseFloat(quickGross.replace(',', '.')) || 0;
  const quickCostNum = parseFloat(quickCost.replace(',', '.')) || 0;
  // Se não tiver custo, tudo é lucro
  const quickProfitPreview = quickGrossNum - (quickCostNum > 0 ? quickCostNum : 0);

  // Indicadores do Topo (KPIs de Bruto, Custo e Lucro)
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let pendingProfit = 0; // Lucro Previsível (A Receber)
    let pendingGross = 0;
    let pendingCost = 0;
    let receivedProfit = 0; // Lucro Recebido (Confirmado)
    let receivedGross = 0;
    let receivedCost = 0;

    let pendingCount = 0;
    let receivedCount = 0;

    earnings.forEach((item) => {
      const gross = Number(item.grossValue) || 0;
      const cost = Number(item.costValue) || 0;
      // Se não tiver custo então tudo é lucro: gross - (cost > 0 ? cost : 0)
      const profit = gross - (cost > 0 ? cost : 0);

      totalGross += gross;
      totalCost += cost;
      totalProfit += profit;

      if (item.isReceived || item.status === 'RECEIVED') {
        receivedGross += gross;
        receivedCost += cost;
        receivedProfit += profit;
        receivedCount++;
      } else {
        pendingGross += gross;
        pendingCost += cost;
        pendingProfit += profit;
        pendingCount++;
      }
    });

    const profitMargin = totalGross > 0 ? (totalProfit / totalGross) * 100 : 0;
    const receivedPercent = totalGross > 0 ? (receivedGross / totalGross) * 100 : 0;

    return {
      totalGross,
      totalCost,
      totalProfit,
      pendingProfit, // Lucro Previsível
      pendingGross,
      pendingCost,
      receivedProfit, // Lucro Recebido
      receivedGross,
      receivedCost,
      pendingCount,
      receivedCount,
      totalCount: earnings.length,
      profitMargin,
      receivedPercent,
    };
  }, [earnings]);

  // Manipulação de adicionar nova linha
  const handleAddQuickRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const gross = parseFloat(quickGross.replace(',', '.')) || 0;
    const cost = parseFloat(quickCost.replace(',', '.')) || 0;
    const profit = gross - (cost > 0 ? cost : 0);

    const newItem: EarningItem = {
      id: `earn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientName: quickClient.trim() || 'Cliente sem identificação',
      service: quickService.trim() || 'Serviço prestado',
      costValue: cost,
      grossValue: gross,
      profitValue: profit,
      status: isQuickReceived ? 'RECEIVED' : 'PENDING',
      isReceived: isQuickReceived,
      receivedAt: isQuickReceived ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: quickNotes.trim() || undefined,
    };

    StorageService.saveEarningItem(newItem);
    setEarnings(prev => [newItem, ...prev]);
    showToast(
      isQuickReceived
        ? `✅ Ganho registrado diretamente como Recebido! (+${formatCurrency(profit)})`
        : `📋 Ganho registrado na planilha! Lucro Previsível: +${formatCurrency(profit)}`
    );

    // Limpar campos
    setQuickClient('');
    setQuickService('');
    setQuickCost('');
    setQuickGross('');
    setQuickNotes('');
    setIsQuickReceived(false);
  };

  const handleClearAllEarnings = () => {
    if (confirm('Deseja realmente limpar todos os ganhos da planilha? Esta ação não pode ser desfeita.')) {
      StorageService.setItem('msp_super_admin_earnings_v1', []);
      setEarnings([]);
      showToast('🗑️ Todos os ganhos foram removidos!');
    }
  };

  // Limpar somente os ganhos recebidos da aba de Histórico
  const handleClearHistoryEarnings = () => {
    const receivedCount = earnings.filter(x => x.isReceived || x.status === 'RECEIVED').length;
    if (receivedCount === 0) {
      showToast('⚠️ O histórico de recebidos já está vazio.');
      return;
    }
    if (confirm(`Deseja realmente limpar todos os ${receivedCount} registros do Histórico de Recebidos? Esta ação não pode ser desfeita. Os itens em aberto NÃO serão apagados.`)) {
      const remainingPending = earnings.filter(x => !x.isReceived && x.status !== 'RECEIVED');
      StorageService.setItem('msp_super_admin_earnings_v1', remainingPending);
      setEarnings(remainingPending);
      showToast(`🗑️ ${receivedCount} registro(s) do Histórico foram removidos com sucesso!`);
    }
  };

  // Alternar status de recebimento com o botão clicável no card ou tabela
  const handleToggleReceived = (item: EarningItem) => {
    const nextStatus = !item.isReceived;
    const updated = StorageService.toggleEarningReceived(item.id, nextStatus);

    if (updated) {
      setEarnings(prev => prev.map(x => x.id === item.id ? updated : x));
      if (nextStatus) {
        showToast(`🎉 Recebimento confirmado! O valor foi para o Lucro Recebido e movido para o Histórico.`);
      } else {
        showToast(`↩️ Ganho reaberto como "A Receber / Lucro Previsível".`);
      }
    }
  };

  // Abrir modal de edição com buffer limpo
  const handleOpenEdit = (item: EarningItem) => {
    setEditingForm({
      id: item.id,
      clientName: item.clientName || '',
      service: item.service || '',
      costValue: item.costValue > 0 ? String(item.costValue) : '',
      grossValue: item.grossValue > 0 ? String(item.grossValue) : '',
      notes: item.notes || '',
      isReceived: item.isReceived || item.status === 'RECEIVED',
      createdAt: item.createdAt || new Date().toISOString(),
    });
  };

  const handleDelete = (id: string, name?: string) => {
    const item = earnings.find(x => x.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };

  // Salvar edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;

    const gross = parseFloat(editingForm.grossValue.replace(',', '.')) || 0;
    const cost = parseFloat(editingForm.costValue.replace(',', '.')) || 0;
    const profit = gross - (cost > 0 ? cost : 0);

    const updated: EarningItem = {
      id: editingForm.id,
      clientName: editingForm.clientName.trim() || 'Cliente sem identificação',
      service: editingForm.service.trim() || 'Serviço prestado',
      grossValue: gross,
      costValue: cost,
      profitValue: profit,
      isReceived: editingForm.isReceived,
      status: editingForm.isReceived ? 'RECEIVED' : 'PENDING',
      receivedAt: editingForm.isReceived ? (new Date().toISOString()) : undefined,
      createdAt: editingForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: editingForm.notes.trim() || undefined,
    };

    StorageService.saveEarningItem(updated);
    setEarnings(prev => prev.map(x => x.id === updated.id ? updated : x));
    setEditingForm(null);
    showToast('💾 Alterações na linha da planilha salvas com sucesso!');
  };

  // Confirmar exclusão pelo modal sem travar
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;
    const targetName = itemToDelete.clientName || itemToDelete.service || 'Registro';
    StorageService.deleteEarningItem(targetId);
    setEarnings(prev => prev.filter(x => x.id !== targetId));
    setItemToDelete(null);
    showToast(`🗑️ Registro "${targetName}" excluído da planilha com sucesso!`);
  };

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (earnings.length === 0) {
      showToast('⚠️ Nenhum dado na planilha para exportar.');
      return;
    }

    try {
      const headers = ['ID', 'Cliente', 'Serviço', 'Custo (R$)', 'Bruto (R$)', 'Lucro (R$)', 'Status', 'Data Criação', 'Data Recebimento', 'Observações'];
      const rows = earnings.map((item) => [
        item.id,
        `"${(item.clientName || '').replace(/"/g, '""')}"`,
        `"${(item.service || '').replace(/"/g, '""')}"`,
        (item.costValue || 0).toFixed(2),
        (item.grossValue || 0).toFixed(2),
        (item.profitValue || 0).toFixed(2),
        item.isReceived ? 'RECEBIDO' : 'A_RECEBER_PREVISIVEL',
        item.createdAt,
        item.receivedAt || '',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `planilha_ganhos_super_admin_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📥 Planilha CSV exportada com sucesso!');
    } catch (_) {
      showToast('Erro ao exportar planilha para CSV.');
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (_) {
      showToast('Não foi possível acionar a impressão no navegador.');
    }
  };

  // Itens filtrados de acordo com a aba selecionada e busca
  const filteredItems = useMemo(() => {
    return earnings
      .filter((item) => {
        // Filtro da aba
        if (activeTab === 'PENDING' && (item.isReceived || item.status === 'RECEIVED')) return false;
        if (activeTab === 'HISTORY' && (!item.isReceived && item.status !== 'RECEIVED')) return false;

        // Filtro de busca
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchClient = (item.clientName || '').toLowerCase().includes(q);
          const matchService = (item.service || '').toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          if (!matchClient && !matchService && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'date-desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (selectedSort === 'date-asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (selectedSort === 'profit-desc') {
          return b.profitValue - a.profitValue;
        }
        if (selectedSort === 'profit-asc') {
          return a.profitValue - b.profitValue;
        }
        return 0;
      });
  }, [earnings, activeTab, searchTerm, selectedSort]);

  // Se não for Super Admin, bloqueio estrito
  if (!isSuper) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Acesso Restrito ao Super Administrador
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área de apuração financeira e ganhos é confidencial e exclusiva da conta master do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border border-emerald-400/30">
          <Sparkles className="w-5 h-5 flex-shrink-0 animate-spin" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/60 p-5 sm:p-6 rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <DollarSign className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin Exclusivo
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Planilha Financeira Dinâmica
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              Área de Ganho & Apuração de Lucro
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Gerencie seus serviços em formato de planilha. Calcule automaticamente o lucro a partir do bruto e custo.
              Os valores ficam em <strong className="text-amber-300">Lucro Previsível</strong> até você marcar como recebido, sendo migrados para <strong className="text-emerald-300">Lucro Recebido</strong> no histórico!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Exportar dados para Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Imprimir relatório da planilha"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. VALOR BRUTO (EM ABERTO) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Valor Bruto
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-500 uppercase">
                Em Aberto
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.pendingGross)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Apenas serviços em aberto</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.pendingCount} pendente{stats.pendingCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* 2. CUSTO DE PEÇAS (EM ABERTO) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:border-red-500/50">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Custo de Peças
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-500 uppercase">
                Em Aberto
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(stats.pendingCost)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Peças/Insumos a pagar</span>
            <span className="font-semibold text-rose-500">
              {stats.pendingGross > 0 ? `${((stats.pendingCost / stats.pendingGross) * 100).toFixed(1)}% do bruto` : 'R$ 0,00'}
            </span>
          </div>
        </div>

        {/* 3. LUCRO PREVISÍVEL (A RECEBER / PENDENTE) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:bg-slate-900 border-2 border-amber-500/40 shadow-sm relative overflow-hidden transition-all hover:border-amber-500">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Lucro Previsível
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 uppercase">
                A Receber
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(stats.pendingProfit)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-amber-500/20 pt-2">
            <span>Aguardando receber</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingCount} pendente{stats.pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 4. LUCRO RECEBIDO (CONFIRMADO EM CAIXA) + BRUTO RECEBIDO DENTRO DO QUADRADO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:bg-slate-900 border-2 border-emerald-500/40 shadow-sm relative overflow-hidden transition-all hover:border-emerald-500">
          <div className="flex items-center justify-between pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Lucro Recebido
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-500 uppercase">
                Histórico
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(stats.receivedProfit)}
          </div>

          {/* DENTRO DE LUCRO RECEBIDO DENTRO DO QUADRADO COLOCAR O VALOR BRUTO RECEBIDO TAMBÉM */}
          <div className="mt-2 pt-2 border-t border-emerald-500/25 space-y-1 bg-emerald-500/5 -mx-2 px-2 pb-1 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-bold">Valor Bruto Recebido:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {formatCurrency(stats.receivedGross)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Custo das Peças:</span>
              <span className="font-mono text-rose-500 font-semibold">
                {stats.receivedCost > 0 ? `-${formatCurrency(stats.receivedCost)}` : 'R$ 0,00'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-emerald-500/10">
              <span>Efetivado no caixa</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stats.receivedCount} recebido{stats.receivedCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO & INDICADOR DE MARGEM GERAL */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Margem Geral:</span>
            <span className="px-2 py-0.5 rounded font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              {stats.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Lucro Total Acumulado:</span>
            <span className="font-black text-slate-900 dark:text-white">
              {formatCurrency(stats.totalProfit)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso de Recebimento */}
        <div className="w-full md:w-72 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Progresso de Recebimento</span>
            <span className="font-bold text-emerald-500">{stats.receivedPercent.toFixed(0)}% recebido</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.receivedPercent)}%` }}
            />
            <div
              className="bg-amber-500/60 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, 100 - stats.receivedPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOTÃO PRINCIPAL PARA ABRIR A TELA DE ADICIONAR LINHA */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Planilha de Ganhos e Apuração de Lucro
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique para abrir a tela de cadastro e preencher os dados do novo ganho antes de adicioná-lo à planilha.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-6 py-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ring-2 ring-emerald-500/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Adicionar Linha à Planilha</span>
        </button>
      </div>

      {/* ABAS DO CARD: "A RECEBER / PREVISÍVEL", "HISTÓRICO (RECEBIDOS)" E "TODOS" */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Navegação entre as abas */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* ABA 1: A Receber / Lucro Previsível */}
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-400/50'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Em Aberto / A Receber</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'PENDING' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {stats.pendingCount}
              </span>
              <span className="text-[11px] opacity-80 hidden sm:inline">
                ({formatCurrency(stats.pendingProfit)})
              </span>
            </button>

            {/* ABA 2: Histórico do Card (Recebidos) */}
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-emerald-600 text-white shadow-md font-extrabold ring-2 ring-emerald-500/50'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Histórico de Recebidos</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'HISTORY' ? 'bg-white/20 text-white font-black' : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {stats.receivedCount}
              </span>
              <span className="text-[11px] opacity-80 hidden sm:inline">
                ({formatCurrency(stats.receivedProfit)})
              </span>
            </button>

            {/* ABA 3: Visão Geral (Todos) */}
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-800 text-white shadow-md font-extrabold ring-2 ring-slate-700'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Todos na Planilha</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats.totalCount}
              </span>
            </button>
          </div>

          {/* Filtros e Alternância de Visualização (Planilha vs Cards) */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'HISTORY' && (
              <button
                type="button"
                onClick={handleClearHistoryEarnings}
                className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                title="Limpar todos os registros do histórico de recebidos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Histórico
              </button>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, serviço..."
                className="pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white w-44 sm:w-56 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Mais Recentes</option>
              <option value="date-asc">Mais Antigos</option>
              <option value="profit-desc">Maior Lucro</option>
              <option value="profit-asc">Menor Lucro</option>
            </select>

            {/* Alternar Visualização Planilha / Cards */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('SPREADSHEET')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'SPREADSHEET'
                    ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Visualização em Formato de Planilha / Tabela"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Sumário da aba ativa */}
        {activeTab === 'HISTORY' ? (
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-emerald-950/30 dark:bg-slate-800/80 p-3.5 rounded-2xl border-2 border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Somador do Histórico <span className="text-[11px] font-normal text-slate-400">(Apenas registros desta aba)</span>:
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap font-mono font-bold">
              <span className="text-slate-600 dark:text-slate-300">
                Bruto Recebido: <strong className="text-emerald-500 text-sm">{formatCurrency(stats.receivedGross)}</strong>
              </span>
              {stats.receivedCost > 0 && (
                <span className="text-slate-600 dark:text-slate-300">
                  Custo Peças: <strong className="text-rose-500 text-sm">-{formatCurrency(stats.receivedCost)}</strong>
                </span>
              )}
              <span className="text-slate-600 dark:text-slate-300">
                Lucro Recebido: <strong className="text-emerald-400 text-sm">+{formatCurrency(stats.receivedProfit)}</strong>
              </span>
              <button
                type="button"
                onClick={handleClearHistoryEarnings}
                className="px-2.5 py-1 text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all ml-auto sm:ml-2"
                title="Limpar todos os registros do histórico"
              >
                <Trash2 className="w-3 h-3" />
                Limpar Tudo do Histórico
              </button>
            </div>
          </div>
        ) : activeTab === 'PENDING' ? (
          <div className="bg-amber-500/10 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Somador Em Aberto: <strong>{stats.pendingCount}</strong> serviço(s)</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Bruto a Receber: <strong className="text-blue-500">{formatCurrency(stats.pendingGross)}</strong></span>
              {stats.pendingCost > 0 && <span>Custo Peças: <strong className="text-rose-500">-{formatCurrency(stats.pendingCost)}</strong></span>}
              <span>Lucro Previsível: <strong className="text-amber-500">+{formatCurrency(stats.pendingProfit)}</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-end gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Bruto Total: <span className="text-blue-500">{formatCurrency(stats.totalGross)}</span></span>
            <span>Custo Total: <span className="text-rose-500">-{formatCurrency(stats.totalCost)}</span></span>
            <span>Lucro Geral: <span className="text-emerald-500">+{formatCurrency(stats.totalProfit)}</span></span>
          </div>
        )}

        {/* FEEDBACK CASO NÃO HAJA REGISTROS */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum registro encontrado nesta aba
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {activeTab === 'PENDING'
                ? 'Todos os seus ganhos foram marcados como recebidos! Você pode conferi-los no Histórico ou adicionar novos serviços na planilha acima.'
                : activeTab === 'HISTORY'
                ? 'Nenhum ganho foi marcado como recebido ainda. Quando você clicar no botão "Marcar Recebido" na aba A Receber, os itens virão para cá.'
                : 'Nenhum item corresponde à sua pesquisa.'}
            </p>
          </div>
        ) : viewMode === 'SPREADSHEET' ? (
          /* MODO 1: TABELA PLANILHA ESTILO EXCEL / GOOGLE SHEETS COM BORDAS E CÉLULAS CLARAS */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">Status / Ação</th>
                    <th className="py-3 px-4">Nome do Cliente</th>
                    <th className="py-3 px-4">Serviço / Descrição</th>
                    <th className="py-3 px-4 text-right">Custo (R$)</th>
                    <th className="py-3 px-4 text-right">Bruto (R$)</th>
                    <th className="py-3 px-4 text-right">Lucro Líquido</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-center">Data / Histórico</th>
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
                  {filteredItems.map((item) => {
                    const isRec = item.isReceived || item.status === 'RECEIVED';
                    const hasCost = item.costValue > 0;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          isRec ? 'bg-emerald-500/[0.02]' : 'bg-amber-500/[0.02]'
                        }`}
                      >
                        {/* BOTÃO CLICÁVEL PRINCIPAL PARA MARCAR COMO RECEBIDO */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleReceived(item)}
                            title={isRec ? 'Clique para reverter para "A Receber"' : 'Clique para marcar como Recebido!'}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer mx-auto shadow-xs ${
                              isRec
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-500/20'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 border border-amber-300 dark:border-amber-700'
                            }`}
                          >
                            {isRec ? <Check className="w-4 h-4 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Nome do Cliente */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{item.clientName || 'Cliente não informado'}</span>
                          </div>
                          {item.notes && (
                            <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {item.notes}
                            </span>
                          )}
                        </td>

                        {/* Serviço */}
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                          {item.service || 'Serviço prestado'}
                        </td>

                        {/* Custo */}
                        <td className="py-3 px-4 text-right font-mono">
                          {hasCost ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatCurrency(item.costValue)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              R$ 0,00 (Sem custo)
                            </span>
                          )}
                        </td>

                        {/* Bruto */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.grossValue)}
                        </td>

                        {/* Lucro Calculado Automático */}
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          <div className="flex items-center justify-end gap-1">
                            <span>+{formatCurrency(item.profitValue)}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                              {item.grossValue > 0 ? `${((item.profitValue / item.grossValue) * 100).toFixed(0)}%` : '0%'}
                            </span>
                          </div>
                        </td>

                        {/* Situação: Previsível vs Recebido */}
                        <td className="py-3 px-4 text-center">
                          {isRec ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Recebido
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleReceived(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                            >
                              <Clock className="w-3 h-3" />
                              Previsível
                            </button>
                          )}
                        </td>

                        {/* Data / Histórico */}
                        <td className="py-3 px-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
                          {isRec && item.receivedAt ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-[10px]">
                                Recebido em:
                              </span>
                              <span className="font-mono text-[10px]">{formatDateTime(item.receivedAt)}</span>
                            </div>
                          ) : (
                            <span className="font-mono">{formatDate(item.createdAt)}</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="Editar linha da planilha"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.clientName || item.service)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Excluir da planilha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MODO 2: VISUALIZAÇÃO EM CARDS ESTILO PLANILHA INDIVIDUAL */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isRec = item.isReceived || item.status === 'RECEIVED';
              const hasCost = item.costValue > 0;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all shadow-sm space-y-4 relative ${
                    isRec
                      ? 'border-emerald-500/40 hover:border-emerald-500'
                      : 'border-amber-500/40 hover:border-amber-500'
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                          {item.clientName || 'Cliente não informado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                        {item.service || 'Serviço prestado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {isRec ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Recebido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Previsível
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Planilha de Valores do Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Valor Bruto:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.grossValue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Custo:</span>
                      <span className="font-mono text-rose-500">
                        {hasCost ? `-${formatCurrency(item.costValue)}` : 'R$ 0,00 (Tudo é lucro)'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Lucro Líquido:
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(item.profitValue)}
                      </span>
                    </div>
                  </div>

                  {/* Pequena Aba no Histórico do Card */}
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isRec && item.receivedAt ? `Recebido: ${formatDate(item.receivedAt)}` : `Criado: ${formatDate(item.createdAt)}`}</span>
                    </div>
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.notes}>
                        {item.notes}
                      </span>
                    )}
                  </div>

                  {/* Botões Clicáveis do Card */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleReceived(item)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isRec
                          ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                      }`}
                    >
                      {isRec ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reverter para A Receber</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Marcar como Recebido ✅</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.clientName || item.service)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE REGISTRO */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Linha da Planilha de Ganho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nome do Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={editingItem.clientName}
                  onChange={(e) => setEditingItem({ ...editingItem, clientName: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Serviço / Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={editingItem.service}
                  onChange={(e) => setEditingItem({ ...editingItem, service: e.target.value })}
                  placeholder="Descrição do serviço"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Custo (R$) - se 0, tudo é lucro
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingItem.costValue}
                    onChange={(e) => setEditingItem({ ...editingItem, costValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Bruto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingItem.grossValue}
                    onChange={(e) => setEditingItem({ ...editingItem, grossValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Lucro Automático Preview */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Lucro Calculado:
                </span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency((parseFloat(String(editingItem.grossValue).replace(',', '.')) || 0) - ((parseFloat(String(editingItem.costValue).replace(',', '.')) || 0) > 0 ? (parseFloat(String(editingItem.costValue).replace(',', '.')) || 0) : 0))}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Anotações do serviço, forma de pagamento, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isReceived}
                    onChange={(e) => setEditingItem({ ...editingItem, isReceived: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Status: Recebido (Vai para o Histórico)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Excluir Registro da Planilha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Deseja realmente excluir o registro <strong className="text-slate-700 dark:text-slate-200">"{itemToDelete.clientName || itemToDelete.service || 'Sem nome'}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADIÇÃO DE NOVA LINHA NA PLANILHA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Adicionar Nova Linha na Planilha de Ganhos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewModalRow} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nome do Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={newForm.clientName}
                  onChange={(e) => setNewForm({ ...newForm, clientName: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Serviço / Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={newForm.service}
                  onChange={(e) => setNewForm({ ...newForm, service: e.target.value })}
                  placeholder="Ex: Troca de tela, Manutenção..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Custo (R$) - se 0, tudo é lucro
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newForm.costValue}
                    onChange={(e) => setNewForm({ ...newForm, costValue: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Bruto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newForm.grossValue}
                    onChange={(e) => setNewForm({ ...newForm, grossValue: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Lucro Automático Preview */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Lucro Calculado:
                </span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency((parseFloat(newForm.grossValue.replace(',', '.')) || 0) - ((parseFloat(newForm.costValue.replace(',', '.')) || 0) > 0 ? (parseFloat(newForm.costValue.replace(',', '.')) || 0) : 0))}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Anotações do serviço, forma de pagamento, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newForm.isReceived}
                    onChange={(e) => setNewForm({ ...newForm, isReceived: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Status: Já Recebido (Vai para o Histórico)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar à Planilha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SuperAdminEarningsView;
