import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  User,
  CreditCard,
  Search,
  Phone,
  MessageCircle,
  Copy,
  Mail,
  Calendar,
  Building,
  MoreHorizontal,
  MapPin,
  FileText,
  Save,
  Home,
  Star,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storage';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'PESSOAIS' | 'ENDERECO' | 'PREFERENCIAS' | 'OBSERVACOES'>('PESSOAIS');

  // Form Fields
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [clientType, setClientType] = useState<'Pessoa Física' | 'Pessoa Jurídica' | 'Outro'>('Pessoa Física');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'VIP'>('Ativo');
  const [preferredContact, setPreferredContact] = useState<'WhatsApp' | 'Telefone' | 'E-mail'>('WhatsApp');
  const [creditLimit, setCreditLimit] = useState<number>(1000);
  const [allowCrediario, setAllowCrediario] = useState<boolean>(true);

  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setDocument(customerToEdit.document || '');
      setPhone(customerToEdit.phone || customerToEdit.whatsapp || '');
      setWhatsapp(customerToEdit.whatsapp || customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setBirthDate(customerToEdit.birthDate || '');
      setGender(customerToEdit.gender || '');
      setClientType(customerToEdit.clientType || 'Pessoa Física');
      setAddress(customerToEdit.address || '');
      setZipCode(customerToEdit.zipCode || '');
      setNeighborhood(customerToEdit.neighborhood || '');
      setCity(customerToEdit.city || 'São Paulo');
      setState(customerToEdit.state || 'SP');
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'Ativo');
      setCreditLimit(customerToEdit.creditLimit !== undefined ? customerToEdit.creditLimit : 1000);
      setAllowCrediario(customerToEdit.allowCrediario !== undefined ? customerToEdit.allowCrediario : true);
    } else {
      resetForm();
    }
    setError('');
    setActiveTab('PESSOAIS');
  }, [customerToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setDocument('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setBirthDate('');
    setGender('');
    setClientType('Pessoa Física');
    setAddress('');
    setZipCode('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setNotes('');
    setStatus('Ativo');
    setPreferredContact('WhatsApp');
    setCreditLimit(1000);
    setAllowCrediario(true);
  };

  if (!isOpen) return null;

  const handleUseSameNumber = () => {
    if (phone) {
      setWhatsapp(phone);
    }
  };

  const handleCnpjSearch = () => {
    const cleanDoc = document.replace(/\D/g, '');
    if (cleanDoc.length === 14) {
      // Mock CNPJ fetch
      setName('EMPRESA DE TECNOLOGIA LTDA');
      setEmail('contato@empresatec.com.br');
      setPhone('(11) 3344-5566');
      setWhatsapp('(11) 99887-6655');
      setClientType('Pessoa Jurídica');
      setCity('São Paulo');
      setState('SP');
      setAddress('Av. Paulista, 1000 - Bela Vista');
    } else {
      setError('Insira um CNPJ válido com 14 dígitos para consultar.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome completo do cliente é obrigatório.');
      setActiveTab('PESSOAIS');
      return;
    }

    // Check for duplicates in the database (ignoring the customer being edited)
    const allCustomers = StorageService.getCustomers();
    const normalizedNewName = name.trim().toLowerCase();
    const normalizedNewPhone = phone.replace(/\D/g, '');

    const duplicateNameCust = allCustomers.find(c => 
      c.id !== (customerToEdit?.id || '') && 
      c.name.trim().toLowerCase() === normalizedNewName
    );

    const duplicatePhoneCust = normalizedNewPhone ? allCustomers.find(c => 
      c.id !== (customerToEdit?.id || '') && 
      c.phone.replace(/\D/g, '') === normalizedNewPhone
    ) : null;

    if (duplicateNameCust) {
      setError(`Erro: Já existe um cliente cadastrado com o nome "${duplicateNameCust.name}"!`);
      setActiveTab('PESSOAIS');
      return;
    }

    if (duplicatePhoneCust) {
      setError(`Erro: O número de telefone "${phone}" já está cadastrado para o cliente "${duplicatePhoneCust.name}"!`);
      setActiveTab('PESSOAIS');
      return;
    }

    const customer: Customer = {
      id: customerToEdit ? customerToEdit.id : 'cust-' + Date.now(),
      name: name.trim(),
      document: document.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      address: address.trim(),
      zipCode: zipCode.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim() || 'São Paulo',
      state: state.trim() || 'SP',
      notes: notes.trim(),
      status: status,
      birthDate: birthDate,
      gender: gender,
      clientType: clientType,
      creditLimit: Number(creditLimit) || 0,
      allowCrediario: allowCrediario,
      totalSpent: customerToEdit ? (customerToEdit.totalSpent || 0) : 0,
      debtBalance: customerToEdit ? customerToEdit.debtBalance : 0,
      createdAt: customerToEdit ? customerToEdit.createdAt : new Date().toISOString(),
    };

    onSave(customer);

    if (saveAndAddAnother && !customerToEdit) {
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      resetForm();
      setActiveTab('PESSOAIS');
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl rounded-2xl border overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_40px_rgba(2,132,199,0.25)] text-white'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${
          isDark ? 'border-blue-900/60 bg-[#060e1d]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {customerToEdit ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Preencha os dados do cliente para ordens de serviço e vendas
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className={`px-4 sm:px-5 pt-4 ${isDark ? 'bg-[#081226]' : 'bg-slate-50/80'}`}>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl border ${
            isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-200/60 border-slate-300/80'
          }`}>
            {/* Tab 1: Dados Pessoais */}
            <button
              type="button"
              onClick={() => setActiveTab('PESSOAIS')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PESSOAIS'
                  ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : isDark ? 'text-slate-400 hover:text-slate-200 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <User className={`w-4 h-4 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`} />
              <span>Dados Pessoais</span>
            </button>

            {/* Tab 2: Endereço */}
            <button
              type="button"
              onClick={() => setActiveTab('ENDERECO')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'ENDERECO'
                  ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : isDark ? 'text-slate-400 hover:text-slate-200 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Home className={`w-4 h-4 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`} />
              <span>Endereço</span>
            </button>

            {/* Tab 3: Preferências */}
            <button
              type="button"
              onClick={() => setActiveTab('PREFERENCIAS')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PREFERENCIAS'
                  ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : isDark ? 'text-slate-400 hover:text-slate-200 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Preferências</span>
            </button>

            {/* Tab 4: Observações */}
            <button
              type="button"
              onClick={() => setActiveTab('OBSERVACOES')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'OBSERVACOES'
                  ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                  : isDark ? 'text-slate-400 hover:text-slate-200 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`} />
              <span>Observações</span>
            </button>
          </div>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-[#081226] overflow-y-auto max-h-[65vh]">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cliente cadastrado com sucesso! Preencha para o próximo.</span>
            </div>
          )}

          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'PESSOAIS' && (
            <div className="space-y-4">
              {/* Row 1: Nome Completo & CPF/CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* CPF ou CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    CPF ou CNPJ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full pl-10 pr-12 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCnpjSearch}
                      title="Buscar dados por CNPJ"
                      className="absolute right-1.5 p-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800/80 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: WhatsApp / Celular */}
              <div className="grid grid-cols-1 gap-4">
                {/* WhatsApp / Celular */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    WhatsApp / Celular (com DDD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        setPhone(e.target.value); // keep phone synced for backwards compatibility
                      }}
                      placeholder="Ex: (88) 99887-6655"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-semibold"
                    />
                  </div>
                  {(() => {
                    const cleanNum = whatsapp.replace(/\D/g, '');
                    if (!cleanNum || cleanNum.length < 8) return null;
                    const all = StorageService.getCustomers();
                    const owner = all.find(c => 
                      c.id !== (customerToEdit?.id || '') && 
                      (c.phone.replace(/\D/g, '') === cleanNum || c.whatsapp?.replace(/\D/g, '') === cleanNum)
                    );
                    if (!owner) return null;
                    return (
                      <div className="mt-2 p-2.5 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <span>⚠️ Este WhatsApp já está cadastrado para o cliente: <strong>{owner.name}</strong></span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 3: E-mail, Data de Nascimento & Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                    <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Sexo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="" className="bg-[#081226] text-slate-400">Selecione</option>
                      <option value="Masculino" className="bg-[#081226] text-white">Masculino</option>
                      <option value="Feminino" className="bg-[#081226] text-white">Feminino</option>
                      <option value="Outro" className="bg-[#081226] text-white">Outro</option>
                      <option value="Não Informado" className="bg-[#081226] text-white">Não Informado</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 4: Tipo de Cliente & Cidade/UF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tipo de Cliente
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#040a17] rounded-xl border border-blue-900/80">
                    <button
                      type="button"
                      onClick={() => setClientType('Pessoa Física')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        clientType === 'Pessoa Física'
                          ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Pessoa Física</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientType('Pessoa Jurídica')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        clientType === 'Pessoa Jurídica'
                          ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Pessoa Jurídica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientType('Outro')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        clientType === 'Outro'
                          ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                      <span>Outro</span>
                    </button>
                  </div>
                </div>

                {/* Cidade / UF */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cidade / UF
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full pl-10 pr-3 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="w-full px-3 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-center font-extrabold text-white uppercase focus:outline-none focus:border-cyan-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Observações iniciais */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Observações iniciais
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Prefere atendimento no WhatsApp, antes de trocar qualquer peça, ..."
                    className="w-full pl-10 pr-12 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-none"
                  />
                  <span className="absolute right-3 bottom-2 text-[10px] text-slate-500 font-mono font-semibold">
                    {notes.length}/300
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENDEREÇO */}
          {activeTab === 'ENDERECO' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CEP */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">CEP</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="00000-000"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAddress('Rua Augusta, 850');
                        setNeighborhood('Consolação');
                        setCity('São Paulo');
                        setState('SP');
                      }}
                      className="absolute right-1.5 p-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800/80 text-cyan-400 rounded-lg cursor-pointer"
                      title="Buscar CEP"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Logradouro / Rua */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Endereço / Logradouro</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, Avenida, número e complemento"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bairro */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full px-3.5 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3.5 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Estado UF */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full px-3.5 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white uppercase text-center font-bold focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERÊNCIAS */}
          {activeTab === 'PREFERENCIAS' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Canal Preferido */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Canal de Comunicação Preferido
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#040a17] rounded-xl border border-blue-900/80">
                    <button
                      type="button"
                      onClick={() => setPreferredContact('WhatsApp')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        preferredContact === 'WhatsApp'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredContact('Telefone')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        preferredContact === 'Telefone'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ligação
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredContact('E-mail')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        preferredContact === 'E-mail'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      E-mail
                    </button>
                  </div>
                </div>

                {/* Status do Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Categoria do Cliente
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Ativo" className="bg-[#081226]">Ativo (Padrão)</option>
                    <option value="VIP" className="bg-[#081226]">VIP (Atendimento Prioritário)</option>
                    <option value="Inativo" className="bg-[#081226]">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OBSERVAÇÕES */}
          {activeTab === 'OBSERVACOES' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Observações Internas da Loja / Histórico
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva detalhes relevantes sobre este cliente, preferências, descontos acordados ou histórico de atendimento..."
                  className="w-full p-3.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
              </div>
            </div>
          )}
        </form>

        {/* FOOTER MATCHING CADASL.PNG */}
        <div className="p-4 sm:p-5 border-t border-blue-900/60 bg-[#060e1d] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Checkbox */}
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
              className="px-5 py-2.5 bg-[#040a17] hover:bg-blue-950 border border-blue-900/80 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer"
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
