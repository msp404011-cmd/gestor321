import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Check,
  X,
  RotateCcw,
  Tag,
  FileText,
  Plus,
} from 'lucide-react';
import { CustomAccessoryItem, DeviceType } from '../../types';
import { isAccessoryForDeviceType } from '../../services/storage';

interface OrderAccessoriesChecklistSectionProps {
  isDark?: boolean;
  deviceType: DeviceType;
  customAccessories: CustomAccessoryItem[];
  customAccMap: Record<string, { present: boolean; details: string }>;
  setCustomAccMap: React.Dispatch<
    React.SetStateAction<Record<string, { present: boolean; details: string }>>
  >;
  onNavigateToTab?: (tab: 'PROBLEMA' | 'CHECKLIST') => void;
  checklistFilledCount?: number;
}

const COMMON_DETAIL_TAGS = [
  'Original',
  'Paralelo',
  'Com avaria',
  'Arranhado',
  'Sem cabo',
  'Preto',
  'Branco',
  'Silicone',
];

export const OrderAccessoriesChecklistSection: React.FC<
  OrderAccessoriesChecklistSectionProps
> = ({
  isDark = true,
  deviceType = 'Smartphone',
  customAccessories = [],
  customAccMap = {},
  setCustomAccMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [extraItems, setExtraItems] = useState<{id: string, name: string, details: string}[]>([]);

  const handleAddExtraItem = () => {
    setExtraItems(prev => [...prev, { id: `extra-${Date.now()}`, name: '', details: '' }]);
  };

  const handleUpdateExtraItem = (id: string, field: 'name' | 'details', value: string) => {
    setExtraItems(prev => prev.map(item => item.id === id ? {...item, [field]: value} : item));
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems(prev => prev.filter(item => item.id !== id));
  };

  const activeAccessories = useMemo(() => {
    return (customAccessories || []).filter((acc) =>
      isAccessoryForDeviceType(acc, deviceType)
    );
  }, [customAccessories, deviceType]);

  const presentCount = useMemo(() => {
    return activeAccessories.filter(
      (acc) => customAccMap?.[acc.id]?.present
    ).length;
  }, [activeAccessories, customAccMap]);

  const filteredAccessories = useMemo(() => {
    return activeAccessories.filter((acc) => {
      const isPresent = Boolean(customAccMap[acc.id]?.present);
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return acc.name.toLowerCase().includes(q) || (customAccMap[acc.id]?.details || '').toLowerCase().includes(q);
    });
  }, [activeAccessories, customAccMap, searchQuery]);

  const accessoriesSummary = useMemo(() => {
    const list: string[] = [];
    activeAccessories.forEach((acc) => {
      const state = customAccMap[acc.id];
      if (state?.present) {
        list.push(`${acc.name}${state.details ? ` (${state.details})` : ''}`);
      }
    });
    extraItems.forEach(item => {
        if (item.name) list.push(`${item.name}${item.details ? ` (${item.details})` : ''}`);
    });

    return list.length === 0 ? 'Nenhum acessório entregue (Aparelho avulso)' : list.join(' • ');
  }, [activeAccessories, customAccMap, extraItems]);

  const handleToggleAccessory = (accId: string, present: boolean) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: { present, details: prev[accId]?.details || '' },
    }));
  };

  const handleUpdateAccessoryDetail = (accId: string, details: string) => {
    setCustomAccMap((prev) => ({
      ...prev,
      [accId]: { present: prev[accId]?.present ?? true, details },
    }));
  };

  const handleClearAll = () => {
    setCustomAccMap({});
    setExtraItems([]);
  };

  return (
    <div className={`rounded-3xl border-2 flex flex-col h-full min-h-0 overflow-hidden transition-all ${isDark ? 'bg-gradient-to-b from-[#140722]/95 via-[#0c0316]/90 to-[#07010d]/95 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.25)] text-white' : 'bg-white border-purple-400 shadow-xl text-slate-900'}`}>
      <div className="p-4 border-b border-purple-500/30 shrink-0 bg-[#090212] flex items-center justify-between gap-3">
        <h3 className="text-sm font-black tracking-wide text-white">CHECKLIST DE ACESSÓRIOS</h3>
        <button type="button" onClick={handleClearAll} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
          <RotateCcw className="w-3.5 h-3.5" /> Limpar
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAccessories.map((acc) => {
            const isPresent = Boolean(customAccMap[acc.id]?.present);
            const details = customAccMap[acc.id]?.details || '';
            return (
              <div key={acc.id} onClick={() => handleToggleAccessory(acc.id, !isPresent)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isPresent ? 'bg-gradient-to-r from-[#170529] to-[#0f031b] border-purple-500 ring-1 ring-purple-500/30' : 'bg-[#090213]/90 border-slate-800/90'}`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-lg flex items-center justify-center ${isPresent ? 'bg-purple-500' : 'bg-slate-800'}`}>
                      {isPresent && <Check className="w-3 h-3 stroke-[4]" />}
                    </div>
                    <span className="text-xs font-bold truncate">{acc.name}</span>
                  </div>
                  {isPresent && (
                    <div className="mt-1 pt-2 border-t border-purple-900/50" onClick={(e) => e.stopPropagation()}>
                      <input type="text" value={details} onChange={(e) => handleUpdateAccessoryDetail(acc.id, e.target.value)} placeholder="Detalhes..." className="w-full px-3 py-2 bg-[#07010e] border border-purple-500/50 rounded-xl text-xs text-purple-100" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {extraItems.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl border-2 border-purple-500/30 bg-[#090213]/90">
              <div className="flex gap-2 mb-2">
                <input type="text" value={item.name} onChange={(e) => handleUpdateExtraItem(item.id, 'name', e.target.value)} placeholder="Nome do item..." className="flex-1 bg-[#07010e] border border-slate-700 rounded-xl p-2 text-xs text-white" />
                <button onClick={() => handleRemoveExtraItem(item.id)} className="text-rose-400 hover:text-rose-300"><X className="w-4 h-4"/></button>
              </div>
              <input type="text" value={item.details} onChange={(e) => handleUpdateExtraItem(item.id, 'details', e.target.value)} placeholder="Detalhes..." className="w-full bg-[#07010e] border border-slate-700 rounded-xl p-2 text-xs text-white" />
            </div>
          ))}
          <button onClick={handleAddExtraItem} className="p-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-purple-500 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold">
            <Plus className="w-4 h-4" /> Adicionar Outro Item
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-purple-500/30 bg-[#090212]">
        <div className="px-4 py-2 rounded-xl bg-[#06010a] border border-purple-900/60 flex items-center justify-between">
          <span className="text-xs text-purple-200 truncate">{accessoriesSummary}</span>
          <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-purple-950 text-purple-300">{presentCount + extraItems.length} itens</span>
        </div>
      </div>
    </div>
  );
};
