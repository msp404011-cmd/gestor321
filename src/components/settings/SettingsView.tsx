import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  ShieldAlert,
  FileText,
  Users,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  Tag,
  Plus,
  Edit2,
  Palette,
  X,
  AlertTriangle,
  Smartphone,
  Headphones,
  CreditCard,
  CheckSquare,
  RotateCcw,
  Sliders,
  Calendar,
  ShieldCheck,
  Check,
  Filter,
  Globe,
  Laptop,
  Gamepad2,
  Watch,
  Tv,
  Printer,
  Volume2,
  Lock,
  Eye,
  EyeOff,
  Key,
  Square,
  Database,
  Crown,
  Cloud,
} from 'lucide-react';
import { SubscriptionTab } from '../subscription/SubscriptionTab';
import { GoogleDriveBackupService } from '../../services/googleDriveBackupService';
import {
  StorageService,
  CustomCategory,
  CustomOSStatusItem,
  CustomDeviceType,
  CustomAccessoryItem,
  CustomPaymentMethodItem,
  defaultCustomDeviceTypes,
  defaultCustomAccessories,
  defaultCustomPaymentMethods,
  isAccessoryForDeviceType,
  SystemFormatOptions,
  defaultSystemFormatOptions,
  completeFactoryResetOptions,
  SystemStatsSummary,
} from '../../services/storage';
import { CompanySettings, UserRole, Supplier, ServiceOrder } from '../../types';
import { formatDate } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';
import { ThermalOrderReceipt } from '../orders/ThermalOrderReceipt';
import { initialCompanySettings } from '../../services/mockData';
import { SystemFormatTab } from './SystemFormatTab';

const samplePreviewOrder: ServiceOrder = {
  id: 'os-sample-preview',
  orderNumber: 1462,
  customerId: 'cust-preview',
  customerName: 'MARCOS VINICIUS ALMEIDA',
  customerPhone: '(11) 98765-4321',
  customerDocument: '123.456.789-00',
  deviceType: 'Celular',
  brand: 'Samsung Galaxy',
  model: 'A03',
  serialNumber: 'IMEI-849201948102',
  imei: '354892019481029',
  physicalCondition: 'Com marcas normais de uso nas bordas',
  accessories: 'Com capa protetora de silicone, película de vidro aplicada',
  clientDefect: 'NÃO CARREGA A BATERIA E DESLIGA SOZINHO',
  technicalDiagnosis: 'SUBSTITUIÇÃO DA SUB-PLACA CONECTOR DE CARGA',
  status: 'ENTREGUE',
  totalPrice: 220.0,
  partsPrice: 70.0,
  laborPrice: 150.0,
  discount: 0.0,
  paymentStatus: 'PAGO',
  paymentMethod: 'PIX',
  technicianName: 'Carlos Eduardo Silva',
  attendantName: 'Recepção TechNova',
  warrantyDays: 90,
  createdAt: '2026-08-11T10:30:00Z',
  updatedAt: '2026-09-07T14:45:00Z',
  deliveredAt: '2026-09-07T14:45:00Z',
  estimatedCompletionDate: '2026-08-12T18:00:00Z',
  parts: [
    {
      id: 'item-preview-1',
      type: 'PECA',
      productId: '7896207087039',
      productName: 'SUB-PLACA CONECTOR DE CARGA GALAXY A03',
      name: 'SUB-PLACA CONECTOR DE CARGA GALAXY A03',
      quantity: 1,
      unitPrice: 70.0,
      discount: 0,
      total: 70.0,
      totalPrice: 70.0,
    },
    {
      id: 'item-preview-2',
      type: 'SERVICO',
      productId: 'SRV-001',
      productName: 'MÃO DE OBRA ESPECIALIZADA EM SOLDAGEM E MONTAGEM',
      name: 'MÃO DE OBRA ESPECIALIZADA EM SOLDAGEM E MONTAGEM',
      quantity: 1,
      unitPrice: 150.0,
      discount: 0,
      total: 150.0,
      totalPrice: 150.0,
    },
  ],
  internalNotes: 'Aparelho testado em bancada: carga rápida operacional, microfone e alto-falante funcionando normalmente.',
  customerNotes: 'Entregue com capa e película. Garantia de 90 dias válida para a sub-placa e mão de obra realizada.',
  items: [],
  statusHistory: [],
};

