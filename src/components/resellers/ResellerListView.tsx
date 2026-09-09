import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Filter,
  DollarSign,
  ShoppingCart,
  Receipt,
  LayoutGrid,
  List,
  Building2,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Reseller, ResellerTransaction } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone, cleanPhoneForWhatsApp } from '../../services/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ResellerModal } from './ResellerModal';
import { ResellerDetailModal } from './ResellerDetailModal';
import { ResellerSaleModal } from './ResellerSaleModal';
import { ResellerPaymentModal } from './ResellerPaymentModal';

export const ResellerListView: React.FC = () => {
  const [resellers, setResellers] = useState<Reseller[]>(() => StorageService.getResellers());
  const [transactions, setTransactions] = useState<ResellerTransaction[]>(() =>
    StorageService.getResellerTransactions()
  );

  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'TODOS' | 'ATIVOS' | 'COM_DEBITO' | 'EM_DIA' | 'INATIVOS'>('TODOS');
  const [selectedCity, setSelectedCity] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isNewResellerOpen, setIsNewResellerOpen] = useState(false);
  const [resellerToEdit, setResellerToEdit] = useState<Reseller | null>(null);
  const [resellerToView, setResellerToView] = useState<Reseller | null>(null);
  const [resellerForSale, setResellerForSale] = useState<Reseller | null>(null);
  const [resellerForPayment, setResellerForPayment] = useState<Reseller | null>(null);
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null);

  // Subscribe to storage updates
  useEffect(() => {
    return StorageService.subscribe(() => {
      setResellers(StorageService.getResellers());
      setTransactions(StorageService.getResellerTransactions());
    });
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTab, selectedCity]);

  // City list
  const cities = useMemo(() => {
    const list = Array.from(new Set(resellers.map((r) => r.city).filter(Boolean))) as string[];
    return ['TODAS', ...list];
  }, [resellers]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = resellers.length;
    const activeCount = resellers.filter((r) => r.status === 'Ativo').length;
    const totalOutstandingBalance = resellers.reduce((sum, r) => sum + (Number(r.balance) || 0), 0);
    const debtorsCount = resellers.filter((r) => (Number(r.balance) || 0) > 0).length;
    const totalWholesaleSales = transactions
      .filter((t) => t.type === 'SALE')
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const totalCreditLimit = resellers.reduce((sum, r) => sum + (Number(r.creditLimit) || 0), 0);

    return {
      totalCount,
      activeCount,
      totalOutstandingBalance,
      debtorsCount,
      totalWholesaleSales,
      totalCreditLimit,
    };
  }, [resellers, transactions]);

  // Filtered resellers
  const filteredResellers = useMemo(() => {
    return resellers.filter((r) => {
      // Tab filter
      if (selectedTab === 'ATIVOS' && r.status !== 'Ativo') return false;
      if (selectedTab === 'INATIVOS' && r.status !== 'Inativo') return false;
      if (selectedTab === 'COM_DEBITO' && (Number(r.balance) || 0) <= 0) return false;
      if (selectedTab === 'EM_DIA' && (Number(r.balance) || 0) > 0) return false;

      // City filter
      if (selectedCity !== 'TODAS' && r.city !== selectedCity) return false;

      // Search query
      const q = search.trim().toLowerCase();
      if (!q) return true;

      return (
        r.name.toLowerCase().includes(q) ||
        (r.tradeName && r.tradeName.toLowerCase().includes(q)) ||
        (r.document && r.document.includes(q)) ||
        (r.phone && r.phone.includes(q)) ||
        (r.whatsapp && r.whatsapp.includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q))
      );
    });
  }, [resellers, selectedTab, selectedCity, search]);

  const totalPages = Math.max(1, Math.ceil(filteredResellers.length / itemsPerPage));
  const paginatedResellers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResellers.slice(start, start + itemsPerPage);
  }, [filteredResellers, currentPage, itemsPerPage]);

  // Save handler
  const handleSaveReseller = (reseller: Reseller) => {
    StorageService.saveReseller(reseller);
    if (resellerToView && resellerToView.id === reseller.id) {
      setResellerToView(reseller);
    }
  };

  // Delete handler
  const handleConfirmDelete = () => {
    if (resellerToDelete) {
      StorageService.deleteReseller(resellerToDelete.id);
      setResellerToDelete(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nome / Razao',
      'Nome Fantasia',
      'Tipo',
      'Documento',
      'WhatsApp',
      'Email',
      'Cidade',
      'UF',
      'Saldo Devedor (R$)',
      'Limite de Credito (R$)',
      'Total Comprado (R$)',
      'Status',
    ];

    const rows = resellers.map((r) => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.tradeName || '').replace(/"/g, '""')}"`,
      r.personType || '',
      r.document || '',
      r.phone || '',
      r.email || '',
      r.city || '',
      r.state || '',
      (r.balance || 0).toFixed(2),
      (r.creditLimit || 0).toFixed(2),
      (r.totalPurchased || 0).toFixed(2),
      r.status || 'Ativo',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revendedores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Gerenciamento de Revenda
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Controle de parceiros de revenda, vendas no atacado, limites de crédito e acertos de contas
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#070e20] hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exportar planilha de revendedores"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setResellerToEdit(null);
              setIsNewResellerOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Revendedor
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revendedores */}
        <div className="p-4 rounded-2xl bg-[#0b1328] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Revendedores
            </span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalCount}</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {metrics.activeCount} ativos
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Parceiros cadastrados no atacado
          </span>
        </div>

        {/* Card 2: Saldo a Receber */}
        <div className="p-4 rounded-2xl bg-[#0b1328] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saldo a Receber (Em Aberto)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              R$ {metrics.totalOutstandingBalance.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.debtorsCount} {metrics.debtorsCount === 1 ? 'revendedor com saldo devedor' : 'revendedores com saldo devedor'}
          </span>
        </div>

        {/* Card 3: Faturamento Atacado */}
        <div className="p-4 rounded-2xl bg-[#0b1328] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vendas no Atacado (Total)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              R$ {metrics.totalWholesaleSales.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Total histórico faturado para revenda
          </span>
        </div>

        {/* Card 4: Limite de Crédito Concedido */}
        <div className="p-4 rounded-2xl bg-[#0b1328] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Limite de Crédito Total
            </span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">
              R$ {metrics.totalCreditLimit.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Teto global liberado para faturamento
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0b1328] border border-slate-800/80 shadow-lg space-y-4">
        {/* Row 1: Search, City, View Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, razão, CNPJ, WhatsApp, cidade ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-[#070e20] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* City selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Cidade:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 bg-[#070e20] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-blue-500"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex p-0.5 bg-[#070e20] border border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizar como tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizar como cartões em grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
          {[
            { id: 'TODOS', label: 'Todos os Revendedores', count: resellers.length },
            {
              id: 'ATIVOS',
              label: 'Ativos',
              count: resellers.filter((r) => r.status === 'Ativo').length,
            },
            {
              id: 'COM_DEBITO',
              label: 'Com Saldo Devedor',
              count: resellers.filter((r) => (Number(r.balance) || 0) > 0).length,
              color: 'text-rose-400',
            },
            {
              id: 'EM_DIA',
              label: 'Em Dia (Sem Débito)',
              count: resellers.filter((r) => (Number(r.balance) || 0) <= 0).length,
              color: 'text-emerald-400',
            },
            {
              id: 'INATIVOS',
              label: 'Inativos',
              count: resellers.filter((r) => r.status === 'Inativo').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#070e20] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedTab === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.color || 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filteredResellers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0b1328] border border-slate-800 text-center space-y-3">
          <UserCheck className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
          <h3 className="text-base font-bold text-white">Nenhum revendedor encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search
              ? `Nenhum resultado para "${search}". Verifique os termos pesquisados ou limpe os filtros.`
              : 'Cadastre seus revendedores para começar a gerenciar vendas de atacado e acertos de contas.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedTab('TODOS');
              setSelectedCity('TODAS');
              setIsNewResellerOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Revendedor
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#0b1328] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#081023] border-b border-slate-800 text-slate-400 uppercase font-bold text-[10.5px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Revendedor / Empresa</th>
                  <th className="py-3.5 px-4">Contatos</th>
                  <th className="py-3.5 px-4">Localização</th>
                  <th className="py-3.5 px-4">Saldo Devedor</th>
                  <th className="py-3.5 px-4">Limite de Crédito</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedResellers.map((r) => {
                  const bal = Number(r.balance) || 0;
                  const limit = Number(r.creditLimit) || 0;
                  const usage = limit > 0 ? Math.min(100, Math.round((bal / limit) * 100)) : 0;
                  const rawWhatsapp = cleanPhoneForWhatsApp(r.whatsapp || r.phone);
                  const whatsappLink = rawWhatsapp
                    ? `https://wa.me/55${rawWhatsapp}?text=${encodeURIComponent(
                        `Olá ${r.name}, tudo bem? Entramos em contato da assistência sobre sua conta de revendedor.`
                      )}`
                    : '';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#070e20] transition-colors group cursor-pointer"
                      onClick={() => setResellerToView(r)}
                    >
                      {/* Name & Document */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:border-blue-500/50 transition-colors shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs group-hover:text-blue-300 transition-colors truncate">
                              {r.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                              {r.tradeName && <span className="text-slate-300 font-semibold">{r.tradeName}</span>}
                              {r.document && (
                                <span className="font-mono bg-slate-800/80 px-1 py-0.2 rounded text-[9.5px]">
                                  {r.document}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contacts */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{r.phone || '—'}</span>
                          </div>
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Chamar no WhatsApp
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">
                          {r.city ? `${r.city}/${r.state || 'SP'}` : 'Não informada'}
                        </span>
                        {r.neighborhood && (
                          <span className="text-[10.5px] text-slate-500 block truncate max-w-[140px]">
                            {r.neighborhood}
                          </span>
                        )}
                      </td>

                      {/* Saldo Devedor */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-xs block ${
                            bal > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          R$ {bal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {bal > 0 ? 'Saldo em aberto' : 'Sem débito pendente'}
                        </span>
                      </td>

                      {/* Limite de Crédito */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200">
                          R$ {limit.toFixed(2)}
                        </span>
                        <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usage > 90 ? 'bg-rose-500' : usage > 60 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 block">{usage}% utilizado</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            r.status === 'Ativo'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : r.status === 'Bloqueado'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'Ativo'
                                ? 'bg-emerald-400'
                                : r.status === 'Bloqueado'
                                ? 'bg-rose-400'
                                : 'bg-slate-400'
                            }`}
                          />
                          {r.status || 'Ativo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setResellerForSale(r)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="Nova Venda / Pedido Atacado"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResellerForPayment(r)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                            title="Lançar Pagamento / Acerto"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResellerToView(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Ver Ficha e Histórico"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResellerToEdit(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar Cadastro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResellerToDelete(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Excluir Revendedor"
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
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedResellers.map((r) => {
            const bal = Number(r.balance) || 0;
            const limit = Number(r.creditLimit) || 0;
            const usage = limit > 0 ? Math.min(100, Math.round((bal / limit) * 100)) : 0;
            const rawWhatsapp = cleanPhoneForWhatsApp(r.whatsapp || r.phone);
            const whatsappLink = rawWhatsapp
              ? `https://wa.me/55${rawWhatsapp}?text=${encodeURIComponent(
                  `Olá ${r.name}, tudo bem? Entramos em contato da assistência técnica.`
                )}`
              : '';

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-[#0b1328] border border-slate-800/80 hover:border-blue-500/40 transition-all shadow-lg flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {r.name}
                        </h3>
                        {r.tradeName && (
                          <p className="text-[11px] text-slate-400 font-semibold truncate">{r.tradeName}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${
                        r.status === 'Ativo'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : r.status === 'Bloqueado'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {r.status || 'Ativo'}
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-[#070e20] border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Saldo Devedor:
                      </span>
                      <span
                        className={`text-sm font-black block mt-0.5 ${
                          bal > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        R$ {bal.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Limite de Crédito:
                      </span>
                      <span className="text-sm font-black text-purple-400 block mt-0.5">
                        R$ {limit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.phone || 'Não informado'}</span>
                    </div>
                    {r.city && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <span>📍 {r.city}/{r.state || 'SP'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setResellerForPayment(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Receber Pagamento"
                    >
                      <DollarSign className="w-3 h-3" />
                      Acerto
                    </button>
                    <button
                      type="button"
                      onClick={() => setResellerForSale(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Nova Venda"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Venda
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setResellerToView(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Ficha"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setResellerToEdit(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setResellerToDelete(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Mostrando <b>{paginatedResellers.length}</b> de <b>{filteredResellers.length}</b> revendedores
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`p-2 rounded-xl border border-slate-800 bg-[#0b1328] text-xs font-bold transition-colors cursor-pointer ${
                currentPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 font-bold px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`p-2 rounded-xl border border-slate-800 bg-[#0b1328] text-xs font-bold transition-colors cursor-pointer ${
                currentPage === totalPages ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Reseller Create / Edit Modal */}
      <ResellerModal
        isOpen={isNewResellerOpen || !!resellerToEdit}
        onClose={() => {
          setIsNewResellerOpen(false);
          setResellerToEdit(null);
        }}
        onSave={handleSaveReseller}
        resellerToEdit={resellerToEdit}
      />

      {/* 2. Reseller Profile & Transaction Detail Modal */}
      <ResellerDetailModal
        isOpen={!!resellerToView}
        onClose={() => setResellerToView(null)}
        reseller={resellerToView}
        onEdit={(r) => {
          setResellerToView(null);
          setResellerToEdit(r);
        }}
        onOpenSale={(r) => {
          setResellerToView(null);
          setResellerForSale(r);
        }}
        onOpenPayment={(r) => {
          setResellerToView(null);
          setResellerForPayment(r);
        }}
      />

      {/* 3. Reseller Sale Modal */}
      <ResellerSaleModal
        isOpen={!!resellerForSale}
        onClose={() => setResellerForSale(null)}
        reseller={resellerForSale}
        onSaleCompleted={(txId) => {
          setResellers(StorageService.getResellers());
          setTransactions(StorageService.getResellerTransactions());
        }}
      />

      {/* 4. Reseller Payment Modal */}
      <ResellerPaymentModal
        isOpen={!!resellerForPayment}
        onClose={() => setResellerForPayment(null)}
        reseller={resellerForPayment}
        onPaymentCompleted={(txId) => {
          setResellers(StorageService.getResellers());
          setTransactions(StorageService.getResellerTransactions());
        }}
      />

      {/* 5. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!resellerToDelete}
        title="Excluir Revendedor"
        message={`Deseja realmente remover o revendedor "${resellerToDelete?.name}"? Esta ação removerá o cadastro e histórico deste parceiro.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setResellerToDelete(null)}
      />
    </div>
  );
};
