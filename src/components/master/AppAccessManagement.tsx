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
  Tv, 
  DollarSign, 
  User, 
  Phone, 
  X, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Hash,
  Layers,
  Smartphone
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
export interface ClientAccess {
  id: string;
  userPerson: string; // Identifying the person who uses it
  mec: string;       // MEC field
  key: string;       // KEY field
  appUsed: string;   // Qual app utiliza
}

export interface AccessClient {
  id: string;
  name: string;
  phone: string;
  contractedCount: number; // quantidade contratada (1, 2, 3, 4 ou mais)
  monthlyValue: number;    // VALOR MENSAL
  contabilizar: boolean;   // SIM/NÃO
  accesses: ClientAccess[];
  createdAt: string;
}

export const AppAccessManagement: React.FC = () => {
  const [clients, setClients] = useState<AccessClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AccessClient | null>(null);
  
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<ClientAccess | null>(null);
  const [targetClientIdForAccess, setTargetClientIdForAccess] = useState<string | null>(null);

  // Deletion modals state (replaces window.confirm)
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [accessToDelete, setAccessToDelete] = useState<{ clientId: string; accessId: string; personName: string } | null>(null);

  // Form states for Client
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientContractedCount, setClientContractedCount] = useState<number>(1);
  const [clientMonthlyValue, setClientMonthlyValue] = useState<string>('');
  const [clientContabilizar, setClientContabilizar] = useState(true);

  // Form states for Access inside Client
  const [accessUserPerson, setAccessUserPerson] = useState('');
  const [accessMec, setAccessMec] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [accessAppUsed, setAccessAppUsed] = useState('');

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Real-time Firestore sync under master account accounts/mmspmartins62@gmail.com/app_access_clients
  useEffect(() => {
    const q = collection(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsList: AccessClient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        clientsList.push({
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          contractedCount: Number(data.contractedCount || 1),
          monthlyValue: Number(data.monthlyValue || 0),
          contabilizar: data.contabilizar !== false,
          accesses: Array.isArray(data.accesses) ? data.accesses : [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      // Sort clients alphabetically by name
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientsList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao sincronizar clientes de acessos:", error);
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
    let totalUnits = 0;

    clients.forEach(c => {
      if (c.contabilizar) {
        totalReceivable += c.monthlyValue;
      }
      totalUnits += c.contractedCount;
    });

    return {
      totalReceivable,
      totalUnits
    };
  }, [clients]);

  // Filtering list based on search query
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter(c => {
      const matchesClient = c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchesAccess = c.accesses.some(a => 
        a.userPerson.toLowerCase().includes(q) || 
        a.mec.toLowerCase().includes(q) || 
        a.key.toLowerCase().includes(q) ||
        a.appUsed.toLowerCase().includes(q)
      );
      return matchesClient || matchesAccess;
    });
  }, [clients, searchQuery]);

  // Handle Client Add/Edit
  const handleOpenClientModal = (client?: AccessClient) => {
    if (client) {
      setSelectedClient(client);
      setClientName(client.name);
      setClientPhone(client.phone);
      setClientContractedCount(client.contractedCount);
      setClientMonthlyValue(client.monthlyValue.toString());
      setClientContabilizar(client.contabilizar);
    } else {
      setSelectedClient(null);
      setClientName('');
      setClientPhone('');
      setClientContractedCount(1);
      setClientMonthlyValue('');
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

    const cleanedVal = clientMonthlyValue.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const valueNum = cleanedVal.trim() === '' ? 0 : parseFloat(cleanedVal);
    const finalMonthlyVal = isNaN(valueNum) ? 0 : valueNum;

    const id = selectedClient ? selectedClient.id : `acc_cli_${Date.now()}`;
    const clientData = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      contractedCount: Number(clientContractedCount),
      monthlyValue: finalMonthlyVal,
      contabilizar: clientContabilizar,
      accesses: selectedClient ? selectedClient.accesses : [],
      createdAt: selectedClient ? selectedClient.createdAt : new Date().toISOString()
    };

    const newOrUpdatedClient: AccessClient = {
      id,
      ...clientData
    };

    // Optimistic local state update
    setClients(prev => {
      const exists = prev.some(c => c.id === id);
      if (exists) {
        return prev.map(c => c.id === id ? newOrUpdatedClient : c);
      }
      return [...prev, newOrUpdatedClient];
    });

    setIsClientModalOpen(false);

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients', id);
      await setDoc(docRef, clientData, { merge: true });
      showToast(selectedClient ? "Cliente atualizado!" : "Cliente cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao sincronizar no Firebase", "error");
    }
  };

  const handleDeleteClient = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const confirmDeleteClient = async (id: string) => {
    // Immediate local removal
    setClients(prev => prev.filter(c => c.id !== id));
    setClientToDelete(null);

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients', id);
      await deleteDoc(docRef);
      showToast("Cliente e acessos excluídos permanentemente!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao excluir do Firebase", "error");
    }
  };

  // Quick toggle Contabilizar status
  const handleToggleContabilizar = async (client: AccessClient) => {
    const newStatus = !client.contabilizar;
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, contabilizar: newStatus } : c));

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients', client.id);
      await updateDoc(docRef, {
        contabilizar: newStatus
      });
      showToast(`Status "Contabilizar" de ${client.name} atualizado!`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar status", "error");
    }
  };

  // Handle Access (MEC/KEY/APP) inside Client
  const handleOpenAccessModal = (clientId: string, access?: ClientAccess) => {
    setTargetClientIdForAccess(clientId);
    if (access) {
      setSelectedAccess(access);
      setAccessUserPerson(access.userPerson);
      setAccessMec(access.mec);
      setAccessKey(access.key);
      setAccessAppUsed(access.appUsed);
    } else {
      setSelectedAccess(null);
      setAccessUserPerson('');
      setAccessMec('');
      setAccessKey('');
      setAccessAppUsed('');
    }
    setIsAccessModalOpen(true);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientIdForAccess) return;

    if (!accessUserPerson.trim()) {
      showToast("Identificação da pessoa é obrigatória", "error");
      return;
    }

    const client = clients.find(c => c.id === targetClientIdForAccess);
    if (!client) return;

    let updatedAccesses = [...client.accesses];

    if (selectedAccess) {
      // Edit mode
      updatedAccesses = updatedAccesses.map(a => 
        a.id === selectedAccess.id 
          ? { 
              ...a, 
              userPerson: accessUserPerson.trim(), 
              mec: accessMec.trim(), 
              key: accessKey.trim(), 
              appUsed: accessAppUsed.trim() 
            }
          : a
      );
    } else {
      // Add mode
      const newAccess: ClientAccess = {
        id: `access_${Date.now()}`,
        userPerson: accessUserPerson.trim(),
        mec: accessMec.trim(),
        key: accessKey.trim(),
        appUsed: accessAppUsed.trim()
      };
      updatedAccesses.push(newAccess);
    }

    // Immediate optimistic state update
    setClients(prev => prev.map(c => c.id === targetClientIdForAccess ? { ...c, accesses: updatedAccesses } : c));
    setIsAccessModalOpen(false);

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients', targetClientIdForAccess);
      await updateDoc(docRef, {
        accesses: updatedAccesses
      });
      showToast(selectedAccess ? "Acesso atualizado!" : "Novo acesso adicionado ao cliente!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao sincronizar acesso no Firebase", "error");
    }
  };

  const handleDeleteAccess = (clientId: string, accessId: string, personName: string) => {
    setAccessToDelete({ clientId, accessId, personName });
  };

  const confirmDeleteAccess = async (clientId: string, accessId: string) => {
    const client = clients.find(c => c.id === clientId);
    setAccessToDelete(null);
    if (!client) return;

    const updatedAccesses = client.accesses.filter(a => a.id !== accessId);

    // Immediate local state update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, accesses: updatedAccesses } : c));

    try {
      const docRef = doc(db, 'accounts', 'mmspmartins62@gmail.com', 'app_access_clients', clientId);
      await updateDoc(docRef, {
        accesses: updatedAccesses
      });
      showToast("Acesso removido com sucesso!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao remover acesso no Firebase", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast popup */}
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
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recebível Interno de Acessos</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">
              {formatCurrency(totals.totalReceivable)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Contabilizado apenas neste setor (não entra no faturamento do Gestor)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total de Unidades */}
        <div className="bg-slate-900/95 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:border-slate-700/65 transition-all">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Unidades Contratadas</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-400">
              {totals.totalUnits} <span className="text-sm text-slate-400 font-bold">Unidades</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Soma de todas as quantidades contratadas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, telefone, MEC, KEY ou aplicativo..."
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
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-semibold animate-pulse">Sincronizando com o Firebase...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-sm font-bold">Nenhum cliente cadastrado neste setor.</p>
          <p className="text-xs text-slate-600 mt-1">Clique no botão acima para adicionar o primeiro registro.</p>
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
              <div className="space-y-3">
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

                {/* Contracted count & Contabilizar toggler */}
                <div className="flex flex-wrap items-center gap-2 py-1.5 border-y border-slate-800/50">
                  {/* Contracted Units Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {client.contractedCount} {client.contractedCount === 1 ? 'Unidade' : 'Unidades'}
                    </span>
                  </span>

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

                {/* Sub-accesses (Linked Devices/Accounts) inside Client */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Acessos Vinculados ({client.accesses.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAccessModal(client.id)}
                      className="inline-flex items-center gap-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-[#00bbf9] border border-[#00bbf9]/20 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Adicionar Acesso</span>
                    </button>
                  </div>

                  {client.accesses.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">
                      Nenhum acesso cadastrado neste cliente ainda.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {client.accesses.map((acc) => (
                        <div 
                          key={acc.id}
                          className="bg-slate-950/60 border border-slate-800/50 p-2.5 rounded-xl text-xs space-y-1 relative"
                        >
                          {/* Access Person Name & Actions */}
                          <div className="flex justify-between items-center pb-0.5 border-b border-slate-800/30">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-200">{acc.userPerson}</span>
                              <CopyButton text={acc.userPerson} title="Copiar Nome da Pessoa" />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenAccessModal(client.id, acc)}
                                className="p-1 hover:bg-slate-800 rounded text-amber-400/90 hover:text-amber-400 transition-all cursor-pointer"
                                title="Editar Acesso"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccess(client.id, acc.id, acc.userPerson)}
                                className="p-1 hover:bg-rose-950/40 rounded text-rose-400/90 hover:text-rose-400 transition-all cursor-pointer"
                                title="Remover Acesso"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* App Used, MEC, and KEY */}
                          <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                            {acc.appUsed && (
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="text-slate-400 font-sans">App: <strong className="text-slate-200 font-semibold">{acc.appUsed}</strong></span>
                              </div>
                            )}
                            {acc.mec && (
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">MEC: <strong className="text-white">{acc.mec}</strong></span>
                                <CopyButton text={acc.mec} title="Copiar MEC" />
                              </div>
                            )}
                            {acc.key && (
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-slate-300">KEY: <strong className="text-white">{acc.key}</strong></span>
                                <CopyButton text={acc.key} title="Copiar KEY" />
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
                <Tv className="w-5 h-5 text-cyan-400" />
                <span>{selectedClient ? 'Editar Cliente' : 'Novo Cliente'}</span>
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

              {/* Qtd Contratada & Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold block">Qtd Contratada *</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                    value={clientContractedCount}
                    onChange={(e) => setClientContractedCount(Number(e.target.value))}
                  >
                    <option value={1} className="bg-slate-900 text-white">1 Unidade</option>
                    <option value={2} className="bg-slate-900 text-white">2 Unidades</option>
                    <option value={3} className="bg-slate-900 text-white">3 Unidades</option>
                    <option value={4} className="bg-slate-900 text-white">4 Unidades</option>
                    <option value={5} className="bg-slate-900 text-white">5 Unidades</option>
                    <option value={6} className="bg-slate-900 text-white">6 Unidades</option>
                    <option value={8} className="bg-slate-900 text-white">8 Unidades</option>
                    <option value={10} className="bg-slate-900 text-white">10 Unidades</option>
                    <option value={12} className="bg-slate-900 text-white">12 Unidades</option>
                    <option value={16} className="bg-slate-900 text-white">16 Unidades</option>
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

      {/* --- ADD / EDIT ACCESS MODAL --- */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[160] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <span>{selectedAccess ? 'Editar Acesso' : 'Adicionar Novo Acesso'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAccessModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="space-y-4">
              {/* Quem usa */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">Quem utiliza este acesso? *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome da pessoa, quarto, etc."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={accessUserPerson}
                  onChange={(e) => setAccessUserPerson(e.target.value)}
                />
              </div>

              {/* Qual App utiliza */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">Qual aplicativo utiliza?</label>
                <input
                  type="text"
                  placeholder="Ex: SmartUp, XCIPTV, Flix, IBO..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  value={accessAppUsed}
                  onChange={(e) => setAccessAppUsed(e.target.value)}
                />
              </div>

              {/* MEC */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-mono">MEC</label>
                <input
                  type="text"
                  placeholder="Endereço MEC/MAC"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  value={accessMec}
                  onChange={(e) => setAccessMec(e.target.value)}
                />
              </div>

              {/* KEY */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block font-mono">KEY</label>
                <input
                  type="text"
                  placeholder="Chave de ativação / Senha"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM CLIENT DELETION MODAL --- */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[180] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-800/80 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Excluir Cliente</h3>
                <p className="text-xs text-rose-300/80 font-medium">Ação irreversível</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o cliente <strong className="text-white">"{clientToDelete.name}"</strong> e todos os seus acessos vinculados?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteClient(clientToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM ACCESS DELETION MODAL --- */}
      {accessToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[180] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-800/80 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Remover Acesso</h3>
                <p className="text-xs text-rose-300/80 font-medium">Acesso individual</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Tem certeza que deseja remover o acesso de <strong className="text-white">"{accessToDelete.personName}"</strong> deste cliente?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccessToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteAccess(accessToDelete.clientId, accessToDelete.accessId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Sim, Remover Acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
