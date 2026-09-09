import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  User,
  Search,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Package,
  FileText,
  Camera,
  Barcode,
  Tag,
  Palette,
  QrCode,
  Save,
  CheckCircle2,
  ChevronDown,
  Info,
  Sparkles,
  Laptop,
  Monitor,
  Tablet as TabletIcon,
  Gamepad2,
  Boxes,
} from 'lucide-react';
import { Device, DeviceType, Customer } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
  deviceToEdit?: Device | null;
  initialCustomerId?: string;
  onOpenNewCustomer?: () => void;
}

const COMMON_BRANDS = ['Apple', 'Samsung', 'Dell', 'Xiaomi', 'Sony', 'Motorola', 'Asus', 'Lenovo', 'LG', 'HP', 'Acer', 'Outra'];

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deviceToEdit,
  initialCustomerId,
  onOpenNewCustomer,
}) => {
  const { isDark } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Steps state
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form Fields
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<DeviceType>('Smartphone');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [passwordPin, setPasswordPin] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [accessoriesDelivered, setAccessoriesDelivered] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState<string | null>(null);

  // Quick New Customer Modal inside DeviceModal
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerDoc, setQuickCustomerDoc] = useState('');

  const [error, setError] = useState('');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const [customDeviceTypes, setCustomDeviceTypes] = useState(() => StorageService.getCustomDeviceTypes());

  useEffect(() => {
    const loadedCustomers = StorageService.getCustomers();
    setCustomers(loadedCustomers);
    setCustomDeviceTypes(StorageService.getCustomDeviceTypes());

    if (deviceToEdit) {
      setCustomerId(deviceToEdit.customerId);
      setType(deviceToEdit.type);
      setBrand(deviceToEdit.brand || 'Apple');
      setModel(deviceToEdit.model || '');
      setImei(deviceToEdit.imei || '');
      setSerialNumber(deviceToEdit.serialNumber || '');
      setColor(deviceToEdit.color || '');
      setPhysicalCondition(deviceToEdit.physicalCondition || '');
      setPasswordPin(deviceToEdit.passwordPin || '');
      setAccessoriesDelivered(deviceToEdit.accessoriesDelivered || '');
      setNotes(deviceToEdit.notes || '');
      setPhotoUrl(deviceToEdit.photoUrl || '');
      setUploadedPhotoPreview(deviceToEdit.photoUrl || null);
    } else {
      setCustomerId(initialCustomerId || '');
      setType('Smartphone');
      setBrand('');
      setModel('');
      setImei('');
      setSerialNumber('');
      setColor('');
      setPhysicalCondition('');
      setPasswordPin('');
      setAccessoriesDelivered('');
      setNotes('');
      setPhotoUrl('');
      setUploadedPhotoPreview(null);
    }
    setError('');
    setActiveStep(1);
  }, [deviceToEdit, initialCustomerId, isOpen]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerName.trim() || !quickCustomerPhone.trim()) {
      return;
    }

    const allCustomers = StorageService.getCustomers();
    const normalizedNewName = quickCustomerName.trim().toLowerCase();
    const normalizedNewPhone = quickCustomerPhone.replace(/\D/g, '');

    const duplicateNameCust = allCustomers.find(c => 
      c.name.trim().toLowerCase() === normalizedNewName
    );

    const duplicatePhoneCust = normalizedNewPhone ? allCustomers.find(c => 
      c.phone.replace(/\D/g, '') === normalizedNewPhone
    ) : null;

    if (duplicateNameCust) {
      alert(`Já existe um cliente cadastrado com o nome "${duplicateNameCust.name}"!`);
      return;
    }

    if (duplicatePhoneCust) {
      alert(`O número de telefone "${quickCustomerPhone}" já está cadastrado para o cliente "${duplicatePhoneCust.name}"!`);
      return;
    }

    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      name: quickCustomerName.trim(),
      phone: quickCustomerPhone.trim(),
      whatsapp: quickCustomerPhone.trim(),
      document: quickCustomerDoc.trim(),
      email: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      createdAt: new Date().toISOString(),
      status: 'Ativo',
    };

    StorageService.saveCustomer(newCustomer);
    setCustomers((prev) => [newCustomer, ...prev]);
    setCustomerId(newCustomer.id);
    setShowQuickCustomer(false);
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setQuickCustomerDoc('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedPhotoPreview(result);
        setPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBarcodeScan = () => {
    // Mock barcode generator
    const mockImei = '35' + Math.floor(1000000000000 + Math.random() * 9000000000000);
    setImei(mockImei);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      setError('Por favor, selecione ou cadastre o cliente proprietário do aparelho.');
      setActiveStep(1);
      return;
    }

    if (!brand.trim() || !model.trim()) {
      setError('Marca e Modelo do equipamento são obrigatórios.');
      setActiveStep(2);
      return;
    }

    const device: Device = {
      id: deviceToEdit ? deviceToEdit.id : 'dev-' + Date.now(),
      customerId,
      customerName: selectedCustomer?.name || 'Cliente',
      type,
      brand: brand.trim(),
      model: model.trim(),
      status: deviceToEdit?.status || 'Em assistência',
      imei: imei.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      color: color.trim(),
      physicalCondition: physicalCondition.trim(),
      passwordPin: passwordPin.trim() || undefined,
      accessoriesDelivered: accessoriesDelivered.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl: uploadedPhotoPreview || photoUrl.trim() || undefined,
      createdAt: deviceToEdit ? deviceToEdit.createdAt : new Date().toISOString(),
    };

    onSave(device);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-2xl border overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_50px_rgba(2,132,199,0.3)] text-white'
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
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {deviceToEdit ? 'Editar Aparelho' : 'Cadastrar Novo Aparelho'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Vincule o equipamento a um cliente com especificações completas
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

        {/* STEP TRACKER BAR */}
        <div className={`px-5 py-3 border-b ${isDark ? 'bg-[#081226] border-blue-900/40' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between max-w-2xl mx-auto text-xs">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  activeStep === 1
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                    : 'bg-[#040a17] text-slate-400 border border-blue-900'
                }`}
              >
                1
              </div>
              <span
                className={`font-bold transition-colors ${
                  activeStep === 1 ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Cliente
              </span>
            </button>

            <div className="flex-1 h-px bg-blue-900/60 mx-3" />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  activeStep === 2
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                    : 'bg-[#040a17] text-slate-400 border border-blue-900'
                }`}
              >
                2
              </div>
              <span
                className={`font-bold transition-colors ${
                  activeStep === 2 ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Dados do Aparelho
              </span>
            </button>

            <div className="flex-1 h-px bg-blue-900/60 mx-3" />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  activeStep === 3
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                    : 'bg-[#040a17] text-slate-400 border border-blue-900'
                }`}
              >
                3
              </div>
              <span
                className={`font-bold transition-colors ${
                  activeStep === 3 ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Acessórios e Estado
              </span>
            </button>

            <div className="flex-1 h-px bg-blue-900/60 mx-3" />

            {/* Step 4 */}
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  activeStep === 4
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                    : 'bg-[#040a17] text-slate-400 border border-blue-900'
                }`}
              >
                4
              </div>
              <span
                className={`font-bold transition-colors ${
                  activeStep === 4 ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Observações
              </span>
            </button>
          </div>
        </div>

        {/* FORM CONTENT BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-[#081226] overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: CLIENTE PROPRIETÁRIO MATCHING MM.PNG */}
          <div className="p-4 bg-[#09152a] border border-blue-900/80 rounded-2xl shadow-[0_0_20px_rgba(2,132,199,0.1)] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1">
                    <span>Cliente Proprietário</span>
                    <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selecione um cliente já cadastrado ou cadastre um novo.
                  </p>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className="px-3 py-1.5 bg-[#040a17] hover:bg-blue-950 border border-blue-900/80 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Ver detalhes
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenNewCustomer) {
                      onOpenNewCustomer();
                    } else {
                      setShowQuickCustomer(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Search/Select Field */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="" className="bg-[#081226] text-slate-400">
                  Digite o nome, CPF, WhatsApp ou e-mail do cliente...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#081226] text-white">
                    {c.name} {c.whatsapp || c.phone ? `(${c.whatsapp || c.phone})` : ''} {c.document ? `- CPF/CNPJ: ${c.document}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Selected Customer Details Drawer */}
            {selectedCustomer && showCustomerDetails && (
              <div className="p-3 bg-[#040a17] border border-blue-900/60 rounded-xl text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in">
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">NOME</span>
                  <span className="font-bold text-white">{selectedCustomer.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">WHATSAPP</span>
                  <span className="font-bold text-cyan-400">{selectedCustomer.whatsapp || selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">DOCUMENTO</span>
                  <span className="font-bold text-slate-200">{selectedCustomer.document || 'Não informado'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: DADOS DO APARELHO MATCHING MM.PNG */}
          <div className="p-4 bg-[#09152a] border border-blue-900/80 rounded-2xl shadow-[0_0_20px_rgba(2,132,199,0.1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dados do Aparelho</h3>
                <p className="text-[11px] text-slate-400">Informe as principais informações do equipamento.</p>
              </div>
            </div>

            {/* Row 1: Tipo, Marca & Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tipo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DeviceType)}
                    className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {customDeviceTypes.map((dt) => (
                      <option key={dt.id} value={dt.name} className="bg-[#081226]">
                        {dt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Marca <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="" className="bg-[#081226]">Selecione a marca</option>
                    {COMMON_BRANDS.map((b) => (
                      <option key={b} value={b} className="bg-[#081226]">
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Modelo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Selecione ou digite o modelo"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: IMEI, Nº de Série & Cor/Acabamento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* IMEI */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">IMEI (Celular)</label>
                <div className="relative flex items-center">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="Digite o IMEI"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeScan}
                    title="Escanear ou gerar código de barras"
                    className="absolute right-1.5 p-1.5 text-cyan-400 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nº de Série */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Número de Série</label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Digite o nº de série"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Cor / Acabamento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cor / Acabamento</label>
                <div className="relative">
                  <Palette className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Preto, Azul, Prata..."
                    className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SEGURANÇA E ACESSÓRIOS MATCHING MM.PNG */}
          <div className="p-4 bg-[#09152a] border border-blue-900/80 rounded-2xl shadow-[0_0_20px_rgba(2,132,199,0.1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Segurança e Acessórios</h3>
                <p className="text-[11px] text-slate-400">
                  Informe a senha e os itens que acompanham o equipamento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Senha de Desbloqueio */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Senha de Desbloqueio / PIN / Padrão
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={passwordPin}
                    onChange={(e) => setPasswordPin(e.target.value)}
                    placeholder="Ex: 1234, desenho, sem senha..."
                    className="w-full pl-10 pr-10 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    title={isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Acessórios Entregues */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Acessórios Entregues</label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={accessoriesDelivered}
                    onChange={(e) => setAccessoriesDelivered(e.target.value)}
                    placeholder="Ex: Carregador, capinha, fone, cabo..."
                    className="w-full pl-10 pr-8 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: ESTADO FÍSICO & FOTOS MATCHING MM.PNG */}
          <div className="p-4 bg-[#09152a] border border-blue-900/80 rounded-2xl shadow-[0_0_20px_rgba(2,132,199,0.1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Estado Físico / Avarias Pré-Existentes</h3>
                <p className="text-[11px] text-slate-400">
                  Descreva o estado do aparelho e registre possíveis avarias.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Textarea Left */}
              <div className="md:col-span-2 relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={4}
                  maxLength={500}
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                  placeholder="Ex: Tela trincada, riscos na tampa traseira, botões funcionando normalmente..."
                  className="w-full pl-10 pr-12 py-2.5 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-slate-500 font-mono font-semibold">
                  {physicalCondition.length}/500
                </span>
              </div>

              {/* Photo Upload Dropzone Right */}
              <div className="relative flex flex-col items-center justify-center p-4 bg-[#040a17] border-2 border-dashed border-blue-900/80 hover:border-cyan-500/50 rounded-xl text-center transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                {uploadedPhotoPreview ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-blue-800">
                    <img
                      src={uploadedPhotoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedPhotoPreview(null);
                        setPhotoUrl('');
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-950/80 text-rose-300 rounded-md z-20 hover:bg-rose-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">Adicionar Fotos (Opcional)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Arraste as imagens aqui ou clique para selecionar
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">JPG, PNG até 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER MATCHING MM.PNG */}
        <div className="p-4 sm:p-5 border-t border-blue-900/60 bg-[#060e1d] flex items-center justify-between gap-4">
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
            <Smartphone className="w-4 h-4" />
            <span>{deviceToEdit ? 'Salvar Alterações' : 'Cadastrar Aparelho'}</span>
          </button>
        </div>
      </div>

      {/* QUICK NEW CUSTOMER SUB-MODAL */}
      {showQuickCustomer && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setShowQuickCustomer(false)}
        >
          <div 
            className="w-full max-w-md bg-[#09152a] border border-blue-900/80 rounded-2xl p-5 shadow-2xl text-white space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Novo Cliente Rápido</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCustomer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full px-3.5 py-2 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                {(() => {
                  const cleanNum = quickCustomerPhone.replace(/\D/g, '');
                  if (!cleanNum || cleanNum.length < 8) return null;
                  const all = StorageService.getCustomers();
                  const owner = all.find(c => 
                    c.phone.replace(/\D/g, '') === cleanNum || c.whatsapp?.replace(/\D/g, '') === cleanNum
                  );
                  if (!owner) return null;
                  return (
                    <div className="mt-2 p-2 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-300 text-xs font-semibold">
                      ⚠️ Este WhatsApp já pertence ao cliente: <strong>{owner.name}</strong>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={quickCustomerDoc}
                  onChange={(e) => setQuickCustomerDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2 bg-[#040a17] border border-blue-900/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(false)}
                  className="px-4 py-2 bg-[#040a17] text-slate-300 rounded-xl text-xs font-bold hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Cadastrar e Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
