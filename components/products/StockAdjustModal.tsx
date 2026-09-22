import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  Check, 
  Info, 
  Zap, 
  FileText, 
  Tag, 
  MapPin, 
  Layers 
} from 'lucide-react';
import { Product } from '../../types';
import { StorageService } from '../../services/storage';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Reposição de Estoque');
  
  // Reset states when product or modal state changes
  useEffect(() => {
    if (isOpen) {
      setType('IN');
      setQuantity(1);
      setReason('Reposição de Estoque');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentUser = StorageService.getCurrentUser();
  const currentStock = product.stockQuantity;
  const newStock = type === 'IN' ? currentStock + quantity : Math.max(0, currentStock - quantity);

  // Fetch real stock history for this product
  const movements = StorageService.getStockMovements().filter(m => m.productId === product.id);
  
  const lastIn = movements.find(m => m.type === 'ENTRADA' || m.type === 'COMPRA' || m.quantity > 0);
  const lastOut = movements.find(m => m.type === 'SAIDA' || m.type === 'VENDA' || m.quantity < 0);

  const lastInDate = lastIn ? new Date(lastIn.date).toLocaleDateString('pt-BR') : 'Sem registro';
  const lastInQty = lastIn ? `+ ${Math.abs(lastIn.quantity)} un` : '';
  const lastOutDate = lastOut ? new Date(lastOut.date).toLocaleDateString('pt-BR') : 'Sem registro';
  const lastOutQty = lastOut ? `- ${Math.abs(lastOut.quantity)} un` : '';

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    StorageService.adjustStock(
      product.id,
      quantity,
      type,
      reason,
      currentUser.name
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/90 backdrop-blur-md transition-opacity animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl bg-[#030d1e] border-2 border-blue-900/80 rounded-3xl shadow-[0_0_50px_rgba(30,58,138,0.4)] overflow-hidden flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-950/60 bg-[#020914] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                Movimentação Rápida de Estoque
              </h2>
              <p className="text-xs text-blue-300/70 mt-0.5">
                Atualize o estoque do produto de forma rápida e segura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-blue-950/45 border border-blue-800/40 rounded-full text-[10px] font-black text-blue-300 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Operação Rápida</span>
              <span className="text-blue-400/80 font-medium">|</span>
              <span className="text-blue-400 font-bold normal-case text-[9px]">Atualiza em tempo real</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 rounded-xl transition-all cursor-pointer text-blue-400 hover:text-white"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Two columns layout) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Product profile card */}
            <div className="lg:col-span-5 space-y-4">
              {/* Profile card */}
              <div className="p-5 bg-gradient-to-b from-[#061224] to-[#040e1c] border border-blue-900/65 rounded-2xl flex gap-4 items-start relative overflow-hidden">
                <div className="w-24 h-24 rounded-2xl bg-[#020914] border-2 border-blue-500/25 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)] overflow-hidden shrink-0">
                  {product.photoUrl ? (
                    <img 
                      src={product.photoUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-blue-500/60" />
                  )}
                </div>
                
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white truncate">{product.name}</h3>
                  
                  <div className="space-y-1 text-xs text-blue-200/75 font-medium">
                    <p className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Categoria: <strong className="text-white font-bold">{product.category}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Código: <strong className="text-white font-bold">{product.barcode || product.sku || 'S/C'}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-blue-400 leading-none text-[10px] border border-blue-400/35 rounded-sm shrink-0">M</span>
                      <span>Marca: <strong className="text-white font-bold">{product.brand || 'Genérica'}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Localização: <strong className="text-white font-bold">{product.location || 'Não especificada'}</strong></span>
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Em estoque
                    </span>
                  </div>
                </div>
              </div>

              {/* Row of 3 mini metric cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* 1. Estoque Atual */}
                <div className="p-3 bg-[#061224] border-2 border-blue-500 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.3)] flex flex-col justify-between h-[105px]">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-blue-300 block leading-tight">Estoque Atual</span>
                    <span className="text-base font-black text-white leading-none mt-1 block">{currentStock} un</span>
                  </div>
                </div>

                {/* 2. Última Entrada */}
                <div className="p-3 bg-[#061224] border-2 border-emerald-500 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col justify-between h-[105px]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-300 block leading-tight">Última Entrada</span>
                    <span className="text-[10px] font-bold text-white block mt-0.5 leading-tight">{lastInDate}</span>
                    {lastInQty && <span className="text-[10px] font-extrabold text-emerald-400 leading-none mt-0.5 block">{lastInQty}</span>}
                  </div>
                </div>

                {/* 3. Última Saída */}
                <div className="p-3 bg-[#061224] border-2 border-rose-500 rounded-2xl shadow-[0_0_15px_rgba(244,63,94,0.3)] flex flex-col justify-between h-[105px]">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-rose-300 block leading-tight">Última Saída</span>
                    <span className="text-[10px] font-bold text-white block mt-0.5 leading-tight">{lastOutDate}</span>
                    {lastOutQty && <span className="text-[10px] font-extrabold text-rose-400 leading-none mt-0.5 block">{lastOutQty}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Operation controls */}
            <div className="lg:col-span-7 bg-gradient-to-b from-[#061224] to-[#040e1c] border border-blue-900/65 rounded-2xl p-5 space-y-5">
              
              {/* Section Header */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Package className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Tipo de Operação</h4>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Selecione se será uma entrada ou saída de estoque.
                  </p>
                </div>
              </div>

              {/* Operation type buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 overflow-hidden ${
                    type === 'IN'
                      ? 'bg-[#05241b]/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : 'bg-[#020914] border-blue-950/80 hover:border-blue-900/60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    type === 'IN'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-blue-950/40 border-blue-900/30 text-blue-400'
                  }`}>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white leading-snug">Entrada no Estoque (+)</h5>
                    <p className="text-[10px] text-blue-300/60 mt-0.5 leading-tight">Adicionar itens ao estoque</p>
                  </div>
                  {type === 'IN' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[4px]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 overflow-hidden ${
                    type === 'OUT'
                      ? 'bg-[#290a12]/60 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                      : 'bg-[#020914] border-blue-950/80 hover:border-blue-900/60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    type === 'OUT'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-blue-950/40 border-blue-900/30 text-blue-400'
                  }`}>
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white leading-snug">Saída do Estoque (-)</h5>
                    <p className="text-[10px] text-blue-300/60 mt-0.5 leading-tight">Retirar itens do estoque</p>
                  </div>
                  {type === 'OUT' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[4px]" />
                    </div>
                  )}
                </button>
              </div>

              {/* Quantity input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-blue-200/90 tracking-wide">
                  Quantidade a {type === 'IN' ? 'adicionar' : 'remover'} <span className="text-rose-500 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-[#020914] border border-blue-900/70 rounded-xl text-sm font-black text-white placeholder-blue-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col text-blue-400 gap-0.5 text-xs select-none">
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="hover:text-white leading-none cursor-pointer p-0.5"
                    >
                      ▲
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="hover:text-white leading-none cursor-pointer p-0.5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-blue-200/90 tracking-wide">
                  Motivo / Justificativa <span className="text-rose-500 font-black">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <textarea
                    required
                    rows={3}
                    maxLength={200}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Reposição de estoque, compra, ajuste, etc."
                    className="w-full pl-10 pr-14 py-2.5 bg-[#020914] border border-blue-900/70 rounded-xl text-xs font-bold text-white placeholder-blue-600/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none"
                  />
                  <span className="absolute right-3.5 bottom-3 text-[10px] text-blue-500 font-bold">
                    {reason.length}/200
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* STOCK TRANSITION BAR (Below) */}
          <div className="p-4 bg-[#020914]/60 border border-blue-950 rounded-2xl flex items-center justify-center gap-6 sm:gap-12 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-400/70 block leading-tight">Estoque Atual</span>
                <span className="text-base font-black text-white leading-none mt-0.5 block">{currentStock} un</span>
              </div>
            </div>

            <span className="text-blue-500 text-xl font-black select-none">→</span>

            <div className="flex items-center gap-3 p-1 px-4 py-2 rounded-xl border border-emerald-500/40 bg-[#05241b]/45 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-300 block leading-tight">Estoque Resultante</span>
                <span className="text-base font-black text-emerald-400 leading-none mt-0.5 block whitespace-nowrap">{newStock.toLocaleString('pt-BR')} un</span>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-blue-950/60 bg-[#020914] shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-blue-300/60 font-semibold leading-tight max-w-md self-start sm:self-auto">
            <Info className="w-4.5 h-4.5 text-blue-400 shrink-0" />
            <span>
              Esta movimentação será registrada no histórico de estoque. Mantenha as informações corretas para um melhor controle.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/40 rounded-xl text-xs font-black text-blue-200 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-black rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Check className="w-4 h-4 stroke-[3px]" />
              <span>Confirmar {type === 'IN' ? 'Entrada' : 'Saída'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
