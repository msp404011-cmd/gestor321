import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { Customer } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone, cleanPhoneForWhatsApp } from '../../services/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useTheme } from '../../context/ThemeContext';

interface CustomerListViewProps {
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onViewCustomerDetail?: (customer: Customer) => void;
  onViewCustomer?: (customer: Customer) => void;
  onOpenNewOrder?: (customer: Customer) => void;
  onOpenNewOrderForCustomer?: (customer: Customer) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onOpenNewCustomer,
  onEditCustomer,
  onViewCustomerDetail,
  onViewCustomer,
  onOpenNewOrder,
  onOpenNewOrderForCustomer,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS' | 'VIP' | 'NOVOS'>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedCity, setSelectedCity] = useState<string>('TODAS');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [openMenuCustomerId, setOpenMenuCustomerId] = useState<string | null>(null);

  const handleView = (c: Customer) => {
    if (onViewCustomerDetail) onViewCustomerDetail(c);
    else if (onViewCustomer) onViewCustomer(c);
  };

  const handleNewOrder = (c: Customer) => {
    if (onOpenNewOrderForCustomer) onOpenNewOrderForCustomer(c);
    else if (onOpenNewOrder) onOpenNewOrder(c);
  };

  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const currentUser = StorageService.getCurrentUser();

