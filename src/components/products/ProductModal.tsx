import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  Plus,
  BarChart2,
  FileText,
  Coins,
  Tag,
  MapPin,
  Image as ImageIcon,
  Barcode,
  Building2,
  Smartphone,
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  Box,
  Bell,
  UploadCloud,
  Check,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { StorageService, CustomCategory } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categoryContainerRef = useRef<HTMLDivElement | null>(null);
  const brandContainerRef = useRef<HTMLDivElement | null>(null);

  // Categories state from StorageService
  const [availableCategories, setAvailableCategories] = useState<CustomCategory[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Brands state from StorageService
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [isBrandOpen, setIsBrandOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Acessórios');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);
  const [resellerPrice, setResellerPrice] = useState<number | ''>(0);
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [minStockQuantity, setMinStockQuantity] = useState<number | ''>(0);
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [keepOpen, setKeepOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState('');

  // Load Categories & Brands on Open
  useEffect(() => {
    if (isOpen) {
      const cats = StorageService.getCustomCategories();
      setAvailableCategories(cats);
      const bnds = StorageService.getCustomBrands();
      setAvailableBrands(bnds);
    }
  }, [isOpen]);

  // Close Category/Brand Dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        brandContainerRef.current &&
        !brandContainerRef.current.contains(e.target as Node)
      ) {
        setIsBrandOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      const catVal = productToEdit.category || 'Acessórios';
      setCategory(catVal);
      setCategorySearch(catVal);
      const brandVal = productToEdit.brand || '';
      setBrand(brandVal);
      setBrandSearch(brandVal);
      setModel(productToEdit.model || '');
      setCostPrice(productToEdit.costPrice ?? 0);
      setSellingPrice(productToEdit.sellingPrice ?? 0);
      setResellerPrice(productToEdit.resellerPrice ?? productToEdit.sellingPrice ?? 0);
      setStockQuantity(productToEdit.stockQuantity ?? 0);
      setMinStockQuantity(productToEdit.minStockQuantity ?? 0);
      setLocation(productToEdit.location || '');
      setPhotoUrl(productToEdit.photoUrl || '');
    } else {
      setName('');
      setSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
      setBarcode('');
      setCategory('Acessórios');
      setCategorySearch('Acessórios');
      setBrand('');
      setBrandSearch('');
      setModel('');
      setCostPrice(0);
      setSellingPrice(0);
      setResellerPrice(0);
      setStockQuantity(0);
      setMinStockQuantity(0);
      setLocation('');
      setPhotoUrl('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Numeric parsing
  const numCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
  const numSelling = typeof sellingPrice === 'number' ? sellingPrice : parseFloat(sellingPrice) || 0;
  const numReseller = typeof resellerPrice === 'number' ? resellerPrice : parseFloat(resellerPrice) || 0;

  // Calculations
  const grossProfit = Math.max(0, numSelling - numCost);
  const markupPercent = numCost > 0 ? ((numSelling - numCost) / numCost) * 100 : 0;

  const resellerGrossProfit = Math.max(0, numReseller - numCost);
  const resellerMarkupPercent = numCost > 0 ? ((numReseller - numCost) / numCost) * 100 : 0;

  // Auto calculate margin suggestion (150% and 80% markup on cost)
  const handleCalculateMargin = () => {
    if (numCost > 0) {
      const suggestedSelling = numCost * 2.5;
      const suggestedReseller = numCost * 1.8;
      setSellingPrice(parseFloat(suggestedSelling.toFixed(2)));
      setResellerPrice(parseFloat(suggestedReseller.toFixed(2)));
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('A imagem excede o tamanho máximo de 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('O nome do produto ou peça é obrigatório.');
      return;
    }

    const product: Product = {
      id: productToEdit ? productToEdit.id : 'prod-' + Date.now(),
      name: name.trim(),
      sku: sku.trim() || 'SKU-' + Date.now(),
      barcode: barcode.trim(),
      category,
      brand: brand.trim(),
      model: model.trim(),
      costPrice: numCost,
      sellingPrice: numSelling,
      resellerPrice: numReseller,
      stockQuantity: typeof stockQuantity === 'number' ? stockQuantity : parseInt(stockQuantity) || 0,
      minStockQuantity: typeof minStockQuantity === 'number' ? minStockQuantity : parseInt(minStockQuantity) || 0,
      location: location.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      isActive: true,
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
    };

    onSave(product);

    if (keepOpen && !productToEdit) {
      setName('');
      setSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
      setBarcode('');
      setBrand('');
      setModel('');
      setCostPrice(0);
      setSellingPrice(0);
      setResellerPrice(0);
      setStockQuantity(0);
      setMinStockQuantity(0);
      setLocation('');
      setPhotoUrl('');
      setError('');
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-[#060e1d] border border-blue-900/80 rounded-2xl shadow-[0_0_50px_rgba(3,105,161,0.25)] text-slate-100 flex flex-col max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER BAR */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#040a16] border-b border-blue-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0c2448] border border-cyan-500/40 rounded-xl flex items-center justify-center relative shrink-0 shadow-inner">
              <Package className="w-5 h-5 text-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#040a16] flex items-center justify-center">
                <Plus className="w-2 h-2 text-slate-950 stroke-[3]" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">
                {productToEdit ? 'Editar Produto / Peça' : 'Cadastrar Novo Produto ou Peça'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Adicione produtos ao PDV, estoque ou utilize em Ordens de Serviço.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#09182f] border border-blue-800/60 px-3 py-1 rounded-full text-xs font-bold text-slate-300 shadow-sm">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mais controle para o seu negócio</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ERROR BANNER IF ANY */}
        {error && (
          <div className="px-5 py-1.5 bg-rose-950/90 border-b border-rose-800 text-rose-300 text-xs font-bold flex items-center justify-between shrink-0">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:text-white">✕</button>
          </div>
        )}

        {/* FULL-WIDTH FORM BODY - COMPACT SINGLE VIEW NO SCROLL */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {/* SECTION 1: INFORMAÇÕES GERAIS (FULL WIDTH TOP BANNER) */}
          <div className="bg-[#081326] border border-[#132847] rounded-xl p-3.5 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0d2242] border border-cyan-500/30 rounded-lg text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Informações Gerais</h3>
                  <p className="text-[10px] text-slate-400">Informe os dados principais do produto ou peça</p>
                </div>
              </div>
              <span className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Campos obrigatórios *
              </span>
            </div>

            {/* Row 1: Nome, Categoria, Marca */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              {/* Nome */}
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nome do Produto / Peça <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Tela Frontal Display iPhone 11 Original"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-medium placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Categoria Searchable Combobox */}
              <div className="md:col-span-3" ref={categoryContainerRef}>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Categoria <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={categorySearch}
                    onFocus={() => setIsCategoryOpen(true)}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setCategory(e.target.value);
                      setIsCategoryOpen(true);
                    }}
                    placeholder="Digite para buscar categoria..."
                    className="w-full pl-8 pr-7 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#061226] border border-cyan-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1 space-y-0.5 animate-in fade-in duration-100">
                      {availableCategories
                        .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategory(c.name);
                              setCategorySearch(c.name);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                              category.toLowerCase() === c.name.toLowerCase()
                                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <span>{c.name}</span>
                            {category.toLowerCase() === c.name.toLowerCase() && (
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </button>
                        ))}

                      {/* Add new category if search term isn't an exact match */}
                      {categorySearch.trim() &&
                        !availableCategories.some(
                          (c) => c.name.toLowerCase() === categorySearch.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCatName = categorySearch.trim();
                              const updatedCats = [
                                ...availableCategories,
                                { id: 'cat-' + Date.now(), name: newCatName },
                              ];
                              StorageService.saveCustomCategories(updatedCats);
                              setAvailableCategories(updatedCats);
                              setCategory(newCatName);
                              setCategorySearch(newCatName);
                              setIsCategoryOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 flex items-center gap-1.5 mt-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar categoria "{categorySearch.trim()}"</span>
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Marca / Fabricante (Searchable Combobox) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Marca / Fabricante <span className="text-cyan-400 font-normal">(Pesquisável)</span>
                </label>
                <div ref={brandContainerRef} className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none z-10">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={brandSearch}
                    onFocus={() => setIsBrandOpen(true)}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrand(e.target.value);
                      setIsBrandOpen(true);
                    }}
                    placeholder="Digite para buscar ou criar marca..."
                    className="w-full pl-8 pr-7 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsBrandOpen(!isBrandOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBrandOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isBrandOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#061226] border border-cyan-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1 space-y-0.5 animate-in fade-in duration-100">
                      {availableBrands
                        .filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
                        .map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setBrand(b);
                              setBrandSearch(b);
                              setIsBrandOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                              brand.toLowerCase() === b.toLowerCase()
                                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <span>{b}</span>
                            {brand.toLowerCase() === b.toLowerCase() && (
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </button>
                        ))}

                      {/* Add new brand if search term isn't an exact match */}
                      {brandSearch.trim() &&
                        !availableBrands.some(
                          (b) => b.toLowerCase() === brandSearch.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newBrandName = brandSearch.trim();
                              const updatedBrands = [...availableBrands, newBrandName];
                              StorageService.saveCustomBrands(updatedBrands);
                              setAvailableBrands(updatedBrands);
                              setBrand(newBrandName);
                              setBrandSearch(newBrandName);
                              setIsBrandOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 flex items-center gap-1.5 mt-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar marca "{brandSearch.trim()}"</span>
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: SKU, Código de Barras, Modelo, Localização */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {/* SKU */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Código SKU</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Barcode className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex.: SKU-2659"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Código de Barras (EAN)</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Barcode className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex.: 7891234567890"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Modelo / Aplicação</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex.: iPhone 11, A24, Universal"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Localização no Estoque */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Localização no Estoque</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex.: Gaveta B3, Prateleira 2"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PREÇOS E LUCRATIVIDADE */}
          <div className="bg-[#081326] border border-[#132847] rounded-xl p-3.5 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Preços e Lucratividade</h3>
                  <p className="text-[10px] text-slate-400">Defina os valores de custo, venda e revenda</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculateMargin}
                className="bg-[#0d2242] hover:bg-cyan-950 text-cyan-400 border border-blue-700/60 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Calcular sugestão de margem baseada no custo"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calcular margem</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
              {/* Preço de Custo */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Preço de Custo (R$)</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-mono font-bold focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">Valor pago ao fornecedor</p>
              </div>

              {/* Preço Venda Final */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Preço Venda Final (R$) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-1.5 bg-[#030814] border border-emerald-500/50 hover:border-emerald-400 focus:border-emerald-400 rounded-lg text-xs text-emerald-300 font-mono font-bold focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">Preço para cliente balcão</p>
              </div>

              {/* Preço Revenda - Only shown if plan allows reseller features */}
              {SubscriptionService.isResellerFeatureAllowed() && (
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Preço Revenda (R$) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={SubscriptionService.isResellerFeatureAllowed()}
                      value={resellerPrice}
                      onChange={(e) => setResellerPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-2 py-1.5 bg-[#030814] border border-blue-500/50 hover:border-cyan-400 focus:border-cyan-400 rounded-lg text-xs text-cyan-300 font-mono font-bold focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Preço para revendedores/técnicos</p>
                </div>
              )}

              {/* Profit Cards Column */}
              <div className="md:col-span-3 space-y-1.5">
                <div className="bg-[#03231b]/90 border border-emerald-500/40 rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Lucro Venda:</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{formatCurrency(grossProfit)}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                    {markupPercent.toFixed(0)}%
                  </span>
                </div>

                <div className="bg-[#0a2142]/90 border border-cyan-500/40 rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Lucro Revenda:</span>
                    <span className="text-xs font-black text-cyan-400 font-mono">{formatCurrency(resellerGrossProfit)}</span>
                  </div>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                    {resellerMarkupPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ESTOQUE, LOCALIZAÇÃO & IMAGEM DO PRODUTO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Estoque e Localização (7 cols) */}
            <div className="md:col-span-7 bg-[#081326] border border-[#132847] rounded-xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 border-b border-blue-900/40 pb-2">
                <div className="p-1.5 bg-[#0d2242] border border-cyan-500/30 rounded-lg text-cyan-400">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Estoque e Quantidades</h3>
                  <p className="text-[10px] text-slate-400">Controle o nível do estoque no sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Estoque Atual (unidades)</label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                      <Box className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full pl-8 pr-2 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-mono font-bold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Estoque Mínimo (Alerta)</label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={minStockQuantity}
                      onChange={(e) => setMinStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full pl-8 pr-2 py-1.5 bg-[#030814] border border-[#1b2f4f] hover:border-cyan-500/60 focus:border-cyan-400 rounded-lg text-xs text-white font-mono font-bold focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Imagem do Produto (5 cols) */}
            <div className="md:col-span-5 bg-[#081326] border border-[#132847] rounded-xl p-3.5 space-y-2 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#0d2242] border border-cyan-500/30 rounded-lg text-cyan-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">Imagem do Produto</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[10px] font-bold text-cyan-400 hover:underline"
                >
                  {showUrlInput ? 'Upload de arquivo' : 'Usar URL do web'}
                </button>
              </div>

              {/* Dropzone Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {showUrlInput ? (
                <div className="py-1">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full px-2.5 py-1.5 bg-[#030814] border border-[#1b2f4f] focus:border-cyan-400 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              ) : photoUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-blue-800/80 bg-[#020712] h-16 flex items-center justify-center p-1">
                  <img src={photoUrl} alt="Preview" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white p-0.5 rounded text-xs font-bold shadow cursor-pointer transition-colors"
                    title="Remover Imagem"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-blue-900/80 hover:border-cyan-400/80 bg-[#030917] rounded-lg p-2.5 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <UploadCloud className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-cyan-400 group-hover:underline leading-tight">Clique para enviar imagem</p>
                    <p className="text-[9px] text-slate-400">ou selecione do computador (máx 3MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="bg-[#040a16] border-t border-blue-900/70 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Left Switch: Continuar Cadastrando */}
          <div className="flex items-center gap-2.5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            <div>
              <p className="text-xs font-bold text-slate-200 leading-tight">Continuar cadastrando</p>
              <p className="text-[10px] text-slate-400">Após salvar, manter a tela aberta</p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-transparent hover:bg-slate-800/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{productToEdit ? 'Atualizar Produto' : 'Cadastrar Produto'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
