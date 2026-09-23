import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  CreditCard,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Building,
  Building2,
  MapPin,
  Map,
  FileText,
  Home,
  Save,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Smartphone,
  Users,
  Lightbulb,
  UserPlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storage';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
  initialName?: string;
  initialPhone?: string;
}

interface DeviceAccountItem {
  id: string;
  type: 'Gmail' | 'iCloud' | 'Outro';
  email: string;
  password: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
  initialName,
  initialPhone,
}) => {
  const { isDark } = useTheme();

  // Form Fields - Dados Pessoais & Contatos
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappAlt, setWhatsappAlt] = useState('');
  const [alternativeContactName, setAlternativeContactName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [clientType, setClientType] = useState<'Pessoa Física' | 'Pessoa Jurídica' | 'Outro'>('Pessoa Física');

  // Form Fields - Aparelho do Cliente & Contas (Gmail / iCloud / etc)
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [deviceAccounts, setDeviceAccounts] = useState<DeviceAccountItem[]>([
    { id: 'acc-1', type: 'Gmail', email: '', password: '' },
  ]);

  // Form Fields - Endereço
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Form Fields - Preferências & Crediário & Observações
  const [preferredContact, setPreferredContact] = useState<'WhatsApp' | 'Telefone' | 'E-mail'>('WhatsApp');
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'VIP'>('Ativo');
  const [creditLimit, setCreditLimit] = useState<number>(1000);
  const [allowCrediario, setAllowCrediario] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setDocument(customerToEdit.document || '');
      setPhone(customerToEdit.phone || customerToEdit.whatsapp || '');
      setWhatsapp(customerToEdit.whatsapp || customerToEdit.phone || '');
      setWhatsappAlt(customerToEdit.whatsappAlt || customerToEdit.alternativePhone || '');
      setAlternativeContactName(customerToEdit.alternativeContactName || '');

      // Load device accounts
      if (customerToEdit.deviceAccounts && customerToEdit.deviceAccounts.length > 0) {
        setDeviceAccounts(
          customerToEdit.deviceAccounts.map((acc, idx) => ({
            id: `acc-${idx}-${Date.now()}`,
            type: (acc.type as any) || 'Gmail',
            email: acc.email || '',
            password: acc.password || '',
          }))
        );
      } else {
        setDeviceAccounts([
          {
            id: 'acc-1',
            type: customerToEdit.accountType || 'Gmail',
            email: customerToEdit.email || '',
            password: customerToEdit.password || '',
          },
        ]);
      }

      setIsMobileDevice(customerToEdit.isMobileDevice !== undefined ? !!customerToEdit.isMobileDevice : true);
      setBirthDate(customerToEdit.birthDate || '');
      setGender(customerToEdit.gender || '');
      setClientType(customerToEdit.clientType || 'Pessoa Física');
      setAddress(customerToEdit.address || '');
      setZipCode(customerToEdit.zipCode || '');
      setNeighborhood(customerToEdit.neighborhood || '');
      setCity(customerToEdit.city || '');
      setState(customerToEdit.state || '');
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'Ativo');
      setPreferredContact(customerToEdit.preferredContact || 'WhatsApp');
      setCreditLimit(customerToEdit.creditLimit !== undefined ? customerToEdit.creditLimit : 1000);
      setAllowCrediario(customerToEdit.allowCrediario !== undefined ? customerToEdit.allowCrediario : false);
    } else {
      resetForm();
      if (initialName) {
        setName(initialName);
      }
      if (initialPhone) {
        setWhatsapp(initialPhone);
        setPhone(initialPhone);
      }
    }
    setError('');
  }, [customerToEdit, isOpen, initialName, initialPhone]);

  const resetForm = () => {
    setName('');
    setDocument('');
    setPhone('');
    setWhatsapp('');
    setWhatsappAlt('');
    setAlternativeContactName('');
    setDeviceAccounts([{ id: 'acc-1', type: 'Gmail', email: '', password: '' }]);
    setIsMobileDevice(true);
    setBirthDate('');
    setGender('');
    setClientType('Pessoa Física');
    setAddress('');
    setZipCode('');
    setNeighborhood('');
    setCity('');
    setState('');
    setNotes('');
    setStatus('Ativo');
    setPreferredContact('WhatsApp');
    setCreditLimit(1000);
    setAllowCrediario(false);
  };

  if (!isOpen) return null;

  const handleCnpjSearch = () => {
    const cleanDoc = document.replace(/\D/g, '');
    if (cleanDoc.length === 14) {
      setName('EMPRESA DE TECNOLOGIA LTDA');
      setPhone('(11) 3344-5566');
      setWhatsapp('(11) 99887-6655');
      setClientType('Pessoa Jurídica');
      setCity('São Paulo');
      setState('SP');
      setAddress('Av. Paulista, 1000 - Bela Vista');
      setNeighborhood('Bela Vista');
    } else {
      setError('Insira um CNPJ válido com 14 dígitos para consultar.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleCepSearch = async () => {
    const cleanCep = zipCode.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setAddress(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
          return;
        }
      } catch {
        // Silently catch fetch errors
      }
    }
  };

  const handleAddDeviceAccount = () => {
    setDeviceAccounts((prev) => [
      ...prev,
      { id: `acc-${Date.now()}`, type: 'Gmail', email: '', password: '' },
    ]);
  };

  const handleRemoveDeviceAccount = (id: string) => {
    if (deviceAccounts.length === 1) {
      setDeviceAccounts([{ id: 'acc-1', type: 'Gmail', email: '', password: '' }]);
      return;
    }
    setDeviceAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleUpdateDeviceAccount = (id: string, field: keyof DeviceAccountItem, value: any) => {
    setDeviceAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome completo do cliente é obrigatório.');
      return;
    }

    // Check for duplicates in database
    const allCustomers = StorageService.getCustomers();
    const normalizedNewName = name.trim().toLowerCase();
    const normalizedNewPhone = (whatsapp || phone).replace(/\D/g, '');

    const duplicateNameCust = allCustomers.find(
      (c) =>
        c.id !== (customerToEdit?.id || '') &&
        c.name.trim().toLowerCase() === normalizedNewName
    );

    const duplicatePhoneCust = normalizedNewPhone
      ? allCustomers.find(
          (c) =>
            c.id !== (customerToEdit?.id || '') &&
            (c.phone.replace(/\D/g, '') === normalizedNewPhone ||
              (c.whatsapp && c.whatsapp.replace(/\D/g, '') === normalizedNewPhone))
        )
      : null;

    if (duplicateNameCust) {
      setError(`Erro: Já existe um cliente cadastrado com o nome "${duplicateNameCust.name}"!`);
      return;
    }

    if (duplicatePhoneCust) {
      setError(
        `Erro: O número de WhatsApp/Telefone "${whatsapp || phone}" já está cadastrado para o cliente "${
          duplicatePhoneCust.name
        }"!`
      );
      return;
    }

    const primaryAccount = deviceAccounts[0] || { type: 'Gmail', email: '', password: '' };

    const customer: Customer = {
      id: customerToEdit ? customerToEdit.id : 'cust-' + Date.now(),
      name: name.trim(),
      document: document.trim(),
      phone: (whatsapp.trim() || phone.trim()),
      whatsapp: (whatsapp.trim() || phone.trim()),
      whatsappAlt: whatsappAlt.trim(),
      alternativePhone: whatsappAlt.trim(),
      alternativeContactName: alternativeContactName.trim(),
      preferredContact: preferredContact,
      email: primaryAccount.email.trim(),
      password: primaryAccount.password.trim(),
      isMobileDevice: isMobileDevice,
      accountType: primaryAccount.type,
      deviceAccounts: deviceAccounts.map((acc) => ({
        type: acc.type,
        email: acc.email.trim(),
        password: acc.password.trim(),
      })),
      address: address.trim(),
      zipCode: zipCode.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim(),
      notes: notes.trim(),
      status: status,
      birthDate: birthDate,
      gender: gender,
      clientType: clientType,
      creditLimit: Number(creditLimit) || 0,
      allowCrediario: allowCrediario,
      totalSpent: customerToEdit ? customerToEdit.totalSpent || 0 : 0,
      debtBalance: customerToEdit ? customerToEdit.debtBalance : 0,
      createdAt: customerToEdit ? customerToEdit.createdAt : new Date().toISOString(),
    };

    onSave(customer);

    if (saveAndAddAnother && !customerToEdit) {
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      resetForm();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-1 sm:p-2 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1360px] max-h-[98vh] rounded-3xl border-2 border-blue-600/50 shadow-[0_0_50px_rgba(37,99,235,0.3)] bg-[#040a18] text-white flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-3.5 py-2 sm:px-5 sm:py-2.5 border-b border-blue-900/50 shrink-0 bg-[#061026]">
          {/* Left Title & Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.6)] shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  {customerToEdit ? 'Editar Cadastro do Cliente' : 'Novo Cadastro de Cliente'}
                </h2>
                <span className="px-2.5 py-0.2 rounded-full text-[10px] font-black bg-[#07193b] text-cyan-400 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  Formulário Único
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                Todos os dados pessoais, contatos, contas do aparelho e condições em uma só tela
              </p>
            </div>
          </div>

          {/* Right Tip Card & Close Button */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 bg-[#0b162c] border border-amber-500/40 rounded-xl px-2.5 py-1 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Lightbulb className="w-3 h-3 fill-amber-400/40" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-300 leading-tight">
                  Cliente bem cadastrado
                </p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Facilita o atendimento e controle das ordens de serviço
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl border border-slate-700/80 bg-[#07132a] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Fechar (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mx-3 mt-1.5 p-2 bg-rose-950/90 text-rose-300 border border-rose-500/60 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in shrink-0">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-400 hover:text-white ml-2"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="mx-3 mt-1.5 p-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cliente salvo com sucesso! Pronto para cadastrar o próximo.</span>
          </div>
        )}

        {/* FORM CONTENT BODY - ZERO SCROLL PROPORTIONAL 2 COLUMNS */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 p-2 sm:p-2.5 bg-[#030814] flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2 items-stretch overflow-hidden">
            {/* ===================== LEFT COLUMN ===================== */}
            <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
              {/* CARD 1: DADOS DO CLIENTE & CONTATOS (Aurora Blue Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35),0_0_50px_rgba(6,182,212,0.15)] bg-gradient-to-b from-[#08152e]/95 to-[#040c1e]/95 space-y-1.5 shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      DADOS DO CLIENTE & DOCUMENTO
                    </h3>
                  </div>

                  {/* Segmented Buttons: PF | PJ | Outro */}
                  <div className="flex items-center bg-[#040c1e] p-0.5 rounded-xl border border-slate-800 gap-0.5 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setClientType('Pessoa Física')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                        clientType === 'Pessoa Física'
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      PF
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('Pessoa Jurídica')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                        clientType === 'Pessoa Jurídica'
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      PJ
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('Outro')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                        clientType === 'Outro'
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Outro
                    </button>
                  </div>
                </div>

                {/* Grid: Nome Completo & CPF/CNPJ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Nome Completo / Razão Social <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo de Oliveira"
                        className="w-full pl-8 pr-2.5 py-1 bg-[#040c1e] border border-blue-900/80 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all shadow-inner font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      {clientType === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF ou CNPJ'}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <CreditCard className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full pl-7 pr-7 py-1 bg-[#040c1e] border border-slate-800 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-mono shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={handleCnpjSearch}
                        className="absolute right-1 p-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors cursor-pointer"
                        title="Consultar CNPJ/CPF"
                      >
                        <Search className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: APARELHO DO CLIENTE & CONTAS (Aurora Purple Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35),0_0_50px_rgba(168,85,247,0.15)] bg-gradient-to-b from-[#140722]/95 to-[#07010d]/95 flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                      <Smartphone className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      APARELHO & CONTAS DO CLIENTE
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isMobileDevice}
                        onChange={(e) => setIsMobileDevice(e.target.checked)}
                        className="w-3 h-3 rounded bg-[#040108] border-purple-500 text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                      />
                      <span>Dispositivo Móvel</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddDeviceAccount}
                      className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-purple-600/80 hover:bg-purple-500 text-white flex items-center gap-0.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ Adicionar Conta</span>
                    </button>
                  </div>
                </div>

                {/* Accounts List */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5">
                  {deviceAccounts.map((acc, index) => (
                    <div
                      key={acc.id}
                      className="p-1.5 rounded-xl bg-[#0a0212] border border-purple-900/50 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black uppercase text-purple-300">
                            CONTA {index + 1}:
                          </span>
                          <div className="flex items-center bg-[#040108] p-0.5 rounded-lg border border-slate-800 gap-0.5 text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleUpdateDeviceAccount(acc.id, 'type', 'Gmail')}
                              className={`px-2 py-0.2 rounded transition-all cursor-pointer ${
                                acc.type === 'Gmail'
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Gmail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateDeviceAccount(acc.id, 'type', 'iCloud')}
                              className={`px-2 py-0.2 rounded transition-all cursor-pointer ${
                                acc.type === 'iCloud'
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              iCloud
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateDeviceAccount(acc.id, 'type', 'Outro')}
                              className={`px-2 py-0.2 rounded transition-all cursor-pointer ${
                                acc.type === 'Outro'
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Outro
                            </button>
                          </div>
                        </div>

                        {deviceAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDeviceAccount(acc.id)}
                            className="p-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Remover esta conta"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <div>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                              <Mail className="w-3 h-3" />
                            </span>
                            <input
                              type="text"
                              value={acc.email}
                              onChange={(e) => handleUpdateDeviceAccount(acc.id, 'email', e.target.value)}
                              placeholder={`E-mail / Usuário (${acc.type})...`}
                              className="w-full pl-7 pr-2 py-1 bg-[#040108] border border-purple-500/40 focus:border-purple-400 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                            <input
                              type="text"
                              value={acc.password}
                              onChange={(e) => handleUpdateDeviceAccount(acc.id, 'password', e.target.value)}
                              placeholder="Senha de acesso / PIN..."
                              className="w-full pl-7 pr-2 py-1 bg-[#040108] border border-purple-500/40 focus:border-purple-400 rounded-lg text-xs text-purple-200 placeholder-slate-500 font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: CONTATOS DE WHATSAPP / CELULAR (Aurora Emerald Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35),0_0_50px_rgba(16,185,129,0.15)] bg-gradient-to-b from-[#051814]/95 to-[#020705]/95 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-600/30 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0">
                      <MessageCircle className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      CONTATOS DE WHATSAPP / CELULAR
                    </h3>
                  </div>

                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#041d18] text-emerald-300 border border-emerald-500/50">
                    Notificações e Recados
                  </span>
                </div>

                {/* WhatsApp Principal & Alternativo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      WhatsApp Principal <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => {
                          setWhatsapp(e.target.value);
                          if (!phone) setPhone(e.target.value);
                        }}
                        placeholder="(88) 99887-6655"
                        className="w-full pl-8 pr-2 py-1 bg-[#020a08] border border-emerald-500/50 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Nome Contato (Recado)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={alternativeContactName}
                        onChange={(e) => setAlternativeContactName(e.target.value)}
                        placeholder="Ex: Maria (Esposa)"
                        className="w-full pl-7 pr-2 py-1 bg-[#020a08] border border-slate-800 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      WhatsApp Alternativo
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={whatsappAlt}
                        onChange={(e) => setWhatsappAlt(e.target.value)}
                        placeholder="(88) 99877-1122"
                        className="w-full pl-7 pr-2 py-1 bg-[#020a08] border border-slate-800 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW: Data de Nascimento & Sexo/Gênero */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                {/* Data de Nascimento (Amber Glow) */}
                <div className="p-2 rounded-2xl border-2 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-[#0e0902] space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-amber-600/30 border border-amber-400/60 flex items-center justify-center text-amber-400 shrink-0">
                      <Calendar className="w-2.5 h-2.5" />
                    </div>
                    <label className="text-[9px] font-bold uppercase text-slate-300">
                      Nascimento
                    </label>
                  </div>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-2 py-0.5 bg-[#050300] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>

                {/* Sexo / Gênero (Rose Glow) */}
                <div className="p-2 rounded-2xl border-2 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)] bg-[#12040b] space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-rose-600/30 border border-rose-400/60 flex items-center justify-center text-rose-400 shrink-0">
                      <User className="w-2.5 h-2.5" />
                    </div>
                    <label className="text-[9px] font-bold uppercase text-slate-300">
                      Sexo / Gênero
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-0.5 bg-[#060104] border border-slate-800 focus:border-rose-400 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer appearance-none pr-6"
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                      <option value="Não informar">Não informar</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ===================== RIGHT COLUMN ===================== */}
            <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden">
              {/* CARD 4: ENDEREÇO COMPLETO (Aurora Amber Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.35),0_0_50px_rgba(234,179,8,0.15)] bg-gradient-to-b from-[#181105]/95 to-[#070501]/95 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-amber-600/30 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      ENDEREÇO COMPLETO
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                    <Map className="w-3 h-3 text-cyan-400" />
                    <span>Localização e entrega</span>
                  </div>
                </div>

                {/* Row 1: CEP & Logradouro / Rua e Número */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      CEP
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <FileText className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="w-full pl-7 pr-7 py-1 bg-[#080502] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCepSearch}
                        className="absolute right-1 p-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors cursor-pointer"
                        title="Buscar CEP"
                      >
                        <Search className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Logradouro / Rua e Número
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <Home className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: Rua Cel. Silva, 120 - Apto 3"
                        className="w-full pl-7 pr-2 py-1 bg-[#080502] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Bairro, Cidade, UF */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Bairro
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full pl-7 pr-2 py-1 bg-[#080502] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      Cidade
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                        className="w-full pl-7 pr-2 py-1 bg-[#080502] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">
                      UF
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="UF"
                      className="w-full px-1 py-1 bg-[#080502] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white text-center uppercase font-bold focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* ROW: CANAL DE CONTATO PREFERIDO & CATEGORIA DO CLIENTE */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                {/* CANAL DE CONTATO PREFERIDO (Teal/Cyan Glow) */}
                <div className="p-2 rounded-2xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-[#041216] space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-cyan-600/30 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shrink-0">
                      <MessageCircle className="w-2.5 h-2.5" />
                    </div>
                    <label className="text-[9px] font-bold uppercase text-slate-300">
                      CONTATO PREFERIDO
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setPreferredContact('WhatsApp')}
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        preferredContact === 'WhatsApp'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#020a0d] border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredContact('Telefone')}
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        preferredContact === 'Telefone'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-[#020a0d] border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Ligação</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredContact('E-mail')}
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        preferredContact === 'E-mail'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-[#020a0d] border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>E-mail</span>
                    </button>
                  </div>
                </div>

                {/* CATEGORIA DO CLIENTE (Purple Glow) */}
                <div className="p-2 rounded-2xl border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] bg-[#12071f] space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 shrink-0">
                      <Users className="w-2.5 h-2.5" />
                    </div>
                    <label className="text-[9px] font-bold uppercase text-slate-300">
                      CATEGORIA DO CLIENTE
                    </label>
                  </div>

                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-2 py-0.5 bg-[#07020d] border border-purple-500/40 rounded-xl text-xs text-white font-bold focus:outline-hidden cursor-pointer appearance-none pr-6"
                    >
                      <option value="Ativo">👑 Ativo (Padrão)</option>
                      <option value="VIP">⭐ VIP / Especial</option>
                      <option value="Inativo">⚠️ Inativo</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-purple-300 absolute right-2 top-1.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* CARD 5: PERMITIR VENDAS A PRAZO / CREDIÁRIO (Rose Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] bg-[#14050d] space-y-1 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-rose-600/30 border border-rose-400/60 flex items-center justify-center text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)] shrink-0">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      VENDAS A PRAZO / CREDIÁRIO
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400">Limite R$:</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 bg-[#090206] border border-rose-500/50 rounded-lg text-xs font-black text-rose-300 text-right font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowCrediario}
                    onChange={(e) => setAllowCrediario(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#090206] border-rose-500 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                  />
                  <span>Fiado autorizado para este cliente</span>
                </label>
              </div>

              {/* CARD 6: OBSERVAÇÕES INTERNAS / PREFERÊNCIAS (Blue Glow) */}
              <div className="p-2.5 rounded-2xl border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-[#060e22] flex-1 min-h-0 flex flex-col space-y-1">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black tracking-wide leading-none text-white">
                      OBSERVAÇÕES INTERNAS / PREFERÊNCIAS
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    {notes.length}/250
                  </span>
                </div>

                <textarea
                  rows={2}
                  maxLength={250}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Prefere contato após 14h, cliente de confiança, detalhes de cobrança..."
                  className="w-full flex-1 p-2 bg-[#030712] border border-blue-900/60 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none leading-tight transition-colors shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM FOOTER BAR */}
          <div className="pt-2 mt-2 border-t border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#040a18] shrink-0">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAndAddAnother}
                onChange={(e) => setSaveAndAddAnother(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#040c1e] border-slate-700 text-blue-500 cursor-pointer accent-blue-500"
              />
              <span>Salvar e já cadastrar outro cliente</span>
            </label>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl border border-slate-700 bg-[#08152e] hover:bg-[#0c1e40] text-slate-300 hover:text-white font-black text-xs transition-colors cursor-pointer"
              >
                ✕ Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{customerToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
