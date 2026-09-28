import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Laptop, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Power, 
  Save, 
  Users, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { sessionManager, ActiveSession } from '../../services/sessionManager';

export const MasterSessionsManagement: React.FC = () => {
  const [companySettings, setCompanySettings] = useState(() => StorageService.getCompanySettings());
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterEmail, setFilterEmail] = useState('');
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await sessionManager.fetchActiveSessions();
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveLimits = () => {
    StorageService.saveCompanySettings(companySettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDisconnect = async (sessionId: string) => {
    if (!confirm('Deseja realmente desconectar esta sessão remota?')) return;
    setDisconnectingId(sessionId);
    try {
      await sessionManager.disconnectSession(sessionId);
      await loadSessions();
    } finally {
      setDisconnectingId(null);
    }
  };

  const filteredSessions = sessions.filter(s => 
    !filterEmail || s.email.toLowerCase().includes(filterEmail.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Configuration Card: Simultaneous Login Limits */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Configuração de Limites de Logins Simultâneos
              </h2>
              <p className="text-xs text-slate-400">
                Defina quantos computadores ou celulares podem acessar o sistema ao mesmo tempo por conta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLimits}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-cyan-950 cursor-pointer"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Salvo!' : 'Salvar Limites'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Limite Padrão para Clientes / Contas Normais</span>
            </label>
            <select
              value={companySettings.maxSimultaneousLogins || 2}
              onChange={(e) => setCompanySettings({
                ...companySettings,
                maxSimultaneousLogins: Number(e.target.value)
              })}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-cyan-500"
            >
              <option value={1}>1 Dispositivo (Mais seguro - 1 por vez)</option>
              <option value={2}>2 Dispositivos (Padrão)</option>
              <option value={3}>3 Dispositivos</option>
              <option value={5}>5 Dispositivos</option>
              <option value={10}>10 Dispositivos</option>
              <option value={999}>Ilimitado (Sem restrição)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Se uma conta com este limite for acessada além do número permitido, a sessão mais antiga é automaticamente finalizada.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Limite Exclusivo para Contas Super Admin</span>
            </label>
            <select
              value={companySettings.superAdminMaxSimultaneousLogins || 5}
              onChange={(e) => setCompanySettings({
                ...companySettings,
                superAdminMaxSimultaneousLogins: Number(e.target.value)
              })}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-cyan-500"
            >
              <option value={1}>1 Dispositivo</option>
              <option value={2}>2 Dispositivos</option>
              <option value={5}>5 Dispositivos (Recomendado)</option>
              <option value={10}>10 Dispositivos</option>
              <option value={20}>20 Dispositivos</option>
              <option value={999}>Ilimitado</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Aplica-se às contas administrativas mestras (ex: Vicente / Super Admin).
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions Monitor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Sessões Conectadas em Tempo Real ({sessions.length})
              </h3>
              <p className="text-xs text-slate-400">
                Monitore todos os aparelhos ativos na plataforma e encerre acessos indesejados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por e-mail..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={loadSessions}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Atualizar lista de sessões"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <p>Nenhuma outra sessão ativa encontrada no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-bold">Usuário / E-mail</th>
                  <th className="py-2.5 px-3 font-bold">Dispositivo / Navegador</th>
                  <th className="py-2.5 px-3 font-bold">Endereço IP</th>
                  <th className="py-2.5 px-3 font-bold">Início da Sessão</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((sess) => {
                  const isCurrent = sess.isCurrent;
                  return (
                    <tr key={sess.sessionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{sess.email}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                              Esta sessão
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{sess.role || 'Usuário'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sess.device || 'Navegador Web'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {sess.ip || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(sess.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(sess.sessionId)}
                            disabled={disconnectingId === sess.sessionId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <Power className="w-3 h-3 text-rose-400" />
                            <span>Desconectar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
