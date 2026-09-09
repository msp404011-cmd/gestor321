import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Lock, Check, Grid } from 'lucide-react';

interface PatternLockProps {
  value: number[];
  onChange?: (pattern: number[]) => void;
  readOnly?: boolean;
  size?: number; // size in px
  theme?: 'dark' | 'light';
}

const DOT_COORDS: { [key: number]: { x: number; y: number } } = {
  1: { x: 30, y: 30 },
  2: { x: 90, y: 30 },
  3: { x: 150, y: 30 },
  4: { x: 30, y: 90 },
  5: { x: 90, y: 90 },
  6: { x: 150, y: 90 },
  7: { x: 30, y: 150 },
  8: { x: 90, y: 150 },
  9: { x: 150, y: 150 },
};

export const PatternLock: React.FC<PatternLockProps> = ({
  value = [],
  onChange,
  readOnly = false,
  size = 180,
  theme = 'dark',
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const valueRef = useRef<number[]>(value);
  valueRef.current = value;

  const isDark = theme === 'dark';

  const getSvgCoordinates = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 180 / rect.width;
    const scaleY = 180 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const findDotNear = useCallback((coords: { x: number; y: number }, threshold = 22): number | null => {
    for (let i = 1; i <= 9; i++) {
      const dot = DOT_COORDS[i];
      const dist = Math.hypot(coords.x - dot.x, coords.y - dot.y);
      if (dist <= threshold) {
        return i;
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onChange) return;
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPointer(coords);

    const hitDot = findDotNear(coords);
    if (hitDot !== null) {
      if (valueRef.current.includes(hitDot)) {
        // If restarting on already selected or single click toggle
        onChange([hitDot]);
      } else {
        onChange([...valueRef.current, hitDot]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onChange || !isDrawing) return;
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    setCurrentPointer(coords);

    const hitDot = findDotNear(coords);
    if (hitDot !== null && !valueRef.current.includes(hitDot)) {
      const nextPattern = [...valueRef.current, hitDot];
      onChange(nextPattern);
    }
  };

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setCurrentPointer(null);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDrawing(false);
      setCurrentPointer(null);
    };
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, []);

  // Generate SVG lines
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < value.length - 1; i++) {
    const from = DOT_COORDS[value[i]];
    const to = DOT_COORDS[value[i + 1]];
    if (from && to) {
      lines.push(
        <line
          key={`line-${i}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={isDark ? '#06b6d4' : '#2563eb'}
          strokeWidth="4.5"
          strokeLinecap="round"
          className="transition-all duration-150"
        />
      );
    }
  }

  // Active trailing line while dragging
  if (isDrawing && currentPointer && value.length > 0) {
    const lastDot = DOT_COORDS[value[value.length - 1]];
    if (lastDot) {
      lines.push(
        <line
          key="active-trailing-line"
          x1={lastDot.x}
          y1={lastDot.y}
          x2={currentPointer.x}
          y2={currentPointer.y}
          stroke={isDark ? '#22d3ee' : '#3b82f6'}
          strokeWidth="3.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity="0.8"
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center select-none touch-none">
      <div
        className={`relative rounded-2xl p-2.5 transition-all shadow-md ${
          isDark
            ? 'bg-[#091632] border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
            : 'bg-slate-100 border-2 border-slate-300 shadow-sm'
        }`}
        style={{ width: size + 20, height: size + 20 }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 180 180"
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Subtle grid lines background */}
          <line x1="30" y1="30" x2="150" y2="30" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="30" y1="90" x2="150" y2="90" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="30" y1="150" x2="150" y2="150" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="30" y1="30" x2="30" y2="150" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="90" y1="30" x2="90" y2="150" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="150" y1="30" x2="150" y2="150" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="2 2" />

          {/* Connecting Lines */}
          {lines}

          {/* Dots 1 to 9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const coord = DOT_COORDS[num];
            const isSelected = value.includes(num);
            const stepOrder = value.indexOf(num) + 1; // 1º, 2º, 3º...

            return (
              <g key={num} className={readOnly ? 'cursor-default' : 'cursor-pointer'}>
                {/* Hit area for easier touch */}
                <circle cx={coord.x} cy={coord.y} r="22" fill="transparent" />

                {/* Outer ring if selected */}
                {isSelected && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="15"
                    fill="none"
                    stroke={isDark ? '#22d3ee' : '#2563eb'}
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Main dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 10 : 6}
                  fill={
                    isSelected
                      ? isDark
                        ? '#06b6d4'
                        : '#2563eb'
                      : isDark
                      ? '#475569'
                      : '#94a3b8'
                  }
                  className="transition-all duration-150"
                />

                {/* Order indicator (1, 2, 3...) inside the selected dot */}
                {isSelected && (
                  <text
                    x={coord.x}
                    y={coord.y + 3.5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                    fill={isDark ? '#041026' : '#ffffff'}
                  >
                    {stepOrder}
                  </text>
                )}

                {/* Dot number label hint if not selected */}
                {!isSelected && (
                  <text
                    x={coord.x}
                    y={coord.y + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill={isDark ? '#64748b' : '#94a3b8'}
                    opacity="0.6"
                  >
                    {num}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sequence readout & actions */}
      {!readOnly && onChange && (
        <div className="w-full mt-2.5 flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-mono">
              {value.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sequência:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 text-xs">
                    {value.join(' ➔ ')}
                  </span>
                </div>
              ) : (
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Desenhe ou clique nos pontos (1 a 9)
                </span>
              )}
            </div>

            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Quick guide reference */}
          <div className={`text-[10px] flex items-center justify-between border-t pt-1.5 ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
            <span>Padrão 3x3: [1 2 3 / 4 5 6 / 7 8 9]</span>
            <span className="font-bold text-cyan-500">{value.length} ponto(s) conectados</span>
          </div>
        </div>
      )}
    </div>
  );
};
