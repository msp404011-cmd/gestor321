import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShoppingCart,
  Receipt,
  Calendar,
  CreditCard,
  MessageCircle,
  FileText,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Clock,
  Printer,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Reseller, ResellerTransaction } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone, cleanPhoneForWhatsApp } from '../../services/formatters';

interface ResellerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: Reseller | null;
  onEdit: (reseller: Reseller) => void;
  onOpenSale: (reseller: Reseller) => void;
  onOpenPayment: (reseller: Reseller) => void;
}

export const ResellerDetailModal: React.FC<ResellerDetailModalProps> = ({
  isOpen,
  onClose,
  reseller,
  onEdit,
  onOpenSale,
  onOpenPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'INFO'>('TRANSACTIONS');
  const [transactions, setTransactions] = useState<ResellerTransaction[]>([]);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<ResellerTransaction | null>(null);

  useEffect(() => {
    if (reseller) {
      setTransactions(StorageService.getResellerTransactions(reseller.id));
    }
  }, [reseller, isOpen]);

  if (!isOpen || !reseller) return null;

  const currentBalance = Number(reseller.balance) || 0;
  const creditLimit = Number(reseller.creditLimit) || 0;
  const creditUsagePercent = creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0;
  const availableCredit = Math.max(0, creditLimit - currentBalance);

  // WhatsApp link
  const rawWhatsapp = cleanPhoneForWhatsApp(reseller.whatsapp || reseller.phone);
  const whatsappUrl = rawWhatsapp
    ? `https://wa.me/55${rawWhatsapp}?text=${encodeURIComponent(
        `Olá ${reseller.name}, tudo bem? Entramos em contato da assistência técnica sobre sua conta de revendedor.`
      )}`
    : '';

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1328] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081023]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{reseller.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    reseller.status === 'Ativo'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : reseller.status === 'Bloqueado'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {reseller.status || 'Ativo'}
                </span>
                {reseller.personType && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    {reseller.personType}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {reseller.tradeName && <span className="text-slate-300 font-semibold mr-2">{reseller.tradeName}</span>}
                Doc: <span className="text-slate-300">{reseller.document || 'Não informado'}</span>
                {reseller.city && ` • ${reseller.city}/${reseller.state || 'SP'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(reseller)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              title="Editar dados cadastrais"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Highlights Bar */}
        <div className="p-4 bg-[#070e20] border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Saldo Devedor */}
          <div className="p-3 rounded-xl bg-[#0b1328] border border-slate-800/80">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Saldo Devedor em Aberto
            </span>
            <span
              className={`text-base sm:text-lg font-black block mt-0.5 ${
                currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              R$ {currentBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">
              {currentBalance > 0 ? 'Aguardando quitação' : 'Conta em dia'}
            </span>
          </div>

          {/* Limite de Crédito */}
          <div className="p-3 rounded-xl bg-[#0b1328] border border-slate-800/80">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Limite de Crédito
            </span>
            <span className="text-base sm:text-lg font-black text-purple-400 block mt-0.5">
              R$ {creditLimit.toFixed(2)}
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  creditUsagePercent > 90 ? 'bg-rose-500' : creditUsagePercent > 60 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${creditUsagePercent}%` }}
              />
            </div>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block">
              Disp: R$ {availableCredit.toFixed(2)} ({creditUsagePercent}% usado)
            </span>
          </div>

          {/* Total Comprado */}
          <div className="p-3 rounded-xl bg-[#0b1328] border border-slate-800/80">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Comprado (Histórico)
            </span>
            <span className="text-base sm:text-lg font-black text-blue-400 block mt-0.5">
              R$ {(reseller.totalPurchased || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">Volume total de pedidos</span>
          </div>

          {/* Total Pago */}
          <div className="p-3 rounded-xl bg-[#0b1328] border border-slate-800/80">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pago (Histórico)
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 block mt-0.5">
              R$ {(reseller.totalPaid || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">Total liquidado</span>
          </div>
        </div>

        {/* Navigation Tabs & Quick Action Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-[#081023] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Histórico de Vendas & Pagamentos ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'INFO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Ficha Cadastral & Dados
            </button>
          </div>

          {/* Fast actions */}
          <div className="flex items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => onOpenPayment(reseller)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Lançar Pagamento
            </button>
            <button
              type="button"
              onClick={() => onOpenSale(reseller)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Venda Atacado
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'TRANSACTIONS' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                  <p className="text-sm font-bold text-slate-300">Nenhuma transação registrada ainda</p>
                  <p className="text-xs text-slate-500">
                    Realize uma venda de revenda ou registre um pagamento para iniciar o histórico deste parceiro.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isSale = tx.type === 'SALE';
                    const txDate = new Date(tx.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={tx.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSale
                            ? 'bg-[#070e20] border-slate-800 hover:border-blue-500/40'
                            : 'bg-[#061519] border-emerald-900/40 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                isSale
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isSale ? <ShoppingCart className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">
                                  {isSale ? 'Venda de Revenda / Atacado' : 'Acerto / Pagamento Recebido'}
                                </span>
                                {tx.invoiceNumber && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                    {tx.invoiceNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {txDate} • Por: {tx.userName || 'Sistema'}
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span
                              className={`text-sm font-black ${
                                isSale ? 'text-blue-400' : 'text-emerald-400'
                              }`}
                            >
                              {isSale ? '' : '- '}R$ {tx.totalAmount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Forma: {tx.paymentMethod || 'A Prazo'}
                            </span>
                          </div>
                        </div>

                        {/* Items Breakdown if Sale */}
                        {isSale && tx.items && tx.items.length > 0 && (
                          <div className="mt-2.5 pt-1 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Itens Faturados:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {tx.items.map((item, i) => (
                                <div
                                  key={i}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0b1328] border border-slate-800/80 flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-slate-300 truncate max-w-[200px]">
                                    <b className="text-white">{item.quantity}x</b> {item.productName}
                                  </span>
                                  <span className="text-slate-400 font-mono font-bold">
                                    R$ {item.total.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tx.notes && (
                          <p className="mt-2 text-[11px] text-slate-400 bg-[#040814]/50 p-2 rounded-lg border border-slate-800/50">
                            <b>Obs:</b> {tx.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'INFO' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cadastrais */}
                <div className="p-4 rounded-xl bg-[#070e20] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    Dados Cadastrais
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Razão Social / Nome:</span>
                      <span className="text-white font-bold">{reseller.name}</span>
                    </div>
                    {reseller.tradeName && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nome Fantasia:</span>
                        <span className="text-white font-medium">{reseller.tradeName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {reseller.personType === 'PJ' ? 'CNPJ' : 'CPF'}:
                      </span>
                      <span className="text-white font-mono">{reseller.document || 'Não cadastrado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cadastrado em:</span>
                      <span className="text-white">
                        {new Date(reseller.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contato & Localização */}
                <div className="p-4 rounded-xl bg-[#070e20] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    Contato & Endereço
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                      <span className="text-white font-medium">{reseller.whatsapp || reseller.phone || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">E-mail:</span>
                      <span className="text-white font-medium">{reseller.email || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Endereço Completo:</span>
                      <span className="text-white">
                        {reseller.address || 'Não informado'}
                        {reseller.neighborhood && `, ${reseller.neighborhood}`}
                        {reseller.city && ` - ${reseller.city}/${reseller.state || 'SP'}`}
                        {reseller.zipCode && ` (CEP: ${reseller.zipCode})`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {reseller.notes && (
                <div className="p-4 rounded-xl bg-[#070e20] border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Observações Comerciais
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{reseller.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#081023] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Ficha do Revendedor • ID: <b className="font-mono text-slate-300">{reseller.id}</b>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
