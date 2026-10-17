import React from 'react';
import { Lock, KeyRound, Grid, RotateCcw } from 'lucide-react';
import { PatternLock } from './PatternLock';

interface OrderPasswordSectionProps {
  isDark: boolean;
  passwordType: 'NONE' | 'PIN' | 'PATTERN';
  setPasswordType: (val: 'NONE' | 'PIN' | 'PATTERN') => void;
  passwordPin: string;
  setPasswordPin: (val: string) => void;
  patternNodes: number[];
  setPatternNodes: React.Dispatch<React.SetStateAction<number[]>>;
  patternNote: string;
  setPatternNote: (val: string) => void;
}

export const OrderPasswordSection: React.FC<OrderPasswordSectionProps> = ({
  isDark,
  passwordType,
  setPasswordType,
  passwordPin,
  setPasswordPin,
  patternNodes,
  setPatternNodes,
  patternNote,
  setPatternNote,
}) => {
  return (
    <div className={`p-4 rounded-3xl border-2 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.35)] ${isDark ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs sm:text-sm font-black uppercase text-cyan-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Senha / Desbloqueio</span>
        </label>

        <div className="flex items-center bg-[#060309] p-1 rounded-xl border border-slate-800 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setPasswordType('NONE');
              setPasswordPin('');
              setPatternNodes([]);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              passwordType === 'NONE'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sem Senha
          </button>

          <button
            type="button"
            onClick={() => setPasswordType('PIN')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              passwordType === 'PIN'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setPasswordType('PATTERN')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              passwordType === 'PATTERN'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Desenho</span>
          </button>
        </div>
      </div>

      {passwordType === 'PIN' && (
        <input
          type="text"
          value={passwordPin}
          onChange={(e) => setPasswordPin(e.target.value)}
          placeholder="Senha / PIN de desbloqueio..."
          className="w-full px-3 py-2 bg-[#060309] border border-cyan-500/50 rounded-xl text-xs sm:text-sm font-mono text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 shadow-inner"
        />
      )}

      {passwordType === 'PATTERN' && (
        <div className="p-4 rounded-2xl bg-[#040c1e] border border-cyan-500/50 flex flex-col items-center gap-4 animate-in fade-in">
          <div className="shrink-0">
            <PatternLock
              value={patternNodes}
              onChange={setPatternNodes}
              size={120}
              theme="dark"
            />
          </div>
          <button
            type="button"
            onClick={() => setPatternNodes([])}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Desenho
          </button>
        </div>
      )}

      {passwordType === 'NONE' && (
        <p className="text-xs text-slate-400 italic">
          Aparelho liberado sem senha de desbloqueio.
        </p>
      )}
    </div>
  );
};
