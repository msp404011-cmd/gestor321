import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Percent,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Reseller } from '../../types';
import { formatPhone, cleanPhoneForWhatsApp } from '../../services/formatters';

interface ResellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reseller: Reseller) => void;
  resellerToEdit: Reseller | null;
}

export const ResellerModal: React.FC<ResellerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resellerToEdit,
}) => {
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PJ');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(3000);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Bloqueado'>('Ativo');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (resellerToEdit) {
      setPersonType(resellerToEdit.personType || (resellerToEdit.document?.length > 14 ? 'PJ' : 'PF'));
      setName(resellerToEdit.name || '');
      setTradeName(resellerToEdit.tradeName || '');
      setDocument(resellerToEdit.document || '');
      setPhone(resellerToEdit.phone || '');
      setWhatsapp(resellerToEdit.whatsapp || '');
      setEmail(resellerToEdit.email || '');
      setAddress(resellerToEdit.address || '');
      setNeighborhood(resellerToEdit.neighborhood || '');
      setCity(resellerToEdit.city || '');
      setState(resellerToEdit.state || 'SP');
      setZipCode(resellerToEdit.zipCode || '');
      setCreditLimit(resellerToEdit.creditLimit ?? 3000);
      setDiscountPercent(resellerToEdit.discountPercent ?? 0);
      setBalance(resellerToEdit.balance ?? 0);
      setStatus(resellerToEdit.status || 'Ativo');
      setNotes(resellerToEdit.notes || '');
    } else {
      setPersonType('PJ');
      setName('');
      setTradeName('');
      setDocument('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setNeighborhood('');
      setCity('');
      setState('SP');
      setZipCode('');
      setCreditLimit(3000);
      setDiscountPercent(0);
      setBalance(0);
      setStatus('Ativo');
      setNotes('');
    }
    setErrors({});
  }, [resellerToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Nome / Razão Social é obrigatório';
    if (!phone.trim()) errs.phone = 'Telefone de contato é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formattedWhatsapp = cleanPhoneForWhatsApp(whatsapp || phone);

    const resellerData: Reseller = {
      id: resellerToEdit ? resellerToEdit.id : `res-${Date.now()}`,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      personType,
      document: document.trim(),
      phone: phone.trim(),
      whatsapp: formattedWhatsapp,
      email: email.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      status,
      creditLimit: Number(creditLimit) || 0,
      discountPercent: Number(discountPercent) || 0,
      balance: Number(balance) || 0,
      totalPurchased: resellerToEdit?.totalPurchased || 0,
      totalPaid: resellerToEdit?.totalPaid || 0,
      notes: notes.trim() || undefined,
      createdAt: resellerToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(resellerData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1328] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081023]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {resellerToEdit ? 'Editar Revendedor' : 'Cadastrar Novo Revendedor'}
              </h2>
              <p className="text-xs text-slate-400">
                {resellerToEdit
                  ? 'Atualize os dados e limite de crédito do parceiro'
                  : 'Preencha os dados do parceiro de revenda e atacado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tipo de Pessoa & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-[#070e20] border border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Pessoa
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPersonType('PJ')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    personType === 'PJ'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Pessoa Jurídica (PJ)
                </button>
                <button
                  type="button"
                  onClick={() => setPersonType('PF')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    personType === 'PF'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Pessoa Física (PF)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status do Revendedor
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0b1328] border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="Ativo">🟢 Ativo (Liberado para compras)</option>
                <option value="Inativo">⚪ Inativo (Sem movimentação)</option>
                <option value="Bloqueado">🔴 Bloqueado (Bloqueio financeiro)</option>
              </select>
            </div>
          </div>

          {/* Dados Principais */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Identificação & Razão
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {personType === 'PJ' ? 'Razão Social / Nome da Empresa *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={personType === 'PJ' ? 'Ex: TopCell Distribuidora de Acessórios LTDA' : 'Ex: João da Silva'}
                  className={`w-full px-3 py-2 bg-[#070e20] border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 ${
                    errors.name ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Fantasia / Apelido Comercial
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: TopCell Santa Ifigênia"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {personType === 'PJ' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder={personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contato & WhatsApp */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Contatos & Comunicação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={`w-full px-3 py-2 bg-[#070e20] border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 ${
                    errors.phone ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp (Para pedidos e cobrança)
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="comercial@revenda.com"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Localização & Entrega
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Endereço Completo (Rua, Número, Sala/Box)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua Santa Ifigênia, 450 - Loja 18"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Centro"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Condições Comerciais & Limite de Crédito */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Condições Comerciais & Crédito
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Limite de Crédito (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white font-bold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Limite para compras faturadas / a prazo</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Desconto Adicional de Revenda (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">%</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white font-bold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Desconto aplicado sobre tabela de revenda</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Saldo Devedor Inicial (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white font-bold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Valor em aberto que o revendedor já deve</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Observações / Instruções Especiais de Atacado
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamentos toda sexta-feira via PIX. Retira mercadorias pelo motoboy Marcos..."
              className="w-full px-3 py-2 bg-[#070e20] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#081023] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {resellerToEdit ? 'Salvar Alterações' : 'Cadastrar Revendedor'}
          </button>
        </div>
      </div>
    </div>
  );
};
