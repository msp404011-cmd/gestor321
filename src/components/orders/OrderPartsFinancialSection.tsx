import React from 'react';
import {
  Package,
  Plus,
  Search,
  X,
  Layers,
  Minus,
  Trash2,
  Lock,
  ChevronDown,
  Unlock,
} from 'lucide-react';
import {
  OrderPartItem,
  Product,
  OrderStatus,
  CustomPaymentMethodItem,
} from '../../types';
import { formatCurrency } from '../../services/formatters';

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
}

export const OrderPartsFinancialSection: React.FC<
  OrderPartsFinancialSectionProps
> = ({
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
  entryDate,
  setEntryDate,
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
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
      {/* 5. PEÇAS E COMPONENTES UTILIZADOS */}
      <div
        className={`p-2.5 rounded-xl border flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden ${
          isDark
            ? 'bg-[#07132c]/85 border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between shrink-0 gap-1.5">
          <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider text-slate-200">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>5. PEÇAS NA OS</span>
            <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.2 rounded-full">
              {parts.length} itens ({formatCurrency(partsTotal)})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct Cadastrar no Estoque Button */}
            <button
              type="button"
              onClick={() => onOpenNewProductModal(partSearch || manualPartName || '')}
              className="px-2 py-0.5 bg-cyan-600/25 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/50 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="Cadastrar novo produto diretamente no Estoque"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>+ Novo no Estoque</span>
            </button>

            {/* Mode Switcher */}
            <div className="inline-flex p-0.5 bg-[#050e1f] border border-slate-700/80 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setPartInputMode('ESTOQUE');
                  setShowStockCatalog(false);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  partInputMode === 'ESTOQUE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-2.5 h-2.5" />
                <span>Estoque</span>
              </button>
              <button
                type="button"
                onClick={() => setPartInputMode('AVULSO')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  partInputMode === 'AVULSO'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Avulso</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        {partInputMode === 'ESTOQUE' && (
          <div className="space-y-1 relative" ref={partSearchRef}>
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3 h-3" />
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
                  className="w-full pl-7 pr-6 py-1.5 bg-[#091632] border border-cyan-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 shadow-inner"
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
                className="px-2 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-cyan-300 hover:text-white border border-blue-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Cadastrar produto novo no Estoque"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                <span>Cadastrar Peça</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStockCatalog(!showStockCatalog)}
                className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Layers className="w-3 h-3" />
                <span>Catálogo</span>
              </button>
            </div>

            {/* Dropdown Results */}
            {isPartSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#091632] border border-cyan-500/50 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-800">
                {filteredProducts.length > 0 ? (
                  <>
                    {filteredProducts.map((p) => {
                      const price = p.sellingPrice || (p as any).price || 0;
                      const isUnmanaged = p.manageStock === false;
                      const stock =
                        p.stockQuantity !== undefined
                          ? p.stockQuantity
                          : (p as any).stock || 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductAsPart(p)}
                          className="p-2 hover:bg-cyan-950/60 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{p.name}</p>
                            <p className="text-[9px] text-slate-400">
                              {isUnmanaged ? (
                                <span className="text-cyan-400 font-bold">Sem controle (Ilimitado)</span>
                              ) : stock > 0 ? (
                                `${stock} em estoque`
                              ) : (
                                <span className="text-rose-400 font-bold">Sem estoque / 0 un</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-400 block">
                              {formatCurrency(price)}
                            </span>
                            <span className="text-[9px] text-cyan-400 font-bold flex items-center justify-end">
                              + Inserir
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-2 bg-[#061024] border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Não encontrou o que procura?</span>
                      <button
                        type="button"
                        onClick={() => onOpenNewProductModal(partSearch)}
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Cadastrar no Estoque</span>
                      </button>
                    </div>
                  </>
                ) : partSearch.trim() ? (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-xs text-slate-300 font-medium">
                      Nenhum produto encontrado com "<span className="text-cyan-300 font-bold">{partSearch}</span>"
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenNewProductModal(partSearch)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar "{partSearch}" no Estoque</span>
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Catalog Browser */}
            {showStockCatalog && (
              <div className="p-2 bg-[#061024] border border-blue-900/60 rounded-xl space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                  <span>Estoque ({products.length})</span>
                  <span className="text-slate-400">Clique para adicionar</span>
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-0.5">
                  {products.map((p) => {
                    const price = p.sellingPrice || (p as any).price || 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddProductAsPart(p)}
                        className="p-1.5 text-left bg-[#081530] hover:bg-blue-600/25 border border-slate-800 rounded-lg text-xs flex justify-between items-center cursor-pointer"
                      >
                        <span className="truncate pr-1 text-[11px] text-slate-200">
                          {p.name}
                        </span>
                        <span className="font-bold text-emerald-400 text-[10px] shrink-0">
                          {formatCurrency(price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode Avulso */}
        {partInputMode === 'AVULSO' && (
          <div className="p-2 rounded-lg bg-[#081532] border border-amber-500/40 space-y-1.5">
            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-6">
                <input
                  type="text"
                  value={manualPartName}
                  onChange={(e) => setManualPartName(e.target.value)}
                  placeholder="Nome da peça avulsa..."
                  className="w-full px-2 py-1 bg-[#050e1f] border border-slate-700 rounded text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  value={manualPartQty}
                  onChange={(e) =>
                    setManualPartQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-1 py-1 bg-[#050e1f] border border-slate-700 rounded text-xs text-white text-center font-bold focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualPartPrice || ''}
                  onChange={(e) =>
                    setManualPartPrice(parseFloat(e.target.value) || 0)
                  }
                  placeholder="R$ 0,00"
                  className="w-full px-1.5 py-1 bg-[#050e1f] border border-slate-700 rounded text-xs text-emerald-400 font-bold focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleAddManualPart}
                  disabled={!manualPartName.trim()}
                  className="w-full py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              <span className="text-slate-400">Peça avulsa não movimenta estoque.</span>
              <button
                type="button"
                onClick={() => onOpenNewProductModal(manualPartName)}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Cadastrar esta peça no Estoque</span>
              </button>
            </div>
          </div>
        )}

        {/* Added Parts Table */}
        <div className="flex-1 min-h-[60px] overflow-y-auto scrollbar-thin rounded-lg border border-slate-800 bg-[#091632]">
          {parts.length === 0 ? (
            <div className="p-3 text-center text-[10px] text-slate-400 flex items-center justify-center h-full">
              Nenhuma peça vinculada à OS. Busque no estoque ou adicione avulsa.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1b3d] text-slate-400 text-[10px] border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-2 py-1">Peça</th>
                  <th className="px-1 py-1 text-center w-16">Qtd</th>
                  <th className="px-1.5 py-1 text-right w-20">Unitário</th>
                  <th className="px-1.5 py-1 text-right w-20">Subtotal</th>
                  <th className="px-1 py-1 text-center w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parts.map((p, idx) => {
                  const sub =
                    p.totalPrice ||
                    p.total ||
                    p.quantity * p.unitPrice - (p.discount || 0);
                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-800/30">
                      <td className="px-2 py-1">
                        <span className="font-bold text-white text-[11px] truncate block max-w-[140px]">
                          {p.name || p.productName}
                        </span>
                      </td>
                      <td className="px-1 py-1 text-center">
                        <div className="inline-flex items-center gap-0.5 bg-[#07132c] border border-slate-700 rounded p-0.2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdatePartQty(idx, p.quantity - 1)
                            }
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-4 text-center font-bold text-white text-[10px]">
                            {p.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdatePartQty(idx, p.quantity + 1)
                            }
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-1.5 py-1 text-right text-[11px] text-slate-300 font-mono">
                        {isPriceUnlocked ? (
                          <input
                            type="number"
                            step="0.01"
                            value={p.unitPrice}
                            onChange={(e) =>
                              handleUpdatePartPrice(
                                idx,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1 py-0.2 bg-[#07132c] border border-amber-500/50 rounded text-right text-[10px] text-amber-300 font-bold"
                          />
                        ) : (
                          formatCurrency(p.unitPrice)
                        )}
                      </td>
                      <td className="px-1.5 py-1 text-right font-bold text-emerald-400 text-[11px] font-mono">
                        {formatCurrency(sub)}
                      </td>
                      <td className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
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

      {/* 6. VALORES, STATUS E PAGAMENTO */}
      <div
        className={`p-2.5 rounded-xl border shrink-0 space-y-2 ${
          isDark
            ? 'bg-[#07132c]/85 border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Row 1: Status Inicial, Forma de Pagamento, Previsão */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
              Status Inicial
            </label>
            <div className="relative">
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                className="w-full px-2 py-1 bg-[#091632] border border-amber-500/40 rounded-lg text-xs font-bold text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer appearance-none pr-6 shadow-xs"
              >
                {statusChoices.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-amber-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
              Forma de Pagamento
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1 bg-[#091632] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer appearance-none pr-6"
              >
                <option value="Não informado">Não informado</option>
                {customPaymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.name}>
                    {pm.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[10px] font-bold text-slate-300">
                Previsão Entrega
              </label>
              <label className="flex items-center gap-0.5 text-[9px] text-cyan-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDeliveryOptional}
                  onChange={(e) => {
                    setIsDeliveryOptional(e.target.checked);
                    if (e.target.checked) setDeliveryDate('');
                  }}
                  className="w-2.5 h-2.5 rounded bg-[#091632] border-slate-700 text-cyan-500 cursor-pointer accent-cyan-500"
                />
                <span>A combinar</span>
              </label>
            </div>
            {!isDeliveryOptional ? (
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-2 py-1 bg-[#091632] border border-cyan-500/50 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-400"
              />
            ) : (
              <div className="px-2 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] text-slate-400 italic">
                📅 Sem data definida
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Financial Cards & TOTAL */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Peças */}
          <div className="p-1.5 rounded-lg bg-[#091632] border border-slate-800">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">
              Peças
            </span>
            <span className="text-xs font-bold text-cyan-300 block mt-0.5">
              {formatCurrency(partsTotal)}
            </span>
          </div>

          {/* Mão de Obra / Serviço */}
          <div className="p-1.5 rounded-lg bg-[#091632] border border-slate-800 relative">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-400">
                Mão de Obra
              </span>
              {!isPriceUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setManagerPassError('');
                    setManagerPassInput('');
                    setShowManagerAuthModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 cursor-pointer"
                  title="Liberar edição manual"
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
                value={
                  customTotalPrice !== null ? customTotalPrice : partsTotal
                }
                onChange={(e) =>
                  setCustomTotalPrice(parseFloat(e.target.value) || 0)
                }
                className="w-full px-1 py-0.5 bg-[#07132c] border border-amber-500/50 rounded text-xs font-bold text-amber-300"
              />
            ) : (
              <span
                onClick={() => {
                  setManagerPassError('');
                  setManagerPassInput('');
                  setShowManagerAuthModal(true);
                }}
                className="text-xs font-bold text-white block mt-0.5 cursor-pointer hover:text-amber-300 transition-colors"
              >
                {formatCurrency(effectiveBasePrice)}
              </span>
            )}
          </div>

          {/* Desconto */}
          <div className="p-1.5 rounded-lg bg-[#091632] border border-slate-800">
            <span className="text-[9px] font-bold uppercase text-rose-400 block">
              Desconto
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="w-full px-1 py-0.5 bg-[#07132c] border border-slate-700 rounded text-xs font-bold text-rose-400 mt-0.5"
            />
          </div>

          {/* TOTAL DA OS */}
          <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 shadow-xs flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase text-emerald-400 block">
              TOTAL DA OS
            </span>
            <span className="text-sm font-black text-emerald-300 block leading-tight">
              {formatCurrency(finalOrderTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
