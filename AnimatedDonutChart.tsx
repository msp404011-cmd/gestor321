import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, ChevronRight, CheckCircle2, Clock, AlertTriangle, PlayCircle, FileText, Send, Box } from 'lucide-react';
import { ServiceOrder } from '../../types';
import { AnimatedCountNumber } from './AnimatedCountNumber';
import { getCanonicalStatus } from '../../services/formatters';

interface AnimatedDonutChartProps {
  orders: ServiceOrder[];
  isDark: boolean;
  onNavigate: (tab: string, filter?: string) => void;
}

interface StatusConfig {
  key: string;
  label: string;
  color: string;
  bgDark: string;
  bgLight: string;
  borderDark: string;
  borderLight: string;
  icon: React.ReactNode;
}

export const AnimatedDonutChart: React.FC<AnimatedDonutChartProps> = ({
  orders,
  isDark,
  onNavigate,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const statusConfigs: StatusConfig[] = [
    {
      key: 'NOVA',
      label: 'Nova',
      color: '#06b6d4', // Cyan
      bgLight: 'bg-cyan-50 text-cyan-800',
      bgDark: 'bg-cyan-950/40 text-cyan-300',
      borderLight: 'border-cyan-200',
      borderDark: 'border-cyan-500/30',
      icon: <FileText className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      key: 'ORCAMENTO',
      label: 'Orçamento',
      color: '#eab308', // Amber
      bgLight: 'bg-amber-50 text-amber-800',
      bgDark: 'bg-amber-950/40 text-amber-300',
      borderLight: 'border-amber-200',
      borderDark: 'border-amber-500/30',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      key: 'AGUARDANDO_APROVACAO',
      label: 'Aguardando Aprovação',
      color: '#f97316', // Orange
      bgLight: 'bg-orange-50 text-orange-800',
      bgDark: 'bg-orange-950/40 text-orange-300',
      borderLight: 'border-orange-200',
      borderDark: 'border-orange-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    },
    {
      key: 'EM_ANDAMENTO',
      label: 'Em Manutenção',
      color: '#a855f7', // Purple
      bgLight: 'bg-purple-50 text-purple-800',
      bgDark: 'bg-purple-950/40 text-purple-300',
      borderLight: 'border-purple-200',
      borderDark: 'border-purple-500/30',
      icon: <PlayCircle className="w-3.5 h-3.5 text-purple-400" />,
    },
    {
      key: 'PRONTA',
      label: 'Pronta',
      color: '#10b981', // Emerald
      bgLight: 'bg-emerald-50 text-emerald-800',
      bgDark: 'bg-emerald-950/40 text-emerald-300',
      borderLight: 'border-emerald-200',
      borderDark: 'border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      key: 'ENTREGUE',
      label: 'Entregue',
      color: '#3b82f6', // Blue
      bgLight: 'bg-blue-50 text-blue-800',
      bgDark: 'bg-blue-950/40 text-blue-300',
      borderLight: 'border-blue-200',
      borderDark: 'border-blue-500/30',
      icon: <Send className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      key: 'ARQUIVADO',
      label: 'Arquivado',
      color: '#71717a', // Zinc
      bgLight: 'bg-zinc-100 text-zinc-800',
      bgDark: 'bg-zinc-900/60 text-zinc-300',
      borderLight: 'border-zinc-300',
      borderDark: 'border-zinc-700/60',
      icon: <Box className="w-3.5 h-3.5 text-zinc-400" />,
    },
  ];

  const { segments, totalCount, activeItem } = useMemo(() => {
    const counts: Record<string, number> = {};
    statusConfigs.forEach((c) => {
      counts[c.key] = 0;
    });

    orders.forEach((o) => {
      const canonical = getCanonicalStatus(o.status as string);
      if (counts[canonical] !== undefined) {
        counts[canonical]++;
      } else {
        const raw = (o.status || '').toUpperCase();
        if (raw === 'PENDENTE' || raw === 'ABERTA') {
          counts['NOVA'] = (counts['NOVA'] || 0) + 1;
        } else if (raw === 'PRONTO' || raw === 'CONCLUIDA' || raw === 'FINALIZADA') {
          counts['PRONTA'] = (counts['PRONTA'] || 0) + 1;
        } else if (raw === 'ARQUIVADA' || raw === 'ARQUIVADO') {
          counts['ARQUIVADO'] = (counts['ARQUIVADO'] || 0) + 1;
        } else {
          counts['EM_ANDAMENTO'] = (counts['EM_ANDAMENTO'] || 0) + 1;
        }
      }
    });

    const total = orders.length;

    let cumulativeAngle = 0;
    const segments = statusConfigs.map((c) => {
      const count = counts[c.key] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const startAngle = cumulativeAngle;
      cumulativeAngle += pct;

      return {
        ...c,
        count,
        pct: Math.round(pct),
        exactPct: pct,
        startAngle,
      };
    });

    const activeItem = hoveredKey ? segments.find((s) => s.key === hoveredKey) || null : null;

    return {
      segments,
      totalCount: total,
      activeItem,
    };
  }, [orders, hoveredKey]);

  // Donut SVG geometry parameters
  const size = 150;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-2 transition-all duration-300 relative overflow-hidden h-full shadow-lg ${
        isDark
          ? 'bg-gradient-to-b from-[#0b1329] via-[#090f20] to-[#060a17] border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.18)] text-white hover:border-purple-400/60'
          : 'bg-white border-slate-200 shadow-sm text-slate-900 hover:border-purple-300'
      }`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg border shrink-0 ${
            isDark ? 'bg-purple-950/70 border-purple-500/50 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600'
          }`}>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate flex items-center gap-1.5">
              <span>Ordens de Serviço por Status</span>
            </h2>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Distribuição e fluxo de atendimentos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('ORDERS')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 border ${
            isDark
              ? 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-500/30'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
          }`}
        >
          <span>Ver OS</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Body: Donut Centered */}
      <div className="flex flex-col items-center justify-center my-1">
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 overflow-visible"
          >
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isDark ? '#141e33' : '#e2e8f0'}
              strokeWidth={strokeWidth}
            />

            {/* Donut Segments */}
            {segments.map((seg) => {
              if (seg.count === 0 && totalCount > 0) return null;
              const isHovered = hoveredKey === seg.key;
              const strokeDash = (seg.exactPct / 100) * circumference;
              const strokeOffset = -((seg.startAngle / 100) * circumference);

              return (
                <circle
                  key={seg.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${Math.max(0, strokeDash - 3)} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 10px ${seg.color})`
                      : `drop-shadow(0 0 3px ${seg.color})`,
                  }}
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => onNavigate('ORDERS')}
                />
              );
            })}
          </svg>

          {/* Center Dynamic Label and Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className={`text-2xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCountNumber
                value={activeItem ? activeItem.count : totalCount}
                duration={400}
              />
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider mt-1 transition-colors duration-200 line-clamp-1 ${
                activeItem
                  ? 'text-cyan-400 font-extrabold'
                  : isDark
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {activeItem ? activeItem.label : 'Total OS'}
            </span>
            {activeItem && totalCount > 0 && (
              <span className="text-[10px] font-mono text-cyan-300 font-semibold mt-0.5">
                {activeItem.pct}% do total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status List: 2-Row clean layout where progress bar is underneath with zero text overlap */}
      <div className="space-y-2 w-full mt-2">
        {segments.map((seg) => {
          const isHovered = hoveredKey === seg.key;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => onNavigate('ORDERS')}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? isDark
                    ? 'bg-purple-950/80 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] scale-[1.01]'
                    : 'bg-purple-50 border-purple-400 shadow-sm scale-[1.01]'
                  : isDark
                  ? 'bg-[#0f172a]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#131d36]'
                  : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
              }`}
            >
              {/* Row 1: Left has Icon + Dot + Status Name (Never clipped/covered); Right has Count + % */}
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: seg.color,
                      boxShadow: `0 0 6px ${seg.color}`,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                  <span className="shrink-0">{seg.icon}</span>
                  <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {seg.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {seg.count} OS
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {seg.pct}%
                  </span>
                </div>
              </div>

              {/* Row 2: Dedicated full-width progress bar completely beneath the text */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden relative ${isDark ? 'bg-slate-800/90' : 'bg-slate-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${seg.exactPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: seg.color,
                    boxShadow: isHovered ? `0 0 8px ${seg.color}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{segments.find(s => s.key === 'EM_ANDAMENTO')?.count || 0} em andamento</span>
        </span>
        <span className="font-semibold text-purple-400">
          {segments.find(s => s.key === 'PRONTA')?.count || 0} prontas
        </span>
      </div>
    </div>
  );
};