export const SettingsView: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<
    'COMPANY' | 'SUBSCRIPTION' | 'OS_CONFIG' | 'CATEGORIES' | 'USERS' | 'AUDIT' | 'BACKUP' | 'PURCHASES_CONFIG' | 'SYSTEM_FORMAT'
  >('COMPANY');

  // System Formatter (Zerar Sistema) States
  const [formatOptions, setFormatOptions] = useState<SystemFormatOptions>(() => ({
    ...defaultSystemFormatOptions,
  }));
  const [formatMode, setFormatMode] = useState<'OPERATIONAL' | 'COMPLETE' | 'CUSTOM'>('OPERATIONAL');
  const [systemStats, setSystemStats] = useState<SystemStatsSummary>(() => StorageService.getSystemStatsSummary());
  const [confirmSafetyText, setConfirmSafetyText] = useState('');
  const [isFormattingInProgress, setIsFormattingInProgress] = useState(false);
  const [formatStepMessage, setFormatStepMessage] = useState('');
  const [formatCompleted, setFormatCompleted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoBackupBeforeFormat, setAutoBackupBeforeFormat] = useState(true);

  // Purchases & Suppliers Settings State
  const [purchasesConfig, setPurchasesConfig] = useState(() => StorageService.getPurchasesConfig());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());

  // Supplier editing state in Settings
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierNameInput, setSupplierNameInput] = useState('');
  const [supplierCnpjInput, setSupplierCnpjInput] = useState('');
  const [supplierPhoneInput, setSupplierPhoneInput] = useState('');
  const [supplierEmailInput, setSupplierEmailInput] = useState('');
  const [supplierAddressInput, setSupplierAddressInput] = useState('');
  const [supplierNotesInput, setSupplierNotesInput] = useState('');

  // Sub-tabs for OS_CONFIG
  const [osSubTab, setOsSubTab] = useState<
    'DEVICES' | 'ACCESSORIES' | 'PAYMENTS' | 'STATUSES' | 'WARRANTY' | 'PRINT_TEMPLATE'
  >('PRINT_TEMPLATE');
  const [previewPaperFormat, setPreviewPaperFormat] = useState<'80mm' | '58mm'>('80mm');

  const [company, setCompany] = useState<CompanySettings>(() => StorageService.getCompanySettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showManagerPassword, setShowManagerPassword] = useState(false);

  // Custom Categories state
  const [categories, setCategories] = useState<CustomCategory[]>(() => StorageService.getCustomCategories());
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Custom Device Types state
  const [deviceTypes, setDeviceTypes] = useState<CustomDeviceType[]>(() => StorageService.getCustomDeviceTypes());
  const [newDevTypeName, setNewDevTypeName] = useState('');
  const [editingDevTypeId, setEditingDevTypeId] = useState<string | null>(null);
  const [editingDevTypeName, setEditingDevTypeName] = useState('');

  // Custom Accessories state
  const [accessories, setAccessories] = useState<CustomAccessoryItem[]>(() => StorageService.getCustomAccessories());
  const [selectedAccDeviceFilter, setSelectedAccDeviceFilter] = useState<string>('ALL');
  const [newAccName, setNewAccName] = useState('');
  const [newAccPlaceholder, setNewAccPlaceholder] = useState('');
  const [newAccDeviceTypes, setNewAccDeviceTypes] = useState<string[]>(['ALL']);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingAccName, setEditingAccName] = useState('');
  const [editingAccPlaceholder, setEditingAccPlaceholder] = useState('');
  const [editingAccDeviceTypes, setEditingAccDeviceTypes] = useState<string[]>(['ALL']);

  // Custom Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<CustomPaymentMethodItem[]>(() => StorageService.getCustomPaymentMethods());
  const [newPaymentName, setNewPaymentName] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentName, setEditingPaymentName] = useState('');

  // Custom OS Statuses state
  const [osStatuses, setOsStatuses] = useState<CustomOSStatusItem[]>(() => StorageService.getCustomOSStatuses());
  const [newOsLabel, setNewOsLabel] = useState('');
  const [newOsColor, setNewOsColor] = useState('BLUE');
  const [editingOsId, setEditingOsId] = useState<string | null>(null);
  const [editingOsLabel, setEditingOsLabel] = useState('');

  const users = StorageService.getUsers();
  const auditLogs = StorageService.getAuditLogs();
  const currentUser = StorageService.getCurrentUser();
  const authSession = StorageService.getAuthSession();

  // Google Drive Cloud Backup State
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null);
  const [driveSyncStatus, setDriveSyncStatus] = useState(() =>
    authSession?.email ? GoogleDriveBackupService.getSyncStatus(authSession.email) : null
  );

  const handleManualGoogleDriveSync = async () => {
    if (!authSession?.email) {
      alert('Faça login com uma conta Google para salvar o backup individual no seu Google Drive.');
      return;
    }
    setIsDriveSyncing(true);
    setDriveSyncMessage(null);
    try {
      const res = await GoogleDriveBackupService.uploadBackupToGoogleDrive(authSession.email);
      if (res.success) {
        setDriveSyncMessage('Backup salvo com sucesso no seu Google Drive!');
        setDriveSyncStatus(GoogleDriveBackupService.getSyncStatus(authSession.email));
        showSuccessFeedback();
      } else {
        setDriveSyncMessage(res.error || 'Erro ao sincronizar com Google Drive.');
      }
    } catch (e: any) {
      setDriveSyncMessage(e.message || 'Falha na conexão com Google Drive.');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleManualGoogleDriveRestore = async () => {
    if (!authSession?.email) {
      alert('Faça login com uma conta Google para restaurar do Google Drive.');
      return;
    }
    if (!confirm('Deseja realmente restaurar os dados do backup salvo no seu Google Drive? Os dados atuais da tela serão substituídos pela versão da nuvem.')) {
      return;
    }
    setIsDriveSyncing(true);
    setDriveSyncMessage(null);
    try {
      const res = await GoogleDriveBackupService.restoreBackupFromGoogleDrive(authSession.email);
      if (res.success) {
        alert('Backup do Google Drive restaurado com sucesso! A página será atualizada.');
        window.location.reload();
      } else {
        alert(res.error || 'Não foi possível restaurar do Google Drive.');
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao restaurar do Google Drive.');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const showSuccessFeedback = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveCompanySettings(company);
    showSuccessFeedback();
  };

  const handleResetToPhotoDefault = () => {
    if (confirm('Deseja restaurar as configurações padrão da empresa fictícia (TechNova Informática & Celulares)?')) {
      const reset: CompanySettings = {
        ...initialCompanySettings,
      };
      setCompany(reset);
      StorageService.saveCompanySettings(reset);
      showSuccessFeedback();
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierNameInput.trim()) {
      alert('Nome do fornecedor é obrigatório.');
      return;
    }

    const updatedSup: Supplier = {
      id: editingSupplierId || '',
      name: supplierNameInput.trim(),
      cnpj: supplierCnpjInput.trim() || undefined,
      phone: supplierPhoneInput.trim() || undefined,
      email: supplierEmailInput.trim() || undefined,
      address: supplierAddressInput.trim() || undefined,
      notes: supplierNotesInput.trim() || undefined,
    };

    StorageService.saveSupplier(updatedSup);
    setSuppliers(StorageService.getSuppliers());
    
    // Reset form
    setEditingSupplierId(null);
    setIsAddingSupplier(false);
    setSupplierNameInput('');
    setSupplierCnpjInput('');
    setSupplierPhoneInput('');
    setSupplierEmailInput('');
    setSupplierAddressInput('');
    setSupplierNotesInput('');
    showSuccessFeedback();
  };

  const handleEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setIsAddingSupplier(true);
    setSupplierNameInput(sup.name);
    setSupplierCnpjInput(sup.cnpj || '');
    setSupplierPhoneInput(sup.phone || '');
    setSupplierEmailInput(sup.email || '');
    setSupplierAddressInput(sup.address || '');
    setSupplierNotesInput(sup.notes || '');
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      StorageService.deleteSupplier(id);
      setSuppliers(StorageService.getSuppliers());
      showSuccessFeedback();
    }
  };

  const handleSavePurchasesConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePurchasesConfig(purchasesConfig);
    showSuccessFeedback();
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Por favor, selecione uma imagem com menos de 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const updated = { ...company, logoUrl: base64 };
        setCompany(updated);
        StorageService.saveCompanySettings(updated);
        showSuccessFeedback();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    const updated = { ...company, logoUrl: '' };
    setCompany(updated);
    StorageService.saveCompanySettings(updated);
    showSuccessFeedback();
  };

  // --- 1. DEVICE TYPES MANAGEMENT ---
  const handleAddDeviceType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevTypeName.trim()) return;

    const newType: CustomDeviceType = {
      id: 'dev-' + Date.now(),
      name: newDevTypeName.trim(),
      isDefault: false,
    };

    const updated = [...deviceTypes, newType];
    setDeviceTypes(updated);
    StorageService.saveCustomDeviceTypes(updated);
    setNewDevTypeName('');
    showSuccessFeedback();
  };

  const handleSaveEditDeviceType = (id: string) => {
    if (!editingDevTypeName.trim()) return;
    const updated = deviceTypes.map((t) =>
      t.id === id ? { ...t, name: editingDevTypeName.trim() } : t
    );
    setDeviceTypes(updated);
    StorageService.saveCustomDeviceTypes(updated);
    setEditingDevTypeId(null);
    setEditingDevTypeName('');
    showSuccessFeedback();
  };

  const handleDeleteDeviceType = (id: string) => {
    if (confirm('Deseja realmente remover este tipo de equipamento?')) {
      const updated = deviceTypes.filter((t) => t.id !== id);
      setDeviceTypes(updated);
      StorageService.saveCustomDeviceTypes(updated);
      showSuccessFeedback();
    }
  };

  const handleResetDeviceTypes = () => {
    if (confirm('Restaurar os tipos de equipamentos padrão do sistema?')) {
      setDeviceTypes(defaultCustomDeviceTypes);
      StorageService.saveCustomDeviceTypes(defaultCustomDeviceTypes);
      showSuccessFeedback();
    }
  };

  // --- 2. ACCESSORIES CHECKLIST MANAGEMENT ---
  const handleAddAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    let targetTypes = newAccDeviceTypes;
    if (targetTypes.length === 0) {
      targetTypes = selectedAccDeviceFilter !== 'ALL' ? [selectedAccDeviceFilter] : ['ALL'];
    }

    const newAcc: CustomAccessoryItem = {
      id: 'acc-' + Date.now(),
      name: newAccName.trim(),
      placeholder: newAccPlaceholder.trim() || undefined,
      deviceTypes: targetTypes,
      defaultPresent: false,
      hasDetails: true,
    };

    const updated = [...accessories, newAcc];
    setAccessories(updated);
    StorageService.saveCustomAccessories(updated);
    setNewAccName('');
    setNewAccPlaceholder('');
    setNewAccDeviceTypes(selectedAccDeviceFilter !== 'ALL' ? [selectedAccDeviceFilter] : ['ALL']);
    showSuccessFeedback();
  };

  const handleSaveEditAccessory = (id: string) => {
    if (!editingAccName.trim()) return;
    const updated = accessories.map((a) =>
      a.id === id
        ? {
            ...a,
            name: editingAccName.trim(),
            placeholder: editingAccPlaceholder.trim() || undefined,
            deviceTypes: editingAccDeviceTypes.length > 0 ? editingAccDeviceTypes : ['ALL'],
          }
        : a
    );
    setAccessories(updated);
    StorageService.saveCustomAccessories(updated);
    setEditingAccId(null);
    setEditingAccName('');
    setEditingAccPlaceholder('');
    setEditingAccDeviceTypes(['ALL']);
    showSuccessFeedback();
  };

  const handleDeleteAccessory = (id: string) => {
    if (confirm('Deseja realmente remover este item de acessório do checklist?')) {
      const updated = accessories.filter((a) => a.id !== id);
      setAccessories(updated);
      StorageService.saveCustomAccessories(updated);
      showSuccessFeedback();
    }
  };

  const handleResetAccessories = () => {
    if (confirm('Restaurar o checklist de acessórios padrão de fábrica organizados por tipo de equipamento?')) {
      setAccessories(defaultCustomAccessories);
      StorageService.saveCustomAccessories(defaultCustomAccessories);
      showSuccessFeedback();
    }
  };

  // --- 3. PAYMENT METHODS MANAGEMENT ---
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentName.trim()) return;

    const newPay: CustomPaymentMethodItem = {
      id: 'pay-' + Date.now(),
      code: 'CUSTOM_' + Date.now(),
      name: newPaymentName.trim(),
      isSystem: false,
      isActive: true,
    };

    const updated = [...paymentMethods, newPay];
    setPaymentMethods(updated);
    StorageService.saveCustomPaymentMethods(updated);
    setNewPaymentName('');
    showSuccessFeedback();
  };

  const handleTogglePaymentMethod = (id: string) => {
    const updated = paymentMethods.map((p) =>
      p.id === id ? { ...p, isActive: p.isActive === false ? true : false } : p
    );
    setPaymentMethods(updated);
    StorageService.saveCustomPaymentMethods(updated);
    showSuccessFeedback();
  };

  const handleSaveEditPayment = (id: string) => {
    if (!editingPaymentName.trim()) return;
    const updated = paymentMethods.map((p) =>
      p.id === id ? { ...p, name: editingPaymentName.trim() } : p
    );
    setPaymentMethods(updated);
    StorageService.saveCustomPaymentMethods(updated);
    setEditingPaymentId(null);
    setEditingPaymentName('');
    showSuccessFeedback();
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('Deseja realmente remover esta forma de pagamento?')) {
      const updated = paymentMethods.filter((p) => p.id !== id);
      setPaymentMethods(updated);
      StorageService.saveCustomPaymentMethods(updated);
      showSuccessFeedback();
    }
  };

  const handleResetPayments = () => {
    if (confirm('Restaurar as formas de pagamento padrão?')) {
      setPaymentMethods(defaultCustomPaymentMethods);
      StorageService.saveCustomPaymentMethods(defaultCustomPaymentMethods);
      showSuccessFeedback();
    }
  };

  // --- 4. OS STATUSES MANAGEMENT ---
  const colorPresets: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    BLUE: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40', dot: 'bg-blue-400', label: 'Azul' },
    GREEN: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-400', label: 'Verde' },
    AMBER: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-400', label: 'Amarelo' },
    ORANGE: { bg: 'bg-[#ff7b00]/15', text: 'text-[#ff9100]', border: 'border-[#ff7b00]/40', dot: 'bg-[#ff9100]', label: 'Laranja' },
    ROSE: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-400', label: 'Vermelho' },
    PURPLE: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/40', dot: 'bg-purple-400', label: 'Roxo' },
    TEAL: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/40', dot: 'bg-teal-400', label: 'Ciano/Teal' },
  };

  const handleAddOSStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOsLabel.trim()) return;

    const preset = colorPresets[newOsColor] || colorPresets.BLUE;

    const newStatus: CustomOSStatusItem = {
      id: 'os-' + Date.now(),
      code: 'STATUS_' + Date.now(),
      label: newOsLabel.trim(),
      colorBg: preset.bg,
      colorText: preset.text,
      colorBorder: preset.border,
      colorDot: preset.dot,
    };

    const updated = [...osStatuses, newStatus];
    setOsStatuses(updated);
    StorageService.saveCustomOSStatuses(updated);
    setNewOsLabel('');
    showSuccessFeedback();
  };

  const handleSaveEditOSStatus = (id: string) => {
    if (!editingOsLabel.trim()) return;
    const updated = osStatuses.map((s) =>
      s.id === id ? { ...s, label: editingOsLabel.trim() } : s
    );
    setOsStatuses(updated);
    StorageService.saveCustomOSStatuses(updated);
    setEditingOsId(null);
    setEditingOsLabel('');
    showSuccessFeedback();
  };

  const handleDeleteOSStatus = (id: string) => {
    if (confirm('Deseja realmente excluir este status de OS?')) {
      const updated = osStatuses.filter((s) => s.id !== id);
      setOsStatuses(updated);
      StorageService.saveCustomOSStatuses(updated);
      showSuccessFeedback();
    }
  };

  // --- 5. CATEGORIES MANAGEMENT ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: CustomCategory = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    StorageService.saveCustomCategories(updated);
    setNewCatName('');
    showSuccessFeedback();
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name: editingCatName.trim() } : c
    );
    setCategories(updated);
    StorageService.saveCustomCategories(updated);
    setEditingCatId(null);
    setEditingCatName('');
    showSuccessFeedback();
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Deseja realmente remover esta categoria?')) {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      StorageService.saveCustomCategories(updated);
      showSuccessFeedback();
    }
  };

  // Export Backup
  const handleExportBackup = () => {
    const data = StorageService.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const storeSlug = (company.commercialName || company.name || 'sistema')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    a.download = `backup-${storeSlug}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importFullBackup(content);
        if (success) {
          alert('Backup restaurado com sucesso! A página será atualizada.');
          window.location.reload();
        } else {
          alert('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Data
  const handleResetDemo = () => {
    if (
      confirm(
        'Deseja recarregar a base de dados de demonstração da MSP Informática? Todos os dados atuais serão substituídos pelos dados iniciais da loja.'
      )
    ) {
      StorageService.resetToDemoData();
      alert('Dados restaurados com sucesso!');
      window.location.reload();
    }
  };

  // System Formatter (Zerar Sistema) Handlers
  const handleOpenFormatTab = () => {
    setActiveTab('SYSTEM_FORMAT');
    setSystemStats(StorageService.getSystemStatsSummary());
    setConfirmSafetyText('');
    setFormatCompleted(false);
  };

  const handleSelectPreset = (mode: 'OPERATIONAL' | 'COMPLETE' | 'CUSTOM') => {
    setFormatMode(mode);
    if (mode === 'OPERATIONAL') {
      setFormatOptions({
        ...defaultSystemFormatOptions,
      });
    } else if (mode === 'COMPLETE') {
      setFormatOptions({
        ...completeFactoryResetOptions,
      });
    }
  };

  const handleToggleFormatOption = (key: keyof SystemFormatOptions) => {
    setFormatOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setFormatMode('CUSTOM');
      return next;
    });
  };

  const handleSelectAllFormatOptions = (select: boolean) => {
    setFormatMode('CUSTOM');
    setFormatOptions({
      orders: select,
      sales: select,
      cash: select,
      expenses: select,
      receivables: select,
      purchases: select,
      stockMovements: select,
      products: select,
      customers: select,
      devices: select,
      suppliers: select,
      resellers: select,
      auditLogs: select,
      resetCompanySettings: select,
      resetCustomConfigs: select,
      resetEmployeesToAdminOnly: select,
    });
  };

  const countSelectedFormatItems = () => {
    return Object.values(formatOptions).filter(Boolean).length;
  };

  const isSafetyPhraseValid =
    confirmSafetyText.trim().toUpperCase() === 'ZERAR' ||
    confirmSafetyText.trim().toUpperCase() === 'FORMATAR';

  const handleExecuteFormat = async () => {
    if (!isSafetyPhraseValid) {
      alert('Por favor, digite a palavra ZERAR ou FORMATAR no campo de confirmação para prosseguir.');
      return;
    }

    if (countSelectedFormatItems() === 0) {
      alert('Selecione pelo menos um módulo ou item para formatar/zerar.');
      return;
    }

    setIsFormattingInProgress(true);
    setFormatStepMessage('Iniciando rotina de limpeza e validação de segurança...');

    // Automatic safety backup if checked
    if (autoBackupBeforeFormat) {
      try {
        setFormatStepMessage('Gerando backup de segurança automático em JSON...');
        handleExportBackup();
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        console.error('Backup error before format:', err);
      }
    }

    setFormatStepMessage('Formatando tabelas e removendo registros selecionados...');
    await new Promise((r) => setTimeout(r, 800));

    // Execute format in StorageService
    StorageService.formatSystem(formatOptions);

    setFormatStepMessage('Reindexando banco de dados e limpando sessões ativas...');
    await new Promise((r) => setTimeout(r, 600));

    // Update stats
    setSystemStats(StorageService.getSystemStatsSummary());
    setIsFormattingInProgress(false);
    setFormatCompleted(true);
    setShowConfirmModal(false);
    setFormatStepMessage('Sistema formatado com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Configurações do Sistema</h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                isDark
                  ? 'bg-blue-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {company.commercialName || company.name || 'Minha Assistência'}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Personalize logotipo, equipamentos, checklist de acessórios, formas de pagamento, status de OS e termos.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div className={`flex items-center gap-2 border-b-2 pb-2 overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {[
          { id: 'COMPANY', label: 'Logotipo & Dados da Loja', icon: Building2 },
          { id: 'SUBSCRIPTION', label: 'Meu Plano / Assinatura', icon: Crown, highlight: true },
          { id: 'OS_CONFIG', label: 'Personalização da OS (Ordem de Serviço)', icon: Sliders },
          { id: 'CATEGORIES', label: 'Categorias de Produtos', icon: Layers },
          { id: 'USERS', label: 'Usuários & Permissões', icon: Users },
          { id: 'AUDIT', label: 'Histórico de Auditoria', icon: Clock },
          { id: 'BACKUP', label: 'Backup & Restauração', icon: Download },
          { id: 'PURCHASES_CONFIG', label: 'Compras & Fornecedores', icon: Settings },
          { id: 'SYSTEM_FORMAT', label: 'Formatador do Sistema (Zerar)', icon: AlertTriangle, danger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'SYSTEM_FORMAT') {
                  handleOpenFormatTab();
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer border-2 flex items-center gap-2 ${
                isActive
                  ? tab.danger
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white border-rose-400 shadow-[0_0_18px_rgba(225,29,72,0.5)]'
                    : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white border-blue-400 shadow-[0_0_18px_rgba(37,99,235,0.5)]'
                  : tab.danger
                  ? isDark
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:border-rose-400 hover:text-rose-200'
                    : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                  : tab.highlight
                  ? isDark
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                  : isDark
                  ? 'bg-[#090f20] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              )}
              {tab.danger && !isActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: MY PLAN & SUBSCRIPTION */}
      {activeTab === 'SUBSCRIPTION' && <SubscriptionTab />}

      {/* TAB 1: LOGO & COMPANY */}
      {activeTab === 'COMPANY' && (
        <form
          onSubmit={handleSaveCompany}
          className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
            isDark
              ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
              : 'bg-white border-slate-200 shadow-xs text-slate-900'
          }`}
        >
          {/* Logo Section */}
          <div
            className={`p-5 rounded-2xl border-2 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#0e1832] to-[#070b16] border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {company.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remover Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-bold gap-1 ${
                    isDark ? 'bg-blue-950 border-cyan-500/50 text-cyan-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}>
                    <ImageIcon className="w-6 h-6" />
                    <span>Sem Logo</span>
                  </div>
                )}

                <div>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Logotipo da Empresa</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Envie a logomarca da sua empresa para ser exibida nos comprovantes impressos (50mm, 80mm e A4) e no topo do sistema.
                  </p>
                </div>
              </div>

              <label className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer transition-all border border-cyan-300 flex items-center gap-2 shrink-0">
                <Upload className="w-4 h-4" />
                <span>Upload do Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Company Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Razão Social / Nome da Empresa</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nome Fantasia / Comercial (Impresso)</label>
              <input
                type="text"
                value={company.commercialName}
                onChange={(e) => setCompany({ ...company, commercialName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Proprietário / Responsável</label>
              <input
                type="text"
                value={company.ownerName || ''}
                onChange={(e) => setCompany({ ...company, ownerName: e.target.value })}
                placeholder="Ex: Vicente Pereira Dias"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Slogan / Frase de Efeito</label>
              <input
                type="text"
                value={company.slogan || ''}
                onChange={(e) => setCompany({ ...company, slogan: e.target.value })}
                placeholder="Ex: A TECNOLOGIA SIMPLIFICADA"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">CNPJ / CPF</label>
              <input
                type="text"
                value={company.cnpj || company.cnpjCpf}
                onChange={(e) => setCompany({ ...company, cnpj: e.target.value, cnpjCpf: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">WhatsApp da Empresa</label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value, whatsapp: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">CEP</label>
              <input
                type="text"
                value={company.zipCode || ''}
                onChange={(e) => setCompany({ ...company, zipCode: e.target.value })}
                placeholder="Ex: 62215-000"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Bairro</label>
              <input
                type="text"
                value={company.neighborhood || ''}
                onChange={(e) => setCompany({ ...company, neighborhood: e.target.value })}
                placeholder="Ex: CENTRAL"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Cidade</label>
              <input
                type="text"
                value={company.city || ''}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                placeholder="Ex: IPAPORANGA"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Estado (UF)</label>
              <input
                type="text"
                value={company.state || ''}
                onChange={(e) => setCompany({ ...company, state: e.target.value })}
                placeholder="Ex: CE"
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">Endereço Completo</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                  isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Manager Password / Security Section */}
          <div
            className={`p-4 rounded-2xl border-2 space-y-3 ${
              isDark
                ? 'bg-gradient-to-br from-[#0e1832] via-[#091124] to-[#060c1c] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span>Senha de Gerente (Autorizações da OS)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Protegido
                    </span>
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Esta senha é solicitada ao operador para liberar a edição manual do valor total da Ordem de Serviço e descontos especiais.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-bold mb-1 text-slate-200">
                Senha do Gerente / Administrador
              </label>
              <div className="relative">
                <input
                  type={showManagerPassword ? 'text' : 'password'}
                  value={company.managerPassword ?? '1507'}
                  onChange={(e) => setCompany({ ...company, managerPassword: e.target.value })}
                  placeholder="••••••"
                  className={`w-full pl-3 pr-10 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:border-amber-400 ${
                    isDark ? 'bg-[#040a17] border-amber-500/40 text-amber-300' : 'bg-white border-amber-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowManagerPassword(!showManagerPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                  title={showManagerPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showManagerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Altere aqui para a senha desejada e clique em <strong>Salvar Dados da Loja</strong>.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 transition-all cursor-pointer"
            >
              Salvar Dados da Loja
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: OS CONFIGURATION HUB (DEDICATED ALL-IN-ONE OS SETTINGS) */}
      {activeTab === 'OS_CONFIG' && (
        <div
          className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
            isDark
              ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
              : 'bg-white border-slate-200 shadow-xs text-slate-900'
          }`}
        >
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className={`font-black text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Central de Configurações da Ordem de Serviço (OS)</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gerencie todos os dados que aparecem na criação e edição de Ordens de Serviço e Aparelhos.
              </p>
            </div>
          </div>

          {/* Sub-Tabs Row */}
          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
            isDark ? 'bg-[#060c1d] border-slate-800' : 'bg-slate-100 border-slate-200'
          } overflow-x-auto`}>
            {[
              { id: 'PRINT_TEMPLATE', label: 'Impressão Térmica (Cupom OS)', icon: Printer },
              { id: 'DEVICES', label: 'Tipos de Equipamento', icon: Smartphone, count: deviceTypes.length },
              { id: 'ACCESSORIES', label: 'Checklist de Acessórios', icon: Headphones, count: accessories.length },
              { id: 'PAYMENTS', label: 'Formas de Pagamento', icon: CreditCard, count: paymentMethods.length },
              { id: 'STATUSES', label: 'Status de OS & Kanban', icon: Palette, count: osStatuses.length },
              { id: 'WARRANTY', label: 'Prazos & Termos de Garantia', icon: ShieldCheck },
            ].map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = osSubTab === sub.id;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setOsSubTab(sub.id as any)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isSubActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                  {sub.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSubActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-cyan-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {sub.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: TIPOS DE EQUIPAMENTO */}
          {osSubTab === 'DEVICES' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Tipos de Equipamento Disponíveis no Cadastro da OS</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Os tipos configurados aqui aparecem no menu de seleção na hora de criar uma nova OS ou cadastrar aparelhos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetDeviceTypes}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrões</span>
                </button>
              </div>

              {/* Form to add device type */}
              <form onSubmit={handleAddDeviceType} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="text"
                  value={newDevTypeName}
                  onChange={(e) => setNewDevTypeName(e.target.value)}
                  placeholder="Digite o novo tipo (ex: Console / Videogame, Drone, TV Box, Smartwatch, Mac / Apple)..."
                  className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                    isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Tipo</span>
                </button>
              </form>

              {/* Device Types Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {deviceTypes.map((type) => {
                  const isEditing = editingDevTypeId === type.id;
                  const linkedAccCount = accessories.filter((a) => isAccessoryForDeviceType(a, type.name)).length;

                  return (
                    <div
                      key={type.id}
                      className={`border rounded-xl p-3 flex flex-col justify-between gap-2 shadow-xs transition-all ${
                        isDark ? 'bg-[#040a17] border-blue-900/60 hover:border-cyan-500/50' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingDevTypeName}
                            onChange={(e) => setEditingDevTypeName(e.target.value)}
                            className={`flex-1 px-2 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                              isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditDeviceType(type.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDevTypeId(null)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-cyan-400" />
                              <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{type.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDevTypeId(type.id);
                                  setEditingDevTypeName(type.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Editar Tipo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteDeviceType(type.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Remover Tipo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {linkedAccCount} {linkedAccCount === 1 ? 'item no checklist' : 'itens no checklist'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOsSubTab('ACCESSORIES');
                                setSelectedAccDeviceFilter(type.name);
                                setNewAccDeviceTypes([type.name]);
                              }}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Headphones className="w-3 h-3" />
                              <span>Ver Checklist</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: CHECKLIST DE ACESSÓRIOS POR TIPO DE EQUIPAMENTO */}
          {osSubTab === 'ACCESSORIES' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4" />
                    <span>Checklist de Acessórios por Tipo de Equipamento</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure os itens do checklist que aparecem para cada tipo de aparelho ao abrir a Ordem de Serviço.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetAccessories}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Checklists Padrões</span>
                </button>
              </div>

              {/* Filter by Device Type Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  <span>Filtrar e Configurar por Equipamento:</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccDeviceFilter('ALL');
                      setNewAccDeviceTypes(['ALL']);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedAccDeviceFilter === 'ALL'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : isDark
                        ? 'bg-[#091632] border border-blue-900/60 text-slate-300 hover:text-white hover:border-cyan-500/50'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Todos os Equipamentos ({accessories.length})</span>
                  </button>

                  {deviceTypes.map((dt) => {
                    const count = accessories.filter((a) => isAccessoryForDeviceType(a, dt.name)).length;
                    const isSelected = selectedAccDeviceFilter === dt.name;

                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccDeviceFilter(dt.name);
                          setNewAccDeviceTypes([dt.name]);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                            : isDark
                            ? 'bg-[#091632] border border-blue-900/60 text-slate-300 hover:text-white hover:border-cyan-500/50'
                            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>{dt.name}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form to add accessory item */}
              <form onSubmit={handleAddAccessory} className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Novo Item ao Checklist</span>
                  </span>
                  {selectedAccDeviceFilter !== 'ALL' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                      Vinculando para: {selectedAccDeviceFilter}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Nome do Acessório *
                    </label>
                    <input
                      type="text"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="Ex: Carregador Turbo 67W, Película de Vidro, Cabo de Força..."
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                        isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Dica / Detalhe Sugerido (Placeholder)
                    </label>
                    <input
                      type="text"
                      value={newAccPlaceholder}
                      onChange={(e) => setNewAccPlaceholder(e.target.value)}
                      placeholder="Ex: Marca / Voltagem / Cor / Estado..."
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                        isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Device Type Assignment Checkboxes */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400">
                    Aparelhos que usam este item no Checklist:
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (newAccDeviceTypes.includes('ALL')) {
                          setNewAccDeviceTypes([]);
                        } else {
                          setNewAccDeviceTypes(['ALL']);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1 ${
                        newAccDeviceTypes.includes('ALL')
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : isDark
                          ? 'bg-[#081226] border-slate-700 text-slate-400 hover:text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Check className={`w-3 h-3 ${newAccDeviceTypes.includes('ALL') ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Todos os Aparelhos (Geral)</span>
                    </button>

                    {!newAccDeviceTypes.includes('ALL') &&
                      deviceTypes.map((dt) => {
                        const isChecked = newAccDeviceTypes.includes(dt.name);
                        return (
                          <button
                            key={dt.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setNewAccDeviceTypes(newAccDeviceTypes.filter((t) => t !== dt.name));
                              } else {
                                setNewAccDeviceTypes([...newAccDeviceTypes, dt.name]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1 ${
                              isChecked
                                ? 'bg-blue-600/30 border-cyan-400 text-cyan-300'
                                : isDark
                                ? 'bg-[#081226] border-slate-700 text-slate-400 hover:text-white'
                                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Check className={`w-3 h-3 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                            <span>{dt.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar ao Checklist</span>
                  </button>
                </div>
              </form>

              {/* Accessories Grid */}
              {(() => {
                const filtered = accessories.filter((acc) =>
                  isAccessoryForDeviceType(acc, selectedAccDeviceFilter)
                );

                if (filtered.length === 0) {
                  return (
                    <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                      isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <Headphones className="w-8 h-8 text-cyan-400 mx-auto opacity-60" />
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nenhum acessório cadastrado para {selectedAccDeviceFilter === 'ALL' ? 'qualquer aparelho' : `o tipo "${selectedAccDeviceFilter}"`}.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Utilize o formulário acima para cadastrar ou clique em "Restaurar Checklists Padrões".
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filtered.map((acc) => {
                      const isEditing = editingAccId === acc.id;

                      return (
                        <div
                          key={acc.id}
                          className={`border rounded-xl p-3 flex flex-col justify-between gap-2 shadow-xs transition-all ${
                            isDark ? 'bg-[#040a17] border-blue-900/60 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2 flex-1">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nome:</label>
                                <input
                                  type="text"
                                  value={editingAccName}
                                  onChange={(e) => setEditingAccName(e.target.value)}
                                  className={`w-full px-2 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                                    isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                                  }`}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Placeholder / Dica:</label>
                                <input
                                  type="text"
                                  value={editingAccPlaceholder}
                                  onChange={(e) => setEditingAccPlaceholder(e.target.value)}
                                  placeholder="Ex: Marca / Voltagem"
                                  className={`w-full px-2 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                                    isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                                  }`}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Equipamentos:</label>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 rounded-md bg-slate-900/50 border border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingAccDeviceTypes.includes('ALL')) {
                                        setEditingAccDeviceTypes([]);
                                      } else {
                                        setEditingAccDeviceTypes(['ALL']);
                                      }
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                                      editingAccDeviceTypes.includes('ALL')
                                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                                  >
                                    Todos (Geral)
                                  </button>

                                  {!editingAccDeviceTypes.includes('ALL') &&
                                    deviceTypes.map((dt) => {
                                      const isChk = editingAccDeviceTypes.includes(dt.name);
                                      return (
                                        <button
                                          key={dt.id}
                                          type="button"
                                          onClick={() => {
                                            if (isChk) {
                                              setEditingAccDeviceTypes(editingAccDeviceTypes.filter((t) => t !== dt.name));
                                            } else {
                                              setEditingAccDeviceTypes([...editingAccDeviceTypes, dt.name]);
                                            }
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                                            isChk
                                              ? 'bg-blue-600/30 border-cyan-400 text-cyan-300'
                                              : 'bg-slate-800 border-slate-700 text-slate-400'
                                          }`}
                                        >
                                          {dt.name}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingAccId(null)}
                                  className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditAccessory(acc.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
                                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{acc.name}</span>
                                  </div>

                                  {acc.placeholder && (
                                    <p className="text-[10px] text-slate-400 italic pl-4">
                                      Dica: "{acc.placeholder}"
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAccId(acc.id);
                                      setEditingAccName(acc.name);
                                      setEditingAccPlaceholder(acc.placeholder || '');
                                      setEditingAccDeviceTypes(acc.deviceTypes && acc.deviceTypes.length > 0 ? acc.deviceTypes : ['ALL']);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                                    title="Editar Acessório"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAccessory(acc.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                    title="Remover Acessório"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1">
                                {(!acc.deviceTypes || acc.deviceTypes.length === 0 || acc.deviceTypes.includes('ALL') || acc.deviceTypes.includes('Todos')) ? (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-[9px] font-semibold text-blue-300">
                                    🌐 Todos os Equipamentos
                                  </span>
                                ) : (
                                  acc.deviceTypes.map((dt, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[9px] font-semibold text-cyan-300"
                                    >
                                      {dt}
                                    </span>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 3: FORMAS DE PAGAMENTO */}
          {osSubTab === 'PAYMENTS' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Formas de Pagamento Disponíveis</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Personalize os métodos de pagamento aceitos na OS e no caixa (ative/desative ou cadastre novos).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetPayments}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Formas Padrão</span>
                </button>
              </div>

              {/* Form to add payment method */}
              <form onSubmit={handleAddPaymentMethod} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="text"
                  value={newPaymentName}
                  onChange={(e) => setNewPaymentName(e.target.value)}
                  placeholder="Digite a nova forma de pagamento (ex: Pix Parcelado, PicPay, PagSeguro Link, Vale Presente)..."
                  className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                    isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Forma</span>
                </button>
              </form>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map((pay) => {
                  const isEditing = editingPaymentId === pay.id;
                  const isActive = pay.isActive !== false;

                  return (
                    <div
                      key={pay.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs transition-opacity ${
                        !isActive ? 'opacity-50' : 'opacity-100'
                      } ${
                        isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingPaymentName}
                            onChange={(e) => setEditingPaymentName(e.target.value)}
                            className={`flex-1 px-2 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                              isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditPayment(pay.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPaymentId(null)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                            <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{pay.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentMethod(pay.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {isActive ? 'Ativo' : 'Inativo'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingPaymentId(pay.id);
                                setEditingPaymentName(pay.name);
                              }}
                              className="p-1 text-slate-400 hover:text-cyan-400 rounded-md cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {!pay.isSystem && (
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(pay.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded-md cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 4: STATUS DE OS & KANBAN */}
          {osSubTab === 'STATUSES' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" />
                  <span>Gerenciar Status de Ordens de Serviço (OS)</span>
                </h4>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Adicione novos status personalizados, edite nomes e altere as cores dos emblemas para acompanhar o fluxo da sua assistência.
                </p>
              </div>

              {/* Form to add new status */}
              <form onSubmit={handleAddOSStatus} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-2xl border items-center ${
                isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    value={newOsLabel}
                    onChange={(e) => setNewOsLabel(e.target.value)}
                    placeholder="Nome do novo status (ex: Aguardando Peça Importada, Enviado Terceirizada)..."
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                      isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={newOsColor}
                    onChange={(e) => setNewOsColor(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-[#081226] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {Object.entries(colorPresets).map(([key, val]) => (
                      <option key={key} value={key} className={isDark ? 'bg-[#081226]' : 'bg-white'}>
                        Cor: {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              {/* Statuses List */}
              <div className="space-y-2">
                {osStatuses.map((st) => {
                  const isEditing = editingOsId === st.id;

                  return (
                    <div
                      key={st.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${
                        isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingOsLabel}
                            onChange={(e) => setEditingOsLabel(e.target.value)}
                            className={`flex-1 px-3 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                              isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditOSStatus(st.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOsId(null)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${st.colorBg} ${st.colorText} ${st.colorBorder}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${st.colorDot}`} />
                              <span>{st.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOsId(st.id);
                                setEditingOsLabel(st.label);
                              }}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Editar Status"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOSStatus(st.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Status"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 5: PRAZOS & TERMOS DE GARANTIA */}
          {osSubTab === 'WARRANTY' && (
            <form onSubmit={handleSaveCompany} className="space-y-5 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Padrões de Prazo, Previsão e Termos Legais de Garantia</span>
                </h4>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Defina o prazo padrão de garantia em dias e os textos legais impressos nas vias do cliente e da loja.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Prazo Padrão de Garantia (Dias)</label>
                  <input
                    type="number"
                    min="0"
                    value={company.defaultWarrantyDays || 90}
                    onChange={(e) => setCompany({ ...company, defaultWarrantyDays: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                      isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Chave PIX da Empresa (para impressos)</label>
                  <input
                    type="text"
                    value={company.pixKey || ''}
                    onChange={(e) => setCompany({ ...company, pixKey: e.target.value })}
                    placeholder="Ex: CNPJ, celular, e-mail ou chave aleatória"
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                      isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Texto Legal de Garantia (Impresso nas Vias de OS)</label>
                  <textarea
                    rows={4}
                    value={company.warrantyText || company.defaultWarrantyTerms || ''}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        warrantyText: e.target.value,
                        defaultWarrantyTerms: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 resize-none ${
                      isDark ? 'bg-[#040a17] border-blue-900/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 transition-all cursor-pointer"
                >
                  Salvar Termos de Garantia
                </button>
              </div>
            </form>
          )}

          {/* 6. THERMAL PRINT TEMPLATE MANAGEMENT & LIVE PREVIEW (MATCHING PHOTO) */}
          {osSubTab === 'PRINT_TEMPLATE' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Printer className="w-4 h-4" />
                    <span>Personalização do Cupom Térmico da OS (Modelo MSP Informática)</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure todos os dados do comprovante térmico. Qualquer alteração feita aqui atualiza o cupom impresso e a pré-visualização ao vivo.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetToPhotoDefault}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Restaura os dados originais idênticos à foto enviada"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrão da Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCompany}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </div>

              {/* Two Column Layout: Editor (Left) & Real-time Live Preview (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* LEFT: EDITABLE FORM CONTROLS */}
                <form onSubmit={handleSaveCompany} className="xl:col-span-7 space-y-5">
                  
                  {/* Card 1: Identificação da Loja no Cupom */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. Cabeçalho & Dados da Loja no Cupom</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Nome Fantasia / Comercial</label>
                        <input
                          type="text"
                          value={company.commercialName || ''}
                          onChange={(e) => setCompany({ ...company, commercialName: e.target.value })}
                          placeholder="MSP INFORMATICA"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Proprietário / Responsável</label>
                        <input
                          type="text"
                          value={company.ownerName || ''}
                          onChange={(e) => setCompany({ ...company, ownerName: e.target.value })}
                          placeholder="Vicente Pereira Dias"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Slogan / Frase</label>
                        <input
                          type="text"
                          value={company.slogan || ''}
                          onChange={(e) => setCompany({ ...company, slogan: e.target.value })}
                          placeholder="A TECNOLOGIA SIMPLIFICADA"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">CNPJ / CPF</label>
                        <input
                          type="text"
                          value={company.cnpj || company.cnpjCpf || ''}
                          onChange={(e) => setCompany({ ...company, cnpj: e.target.value, cnpjCpf: e.target.value })}
                          placeholder="46.686.632/0001-51"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">WhatsApp de Contato</label>
                        <input
                          type="text"
                          value={company.phone || ''}
                          onChange={(e) => setCompany({ ...company, phone: e.target.value, whatsapp: e.target.value })}
                          placeholder="(88) 9 8832-3089"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">CEP</label>
                        <input
                          type="text"
                          value={company.zipCode || ''}
                          onChange={(e) => setCompany({ ...company, zipCode: e.target.value })}
                          placeholder="62215-000"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Bairro</label>
                        <input
                          type="text"
                          value={company.neighborhood || ''}
                          onChange={(e) => setCompany({ ...company, neighborhood: e.target.value })}
                          placeholder="CENTRAL"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block font-bold mb-1">Cidade</label>
                          <input
                            type="text"
                            value={company.city || ''}
                            onChange={(e) => setCompany({ ...company, city: e.target.value })}
                            placeholder="IPAPORANGA"
                            className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                              isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">UF</label>
                          <input
                            type="text"
                            value={company.state || ''}
                            onChange={(e) => setCompany({ ...company, state: e.target.value })}
                            placeholder="CE"
                            className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                              isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Títulos e Subtítulos do Cupom */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>2. Títulos e Subtítulos do Comprovante</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Título do Documento</label>
                        <input
                          type="text"
                          value={company.osReceiptTitle || 'Ordem Servico'}
                          onChange={(e) => setCompany({ ...company, osReceiptTitle: e.target.value })}
                          placeholder="Ordem Servico"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Subtítulo Padrão da Via</label>
                        <input
                          type="text"
                          value={company.osReceiptSubtitle || 'Comprovante de Recebimento'}
                          onChange={(e) => setCompany({ ...company, osReceiptSubtitle: e.target.value })}
                          placeholder="Comprovante de Recebimento"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400">Sugestões rápidas:</span>
                        {[
                          'Comprovante de Recebimento',
                          'Comprovante de Entrega',
                          'Orçamento',
                          'Via do Cliente',
                          'Via Técnica de Bancada',
                        ].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setCompany({ ...company, osReceiptSubtitle: sug })}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                              company.osReceiptSubtitle === sug
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                : isDark
                                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Formato Padrão de Impressão</label>
                        <select
                          value={company.osDefaultPaperFormat || '80mm'}
                          onChange={(e) => setCompany({ ...company, osDefaultPaperFormat: e.target.value as any })}
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="80mm">🧾 Bobina 80mm (Padrão Térmico)</option>
                          <option value="58mm">📱 Bobina 58mm / 50mm (Mini Térmica)</option>
                          <option value="a4">📄 Folha A4</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Checklist com Caixas [ ] */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>3. Checklist de Acessórios no Cupom (Caixas [ ])</span>
                      </h5>
                      <button
                        type="button"
                        onClick={() =>
                          setCompany({
                            ...company,
                            osChecklistText:
                              'C/ CAPA [ ]   PELÍCULA NA TELA [ ]   / CARREGADOR [ ]\nGAVETA DE CHIP [ ]   / CARTÃO [ ]',
                          })
                        }
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Restaurar padrão da foto
                      </button>
                    </div>

                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Digite as linhas que serão impressas no cupom para marcação rápida na recepção do aparelho:
                    </p>

                    <textarea
                      rows={3}
                      value={
                        company.osChecklistText ||
                        'C/ CAPA [ ]   PELÍCULA NA TELA [ ]   / CARREGADOR [ ]\nGAVETA DE CHIP [ ]   / CARTÃO [ ]'
                      }
                      onChange={(e) => setCompany({ ...company, osChecklistText: e.target.value })}
                      placeholder="C/ CAPA [ ]   PELÍCULA NA TELA [ ]   / CARREGADOR [ ]&#10;GAVETA DE CHIP [ ]   / CARTÃO [ ]"
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-400 ${
                        isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Card 4: Caixas e Seções Exibidas no Cupom */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>4. Seções e Caixas Retangulares Exibidas</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={company.osShowCustomerAddress !== false}
                          onChange={(e) => setCompany({ ...company, osShowCustomerAddress: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold">Exibir Endereço/Bairro/Cidade do Cliente</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={company.osShowProblemBox !== false}
                          onChange={(e) => setCompany({ ...company, osShowProblemBox: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold">Exibir Caixa com Borda para "Problema"</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={company.osShowLaudoBox !== false}
                          onChange={(e) => setCompany({ ...company, osShowLaudoBox: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold">Exibir Caixa com Borda para "Laudo"</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={company.osShowNotesBox !== false}
                          onChange={(e) => setCompany({ ...company, osShowNotesBox: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold">Exibir Caixa de Observações</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={company.osShowSignatures !== false}
                          onChange={(e) => setCompany({ ...company, osShowSignatures: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold">Exibir Linhas de Assinatura (Responsável e Cliente)</span>
                      </label>
                    </div>
                  </div>

                  {/* Card 5: Rótulos das Assinaturas */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>5. Rótulos das Assinaturas</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Rótulo da 1ª Assinatura</label>
                        <input
                          type="text"
                          value={company.osResponsibleSignLabel || 'Ass. do Responsável'}
                          onChange={(e) => setCompany({ ...company, osResponsibleSignLabel: e.target.value })}
                          placeholder="Ass. do Responsável"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Rótulo da 2ª Assinatura</label>
                        <input
                          type="text"
                          value={company.osCustomerSignLabel || 'Ass. do Cliente'}
                          onChange={(e) => setCompany({ ...company, osCustomerSignLabel: e.target.value })}
                          placeholder="Ass. do Cliente"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-hidden focus:border-cyan-400 ${
                            isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Termos de Garantia e Rodapé */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>6. Termos Legais e Garantia no Rodapé</span>
                      </h5>
                      <button
                        type="button"
                        onClick={() =>
                          setCompany({
                            ...company,
                            osFooterTerms:
                              'Garantia de 90 dias sobre serviços e peças\nGuarde essa OS ela é a sua garantia do serviço\nA Garantia não cobre mau uso',
                          })
                        }
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Restaurar padrão da foto
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={
                        company.osFooterTerms ||
                        'Garantia de 90 dias sobre serviços e peças\nGuarde essa OS ela é a sua garantia do serviço\nA Garantia não cobre mau uso'
                      }
                      onChange={(e) => setCompany({ ...company, osFooterTerms: e.target.value })}
                      placeholder="Garantia de 90 dias sobre serviços e peças&#10;Guarde essa OS ela é a sua garantia do serviço&#10;A Garantia não cobre mau uso"
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-sans focus:outline-hidden focus:border-cyan-400 leading-relaxed ${
                        isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar Todas as Configurações do Cupom</span>
                    </button>
                  </div>
                </form>

                {/* RIGHT: REAL-TIME LIVE THERMAL RECEIPT PREVIEW (IDENTICAL TO PHOTO) */}
                <div className="xl:col-span-5 sticky top-6 space-y-3">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#070d1e] border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                    
                    {/* Preview Topbar with Paper Size Selector */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/50">
                      <div>
                        <span className="text-xs font-bold text-cyan-400 block">Pré-visualização em Tempo Real</span>
                        <span className="text-[10px] text-slate-400">Modelo idêntico à sua impressora térmica</span>
                      </div>

                      <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setPreviewPaperFormat('80mm')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            previewPaperFormat === '80mm'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          80mm
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPaperFormat('58mm')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            previewPaperFormat === '58mm'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          58mm
                        </button>
                      </div>
                    </div>

                    {/* Visual Thermal Receipt Paper Effect */}
                    <div className="flex justify-center p-2 bg-slate-300/80 rounded-xl overflow-x-auto">
                      <div className="bg-white shadow-2xl rounded-sm transition-all border border-slate-400 my-2">
                        <ThermalOrderReceipt
                          order={samplePreviewOrder}
                          company={company}
                          paperFormat={previewPaperFormat}
                          subtitle={company.osReceiptSubtitle || 'Comprovante de Recebimento'}
                        />
                      </div>
                    </div>

                    <p className="text-center text-[10px] text-slate-400 mt-2">
                      💡 Todas as alterações feitas nos campos ao lado são refletidas aqui instantaneamente.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCT CATEGORIES MANAGEMENT */}
      {activeTab === 'CATEGORIES' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div>
            <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Gerenciar Categorias de Produtos</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Adicione, edite ou remova as categorias do catálogo de produtos. As categorias configuradas aqui serão exibidas na barra superior de filtros e na criação de produtos.
            </p>
          </div>

          {/* Form to add new category */}
          <form onSubmit={handleAddCategory} className={`flex items-center gap-3 p-3 rounded-2xl border ${
            isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Digite o nome da nova categoria (ex: Capinhas, Películas, Notebooks)..."
              className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-cyan-400 ${
                isDark ? 'bg-[#081226] border-blue-900/80 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Categoria</span>
            </button>
          </form>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs ${
                    isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className={`flex-1 px-2 py-1 border border-cyan-400 rounded-lg text-xs focus:outline-hidden ${
                          isDark ? 'bg-[#081226] text-white' : 'bg-white text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(cat.id)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-cyan-400" />
                        <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditingCatName(cat.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Editar Categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Remover Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & PERMISSIONS */}
      {activeTab === 'USERS' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div>
            <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Usuários e Níveis de Acesso</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie a equipe técnica, vendedores, operadores de caixa e suas permissões no sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</h4>
                    <p className="text-[11px] text-cyan-400 font-bold">{user.role}</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div>
            <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Histórico de Atividades & Auditoria</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Registros automáticos de criação, edição e exclusão de registros para segurança operacional.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <p className={`text-xs text-center py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Nenhum registro de auditoria no momento.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                    isDark ? 'bg-[#040a17] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.action}</p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Operador: <span className="text-cyan-400 font-bold">{log.userName}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] whitespace-nowrap shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BACKUP & RESTAURAÇÃO */}
      {activeTab === 'BACKUP' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div>
            <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Download className="w-5 h-5 text-cyan-400" />
              <span>Backup, Exportação e Restauração de Dados</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Exporte todos os cadastros da assistência em arquivo JSON seguro ou recarregue dados salvos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Export */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Exportar Backup Completo</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Gera um arquivo JSON contendo todas as OS, clientes, estoque, vendas e configurações.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup JSON</span>
              </button>
            </div>

            {/* Import */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#040a17] border-blue-900/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Restaurar Backup</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Restaure os dados do sistema a partir de um arquivo JSON exportado previamente.
                </p>
              </div>
              <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                <Upload className="w-4 h-4" />
                <span>Carregar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Google Drive Isolated Cloud Backup */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-gradient-to-b from-[#031525] to-[#040a17] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-cyan-50/70 border-cyan-300'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Drive (Individual)</h4>
                  </div>
                  {authSession?.email && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40">
                      Conectado
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {authSession?.email ? (
                    <span>Backup isolado na conta: <strong className="text-cyan-400">{authSession.email}</strong></span>
                  ) : (
                    <span>Conecte sua conta do Google no login para ativar a sincronização individual.</span>
                  )}
                </p>
                {driveSyncMessage && (
                  <p className="text-[11px] font-bold text-cyan-400 mt-2 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                    {driveSyncMessage}
                  </p>
                )}
                {driveSyncStatus?.lastSync && (
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Último backup: {new Date(driveSyncStatus.lastSync).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isDriveSyncing || !authSession?.email}
                  onClick={handleManualGoogleDriveSync}
                  className="py-2.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Upload className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isDriveSyncing ? 'Salvando...' : 'Salvar no Drive'}</span>
                </button>
                <button
                  type="button"
                  disabled={isDriveSyncing || !authSession?.email}
                  onClick={handleManualGoogleDriveRestore}
                  className={`py-2.5 px-2 border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restaurar do Drive</span>
                </button>
              </div>
            </div>

            {/* Reset to Demo */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#040a17] border-rose-900/40' : 'bg-rose-50/50 border-rose-200'
            }`}>
              <div>
                <h4 className="font-bold text-sm text-rose-400">Restaurar Dados Demo</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recarrega a base inicial de demonstração da MSP Informática para testes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Base Demo</span>
              </button>
            </div>

            {/* System Formatter shortcut */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-gradient-to-b from-rose-950/30 to-[#040a17] border-rose-600/50 shadow-[0_0_15px_rgba(225,29,72,0.15)]' : 'bg-rose-50/80 border-rose-300'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <h4 className="font-bold text-sm text-rose-400">Formatador do Sistema</h4>
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Zere ordens, vendas ou faça um reset total do banco de dados com segurança.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenFormatTab}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Abrir Formatador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COMPRAS & FORNECEDORES */}
      {activeTab === 'PURCHASES_CONFIG' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${
          isDark
            ? 'bg-[#0b1328] border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-100'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div>
            <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Configurações de Compras e Fornecedores</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure o tempo de retenção do histórico de compras e gerencie o cadastro de fornecedores.
            </p>
          </div>

          {/* Configuração de Histórico */}
          <form onSubmit={handleSavePurchasesConfig} className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#040a17] border-blue-900/40' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-sm text-blue-400 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>Retenção do Histórico (Limite Rotativo)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Prazo de Retenção (Meses)
                </label>
                <select
                  value={purchasesConfig.historyLimitMonths}
                  onChange={(e) => setPurchasesConfig({
                    ...purchasesConfig,
                    historyLimitMonths: Number(e.target.value)
                  })}
                  className="w-full bg-[#080d1a] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={3}>3 Meses</option>
                  <option value={6}>6 Meses</option>
                  <option value={12}>12 Meses (Recomendado/Padrão)</option>
                  <option value={24}>24 Meses</option>
                  <option value={36}>36 Meses</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoDeleteExpired"
                  checked={purchasesConfig.autoDeleteExpired}
                  onChange={(e) => setPurchasesConfig({
                    ...purchasesConfig,
                    autoDeleteExpired: e.target.checked
                  })}
                  className="w-4 h-4 rounded text-blue-600 bg-[#080d1a] border-[#172b5c] focus:ring-blue-500"
                />
                <label htmlFor="autoDeleteExpired" className="text-xs text-slate-300 cursor-pointer">
                  Limpar registros antigos automaticamente (excluir após atingir o limite de meses)
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Salvar Configurações de Prazo
              </button>
            </div>
          </form>

          {/* Cadastro / Lista de Fornecedores */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#040a17] border-blue-900/40' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Gerenciamento de Fornecedores</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Adicione e gerencie os fornecedores de mercadorias da assistência técnica.
                </p>
              </div>

              {!isAddingSupplier && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplierId(null);
                    setSupplierNameInput('');
                    setSupplierCnpjInput('');
                    setSupplierPhoneInput('');
                    setSupplierEmailInput('');
                    setSupplierAddressInput('');
                    setSupplierNotesInput('');
                    setIsAddingSupplier(true);
                  }}
                  className="px-4 py-2 bg-[#0066ff] hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Fornecedor</span>
                </button>
              )}
            </div>

            {/* Formulário de Adicionar/Editar Fornecedor */}
            {isAddingSupplier && (
              <form onSubmit={handleSaveSupplier} className="p-4 bg-[#080d1a] rounded-2xl border border-blue-950/50 mb-6 space-y-4">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  {editingSupplierId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Nome do Fornecedor <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierNameInput}
                      onChange={(e) => setSupplierNameInput(e.target.value)}
                      placeholder="Ex: Distribuidora Tech Brasil"
                      className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={supplierCnpjInput}
                      onChange={(e) => setSupplierCnpjInput(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp / Whats</label>
                    <input
                      type="text"
                      value={supplierPhoneInput}
                      onChange={(e) => setSupplierPhoneInput(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</label>
                    <input
                      type="email"
                      value={supplierEmailInput}
                      onChange={(e) => setSupplierEmailInput(e.target.value)}
                      placeholder="contato@fornecedor.com"
                      className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={supplierAddressInput}
                      onChange={(e) => setSupplierAddressInput(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações Internas</label>
                  <textarea
                    rows={2}
                    value={supplierNotesInput}
                    onChange={(e) => setSupplierNotesInput(e.target.value)}
                    placeholder="Informações adicionais, prazos acordados, descontos..."
                    className="w-full bg-[#0d1730] border border-[#172b5c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    {editingSupplierId ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
                  </button>
                </div>
              </form>
            )}

            {/* Tabela de Fornecedores Cadastrados */}
            <div className="overflow-x-auto border border-[#172b5c] rounded-2xl bg-[#080d1a]">
              <table className="w-full text-left text-xs text-slate-200">
                <thead>
                  <tr className="border-b border-[#172b5c] text-slate-400 uppercase text-[10px] font-bold bg-[#0d1730]">
                    <th className="py-2.5 px-4">Nome / Razão Social</th>
                    <th className="py-2.5 px-4">CNPJ</th>
                    <th className="py-2.5 px-4">Contato</th>
                    <th className="py-2.5 px-4">E-mail / Endereço</th>
                    <th className="py-2.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172b5c]">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-semibold text-xs">
                        Nenhum fornecedor cadastrado.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-[#0c1836] transition-colors">
                        <td className="py-3 px-4 font-extrabold text-white">{sup.name}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{sup.cnpj || 'Não Informado'}</td>
                        <td className="py-3 px-4 text-slate-300">{sup.phone || 'Não Informado'}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          <div>{sup.email || ''}</div>
                          <div className="text-[10px] text-slate-500">{sup.address || ''}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditSupplier(sup)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg cursor-pointer transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(sup.id)}
                              className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg cursor-pointer transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: FORMATADOR DO SISTEMA */}
      {activeTab === 'SYSTEM_FORMAT' && (
        <SystemFormatTab
          isDark={isDark}
          onExportBackup={handleExportBackup}
        />
      )}
    </div>
  );
};