  useEffect(() => {
    return StorageService.subscribe(() => {
      setCustomers(StorageService.getCustomers());
    });
  }, []);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, selectedStatus, selectedCity, search]);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tab filter
      if (selectedTab === 'ATIVOS' && c.status === 'Inativo') return false;
      if (selectedTab === 'INATIVOS' && c.status !== 'Inativo') return false;
      if (selectedTab === 'VIP' && c.status !== 'VIP') return false;
      if (selectedTab === 'NOVOS' && c.status === 'Inativo') return false;

      // Dropdown Status
      if (selectedStatus === 'ATIVO' && c.status === 'Inativo') return false;
      if (selectedStatus === 'INATIVO' && c.status !== 'Inativo') return false;
      if (selectedStatus === 'VIP' && c.status !== 'VIP') return false;

      // Dropdown City
      if (selectedCity !== 'TODAS' && c.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search query
      const q = search.trim().toLowerCase();
      if (!q) return true;

      return (
        c.name.toLowerCase().includes(q) ||
        (c.document && c.document.includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.whatsapp && c.whatsapp.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    });
  }, [customers, selectedTab, selectedStatus, selectedCity, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Cities list
  const cities = useMemo(() => {
    const set = new Set(customers.map((c) => c.city).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [customers]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomerIds(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter((item) => item !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      StorageService.deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  // Metrics calculation
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.status !== 'Inativo').length;
  const vipCount = customers.filter((c) => c.status === 'VIP').length;
  const inactiveCount = customers.filter((c) => c.status === 'Inativo').length;
  const newCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return customers.filter((c) => {
      if (!c.createdAt) return false;
      const createdDate = new Date(c.createdAt);
      return createdDate >= thirtyDaysAgo && c.status !== 'Inativo';
    }).length;
  }, [customers]);

  const countThisMonth = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return customers.filter((c) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d >= startOfMonth;
    }).length;
  }, [customers]);

  return (
    <div className={`space-y-4 font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-200 pb-8 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* 1. HEADER BANNER MATCHING CLIENTE.PNG */}
      <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#081226] via-[#091836] to-[#061022] border-blue-900/60 shadow-[0_0_25px_rgba(2,132,199,0.15)]'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white flex items-center justify-center font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Clientes
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              Gerencie seus clientes, histórico de serviços, aparelhos e compras.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10 self-start sm:self-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs font-semibold text-cyan-300">
            <span>Clientes são a base do nosso sucesso! 💜</span>
          </div>

          {currentUser.permissions.canManageCustomers && (
            <button
              type="button"
              onClick={onOpenNewCustomer}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP METRICS CARDS (4 BOXES MATCHING CLIENTE.PNG) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total de Clientes */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-blue-950/40 via-[#09152a] to-blue-950/20 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.2)]'
            : 'bg-blue-50/60 border-blue-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-blue-600/30 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-100 border-blue-300 text-blue-600'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>Total de Clientes</p>
                <p className={`text-2xl font-black leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCount.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-0.5 self-start">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </span>
          </div>
          <div className="flex items-end justify-between mt-3 pt-3 border-t border-blue-900/40">
            <span className={`text-[11px] font-medium ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>+{countThisMonth} este mês</span>
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-blue-500/40 rounded-t h-2"></div>
              <div className="w-1 bg-blue-500/60 rounded-t h-3"></div>
              <div className="w-1 bg-blue-500/80 rounded-t h-2.5"></div>
              <div className="w-1 bg-cyan-400 rounded-t h-4"></div>
              <div className="w-1 bg-cyan-300 rounded-t h-5 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            </div>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-emerald-950/40 via-[#09152a] to-emerald-950/20 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
            : 'bg-emerald-50/60 border-emerald-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-100 border-emerald-300 text-emerald-600'
              }`}>
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-emerald-700'}`}>Clientes Ativos</p>
                <p className={`text-2xl font-black leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeCount.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-0.5 self-start">
              <TrendingUp className="w-3 h-3" />
              <span>+8%</span>
            </span>
          </div>
          <div className="flex items-end justify-between mt-3 pt-3 border-t border-emerald-900/40">
            <span className={`text-[11px] font-medium ${isDark ? 'text-emerald-300/70' : 'text-emerald-600'}`}>Com serviços recentes</span>
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-emerald-500/40 rounded-t h-2.5"></div>
              <div className="w-1 bg-emerald-500/60 rounded-t h-2"></div>
              <div className="w-1 bg-emerald-500/80 rounded-t h-3.5"></div>
              <div className="w-1 bg-emerald-400 rounded-t h-4"></div>
              <div className="w-1 bg-emerald-300 rounded-t h-5 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            </div>
          </div>
        </div>

        {/* Clientes VIP */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-purple-950/40 via-[#09152a] to-purple-950/20 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.2)]'
            : 'bg-purple-50/60 border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-purple-600/30 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-purple-100 border-purple-300 text-purple-600'
              }`}>
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-purple-200/80' : 'text-purple-700'}`}>Clientes VIP</p>
                <p className={`text-2xl font-black leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{vipCount.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-0.5 self-start">
              <TrendingUp className="w-3 h-3" />
              <span>15%</span>
            </span>
          </div>
          <div className="flex items-end justify-between mt-3 pt-3 border-t border-purple-900/40">
            <span className={`text-[11px] font-medium ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>Maior frequência</span>
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-purple-500/40 rounded-t h-2"></div>
              <div className="w-1 bg-purple-500/60 rounded-t h-3"></div>
              <div className="w-1 bg-purple-500/80 rounded-t h-4"></div>
              <div className="w-1 bg-purple-400 rounded-t h-3.5"></div>
              <div className="w-1 bg-purple-300 rounded-t h-5 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
            </div>
          </div>
        </div>

        {/* Inativos */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-rose-950/40 via-[#09152a] to-rose-950/20 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
            : 'bg-rose-50/60 border-rose-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-rose-600/30 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-rose-100 border-rose-300 text-rose-600'
              }`}>
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-rose-200/80' : 'text-rose-700'}`}>Inativos</p>
                <p className={`text-2xl font-black leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{inactiveCount.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full text-[10px] font-bold flex items-center gap-0.5 self-start">
              <TrendingDown className="w-3 h-3" />
              <span>-5%</span>
            </span>
          </div>
          <div className="flex items-end justify-between mt-3 pt-3 border-t border-rose-900/40">
            <span className={`text-[11px] font-medium ${isDark ? 'text-rose-300/70' : 'text-rose-600'}`}>Sem movimentação há 90 dias</span>
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-rose-500/80 rounded-t h-5 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
              <div className="w-1 bg-rose-500/60 rounded-t h-4"></div>
              <div className="w-1 bg-rose-500/40 rounded-t h-3"></div>
              <div className="w-1 bg-rose-500/30 rounded-t h-2"></div>
              <div className="w-1 bg-rose-500/20 rounded-t h-1.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER PILLS BAR MATCHING CLIENTE.PNG */}
      <div className={`border rounded-2xl p-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none transition-all ${
        isDark ? 'bg-[#081226] border-blue-900/60' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          {/* Todos */}
          <button
            type="button"
            onClick={() => setSelectedTab('TODOS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedTab === 'TODOS'
                ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : isDark
                ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Todos ({totalCount.toLocaleString('pt-BR')})</span>
          </button>

          {/* Ativos */}
          <button
            type="button"
            onClick={() => setSelectedTab('ATIVOS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedTab === 'ATIVOS'
                ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : isDark
                ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Ativos ({activeCount.toLocaleString('pt-BR')})</span>
          </button>

          {/* Inativos */}
          <button
            type="button"
            onClick={() => setSelectedTab('INATIVOS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedTab === 'INATIVOS'
                ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : isDark
                ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-400" />
            <span>Inativos ({inactiveCount.toLocaleString('pt-BR')})</span>
          </button>

          {/* VIP */}
          <button
            type="button"
            onClick={() => setSelectedTab('VIP')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedTab === 'VIP'
                ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : isDark
                ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>VIP ({vipCount.toLocaleString('pt-BR')})</span>
          </button>

          {/* Novos */}
          <button
            type="button"
            onClick={() => setSelectedTab('NOVOS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedTab === 'NOVOS'
                ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                : isDark
                ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Novos ({newCount.toLocaleString('pt-BR')})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedTab('TODOS');
            setSelectedStatus('TODOS');
            setSelectedCity('TODAS');
            setSearch('');
          }}
          className={`px-3 py-2 border font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            isDark
              ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/60 text-slate-200'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="Limpar / Redefinir Filtros"
        >
          <Filter className="w-3.5 h-3.5 text-cyan-500" />
          <span>Filtros (Limpar)</span>
        </button>
      </div>

      {/* 4. SEARCH INPUT AND DROPDOWNS ROW */}
      <div className={`border rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 transition-all ${
        isDark ? 'bg-[#081226] border-blue-900/60' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, WhatsApp, CPF/CNPJ, e-mail ou cidade..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs transition-all focus:outline-none ${
              isDark
                ? 'bg-[#040a17] border-blue-900/80 text-white placeholder-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Dropdown */}
          <div className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs w-full sm:w-auto ${
            isDark ? 'bg-[#040a17] border-blue-900/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="TODOS" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Todos os status</option>
              <option value="ATIVO" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Ativos</option>
              <option value="VIP" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>VIP</option>
              <option value="INATIVO" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Inativos</option>
            </select>
          </div>

          {/* City Dropdown */}
          <div className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs w-full sm:w-auto ${
            isDark ? 'bg-[#040a17] border-blue-900/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="TODAS" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Todas as cidades</option>
              {cities.filter(c => c !== 'TODAS').map((city) => (
                <option key={city} value={city} className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. CUSTOMERS TABLE (MATCHING CLIENTE.PNG EXACT COLUMNS & ROWS) */}
      <div className={`border rounded-2xl overflow-hidden transition-all ${
        isDark ? 'bg-[#081226] border-blue-900/60 shadow-[0_0_20px_rgba(2,132,199,0.1)]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
                isDark ? 'bg-[#040a17] border-blue-900/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredCustomers.length > 0 &&
                      selectedCustomerIds.length === filteredCustomers.length
                    }
                    className={`rounded focus:ring-0 ${
                      isDark ? 'border-blue-900 bg-[#081226] text-cyan-500' : 'border-slate-300 bg-white text-blue-600'
                    }`}
                  />
                </th>
                <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                <th className="py-3 px-3.5">CLIENTE</th>
                <th className="py-3 px-3.5">DOCUMENTO</th>
                <th className="py-3 px-3.5">CONTATOS</th>
                <th className="py-3 px-3.5">CIDADE</th>
                <th className="py-3 px-3.5">ÚLTIMO SERVIÇO</th>
                <th className="py-3 px-3.5">TOTAL GASTO</th>
                <th className="py-3 px-3.5">STATUS</th>
                <th className="py-3 px-3.5 text-right">AÇÕES</th>
              </tr>
            </thead>

            <tbody className={`divide-y font-medium ${isDark ? 'divide-blue-950/60' : 'divide-slate-200'}`}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tente redefinir os termos da busca.</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c, index) => {
                  const isChecked = selectedCustomerIds.includes(c.id);
                  const cleanWa = cleanPhoneForWhatsApp(c.whatsapp || c.phone);
                  const waLink = cleanWa
                    ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(
                        `Olá ${c.name}, tudo bem? Aqui é da MSP Informática!`
                      )}`
                    : null;

                  // Initial letter background colors for clients without photo
                  const getInitialColor = (name: string) => {
                    const firstChar = name.charAt(0).toUpperCase();
                    if (['A', 'B', 'C', 'D', 'E'].includes(firstChar)) return 'bg-rose-500/20 text-rose-500 border-rose-500/40';
                    if (['F', 'G', 'H', 'I', 'J'].includes(firstChar)) return 'bg-purple-500/20 text-purple-500 border-purple-500/40';
                    if (['K', 'L', 'M', 'N', 'O'].includes(firstChar)) return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40';
                    return 'bg-blue-500/20 text-blue-500 border-blue-500/40';
                  };

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isChecked
                          ? isDark ? 'bg-blue-950/60' : 'bg-blue-50/80'
                          : isDark ? 'hover:bg-blue-950/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(c.id)}
                          className={`rounded focus:ring-0 ${
                            isDark ? 'border-blue-900 bg-[#081226] text-cyan-500' : 'border-slate-300 bg-white text-blue-600'
                          }`}
                        />
                      </td>

                      {/* Index # */}
                      <td className="py-3 px-2 text-center text-slate-400 font-bold text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* CLIENTE (Avatar + Name + Email) */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className={`w-9 h-9 rounded-full object-cover border shrink-0 ${
                                isDark ? 'border-blue-900/80 bg-slate-900' : 'border-slate-200 bg-slate-100'
                              }`}
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-extrabold text-xs shrink-0 ${getInitialColor(c.name)}`}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 max-w-xs">
                            <button
                              type="button"
                              onClick={() => onViewCustomerDetail(c)}
                              className={`font-bold text-xs text-left transition-colors truncate block ${
                                isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-blue-600'
                              }`}
                            >
                              {c.name}
                            </button>
                            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {c.email || 'Sem e-mail cadastrado'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DOCUMENTO */}
                      <td className={`py-3 px-3.5 font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.document || '---'}
                      </td>

                      {/* CONTATOS */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{formatPhone(c.whatsapp || c.phone) || c.whatsapp || c.phone || '---'}</span>
                          </div>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <span>Chamar no WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* CIDADE */}
                      <td className={`py-3 px-3.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.city ? `${c.city} - ${c.state || 'SP'}` : 'São Paulo - SP'}
                      </td>

                      {/* ÚLTIMO SERVIÇO */}
                      <td className={`py-3 px-3.5 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.lastServiceDate || '18/08/2026'}
                      </td>

                      {/* TOTAL GASTO */}
                      <td className={`py-3 px-3.5 font-black text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        R$ {(c.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3.5">
                        {c.status === 'VIP' ? (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-500">
                            VIP
                          </span>
                        ) : c.status === 'Inativo' ? (
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                          }`}>
                            Inativo
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3 px-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleView(c)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                            title="Ver Detalhes do Cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {currentUser.permissions.canManageCustomers && (
                            <button
                              type="button"
                              onClick={() => onEditCustomer(c)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                              }`}
                              title="Editar Cliente"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuCustomerId(openMenuCustomerId === c.id ? null : c.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Mais Opções"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuCustomerId === c.id && (
                              <div className={`absolute right-0 mt-1 w-44 rounded-xl border shadow-xl z-50 py-1 text-left ${
                                isDark ? 'bg-[#081226] border-blue-900/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuCustomerId(null);
                                    handleView(c);
                                  }}
                                  className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                                    isDark ? 'hover:bg-blue-600 hover:text-white' : 'hover:bg-blue-50 hover:text-slate-900'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </button>
                                {currentUser.permissions.canManageCustomers && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCustomerId(null);
                                      onEditCustomer(c);
                                    }}
                                    className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                                      isDark ? 'hover:bg-blue-600 hover:text-white' : 'hover:bg-blue-50 hover:text-slate-900'
                                    }`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Editar Cliente</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuCustomerId(null);
                                    handleNewOrder(c);
                                  }}
                                  className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                                    isDark ? 'hover:bg-blue-600 hover:text-white' : 'hover:bg-blue-50 hover:text-slate-900'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Nova OS</span>
                                </button>
                                {currentUser.permissions.canManageCustomers && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCustomerId(null);
                                      setCustomerToDelete(c);
                                    }}
                                    className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2 text-rose-500 transition-colors ${
                                      isDark ? 'hover:bg-rose-950/60' : 'hover:bg-rose-50'
                                    }`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION BAR MATCHING CLIENTE.PNG */}
        <div className={`border-t p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#040a17] border-blue-900/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Mostrando <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span> a <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
            </span> de <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredCustomers.length}
            </span> clientes
          </div>

          {/* Page numbers center */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              const isCurrent = num === currentPage;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-black border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                      : isDark
                      ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Próxima página"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right dropdown page size */}
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`border rounded-lg px-2.5 py-1 font-bold focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#081226] border-blue-900/80 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cliente"
        message={`Deseja realmente excluir o cliente "${customerToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};
