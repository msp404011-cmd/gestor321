import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Package,
  Plus,
  Trash2,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { Reseller, Product } from '../../types';
import { StorageService } from '../../services/storage';

interface ResellerSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: Reseller | null;
  onSaleCompleted?: (transactionId: string) => void;
}

interface SaleItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  availableStock: number;
  total: number;
}

export const ResellerSaleModal: React.FC<ResellerSaleModalProps> = ({
  isOpen,
  onClose,
  reseller,
  onSaleCompleted,
}) => {
  const [products] = useState<Product[]>(() => StorageService.getProducts());
  const [productSearch, setProductSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItemRow[]>([]);
  const [paymentCondition, setPaymentCondition] = useState<'A_PRAZO' | 'A_VISTA' | 'PARCIAL'>('A_PRAZO');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !reseller) return null;

  // Filter products for quick search
  const availableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [products, productSearch]);

  const handleAddProduct = (prod: Product) => {
    setErrorMsg('');
    const existingIndex = selectedItems.findIndex((i) => i.productId === prod.id);
    const resellerPrice = Number(prod.resellerPrice) > 0 ? Number(prod.resellerPrice) : Number(prod.sellingPrice) || 0;

    // Apply reseller discount percentage if any
    const discountFactor = reseller.discountPercent ? 1 - (reseller.discountPercent / 100) : 1;
    const finalUnitPrice = Number((resellerPrice * discountFactor).toFixed(2));

    const stock = prod.stockQuantity ?? prod.stock ?? 0;
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      const item = updated[existingIndex];
      const nextQty = item.quantity + 1;
      if (stock > 0 && nextQty > stock) {
        setErrorMsg(`Estoque insuficiente de ${prod.name}. Disponível: ${stock}`);
        return;
      }
      item.quantity = nextQty;
      item.total = Number((item.quantity * item.unitPrice).toFixed(2));
      setSelectedItems(updated);
    } else {
      if (stock <= 0) {
        setErrorMsg(`Atenção: Produto ${prod.name} com estoque zerado.`);
      }
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice: finalUnitPrice,
          costPrice: Number(prod.costPrice) || 0,
          availableStock: stock,
          total: finalUnitPrice,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...selectedItems];
    const item = updated[index];
    item.quantity = quantity;
    item.total = Number((item.quantity * item.unitPrice).toFixed(2));
    setSelectedItems(updated);
  };

  const handleUpdateUnitPrice = (index: number, price: number) => {
    const updated = [...selectedItems];
    const item = updated[index];
    item.unitPrice = Math.max(0, price);
    item.total = Number((item.quantity * item.unitPrice).toFixed(2));
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Subtotals and totals
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.total, 0);
  }, [selectedItems]);

  const finalTotal = Math.max(0, subtotal - Number(discountAmount || 0));

  const effectivePaidAmount = useMemo(() => {
    if (paymentCondition === 'A_VISTA') return finalTotal;
    if (paymentCondition === 'A_PRAZO') return 0;
    return Math.min(finalTotal, Number(paidAmountInput) || 0);
  }, [paymentCondition, finalTotal, paidAmountInput]);

  const balanceAddition = Math.max(0, finalTotal - effectivePaidAmount);
  const newProjectedBalance = Number(reseller.balance || 0) + balanceAddition;
  const isOverCreditLimit = reseller.creditLimit > 0 && newProjectedBalance > reseller.creditLimit;

  const handleCompleteSale = () => {
    if (selectedItems.length === 0) {
      setErrorMsg('Adicione ao menos um produto para continuar.');
      return;
    }

    try {
      const currentUser = StorageService.getCurrentUser();
      const result = StorageService.createResellerSale({
        resellerId: reseller.id,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        totalAmount: finalTotal,
        paidAmount: effectivePaidAmount,
        paymentMethod: paymentCondition === 'A_PRAZO' ? 'A_PRAZO' : paymentMethod,
        discount: Number(discountAmount) || 0,
        notes: notes.trim() || undefined,
        userName: currentUser?.name || 'Operador',
      });

      if (onSaleCompleted) {
        onSaleCompleted(result.transaction.id);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar venda para revenda.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1328] border border-blue-500/40 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081023]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Nova Venda de Revenda / Atacado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Tabela Especial Revenda
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Revendedor: <span className="text-white font-bold">{reseller.name}</span>
                {reseller.tradeName && ` (${reseller.tradeName})`} • Saldo Atual:{' '}
                <span className={reseller.balance > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  R$ {reseller.balance.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Product Search & Selected Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar produto por nome, código de barras ou categoria..."
                className="w-full pl-9 pr-4 py-2 bg-[#070e20] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Quick Product Pick Grid */}
            <div className="bg-[#070e20] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Produtos Disponíveis no Estoque (Preço de Revenda)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {availableProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 col-span-2 py-4 text-center">
                    Nenhum produto encontrado.
                  </p>
                ) : (
                  availableProducts.map((prod) => {
                    const rPrice = Number(prod.resellerPrice) > 0 ? Number(prod.resellerPrice) : Number(prod.sellingPrice);
                    const prodStock = prod.stockQuantity ?? prod.stock ?? 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddProduct(prod)}
                        className="text-left p-2 rounded-lg bg-[#0b1328] hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-blue-300 truncate">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            <span className="text-slate-400">Estoque: <b className={prodStock <= 2 ? 'text-rose-400' : 'text-slate-200'}>{prodStock}</b></span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">Varejo: R$ {prod.sellingPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-blue-400 block">
                            R$ {rPrice.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center justify-end gap-0.5">
                            <Plus className="w-2.5 h-2.5" /> Adicionar
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-400" />
                  Itens do Pedido ({selectedItems.length})
                </span>
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Limpar todos
                  </button>
                )}
              </div>

              <div className="bg-[#070e20] border border-slate-800 rounded-xl overflow-hidden">
                {selectedItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-1">
                    <Package className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="text-xs font-medium">Nenhum produto adicionado à venda.</p>
                    <p className="text-[11px] text-slate-500">
                      Clique nos produtos acima para adicionar itens ao atacado.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#0a1530] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span>Disp: {item.availableStock}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span>Unit (R$):</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateUnitPrice(idx, Number(e.target.value))}
                                className="w-16 px-1 py-0.5 bg-[#040814] border border-slate-700 rounded text-[10px] text-white font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-12 py-0.5 text-center bg-[#040814] border border-slate-700 rounded text-xs font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Total & Remove */}
                        <div className="text-right shrink-0 min-w-[70px]">
                          <span className="text-xs font-black text-white block">
                            R$ {item.total.toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout & Payment Settlement (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#070e20] border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Condição de Pagamento
              </h3>

              {/* Condition Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0b1328] rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentCondition('A_PRAZO')}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                    paymentCondition === 'A_PRAZO'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A Prazo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCondition('A_VISTA')}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                    paymentCondition === 'A_VISTA'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  À Vista
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCondition('PARCIAL')}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                    paymentCondition === 'PARCIAL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Misto / Entrada
                </button>
              </div>

              {/* Payment Details if Vista or Parcial */}
              {paymentCondition !== 'A_PRAZO' && (
                <div className="space-y-3 p-3 rounded-lg bg-[#0b1328] border border-slate-800 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Forma do Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#070e20] border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro à Vista</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="TRANSFERENCIA">Transferência / TED</option>
                      <option value="BOLETO">Boleto Bancário</option>
                    </select>
                  </div>

                  {paymentCondition === 'PARCIAL' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Valor da Entrada / Pago Agora (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={finalTotal}
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#070e20] border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Desconto */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Desconto no Pedido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 bg-[#0b1328] border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Observações / Detalhes da Entrega
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Retirada no balcão / Remessa via transportadora..."
                  className="w-full px-2.5 py-1.5 bg-[#0b1328] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Itens:</span>
                  <span className="font-bold text-white">R$ {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto aplicado:</span>
                    <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800/80">
                  <span>Total da Venda:</span>
                  <span className="text-blue-400">R$ {finalTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-400 pt-1">
                  <span>Pago no Ato:</span>
                  <span className="font-bold">R$ {effectivePaidAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-rose-400">
                  <span>A Faturar / Saldo Devedor:</span>
                  <span className="font-bold">+ R$ {balanceAddition.toFixed(2)}</span>
                </div>

                {/* Credit Limit Alert */}
                {isOverCreditLimit && (
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-300 flex items-start gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Limite de crédito excedido!</p>
                      <p>
                        Novo saldo: R$ {newProjectedBalance.toFixed(2)} (Limite: R${' '}
                        {reseller.creditLimit.toFixed(2)})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#081023] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Itens selecionados: <b className="text-white">{selectedItems.length}</b> • Total:{' '}
            <b className="text-blue-400 text-sm">R$ {finalTotal.toFixed(2)}</b>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleCompleteSale}
              className={`px-5 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedItems.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Venda de Revenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
