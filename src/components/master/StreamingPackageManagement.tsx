import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Copy, Check, Tv, DollarSign, X, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { db } from '../../lib/firebase';
import { getTenantId, sanitizeObject } from '../../services/firestoreService';

const copyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); return true; }
    const textArea = document.createElement("textarea"); textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.left = "-99999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    const successful = document.execCommand('copy'); document.body.removeChild(textArea); return successful;
  } catch (err) { return false; }
};

const CopyButton: React.FC<{ text: string; title?: string }> = ({ text, title }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyToClipboard(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };
  return (
    <button type="button" onClick={onCopy} className={`p-1 rounded-md transition-all shrink-0 cursor-pointer ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60'}`} title={title || "Copiar"}>
      {copied ? <Check className="w-3 h-3 animate-in fade-in duration-150" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

export interface ClientAccess { id: string; userPerson: string; mec: string; key: string; appUsed: string; }
export interface AccessClient { id: string; name: string; phone: string; contractedCount: number; monthlyValue: number; contabilizar: boolean; accesses: ClientAccess[]; createdAt: string; }

export const StreamingPackageManagement: React.FC = () => {
  const [clients, setClients] = useState<AccessClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AccessClient | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<ClientAccess | null>(null);
  const [targetClientIdForAccess, setTargetClientIdForAccess] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [accessToDelete, setAccessToDelete] = useState<{ clientId: string; accessId: string; personName: string } | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMonthlyValue, setClientMonthlyValue] = useState('');
  const [accessUserPerson, setAccessUserPerson] = useState('');
  const [accessMec, setAccessMec] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [accessAppUsed, setAccessAppUsed] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [valueFilter, setValueFilter] = useState<number | null>(null);

  useEffect(() => {
    const tenant = getTenantId();
    const q = collection(db, 'accounts', tenant, 'app_access_clients');
    return onSnapshot(q, (snapshot) => {
      const list: AccessClient[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AccessClient));
      setClients(list.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const valueStats = useMemo(() => {
      const stats: Record<number, { count: number, total: number }> = {};
      clients.forEach(c => {
          if (!stats[c.monthlyValue]) stats[c.monthlyValue] = { count: 0, total: 0 };
          stats[c.monthlyValue].count += 1;
          stats[c.monthlyValue].total += c.monthlyValue;
      });
      return stats;
  }, [clients]);

  const filteredClients = useMemo(() => {
    let list = clients;
    const q = searchQuery.toLowerCase().trim();
    if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.accesses.some(a => a.userPerson.toLowerCase().includes(q) || a.mec.toLowerCase().includes(q) || a.key.toLowerCase().includes(q) || a.appUsed.toLowerCase().includes(q)));
    if (valueFilter !== null) list = list.filter(c => c.monthlyValue === valueFilter);
    return list;
  }, [clients, searchQuery, valueFilter]);

  const stats = useMemo(() => {
      const totalValue = filteredClients.reduce((acc, curr) => acc + curr.monthlyValue, 0);
      const totalAccesses = filteredClients.reduce((acc, curr) => acc + curr.accesses.length, 0);
      return { clientCount: filteredClients.length, totalValue: formatCurrency(totalValue), totalAccesses, avgValue: filteredClients.length > 0 ? formatCurrency(totalValue / filteredClients.length) : formatCurrency(0) };
  }, [filteredClients]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = selectedClient ? selectedClient.id : `acc_cli_${Date.now()}`;
    const data = { name: clientName, phone: clientPhone, monthlyValue: Number(clientMonthlyValue), accesses: selectedClient ? selectedClient.accesses : [] };
    await setDoc(doc(db, 'accounts', getTenantId(), 'app_access_clients', id), sanitizeObject(data), { merge: true });
    setIsClientModalOpen(false);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientIdForAccess) return;
    const client = clients.find(c => c.id === targetClientIdForAccess);
    if (!client) return;
    let accesses = [...client.accesses];
    if (selectedAccess) accesses = accesses.map(a => a.id === selectedAccess.id ? { ...a, userPerson: accessUserPerson, mec: accessMec, key: accessKey, appUsed: accessAppUsed } : a);
    else accesses.push({ id: `acc_${Date.now()}`, userPerson: accessUserPerson, mec: accessMec, key: accessKey, appUsed: accessAppUsed });
    await setDoc(doc(db, 'accounts', getTenantId(), 'app_access_clients', targetClientIdForAccess), { accesses: sanitizeObject(accesses) }, { merge: true });
    setIsAccessModalOpen(false);
  };

  const confirmDeleteClient = async (id: string) => { await deleteDoc(doc(db, 'accounts', getTenantId(), 'app_access_clients', id)); setClientToDelete(null); };
  const confirmDeleteAccess = async (cId: string, aId: string) => {
    const client = clients.find(c => c.id === cId);
    if (!client) return;
    await setDoc(doc(db, 'accounts', getTenantId(), 'app_access_clients', cId), { accesses: sanitizeObject(client.accesses.filter(a => a.id !== aId)) }, { merge: true });
    setAccessToDelete(null);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-950 min-h-screen text-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-blue-900/30 p-3 rounded-xl text-blue-400"><Search className="w-6 h-6" /></div>
                <div><p className="text-xs text-slate-400 uppercase">Clientes</p><p className="text-2xl font-bold text-white">{stats.clientCount}</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-emerald-900/30 p-3 rounded-xl text-emerald-400"><DollarSign className="w-6 h-6" /></div>
                <div><p className="text-xs text-slate-400 uppercase">Total Mensal</p><p className="text-2xl font-bold text-white">{stats.totalValue}</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-purple-900/30 p-3 rounded-xl text-purple-400"><Tv className="w-6 h-6" /></div>
                <div><p className="text-xs text-slate-400 uppercase">Acessos Ativos</p><p className="text-2xl font-bold text-white">{stats.totalAccesses}</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-amber-900/30 p-3 rounded-xl text-amber-400"><DollarSign className="w-6 h-6" /></div>
                <div><p className="text-xs text-slate-400 uppercase">Valor Médio</p><p className="text-2xl font-bold text-white">{stats.avgValue}</p></div>
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            <button onClick={() => setValueFilter(null)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${valueFilter === null ? 'bg-slate-700 border-slate-500' : 'bg-slate-900 border-slate-800'}`}>Todos</button>
            {Object.entries(valueStats).map(([value, stat]) => (
                <button key={value} onClick={() => setValueFilter(Number(value))} className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${valueFilter === Number(value) ? 'bg-blue-900/40 border-blue-600' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-xs text-slate-400 font-bold">{formatCurrency(Number(value))}</span>
                    <span className="text-lg font-bold">{stat.count}</span>
                    <span className="text-[10px] text-slate-500">{formatCurrency(stat.total)}</span>
                </button>
            ))}
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Search className="w-5 h-5 text-slate-500" />
                <input placeholder="Buscar por nome, telefone, app, MEC ou key..." className="bg-transparent w-full text-sm text-white outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={() => { setSelectedClient(null); setClientName(''); setIsClientModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5"/> Adicionar Cliente</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredClients.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">{c.name.substring(0, 2).toUpperCase()}</div>
                            <div><h4 className="font-bold text-white text-base">{c.name}</h4><p className="text-xs text-slate-400">{c.phone}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-950 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold">{formatCurrency(c.monthlyValue)}</span>
                          <button className="text-slate-500"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">{c.accesses.map(a => (
                        <div key={a.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-slate-300 font-medium">
                              <Tv className="w-4 h-4 text-blue-400" />
                              <span className="text-sm">App: {a.appUsed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span>MEC: {a.mec}</span>
                                <CopyButton text={a.mec} title="Copiar MEC" />
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span className="flex items-center gap-2">Key: {showKeys[a.id] ? a.key : '••••••••••••'}
                                  <button onClick={() => setShowKeys({...showKeys, [a.id]: !showKeys[a.id]})}>{showKeys[a.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                                </span>
                                <CopyButton text={a.key} title="Copiar Key" />
                            </div>
                        </div>
                    ))}</div>
                    <div className="flex gap-2 border-t border-slate-800 pt-3">
                      <button onClick={() => { setTargetClientIdForAccess(c.id); setSelectedAccess(null); setAccessUserPerson(''); setAccessMec(''); setAccessKey(''); setAccessAppUsed(''); setIsAccessModalOpen(true); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold">Acesso</button>
                      <button onClick={() => { setSelectedClient(c); setClientName(c.name); setClientPhone(c.phone); setClientMonthlyValue(String(c.monthlyValue)); setIsClientModalOpen(true); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-bold">Editar</button>
                      <button onClick={() => setClientToDelete({id: c.id, name: c.name})} className="flex-1 bg-red-950/50 hover:bg-red-900 text-red-400 py-2 rounded-lg text-sm font-bold">Excluir</button>
                    </div>
                </div>
            ))}
        </div>
        {isClientModalOpen && (<div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><form onSubmit={handleSaveClient} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4 border border-slate-800"><h3 className="text-white font-bold text-lg">{selectedClient ? 'Editar Cliente' : 'Novo Cliente'}</h3><input required placeholder="Nome" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={clientName} onChange={e => setClientName(e.target.value)} /><input placeholder="Telefone" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={clientPhone} onChange={e => setClientPhone(e.target.value)} /><input required placeholder="Valor Mensal" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={clientMonthlyValue} onChange={e => setClientMonthlyValue(e.target.value)} /><div className="flex gap-2"><button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Salvar</button></div></form></div>)}
        {isAccessModalOpen && (<div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><form onSubmit={handleSaveAccess} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4 border border-slate-800"><h3 className="text-white font-bold text-lg">Gerenciar Acesso</h3><input required placeholder="Nome da Pessoa" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={accessUserPerson} onChange={e => setAccessUserPerson(e.target.value)} /><input placeholder="App" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={accessAppUsed} onChange={e => setAccessAppUsed(e.target.value)} /><input placeholder="MEC" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={accessMec} onChange={e => setAccessMec(e.target.value)} /><input placeholder="Key" className="w-full px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800" value={accessKey} onChange={e => setAccessKey(e.target.value)} /><div className="flex gap-2"><button type="button" onClick={() => setIsAccessModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Salvar</button></div></form></div>)}
        {clientToDelete && (<div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4 text-center border border-slate-800"><p className="text-white">Deseja realmente excluir {clientToDelete.name}?</p><div className="flex gap-2"><button onClick={() => setClientToDelete(null)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button><button onClick={() => confirmDeleteClient(clientToDelete.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Excluir</button></div></div></div>)}
    </div>
  );
};
