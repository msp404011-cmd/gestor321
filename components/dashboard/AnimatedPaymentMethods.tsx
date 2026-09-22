import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CreditCard, QrCode, Banknote, Building, HelpCircle } from 'lucide-react';
import { Sale, ServiceOrder } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { AnimatedCountNumber } from './AnimatedCountNumber';

interface AnimatedPaymentMethodsProps {
  sales: Sale[];
  orders: ServiceOrder[];
  isDark: boolean;
}

export const AnimatedPaymentMethods: React.FC<AnimatedPaymentMethodsProps> = ({
  sales,
  orders,
  isDark,
}) => {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const methodsData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totals: Record<string, { total: number; count: number }> = {
      PIX: { total: 0, count: 0 },
      'Cartão de Crédito': { total: 0, count: 0 },
      Dinheiro: { total: 0, count: 0 },
      'Cartão de Débito': { total: 0, count: 0 },
      Transferência: { total: 0, count: 0 },
      Outros: { total: 0, count: 0 },
    };

    // Aggregate from sales
    sales.forEach((s) => {
      const d = new Date(s.date || s.createdAt || '');
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const method = (s.paymentMethod || '').toUpperCase();
        const amt = s.total || 0;

        if (method.includes('PIX')) {
          totals['PIX'].total += amt;
          totals['PIX'].count++;
        } else if (method.includes('CREDIT') || method.includes('CRÉDITO') || method.includes('CREDITO')) {
          totals['Cartão de Crédito'].total += amt;
          totals['Cartão de Crédito'].count++;
        } else if (method.includes('DEBIT') || method.includes('DÉBITO') || method.includes('DEBITO')) {
          totals['Cartão de Débito'].total += amt;
          totals['Cartão de Débito'].count++;
        } else if (method.includes('DINHEIRO') || method.includes('CASH') || method.includes('ESPECIE')) {
          totals['Dinheiro'].total += amt;
          totals['Dinheiro'].count++;
        } else if (method.includes('TRANSF') || method.includes('TED') || method.includes('DOC') || method.includes('BOLETO')) {
          totals['Transferência'].total += amt;
          totals['Transferência'].count++;
        } else {
          totals['Outros'].total += amt;
          totals['Outros'].count++;
        }
      }
    });

    // Aggregate from delivered orders
    orders.forEach((o) => {
      if (o.status === 'ENTREGUE') {
        const d = new Date(o.deliveredAt || o.updatedAt || o.createdAt || '');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const method = (o.paymentMethod || '').toUpperCase();
          const amt = o.totalPrice || 0;

          if (method.includes('PIX')) {
            totals['PIX'].total += amt;
            totals['PIX'].count++;
          } else if (method.includes('CREDIT') || method.includes('CRÉDITO') || method.includes('CREDITO')) {
            totals['Cartão de Crédito'].total += amt;
            totals['Cartão de Crédito'].count++;
          } else if (method.includes('DEBIT') || method.includes('DÉBITO') || method.includes('DEBITO')) {
            totals['Cartão de Débito'].total += amt;
            totals['Cartão de Débito'].count++;
          } else if (method.includes('DINHEIRO') || method.includes('CASH')) {
            totals['Dinheiro'].total += amt;
            totals['Dinheiro'].count++;
          } else if (method.includes('TRANSF') || method.includes('TED') || method.includes('BOLETO')) {
            totals['Transferência'].total += amt;
            totals['Transferência'].count++;
          } else {
            totals['Outros'].total += amt;
            totals['Outros'].count++;
          }
        }
      }
    });

    const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.total, 0);

    const configs: {
      name: string;
      color: string;
      gradient: string;
      glow: string;
      icon: React.ReactNode;
    }[] = [
      {
        name: 'PIX',
        color: '#06b6d4',
        gradient: 'from-cyan-500 to-blue-500',
        glow: 'rgba(6,182,212,0.8)',
        icon: <QrCode className="w-3 h-3 text-cyan-400" />,
      },
      {
        name: 'Cartão de Crédito',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-indigo-500',
        glow: 'rgba(59,130,246,0.8)',
        icon: <CreditCard className="w-3 h-3 text-blue-400" />,
      },
      {
        name: 'Dinheiro',
        color: '#f59e0b',
        gradient: 'from-amber-400 to-orange-500',
        glow: 'rgba(245,158,11,0.8)',
        icon: <Banknote className="w-3 h-3 text-amber-400" />,
      },
      {
        name: 'Cartão de Débito',
        color: '#6366f1',
        gradient: 'from-indigo-500 to-purple-500',
        glow: 'rgba(99,102,241,0.8)',
        icon: <CreditCard className="w-3 h-3 text-indigo-400" />,
      },
      {
        name: 'Transferência',
        color: '#a855f7',
        gradient: 'from-purple-500 to-pink-500',
        glow: 'rgba(168,85,247,0.8)',
        icon: <Building className="w-3 h-3 text-purple-400" />,
      },
      {
        name: 'Outros',
        color: '#10b981',
        gradient: 'from-emerald-400 to-teal-500',
        glow: 'rgba(16,185,129,0.8)',
        icon: <HelpCircle className="w-3 h-3 text-emerald-400" />,
      },
    ];

    return configs.map((c) => {
      const data = totals[c.name] || { total: 0, count: 0 };
      const pct = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
      return {
        ...c,
        amount: data.total,
        count: data.count,
        pct: Math.round(pct),
      };
    });
  }, [sales, orders]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-2 transition-all relative overflow-hidden group shadow-xl ${
        isDark
          ? 'bg-gradient-to-b from-[#071927]/95 via-[#051420]/90 to-[#020b12] border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.2)] text-white hover:border-teal-400'
          : 'bg-white border-teal-200 shadow-lg text-slate-900'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_#14b8a6] animate-pulse" />
          Formas de Pagamento
          <span className="text-xs font-normal text-slate-400">(Mês)</span>
        </h2>
        <span className="text-xs font-bold text-teal-400">Distribuição</span>
      </div>

      <div className="space-y-2.5 my-auto">
        {methodsData.map((item) => {
          const isHovered = hoveredMethod === item.name;

          return (
            <div
              key={item.name}
              className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'bg-slate-800/80 border border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.3)] scale-101'
                  : 'hover:bg-slate-800/30 border border-transparent'
              }`}
              onMouseEnter={() => setHoveredMethod(item.name)}
              onMouseLeave={() => setHoveredMethod(null)}
            >
              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isDark ? 'bg-[#061422] border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="font-black text-xs w-9 text-right text-white">
                    {item.pct}%
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar with Gradient and Glow */}
              <div className={`w-full h-2 rounded-full overflow-hidden relative ${isDark ? 'bg-slate-800/80' : 'bg-slate-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${item.gradient} relative overflow-hidden`}
                  style={{
                    boxShadow: `0 0 10px ${item.glow}`,
                  }}
                >
                  {/* Subtle Shimmer Light beam */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
