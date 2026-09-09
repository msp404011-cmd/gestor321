import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  ShoppingCart,
  Wrench,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Shield,
  Banknote,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Check,
  PlusCircle,
  MinusCircle,
  Lock,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface CashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'OPEN' | 'CLOSE' | 'SANGRIA' | 'SUPRIMENTO';
}

export const CashSessionModal: React.FC<CashSessionModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const { isDark } = useTheme();
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const session = StorageService.getCashSession();
  const currentUser = StorageService.getCurrentUser();

  // Compute breakdown from active session or defaults
  const movements = session?.movements || [];
  const openingBalance = session?.openingBalance || session?.initialBalance || 0;

  const salesPdv = movements.filter((m) => m.type === 'VENDA').reduce((sum, m) => sum + m.amount, 0);

  const servicesOs = movements.filter((m) => m.type === 'SERVICO_OS' || m.type === 'ORDEM_SERVICO').reduce((sum, m) => sum + m.amount, 0);

  const otherInflows = movements.filter((m) => m.type === 'SUPRIMENTO').reduce((sum, m) => sum + m.amount, 0);

  const sangriaOutflows = movements.filter((m) => m.type === 'SANGRIA' || m.type === 'DESPESA').reduce((sum, m) => sum + m.amount, 0);

  const systemTotal = openingBalance + salesPdv + servicesOs + otherInflows - sangriaOutflows;

  // Initialize amount when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'CLOSE') {
        setAmount(systemTotal > 0 ? systemTotal : '');
      } else if (mode === 'OPEN') {
        setAmount(openingBalance > 0 ? openingBalance : '');
      } else {
        setAmount('');
      }
      setReason('');
      setNotes('');
    }
  }, [isOpen, mode, systemTotal, openingBalance]);

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
  const difference = numAmount - systemTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
    const userName = currentUser?.name || 'Operador';

    if (mode === 'OPEN') {
      StorageService.openCash(finalAmount, notes, userName);
    } else if (mode === 'CLOSE') {
      StorageService.closeCash(finalAmount, notes, userName);
    } else if (mode === 'SANGRIA') {
      if (finalAmount <= 0 || !reason.trim()) {
        alert('Informe um valor válido e o motivo da retirada (sangria).');
        return;
      }
      StorageService.performCashMovement('SANGRIA', finalAmount, reason.trim(), userName);
    } else if (mode === 'SUPRIMENTO') {
      if (finalAmount <= 0 || !reason.trim()) {
        alert('Informe um valor válido e o motivo do reforço (suprimento).');
        return;
      }
      StorageService.performCashMovement('SUPRIMENTO', finalAmount, reason.trim(), userName);
    }

    onClose();
  };

  // Dates and times for header display
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedWeekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#071326] border-blue-800/80 shadow-[0_0_50px_rgba(15,23,42,0.9)] text-white'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-blue-900/60 bg-[#08152b]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3.5">
            {/* Custom Cash Register SVG Icon */}
            <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400 flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19h16" />
                <path d="M4 15h16v4H4z" />
                <path d="M6 15V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
                <path d="M9 4h6" />
                <path d="M12 4v3" />
                <circle cx="9" cy="11" r="0.5" fill="currentColor" />
                <circle cx="12" cy="11" r="0.5" fill="currentColor" />
                <circle cx="15" cy="11" r="0.5" fill="currentColor" />
                <circle cx="9" cy="13" r="0.5" fill="currentColor" />
                <circle cx="12" cy="13" r="0.5" fill="currentColor" />
                <circle cx="15" cy="13" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {mode === 'CLOSE'
                  ? 'Fechamento de Caixa'
                  : mode === 'OPEN'
                  ? 'Abertura de Caixa'
                  : mode === 'SANGRIA'
                  ? 'Sangria de Caixa'
                  : 'Suprimento de Caixa'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {mode === 'CLOSE'
                  ? 'Confira os valores e finalize o caixa com segurança.'
                  : mode === 'OPEN'
                  ? 'Informe o fundo de troco para iniciar as vendas do dia.'
                  : mode === 'SANGRIA'
                  ? 'Informe o valor e motivo da retirada de dinheiro.'
                  : 'Informe o valor e motivo do aporte de troco.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#0c1f3d] border border-blue-900/60 text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[82vh]">
          {/* Header 3 Status Cards (Date, Operator, Time) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: Data de Fechamento */}
            <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {mode === 'OPEN' ? 'Data de Abertura' : 'Data de Fechamento'}
                </span>
                <span className="text-sm font-black text-white block mt-0.5">
                  {formattedDate}
                </span>
                <span className="text-[11px] text-slate-400 block capitalize">
                  {formattedWeekday}
                </span>
              </div>
            </div>

            {/* Card 2: Operador */}
            <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Operador</span>
                <span className="text-sm font-black text-white block mt-0.5">
                  {currentUser?.name || 'Marcos Silva Pinto'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {currentUser?.role === 'ADMIN' ? 'Administrador' : 'Operador de Caixa'}
                </span>
              </div>
            </div>

            {/* Card 3: Horário */}
            <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Horário</span>
                <span className="text-sm font-black text-white block mt-0.5">
                  {formattedTime}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {mode === 'CLOSE' ? 'Fechamento do dia' : 'Registro do turno'}
                </span>
              </div>
            </div>
          </div>

          {mode === 'CLOSE' ? (
            /* CLOSE CASH REGISTER MODE - MATCHING FECHAME.PNG 100% */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Resumo do Caixa & Important Warning */}
              <div className="lg:col-span-6 space-y-3.5">
                {/* Resumo do Caixa */}
                <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-blue-900/40">
                    <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">Resumo do Caixa</h3>
                      <p className="text-[10px] text-slate-400">
                        Valores calculados automaticamente pelo sistema.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Vendas (PDV) */}
                    <div className="flex items-center justify-between p-2.5 bg-[#071326] border border-blue-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Vendas (PDV)</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400">
                        {formatCurrency(salesPdv)}
                      </span>
                    </div>

                    {/* Serviços (OS) */}
                    <div className="flex items-center justify-between p-2.5 bg-[#071326] border border-blue-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Serviços (OS)</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400">
                        {formatCurrency(servicesOs)}
                      </span>
                    </div>

                    {/* Entradas (Outros) */}
                    <div className="flex items-center justify-between p-2.5 bg-[#071326] border border-blue-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Entradas (Outros)</span>
                      </div>
                      <span className="text-xs font-black text-cyan-400">
                        {formatCurrency(otherInflows)}
                      </span>
                    </div>

                    {/* Saídas (Sangria) */}
                    <div className="flex items-center justify-between p-2.5 bg-[#071326] border border-blue-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Saídas (Sangria)</span>
                      </div>
                      <span className="text-xs font-black text-rose-400">
                        - {formatCurrency(sangriaOutflows)}
                      </span>
                    </div>

                    {/* Total no Sistema */}
                    <div className="flex items-center justify-between p-3 bg-[#0c1f3d] border border-blue-700/60 rounded-xl mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-200">Total no Sistema</span>
                      </div>
                      <span className="text-sm font-black text-cyan-400">
                        {formatCurrency(systemTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Importante Warning Card */}
                <div className="bg-[#1a1238] border border-purple-800/60 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="p-2 bg-purple-600/30 text-purple-400 rounded-xl flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-200">Importante</h4>
                    <p className="text-[11px] text-purple-300/80 leading-snug mt-0.5">
                      Após confirmar o fechamento, não será possível alterar os valores deste caixa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Dinheiro em Caixa, Diferença, Observações */}
              <div className="lg:col-span-6 space-y-3.5">
                {/* Dinheiro em Caixa */}
                <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 pb-1">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">Dinheiro em Caixa</h3>
                      <p className="text-[10px] text-slate-400">
                        Informe o valor físico apurado na gaveta.
                      </p>
                    </div>
                  </div>

                  {/* Input Box with R$ Prefix */}
                  <div className="flex items-center bg-[#071326] border border-blue-800/80 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                    <div className="px-4 py-3 bg-[#0c1f3d] border-r border-blue-800/80 text-blue-400 font-bold text-sm select-none">
                      R$
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={amount}
                      placeholder="0,00"
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val === '' ? '' : parseFloat(val));
                      }}
                      className="w-full bg-transparent px-4 py-2.5 text-xl font-black text-white focus:outline-none placeholder-slate-600"
                    />
                    <div className="px-3.5 py-3 text-slate-400 border-l border-blue-800/80 flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Diferença */}
                <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 pb-1">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">Diferença</h3>
                      <p className="text-[10px] text-slate-400">
                        Comparação entre o valor físico e o valor do sistema.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Status Box */}
                  {Math.abs(difference) < 0.01 ? (
                    <div className="p-3 bg-[#07241f] border border-emerald-600/50 rounded-xl flex items-center gap-3">
                      <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-base font-black text-emerald-400 block">
                          R$ 0,00
                        </span>
                        <span className="text-[11px] text-emerald-300 font-medium block">
                          Caixa conferido! Tudo certo.
                        </span>
                      </div>
                    </div>
                  ) : difference < 0 ? (
                    <div className="p-3 bg-[#2d0f19] border border-rose-600/50 rounded-xl flex items-center gap-3">
                      <div className="p-1 bg-rose-500/20 text-rose-400 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-base font-black text-rose-400 block">
                          - {formatCurrency(Math.abs(difference))}
                        </span>
                        <span className="text-[11px] text-rose-300 font-medium block">
                          Quebra de caixa! Falta dinheiro na gaveta.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#2d210f] border border-amber-600/50 rounded-xl flex items-center gap-3">
                      <div className="p-1 bg-amber-500/20 text-amber-400 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-base font-black text-amber-400 block">
                          + {formatCurrency(difference)}
                        </span>
                        <span className="text-[11px] text-amber-300 font-medium block">
                          Sobra de caixa! Sobrando dinheiro na gaveta.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações (Opcional) */}
                <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-white">Observações (Opcional)</h3>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digite alguma observação sobre o fechamento..."
                    className="w-full bg-[#071326] border border-blue-800/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="text-[10px] text-slate-500 text-right">
                    {notes.length}/300
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* OTHER MODES (OPEN, SANGRIA, SUPRIMENTO) */
            <div className="bg-[#0b1a32] border border-blue-900/60 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {mode === 'OPEN'
                    ? 'Fundo de Troco Inicial (R$)'
                    : mode === 'SANGRIA'
                    ? 'Valor a Retirar da Gaveta (R$)'
                    : 'Valor a Adicionar na Gaveta (R$)'}
                </label>
                <div className="flex items-center bg-[#071326] border border-blue-800/80 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                  <div className="px-4 py-3 bg-[#0c1f3d] border-r border-blue-800/80 text-blue-400 font-bold text-sm">
                    R$
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    placeholder="0,00"
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmount(val === '' ? '' : parseFloat(val));
                    }}
                    className="w-full bg-transparent px-4 py-2.5 text-xl font-black text-white focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              {(mode === 'SANGRIA' || mode === 'SUPRIMENTO') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Motivo da Operação <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      mode === 'SANGRIA'
                        ? 'Ex: Depósito bancário, pagamento de fornecedor'
                        : 'Ex: Troco inicial de moedas e notas de R$ 5,00'
                    }
                    className="w-full bg-[#071326] border border-blue-800/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Registro ou comentário adicional..."
                  className="w-full bg-[#071326] border border-blue-800/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0d1f3d] border border-blue-900/80 text-slate-300 hover:text-white hover:bg-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              className="px-7 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span>
                {mode === 'CLOSE'
                  ? 'Confirmar Fechamento'
                  : mode === 'OPEN'
                  ? 'Abrir Caixa'
                  : mode === 'SANGRIA'
                  ? 'Confirmar Sangria'
                  : 'Confirmar Suprimento'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
