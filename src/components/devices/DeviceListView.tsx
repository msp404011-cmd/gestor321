import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  Search,
  Plus,
  Wrench,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  History,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Copy,
  Eye,
  EyeOff,
  Check,
  Clock,
  Laptop,
  Monitor,
  Tablet as TabletIcon,
  Gamepad2,
  Package,
  Boxes,
  CheckCircle2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  FileText,
} from 'lucide-react';
import { Device, DeviceType } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getOrderStatusLabel, formatCurrency, formatDate } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface DeviceListViewProps {
  onOpenNewDevice: () => void;
  onEditDevice: (device: Device) => void;
  onOpenNewOrderForDevice: (device: Device) => void;
  onNavigateToOrder: (orderId: string) => void;
}

export const DeviceListView: React.FC<DeviceListViewProps> = ({
  onOpenNewDevice,
  onEditDevice,
  onOpenNewOrderForDevice,
  onNavigateToOrder,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recentes' | 'antigos' | 'nome'>('recentes');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Password visibility state per device
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Copy notification state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>(() => StorageService.getDevices());
  const orders = StorageService.getOrders();
  const currentUser = StorageService.getCurrentUser();

  // Listen to StorageService updates
  useEffect(() => {
    return StorageService.subscribe(() => {
      setDevices(StorageService.getDevices());
    });
  }, []);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedType, selectedBrand, selectedStatus, sortBy]);

  // Toggle password visibility
  const togglePasswordVisibility = (deviceId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  // Copy field helper
  const handleCopy = (text: string, fieldName: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Dynamic available brands from devices
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    devices.forEach((d) => {
      if (d.brand && d.brand.trim()) {
        brandsSet.add(d.brand.trim());
      }
    });
    return ['TODOS', ...Array.from(brandsSet).sort()];
  }, [devices]);

  // Dynamic available types from devices
  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>(['Smartphone', 'Notebook', 'Desktop', 'Tablet', 'Console', 'Outros']);
    devices.forEach((d) => {
      if (d.type && d.type.trim()) {
        typesSet.add(d.type.trim());
      }
    });
    return ['TODOS', ...Array.from(typesSet)];
  }, [devices]);

  // Dynamic available statuses from devices
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>(['Em assistência', 'Concluído', 'Sem movimento']);
    devices.forEach((d) => {
      if (d.status && d.status.trim()) {
        statusSet.add(d.status.trim());
      }
    });
    return ['TODOS', ...Array.from(statusSet)];
  }, [devices]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = devices.length;
    const emAssistencia = devices.filter((d) => (d.status || 'Em assistência').toLowerCase() === 'em assistência').length;
    const concluidos = devices.filter((d) => (d.status || '').toLowerCase() === 'concluído').length;
    const semMovimento = devices.filter((d) => (d.status || '').toLowerCase() === 'sem movimento').length;
    return { total, emAssistencia, concluidos, semMovimento };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selBrandNorm = selectedBrand.trim().toLowerCase();
    const selTypeNorm = selectedType.trim().toLowerCase();
    const selStatusNorm = selectedStatus.trim().toLowerCase();

    return devices.filter((d) => {
      // Type filter
      if (selTypeNorm !== 'todos') {
        const dType = (d.type || '').trim().toLowerCase();
        if (selTypeNorm === 'outros') {
          if (['smartphone', 'notebook', 'desktop', 'tablet', 'console'].includes(dType)) return false;
        } else if (dType !== selTypeNorm) {
          return false;
        }
      }

      // Brand filter
      if (selBrandNorm !== 'todos') {
        const dBrand = (d.brand || '').trim().toLowerCase();
        if (dBrand !== selBrandNorm) return false;
      }

      // Status filter
      if (selStatusNorm !== 'todos') {
        const dStatus = (d.status || 'em assistência').trim().toLowerCase();
        if (dStatus !== selStatusNorm) return false;
      }

      // Search query
      if (!q) return true;
      const brand = (d.brand || '').toLowerCase();
      const model = (d.model || '').toLowerCase();
      const imei = (d.imei || '').toLowerCase();
      const serial = (d.serialNumber || '').toLowerCase();
      const customer = (d.customerName || '').toLowerCase();

      return (
        brand.includes(q) ||
        model.includes(q) ||
        imei.includes(q) ||
        serial.includes(q) ||
        customer.includes(q)
      );
    });
  }, [devices, search, selectedType, selectedBrand, selectedStatus]);

  // Sorted Devices
  const sortedDevices = useMemo(() => {
    const list = [...filteredDevices];
    if (sortBy === 'recentes') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === 'antigos') {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === 'nome') {
      list.sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    }
    return list;
  }, [filteredDevices, sortBy]);

  // Paginated Devices
  const totalPages = Math.max(1, Math.ceil(sortedDevices.length / itemsPerPage));
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDevices.slice(start, start + itemsPerPage);
  }, [sortedDevices, currentPage, itemsPerPage]);

  const handleDeleteConfirm = () => {
    if (deviceToDelete) {
      StorageService.deleteDevice(deviceToDelete.id);
      setDeviceToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('TODOS');
    setSelectedBrand('TODOS');
    setSelectedStatus('TODOS');
    setSortBy('recentes');
  };

  // Type Icon Helper
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Smartphone':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'Notebook':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Desktop':
        return <Monitor className="w-3.5 h-3.5" />;
      case 'Tablet':
        return <TabletIcon className="w-3.5 h-3.5" />;
      case 'Console':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: devices.length,
      Smartphone: 0,
      Notebook: 0,
      Desktop: 0,
      Tablet: 0,
      Console: 0,
      Outros: 0,
    };
    devices.forEach((d) => {
      const t = d.type || '';
      if (['Smartphone', 'Notebook', 'Desktop', 'Tablet', 'Console'].includes(t)) {
        counts[t] = (counts[t] || 0) + 1;
      } else {
        counts['Outros'] = (counts['Outros'] || 0) + 1;
      }
    });
    return counts;
  }, [devices]);

  const typePills = [
    { label: 'Todos', count: typeCounts.TODOS, value: 'TODOS' },
    { label: 'Smartphone', count: typeCounts.Smartphone || 0, value: 'Smartphone' },
    { label: 'Notebook', count: typeCounts.Notebook || 0, value: 'Notebook' },
    { label: 'Desktop', count: typeCounts.Desktop || 0, value: 'Desktop' },
    { label: 'Tablet', count: typeCounts.Tablet || 0, value: 'Tablet' },
    { label: 'Console', count: typeCounts.Console || 0, value: 'Console' },
    { label: 'Outros', count: typeCounts.Outros || 0, value: 'Outros' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification for Copied Fields */}
      {copiedField && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-cyan-950 border border-cyan-500/50 rounded-xl text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{copiedField} copiado para a área de transferência!</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_25px_rgba(2,132,199,0.15)] text-white'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aparelhos Cadastrados
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie todos os aparelhos vinculados aos clientes, com histórico de serviços, IMEI e senhas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewDevice}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Aparelho</span>
        </button>
      </div>

      {/* 4 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Aparelhos (Blue) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-blue-950/40 via-[#09152a] to-blue-950/20 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
              : 'bg-blue-50/60 border-blue-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-blue-600/30 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-100 border-blue-300 text-blue-600'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>Total de Aparelhos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.total}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Total
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>Cadastrados no sistema</p>
            </div>
          </div>
        </div>

        {/* Card 2: Em Assistência (Amber) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/40 via-[#09152a] to-amber-950/20 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              : 'bg-amber-50/60 border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-600/30 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-amber-100 border-amber-300 text-amber-600'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>Em Assistência</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.emAssistencia}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Ativos
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-amber-300/70' : 'text-amber-600'}`}>Aguardando ou em serviço</p>
            </div>
          </div>
        </div>

        {/* Card 3: Concluídos (Purple) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-purple-950/40 via-[#09152a] to-purple-950/20 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
              : 'bg-purple-50/60 border-purple-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-purple-600/30 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-purple-100 border-purple-300 text-purple-600'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-purple-200/80' : 'text-purple-700'}`}>Concluídos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.concluidos}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Prontos
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>Entregues aos clientes</p>
            </div>
          </div>
        </div>

        {/* Card 4: Sem Movimento (Rose) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-rose-950/40 via-[#09152a] to-rose-950/20 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
              : 'bg-rose-50/60 border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-rose-600/30 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-rose-100 border-rose-300 text-rose-600'
            }`}>
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-rose-200/80' : 'text-rose-700'}`}>Sem Movimento</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.semMovimento}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> Parados
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-rose-300/70' : 'text-rose-600'}`}>Sem movimentação recente</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div
        className={`p-3 border rounded-2xl flex flex-col md:flex-row items-center gap-3 transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80'
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar marca, modelo, IMEI, nº de série ou cliente..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
              isDark
                ? 'bg-[#040a17] border-blue-900/80 text-white placeholder-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Filtros Button */}
          <button
            type="button"
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Filtros</span>
          </button>

          {/* Marca Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b === 'TODOS' ? 'Todas as Marcas' : b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Categoria Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'TODOS' ? 'Todas as Categorias' : t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'TODOS' ? 'Todos os Status' : s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Limpar Filters */}
          <button
            type="button"
            onClick={handleClearFilters}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#040a17] hover:bg-rose-950/80 border-blue-900/80 text-slate-300 hover:text-rose-300'
                : 'bg-slate-100 hover:bg-rose-50 border-slate-300 text-slate-700 hover:text-rose-600'
            }`}
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* CATEGORY PILLS & VIEW MODE ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {typePills.map((item) => {
            const isActive = selectedType === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedType(item.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-md'
                    : isDark
                    ? 'bg-[#09152a] hover:bg-blue-950/80 text-slate-300 border border-blue-900/80'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[11px] opacity-80 ${isActive ? 'text-cyan-200' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ({item.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode & Sort */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#09152a] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grid/List Toggle */}
          <div className={`flex items-center p-1 border rounded-xl ${
            isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border border-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border border-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DEVICE GRID CARDS */}
      {filteredDevices.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center text-slate-400 ${
          isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Smartphone className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Nenhum aparelho encontrado</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tente mudar os filtros de busca ou cadastre um novo equipamento.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {paginatedDevices.map((device) => {
            const isPasswordVisible = visiblePasswords[device.id] || false;
            const status = device.status || 'Em assistência';

            // Status Styling
            let statusStyle = isDark
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-300';
            if (status === 'Concluído') {
              statusStyle = isDark
                ? 'bg-blue-950/80 text-cyan-300 border-cyan-500/50'
                : 'bg-blue-50 text-blue-700 border-blue-300';
            } else if (status === 'Sem movimento') {
              statusStyle = isDark
                ? 'bg-slate-900/80 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-300';
            }

            return (
              <div
                key={device.id}
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between group ${
                  isDark
                    ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_20px_rgba(2,132,199,0.12)] hover:border-cyan-500/50'
                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Card Header: Photo + Badge + Title + Customer + Menu */}
                  <div className="flex items-start gap-3">
                    {/* Device Thumbnail */}
                    <div className="relative shrink-0">
                      <img
                        src={
                          device.photoUrl ||
                          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={device.model}
                        className={`w-14 h-14 rounded-xl object-cover border ${
                          isDark ? 'border-blue-900/80 bg-[#040a17]' : 'border-slate-200 bg-slate-100'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Right Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Category Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border flex items-center gap-1 ${
                            isDark
                              ? 'bg-blue-900/80 text-cyan-300 border-blue-700/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {getTypeIcon(device.type)}
                            <span>{device.type}</span>
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${statusStyle} flex items-center gap-1`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            <span>{status}</span>
                          </span>
                        </div>

                        {/* Three Dots Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCardMenu(activeCardMenu === device.id ? null : device.id)
                            }
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isDark
                                ? 'text-slate-400 hover:text-white hover:bg-blue-950'
                                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeCardMenu === device.id && (
                            <div className={`absolute right-0 top-7 z-20 w-36 border rounded-xl shadow-xl py-1 text-xs ${
                              isDark
                                ? 'bg-[#060e1d] border-blue-900 text-slate-300'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCardMenu(null);
                                  onEditDevice(device);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                                  isDark ? 'hover:text-white hover:bg-blue-900/60' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Editar</span>
                              </button>

                              {currentUser.permissions.canDeleteRecords && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCardMenu(null);
                                    setDeviceToDelete(device);
                                  }}
                                  className="w-full px-3 py-2 text-left text-rose-500 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Device Title */}
                      <h3 className={`font-black text-sm truncate leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {device.brand} {device.model}
                      </h3>

                      {/* Customer Name */}
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Cliente: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{device.customerName || 'Lucas Almeida Santos'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Device Specs & Secret Codes Table */}
                  <div className={`mt-3.5 p-2.5 rounded-xl border space-y-2 text-xs ${
                    isDark
                      ? 'bg-[#040a17] border-blue-900/60'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    {/* IMEI */}
                    {device.imei && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IMEI</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{device.imei}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(device.imei!, 'IMEI')}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title="Copiar IMEI"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nº Série */}
                    {device.serialNumber && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nº Série</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{device.serialNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(device.serialNumber!, 'Número de Série')}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title="Copiar Número de Série"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Senha/PIN */}
                    {device.passwordPin && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Senha/PIN</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{isPasswordVisible ? device.passwordPin : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(device.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title={isPasswordVisible ? 'Ocultar Senha' : 'Mostrar Senha'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-cyan-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Acessórios */}
                    {device.accessoriesDelivered && (
                      <div className={`flex items-center justify-between pt-0.5 border-t ${
                        isDark ? 'border-blue-900/40' : 'border-slate-200'
                      }`}>
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Acessórios</span>
                        <div className={`flex items-center gap-1.5 text-[11px] font-medium truncate max-w-[170px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <span className="truncate">{device.accessoriesDelivered}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(device.id)}
                            className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-blue-900/60' : 'border-slate-100'
                }`}>
                  {/* Left: OS Counter badge */}
                  <button
                    type="button"
                    onClick={() => setHistoryDevice(device)}
                    className={`flex items-center gap-1 text-xs font-black transition-colors cursor-pointer ${
                      isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-blue-600'
                    }`}
                    title="Ver Histórico de Ordens"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{device.osCount || 3} OS</span>
                  </button>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Ver Histórico */}
                    <button
                      type="button"
                      onClick={() => setHistoryDevice(device)}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-300 hover:text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Ver Histórico</span>
                    </button>

                    {/* Nova OS */}
                    <button
                      type="button"
                      onClick={() => onOpenNewOrderForDevice(device)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Nova OS</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER PAGINATION BAR */}
      <div
        className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 text-slate-400'
            : 'bg-white border-slate-200 shadow-xs text-slate-600'
        }`}
      >
        <div>
          <span>Mostrando </span>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>
            {filteredDevices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, filteredDevices.length)}
          </strong>
          <span> de </span>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>
            {filteredDevices.length} aparelhos
          </strong>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={`p-2 border rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-400 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-xl font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-xs'
                    : isDark
                    ? 'bg-[#040a17] hover:bg-blue-950 text-slate-300 border border-blue-900/80'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={`p-2 border rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-400 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Items Per Page Select */}
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`pl-3 pr-7 py-1.5 border rounded-xl font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-white focus:border-cyan-400'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History Modal for Device */}
      {historyDevice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setHistoryDevice(null)}
        >
          <div 
            className="w-full max-w-lg bg-[#09152a] border border-blue-900/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(2,132,199,0.25)] text-white relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setHistoryDevice(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#040a17] border border-blue-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  Histórico: {historyDevice.brand} {historyDevice.model}
                </h3>
                <p className="text-xs text-slate-400">Cliente: {historyDevice.customerName}</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-blue-900/40 max-h-72 overflow-y-auto pr-1">
              {orders
                .filter((o) => o.deviceId === historyDevice.id)
                .map((os) => (
                  <div
                    key={os.id}
                    onClick={() => {
                      setHistoryDevice(null);
                      onNavigateToOrder(os.id);
                    }}
                    className="py-3 flex items-center justify-between hover:bg-blue-950/60 p-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-cyan-400 text-xs">OS #{os.orderNumber}</span>
                      <span className="ml-2 text-xs font-semibold text-slate-300">
                        {getOrderStatusLabel(os.status)}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{os.clientDefect}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-xs">
                        {formatCurrency(os.totalPrice)}
                      </span>
                      <p className="text-[10px] text-slate-500">{formatDate(os.createdAt)}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryDevice(null)}
                className="px-5 py-2 bg-[#040a17] hover:bg-blue-950 border border-blue-900/80 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Aparelho"
        message={`Deseja realmente excluir o aparelho "${deviceToDelete?.brand} ${deviceToDelete?.model}" do cliente "${deviceToDelete?.customerName}"?`}
      />
    </div>
  );
};
