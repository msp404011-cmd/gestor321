import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  PieChart,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Sale, ServiceOrder, Expense, Purchase, AccountReceivable } from '../../types';

interface ReportsFinanceTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  expenses: Expense[];
  purchases: Purchase[];
  receivables: AccountReceivable[];
  onExport: (type: string) => void;
}

export const ReportsFinanceTab: React.FC<ReportsFinanceTabProps> = ({
  sales,
  orders,
  expenses,
  purchases,
  receivables,
  onExport,
}) => {
  const { isDark } = useTheme();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Total Income (PDV + Paid OS)
  const pdvIncome = useMemo(() => sales.reduce((sum, s) => sum + (s.total || 0), 0), [sales]);
  const osIncome = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    [orders]
  );
  const totalInflows = pdvIncome + osIncome;

  // Total Outflows (Expenses + Purchases)
  const paidExpenses = useMemo(() => expenses.filter((e) => e.status === 'PAGO'), [expenses]);
  const totalExpensesAmount = useMemo(() => paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [paidExpenses]);
  const totalPurchasesAmount = useMemo(() => purchases.reduce((sum, p) => sum + (p.totalCost || p.total || 0), 0), [purchases]);
  const totalOutflows = totalExpensesAmount + totalPurchasesAmount;

  // Net Cash Flow
  const netCashFlow = totalInflows - totalOutflows;

  // Receivables KPIs
  const pendingReceivables = useMemo(
    () => receivables.filter((r) => r.status === 'PENDENTE' || r.status === 'VENCIDO'),
    [receivables]
  );
  const totalReceivablesAmount = useMemo(
    () => pendingReceivables.reduce((sum, r) => sum + (r.remainingAmount || r.amount || 0), 0),
    [pendingReceivables]
  );

  // Consolidated Financial Movements Stream
  const unifiedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'INCOME_SALE' | 'INCOME_OS' | 'EXPENSE' | 'PURCHASE';
      description: string;
      category: string;
      amount: number;
      paymentMethod?: string;
      userName?: string;
      status: string;
    }> = [];

    // Sales (Inflow)
    sales.forEach((s) => {
      list.push({
        id: s.id,
        date: s.date || s.createdAt || new Date().toISOString(),
        type: 'INCOME_SALE',
        description: `Venda Balcão #${String(s.saleNumber || s.id).slice(-5)} - ${s.customerName || 'Consumidor Final'}`,
        category: 'Vendas PDV',
        amount: s.total || 0,
        paymentMethod: s.paymentMethod,
        userName: s.sellerName,
        status: 'CONCLUÍDO',
      });
    });

    // Orders (Inflow)
    orders
      .filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO')
      .forEach((o) => {
        list.push({
          id: o.id,
          date: o.deliveredAt || o.updatedAt || o.createdAt,
          type: 'INCOME_OS',
          description: `Serviço OS #${String(o.orderNumber || o.id).slice(-5)} - ${o.customerName} (${o.brand} ${o.model})`,
          category: 'Serviços OS',
          amount: o.totalPrice || 0,
          paymentMethod: o.paymentMethod,
          userName: o.technicianName,
          status: 'CONCLUÍDO',
        });
      });

    // Expenses (Outflow)
    paidExpenses.forEach((e) => {
      list.push({
        id: e.id,
        date: e.paymentDate || e.dueDate || e.createdAt,
        type: 'EXPENSE',
        description: e.description || `Despesa: ${e.category}`,
        category: e.category || 'Despesas Gerais',
        amount: -(e.amount || 0),
        paymentMethod: e.paymentMethod,
        userName: e.supplier,
        status: 'PAGO',
      });
    });

    // Purchases (Outflow)
    purchases.forEach((p) => {
      list.push({
        id: p.id,
        date: p.date || p.createdAt,
        type: 'PURCHASE',
        description: `Compra de Estoque / Peças - ${p.supplierName || 'Fornecedor'}`,
        category: 'Compras Estoque',
        amount: -(p.totalCost || p.total || 0),
        paymentMethod: p.paymentMethod,
        userName: p.supplierName,
        status: 'PAGO',
      });
    });

    // Filter
    return list
      .filter((t) => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(term);
          const matchCat = t.category.toLowerCase().includes(term);
          if (!matchDesc && !matchCat) return false;
        }

        if (selectedType === 'INCOME' && t.amount <= 0) return false;
        if (selectedType === 'EXPENSE' && t.amount > 0) return false;

        if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, orders, paidExpenses, purchases, searchTerm, selectedType, selectedCategory]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Entradas */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-emerald-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Total de Entradas (Receitas)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 tracking-tight text-emerald-500`}>
            {formatCurrency(totalInflows)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-blue-500 font-semibold">PDV: {formatCurrency(pdvIncome)}</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-500 font-semibold">OS: {formatCurrency(osIncome)}</span>
          </div>
        </div>

        {/* Card 2: Total de Saídas */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-rose-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Total de Saídas (Despesas + Compras)
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 tracking-tight text-rose-500`}>
            {formatCurrency(totalOutflows)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-amber-500 font-semibold">Despesas: {formatCurrency(totalExpensesAmount)}</span>
            <span className="text-slate-400">•</span>
            <span className="text-purple-500 font-semibold">Compras: {formatCurrency(totalPurchasesAmount)}</span>
          </div>
        </div>

        {/* Card 3: Saldo Operacional Líquido */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Saldo Líquido Operacional
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-3 tracking-tight ${
              netCashFlow >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-rose-500'
            }`}
          >
            {formatCurrency(netCashFlow)}
          </p>
          <span className={`text-[11px] mt-2 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Entradas totais menos saídas totais
          </span>
        </div>

        {/* Card 4: Contas a Receber (Inadimplência / A Prazo) */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Contas a Receber (A Prazo / Fiado)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 tracking-tight text-amber-500`}>
            {formatCurrency(totalReceivablesAmount)}
          </p>
          <span className={`text-[11px] mt-2 block font-bold text-amber-600`}>
            {pendingReceivables.length} títulos pendentes de cobrança
          </span>
        </div>
      </div>

      {/* Filter and Action Bar */}
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
              placeholder="Buscar por descrição, cliente ou categoria..."
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

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border appearance-none pr-8 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="ALL">Todas as Movimentações</option>
              <option value="INCOME">Apenas Entradas (Receitas)</option>
              <option value="EXPENSE">Apenas Saídas (Despesas/Compras)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('FINANCEIRO_CSV')}
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
            onClick={() => onExport('FINANCEIRO_PDF')}
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#0c1c38] text-rose-300 border-rose-900/80 hover:bg-rose-900/30'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Printer className="w-4 h-4 text-rose-500" />
            <span>Imprimir Extrato</span>
          </button>
        </div>
      </div>

      {/* Main Consolidated Financial Stream Table */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Extrato Financeiro Consolidado de Lançamentos
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Todas as receitas e despesas registradas em ordem cronológica
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
          }`}>
            {unifiedTransactions.length} lançamentos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase font-bold ${
                isDark ? 'text-slate-400 border-blue-900/40 bg-[#0c1c38]/40' : 'text-slate-500 border-slate-200 bg-slate-50'
              }`}>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Tipo / Fluxo</th>
                <th className="py-2.5 px-3">Descrição do Lançamento</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Forma Pagto</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-blue-900/30' : 'divide-slate-200'}`}>
              {unifiedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Nenhuma movimentação financeira encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                unifiedTransactions.map((tx, idx) => {
                  const isIncome = tx.amount >= 0;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-500/5 transition-colors ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isIncome
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isIncome ? 'RECEITA / ENTRADA' : 'DESPESA / SAÍDA'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold max-w-[280px] truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.paymentMethod ? getPaymentMethodLabel(tx.paymentMethod) : '-'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-black whitespace-nowrap text-sm ${
                          isIncome ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(Math.abs(tx.amount))}`}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-500">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
