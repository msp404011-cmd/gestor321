import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Copy, Check, Video, DollarSign, X, Eye, EyeOff, MoreVertical, User, UserPlus, CheckCircle, AlertCircle, Calendar, Mail, Smartphone, Clock } from 'lucide-react';
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

export interface CameraUser {
  id: string;
  name: string;
  email: string;
  password: string;
  recoveryEmail: string;
  expirationDate?: string;
  createdAt?: string;
}

export interface CameraClient {
  id: string;
  name: string;
  phone: string;
  cameraCount: number;
  monthlyValue: number;
  contabilizar: boolean;
  users: CameraUser[];
  dueDate?: string;
  createdAt: string;
}

export const CameraPackageManagement: React.FC = () => {
  const [clients, setClients] = useState<CameraClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState<number | null>(null);

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CameraClient | null>(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CameraUser | null>(null);
  const [targetClientIdForUser, setTargetClientIdForUser] = useState<string | null>(null);

  // Deletion modals state
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ clientId: string; userId: string; userName: string } | null>(null);

  // Form states for Client
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCameraCount, setClientCameraCount] = useState<number>(1);
  const [clientMonthlyValue, setClientMonthlyValue] = useState<string>('');
  const [clientDueDate, setClientDueDate] = useState<string>('');
  const [clientContabilizar, setClientContabilizar] = useState(true);

  // Form states for User account
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [userRecoveryEmail, setUserRecoveryEmail] = useState('');
  const [userExpirationDate, setUserExpirationDate] = useState('');

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const tenant = getTenantId();
    const primaryRef = collection(db, 'accounts', tenant, 'camera_clients');
    const unsubs: (() => void)[] = [];
    const clientMap = new Map<string, CameraClient>();

    const updateState = () => {
      const list = Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);
      setLoading(false);
    };

    const processSnapshot = (snapshot: any) => {
      snapshot.forEach((d: any) => {
        const data = d.data();
        clientMap.set(d.id, {
          id: d.id,
          name: data.name || '',
          phone: data.phone || '',
          cameraCount: Number(data.cameraCount || 1),
          monthlyValue: Number(data.monthlyValue || 0),
          contabilizar: data.contabilizar !== false,
          users: Array.isArray(data.users) ? data.users : [],
          dueDate: data.dueDate || '',
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      updateState();
    };

    const unsub1 = onSnapshot(primaryRef, processSnapshot, (error) => {
      console.warn("Sincronização primária de câmeras:", error.message);
      setLoading(false);
    });
    unsubs.push(unsub1);

    if (tenant !== 'mmspmartins62@gmail.com') {
      try {
        const secRef = collection(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients');
        const unsub2 = onSnapshot(secRef, processSnapshot, () => {});
        unsubs.push(unsub2);
      } catch (_) {}
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const valueStats = useMemo(() => {
    const stats: Record<number, { count: number, total: number }> = {};
    clients.forEach(c => {
      if (c.contabilizar) {
        if (!stats[c.monthlyValue]) stats[c.monthlyValue] = { count: 0, total: 0 };
        stats[c.monthlyValue].count += 1;
        stats[c.monthlyValue].total += c.monthlyValue;
      }
    });
    return stats;
  }, [clients]);

  const filteredClients = useMemo(() => {
    let list = clients;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.users.some(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.recoveryEmail.toLowerCase().includes(q)));
    }
    if (valueFilter !== null) {
      list = list.filter(c => c.monthlyValue === valueFilter);
    }
    return list;
  }, [clients, searchQuery, valueFilter]);

  const totals = useMemo(() => {
    let totalReceivable = 0;
    let totalCameras = 0;
    filteredClients.forEach(c => {
      if (c.contabilizar) totalReceivable += c.monthlyValue;
      totalCameras += c.cameraCount;
    });
    return {
      clientCount: filteredClients.length,
      totalReceivable: formatCurrency(totalReceivable),
      totalCameras,
      avgValue: filteredClients.length > 0 ? formatCurrency(totalReceivable / filteredClients.length) : formatCurrency(0)
    };
  }, [filteredClients]);

  const handleOpenClientModal = (client?: CameraClient) => {
    if (client) {
      setSelectedClient(client);
      setClientName(client.name);
      setClientPhone(client.phone);
      setClientCameraCount(client.cameraCount);
      setClientMonthlyValue(client.monthlyValue.toString());
      setClientDueDate(client.dueDate || '');
      setClientContabilizar(client.contabilizar);
    } else {
      setSelectedClient(null);
      setClientName('');
      setClientPhone('');
      setClientCameraCount(1);
      setClientMonthlyValue('');
      setClientDueDate('');
      setClientContabilizar(true);
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { showToast("Informe o nome do cliente", "error"); return; }
    const valueNum = parseFloat(clientMonthlyValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(valueNum)) { showToast("Informe um valor mensal válido", "error"); return; }

    const clientData = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      cameraCount: Number(clientCameraCount),
      monthlyValue: valueNum,
      dueDate: clientDueDate.trim(),
      contabilizar: clientContabilizar,
      users: selectedClient ? selectedClient.users : [],
      createdAt: selectedClient ? selectedClient.createdAt : new Date().toISOString()
    };

    try {
      const id = selectedClient ? selectedClient.id : `cam_cli_${Date.now()}`;
      await setDoc(doc(db, 'accounts', getTenantId(), 'camera_clients', id), sanitizeObject(clientData), { merge: true });
      if (getTenantId() !== 'mmspmartins62@gmail.com') {
        try {
          await setDoc(doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', id), sanitizeObject(clientData), { merge: true });
        } catch (_) {}
      }
      showToast(selectedClient ? "Cliente atualizado!" : "Cliente adicionado com sucesso!");
      setIsClientModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar no Firebase", "error");
    }
  };

  const confirmDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setClientToDelete(null);
    try {
      await deleteDoc(doc(db, 'accounts', getTenantId(), 'camera_clients', id));
      if (getTenantId() !== 'mmspmartins62@gmail.com') {
        try {
          await deleteDoc(doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', id));
        } catch (_) {}
      }
      showToast("Cliente excluído permanentemente!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao excluir do Firebase", "error");
    }
  };

  const handleToggleContabilizar = async (client: CameraClient) => {
    const newStatus = !client.contabilizar;
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, contabilizar: newStatus } : c));
    try {
      await updateDoc(doc(db, 'accounts', getTenantId(), 'camera_clients', client.id), { contabilizar: newStatus });
      if (getTenantId() !== 'mmspmartins62@gmail.com') {
        try {
          await updateDoc(doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', client.id), { contabilizar: newStatus });
        } catch (_) {}
      }
      showToast(`Status "Contabilizar" de ${client.name} alterado!`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar status", "error");
    }
  };

  const handleOpenUserModal = (clientId: string, user?: CameraUser) => {
    setTargetClientIdForUser(clientId);
    if (user) {
      setSelectedUser(user);
      setUserName(user.name);
      setUserEmail(user.email);
      setUserPassword(user.password);
      setUserRecoveryEmail(user.recoveryEmail);
      setUserExpirationDate(user.expirationDate || '');
    } else {
      setSelectedUser(null);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserRecoveryEmail('');
      setUserExpirationDate('');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientIdForUser) return;
    if (!userName.trim() || !userEmail.trim()) { showToast("Nome e E-mail/Celular são obrigatórios", "error"); return; }

    const client = clients.find(c => c.id === targetClientIdForUser);
    if (!client) return;

    let updatedUsers = [...client.users];
    if (selectedUser) {
      updatedUsers = updatedUsers.map(u => u.id === selectedUser.id ? { ...u, name: userName.trim(), email: userEmail.trim(), password: userPassword.trim(), recoveryEmail: userRecoveryEmail.trim(), expirationDate: userExpirationDate.trim() } : u);
    } else {
      updatedUsers.push({
        id: `cam_usr_${Date.now()}`,
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword.trim(),
        recoveryEmail: userRecoveryEmail.trim(),
        expirationDate: userExpirationDate.trim(),
        createdAt: new Date().toISOString()
      });
    }

    setClients(prev => prev.map(c => c.id === targetClientIdForUser ? { ...c, users: updatedUsers } : c));
    setIsUserModalOpen(false);

    try {
      await updateDoc(doc(db, 'accounts', getTenantId(), 'camera_clients', targetClientIdForUser), { users: sanitizeObject(updatedUsers) });
      if (getTenantId() !== 'mmspmartins62@gmail.com') {
        try {
          await updateDoc(doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', targetClientIdForUser), { users: sanitizeObject(updatedUsers) });
        } catch (_) {}
      }
      showToast(selectedUser ? "Conta de usuário atualizada!" : "Nova conta adicionada ao cliente!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar conta de usuário no Firebase", "error");
    }
  };

  const confirmDeleteUser = async (clientId: string, userId: string) => {
    const client = clients.find(c => c.id === clientId);
    setUserToDelete(null);
    if (!client) return;

    const updatedUsers = client.users.filter(u => u.id !== userId);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, users: updatedUsers } : c));
    try {
      await updateDoc(doc(db, 'accounts', getTenantId(), 'camera_clients', clientId), { users: sanitizeObject(updatedUsers) });
      if (getTenantId() !== 'mmspmartins62@gmail.com') {
        try {
          await updateDoc(doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', clientId), { users: sanitizeObject(updatedUsers) });
        } catch (_) {}
      }
      showToast("Conta de usuário removida!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao remover conta no Firebase", "error");
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-6 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${toast.type === 'success' ? 'bg-emerald-950 border border-emerald-600 text-emerald-200' : 'bg-rose-950 border border-rose-600 text-rose-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-900/30 p-3 rounded-xl text-blue-400"><Search className="w-6 h-6" /></div>
          <div><p className="text-xs text-slate-400 uppercase">Clientes</p><p className="text-2xl font-bold text-white">{totals.clientCount}</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-emerald-900/30 p-3 rounded-xl text-emerald-400"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-xs text-slate-400 uppercase">Total Mensal</p><p className="text-2xl font-bold text-white">{totals.totalReceivable}</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-purple-900/30 p-3 rounded-xl text-purple-400"><Video className="w-6 h-6" /></div>
          <div><p className="text-xs text-slate-400 uppercase">Total de Câmeras</p><p className="text-2xl font-bold text-white">{totals.totalCameras}</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-900/30 p-3 rounded-xl text-amber-400"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-xs text-slate-400 uppercase">Valor Médio</p><p className="text-2xl font-bold text-white">{totals.avgValue}</p></div>
        </div>
      </div>

      {/* Value Breakdown Cards */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setValueFilter(null)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${valueFilter === null ? 'bg-cyan-700 border-cyan-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>Todos</button>
        {Object.entries(valueStats).map(([value, stat]) => (
          <button key={value} onClick={() => setValueFilter(Number(value))} className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${valueFilter === Number(value) ? 'bg-cyan-950/60 border-cyan-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}>
            <span className="text-xs text-slate-400 font-bold">{formatCurrency(Number(value))}</span>
            <span className="text-lg font-bold">{stat.count}</span>
            <span className="text-[10px] text-slate-500">{formatCurrency(stat.total)}</span>
          </button>
        ))}
      </div>

      {/* Search and Add Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <Search className="w-5 h-5 text-slate-500" />
          <input placeholder="Pesquisar por cliente, telefone ou e-mails de contas..." className="bg-transparent w-full text-sm text-white outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <button onClick={() => handleOpenClientModal()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shrink-0"><Plus className="w-5 h-5"/> Adicionar Cliente</button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-semibold animate-pulse">Sincronizando com o Firebase...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-bold">Nenhum cliente de câmeras cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between ${client.contabilizar ? 'border-slate-800' : 'border-slate-800/40 opacity-75'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-lg font-bold text-white">{client.name.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-base">{client.name}</h4>
                        <CopyButton text={client.name} title="Copiar Nome" />
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{client.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold font-mono">{formatCurrency(client.monthlyValue)}</div>
                    <span className="text-[10px] text-slate-400 uppercase">Mensal</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
                    <Video className="w-3 h-3" />
                    <span>{client.cameraCount} {client.cameraCount === 1 ? 'Câmera' : 'Câmeras'}</span>
                  </span>
                  {client.dueDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30">
                      <span>Venc: {client.dueDate}</span>
                    </span>
                  )}
                  <button type="button" onClick={() => handleToggleContabilizar(client)} className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-lg border ${client.contabilizar ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    Contabilizar: {client.contabilizar ? 'SIM' : 'NÃO'}
                  </button>
                </div>

                {/* Users List */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Usuários Vinculados ({client.users.length})</span>
                    </span>
                    <button type="button" onClick={() => handleOpenUserModal(client.id)} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3 h-3" /> Adicionar Conta
                    </button>
                  </div>

                  {client.users.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">Nenhum usuário cadastrado.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {client.users.map(usr => (
                        <div key={usr.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span className="flex items-center gap-1">{usr.name} <CopyButton text={usr.name} /></span>
                            <div className="flex gap-1">
                              <button onClick={() => handleOpenUserModal(client.id, usr)} className="text-amber-400 hover:text-amber-300 p-0.5"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => setUserToDelete({ clientId: client.id, userId: usr.id, userName: usr.name })} className="text-rose-400 hover:text-rose-300 p-0.5"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          {usr.email && (
                            <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                              <span className="truncate">Email/Cel: {usr.email}</span>
                              <CopyButton text={usr.email} />
                            </div>
                          )}
                          {usr.password && (
                            <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                              <span className="flex items-center gap-1">
                                Senha: {showPasswordMap[usr.id] ? usr.password : '••••••••'}
                                <button onClick={() => togglePasswordVisibility(usr.id)} className="text-slate-500 hover:text-slate-300">{showPasswordMap[usr.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                              </span>
                              <CopyButton text={usr.password} />
                            </div>
                          )}
                          {usr.recoveryEmail && (
                            <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                              <span className="truncate">Recup: {usr.recoveryEmail}</span>
                              <CopyButton text={usr.recoveryEmail} />
                            </div>
                          )}
                          {usr.expirationDate && (
                            <div className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40 flex justify-between">
                              <span>Venc: {usr.expirationDate}</span>
                              <CopyButton text={usr.expirationDate} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex gap-2 border-t border-slate-800 pt-3 mt-3">
                <button onClick={() => handleOpenUserModal(client.id)} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-xs font-bold cursor-pointer">+ Conta</button>
                <button onClick={() => handleOpenClientModal(client)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold cursor-pointer">Editar</button>
                <button onClick={() => setClientToDelete({ id: client.id, name: client.name })} className="flex-1 bg-red-950/50 hover:bg-red-900 text-red-400 py-2 rounded-lg text-xs font-bold cursor-pointer">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[160] flex items-center justify-center p-4">
          <form onSubmit={handleSaveClient} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-4 border border-slate-800 text-white">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg">{selectedClient ? 'Editar Cliente' : 'Novo Cliente de Câmeras'}</h3>
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block">Nome do Cliente *</label>
                <input required placeholder="Nome" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">Telefone</label>
                <input placeholder="(00) 00000-0000" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs font-mono" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block">Qtd de Câmeras *</label>
                  <select className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs cursor-pointer" value={clientCameraCount} onChange={e => setClientCameraCount(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Câmera' : 'Câmeras'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block">Valor Mensal (R$) *</label>
                  <input required placeholder="0,00" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs font-mono" value={clientMonthlyValue} onChange={e => setClientMonthlyValue(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">Data de Vencimento</label>
                <input placeholder="Ex: Todo dia 10" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs font-mono" value={clientDueDate} onChange={e => setClientDueDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="contabilizar-cam" checked={clientContabilizar} onChange={e => setClientContabilizar(e.target.checked)} className="w-4 h-4 text-cyan-500 bg-slate-950 border-slate-800 rounded" />
                <label htmlFor="contabilizar-cam" className="text-xs text-slate-300 font-semibold cursor-pointer">Contabilizar neste Setor</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[160] flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-4 border border-slate-800 text-white font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg font-sans">{selectedUser ? 'Editar Conta' : 'Nova Conta de Câmeras'}</h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-xs text-slate-400 font-bold block">Identificação / Quem Usa *</label>
                <input required placeholder="Ex: Portaria, Loja" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={userName} onChange={e => setUserName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">E-mail ou Celular *</label>
                <input required placeholder="email@dominio.com" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={userEmail} onChange={e => setUserEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">Senha</label>
                <input placeholder="Senha" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={userPassword} onChange={e => setUserPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">Gmail de Recuperação</label>
                <input placeholder="recuperacao@gmail.com" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={userRecoveryEmail} onChange={e => setUserRecoveryEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block">Validade / Vencimento</label>
                <input placeholder="Ex: 10/10/2026" className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-cyan-500 text-xs" value={userExpirationDate} onChange={e => setUserExpirationDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-2 font-sans">
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold">Salvar Conta</button>
            </div>
          </form>
        </div>
      )}

      {clientToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[180] flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4 text-center border border-slate-800 text-white">
            <p>Deseja realmente excluir o cliente <strong>{clientToDelete.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setClientToDelete(null)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={() => confirmDeleteClient(clientToDelete.id)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[180] flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4 text-center border border-slate-800 text-white">
            <p>Deseja realmente excluir a conta de <strong>{userToDelete.userName}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setUserToDelete(null)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={() => confirmDeleteUser(userToDelete.clientId, userToDelete.userId)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
