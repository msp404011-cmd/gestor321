import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  Filter,
  CreditCard,
  User,
  Calendar,
  Eye,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  X,
  PackageCheck,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Sale, PaymentMethod } from '../../types';

interface ReportsSalesTabProps {
  sales: Sale[];
  onExport: (type: string) => void;
}

export const ReportsSalesTab: React.FC<ReportsSalesTabProps> = ({ sales, onExport }) => {
  const { isDark } = useTheme();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [selectedSeller, setSelectedSeller] = useState<string>('ALL');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Sellers list
  const sellersList = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.sellerName) set.add(s.sellerName);
    });
    return Array.from(set);
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesClient = (s.customerName || '').toLowerCase().includes(term);
        const matchesSaleNum = String(s.saleNumber || '').includes(term);
        const matchesItems = (s.items || []).some((item) =>
          (item.productName || '').toLowerCase().includes(term)
        );
        if (!matchesClient && !matchesSaleNum && !matchesItems) return false;
      }

      // Payment method
      if (selectedPaymentMethod !== 'ALL' && s.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Seller
      if (selectedSeller !== 'ALL' && s.sellerName !== selectedSeller) {
        return false;
      }

      return true;
    });
  }, [sales, searchTerm, selectedPaymentMethod, selectedSeller]);

  // Aggregated KPI metrics for filtered sales
  const totalGrossSales = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.total || 0), 0),
    [filteredSales]
  );
  const totalSalesCount = filteredSales.length;
  const averageTicket = totalSalesCount > 0 ? totalGrossSales / totalSalesCount : 0;
  const totalDiscounts = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.discount || 0), 0),
    [filteredSales]
  );
  const totalCogs = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.costTotal || s.totalCost || 0), 0),
    [filteredSales]
  );
  const totalGrossProfit = totalGrossSales - totalCogs;
  const profitMargin = totalGrossSales > 0 ? Math.round((totalGrossProfit / totalGrossSales) * 100) : 0;

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredSales.forEach((s) => {
      const pm = s.paymentMethod || 'DINHEIRO';
      if (!map[pm]) map[pm] = { count: 0, total: 0 };
      map[pm].count += 1;
      map[pm].total += s.total || 0;
    });

    return Object.entries(map)
      .map(([method, data]) => ({
        method: method as PaymentMethod,
        label: getPaymentMethodLabel(method),
        count: data.count,
        total: data.total,
        percentage: totalGrossSales > 0 ? Math.round((data.total / totalGrossSales) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSales, totalGrossSales]);

  // Top Sold Products
  const topProducts = useMemo(() => {
    const productMap: Record<
      string,
      { name: string; quantity: number; totalRevenue: number; totalCost: number }
    > = {};

    filteredSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const pId = item.productId || item.productName;
        if (!productMap[pId]) {
          productMap[pId] = {
            name: item.productName,
            quantity: 0,
            totalRevenue: 0,
            totalCost: 0,
          };
        }
        productMap[pId].quantity += item.quantity || 1;
        productMap[pId].totalRevenue += item.total || (item.unitPrice * item.quantity);
        const cost = (item.unitCost || item.costPrice || 0) * (item.quantity || 1);
        productMap[pId].totalCost += cost;
      });
    });

    return Object.values(productMap)
      .map((p) => ({
        ...p,
        profit: p.totalRevenue - p.totalCost,
        margin: p.totalRevenue > 0 ? Math.round(((p.totalRevenue - p.totalCost) / p.totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* KPI Cards for Sales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Faturamento PDV */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Total Vendido PDV
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(totalGrossSales)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalSalesCount} cupons emitidos
          </span>
        </div>

        {/* Card 2: Quantidade de Vendas */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-cyan-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Volume de Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalSalesCount}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Vendas no período filtrado
          </span>
        </div>

        {/* Card 3: Ticket Médio */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(averageTicket)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Média por cliente/cupom
          </span>
        </div>

        {/* Card 4: Descontos Concedidos */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Descontos Aplicados
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-amber-500`}>
            {formatCurrency(totalDiscounts)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalGrossSales > 0 ? Math.round((totalDiscounts / (totalGrossSales + totalDiscounts)) * 100) : 0}% de desconto médio
          </span>
        </div>

        {/* Card 5: Lucro Bruto PDV */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Lucro Bruto (PDV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-emerald-500`}>
            {formatCurrency(totalGrossProfit)}
          </p>
          <span className={`text-[11px] mt-1 block font-semibold text-emerald-600`}>
            Margem Bruta: {profitMargin}%
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
              placeholder="Buscar por cliente, nº da venda ou produto..."
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

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todas as Formas de Pagamento</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="A_PRAZO">A Prazo / Fiado</option>
              <option value="BOLETO">Boleto / Crediário</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Seller Filter */}
          {sellersList.length > 0 && (
            <div className="relative">
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
                }`}
              >
                <option value="ALL">Todos os Vendedores</option>
                {sellersList.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller}
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
            onClick={() => onExport('VENDAS_CSV')}
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
            onClick={() => onExport('VENDAS_PDF')}
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

      {/* Middle Grid: Payment Breakdown & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Forma de Pagamento Breakdown */}
        <div
          className={`lg:col-span-6 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Vendas por Forma de Pagamento
            </h3>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {paymentBreakdown.length} métodos
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {paymentBreakdown.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">Nenhuma venda no filtro</p>
            ) : (
              paymentBreakdown.map((pm, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {pm.label}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ({pm.count} vendas)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-500">{pm.percentage}%</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(pm.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pm.percentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Top 5 Produtos Mais Vendidos */}
        <div
          className={`lg:col-span-6 p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Top 5 Produtos Mais Vendidos no PDV
            </h3>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ranking de volume
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {topProducts.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">Nenhum item vendido no filtro</p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-[#0c1c38]/60 border-blue-900/40' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-500 font-black text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.name}
                      </p>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {p.quantity} un. vendidas • Margem {p.margin}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`font-black block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(p.totalRevenue)}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold block">
                      Lucro: {formatCurrency(p.profit)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Detailed Sales Table */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Histórico Analítico de Vendas & Cupons PDV
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Listagem de todas as saídas de balcão e caixas
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
          }`}>
            {filteredSales.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase font-bold ${
                isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'
              }`}>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Cupom / Nº</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Vendedor</th>
                <th className="py-2.5 px-3 text-center">Itens</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3 text-right">Desconto</th>
                <th className="py-2.5 px-3 text-right">Valor Total</th>
                <th className="py-2.5 px-3 text-right">Lucro</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const saleProfit = (sale.total || 0) - (sale.costTotal || sale.totalCost || 0);
                  const itemCount = (sale.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-blue-500/5 transition-colors ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        {formatDateTime(sale.date || sale.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-500 whitespace-nowrap">
                        #{String(sale.saleNumber || sale.id).slice(-6)}
                      </td>
                      <td className="py-3 px-3 font-semibold truncate max-w-[160px]">
                        {sale.customerName || 'Consumidor Final'}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[120px]">
                        {sale.sellerName || 'Caixa Padrão'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {itemCount} un
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <CreditCard className="w-3 h-3" />
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-amber-500 font-semibold whitespace-nowrap">
                        {sale.discount > 0 ? `- ${formatCurrency(sale.discount)}` : 'R$ 0,00'}
                      </td>
                      <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-500 font-bold whitespace-nowrap">
                        {formatCurrency(saleProfit)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSaleDetail(sale)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                          }`}
                          title="Ver Detalhes dos Itens"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#09152a] border-blue-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-500">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Cupom de Venda #{String(selectedSaleDetail.saleNumber || selectedSaleDetail.id).slice(-6)}
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatDateTime(selectedSaleDetail.date || selectedSaleDetail.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-500/20 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-500/10">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente</span>
                  <span className="font-bold">{selectedSaleDetail.customerName || 'Consumidor Final'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendedor</span>
                  <span className="font-bold">{selectedSaleDetail.sellerName || 'Caixa Padrão'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Forma Pagamento</span>
                  <span className="font-bold text-blue-500">
                    {getPaymentMethodLabel(selectedSaleDetail.paymentMethod)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Desconto Concedido</span>
                  <span className="font-bold text-amber-500">
                    {formatCurrency(selectedSaleDetail.discount || 0)}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div>
                <span className="font-bold text-xs block mb-2">Itens da Venda:</span>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(selectedSaleDetail.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold">{item.productName}</p>
                        <span className="text-slate-400 text-[11px]">
                          {item.quantity} un x {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <span className="font-black text-sm">
                        {formatCurrency(item.total || item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary total */}
              <div className="border-t pt-3 flex items-center justify-between font-black text-base">
                <span>VALOR TOTAL:</span>
                <span className="text-blue-500">{formatCurrency(selectedSaleDetail.total)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSaleDetail(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
