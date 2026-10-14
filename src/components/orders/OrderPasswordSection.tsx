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
    <div className={`p-3 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${isDark ? 'bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>Senha / Desbloqueio</span>
        </label>

        <div className="flex items-center bg-[#040c1e] p-0.5 rounded-lg border border-slate-800 gap-0.5 text-[9px]">
          <button
            type="button"
            onClick={() => {
              setPasswordType('NONE');
              setPasswordPin('');
              setPatternNodes([]);
            }}
            className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer ${
              passwordType === 'NONE'
                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sem Senha
          </button>

          <button
            type="button"
            onClick={() => setPasswordType('PIN')}
            className={`px-2 py-0.5 rounded font-black transition-all flex items-center gap-0.5 cursor-pointer ${
              passwordType === 'PIN'
                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-2.5 h-2.5" />
            <span>PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setPasswordType('PATTERN')}
            className={`px-2 py-0.5 rounded font-black transition-all flex items-center gap-0.5 cursor-pointer ${
              passwordType === 'PATTERN'
                ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Grid className="w-2.5 h-2.5" />
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
          className="w-full px-2 py-1.5 bg-[#040c1e] border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
        />
      )}

      {passwordType === 'PATTERN' && (
        <div className="p-2 rounded-xl bg-[#040c1e] border border-cyan-500/50 flex items-center gap-2 animate-in fade-in">
          <div className="shrink-0">
            <PatternLock
              value={patternNodes}
              onChange={setPatternNodes}
              size={90}
              theme="dark"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1 text-xs">
            <div className="p-1 rounded-lg bg-[#07132a] border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-300">Sequência:</span>
                <button
                  type="button"
                  onClick={() => setPatternNodes([])}
                  className="text-[9px] text-slate-400 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Limpar
                </button>
              </div>
              <p className="text-[10px] font-mono font-black text-cyan-300 truncate">
                {patternNodes.length > 0 ? patternNodes.join(' ➔ ') : 'Arraste nos pontos'}
              </p>
            </div>
          </div>
        </div>
      )}

      {passwordType === 'NONE' && (
        <p className="text-[10px] text-slate-400 italic">
          Aparelho liberado sem senha de desbloqueio.
        </p>
      )}
    </div>
  );
};
