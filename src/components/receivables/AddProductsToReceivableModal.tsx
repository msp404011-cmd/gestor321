import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Package,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AccountReceivable, Product } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/formatters';

interface AddProductsToReceivableModalProps {
  isOpen: boolean;
  receivable: AccountReceivable;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ItemToAdd {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  maxStock?: number;
}

export const AddProductsToReceivableModal: React.FC<AddProductsToReceivableModalProps> = ({
  isOpen,
  receivable,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<ItemToAdd[]>([]);

  // Manual custom item fields
  const [customName, setCustomName] = useState('');
  const [customQuantity, setCustomQuantity] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [deductStock, setDeductStock] = useState(true);
  const [additionNotes, setAdditionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProducts(StorageService.getProducts());
      setSearchTerm('');
      setSelectedItems([]);
      setCustomName('');
      setCustomQuantity('1');
      setCustomPrice('');
      setShowCustomForm(false);
      setDeductStock(true);
      setAdditionNotes('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, receivable]);

  if (!isOpen) return null;

  const currentRemainingDebt = Number(receivable.remainingAmount ?? receivable.amount) || 0;
  const currentOriginalDebt = Number(receivable.originalAmount ?? (currentRemainingDebt + (receivable.paidAmount || 0))) || currentRemainingDebt;

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 8);
    const q = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [products, searchTerm]);

  const handleAddProductFromCatalog = (product: Product) => {
    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }
      const isUnmanaged = product.manageStock === false || product.stockStatus === 'UNLIMITED';
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice || 0,
          maxStock: isUnmanaged ? undefined : product.stockQuantity,
        },
      ];
    });
  };

  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const qty = parseInt(customQuantity, 10) || 1;
    const price = parseFloat(customPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    if (!name) {
      setError('Informe o nome do item / produto avulso.');
      return;
    }
    if (price <= 0) {
      setError('Informe um valor unitário válido para o item.');
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        name,
        quantity: Math.max(1, qty),
        unitPrice: price,
      },
    ]);

    setCustomName('');
    setCustomQuantity('1');
    setCustomPrice('');
    setShowCustomForm(false);
    setError(null);
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  };

  const handleUpdatePrice = (idx: number, newPriceStr: string) => {
    const val = parseFloat(newPriceStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], unitPrice: Math.max(0, val) };
      return updated;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const newItemsTotal = selectedItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );
  const newTotalDebt = currentRemainingDebt + newItemsTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Selecione ao menos um produto ou item para adicionar ao débito.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Call StorageService to add products to the receivable
      const formattedItems = selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const additionalTotal = formattedItems.reduce((acc, it) => acc + it.total, 0);

      StorageService.addProductsToReceivable(receivable.id, formattedItems, additionalTotal);

      // Handle stock deduction if requested
      if (deductStock) {
        selectedItems.forEach((item) => {
          if (item.productId) {
            try {
              StorageService.updateProductStock(
                item.productId,
                -item.quantity,
                `Venda fiado adicionada: ${receivable.customerName} (${receivable.referenceNumber})`,
                'VENDA',
                receivable.id
              );
            } catch (stockErr) {
              console.warn('Erro ao abater estoque:', stockErr);
            }
          }
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao adicionar produtos ao fiado:', err);
      setError(err?.message || 'Erro ao adicionar produtos ao débito.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-teal-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border-b border-teal-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Adicionar Mais Produtos ao Fiado
              </h2>
              <p className="text-xs text-teal-400/90 flex items-center gap-1.5">
                <span className="font-bold text-white">{receivable.customerName}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono">{receivable.referenceNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Débito Atual Banner */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Saldo Devedor Atual
              </span>
              <span className="text-base font-black text-amber-400 font-mono">
                {formatCurrency(currentRemainingDebt)}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
                Adicionando Produtos
              </span>
              <span className="text-base font-black text-teal-300 font-mono">
                + {formatCurrency(newItemsTotal)}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                Novo Saldo Devedor
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {formatCurrency(newTotalDebt)}
              </span>
            </div>
          </div>

          {/* 1. Buscar Produtos do Estoque */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-teal-400" />
                Buscar no Estoque da Loja
              </label>
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold cursor-pointer underline flex items-center gap-1"
              >
                {showCustomForm ? 'Ocultar item avulso' : '+ Inserir item avulso'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Digitar nome do produto, código de barras ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Quick product chips / list */}
            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProductFromCatalog(prod)}
                    className="p-2 bg-slate-950/70 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate group-hover:text-teal-300">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        {prod.manageStock === false || prod.stockStatus === 'UNLIMITED' ? (
                          <span>Estoque: <strong className="text-cyan-400">Ilimitado</strong></span>
                        ) : (
                          <span>Estoque: <strong className={prod.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}>{prod.stockQuantity}</strong></span>
                        )}
                        {prod.category && <span>• {prod.category}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-teal-400 font-mono text-xs block">
                        {formatCurrency(prod.sellingPrice)}
                      </span>
                      <span className="text-[10px] font-bold text-teal-300 group-hover:bg-teal-500/20 px-1.5 py-0.5 rounded transition-colors inline-block mt-0.5">
                        + Adicionar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form de Item Avulso (opcional) */}
          {showCustomForm && (
            <div className="p-3.5 bg-slate-950 border border-teal-500/30 rounded-xl space-y-2.5 animate-in fade-in">
              <h4 className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item Personalizado / Serviço Avulso
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Nome do Item / Serviço</label>
                  <input
                    type="text"
                    placeholder="Ex: Capinha Silicone, Mão de obra..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Preço Unitário (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCustomProduct}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Incluir no Débito
              </button>
            </div>
          )}

          {/* 2. Lista de Itens a Adicionar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-teal-400" />
                Produtos Selecionados para Adicionar ({selectedItems.length})
              </label>
              <span className="text-xs font-bold text-teal-400 font-mono">
                Total Novos Itens: {formatCurrency(newItemsTotal)}
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-5 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-slate-400">
                <p>Nenhum produto selecionado ainda.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Busque acima no estoque ou clique em "Inserir item avulso".
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.quantity} un x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-white px-1 font-mono text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="w-5 h-5 flex items-center justify-center text-teal-400 hover:text-teal-300 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0 min-w-[70px]">
                      <span className="font-extrabold text-teal-300 font-mono block">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Opções adicionais: Baixa no estoque e Observações */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 cursor-pointer"
              />
              <span className="font-semibold text-xs">
                Dar baixa automática na quantidade do estoque para os produtos cadastrados
              </span>
            </label>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Motivo / Observação do Acréscimo (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Pegou capinha e película na data de hoje..."
                value={additionNotes}
                onChange={(e) => setAdditionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving || selectedItems.length === 0}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black transition-all shadow-lg shadow-teal-500/20 cursor-pointer text-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Gravando...' : `Confirmar Acréscimo (+ ${formatCurrency(newItemsTotal)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
