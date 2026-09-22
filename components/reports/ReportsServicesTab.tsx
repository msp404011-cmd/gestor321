import React, { useState, useMemo } from 'react';
import {
  Wrench,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  User,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  X,
  Layers,
  Sparkles,
  Percent,
} from 'lucide-react';
import { formatCurrency, formatDate, getCanonicalStatus, getOrderStatusLabel, getOrderStatusBadgeClasses } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { ServiceOrder, OrderStatus } from '../../types';

interface ReportsServicesTabProps {
  orders: ServiceOrder[];
  onExport: (type: string) => void;
}

export const ReportsServicesTab: React.FC<ReportsServicesTabProps> = ({ orders, onExport }) => {
  const { isDark } = useTheme();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('ALL');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('ALL');

  // Technician list
  const techniciansList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.technicianName) set.add(o.technicianName);
    });
    return Array.from(set);
  }, [orders]);

  // Device types list
  const deviceTypesList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.deviceType) set.add(o.deviceType);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesClient = (o.customerName || '').toLowerCase().includes(term);
        const matchesNum = String(o.orderNumber || '').includes(term);
        const matchesDevice = `${o.brand || ''} ${o.model || ''}`.toLowerCase().includes(term);
        const matchesDefect = (o.clientDefect || o.requestedService || '').toLowerCase().includes(term);
        if (!matchesClient && !matchesNum && !matchesDevice && !matchesDefect) return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        const canonical = getCanonicalStatus(o.status);
        if (canonical !== selectedStatus && o.status !== selectedStatus) return false;
      }

      // Technician
      if (selectedTechnician !== 'ALL' && o.technicianName !== selectedTechnician) {
        return false;
      }

      // Device Type
      if (selectedDeviceType !== 'ALL' && o.deviceType !== selectedDeviceType) {
        return false;
      }

      return true;
    });
  }, [orders, searchTerm, selectedStatus, selectedTechnician, selectedDeviceType]);

  // KPIs
  const totalOrdersCount = filteredOrders.length;
  const deliveredOrders = useMemo(
    () => filteredOrders.filter((o) => getCanonicalStatus(o.status) === 'ENTREGUE' || o.paymentStatus === 'PAGO'),
    [filteredOrders]
  );
  const totalRevenue = useMemo(
    () => deliveredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    [deliveredOrders]
  );
  const totalLaborRevenue = useMemo(
    () => deliveredOrders.reduce((acc, o) => acc + (o.laborPrice || 0), 0),
    [deliveredOrders]
  );
  const totalPartsRevenue = useMemo(
    () => deliveredOrders.reduce((acc, o) => acc + (o.partsPrice || 0), 0),
    [deliveredOrders]
  );
  const completionRate = totalOrdersCount > 0 ? Math.round((deliveredOrders.length / totalOrdersCount) * 100) : 0;

  // Technician performance metrics
  const technicianPerformance = useMemo(() => {
    const map: Record<
      string,
      { totalOrders: number; completedOrders: number; laborRevenue: number; partsRevenue: number; totalRevenue: number }
    > = {};

    filteredOrders.forEach((o) => {
      const tech = o.technicianName || 'Técnico Não Definido';
      if (!map[tech]) {
        map[tech] = {
          totalOrders: 0,
          completedOrders: 0,
          laborRevenue: 0,
          partsRevenue: 0,
          totalRevenue: 0,
        };
      }
      map[tech].totalOrders += 1;
      const isDone = getCanonicalStatus(o.status) === 'ENTREGUE' || o.paymentStatus === 'PAGO';
      if (isDone) {
        map[tech].completedOrders += 1;
        map[tech].laborRevenue += o.laborPrice || 0;
        map[tech].partsRevenue += o.partsPrice || 0;
        map[tech].totalRevenue += o.totalPrice || 0;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  // Top Brands / Models Breakdown
  const brandBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const brand = o.brand || 'Outras';
      map[brand] = (map[brand] || 0) + 1;
    });
    return Object.entries(map)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders, totalOrdersCount]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* KPI Cards for Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Faturamento OS */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Faturamento em Serviços
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(totalRevenue)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {deliveredOrders.length} OS entregues/pagas
          </span>
        </div>

        {/* Card 2: Mão de Obra Pura */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Receita em Mão de Obra
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-emerald-500`}>
            {formatCurrency(totalLaborRevenue)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalRevenue > 0 ? Math.round((totalLaborRevenue / totalRevenue) * 100) : 0}% do faturamento de OS
          </span>
        </div>

        {/* Card 3: Peças em OS */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Peças Aplicadas em OS
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-purple-500`}>
            {formatCurrency(totalPartsRevenue)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Componentes e telas instalados
          </span>
        </div>

        {/* Card 4: Total de OS Registradas */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Total de Ordens de Serviço
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalOrdersCount}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Registradas na assistência
          </span>
        </div>

        {/* Card 5: Taxa de Conclusão */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-cyan-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Taxa de Conclusão
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-cyan-500`}>
            {completionRate}%
          </p>
          <span className={`text-[11px] mt-1 block font-semibold text-cyan-600`}>
            {deliveredOrders.length} de {totalOrdersCount} finalizadas
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cliente, aparelho, nº da OS ou defeito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark
                  ? 'bg-[#0c1c38] text-white border-blue-800/80 placeholder-slate-500'
                  : 'bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todos os Status</option>
              <option value="ORCAMENTO">Orçamento</option>
              <option value="AGUARDANDO_AUTORIZACAO">Aguardando Autorização</option>
              <option value="AUTORIZADO">Autorizado / Em Manutenção</option>
              <option value="AGUARDANDO_PECA">Aguardando Peça</option>
              <option value="PRONTO">Pronto para Entrega</option>
              <option value="ENTREGUE">Entregue / Concluído</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Technician Filter */}
          {techniciansList.length > 0 && (
            <div className="relative">
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
                }`}
              >
                <option value="ALL">Todos os Técnicos</option>
                {techniciansList.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}

          {/* Device Type Filter */}
          {deviceTypesList.length > 0 && (
            <div className="relative">
              <select
                value={selectedDeviceType}
                onChange={(e) => setSelectedDeviceType(e.target.value)}
                className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
                }`}
              >
                <option value="ALL">Todos os Dispositivos</option>
                {deviceTypesList.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('SERVICOS_CSV')}
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#0c1c38] text-emerald-300 border-emerald-900/80 hover:bg-emerald-900/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => onExport('SERVICOS_PDF')}
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#0c1c38] text-rose-300 border-rose-900/80 hover:bg-rose-900/30'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Printer className="w-4 h-4 text-rose-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Middle Grid: Technician Performance & Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Desempenho por Técnico */}
        <div
          className={`lg:col-span-7 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Desempenho & Produtividade por Técnico
            </h3>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mão de Obra e Conclusão
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b text-[11px] uppercase font-bold ${
                  isDark ? 'text-slate-400 border-blue-900/40' : 'text-slate-500 border-slate-200'
                }`}>
                  <th className="py-2 px-2">Técnico</th>
                  <th className="py-2 px-2 text-center">Total OS</th>
                  <th className="py-2 px-2 text-center">Concluídas</th>
                  <th className="py-2 px-2 text-right">Mão de Obra</th>
                  <th className="py-2 px-2 text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
                {technicianPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                      Nenhum dado de técnico encontrado
                    </td>
                  </tr>
                ) : (
                  technicianPerformance.map((tech, idx) => (
                    <tr key={idx} className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <td className="py-2.5 px-2 font-bold flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>{tech.name}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold">{tech.totalOrders}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500">
                          {tech.completedOrders} ({tech.totalOrders > 0 ? Math.round((tech.completedOrders / tech.totalOrders) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-500 font-bold">
                        {formatCurrency(tech.laborRevenue)}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(tech.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Marcas Atendidas */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Top Marcas & Aparelhos Atendidos
            </h3>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Frequência
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {brandBreakdown.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">Nenhum aparelho registrado</p>
            ) : (
              brandBreakdown.map((b, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {b.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-500">{b.percentage}%</span>
                      <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        ({b.count} OS)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(b.percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Detailed Orders Table */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Relatório Analítico de Ordens de Serviço (OS)
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Listagem completa de ordens de serviço, diagnósticos, peças e valores
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700'
          }`}>
            {filteredOrders.length} ordens de serviço
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase font-bold ${
                isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'
              }`}>
                <th className="py-2.5 px-3">OS Nº</th>
                <th className="py-2.5 px-3">Entrada</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Aparelho</th>
                <th className="py-2.5 px-3">Defeito / Serviço</th>
                <th className="py-2.5 px-3">Técnico</th>
                <th className="py-2.5 px-3 text-right">Peças (R$)</th>
                <th className="py-2.5 px-3 text-right">M.O. (R$)</th>
                <th className="py-2.5 px-3 text-right">Valor Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    Nenhuma ordem de serviço encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusLabel = getOrderStatusLabel(order.status);
                  const badgeClasses = getOrderStatusBadgeClasses(order.status);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-blue-500/5 transition-colors ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3 px-3 font-black text-amber-500 whitespace-nowrap">
                        #{String(order.orderNumber || order.id).slice(-5)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-semibold truncate max-w-[140px]">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[140px]">
                        <span className="font-bold">{order.brand}</span> {order.model}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[180px]" title={order.clientDefect || order.requestedService}>
                        {order.clientDefect || order.requestedService || 'Manutenção geral'}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[120px]">
                        {order.technicianName || 'Não atribuído'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                        {formatCurrency(order.partsPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-500 font-semibold whitespace-nowrap">
                        {formatCurrency(order.laborPrice || 0)}
                      </td>
                      <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(order.totalPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
