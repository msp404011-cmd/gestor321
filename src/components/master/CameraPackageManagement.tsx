import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  Video, 
  DollarSign, 
  User, 
  Phone, 
  X, 
  Eye, 
  EyeOff, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Clock,
  Smartphone,
  Mail
} from 'lucide-react';
import { db } from '../../lib/firebase';

// Helper for copying text to clipboard in iframe/sandboxed environments
const copyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers or sandboxed iframes
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-99999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Erro ao copiar texto:", err);
    return false;
  }
};

// Reusable Copy Button component
const CopyButton: React.FC<{ text: string; title?: string }> = ({ text, title }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`p-1 rounded-md transition-all shrink-0 cursor-pointer ${
        copied 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60'
      }`}
      title={title || "Copiar"}
    >
      {copied ? (
        <Check className="w-3 h-3 animate-in fade-in duration-150" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
};

// Interfaces
export interface CameraUser {
  id: string;
  name: string;      // Who uses this account
  email: string;     // Email ou Celular
  password: string;
  recoveryEmail: string;
  expirationDate?: string; // Data / Vencimento
  createdAt?: string;
}

export interface CameraClient {
  id: string;
  name: string;
  phone: string;
  cameraCount: number; // 1, 2, 3, 4, or more
  monthlyValue: number;
  contabilizar: boolean;
  users: CameraUser[];
  dueDate?: string; // Data de vencimento
  createdAt: string;
}

export const CameraPackageManagement: React.FC = () => {
  const [clients, setClients] = useState<CameraClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CameraClient | null>(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CameraUser | null>(null);
  const [targetClientIdForUser, setTargetClientIdForUser] = useState<string | null>(null);

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

  // Real-time Firestore sync under master account accounts/mmspmartins62@gmail.com/camera_clients
  useEffect(() => {
    const q = collection(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsList: CameraClient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        clientsList.push({
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          cameraCount: Number(data.cameraCount || 1),
          monthlyValue: Number(data.monthlyValue || 0),
          contabilizar: data.contabilizar !== false,
          users: Array.isArray(data.users) ? data.users : [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      // Sort clients by name
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientsList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao sincronizar clientes de câmeras:", error);
      showToast("Erro ao sincronizar com o Firebase", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Formatted currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Formata telefone (XX) XXXXX-XXXX
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setClientPhone(formatted);
  };

  // Calculations for KPI/Totals
  const totals = useMemo(() => {
    let totalReceivable = 0;
    let totalCameras = 0;

    clients.forEach(c => {
      if (c.contabilizar) {
        totalReceivable += c.monthlyValue;
      }
      totalCameras += c.cameraCount;
    });

    return {
      totalReceivable,
      totalCameras
    };
  }, [clients]);

  // Filtering list based on search
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter(c => {
      const matchesClient = c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchesUser = c.users.some(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.recoveryEmail.toLowerCase().includes(q)
      );
      return matchesClient || matchesUser;
    });
  }, [clients, searchQuery]);

  // Handle Client Add/Edit
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
    if (!clientName.trim()) {
      showToast("Informe o nome do cliente", "error");
      return;
    }

    const valueNum = parseFloat(clientMonthlyValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(valueNum)) {
      showToast("Informe um valor mensal válido", "error");
      return;
    }

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
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', id);
      await setDoc(docRef, clientData, { merge: true });
      showToast(selectedClient ? "Cliente atualizado!" : "Cliente adicionado com sucesso!");
      setIsClientModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar no Firebase", "error");
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o cliente "${name}" e todas as suas contas de usuário?`)) {
      try {
        const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', id);
        await deleteDoc(docRef);
        showToast("Cliente excluído permanentemente!");
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir do Firebase", "error");
      }
    }
  };

  // Quick toggle Contabilizar
  const handleToggleContabilizar = async (client: CameraClient) => {
    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', client.id);
      await updateDoc(docRef, {
        contabilizar: !client.contabilizar
      });
      showToast(`Status "Contabilizar" de ${client.name} alterado!`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar status", "error");
    }
  };

  // Handle User/Account inside Client Add/Edit
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

    if (!userName.trim() || !userEmail.trim()) {
      showToast("Nome e E-mail/Celular são obrigatórios", "error");
      return;
    }

    const client = clients.find(c => c.id === targetClientIdForUser);
    if (!client) return;

    let updatedUsers = [...client.users];

    if (selectedUser) {
      // Edit mode
      updatedUsers = updatedUsers.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              name: userName.trim(), 
              email: userEmail.trim(), 
              password: userPassword.trim(), 
              recoveryEmail: userRecoveryEmail.trim(),
              expirationDate: userExpirationDate.trim(),
              createdAt: u.createdAt || new Date().toISOString()
            }
          : u
      );
    } else {
      // Add mode
      const newUser: CameraUser = {
        id: `cam_usr_${Date.now()}`,
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword.trim(),
        recoveryEmail: userRecoveryEmail.trim(),
        expirationDate: userExpirationDate.trim(),
        createdAt: new Date().toISOString()
      };
      updatedUsers.push(newUser);
    }

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', targetClientIdForUser);
      await updateDoc(docRef, {
        users: updatedUsers
      });
      showToast(selectedUser ? "Conta de usuário atualizada!" : "Nova conta adicionada ao cliente!");
      setIsUserModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar conta de usuário", "error");
    }
  };

  const handleDeleteUser = async (clientId: string, userId: string, userName: string) => {
    if (window.confirm(`Deseja remover a conta de "${userName}" deste cliente?`)) {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedUsers = client.users.filter(u => u.id !== userId);

      try {
        const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients', clientId);
        await updateDoc(docRef, {
          users: updatedUsers
        });
        showToast("Conta de usuário removida!");
      } catch (err) {
        console.error(err);
        showToast("Erro ao remover conta", "error");
      }
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Toast popup message */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border border-emerald-600 text-emerald-200' 
            : 'bg-rose-950 border border-rose-600 text-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KPI: Recebível Mensal */}
        <div className="bg-slate-900/95 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:border-slate-700/65 transition-all">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recebível Interno de Câmeras</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">
              {formatCurrency(totals.totalReceivable)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Contabilizado apenas neste setor (não entra no faturamento do Gestor)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total de Câmeras */}
        <div className="bg-slate-900/95 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:border-slate-700/65 transition-all">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Câmeras Instaladas</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-400">
              {totals.totalCameras} <span className="text-sm text-slate-400 font-bold">Unidades</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Soma de todos os clientes ativos e inativos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, telefone ou e-mails de contas..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleOpenClientModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-cyan-900/30 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente de Câmeras</span>
        </button>
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-semibold animate-pulse">Sincronizando com o Firebase...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-bold">Nenhum cliente de câmeras cadastrado.</p>
          <p className="text-xs text-slate-600 mt-1">Clique no botão acima para adicionar o primeiro cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className={`rounded-2xl border bg-slate-900/90 shadow-lg p-4 transition-all duration-200 flex flex-col justify-between ${
                client.contabilizar 
                  ? 'border-slate-800/80 hover:border-cyan-500/45' 
                  : 'border-slate-800/40 opacity-75 grayscale-20 hover:grayscale-0'
              }`}
            >
              {/* Card Main Info */}
              <div className="space-y-3.5">
                {/* Client Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-100 text-sm sm:text-base truncate max-w-[180px]" title={client.name}>
                        {client.name}
                      </h4>
                      <CopyButton text={client.name} title="Copiar Nome" />
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="font-mono">{client.phone}</span>
                        <CopyButton text={client.phone} title="Copiar Telefone" />
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action */}
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 font-mono font-black text-sm sm:text-base">
                      {formatCurrency(client.monthlyValue)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Mensal</span>
                  </div>
                </div>

                {/* Badges / Options Section */}
                <div className="flex flex-wrap items-center gap-2 py-1.5 border-y border-slate-800/50">
                  {/* Camera Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
                    <Video className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {client.cameraCount} {client.cameraCount === 1 ? 'Câmera' : 'Câmeras'}
                    </span>
                  </span>

                  {/* Vencimento Badge */}
                  {client.dueDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-800/40">
                      <span>Vencimento: {client.dueDate}</span>
                    </span>
                  )}

                  {/* Contabilizar Switch Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleContabilizar(client)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border cursor-pointer transition-all ${
                      client.contabilizar
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800/80'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${client.contabilizar ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>Contabilizar neste Setor: {client.contabilizar ? 'SIM' : 'NÃO'}</span>
                  </button>
                </div>

                {/* Sub-users (Linked Accounts) inside Client */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Usuários Vinculados ({client.users.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenUserModal(client.id)}
                      className="inline-flex items-center gap-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-[#00bbf9] border border-[#00bbf9]/20 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    >
                      <UserPlus className="w-2.5 h-2.5" />
                      <span>Adicionar Usuário</span>
                    </button>
                  </div>

                  {client.users.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">
                      Nenhum usuário cadastrado neste cliente ainda.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {client.users.map((usr) => (
                        <div 
                          key={usr.id}
                          className="bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl text-xs space-y-1 relative"
                        >
                          {/* User Name & Action Buttons */}
                          <div className="flex justify-between items-center pb-0.5 border-b border-slate-800/30">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-200">{usr.name}</span>
                              <CopyButton text={usr.name} title="Copiar Usuário" />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenUserModal(client.id, usr)}
                                className="p-1 hover:bg-slate-800 rounded text-amber-400/90 hover:text-amber-400 transition-all cursor-pointer"
                                title="Editar Conta"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(client.id, usr.id, usr.name)}
                                className="p-1 hover:bg-rose-950/40 rounded text-rose-400/90 hover:text-rose-400 transition-all cursor-pointer"
                                title="Remover Conta"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Email, Pass, and Recovery info */}
                          <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                            {usr.email && (
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate flex items-center gap-1">
                                  {usr.email.includes('@') ? (
                                    <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                  ) : (
                                    <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                                  )}
                                  <span>{usr.email}</span>
                                </span>
                                <CopyButton text={usr.email} title="Copiar E-mail/Celular" />
                              </div>
                            )}
                            {usr.password && (
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="shrink-0 text-slate-400">Senha:</span>
                                  <span className="truncate">
                                    {showPasswordMap[usr.id] ? usr.password : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(usr.id)}
                                    className="p-0.5 text-slate-500 hover:text-slate-300 shrink-0"
                                  >
                                    {showPasswordMap[usr.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                                <CopyButton text={usr.password} title="Copiar Senha" />
                              </div>
                            )}
                            {usr.recoveryEmail && (
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-slate-400">Recup: {usr.recoveryEmail}</span>
                                <CopyButton text={usr.recoveryEmail} title="Copiar Recuperação" />
                              </div>
                            )}
                            {usr.expirationDate && (
                              <div className="flex items-center justify-between gap-1 text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40 text-[10px]">
                                <span className="flex items-center gap-1 font-bold">
                                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                                  <span>Vencimento: {usr.expirationDate}</span>
                                </span>
                                <CopyButton text={usr.expirationDate} title="Copiar Vencimento" />
                              </div>
                            )}
                            {usr.createdAt && (
                              <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/40 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Criado em: {new Date(usr.createdAt).toLocaleDateString('pt-BR')}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => handleOpenClientModal(client)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClient(client.id, client.name)}
                  className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-900/30 hover:border-rose-700/60 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD / EDIT CLIENT MODAL --- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[160] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <span>{selectedClient ? 'Editar Cliente' : 'Novo Cliente de Câmeras'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo ou Razão Social"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>

              {/* Qtd Câmeras & Valor Mensal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold block">Qtd de Câmeras *</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                    value={clientCameraCount}
                    onChange={(e) => setClientCameraCount(Number(e.target.value))}
                  >
                    <option value={1} className="bg-slate-900 text-white">1 Câmera</option>
                    <option value={2} className="bg-slate-900 text-white">2 Câmeras</option>
                    <option value={3} className="bg-slate-900 text-white">3 Câmeras</option>
                    <option value={4} className="bg-slate-900 text-white">4 Câmeras</option>
                    <option value={5} className="bg-slate-900 text-white">5 Câmeras</option>
                    <option value={6} className="bg-slate-900 text-white">6 Câmeras</option>
                    <option value={8} className="bg-slate-900 text-white">8 Câmeras</option>
                    <option value={10} className="bg-slate-900 text-white">10 Câmeras</option>
                    <option value={12} className="bg-slate-900 text-white">12 Câmeras</option>
                    <option value={16} className="bg-slate-900 text-white">16 Câmeras</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold block">Valor Mensal (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 font-mono"
                    value={clientMonthlyValue}
                    onChange={(e) => setClientMonthlyValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">Data de Vencimento (Dia ou Data Completa)</label>
                <input
                  type="text"
                  placeholder="Ex: Todo dia 10 ou 10/10/2026"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  value={clientDueDate}
                  onChange={(e) => setClientDueDate(e.target.value)}
                />
              </div>

              {/* Opção Contabilizar */}
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="checkbox-contabilizar"
                  className="w-4 h-4 text-cyan-500 bg-slate-950 border-slate-800 rounded focus:ring-cyan-500"
                  checked={clientContabilizar}
                  onChange={(e) => setClientContabilizar(e.target.checked)}
                />
                <label htmlFor="checkbox-contabilizar" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Marcar para Contabilizar neste Setor (Não vai para o Gestor)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT USER ACCOUNT MODAL --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[160] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>{selectedUser ? 'Editar Usuário da Conta' : 'Adicionar Conta de Usuário'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 font-mono">
              {/* Quem usa */}
              <div className="space-y-1 font-sans">
                <label className="text-xs text-slate-400 font-bold block">Identificação / Quem Usa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala de Reunião, Guarita, Gerente"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              {/* E-mail ou Celular */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-sans">E-mail ou Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="email@dominio.com ou (00) 90000-0000"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-sans">Senha da Conta</label>
                <input
                  type="text"
                  placeholder="Senha de acesso"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>

              {/* Gmail de recuperação */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-sans">Gmail de Recuperação</label>
                <input
                  type="email"
                  placeholder="gmail_recuperacao@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={userRecoveryEmail}
                  onChange={(e) => setUserRecoveryEmail(e.target.value)}
                />
              </div>

              {/* Data de Vencimento / Validade da Conta */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-sans">Data de Vencimento / Validade</label>
                <input
                  type="text"
                  placeholder="Ex: Todo dia 10 ou 10/10/2026"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={userExpirationDate}
                  onChange={(e) => setUserExpirationDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
