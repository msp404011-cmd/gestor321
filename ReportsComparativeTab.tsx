import React, { useMemo } from 'react';
import {
  Layers,
  TrendingUp,
  ShoppingCart,
  Wrench,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { Sale, ServiceOrder, Expense } from '../../types';

interface ReportsComparativeTabProps {
  sales: Sale[];
  orders: ServiceOrder[];
  expenses: Expense[];
  onExport: (type: string) => void;
}

export const ReportsComparativeTab: React.FC<ReportsComparativeTabProps> = ({
  sales,
  orders,
  expenses,
  onExport,
}) => {
  const { isDark } = useTheme();

  // Channel 1: PDV
  const pdvTotal = useMemo(() => sales.reduce((sum, s) => sum + (s.total || 0), 0), [sales]);
  const pdvCount = sales.length;
  const pdvAvgTicket = pdvCount > 0 ? pdvTotal / pdvCount : 0;
  const pdvCost = useMemo(() => sales.reduce((sum, s) => sum + (s.costTotal || s.totalCost || 0), 0), [sales]);
  const pdvProfit = pdvTotal - pdvCost;
  const pdvMargin = pdvTotal > 0 ? Math.round((pdvProfit / pdvTotal) * 100) : 0;

  // Channel 2: OS Services
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'ENTREGUE' || o.paymentStatus === 'PAGO'),
    [orders]
  );
  const osTotal = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0), [completedOrders]);
  const osCount = completedOrders.length;
  const osAvgTicket = osCount > 0 ? osTotal / osCount : 0;
  const osLabor = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.laborPrice || 0), 0), [completedOrders]);
  const osParts = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.partsPrice || 0), 0), [completedOrders]);
  const osMargin = osTotal > 0 ? Math.round((osLabor / osTotal) * 100) : 0;

  // Total Business
  const totalRevenue = pdvTotal + osTotal;
  const pdvShare = totalRevenue > 0 ? Math.round((pdvTotal / totalRevenue) * 100) : 0;
  const osShare = totalRevenue > 0 ? Math.round((osTotal / totalRevenue) * 100) : 0;

  // Target Goals tracking (calculated mock vs real)
  const goals = [
    {
      title: 'Meta de Faturamento Mensal',
      current: totalRevenue,
      target: 25000,
      format: (v: number) => formatCurrency(v),
      percent: Math.min(Math.round((totalRevenue / 25000) * 100), 100),
      color: 'bg-emerald-500',
    },
    {
      title: 'Meta de Ordens de Serviço Entregues',
      current: osCount,
      target: 30,
      format: (v: number) => `${v} OS`,
      percent: Math.min(Math.round((osCount / 30) * 100), 100),
      color: 'bg-amber-500',
    },
    {
      title: 'Meta de Vendas de Acessórios no PDV',
      current: pdvCount,
      target: 50,
      format: (v: number) => `${v} vendas`,
      percent: Math.min(Math.round((pdvCount / 50) * 100), 100),
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Title Card with Actions */}
      <div
        className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-500">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">Comparativo de Canais & Desempenho</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Análise lado a lado entre o Balcão PDV e a Assistência Técnica (OS)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('COMPARATIVO_CSV')}
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
            onClick={() => onExport('COMPARATIVO_PDF')}
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

      {/* Side-by-Side Channels Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Channel 1: PDV Balcão */}
        <div
          className={`p-6 rounded-2xl border shadow-xs space-y-4 relative overflow-hidden ${
            isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Vendas no PDV (Balcão)
                </h4>
                <span className={`text-xs font-bold text-blue-500`}>
                  {pdvShare}% do Faturamento da Empresa
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-500 border border-blue-500/30">
              {pdvCount} Vendas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturamento Bruto</span>
              <span className={`text-lg font-black block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(pdvTotal)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Médio</span>
              <span className={`text-lg font-black block mt-0.5 text-blue-500`}>
                {formatCurrency(pdvAvgTicket)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Custo dos Produtos (CMV)</span>
              <span className={`text-lg font-black block mt-0.5 text-rose-500`}>
                - {formatCurrency(pdvCost)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Margem de Lucro Bruto</span>
              <span className={`text-lg font-black block mt-0.5 text-emerald-500`}>
                {pdvMargin}%
              </span>
            </div>
          </div>
        </div>

        {/* Channel 2: Assistência Técnica OS */}
        <div
          className={`p-6 rounded-2xl border shadow-xs space-y-4 relative overflow-hidden ${
            isDark ? 'bg-[#09152a] border-amber-900/60' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Assistência Técnica (OS)
                </h4>
                <span className={`text-xs font-bold text-amber-500`}>
                  {osShare}% do Faturamento da Empresa
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
              {osCount} OS Concluídas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturamento Bruto</span>
              <span className={`text-lg font-black block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(osTotal)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Médio por OS</span>
              <span className={`text-lg font-black block mt-0.5 text-amber-500`}>
                {formatCurrency(osAvgTicket)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mão de Obra Realizada</span>
              <span className={`text-lg font-black block mt-0.5 text-emerald-500`}>
                {formatCurrency(osLabor)}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0c1c38]' : 'bg-slate-50'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peças / Componentes</span>
              <span className={`text-lg font-black block mt-0.5 text-purple-500`}>
                {formatCurrency(osParts)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goals Progress Tracking */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#09152a] border-blue-900/60' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-blue-900/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Acompanhamento de Metas & Objetivos do Mês
            </h3>
          </div>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Progresso Geral
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#0c1c38]/60 border-blue-900/40' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {goal.title}
                </span>
                <span className="text-xs font-black text-emerald-500">{goal.percent}%</span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {goal.format(goal.current)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Meta: {goal.format(goal.target)}
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`${goal.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${goal.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
