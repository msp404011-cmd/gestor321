import React, { useState, useMemo } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  X,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Tag,
  Percent,
} from 'lucide-react';
import { formatCurrency } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../types';

interface ReportsProductsTabProps {
  products: Product[];
  onExport: (type: string) => void;
}

export const ReportsProductsTab: React.FC<ReportsProductsTabProps> = ({ products, onExport }) => {
  const { isDark } = useTheme();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'totalValue' | 'stock' | 'profit' | 'name'>('totalValue');

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(term);
        const matchesSku = (p.sku || '').toLowerCase().includes(term);
        const matchesBarcode = (p.barcode || '').toLowerCase().includes(term);
        const matchesBrand = (p.brand || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesBrand) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Stock status
      const stock = p.stockQuantity ?? p.stock ?? 0;
      const minStock = p.minStockQuantity ?? p.minStock ?? 0;

      if (selectedStockStatus === 'OUT') {
        if (stock > 0) return false;
      } else if (selectedStockStatus === 'LOW') {
        if (stock <= 0 || stock > minStock) return false;
      } else if (selectedStockStatus === 'NORMAL') {
        if (stock <= minStock) return false;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      const stockA = a.stockQuantity ?? a.stock ?? 0;
      const stockB = b.stockQuantity ?? b.stock ?? 0;
      const costA = (a.costPrice || 0) * stockA;
      const costB = (b.costPrice || 0) * stockB;
      const profitA = ((a.sellingPrice || 0) - (a.costPrice || 0)) * stockA;
      const profitB = ((b.sellingPrice || 0) - (b.costPrice || 0)) * stockB;

      if (sortBy === 'totalValue') return costB - costA;
      if (sortBy === 'stock') return stockB - stockA;
      if (sortBy === 'profit') return profitB - profitA;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [products, searchTerm, selectedCategory, selectedStockStatus, sortBy]);

  // KPI Calculations
  const totalItemsCount = products.length;
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.stockQuantity ?? p.stock ?? 0), 0),
    [products]
  );
  const totalCostValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stockQuantity ?? p.stock ?? 0), 0),
    [products]
  );
  const totalSaleValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.sellingPrice || 0) * (p.stockQuantity ?? p.stock ?? 0), 0),
    [products]
  );
  const totalPotentialProfit = totalSaleValue - totalCostValue;
  const potentialMargin = totalSaleValue > 0 ? Math.round((totalPotentialProfit / totalSaleValue) * 100) : 0;

  // Low stock and out of stock items
  const lowStockItems = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stockQuantity ?? p.stock ?? 0;
      const minStock = p.minStockQuantity ?? p.minStock ?? 0;
      return stock <= minStock;
    });
  }, [products]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalCost: number; totalSale: number }> = {};
    products.forEach((p) => {
      const cat = p.category || 'Geral';
      if (!map[cat]) map[cat] = { count: 0, totalCost: 0, totalSale: 0 };
      const stock = p.stockQuantity ?? p.stock ?? 0;
      map[cat].count += stock;
      map[cat].totalCost += (p.costPrice || 0) * stock;
      map[cat].totalSale += (p.sellingPrice || 0) * stock;
    });

    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        ...data,
        percentage: totalCostValue > 0 ? Math.round((data.totalCost / totalCostValue) * 100) : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [products, totalCostValue]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* KPI Cards for Products/Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Valor em Estoque a Custo */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Estoque a Custo (CMV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(totalCostValue)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalStockUnits} unidades estocadas
          </span>
        </div>

        {/* Card 2: Valor a Preço de Venda */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Estoque a Preço de Venda
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-emerald-500`}>
            {formatCurrency(totalSaleValue)}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Receita bruta potencial
          </span>
        </div>

        {/* Card 3: Lucro Bruto Estimado */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-purple-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Lucro Potencial em Estoque
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-purple-500`}>
            {formatCurrency(totalPotentialProfit)}
          </p>
          <span className={`text-[11px] mt-1 block font-semibold text-purple-600`}>
            Margem Teórica: {potentialMargin}%
          </span>
        </div>

        {/* Card 4: Total de Itens Cadastrados */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-cyan-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Mix de Produtos / SKUs
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalItemsCount}
          </p>
          <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {categoriesList.length} categorias ativas
          </span>
        </div>

        {/* Card 5: Alertas de Reposição */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-rose-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Alertas de Reposição
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight text-rose-500`}>
            {lowStockItems.length}
          </p>
          <span className={`text-[11px] mt-1 block font-bold text-rose-600`}>
            Itens no mínimo ou zerados
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
              placeholder="Buscar por nome, SKU, código de barras ou marca..."
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

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todas as Categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Stock Status Filter */}
          <div className="relative">
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todos os Níveis de Estoque</option>
              <option value="NORMAL">Estoque Normal</option>
              <option value="LOW">Estoque Baixo / No Mínimo</option>
              <option value="OUT">Sem Estoque / Zerado</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="totalValue">Ordenar: Maior Valor Total</option>
              <option value="stock">Ordenar: Maior Qtd Estoque</option>
              <option value="profit">Ordenar: Maior Lucro Potencial</option>
              <option value="name">Ordenar: Nome (A-Z)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('ESTOQUE_CSV')}
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
            onClick={() => onExport('ESTOQUE_PDF')}
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

      {/* Low stock alert banner if any */}
      {lowStockItems.length > 0 && selectedStockStatus === 'ALL' && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#291216] border-rose-900/80 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs">
                Atenção: {lowStockItems.length} produtos atingiram o nível de estoque mínimo ou estão zerados!
              </h4>
              <p className="text-[11px] opacity-80 mt-0.5">
                Faça o pedido de reposição com seus fornecedores para não perder vendas ou atrasar ordens de serviço.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStockStatus('LOW')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-colors shadow-xs"
          >
            Filtrar Itens Críticos
          </button>
        </div>
      )}

      {/* Main Inventory Position Table */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Posição Físico-Financeira do Estoque
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Detalhamento de quantidades, custos, preços de venda e margens unitárias
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
          }`}>
            {filteredProducts.length} produtos exibidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase font-bold ${
                isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'
              }`}>
                <th className="py-2.5 px-3">SKU / Cód.</th>
                <th className="py-2.5 px-3">Produto / Peça</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-center">Estoque Atual</th>
                <th className="py-2.5 px-3 text-center">Mínimo</th>
                <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                <th className="py-2.5 px-3 text-right">Venda Unit.</th>
                <th className="py-2.5 px-3 text-right">Margem</th>
                <th className="py-2.5 px-3 text-right">Total a Custo</th>
                <th className="py-2.5 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.stockQuantity ?? p.stock ?? 0;
                  const minStock = p.minStockQuantity ?? p.minStock ?? 0;
                  const cost = p.costPrice || 0;
                  const sale = p.sellingPrice || 0;
                  const margin = sale > 0 ? Math.round(((sale - cost) / sale) * 100) : 0;
                  const totalCostItem = cost * stock;

                  let statusBadge = {
                    label: 'Normal',
                    bg: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
                  };

                  if (stock === 0) {
                    statusBadge = {
                      label: 'Sem Estoque',
                      bg: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
                    };
                  } else if (stock <= minStock) {
                    statusBadge = {
                      label: 'Estoque Baixo',
                      bg: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
                    };
                  }

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-500/5 transition-colors ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-500 whitespace-nowrap">
                        {p.sku || p.barcode || `#${p.id.slice(0, 6)}`}
                      </td>
                      <td className="py-3 px-3 font-semibold truncate max-w-[200px]">
                        {p.name}
                        {p.brand && <span className="text-[10px] text-slate-400 block">{p.brand}</span>}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.category || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-black whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${
                          stock === 0
                            ? 'text-rose-500 bg-rose-500/10'
                            : stock <= minStock
                            ? 'text-amber-500 bg-amber-500/10'
                            : isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {stock} un
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 whitespace-nowrap">
                        {minStock} un
                      </td>
                      <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                        {formatCurrency(cost)}
                      </td>
                      <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(sale)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-500 font-bold whitespace-nowrap">
                        {margin}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        {formatCurrency(totalCostItem)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.bg}`}>
                          {statusBadge.label}
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
