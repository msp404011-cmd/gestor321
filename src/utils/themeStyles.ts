/**
 * Helper to provide consistent dark/light cyber theme classes across all tabs.
 * Thicker borders (border-2) and vivid glowing auras are enabled by default in dark mode.
 */
export function getThemeClasses(isDark: boolean) {
  return {
    // Main content cards
    card: isDark
      ? 'bg-[#0c1626]/95 border-2 border-slate-700/80 text-white shadow-[0_0_22px_rgba(30,58,138,0.25)] rounded-2xl transition-colors'
      : 'bg-white border-2 border-slate-200 text-slate-900 shadow-xs rounded-2xl transition-colors',

    // Inner surfaces / secondary cards
    cardInner: isDark
      ? 'bg-[#070e1c] border-2 border-slate-800 text-white rounded-xl transition-colors'
      : 'bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl transition-colors',

    // Typography
    headerTitle: isDark ? 'text-white' : 'text-slate-900',
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-700',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',

    // Inputs and selects
    input: isDark
      ? 'bg-[#070e1d] border-2 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_14px_rgba(6,182,212,0.35)] rounded-xl transition-all'
      : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:shadow-xs rounded-xl transition-all',

    // Tables
    tableWrapper: isDark
      ? 'bg-[#070b16] border-2 border-slate-800 rounded-2xl overflow-hidden'
      : 'bg-white border-2 border-slate-200 rounded-2xl overflow-hidden',
    tableHeader: isDark
      ? 'bg-[#070e1d] text-slate-300 border-b-2 border-slate-800 text-[11px] font-bold uppercase tracking-wider'
      : 'bg-slate-50 text-slate-600 border-b-2 border-slate-200 text-[11px] font-bold uppercase tracking-wider',
    tableRow: isDark
      ? 'border-b border-slate-800/80 hover:bg-[#0f1d35]/60 text-slate-200 transition-colors'
      : 'border-b border-slate-100 hover:bg-slate-50 text-slate-800 transition-colors',

    // Filter pills / buttons
    filterActive: isDark
      ? 'bg-blue-600 text-white border-2 border-blue-400/80 shadow-[0_0_16px_rgba(37,99,235,0.6)] font-bold'
      : 'bg-blue-600 text-white border-2 border-blue-600 shadow-xs font-bold',
    filterInactive: isDark
      ? 'bg-[#070e1d] text-slate-400 border-2 border-slate-800 hover:bg-slate-800 hover:text-white'
      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200 hover:text-slate-900',

    // Subtle divider
    divider: isDark ? 'border-slate-800' : 'border-slate-200',
  };
}
