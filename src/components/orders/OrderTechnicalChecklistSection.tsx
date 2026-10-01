import React from 'react';
import {
  CheckSquare,
  Power,
  Smartphone,
  Zap,
  Wifi,
  Camera,
  Mic,
  Volume2,
  VolumeX,
  Fingerprint,
  SquareCheck,
  Disc,
  Cpu,
  Radio,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DeviceTechnicalChecklist } from '../../types';

interface OrderTechnicalChecklistSectionProps {
  isDark?: boolean;
  checklist: DeviceTechnicalChecklist;
  onChange: (updated: DeviceTechnicalChecklist) => void;
  compact?: boolean;
}

export const OrderTechnicalChecklistSection: React.FC<
  OrderTechnicalChecklistSectionProps
> = ({ isDark = true, checklist, onChange, compact = false }) => {
  const updateField = (field: keyof DeviceTechnicalChecklist, val: any) => {
    onChange({
      ...checklist,
      [field]: val,
    });
  };

  // Helper to count completed tests
  const completedCount = [
    checklist.ligar,
    checklist.toqueTela,
    checklist.flash,
    checklist.wifi,
    checklist.cameraFrontal,
    checklist.cameraTraseira,
    checklist.microfone,
    checklist.audio,
    checklist.volumeMais,
    checklist.volumeMenos,
    checklist.biometriaPresenca,
    checklist.botaoAuxiliarPresenca,
    checklist.gavetaChip,
    checklist.cartaoMemoria,
    checklist.chip1,
    checklist.chip2,
    checklist.sinalArea,
  ].filter(Boolean).length;

  const handleMarkAllOK = () => {
    onChange({
      ...checklist,
      ligar: 'SIM',
      toqueTela: 'SIM',
      flash: 'SIM',
      wifi: 'SIM',
      cameraFrontal: 'SIM',
      cameraTraseira: 'SIM',
      microfone: 'SIM',
      audio: 'SIM',
      volumeMais: 'SIM',
      volumeMenos: 'SIM',
      biometriaPresenca: 'TEM',
      biometriaStatus: 'FUNCIONA',
      botaoAuxiliarPresenca: 'TEM',
      botaoAuxiliarStatus: 'FUNCIONA',
      gavetaChip: 'SIM',
      cartaoMemoria: 'FUNCIONA',
      chip1: 'FUNCIONA',
      chip2: 'FUNCIONA',
      sinalArea: 'SIM',
    });
  };

  const handleClearAll = () => {
    onChange({
      observacoes: checklist.observacoes || '',
    });
  };

  // Button styles helper
  const getBtnClass = (
    currentVal: string | undefined,
    btnVal: string,
    variant: 'green' | 'red' | 'amber' | 'cyan' | 'neutral'
  ) => {
    const isSelected = currentVal === btnVal;
    const base = 'px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 border select-none ';

    if (isSelected) {
      if (variant === 'green') {
        return base + 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300';
      }
      if (variant === 'red') {
        return base + 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)] ring-1 ring-rose-300';
      }
      if (variant === 'amber') {
        return base + 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-300';
      }
      if (variant === 'cyan') {
        return base + 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] ring-1 ring-cyan-300';
      }
      return base + 'bg-slate-700 text-white border-slate-500 shadow-sm ring-1 ring-slate-400';
    }

    // Unselected
    return (
      base +
      (isDark
        ? 'bg-[#091122]/90 hover:bg-[#122244] text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300')
    );
  };

  return (
    <div
      className={`rounded-2xl border-2 flex flex-col h-full min-h-0 overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-b from-[#09152b]/95 via-[#060e1d]/90 to-[#03070f]/95 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)] text-white'
          : 'bg-white border-emerald-500 shadow-xl text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="p-2.5 sm:p-3 border-b border-emerald-500/30 shrink-0 bg-[#071328] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] shrink-0">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-wide leading-none text-white flex items-center gap-1.5">
              <span>CHECKLIST TÉCNICO</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                {completedCount}/17 testados
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Inspeção inicial dos botões e funções do aparelho
            </p>
          </div>
        </div>

        {/* Quick batch actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleMarkAllOK}
            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Preencher todos os testes como funcionando perfeitamente"
          >
            <Sparkles className="w-3 h-3" />
            <span>Tudo OK</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Limpar todos os botões do checklist"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Main Checklist Body - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 sm:p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* 1. BOTÃO LIGAR */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Power className="w-3 h-3 text-emerald-400" />
                <span>BOTÃO LIGAR:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.ligar || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('ligar', checklist.ligar === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.ligar, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('ligar', checklist.ligar === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.ligar, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('ligar', checklist.ligar === 'DIFICULDADE' ? undefined : 'DIFICULDADE')}
                className={getBtnClass(checklist.ligar, 'DIFICULDADE', 'amber')}
              >
                C/ DIFICULDADE
              </button>
            </div>
          </div>

          {/* 2. TOQUE NA TELA (TOUCH) */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                <span>TOQUE NA TELA:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.toqueTela || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('toqueTela', checklist.toqueTela === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.toqueTela, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('toqueTela', checklist.toqueTela === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.toqueTela, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('toqueTela', checklist.toqueTela === 'MAU_TOQUE' ? undefined : 'MAU_TOQUE')}
                className={getBtnClass(checklist.toqueTela, 'MAU_TOQUE', 'amber')}
              >
                MAU TOQUE
              </button>
            </div>
          </div>

          {/* 3. FLASH */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>FLASH:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.flash || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateField('flash', checklist.flash === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.flash, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('flash', checklist.flash === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.flash, 'NAO', 'red')}
              >
                NÃO
              </button>
            </div>
          </div>

          {/* 4. WIFI */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-blue-400" />
                <span>WIFI:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.wifi || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateField('wifi', checklist.wifi === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.wifi, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('wifi', checklist.wifi === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.wifi, 'NAO', 'red')}
              >
                NÃO
              </button>
            </div>
          </div>

          {/* 5. CÂMERA FRONTAL */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-purple-400" />
                <span>CAMERA FRONTAL:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.cameraFrontal || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('cameraFrontal', checklist.cameraFrontal === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.cameraFrontal, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('cameraFrontal', checklist.cameraFrontal === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.cameraFrontal, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('cameraFrontal', checklist.cameraFrontal === 'DETALHES' ? undefined : 'DETALHES')}
                className={getBtnClass(checklist.cameraFrontal, 'DETALHES', 'amber')}
              >
                C/ DETALHES
              </button>
            </div>
            {checklist.cameraFrontal === 'DETALHES' && (
              <input
                type="text"
                value={checklist.cameraFrontalObs || ''}
                onChange={(e) => updateField('cameraFrontalObs', e.target.value)}
                placeholder="Detalhes da câmera frontal (ex: embaçada, mancha)..."
                className="w-full px-2 py-1 bg-[#030917] border border-amber-500/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* 6. CÂMERA TRASEIRA */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-pink-400" />
                <span>CAMERA TRASEIRA:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.cameraTraseira || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('cameraTraseira', checklist.cameraTraseira === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.cameraTraseira, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('cameraTraseira', checklist.cameraTraseira === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.cameraTraseira, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('cameraTraseira', checklist.cameraTraseira === 'DETALHES' ? undefined : 'DETALHES')}
                className={getBtnClass(checklist.cameraTraseira, 'DETALHES', 'amber')}
              >
                C/ DETALHES
              </button>
            </div>
            {checklist.cameraTraseira === 'DETALHES' && (
              <input
                type="text"
                value={checklist.cameraTraseiraObs || ''}
                onChange={(e) => updateField('cameraTraseiraObs', e.target.value)}
                placeholder="Detalhes da câmera traseira (ex: vidro quebrado, vibra)..."
                className="w-full px-2 py-1 bg-[#030917] border border-amber-500/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* 7. MICROFONE */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-emerald-400" />
                <span>MICROFONE:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.microfone || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('microfone', checklist.microfone === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.microfone, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('microfone', checklist.microfone === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.microfone, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('microfone', checklist.microfone === 'DETALHES' ? undefined : 'DETALHES')}
                className={getBtnClass(checklist.microfone, 'DETALHES', 'amber')}
              >
                C/ DETALHES
              </button>
            </div>
            {checklist.microfone === 'DETALHES' && (
              <input
                type="text"
                value={checklist.microfoneObs || ''}
                onChange={(e) => updateField('microfoneObs', e.target.value)}
                placeholder="Detalhes do microfone (ex: baixo, chiado)..."
                className="w-full px-2 py-1 bg-[#030917] border border-amber-500/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* 8. ÁUDIO */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span>ÁUDIO / ALTO-FALANTE:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.audio || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('audio', checklist.audio === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.audio, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('audio', checklist.audio === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.audio, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('audio', checklist.audio === 'DETALHES' ? undefined : 'DETALHES')}
                className={getBtnClass(checklist.audio, 'DETALHES', 'amber')}
              >
                C/ DETALHE
              </button>
            </div>
            {checklist.audio === 'DETALHES' && (
              <input
                type="text"
                value={checklist.audioObs || ''}
                onChange={(e) => updateField('audioObs', e.target.value)}
                placeholder="Detalhes do áudio (ex: auricular mudo, viva-voz estourado)..."
                className="w-full px-2 py-1 bg-[#030917] border border-amber-500/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* 9. BOTÃO VOLUME + */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-teal-400" />
                <span>BOTÃO VOLUME (+):</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.volumeMais || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('volumeMais', checklist.volumeMais === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.volumeMais, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('volumeMais', checklist.volumeMais === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.volumeMais, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('volumeMais', checklist.volumeMais === 'DIFICULDADE' ? undefined : 'DIFICULDADE')}
                className={getBtnClass(checklist.volumeMais, 'DIFICULDADE', 'amber')}
              >
                C/ DIFICULDADE
              </button>
            </div>
          </div>

          {/* 10. BOTÃO VOLUME - */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <VolumeX className="w-3 h-3 text-teal-400" />
                <span>BOTÃO VOLUME (-):</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.volumeMenos || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('volumeMenos', checklist.volumeMenos === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.volumeMenos, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('volumeMenos', checklist.volumeMenos === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.volumeMenos, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('volumeMenos', checklist.volumeMenos === 'DIFICULDADE' ? undefined : 'DIFICULDADE')}
                className={getBtnClass(checklist.volumeMenos, 'DIFICULDADE', 'amber')}
              >
                C/ DIFICULDADE
              </button>
            </div>
          </div>

          {/* 11. DIGITAL / BIOMETRIA */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3 text-indigo-400" />
                <span>DIGITAL / BIOMETRIA:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.biometriaPresenca === 'TEM'
                  ? `TEM (${checklist.biometriaStatus || 'Pendente'})`
                  : checklist.biometriaPresenca === 'NAO_TEM'
                  ? 'NÃO TEM'
                  : 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (checklist.biometriaPresenca === 'TEM') {
                    updateField('biometriaPresenca', undefined);
                  } else {
                    onChange({
                      ...checklist,
                      biometriaPresenca: 'TEM',
                      biometriaStatus: checklist.biometriaStatus || 'FUNCIONA',
                    });
                  }
                }}
                className={getBtnClass(checklist.biometriaPresenca, 'TEM', 'cyan')}
              >
                TEM
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...checklist,
                    biometriaPresenca: checklist.biometriaPresenca === 'NAO_TEM' ? undefined : 'NAO_TEM',
                    biometriaStatus: undefined,
                  });
                }}
                className={getBtnClass(checklist.biometriaPresenca, 'NAO_TEM', 'neutral')}
              >
                NÃO TEM
              </button>
            </div>

            {checklist.biometriaPresenca === 'TEM' && (
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => updateField('biometriaStatus', checklist.biometriaStatus === 'FUNCIONA' ? undefined : 'FUNCIONA')}
                  className={getBtnClass(checklist.biometriaStatus, 'FUNCIONA', 'green')}
                >
                  FUNCIONA
                </button>
                <button
                  type="button"
                  onClick={() => updateField('biometriaStatus', checklist.biometriaStatus === 'NAO_FUNCIONA' ? undefined : 'NAO_FUNCIONA')}
                  className={getBtnClass(checklist.biometriaStatus, 'NAO_FUNCIONA', 'red')}
                >
                  NÃO FUNCIONA
                </button>
                <button
                  type="button"
                  onClick={() => updateField('biometriaStatus', checklist.biometriaStatus === 'DIFICULDADE' ? undefined : 'DIFICULDADE')}
                  className={getBtnClass(checklist.biometriaStatus, 'DIFICULDADE', 'amber')}
                >
                  C/ DIFICULDADE
                </button>
              </div>
            )}
          </div>

          {/* 12. BOTÃO AUXILIAR */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <SquareCheck className="w-3 h-3 text-violet-400" />
                <span>BOTÃO AUXILIAR (HOME/AÇÃO):</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.botaoAuxiliarPresenca === 'TEM'
                  ? `TEM (${checklist.botaoAuxiliarStatus || 'Pendente'})`
                  : checklist.botaoAuxiliarPresenca === 'NAO_TEM'
                  ? 'NÃO TEM'
                  : 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (checklist.botaoAuxiliarPresenca === 'TEM') {
                    updateField('botaoAuxiliarPresenca', undefined);
                  } else {
                    onChange({
                      ...checklist,
                      botaoAuxiliarPresenca: 'TEM',
                      botaoAuxiliarStatus: checklist.botaoAuxiliarStatus || 'FUNCIONA',
                    });
                  }
                }}
                className={getBtnClass(checklist.botaoAuxiliarPresenca, 'TEM', 'cyan')}
              >
                TEM
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...checklist,
                    botaoAuxiliarPresenca: checklist.botaoAuxiliarPresenca === 'NAO_TEM' ? undefined : 'NAO_TEM',
                    botaoAuxiliarStatus: undefined,
                  });
                }}
                className={getBtnClass(checklist.botaoAuxiliarPresenca, 'NAO_TEM', 'neutral')}
              >
                NÃO TEM
              </button>
            </div>

            {checklist.botaoAuxiliarPresenca === 'TEM' && (
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-800 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => updateField('botaoAuxiliarStatus', checklist.botaoAuxiliarStatus === 'FUNCIONA' ? undefined : 'FUNCIONA')}
                  className={getBtnClass(checklist.botaoAuxiliarStatus, 'FUNCIONA', 'green')}
                >
                  FUNCIONA
                </button>
                <button
                  type="button"
                  onClick={() => updateField('botaoAuxiliarStatus', checklist.botaoAuxiliarStatus === 'NAO_FUNCIONA' ? undefined : 'NAO_FUNCIONA')}
                  className={getBtnClass(checklist.botaoAuxiliarStatus, 'NAO_FUNCIONA', 'red')}
                >
                  NÃO FUNCIONA
                </button>
              </div>
            )}
          </div>

          {/* 13. GAVETA DO CHIP */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Disc className="w-3 h-3 text-amber-400" />
                <span>GAVETA DO CHIP:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.gavetaChip || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('gavetaChip', checklist.gavetaChip === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.gavetaChip, 'SIM', 'green')}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => updateField('gavetaChip', checklist.gavetaChip === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.gavetaChip, 'NAO', 'red')}
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => updateField('gavetaChip', checklist.gavetaChip === 'PROBLEMA' ? undefined : 'PROBLEMA')}
                className={getBtnClass(checklist.gavetaChip, 'PROBLEMA', 'amber')}
              >
                C/ PROBLEMA
              </button>
            </div>
          </div>

          {/* 14. CARTÃO DE MEMÓRIA */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Disc className="w-3 h-3 text-cyan-400" />
                <span>CARTÃO DE MEMÓRIA:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.cartaoMemoria || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('cartaoMemoria', checklist.cartaoMemoria === 'FUNCIONA' ? undefined : 'FUNCIONA')}
                className={getBtnClass(checklist.cartaoMemoria, 'FUNCIONA', 'green')}
              >
                FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('cartaoMemoria', checklist.cartaoMemoria === 'NAO_FUNCIONA' ? undefined : 'NAO_FUNCIONA')}
                className={getBtnClass(checklist.cartaoMemoria, 'NAO_FUNCIONA', 'red')}
              >
                NÃO FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('cartaoMemoria', checklist.cartaoMemoria === 'NAO_TESTADO' ? undefined : 'NAO_TESTADO')}
                className={getBtnClass(checklist.cartaoMemoria, 'NAO_TESTADO', 'neutral')}
              >
                NÃO TESTADO
              </button>
            </div>
          </div>

          {/* 15. CHIP 1 */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>CHIP 1:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.chip1 || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('chip1', checklist.chip1 === 'FUNCIONA' ? undefined : 'FUNCIONA')}
                className={getBtnClass(checklist.chip1, 'FUNCIONA', 'green')}
              >
                FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('chip1', checklist.chip1 === 'NAO_FUNCIONA' ? undefined : 'NAO_FUNCIONA')}
                className={getBtnClass(checklist.chip1, 'NAO_FUNCIONA', 'red')}
              >
                NÃO FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('chip1', checklist.chip1 === 'NAO_TESTADO' ? undefined : 'NAO_TESTADO')}
                className={getBtnClass(checklist.chip1, 'NAO_TESTADO', 'neutral')}
              >
                NÃO TESTADO
              </button>
            </div>
          </div>

          {/* 16. CHIP 2 */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-blue-400" />
                <span>CHIP 2:</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.chip2 || 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateField('chip2', checklist.chip2 === 'FUNCIONA' ? undefined : 'FUNCIONA')}
                className={getBtnClass(checklist.chip2, 'FUNCIONA', 'green')}
              >
                FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('chip2', checklist.chip2 === 'NAO_FUNCIONA' ? undefined : 'NAO_FUNCIONA')}
                className={getBtnClass(checklist.chip2, 'NAO_FUNCIONA', 'red')}
              >
                NÃO FUNCIONA
              </button>
              <button
                type="button"
                onClick={() => updateField('chip2', checklist.chip2 === 'NAO_TESTADO' ? undefined : 'NAO_TESTADO')}
                className={getBtnClass(checklist.chip2, 'NAO_TESTADO', 'neutral')}
              >
                NÃO TESTADO
              </button>
            </div>
          </div>

          {/* 17. SINAL DA ÁREA */}
          <div className="p-2 rounded-xl bg-[#07132a]/80 border border-slate-800 hover:border-slate-700 space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>SINAL DA ÁREA (REDE / OPERADORA):</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {checklist.sinalArea === 'SIM' ? 'DÁ ÁREA' : checklist.sinalArea === 'NAO' ? 'NÃO DÁ ÁREA' : 'Pendente'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField('sinalArea', checklist.sinalArea === 'SIM' ? undefined : 'SIM')}
                className={getBtnClass(checklist.sinalArea, 'SIM', 'green')}
              >
                SIM (DÁ ÁREA)
              </button>
              <button
                type="button"
                onClick={() => updateField('sinalArea', checklist.sinalArea === 'NAO' ? undefined : 'NAO')}
                className={getBtnClass(checklist.sinalArea, 'NAO', 'red')}
              >
                NÃO (NÃO DÁ ÁREA)
              </button>
            </div>
          </div>
        </div>

        {/* 18. ESPAÇO DE OBSERVAÇÃO */}
        <div className="p-2.5 rounded-xl bg-[#07132a]/95 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>ESPAÇO DE OBSERVAÇÃO DO CHECKLIST:</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              {(checklist.observacoes || '').length}/500
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={500}
            value={checklist.observacoes || ''}
            onChange={(e) => updateField('observacoes', e.target.value)}
            placeholder="Observações complementares do checklist técnico (ex: botão power afundado, vibra sem imagem, etc.)..."
            className="w-full p-2 bg-[#040915] border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-tight"
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to format checklist into readable summary for receipts/WhatsApp
export function formatTechnicalChecklistSummary(
  chk?: DeviceTechnicalChecklist
): string[] {
  if (!chk) return [];
  const lines: string[] = [];

  const getStatusLabel = (val?: string) => {
    if (!val) return null;
    if (val === 'SIM') return 'SIM';
    if (val === 'NAO') return 'NÃO';
    if (val === 'DIFICULDADE') return 'C/ DIFICULDADE';
    if (val === 'MAU_TOQUE') return 'MAU TOQUE';
    if (val === 'DETALHES') return 'C/ DETALHES';
    if (val === 'FUNCIONA') return 'FUNCIONA';
    if (val === 'NAO_FUNCIONA') return 'NÃO FUNCIONA';
    if (val === 'NAO_TESTADO') return 'NÃO TESTADO';
    if (val === 'PROBLEMA') return 'C/ PROBLEMA';
    return val;
  };

  if (chk.ligar) lines.push(`Ligar: ${getStatusLabel(chk.ligar)}`);
  if (chk.toqueTela) lines.push(`Toque na Tela: ${getStatusLabel(chk.toqueTela)}`);
  if (chk.flash) lines.push(`Flash: ${getStatusLabel(chk.flash)}`);
  if (chk.wifi) lines.push(`Wi-Fi: ${getStatusLabel(chk.wifi)}`);
  if (chk.cameraFrontal) {
    lines.push(`Câm. Frontal: ${getStatusLabel(chk.cameraFrontal)}${chk.cameraFrontalObs ? ` (${chk.cameraFrontalObs})` : ''}`);
  }
  if (chk.cameraTraseira) {
    lines.push(`Câm. Traseira: ${getStatusLabel(chk.cameraTraseira)}${chk.cameraTraseiraObs ? ` (${chk.cameraTraseiraObs})` : ''}`);
  }
  if (chk.microfone) {
    lines.push(`Microfone: ${getStatusLabel(chk.microfone)}${chk.microfoneObs ? ` (${chk.microfoneObs})` : ''}`);
  }
  if (chk.audio) {
    lines.push(`Áudio: ${getStatusLabel(chk.audio)}${chk.audioObs ? ` (${chk.audioObs})` : ''}`);
  }
  if (chk.volumeMais) lines.push(`Botão Vol (+): ${getStatusLabel(chk.volumeMais)}`);
  if (chk.volumeMenos) lines.push(`Botão Vol (-): ${getStatusLabel(chk.volumeMenos)}`);
  if (chk.biometriaPresenca) {
    lines.push(
      `Biometria: ${chk.biometriaPresenca === 'TEM' ? `TEM (${getStatusLabel(chk.biometriaStatus) || 'OK'})` : 'NÃO TEM'}`
    );
  }
  if (chk.botaoAuxiliarPresenca) {
    lines.push(
      `Botão Auxiliar: ${chk.botaoAuxiliarPresenca === 'TEM' ? `TEM (${getStatusLabel(chk.botaoAuxiliarStatus) || 'OK'})` : 'NÃO TEM'}`
    );
  }
  if (chk.gavetaChip) lines.push(`Gaveta do Chip: ${getStatusLabel(chk.gavetaChip)}`);
  if (chk.cartaoMemoria) lines.push(`Cartão Memória: ${getStatusLabel(chk.cartaoMemoria)}`);
  if (chk.chip1) lines.push(`Chip 1: ${getStatusLabel(chk.chip1)}`);
  if (chk.chip2) lines.push(`Chip 2: ${getStatusLabel(chk.chip2)}`);
  if (chk.sinalArea) lines.push(`Sinal da Área: ${chk.sinalArea === 'SIM' ? 'DÁ ÁREA' : 'NÃO DÁ ÁREA'}`);
  if (chk.observacoes?.trim()) lines.push(`Obs: ${chk.observacoes.trim()}`);

  return lines;
}
