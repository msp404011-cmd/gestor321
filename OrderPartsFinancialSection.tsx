import React from 'react';
import {
  Plus,
  Search,
  X,
  Layers,
  Minus,
  Trash2,
  Lock,
  ChevronDown,
  DollarSign,
  Tag,
  Box,
} from 'lucide-react';
import {
  OrderPartItem,
  Product,
  OrderStatus,
  CustomPaymentMethodItem,
} from '../../types';
import { formatCurrency, getCanonicalStatus } from '../../services/formatters';

interface OrderPartsFinancialSectionProps {
  isDark: boolean;
  parts: OrderPartItem[];
  partInputMode: 'ESTOQUE' | 'AVULSO';
  setPartInputMode: (mode: 'ESTOQUE' | 'AVULSO') => void;
  partSearch: string;
  setPartSearch: (val: string) => void;
  isPartSearchOpen: boolean;
  setIsPartSearchOpen: (val: boolean) => void;
  partSearchRef: React.RefObject<HTMLDivElement | null>;
  showStockCatalog: boolean;
  setShowStockCatalog: (val: boolean) => void;
  products: Product[];
  filteredProducts: Product[];
  handleAddProductAsPart: (product: Product) => void;
  onOpenNewProductModal: (prefillName?: string) => void;
  manualPartName: string;
  setManualPartName: (val: string) => void;
  manualPartQty: number;
  setManualPartQty: (val: number) => void;
  manualPartPrice: number;
  setManualPartPrice: (val: number) => void;
  handleAddManualPart: () => void;
  handleUpdatePartQty: (idx: number, qty: number) => void;
  handleUpdatePartPrice: (idx: number, price: number) => void;
  handleRemovePart: (idx: number) => void;
  partsTotal: number;
  effectiveBasePrice: number;
  isPriceUnlocked: boolean;
  customTotalPrice: number | null;
  setCustomTotalPrice: (val: number | null) => void;
  setShowManagerAuthModal: (val: boolean) => void;
  setManagerPassError: (val: string) => void;
  setManagerPassInput: (val: string) => void;
  discount: number;
  setDiscount: (val: number) => void;
  finalOrderTotal: number;
  entryDate: string;
  setEntryDate: (val: string) => void;
  deliveryDate: string;
  setDeliveryDate: (val: string) => void;
  isDeliveryOptional: boolean;
  setIsDeliveryOptional: (val: boolean) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  customPaymentMethods: CustomPaymentMethodItem[];
  initialStatus: OrderStatus;
  setInitialStatus: (val: OrderStatus) => void;
  statusChoices: { status: OrderStatus; label: string; icon: string }[];
  archivedLocation?: string;
  setArchivedLocation?: (val: string) => void;
}

