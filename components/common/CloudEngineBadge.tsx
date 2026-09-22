import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle2, RefreshCw, Zap, Database, ShieldCheck, X } from 'lucide-react';
import { CloudEngine, CloudEngineStatus } from '../../services/cloudEngine';

export const CloudEngineBadge: React.FC = () => {
  const [status, setStatus] = useState<CloudEngineStatus>(CloudEngine.getStatus());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = CloudEngine.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all font-medium cursor-pointer shadow-sm"
        title="Motor em Tempo Real Direto na Nuvem Firebase Ativo"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline font-bold">100% Nuvem Firebase</span>
        <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300 font-mono">
          {status.activeListenersCount} canais
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Mega Motor de Nuvem Firebase</h3>
                  <p className="text-[11px] text-slate-400">Sincronização instantânea e contínua</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Conta / Tenant Nuvem:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{status.tenantId}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Estado Operacional:
                  </span>
                  <span className="text-emerald-400 font-bold">100% Em Nuvem (Sem Local)</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Última Sincronização:
                  </span>
                  <span className="text-slate-300 font-mono">{status.lastSyncTime}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canais Ativos em Tempo Real</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Ordens de Serviço</span>
                    <span className="font-bold text-emerald-400">{status.collections.orders} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Clientes</span>
                    <span className="font-bold text-emerald-400">{status.collections.customers} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Produtos / Peças</span>
                    <span className="font-bold text-emerald-400">{status.collections.products} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Aparelhos</span>
                    <span className="font-bold text-emerald-400">{status.collections.devices} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Fornecedores</span>
                    <span className="font-bold text-emerald-400">{status.collections.suppliers} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Pedidos Fornecedor</span>
                    <span className="font-bold text-emerald-400">{status.collections.supplier_orders} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Débitos & Peças</span>
                    <span className="font-bold text-emerald-400">{status.collections.supplier_purchases} docs</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex justify-between">
                    <span className="text-slate-300">Funcionários</span>
                    <span className="font-bold text-emerald-400">{status.collections.employees} docs</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Qualquer clique, criação, edição ou exclusão é gravada e apagada diretamente no Firebase Firestore instantaneamente.
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
