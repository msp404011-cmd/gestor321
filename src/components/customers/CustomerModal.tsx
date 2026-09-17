import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  User,
  CreditCard,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Building,
  MoreHorizontal,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
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
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [clientType, setClientType] = useState<'Pessoa Física' | 'Pessoa Jurídica' | 'Outro'>('Pessoa Física');

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
  const [password, setPassword] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [accountType, setAccountType] = useState<'Gmail' | 'iCloud' | 'Outro'>('Gmail');
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
      setEmail(customerToEdit.email || '');
      setPassword(customerToEdit.password || '');
      setIsMobileDevice(!!customerToEdit.isMobileDevice);
      setAccountType(customerToEdit.accountType || 'Gmail');
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
    setEmail('');
    setPassword('');
    setIsMobileDevice(false);
    setAccountType('Gmail');
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
      setEmail('contato@empresatec.com.br');
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
      email: email.trim(),
      password: password.trim(),
      isMobileDevice: isMobileDevice,
      accountType: accountType,
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
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl rounded-2xl border flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_40px_rgba(2,132,199,0.25)] text-white'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className={`flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b shrink-0 ${
            isDark ? 'border-blue-900/60 bg-[#060e1d]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-base sm:text-lg font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {customerToEdit ? 'Editar Cadastro do Cliente' : 'Novo Cadastro de Cliente'}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                  Formulário Único
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Todos os dados pessoais, contatos de WhatsApp, endereço e condições em uma só tela
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-blue-900/60 bg-[#040a17] text-slate-400 hover:text-white hover:border-blue-700'
                : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shrink-0">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successToast && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cliente salvo com sucesso! Preencha para cadastrar o próximo.</span>
          </div>
        )}

        {/* UNIFIED FORM BODY - ALL DATA VISIBLE IN BALANCED 2-COLUMN GRID */}
        <form
          onSubmit={handleSubmit}
          className={`p-3.5 sm:p-4 space-y-3.5 ${
            isDark ? 'bg-[#081226]' : 'bg-slate-50/50'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* ================= COLUNA 1: IDENTIFICAÇÃO E CONTATOS ================= */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#060e1d] border-blue-900/60' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Dados do Cliente & Contatos
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(['Pessoa Física', 'Pessoa Jurídica', 'Outro'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClientType(type)}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        clientType === type
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-white bg-[#040a17]'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      {type === 'Pessoa Física' ? 'PF' : type === 'Pessoa Jurídica' ? 'PJ' : 'Outro'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nome Completo / Razão Social <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full pl-9 pr-3 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* CPF / CNPJ e E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* CPF ou CNPJ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    CPF ou CNPJ
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full pl-9 pr-8 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCnpjSearch}
                      title="Buscar dados por CNPJ"
                      className="absolute right-1 p-1 bg-blue-950 hover:bg-blue-900 text-cyan-400 rounded transition-colors cursor-pointer"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* E-mail & Senha & Conta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      E-mail do Cliente
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Senha (Banco / Conta)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha de acesso/conta"
                        className="w-full pl-9 pr-3 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Opções de Dispositivo Móvel e Tipo de Conta */}
                <div className="pt-1 flex flex-wrap items-center gap-4 bg-[#060e1d] p-2.5 rounded-xl border border-blue-900/40">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isMobileDevice}
                      onChange={(e) => setIsMobileDevice(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-blue-900 bg-[#040a17] text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-200">É do Celular (Dispositivo Móvel)</span>
                  </label>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo:</span>
                    <div className="flex bg-[#040a17] rounded-lg p-0.5 border border-blue-900/80">
                      {(['Gmail', 'iCloud', 'Outro'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAccountType(type)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            accountType === type
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO ESPECIAL DE WHATSAPP: PRINCIPAL + ALTERNATIVO COM NOME */}
              <div className="p-2.5 rounded-xl bg-[#040a17]/90 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 uppercase tracking-wide">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Contatos de WhatsApp / Celular</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Notificações e Recados</span>
                </div>

                {/* WhatsApp Principal */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    WhatsApp Principal (com DDD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        setPhone(e.target.value);
                      }}
                      placeholder="Ex: (88) 99887-6655"
                      className="w-full pl-9 pr-3 py-1.5 bg-[#060e1d] border border-emerald-500/50 rounded-lg text-xs text-emerald-300 font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all font-mono"
                    />
                  </div>

                  {/* Verificação em tempo real de WhatsApp duplicado */}
                  {(() => {
                    const cleanNum = whatsapp.replace(/\D/g, '');
                    if (!cleanNum || cleanNum.length < 8) return null;
                    const all = StorageService.getCustomers();
                    const owner = all.find(
                      (c) =>
                        c.id !== (customerToEdit?.id || '') &&
                        (c.phone.replace(/\D/g, '') === cleanNum ||
                          c.whatsapp?.replace(/\D/g, '') === cleanNum)
                    );
                    if (!owner) return null;
                    return (
                      <div className="mt-1.5 p-1.5 bg-amber-950/90 border border-amber-500/60 rounded-lg text-amber-300 text-[10px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                        <span>⚠️ Este WhatsApp já pertence ao cliente: <strong>{owner.name}</strong></span>
                      </div>
                    );
                  })()}
                </div>

                {/* Nome do Contato (Recado) + WhatsApp Alternativo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                  {/* Nome do Contato Alternativo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Nome do Contato (Recado)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={alternativeContactName}
                        onChange={(e) => setAlternativeContactName(e.target.value)}
                        placeholder="Ex: Maria (Esposa) / Trabalho"
                        className="w-full px-3 py-1.5 bg-[#060e1d] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Alternativo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>WhatsApp Alternativo (com DDD)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={whatsappAlt}
                        onChange={(e) => setWhatsappAlt(e.target.value)}
                        placeholder="Ex: (88) 98877-1122"
                        className="w-full px-3 py-1.5 bg-[#060e1d] border border-blue-900/80 rounded-lg text-xs text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data de Nascimento & Sexo */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="w-full pl-9 pr-3 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Sexo / Gênero
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer pr-7"
                    >
                      <option value="" className="bg-[#081226] text-slate-400">Selecione</option>
                      <option value="Masculino" className="bg-[#081226] text-white">Masculino</option>
                      <option value="Feminino" className="bg-[#081226] text-white">Feminino</option>
                      <option value="Outro" className="bg-[#081226] text-white">Outro</option>
                      <option value="Não Informado" className="bg-[#081226] text-white">Não Informado</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= COLUNA 2: ENDEREÇO, PREFERÊNCIAS, CREDIÁRIO & OBSERVAÇÕES ================= */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#060e1d] border-blue-900/60' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Seção Endereço */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Endereço Completo
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Localização e entrega</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* CEP */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">CEP</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="w-full pl-2.5 pr-7 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCepSearch}
                        className="absolute right-1 p-1 bg-blue-950 hover:bg-blue-900 text-cyan-400 rounded cursor-pointer"
                        title="Buscar CEP"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Endereço / Rua */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Logradouro / Rua e Número
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Rua Cel. Silva, 120 - Apto 3"
                      className="w-full px-2.5 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Bairro */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-2.5 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder=""
                      className="w-full px-2.5 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  {/* Estado (UF) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder=""
                      className="w-full px-2 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-center font-extrabold text-white uppercase focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Preferências & Crediário */}
              <div className="pt-2 border-t border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Canal Preferido & Categoria */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Canal de Contato Preferido
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#040a17] rounded-lg border border-blue-900/80">
                    {(['WhatsApp', 'Telefone', 'E-mail'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setPreferredContact(ch)}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          preferredContact === ch
                            ? ch === 'WhatsApp'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {ch === 'Telefone' ? 'Ligação' : ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status / Categoria */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Categoria do Cliente
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer pr-7 font-semibold"
                    >
                      <option value="Ativo" className="bg-[#081226]">Ativo (Padrão)</option>
                      <option value="VIP" className="bg-[#081226]">VIP (Atendimento Prioritário)</option>
                      <option value="Inativo" className="bg-[#081226]">Inativo</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Limite de Crediário / A Prazo */}
              <div className="p-2 rounded-xl bg-[#040a17]/90 border border-blue-900/80 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowCrediario}
                    onChange={(e) => setAllowCrediario(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-blue-900 bg-[#060e1d] text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block leading-tight">
                      Permitir Vendas a Prazo / Crediário
                    </span>
                    <span className="text-[9px] text-slate-400">Fiado autorizado para este cliente</span>
                  </div>
                </label>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">Limite R$:</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    disabled={!allowCrediario}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-[#060e1d] border border-blue-800 rounded-lg text-xs font-bold text-cyan-300 text-right focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Observações Internas */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Observações Internas / Preferências</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{notes.length}/250</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Prefere contato após 14h, cliente de confiança, detalhes de cobrança..."
                  className="w-full px-2.5 py-1.5 bg-[#040a17] border border-blue-900/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER - COMPACT & CLEAN */}
        <div
          className={`px-4 py-3 sm:px-5 sm:py-3.5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'border-blue-900/60 bg-[#060e1d]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {/* Left: Salvar e cadastrar outro */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 font-semibold select-none">
            <input
              type="checkbox"
              checked={saveAndAddAnother}
              onChange={(e) => setSaveAndAddAnother(e.target.checked)}
              className="w-4 h-4 rounded border-blue-900 bg-[#040a17] text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Salvar e já cadastrar outro cliente</span>
          </label>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{customerToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