export const OrderPartsFinancialSection: React.FC<OrderPartsFinancialSectionProps> = ({
  isDark,
  parts,
  partInputMode,
  setPartInputMode,
  partSearch,
  setPartSearch,
  isPartSearchOpen,
  setIsPartSearchOpen,
  partSearchRef,
  showStockCatalog,
  setShowStockCatalog,
  products,
  filteredProducts,
  handleAddProductAsPart,
  onOpenNewProductModal,
  manualPartName,
  setManualPartName,
  manualPartQty,
  setManualPartQty,
  manualPartPrice,
  setManualPartPrice,
  handleAddManualPart,
  handleUpdatePartQty,
  handleUpdatePartPrice,
  handleRemovePart,
  partsTotal,
  effectiveBasePrice,
  isPriceUnlocked,
  customTotalPrice,
  setCustomTotalPrice,
  setShowManagerAuthModal,
  setManagerPassError,
  setManagerPassInput,
  discount,
  setDiscount,
  finalOrderTotal,
  deliveryDate,
  setDeliveryDate,
  isDeliveryOptional,
  setIsDeliveryOptional,
  paymentMethod,
  setPaymentMethod,
  customPaymentMethods,
  initialStatus,
  setInitialStatus,
  statusChoices,
  archivedLocation = '',
  setArchivedLocation,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
      {/* 5. PEÇAS - AURORA EMERALD GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#051814]/95 via-[#030e0c]/90 to-[#020705]/95 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35),0_0_50px_rgba(16,185,129,0.15)] text-white'
            : 'bg-white border-emerald-400 shadow-lg text-slate-900'
        }`}
      >
        {/* Header 5. PEÇAS */}
        <div className="flex items-center justify-between shrink-0 gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-md bg-emerald-600/30 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0">
              <Box className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-black tracking-wide leading-none text-white truncate">
              5. PEÇAS <span className="text-emerald-400">({formatCurrency(partsTotal)})</span>
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onOpenNewProductModal(partSearch || manualPartName || '')}
              className="px-2 py-0.5 bg-[#062c33] hover:bg-[#083e48] text-cyan-300 border border-cyan-500/50 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Novo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPartInputMode('ESTOQUE');
                setShowStockCatalog(false);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-0.5 ${
                partInputMode === 'ESTOQUE'
                  ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                  : 'bg-[#081730] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Peça</span>
            </button>

            <button
              type="button"
              onClick={() => setPartInputMode('AVULSO')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                partInputMode === 'AVULSO'
                  ? 'bg-amber-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-[#081730] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Avulso</span>
            </button>
          </div>
        </div>

        {/* Search / Add Bar */}
        {partInputMode === 'ESTOQUE' ? (
          <div className="space-y-1 relative shrink-0" ref={partSearchRef}>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => {
                    setPartSearch(e.target.value);
                    setIsPartSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (partSearch.trim()) setIsPartSearchOpen(true);
                  }}
                  placeholder="Buscar peça no estoque..."
                  className="w-full pl-8 pr-7 py-1 bg-[#030d0b] border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 shadow-inner"
                />
                {partSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPartSearch('');
                      setIsPartSearchOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenNewProductModal(partSearch || '')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-0.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.4)] shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Peça</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStockCatalog(!showStockCatalog)}
                className={`px-2 py-1 border rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  showStockCatalog
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                    : 'bg-[#062c33] text-cyan-300 border-cyan-500/50 hover:bg-[#083e48]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Catálogo</span>
              </button>
            </div>

            {/* Dropdown Results */}
            {isPartSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#041210] border border-cyan-500/60 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-800">
                {filteredProducts.length > 0 ? (
                  <>
                    {filteredProducts.map((p) => {
                      const price = p.sellingPrice || (p as any).price || 0;
                      const stock = p.stockQuantity !== undefined ? p.stockQuantity : (p as any).stock || 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductAsPart(p)}
                          className="p-2 hover:bg-cyan-950/80 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{stock > 0 ? `${stock} em estoque` : '0 em estoque'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-400 font-mono">
                              {formatCurrency(price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : partSearch.trim() ? (
                  <div className="p-2.5 text-center space-y-1">
                    <p className="text-xs text-slate-300">
                      Não encontrado: "<span className="text-cyan-300 font-bold">{partSearch}</span>"
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenNewProductModal(partSearch)}
                      className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Cadastrar no Estoque
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Catalog Browser */}
            {showStockCatalog && (
              <div className="p-1.5 bg-[#030d0b] border border-cyan-500/50 rounded-xl space-y-1 animate-in fade-in">
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-0.5">
                  {products.map((p) => {
                    const price = p.sellingPrice || (p as any).price || 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddProductAsPart(p)}
                        className="p-1 text-left bg-[#051614] hover:bg-cyan-950/80 border border-slate-800 rounded-lg text-xs flex justify-between items-center cursor-pointer"
                      >
                        <span className="truncate pr-1 text-[11px] text-slate-200">
                          {p.name}
                        </span>
                        <span className="font-bold text-emerald-400 text-[10px] shrink-0 font-mono">
                          {formatCurrency(price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-1.5 rounded-xl bg-[#030d0b] border border-amber-500/40 space-y-1 shrink-0">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={manualPartName}
                onChange={(e) => setManualPartName(e.target.value)}
                placeholder="Nome da peça avulsa..."
                className="flex-1 px-2 py-1 bg-[#020807] border border-slate-700 rounded-lg text-xs text-white focus:border-amber-400 focus:outline-hidden"
              />
              <input
                type="number"
                min="1"
                value={manualPartQty}
                onChange={(e) => setManualPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Qtd"
                className="w-12 px-1 py-1 bg-[#020807] border border-slate-700 rounded-lg text-xs text-white text-center font-bold"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={manualPartPrice || ''}
                onChange={(e) => setManualPartPrice(parseFloat(e.target.value) || 0)}
                placeholder="R$ Unit"
                className="w-20 px-1 py-1 bg-[#020807] border border-slate-700 rounded-lg text-xs text-emerald-400 font-bold font-mono"
              />
              <button
                type="button"
                onClick={handleAddManualPart}
                disabled={!manualPartName.trim()}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white text-xs font-black rounded-lg cursor-pointer transition-colors shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Parts Table / Empty State */}
        <div className="flex-1 min-h-[50px] overflow-y-auto scrollbar-thin rounded-xl border border-slate-800/80 bg-[#030d0b]">
          {parts.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-full gap-1">
              <Box className="w-6 h-6 text-cyan-400/50" />
              <span className="text-slate-400 text-[10px]">
                Nenhuma peça vinculada. Busque no estoque ou adicione avulsa acima.
              </span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#051614] text-slate-400 text-[9px] border-b border-slate-800 sticky top-0 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-1">Peça</th>
                  <th className="px-1 py-1 text-center w-16">Qtd</th>
                  <th className="px-1 py-1 text-right w-16">Unit.</th>
                  <th className="px-1 py-1 text-right w-16">Subtotal</th>
                  <th className="px-1 py-1 text-center w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {parts.map((p, idx) => {
                  const sub =
                    p.totalPrice ||
                    p.total ||
                    p.quantity * p.unitPrice - (p.discount || 0);
                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-2 py-1">
                        <span className="font-bold text-white text-[11px] truncate block max-w-[140px]">
                          {p.name || p.productName}
                        </span>
                      </td>
                      <td className="px-1 py-1 text-center">
                        <div className="inline-flex items-center gap-0.5 bg-[#020807] border border-slate-700 rounded-md p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdatePartQty(idx, p.quantity - 1)}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="w-4 text-center font-black text-white text-[10px] font-mono">
                            {p.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePartQty(idx, p.quantity + 1)}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      </td>
                      <td className="px-1 py-1 text-right text-[10px] text-slate-300 font-mono">
                        {isPriceUnlocked ? (
                          <input
                            type="number"
                            step="0.01"
                            value={p.unitPrice}
                            onChange={(e) =>
                              handleUpdatePartPrice(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-14 px-1 py-0.2 bg-[#020807] border border-amber-500/50 rounded text-right text-[9px] text-amber-300 font-bold font-mono"
                          />
                        ) : (
                          formatCurrency(p.unitPrice)
                        )}
                      </td>
                      <td className="px-1 py-1 text-right font-black text-emerald-400 text-[10px] font-mono">
                        {formatCurrency(sub)}
                      </td>
                      <td className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="p-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. STATUS, PAGAMENTO & VALORES - AURORA BLUE GLOW */}
      <div
        className={`p-2.5 rounded-2xl border-2 shrink-0 space-y-2 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] text-white'
            : 'bg-white border-blue-400 shadow-lg text-slate-900'
        }`}
      >
        {/* Row 1: STATUS INICIAL, FORMA DE PAGAMENTO, PREVISÃO ENTREGA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {/* Status Inicial */}
          <div className="space-y-0.5">
            <label className="block text-[9px] font-black text-amber-400 uppercase tracking-wider">
              STATUS INICIAL
            </label>
            <div className="relative">
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                className="w-full h-7.5 px-2 bg-[#040c1e] border border-amber-500/50 rounded-xl text-xs font-black text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer appearance-none pr-7 shadow-inner truncate"
              >
                {statusChoices.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-0.5">
            <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider">
              FORMA DE PAGAMENTO
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-7.5 px-2 bg-[#040c1e] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-7 shadow-inner truncate"
              >
                <option value="Não informado">Não informado</option>
                <option value="A_PRAZO">⏳ A Prazo / Fiado</option>
                <option value="DINHEIRO">💵 Dinheiro</option>
                <option value="PIX">⚡ PIX</option>
                <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                {customPaymentMethods
                  .filter(
                    (pm) =>
                      !['Não informado', 'A_PRAZO', 'DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(
                        pm.name
                      )
                  )
                  .map((pm) => (
                    <option key={pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Previsão de Entrega */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider">
                PREVISÃO ENTREGA
              </label>
              <label className="flex items-center gap-1 text-[9px] text-cyan-300 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDeliveryOptional}
                  onChange={(e) => {
                    setIsDeliveryOptional(e.target.checked);
                    if (e.target.checked) setDeliveryDate('');
                  }}
                  className="w-3 h-3 rounded bg-[#040c1e] border-slate-700 text-blue-500 cursor-pointer accent-blue-500"
                />
              </label>
            </div>
            {!isDeliveryOptional ? (
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full h-7.5 px-2 bg-[#040c1e] border border-cyan-500/50 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 font-mono shadow-inner"
              />
            ) : (
              <div className="h-7.5 px-2 bg-[#040c1e] border border-slate-800 rounded-xl text-xs text-cyan-300 font-bold flex items-center justify-center shadow-inner">
                📅 A combinar com o cliente
              </div>
            )}
          </div>
        </div>

        {/* Campo em Alto Destaque de Localização Física do Aparelho Arquivado */}
        {(initialStatus === 'ARQUIVADO' || (initialStatus as string)?.toUpperCase()?.includes('ARQUIV') || getCanonicalStatus(initialStatus as string) === 'ARQUIVADO' || !!archivedLocation) && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-[#040c1e] border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400 shrink-0" />
                <span>📍 ONDE O DISPOSITIVO ESTÁ GUARDADO? (LOCAL NO ARQUIVO)</span>
              </label>
              <span className="text-[9.5px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">
                Destaque na Busca
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                autoFocus={initialStatus === 'ARQUIVADO' || (initialStatus as string)?.toUpperCase()?.includes('ARQUIV')}
                value={archivedLocation}
                onChange={(e) => setArchivedLocation?.(e.target.value)}
                placeholder="Ex: Gaveta 1, Prateleira B, Armário 2, Caixa 5..."
                className="flex-1 h-9 px-3 bg-[#080f1e] border-2 border-amber-400/80 rounded-xl text-xs font-black text-amber-300 placeholder-zinc-500 focus:outline-hidden focus:border-amber-300 shadow-inner"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {['Gaveta 1', 'Gaveta 2', 'Gaveta 3', 'Prateleira A', 'Prateleira B', 'Armário 1', 'Caixa 1'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setArchivedLocation?.(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      archivedLocation === tag
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm scale-105'
                        : 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Row 2: 4 Summary Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {/* 1. PEÇAS */}
          <div className="p-2 rounded-xl bg-[#040c1e] border border-blue-900/80 flex flex-col justify-between h-[58px]">
            <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Box className="w-3 h-3 text-cyan-400" />
              PEÇAS
            </span>
            <span className="text-sm font-black text-cyan-400 font-mono">
              {formatCurrency(partsTotal)}
            </span>
          </div>

          {/* 2. MÃO DE OBRA */}
          <div className="p-2 rounded-xl bg-[#040c1e] border border-slate-800 relative flex flex-col justify-between h-[58px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                MÃO DE OBRA
              </span>
              {!isPriceUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setManagerPassError('');
                    setManagerPassInput('');
                    setShowManagerAuthModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 cursor-pointer p-0.5 rounded hover:bg-amber-950/40"
                  title="Liberar edição"
                >
                  <Lock className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {isPriceUnlocked ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={customTotalPrice !== null ? customTotalPrice : effectiveBasePrice}
                onChange={(e) => setCustomTotalPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-1 py-0.2 bg-[#07132c] border border-amber-500/50 rounded-lg text-xs font-black text-amber-300 font-mono"
              />
            ) : (
              <span
                onClick={() => {
                  setManagerPassError('');
                  setManagerPassInput('');
                  setShowManagerAuthModal(true);
                }}
                className="text-sm font-black text-white block cursor-pointer hover:text-amber-300 transition-colors font-mono"
                title="Clique para editar"
              >
                {formatCurrency(effectiveBasePrice)}
              </span>
            )}
          </div>

          {/* 3. DESCONTO */}
          <div className="p-2 rounded-xl bg-[#040c1e] border border-rose-950/80 flex flex-col justify-between h-[58px]">
            <span className="text-[9px] font-black uppercase text-rose-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-rose-400" />
              DESCONTO
            </span>
            <div className="relative">
              <span className="absolute left-1 top-0 text-[10px] text-rose-400 font-black font-mono">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full pl-6 pr-1 py-0 bg-transparent border-b border-rose-500/40 text-xs font-black text-rose-400 font-mono focus:border-rose-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 4. TOTAL DA OS */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-950/90 to-emerald-900/60 border border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col justify-between h-[58px]">
            <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              TOTAL DA OS
            </span>
            <span className="text-base font-black text-emerald-300 leading-none font-mono">
              {formatCurrency(finalOrderTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
