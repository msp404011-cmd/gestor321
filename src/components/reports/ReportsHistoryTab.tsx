import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  X,
  ShoppingCart,
  Wrench,
  DollarSign,
  Package,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Sale, ServiceOrder, Expense, Purchase } from '../../types';

interface ReportsHistoryTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  expenses: Expense[];
  purchases: Purchase[];
  onExport: (type: string) => void;
}

export const ReportsHistoryTab: React.FC<ReportsHistoryTabProps> = ({
  sales,
  orders,
  expenses,
  purchases,
  onExport,
}) => {
  const { isDark } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<'ALL' | 'PDV' | 'OS' | 'EXPENSE' | 'PURCHASE'>('ALL');

  // Unified chronological event log
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      date: string;
      module: 'PDV' | 'OS' | 'EXPENSE' | 'PURCHASE';
      title: string;
      subtitle: string;
      amount?: number;
      badgeText: string;
      badgeColor: string;
      icon: any;
    }> = [];

    // Sales events
    sales.forEach((s) => {
      events.push({
        id: `sale-${s.id}`,
        date: s.date || s.createdAt || new Date().toISOString(),
        module: 'PDV',
        title: `Venda PDV Concluída #${String(s.saleNumber || s.id).slice(-5)}`,
        subtitle: `Cliente: ${s.customerName || 'Consumidor Final'} • ${(s.items || []).length} itens • Vendedor: ${s.sellerName || 'Balcão'}`,
        amount: s.total || 0,
        badgeText: 'PDV',
        badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
        icon: ShoppingCart,
      });
    });

    // OS events
    orders.forEach((o) => {
      events.push({
        id: `os-${o.id}`,
        date: o.deliveredAt || o.updatedAt || o.createdAt,
        module: 'OS',
        title: `Ordem de Serviço #${String(o.orderNumber || o.id).slice(-5)} - ${o.brand} ${o.model}`,
        subtitle: `Cliente: ${o.customerName} • Defeito: ${o.clientDefect || o.requestedService || 'Manutenção'} • Técnico: ${o.technicianName || 'Técnico'}`,
        amount: o.totalPrice || 0,
        badgeText: o.status || 'OS',
        badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        icon: Wrench,
      });
    });

    // Expenses events
    expenses.forEach((e) => {
      events.push({
        id: `exp-${e.id}`,
        date: e.paymentDate || e.dueDate || e.createdAt,
        module: 'EXPENSE',
        title: `Despesa Operacional: ${e.description || e.category}`,
        subtitle: `Categoria: ${e.category} • Fornecedor/Favorecido: ${e.supplier || '-'} • Status: ${e.status}`,
        amount: -(e.amount || 0),
        badgeText: 'DESPESA',
        badgeColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
        icon: DollarSign,
      });
    });

    // Purchases events
    purchases.forEach((p) => {
      events.push({
        id: `pur-${p.id}`,
        date: p.date || p.createdAt,
        module: 'PURCHASE',
        title: `Entrada de Estoque / Compra de Peças`,
        subtitle: `Fornecedor: ${p.supplierName || 'Fornecedor'} • NF: ${p.invoiceNumber || 'S/N'}`,
        amount: -(p.totalCost || p.total || 0),
        badgeText: 'COMPRA',
        badgeColor: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
        icon: Package,
      });
    });

    // Filter
    return events
      .filter((ev) => {
        if (selectedModule !== 'ALL' && ev.module !== selectedModule) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(term);
          const matchSubtitle = ev.subtitle.toLowerCase().includes(term);
          if (!matchTitle && !matchSubtitle) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, orders, expenses, purchases, selectedModule, searchTerm]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Bar with Filter and Exports */}
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
              placeholder="Buscar em todo o histórico de atividades..."
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

          {/* Module Filter */}
          <div className="relative">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value as any)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todos os Registros & Atividades</option>
              <option value="PDV">Apenas Vendas no PDV</option>
              <option value="OS">Apenas Ordens de Serviço</option>
              <option value="EXPENSE">Apenas Despesas Pagas</option>
              <option value="PURCHASE">Apenas Compras de Estoque</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('HISTORICO_CSV')}
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
            onClick={() => onExport('HISTORICO_PDF')}
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

      {/* Timeline List */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trilha de Auditoria & Linha do Tempo
            </h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
          }`}>
            {timelineEvents.length} eventos registrados
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {timelineEvents.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400 italic">
              Nenhuma atividade registrada no período ou filtro selecionado.
            </p>
          ) : (
            timelineEvents.map((ev) => {
              const Icon = ev.icon;
              const isPositive = (ev.amount ?? 0) >= 0;

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all hover:border-blue-500/50 ${
                    isDark ? 'bg-[#0c1c38]/70 border-blue-900/40' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {ev.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${ev.badgeColor}`}>
                          {ev.badgeText}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {ev.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {ev.amount !== undefined && (
                      <span
                        className={`text-xs font-black block ${
                          isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {isPositive ? `+ ${formatCurrency(ev.amount)}` : `- ${formatCurrency(Math.abs(ev.amount))}`}
                      </span>
                    )}
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatDateTime(ev.date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
