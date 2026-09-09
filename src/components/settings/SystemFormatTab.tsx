import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  Download,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  CheckSquare,
  Square,
  Lock,
  RotateCcw,
  Sparkles,
  Database,
  Layers,
  ShoppingBag,
  Users,
  Wrench,
  DollarSign,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  StorageService,
  SystemFormatOptions,
  defaultSystemFormatOptions,
  completeFactoryResetOptions,
  SystemStatsSummary,
} from '../../services/storage';

interface SystemFormatTabProps {
  isDark: boolean;
  onExportBackup: () => void;
}

export const SystemFormatTab: React.FC<SystemFormatTabProps> = ({ isDark, onExportBackup }) => {
  const [formatOptions, setFormatOptions] = useState<SystemFormatOptions>(() => ({
    ...defaultSystemFormatOptions,
  }));
  const [formatMode, setFormatMode] = useState<'OPERATIONAL' | 'COMPLETE' | 'CUSTOM'>('OPERATIONAL');
  const [systemStats, setSystemStats] = useState<SystemStatsSummary>(() =>
    StorageService.getSystemStatsSummary()
  );
  const [confirmSafetyText, setConfirmSafetyText] = useState('');
  const [autoBackupBeforeFormat, setAutoBackupBeforeFormat] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFormattingInProgress, setIsFormattingInProgress] = useState(false);
  const [formatStepMessage, setFormatStepMessage] = useState('');
  const [formatCompleted, setFormatCompleted] = useState(false);

  // Refresh stats
  const handleRefreshStats = () => {
    setSystemStats(StorageService.getSystemStatsSummary());
  };

  // Switch preset mode
  const handleSelectPreset = (mode: 'OPERATIONAL' | 'COMPLETE' | 'CUSTOM') => {
    setFormatMode(mode);
    if (mode === 'OPERATIONAL') {
      setFormatOptions({ ...defaultSystemFormatOptions });
    } else if (mode === 'COMPLETE') {
      setFormatOptions({ ...completeFactoryResetOptions });
    }
  };

  // Toggle individual option
  const handleToggleOption = (key: keyof SystemFormatOptions) => {
    setFormatOptions((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setFormatMode('CUSTOM');
      return updated;
    });
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    setFormatMode('CUSTOM');
    setFormatOptions({
      orders: select,
      sales: select,
      cash: select,
      expenses: select,
      receivables: select,
      purchases: select,
      stockMovements: select,
      products: select,
      customers: select,
      devices: select,
      suppliers: select,
      resellers: select,
      auditLogs: select,
      resetCompanySettings: select,
      resetCustomConfigs: select,
      resetEmployeesToAdminOnly: select,
    });
  };

  const countSelectedOptions = () => {
    return Object.values(formatOptions).filter(Boolean).length;
  };

  const isSafetyPhraseValid =
    confirmSafetyText.trim().toUpperCase() === 'ZERAR' ||
    confirmSafetyText.trim().toUpperCase() === 'FORMATAR';

  // Execute the format
  const handleExecuteFormat = async () => {
    if (!isSafetyPhraseValid) {
      alert('Por favor, digite a palavra ZERAR ou FORMATAR no campo de confirmação.');
      return;
    }

    if (countSelectedOptions() === 0) {
      alert('Selecione pelo menos um módulo para formatar.');
      return;
    }

    setIsFormattingInProgress(true);

    // Automatic backup if selected
    if (autoBackupBeforeFormat) {
      try {
        setFormatStepMessage('1/3 Gerando arquivo de backup de segurança em JSON...');
        onExportBackup();
        await new Promise((r) => setTimeout(r, 700));
      } catch (e) {
        console.error('Backup error:', e);
      }
    }

    setFormatStepMessage('2/3 Limpando registros das tabelas selecionadas...');
    await new Promise((r) => setTimeout(r, 800));

    // Storage formatting
    StorageService.formatSystem(formatOptions);

    setFormatStepMessage('3/3 Reindexando banco de dados local e finalizando...');
    await new Promise((r) => setTimeout(r, 600));

    // Update stats
    setSystemStats(StorageService.getSystemStatsSummary());
    setIsFormattingInProgress(false);
    setFormatCompleted(true);
  };

  const handleRestartSystem = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border-2 relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#1b0a12] via-[#10060c] to-[#090306] border-rose-600/50 shadow-[0_0_25px_rgba(225,29,72,0.2)]'
            : 'bg-gradient-to-br from-rose-50 via-red-50/40 to-white border-rose-300 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Formatador do Sistema & Limpeza de Dados
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-full">
                Área Destrutiva • Protegida
              </span>
            </div>
            <p className={`text-xs max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Utilize esta ferramenta para zerar o banco de dados do sistema, remover ordens e vendas de teste
              para iniciar a operação real da loja, ou realizar uma restauração completa para o estado de fábrica.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onExportBackup}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                isDark
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
              title="Baixar cópia de segurança antes de formatar"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Antes</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshStats}
              className={`p-2 text-xs font-bold rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Atualizar contadores"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Database Volume / Stats */}
      <div
        className={`p-5 rounded-2xl border-2 transition-all ${
          isDark ? 'bg-[#090f20] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Volume Atual de Registros Armazenados no Sistema
            </h4>
          </div>
          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Base local ativa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-amber-400">{systemStats.ordersCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Ordens de Serviço</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-emerald-400">{systemStats.salesCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Vendas PDV</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-blue-400">{systemStats.customersCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Clientes</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-purple-400">{systemStats.productsCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Produtos / Peças</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-teal-400">{systemStats.receivablesCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Contas a Receber</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-rose-400">{systemStats.expensesCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Despesas</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-indigo-400">{systemStats.purchasesCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Compras</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-cyan-400">{systemStats.stockMovementsCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mov. Estoque</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-yellow-400">{systemStats.cashMovementsCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mov. Caixa</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-sky-400">{systemStats.devicesCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Aparelhos</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-orange-400">{systemStats.resellersCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Revendedores</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#040814] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-lg font-black text-slate-300">{systemStats.auditLogsCount}</div>
            <div className={`text-[10px] font-semibold uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Logs Auditoria</div>
          </div>
        </div>
      </div>

      {/* Mode Presets Selection */}
      <div className="space-y-3">
        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          1. Escolha o Modo de Formatação
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Preset 1: Operational */}
          <button
            type="button"
            onClick={() => handleSelectPreset('OPERATIONAL')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              formatMode === 'OPERATIONAL'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : isDark
                ? 'bg-[#090f20] border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                  Recomendado para início
                </span>
                {formatMode === 'OPERATIONAL' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Zerar Apenas Movimentações
              </h5>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Zera ordens de serviço, vendas do PDV, despesas, caixa e contas a receber de teste.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/40 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span>✓ Mantém produtos, clientes e configurações da loja</span>
            </div>
          </button>

          {/* Preset 2: Factory Complete */}
          <button
            type="button"
            onClick={() => handleSelectPreset('COMPLETE')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              formatMode === 'COMPLETE'
                ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_18px_rgba(225,29,72,0.2)]'
                : isDark
                ? 'bg-[#090f20] border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full">
                  Reset Total de Fábrica
                </span>
                {formatMode === 'COMPLETE' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
              </div>
              <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Formatação Completa (Zerar Tudo)
              </h5>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Zera absolutamente todos os registros, clientes, estoque, ordens e restaura as configurações de fábrica.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/40 text-[11px] font-medium text-rose-400 flex items-center gap-1">
              <span>⚠️ Sistema volta 100% limpo (mantém login de admin)</span>
            </div>
          </button>

          {/* Preset 3: Custom */}
          <button
            type="button"
            onClick={() => handleSelectPreset('CUSTOM')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              formatMode === 'CUSTOM'
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_18px_rgba(59,130,246,0.2)]'
                : isDark
                ? 'bg-[#090f20] border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-full">
                  Seleção Livre
                </span>
                {formatMode === 'CUSTOM' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Formatação Personalizada
              </h5>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Escolha individualmente através dos checkboxes abaixo quais itens você quer apagar.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/40 text-[11px] font-medium text-blue-400 flex items-center gap-1">
              <span>🛠️ Controle total sobre cada tabela</span>
            </div>
          </button>
        </div>
      </div>

      {/* Granular Selection Form */}
      <div
        className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark ? 'bg-[#0b1328] border-slate-800 text-slate-100' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
          <div>
            <h4 className="text-sm font-bold">2. Itens Selecionados para Exclusão</h4>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Marque ou desmarque os módulos que você deseja formatar e zerar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Marcar Todos
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Categories of options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Group 1: Transactions */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Movimentações & Vendas</span>
            </h5>
            <div className="space-y-2">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.orders
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.orders}
                  onChange={() => handleToggleOption('orders')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Ordens de Serviço (OS)</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.ordersCount} registradas</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.sales
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.sales}
                  onChange={() => handleToggleOption('sales')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Vendas e Histórico PDV</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.salesCount} vendas</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.cash
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.cash}
                  onChange={() => handleToggleOption('cash')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Sessão e Movimentações de Caixa</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.cashMovementsCount} lançamentos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.receivables
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.receivables}
                  onChange={() => handleToggleOption('receivables')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Contas a Receber / Fiados</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.receivablesCount} títulos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.expenses
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.expenses}
                  onChange={() => handleToggleOption('expenses')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Despesas da Loja</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.expensesCount} lançamentos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.purchases
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.purchases}
                  onChange={() => handleToggleOption('purchases')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Compras / Entrada de Peças</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.purchasesCount} registros</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.stockMovements
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.stockMovements}
                  onChange={() => handleToggleOption('stockMovements')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Histórico de Estoque</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.stockMovementsCount} eventos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.auditLogs
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.auditLogs}
                  onChange={() => handleToggleOption('auditLogs')}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Histórico de Auditoria & Logs</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.auditLogsCount} logs</div>
                </div>
              </label>
            </div>
          </div>

          {/* Group 2: Entities & Records */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cadastros & Clientes</span>
            </h5>
            <div className="space-y-2">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.products
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.products}
                  onChange={() => handleToggleOption('products')}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Produtos, Peças e Estoque</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.productsCount} produtos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.customers
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.customers}
                  onChange={() => handleToggleOption('customers')}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Clientes Cadastrados</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.customersCount} clientes</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.devices
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.devices}
                  onChange={() => handleToggleOption('devices')}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Aparelhos / Dispositivos</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.devicesCount} aparelhos</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.suppliers
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.suppliers}
                  onChange={() => handleToggleOption('suppliers')}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Fornecedores Cadastrados</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.suppliersCount} fornecedores</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.resellers
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.resellers}
                  onChange={() => handleToggleOption('resellers')}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Revendedores Cadastrados</div>
                  <div className="text-[10px] text-slate-400">Total: {systemStats.resellersCount} revendedores</div>
                </div>
              </label>
            </div>
          </div>

          {/* Group 3: Configuration & System */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Configurações & Fábrica</span>
            </h5>
            <div className="space-y-2">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.resetCompanySettings
                    ? 'border-rose-500/50 bg-rose-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.resetCompanySettings}
                  onChange={() => handleToggleOption('resetCompanySettings')}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Restaurar Dados da Loja</div>
                  <div className="text-[10px] text-slate-400">Reseta nome, logo, termos e rodapés</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.resetCustomConfigs
                    ? 'border-rose-500/50 bg-rose-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.resetCustomConfigs}
                  onChange={() => handleToggleOption('resetCustomConfigs')}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Restaurar Acessórios & Status</div>
                  <div className="text-[10px] text-slate-400">Volta status de OS, marcas e formas padrão</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formatOptions.resetEmployeesToAdminOnly
                    ? 'border-rose-500/50 bg-rose-500/10'
                    : isDark
                    ? 'border-slate-800 bg-[#060c1c]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formatOptions.resetEmployeesToAdminOnly}
                  onChange={() => handleToggleOption('resetEmployeesToAdminOnly')}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold">Redefinir Usuários para Apenas Admin</div>
                  <div className="text-[10px] text-slate-400">Remove funcionários extras cadastrados</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Gate & Execution */}
      <div
        className={`p-6 rounded-2xl border-2 space-y-4 transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#18080f] to-[#0d0408] border-rose-600/50 shadow-[0_0_20px_rgba(225,29,72,0.15)]'
            : 'bg-rose-50/70 border-rose-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-rose-400" />
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            3. Trava de Segurança e Confirmação
          </h4>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="autoBackupCheck"
            checked={autoBackupBeforeFormat}
            onChange={(e) => setAutoBackupBeforeFormat(e.target.checked)}
            className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="autoBackupCheck" className="text-xs font-medium cursor-pointer">
            Fazer download automático de backup de segurança em JSON antes de apagar
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Digite a palavra <span className="text-rose-400 font-black tracking-wider">ZERAR</span> ou{' '}
              <span className="text-rose-400 font-black tracking-wider">FORMATAR</span> para confirmar:
            </label>
            <input
              type="text"
              value={confirmSafetyText}
              onChange={(e) => setConfirmSafetyText(e.target.value)}
              placeholder="Digite ZERAR aqui..."
              className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl border-2 transition-all outline-none uppercase font-mono ${
                isSafetyPhraseValid
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : confirmSafetyText.length > 0
                  ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                  : isDark
                  ? 'border-slate-700 bg-[#0a0508] text-white focus:border-rose-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-rose-500'
              }`}
            />
          </div>

          <div>
            <button
              type="button"
              disabled={!isSafetyPhraseValid || countSelectedOptions() === 0}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSafetyPhraseValid && countSelectedOptions() > 0
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] cursor-pointer'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Executar Formatação ({countSelectedOptions()} módulos selecionados)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg p-6 rounded-2xl border-2 shadow-2xl relative space-y-5 ${
              isDark ? 'bg-[#0f050a] border-rose-600 text-white' : 'bg-white border-rose-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600/20 border border-rose-500 text-rose-400 rounded-2xl">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Confirmação de Limpeza Extrema</h3>
                <p className="text-xs text-rose-400 font-semibold">Esta operação apagará definitivamente os dados selecionados!</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl text-xs space-y-2 border ${isDark ? 'bg-[#180710] border-rose-900/50' : 'bg-rose-50 border-rose-200'}`}>
              <p className="font-bold">Resumo do que será zerado:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {formatOptions.orders && <li>Ordens de Serviço ({systemStats.ordersCount} itens)</li>}
                {formatOptions.sales && <li>Vendas e PDV ({systemStats.salesCount} itens)</li>}
                {formatOptions.cash && <li>Caixa e Lançamentos Financeiros</li>}
                {formatOptions.expenses && <li>Despesas ({systemStats.expensesCount} itens)</li>}
                {formatOptions.receivables && <li>Contas a Receber ({systemStats.receivablesCount} títulos)</li>}
                {formatOptions.purchases && <li>Compras ({systemStats.purchasesCount} itens)</li>}
                {formatOptions.stockMovements && <li>Movimentações de Estoque</li>}
                {formatOptions.products && <li>Produtos e Peças ({systemStats.productsCount} cadastrados)</li>}
                {formatOptions.customers && <li>Clientes ({systemStats.customersCount} cadastrados)</li>}
                {formatOptions.devices && <li>Aparelhos ({systemStats.devicesCount} cadastrados)</li>}
                {formatOptions.suppliers && <li>Fornecedores ({systemStats.suppliersCount} cadastrados)</li>}
                {formatOptions.resellers && <li>Revendedores ({systemStats.resellersCount} cadastrados)</li>}
                {formatOptions.auditLogs && <li>Histórico de Auditoria</li>}
                {formatOptions.resetCompanySettings && <li>Configurações e Termos da Loja</li>}
                {formatOptions.resetCustomConfigs && <li>Categorias e Status de OS</li>}
                {formatOptions.resetEmployeesToAdminOnly && <li>Redefinição de Usuários para Admin Padrão</li>}
              </ul>
            </div>

            {isFormattingInProgress ? (
              <div className="space-y-3 py-4 text-center">
                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
                <div className="text-sm font-bold text-rose-300">{formatStepMessage}</div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-red-600 h-2 animate-pulse w-full"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteFormat}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sim, Formatar Agora</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {formatCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border-2 shadow-2xl relative space-y-4 text-center ${
              isDark ? 'bg-[#040e09] border-emerald-500 text-white' : 'bg-white border-emerald-500 text-slate-900'
            }`}
          >
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-emerald-400">Sistema Formatado com Sucesso!</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Os módulos selecionados foram limpos e o banco de dados foi reinicializado.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleRestartSystem}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recarregar Sistema Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
