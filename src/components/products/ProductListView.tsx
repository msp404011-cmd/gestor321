import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  Download,
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Smartphone,
  Headphones,
  Laptop,
  Tv,
  Camera,
  Cable,
  Zap,
  Shield,
  HardDrive,
  Speaker,
  MoreHorizontal,
  Box,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import { Product } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/formatters';
import { SubscriptionService } from '../../services/subscriptionService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StockAdjustModal } from './StockAdjustModal';
import { BrandLogo } from '../../utils/brandUtils';
import { useTheme } from '../../context/ThemeContext';

interface ProductListViewProps {
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  onOpenNewProduct,
  onEditProduct,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Subscribe to Storage updates
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [customCategories, setCustomCategories] = useState(() => StorageService.getCustomCategories());
  const currentUser = StorageService.getCurrentUser();

  useEffect(() => {
    return StorageService.subscribe(() => {
      setProducts(StorageService.getProducts());
      setCustomCategories(StorageService.getCustomCategories());
    });
  }, []);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, selectedStatus, search]);

  // Brands list from products
  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category Filter
      if (selectedCategory !== 'TODOS' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Brand Filter
      if (selectedBrand !== 'TODAS' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Status Filter
      if (selectedStatus === 'EM_ESTOQUE' && (p.stockQuantity <= p.minStockQuantity || p.stockQuantity <= 0)) {
        return false;
      }
      if (selectedStatus === 'ESTOQUE_BAIXO' && (p.stockQuantity > p.minStockQuantity || p.stockQuantity <= 0)) {
        return false;
      }
      if (selectedStatus === 'ESGOTADO' && p.stockQuantity > 0) {
        return false;
      }

      // Search Query
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, selectedBrand, selectedStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      StorageService.deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  // Metrics calculation
  const totalProductsCount = products.length;
  const inStockCount = products.filter((p) => p.stockQuantity > p.minStockQuantity).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockQuantity).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  // Inventory Values calculations
  const totalCostValue = products.reduce(
    (acc, p) => acc + (p.costPrice || 0) * (p.stockQuantity > 0 ? p.stockQuantity : 0),
    0
  );
  const totalSellingValue = products.reduce(
    (acc, p) => acc + (p.sellingPrice || 0) * (p.stockQuantity > 0 ? p.stockQuantity : 0),
    0
  );
  const totalResellerValue = products.reduce(
    (acc, p) => acc + ((p.resellerPrice ?? p.sellingPrice) || 0) * (p.stockQuantity > 0 ? p.stockQuantity : 0),
    0
  );

  // Category Icon Resolver
  const getCategoryIcon = (iconName?: string, name?: string) => {
    const catUpper = (name || '').toUpperCase();
    if (catUpper.includes('CELULAR')) return <Smartphone className="w-4 h-4" />;
    if (catUpper.includes('ACESSÓRIO')) return <Headphones className="w-4 h-4" />;
    if (catUpper.includes('INFORMÁTICA')) return <Laptop className="w-4 h-4" />;
    if (catUpper.includes('PEÇAS')) return <Layers className="w-4 h-4" />;
    if (catUpper.includes('TV')) return <Tv className="w-4 h-4" />;
    if (catUpper.includes('CÂMERA')) return <Camera className="w-4 h-4" />;
    if (catUpper.includes('CABO')) return <Cable className="w-4 h-4" />;
    if (catUpper.includes('CARREGADOR')) return <Zap className="w-4 h-4" />;
    if (catUpper.includes('CAPINHA')) return <Shield className="w-4 h-4" />;
    if (catUpper.includes('PELÍCULA')) return <Smartphone className="w-4 h-4" />;
    if (catUpper.includes('ARMAZENAMENTO')) return <HardDrive className="w-4 h-4" />;
    if (catUpper.includes('ÁUDIO')) return <Speaker className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-4 font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-200 pb-8 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      
      {/* 1. HEADER BANNER */}
      <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isDark
          ? 'bg-[#09152a] border-blue-900/60 shadow-[0_0_20px_rgba(2,132,199,0.12)]'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Produtos & Estoque
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cadastre, gerencie e acompanhe seus produtos de forma simples e completa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => alert('Função para importar lista de produtos via planilha Excel.')}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/60 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-500" />
            <span>Importar (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Exportando inventário atual em formato CSV/Excel...')}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/60 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 text-cyan-500" />
            <span>Exportar</span>
          </button>

          {currentUser.permissions.canManageProducts && (
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP METRICS CARDS (STATUS COUNTS & VALOR DE ESTOQUE BREAKDOWN) */}
      <div className="space-y-2.5">
        {/* Row 1: Status Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total de Produtos */}
          <div className={`border rounded-2xl p-3 flex items-center gap-2.5 transition-all ${
            isDark
              ? 'bg-[#09152a] border-blue-900/60 shadow-[0_0_15px_rgba(2,132,199,0.1)]'
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-blue-600/30 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              <Box className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total de Produtos</p>
              <p className={`text-base sm:text-lg font-black leading-none mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalProductsCount}</p>
              <p className="text-[10px] text-cyan-500 font-semibold truncate mt-0.5">Cadastrados</p>
            </div>
          </div>

          {/* Em Estoque */}
          <div className={`border rounded-2xl p-3 flex items-center gap-2.5 transition-all ${
            isDark
              ? 'bg-[#09152a] border-blue-900/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Em Estoque</p>
              <p className={`text-base sm:text-lg font-black leading-none mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{inStockCount}</p>
              <p className="text-[10px] text-emerald-500 font-semibold truncate mt-0.5">Disponíveis</p>
            </div>
          </div>

          {/* Estoque Baixo */}
          <div className={`border rounded-2xl p-3 flex items-center gap-2.5 transition-all ${
            isDark
              ? 'bg-[#09152a] border-blue-900/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-600/30 border-amber-500/50 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estoque Baixo</p>
              <p className={`text-base sm:text-lg font-black leading-none mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{lowStockCount}</p>
              <p className="text-[10px] text-amber-500 font-semibold truncate mt-0.5">Atenção</p>
            </div>
          </div>

          {/* Esgotados */}
          <div className={`border rounded-2xl p-3 flex items-center gap-2.5 transition-all ${
            isDark
              ? 'bg-[#09152a] border-blue-900/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-rose-600/30 border-rose-500/50 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Esgotados</p>
              <p className={`text-base sm:text-lg font-black leading-none mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{outOfStockCount}</p>
              <p className="text-[10px] text-rose-500 font-semibold truncate mt-0.5">Sem estoque</p>
            </div>
          </div>
        </div>

        {/* Row 2: Valor em Estoque (Custo, Venda Final, Revenda) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Valor Custo */}
          <div className={`border rounded-2xl p-3 flex items-center gap-3 transition-all ${
            isDark
              ? 'bg-[#09152a] border-purple-900/50 shadow-[0_0_15px_rgba(139,92,246,0.12)]'
              : 'bg-white border-purple-200 shadow-xs'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-purple-600/30 border-purple-500/50 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Valor Custo</p>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">Custo</span>
              </div>
              <p className={`text-base sm:text-lg font-black leading-tight mt-0.5 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                R$ {totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Preço de custo em estoque</p>
            </div>
          </div>

          {/* Valor Venda Final */}
          <div className={`border rounded-2xl p-3 flex items-center gap-3 transition-all ${
            isDark
              ? 'bg-[#09152a] border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
              : 'bg-white border-emerald-200 shadow-xs'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>Valor Venda Final</p>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">Final</span>
              </div>
              <p className={`text-base sm:text-lg font-black leading-tight mt-0.5 truncate ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                R$ {totalSellingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Projeção venda no varejo</p>
            </div>
          </div>

          {/* Valor Revenda */}
          <div className={`border rounded-2xl p-3 flex items-center gap-3 transition-all ${
            isDark
              ? 'bg-[#09152a] border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
              : 'bg-white border-cyan-200 shadow-xs'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>Valor Revenda</p>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">Atacado</span>
              </div>
              <p className={`text-base sm:text-lg font-black leading-tight mt-0.5 truncate ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                R$ {totalResellerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Projeção venda revendedor</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY PILLS BAR (DYNAMICALLY DERIVED FROM SETTINGS!) */}
      <div className={`border rounded-2xl p-2 flex items-center gap-2 overflow-x-auto scrollbar-none transition-all ${
        isDark ? 'bg-[#081226] border-blue-900/60' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <button
          type="button"
          onClick={() => setSelectedCategory('TODOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            selectedCategory === 'TODOS'
              ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
              : isDark
              ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Box className="w-4 h-4 text-cyan-400" />
          <span>Todos</span>
          <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full ${
            isDark ? 'bg-blue-900/80 text-cyan-200' : 'bg-slate-200 text-slate-700 font-bold'
          }`}>
            {products.length}
          </span>
        </button>

        {customCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : isDark
                  ? 'bg-[#040a17] text-slate-400 border-blue-950 hover:text-white hover:border-blue-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {getCategoryIcon(cat.iconName, cat.name)}
              <span>{cat.name}</span>
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full ${
                isDark ? 'bg-blue-950 text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SEARCH AND FILTERS ROW */}
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
            placeholder="Buscar por nome, SKU, código de barras, marca ou localização..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs transition-all focus:outline-none ${
              isDark
                ? 'bg-[#040a17] border-blue-900/80 text-white placeholder-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Categoria */}
          <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs ${
            isDark ? 'bg-[#040a17] border-blue-900/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <option value="TODOS" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Todas</option>
              {customCategories.map((c) => (
                <option key={c.id} value={c.name} className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs ${
            isDark ? 'bg-[#040a17] border-blue-900/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Marca:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {brands.map((b) => (
                <option key={b} value={b} className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs ${
            isDark ? 'bg-[#040a17] border-blue-900/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <option value="TODOS" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Todos</option>
              <option value="EM_ESTOQUE" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Em Estoque</option>
              <option value="ESTOQUE_BAIXO" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Estoque Baixo</option>
              <option value="ESGOTADO" className={isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'}>Esgotado</option>
            </select>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* 5. PRODUCTS TABLE (MATCHING RR.PNG EXACT COLUMNS & MARCA LOGO!) */}
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
                      filteredProducts.length > 0 &&
                      selectedProductIds.length === filteredProducts.length
                    }
                    className={`rounded focus:ring-0 ${
                      isDark ? 'border-blue-900 bg-[#081226] text-cyan-500' : 'border-slate-300 bg-white text-blue-600'
                    }`}
                  />
                </th>
                <th className="py-3 px-3.5">PRODUTO</th>
                <th className="py-3 px-3.5">CATEGORIA</th>
                <th className="py-3 px-3.5">MARCA</th>
                <th className="py-3 px-3.5">SKU / CÓD. BARRAS</th>
                <th className="py-3 px-3.5 text-right">PREÇO CUSTO</th>
                <th className="py-3 px-3.5 text-right">PREÇO VENDA</th>
                {SubscriptionService.isResellerFeatureAllowed() && (
                  <th className="py-3 px-3.5 text-right">PREÇO REVENDA</th>
                )}
                <th className="py-3 px-3.5 text-center">ESTOQUE</th>
                <th className="py-3 px-3.5 text-center">STATUS</th>
                <th className="py-3 px-3.5 text-right">AÇÕES</th>
              </tr>
            </thead>

            <tbody className={`divide-y font-medium ${isDark ? 'divide-blue-950/60' : 'divide-slate-200'}`}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nenhum produto encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tente redefinir os filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockQuantity;

                  return (
                    <tr
                      key={p.id}
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
                          onChange={() => handleSelectOne(p.id)}
                          className={`rounded focus:ring-0 ${
                            isDark ? 'border-blue-900 bg-[#081226] text-cyan-500' : 'border-slate-300 bg-white text-blue-600'
                          }`}
                        />
                      </td>

                      {/* Produto (Image + Title + Subtitle) */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.photoUrl || ''}
                            alt={p.name}
                            className={`w-10 h-10 rounded-xl object-cover border shrink-0 ${
                              p.photoUrl ? (isDark ? 'border-blue-900/80 bg-slate-900' : 'border-slate-200 bg-slate-100') : 'hidden'
                            }`}
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className={`font-bold text-xs leading-snug line-clamp-1 ${
                              isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-blue-600'
                            }`}>
                              {p.name}
                            </p>
                            <p className={`text-[10px] line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {p.description || p.model || 'Produto em estoque'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className={`py-3 px-3.5 font-semibold text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {p.category}
                      </td>

                      {/* MARCA WITH AUTOMATIC BRAND LOGO */}
                      <td className="py-3 px-3.5">
                        <BrandLogo brandName={p.brand || 'Genérica'} />
                      </td>

                      {/* SKU / Cód Barras */}
                      <td className={`py-3 px-3.5 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{p.sku}</p>
                        {p.barcode && <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{p.barcode}</p>}
                      </td>

                      {/* Preço Custo */}
                      <td className={`py-3 px-3.5 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        R$ {p.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Preço Venda Final */}
                      <td className={`py-3 px-3.5 text-right font-bold text-emerald-600`}>
                        R$ {p.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Preço Revenda - Only if allowed */}
                      {SubscriptionService.isResellerFeatureAllowed() && (
                        <td className={`py-3 px-3.5 text-right font-bold text-blue-600`}>
                          R$ {(p.resellerPrice ?? p.sellingPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Estoque Badge */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] sm:text-[11px] font-black rounded-md border whitespace-nowrap ${
                            isOutOfStock
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                              : isLowStock
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
                          }`}
                        >
                          {p.stockQuantity.toLocaleString('pt-BR')} un
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap bg-rose-500/15 border border-rose-500/30 text-rose-500">
                            Esgotado
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap bg-amber-500/15 border border-amber-500/30 text-amber-500">
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
                            Em Estoque
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setProductToAdjust(p)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title="Ajuste de Estoque Rápido"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {currentUser.permissions.canManageProducts && (
                            <button
                              type="button"
                              onClick={() => onEditProduct(p)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                              }`}
                              title="Editar Produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {currentUser.permissions.canDeleteRecords && (
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION BAR */}
        <div className={`border-t p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#040a17] border-blue-900/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Mostrando <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span> a <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
            </span> de <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredProducts.length}
            </span> produtos
            {selectedProductIds.length > 0 && (
              <span className="ml-2 text-cyan-400 font-bold">
                ({selectedProductIds.length} selecionado{selectedProductIds.length > 1 ? 's' : ''})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Exibir</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`border rounded-lg px-2 py-1 font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'bg-[#081226] border-blue-900/80 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <span>
              Página <strong className={isDark ? 'text-white' : 'text-slate-900'}>{currentPage}</strong> de <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className={`p-1 rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`p-1 rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`p-1 rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className={`p-1 rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'bg-[#081226] border-blue-900/80 hover:bg-blue-950 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={Boolean(productToAdjust)}
        onClose={() => setProductToAdjust(null)}
        product={productToAdjust}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Produto"
        message={`Deseja realmente excluir o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};
