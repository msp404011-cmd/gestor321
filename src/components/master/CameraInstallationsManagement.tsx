import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc
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
  CheckCircle, 
  AlertCircle,
  Calendar,
  Clock,
  Smartphone,
  Mail,
  CreditCard,
  QrCode,
  FileText,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Send,
  UserX,
  RefreshCw,
  MapPin,
  Building,
  Key,
  Maximize2,
  Share2,
  CheckCheck,
  Sparkles,
  Download,
  Banknote,
  MoreHorizontal,
  Save,
  CheckCircle2,
  Hourglass,
  BadgeCheck,
  MessageCircle,
  Fingerprint,
  PenTool
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { getTenantId } from '../../services/firestoreService';
import { CameraContractDocument } from './CameraContractDocument';

// Helper for copying text to clipboard in iframe/sandboxed environments
const copyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
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
const CopyButton: React.FC<{ text: string; title?: string; label?: string; iconOnly?: boolean }> = ({ text, title, label, iconOnly = false }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
        copied 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70'
      }`}
      title={title || "Copiar"}
    >
      {copied ? (
        <>
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 animate-in fade-in" />
          {!iconOnly && <span>{label ? 'Copiado!' : 'Copiado'}</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-400" />
          {!iconOnly && label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

export interface AppUserDevice {
  id: string;
  name: string;
  email: string;
  password: string;
}

export type InstallationPaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'OUTROS';
export type MonthlyPaymentMethod = 'PIX' | 'CARTAO' | 'BOLETO' | 'DINHEIRO' | 'OUTROS';

export interface CameraInstallationContract {
  id: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  clientName: string;
  cpf: string;
  birthDate: string;
  whatsapp: string;
  city: string;
  address: string;
  billingPhone: string;
  cameraCount: number;
  installationValue: number;
  installationPaymentMethod?: InstallationPaymentMethod;
  installationPaymentMethodOther?: string;
  monthlyValue: number;
  dueDay: number;
  paymentMethod: MonthlyPaymentMethod;
  paymentMethodOther?: string;
  signatureType?: 'SIGNATURE' | 'THUMBPRINT' | 'BOTH';
  devices: AppUserDevice[];
  documentImages?: string[];
  documentImageUrl?: string; // Legacy fallback
  notes?: string;
  scheduledDate?: string;
  concludedAt?: string;
  inactivatedAt?: string;
  inactivationReason?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'local_camera_installation_contracts';

// Helper to get all document images from contract with legacy fallback
export const getContractDocumentImages = (contract: Partial<CameraInstallationContract>): string[] => {
  if (Array.isArray(contract.documentImages) && contract.documentImages.length > 0) {
    return contract.documentImages;
  }
  if (contract.documentImageUrl) {
    return [contract.documentImageUrl];
  }
  return [];
};

// -------------------------------------------------------------
// TEXT GENERATORS WITH BEAUTIFUL EMOJIS & CLEAR SECTIONS
// -------------------------------------------------------------

export const generateWhatsAppFormattedText = (contract: Partial<CameraInstallationContract>): string => {
  const name = contract.clientName || 'Cliente';
  const cpfFormatted = contract.cpf ? contract.cpf : 'Não informado';
  const birthFormatted = contract.birthDate 
    ? (contract.birthDate.includes('-') 
        ? contract.birthDate.split('-').reverse().join('/') 
        : contract.birthDate) 
    : 'Não informada';
  const whatsappFormatted = contract.whatsapp || 'Não informado';
  const billingFormatted = contract.billingPhone || contract.whatsapp || 'Não informado';
  const cityFormatted = contract.city || 'Não informada';
  const addressFormatted = contract.address || 'Não informado';
  const cameraCount = contract.cameraCount || 1;
  const instVal = (Number(contract.installationValue) || 0).toFixed(2).replace('.', ',');
  const monthVal = (Number(contract.monthlyValue) || 0).toFixed(2).replace('.', ',');
  const dueDay = contract.dueDay || 10;
  
  // Installation payment description
  let instPayDesc: string = contract.installationPaymentMethod || 'PIX';
  if (instPayDesc === 'OUTROS' && contract.installationPaymentMethodOther) {
    instPayDesc = `Outros (${contract.installationPaymentMethodOther})`;
  }

  // Monthly payment description
  let monthPayDesc: string = contract.paymentMethod || 'PIX';
  if (monthPayDesc === 'OUTROS' && contract.paymentMethodOther) {
    monthPayDesc = `Outros (${contract.paymentMethodOther})`;
  }

  const notesSection = contract.notes && contract.notes.trim() 
    ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📝 *OBSERVAÇÕES DO SERVIÇO:*\n${contract.notes.trim()}\n` 
    : '';

  return `🛡️✨ *FICHA DE INSTALAÇÃO & MONITORAMENTO DE CÂMERAS* ✨🛡️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *DADOS DO CLIENTE:*
• 📝 *Nome Completo:* ${name}
• 🪪 *CPF:* ${cpfFormatted}
• 🎂 *Data de Nascimento:* ${birthFormatted}
• 📱 *WhatsApp:* ${whatsappFormatted}
• 📍 *Endereço / Local:* ${addressFormatted}
• 🏙️ *Cidade:* ${cityFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📹 *DETALHES DO SISTEMA DE CÂMERAS:*
• 🎥 *Quantidade de Câmeras:* ${cameraCount} ${cameraCount === 1 ? 'Câmera instalada' : 'Câmeras instaladas'} 📹
• 🛠️ *Valor da Instalação:* R$ ${instVal} (${instPayDesc})
• 💰 *Valor da Mensalidade:* R$ ${monthVal}
• 📅 *Dia de Vencimento:* Todo dia ${dueDay < 10 ? `0${dueDay}` : dueDay} de cada mês 🗓️
• 💳 *Opção de Pagamento da Mensalidade:* ${monthPayDesc} 💵
• 📲 *Contato para Cobrança:* ${billingFormatted}
${notesSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *Você entendeu? Ficou alguma dúvida? Se entendeu me confirme, se ficou alguma dúvida me passe por favor* 🙏✨`;
};

export const generateBillingQuickText = (contract: Partial<CameraInstallationContract>): string => {
  const name = contract.clientName || 'Cliente';
  const monthVal = (Number(contract.monthlyValue) || 0).toFixed(2).replace('.', ',');
  const dueDay = contract.dueDay || 10;
  let payMethod = contract.paymentMethod || 'PIX';
  if (payMethod === 'OUTROS' && contract.paymentMethodOther) {
    payMethod = `Outros (${contract.paymentMethodOther})` as MonthlyPaymentMethod;
  }
  const cameraCount = contract.cameraCount || 1;

  return `🔔✨ *LEMBRETE DE MENSALIDADE - MONITORAMENTO DE CÂMERAS* ✨🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá *${name}*, tudo bem com você? Esperamos que esteja tendo um ótimo dia! 🌟

Informamos os dados para pagamento da sua mensalidade de monitoramento de segurança:

📹 *Serviço:* Monitoramento de ${cameraCount} Câmera(s)
💰 *Valor da Mensalidade:* R$ ${monthVal}
📅 *Vencimento:* Todo dia ${dueDay < 10 ? `0${dueDay}` : dueDay} de cada mês
💳 *Forma de Pagamento:* ${payMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📲 *Chave PIX / Dados:* Caso precise da nossa chave PIX ou código de barras, solicite por aqui!
🧾 Após realizar o pagamento, por favor nos envie o comprovante para confirmação.

Muito obrigado pela parceria e conte sempre conosco para o que precisar! 🤝🔒✨`;
};

export const generateDevicesOnlyText = (contract: Partial<CameraInstallationContract>): string => {
  const name = contract.clientName || 'Cliente';
  if (!contract.devices || contract.devices.length === 0) {
    return `📱🔐 *ACESSOS DO APP DE CÂMERAS - ${name}*\n\nNenhum aparelho cadastrado no momento.`;
  }
  const items = contract.devices.map((d, i) => 
    `📱 *${d.name || `Aparelho 0${i + 1}`}*\n👤 *Login / Email:* ${d.email || 'Não informado'}\n🔑 *Senha:* ${d.password || 'Não informada'}`
  ).join('\n\n');

  return `📱🔐 *ACESSOS AO APLICATIVO DE CÂMERAS - ${name}* 🔐📱
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${items}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 *Dica:* Guarde seus dados de acesso com segurança e não compartilhe com desconhecidos! ✨🚀`;
};

export const CameraInstallationsManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'NEW_INSTALLATION' | 'PENDING_INSTALLATIONS' | 'ACTIVE_CLIENTS' | 'INACTIVE_CLIENTS'>('NEW_INSTALLATION');
  const [contracts, setContracts] = useState<CameraInstallationContract[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'PIX' | 'CARTAO' | 'BOLETO' | 'DINHEIRO' | 'OUTROS'>('ALL');

  // Form states for New / Editing Installation
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [cameraCount, setCameraCount] = useState<number>(1);
  const [installationValue, setInstallationValue] = useState<string>('');
  const [installationPaymentMethod, setInstallationPaymentMethod] = useState<InstallationPaymentMethod>('PIX');
  const [installationPaymentMethodOther, setInstallationPaymentMethodOther] = useState<string>('');
  const [monthlyValue, setMonthlyValue] = useState<string>('');
  const [dueDay, setDueDay] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<MonthlyPaymentMethod>('PIX');
  const [paymentMethodOther, setPaymentMethodOther] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'SIGNATURE' | 'THUMBPRINT' | 'BOTH'>('SIGNATURE');
  const [devices, setDevices] = useState<AppUserDevice[]>([
    { id: 'dev-1', name: '', email: '', password: '' }
  ]);
  const [documentImages, setDocumentImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Password visibility map for devices
  const [showDevicePasswords, setShowDevicePasswords] = useState<Record<string, boolean>>({});

  // Multiple Image Preview Modal State
  const [previewImageState, setPreviewImageState] = useState<{
    images: string[];
    currentIndex: number;
  } | null>(null);

  // WhatsApp Text Preview & Copy Modal
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    contract: Partial<CameraInstallationContract>;
    activeTab: 'FULL' | 'BILLING' | 'DEVICES';
  } | null>(null);

  // Contract PDF Preview & Print Modal
  const [contractModalData, setContractModalData] = useState<Partial<CameraInstallationContract> | null>(null);

  // Deletion, Inactivation and Conclusion confirmation modals
  const [contractToDelete, setContractToDelete] = useState<CameraInstallationContract | null>(null);
  const [contractToInactivate, setContractToInactivate] = useState<CameraInstallationContract | null>(null);
  const [inactivationReason, setInactivationReason] = useState('');
  const [contractToConclude, setContractToConclude] = useState<CameraInstallationContract | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getUserAccountEmail = (): string => {
    const tenant = getTenantId();
    if (tenant === 'msp404011@gmail.com' || tenant === 'mmspmartins62@gmail.com') {
      return 'mmspmartins62@gmail.com';
    }
    return tenant || 'mmspmartins62@gmail.com';
  };

  // Sync with Firestore & localStorage
  useEffect(() => {
    const userEmail = getUserAccountEmail();
    let isSubscribed = true;

    try {
      const collectionRef = collection(db, `accounts/${userEmail}/camera_installation_contracts`);
      const unsub = onSnapshot(
        collectionRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const list: CameraInstallationContract[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              // Normalizes images array
              const images = Array.isArray(data.documentImages) && data.documentImages.length > 0
                ? data.documentImages
                : (data.documentImageUrl ? [data.documentImageUrl] : []);

              list.push({ 
                id: docSnap.id, 
                status: data.status || 'ACTIVE',
                ...data,
                documentImages: images
              } as CameraInstallationContract);
            });
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setContracts(list);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            } catch (err) {
              console.error("Local storage error:", err);
            }
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore onSnapshot error:", error);
          setLoading(false);
        }
      );

      return () => {
        isSubscribed = false;
        unsub();
      };
    } catch (err) {
      console.warn("Firebase sync error:", err);
      setLoading(false);
    }
  }, []);

  // Format CPF as typing
  const handleCpfChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    let formatted = numbers;
    if (numbers.length > 9) {
      formatted = `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    } else if (numbers.length > 6) {
      formatted = `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else if (numbers.length > 3) {
      formatted = `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    }
    setCpf(formatted);
  };

  // Format Phone as typing
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length > 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length > 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length > 2) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    return numbers;
  };

  // Device management functions
  const handleAddDevice = () => {
    setDevices(prev => [
      ...prev,
      { id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name: '', email: '', password: '' }
    ]);
  };

  const handleRemoveDevice = (id: string) => {
    if (devices.length <= 1) {
      setDevices([{ id: `dev-${Date.now()}`, name: '', email: '', password: '' }]);
      return;
    }
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const handleUpdateDevice = (id: string, field: keyof AppUserDevice, value: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const toggleShowDevicePassword = (id: string) => {
    setShowDevicePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle MULTIPLE Image Uploads with compression
  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
      return;
    }

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1200;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.75));
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const newImages = await Promise.all(imageFiles.map(processFile));
      setDocumentImages(prev => [...prev, ...newImages]);
      showToast(`${newImages.length} ${newImages.length === 1 ? 'foto do documento anexada' : 'fotos de documentos anexadas'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao processar imagens:", err);
      showToast('Erro ao processar algumas fotos.', 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImageAtIndex = (index: number) => {
    setDocumentImages(prev => prev.filter((_, i) => i !== index));
    showToast('Foto removida.');
  };

  const handleClearAllImages = () => {
    setDocumentImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Todas as fotos foram removidas.');
  };

  // Reset form
  const handleResetForm = () => {
    setEditingContractId(null);
    setClientName('');
    setCpf('');
    setBirthDate('');
    setWhatsapp('');
    setCity('');
    setAddress('');
    setBillingPhone('');
    setCameraCount(1);
    setInstallationValue('');
    setInstallationPaymentMethod('PIX');
    setInstallationPaymentMethodOther('');
    setMonthlyValue('');
    setDueDay(10);
    setPaymentMethod('PIX');
    setPaymentMethodOther('');
    setSignatureType('SIGNATURE');
    setDevices([{ id: 'dev-1', name: '', email: '', password: '' }]);
    setDocumentImages([]);
    setNotes('');
  };

  // Current Form as Partial Contract for WhatsApp Preview
  const getCurrentFormContract = (): Partial<CameraInstallationContract> => {
    const cleanedDevices = devices
      .map(d => ({
        ...d,
        name: d.name.trim(),
        email: d.email.trim(),
        password: d.password.trim()
      }))
      .filter(d => d.name || d.email || d.password);

    return {
      clientName: clientName.trim() || 'Nome do Cliente',
      cpf: cpf.trim(),
      birthDate: birthDate.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      address: address.trim(),
      billingPhone: billingPhone.trim() || whatsapp.trim(),
      cameraCount: Number(cameraCount) || 1,
      installationValue: parseFloat(installationValue.replace(',', '.')) || 0,
      installationPaymentMethod,
      installationPaymentMethodOther: installationPaymentMethodOther.trim(),
      monthlyValue: parseFloat(monthlyValue.replace(',', '.')) || 0,
      dueDay: Number(dueDay) || 10,
      paymentMethod,
      paymentMethodOther: paymentMethodOther.trim(),
      signatureType,
      devices: cleanedDevices.length > 0 ? cleanedDevices : [{ id: 'dev-1', name: clientName.trim() || 'Cliente', email: '', password: '' }],
      documentImages,
      notes: notes.trim()
    };
  };

  // Save Installation: status can be 'PENDING' (Salvar Marcação / Em Andamento) or 'ACTIVE' (Concluir Instalação e Ativar Cliente)
  const handleSaveContractWithStatus = async (targetStatus: 'PENDING' | 'ACTIVE', e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!clientName.trim()) {
      showToast('Por favor, informe o Nome Completo do cliente.', 'error');
      return;
    }

    const userEmail = getUserAccountEmail();
    const isEditing = !!editingContractId;
    const contractId = editingContractId || `cam-inst-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Filter valid devices
    const cleanedDevices = devices
      .map(d => ({
        ...d,
        name: d.name.trim(),
        email: d.email.trim(),
        password: d.password.trim()
      }))
      .filter(d => d.name || d.email || d.password);

    const nowIso = new Date().toISOString();
    const existing = isEditing ? contracts.find(c => c.id === contractId) : null;

    const newContract: CameraInstallationContract = {
      id: contractId,
      status: targetStatus,
      clientName: clientName.trim(),
      cpf: cpf.trim(),
      birthDate: birthDate.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      address: address.trim(),
      billingPhone: billingPhone.trim() || whatsapp.trim(),
      cameraCount: Number(cameraCount) || 1,
      installationValue: parseFloat(installationValue.replace(',', '.')) || 0,
      installationPaymentMethod,
      installationPaymentMethodOther: installationPaymentMethod === 'OUTROS' ? installationPaymentMethodOther.trim() : undefined,
      monthlyValue: parseFloat(monthlyValue.replace(',', '.')) || 0,
      dueDay: Number(dueDay) || 10,
      paymentMethod,
      paymentMethodOther: paymentMethod === 'OUTROS' ? paymentMethodOther.trim() : undefined,
      signatureType,
      devices: cleanedDevices.length > 0 ? cleanedDevices : [{ id: `dev-${Date.now()}`, name: clientName.trim(), email: '', password: '' }],
      documentImages: documentImages.length > 0 ? documentImages : undefined,
      documentImageUrl: documentImages[0] || undefined, // Legacy fallback
      notes: notes.trim() || undefined,
      concludedAt: targetStatus === 'ACTIVE' ? (existing?.concludedAt || nowIso) : undefined,
      createdAt: isEditing ? (existing?.createdAt || nowIso) : nowIso,
      updatedAt: nowIso
    };

    // Update local state immediately
    let updatedList: CameraInstallationContract[];
    if (isEditing) {
      updatedList = contracts.map(c => c.id === contractId ? newContract : c);
    } else {
      updatedList = [newContract, ...contracts];
    }
    setContracts(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch {}

    // Save to Firestore
    try {
      const docRef = doc(db, `accounts/${userEmail}/camera_installation_contracts`, contractId);
      await setDoc(docRef, newContract, { merge: true });
    } catch (err) {
      console.warn("Error saving to Firebase:", err);
    }

    if (targetStatus === 'ACTIVE') {
      showToast(isEditing ? 'Instalação atualizada e cliente ativo!' : '✅ Instalação concluída e cliente ativado com sucesso!');
      handleResetForm();
      setActiveSubTab('ACTIVE_CLIENTS');
    } else {
      showToast('💾 Instalação salva como Agendada / Em Andamento! Você pode concluí-la a qualquer momento.');
      handleResetForm();
      setActiveSubTab('PENDING_INSTALLATIONS');
    }
  };

  // Directly Conclude a Pending Contract
  const handleQuickConcludeContract = async (contract: CameraInstallationContract) => {
    const userEmail = getUserAccountEmail();
    const nowIso = new Date().toISOString();

    const updatedContract: CameraInstallationContract = {
      ...contract,
      status: 'ACTIVE',
      concludedAt: nowIso,
      updatedAt: nowIso
    };

    const updatedList = contracts.map(c => c.id === contract.id ? updatedContract : c);
    setContracts(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      const docRef = doc(db, `accounts/${userEmail}/camera_installation_contracts`, contract.id);
      await setDoc(docRef, updatedContract, { merge: true });
    } catch (err) {
      console.warn("Error concluding in Firebase:", err);
    }

    showToast(`✅ Instalação de "${contract.clientName}" marcada como Concluída! Cliente agora está Ativo.`);
    setContractToConclude(null);
    setActiveSubTab('ACTIVE_CLIENTS');
  };

  // Load contract to edit
  const handleStartEdit = (contract: CameraInstallationContract) => {
    setEditingContractId(contract.id);
    setClientName(contract.clientName || '');
    setCpf(contract.cpf || '');
    setBirthDate(contract.birthDate || '');
    setWhatsapp(contract.whatsapp || '');
    setCity(contract.city || '');
    setAddress(contract.address || '');
    setBillingPhone(contract.billingPhone || '');
    setCameraCount(contract.cameraCount || 1);
    setInstallationValue(contract.installationValue ? String(contract.installationValue) : '');
    setInstallationPaymentMethod(contract.installationPaymentMethod || 'PIX');
    setInstallationPaymentMethodOther(contract.installationPaymentMethodOther || '');
    setMonthlyValue(contract.monthlyValue ? String(contract.monthlyValue) : '');
    setDueDay(contract.dueDay || 10);
    setPaymentMethod(contract.paymentMethod || 'PIX');
    setPaymentMethodOther(contract.paymentMethodOther || '');
    setSignatureType(contract.signatureType || 'SIGNATURE');
    setDevices(contract.devices && contract.devices.length > 0 ? contract.devices : [{ id: 'dev-1', name: '', email: '', password: '' }]);
    setDocumentImages(getContractDocumentImages(contract));
    setNotes(contract.notes || '');
    setActiveSubTab('NEW_INSTALLATION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Move Active Client to Inactive
  const handleConfirmInactivate = async () => {
    if (!contractToInactivate) return;

    const userEmail = getUserAccountEmail();
    const nowIso = new Date().toISOString();

    const updatedContract: CameraInstallationContract = {
      ...contractToInactivate,
      status: 'INACTIVE',
      inactivatedAt: nowIso,
      inactivationReason: inactivationReason.trim() || 'Desativado pelo administrador',
      updatedAt: nowIso
    };

    const updatedList = contracts.map(c => c.id === contractToInactivate.id ? updatedContract : c);
    setContracts(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      const docRef = doc(db, `accounts/${userEmail}/camera_installation_contracts`, contractToInactivate.id);
      await setDoc(docRef, updatedContract, { merge: true });
    } catch (err) {
      console.warn("Error inactivating in Firebase:", err);
    }

    showToast(`Cliente "${contractToInactivate.clientName}" movido para Inativos.`);
    setContractToInactivate(null);
    setInactivationReason('');
  };

  // Reactivate Inactive Client
  const handleReactivateClient = async (contract: CameraInstallationContract) => {
    const userEmail = getUserAccountEmail();
    const nowIso = new Date().toISOString();

    const updatedContract: CameraInstallationContract = {
      ...contract,
      status: 'ACTIVE',
      inactivatedAt: undefined,
      inactivationReason: undefined,
      updatedAt: nowIso
    };

    const updatedList = contracts.map(c => c.id === contract.id ? updatedContract : c);
    setContracts(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      const docRef = doc(db, `accounts/${userEmail}/camera_installation_contracts`, contract.id);
      await setDoc(docRef, updatedContract, { merge: true });
    } catch (err) {
      console.warn("Error reactivating in Firebase:", err);
    }

    showToast(`Cliente "${contract.clientName}" reativado com sucesso!`);
    setActiveSubTab('ACTIVE_CLIENTS');
  };

  // Delete Contract completely
  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;

    const userEmail = getUserAccountEmail();
    const updatedList = contracts.filter(c => c.id !== contractToDelete.id);
    setContracts(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      const docRef = doc(db, `accounts/${userEmail}/camera_installation_contracts`, contractToDelete.id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Error deleting in Firebase:", err);
    }

    showToast(`Instalação de "${contractToDelete.clientName}" excluída.`);
    setContractToDelete(null);
  };

  // Quick Copy WhatsApp Full Text to Clipboard
  const handleQuickCopyWhatsAppFull = (contract: Partial<CameraInstallationContract>) => {
    const text = generateWhatsAppFormattedText(contract);
    if (copyToClipboard(text)) {
      showToast(`📋 Texto completo de "${contract.clientName || 'Cliente'}" copiado para o WhatsApp!`);
    }
  };

  // Open WhatsApp with text
  const handleOpenWhatsAppDirect = (phoneStr: string, text: string) => {
    const cleaned = (phoneStr || '').replace(/\D/g, '');
    if (!cleaned) {
      showToast('Número de WhatsApp não informado.', 'error');
      return;
    }
    const fullNumber = cleaned.length <= 11 ? `55${cleaned}` : cleaned;
    window.open(`https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered lists for each status
  const pendingContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'PENDING');
  }, [contracts]);

  const activeContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'ACTIVE' || (!c.status && c.status !== 'PENDING' && c.status !== 'INACTIVE'));
  }, [contracts]);

  const inactiveContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'INACTIVE');
  }, [contracts]);

  const filterMatches = (c: CameraInstallationContract) => {
    if (filterPayment !== 'ALL' && c.paymentMethod !== filterPayment) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      (c.cpf || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').toLowerCase().includes(q) ||
      (c.billingPhone || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  };

  const filteredPendingList = useMemo(() => pendingContracts.filter(filterMatches), [pendingContracts, searchQuery, filterPayment]);
  const filteredActiveList = useMemo(() => activeContracts.filter(filterMatches), [activeContracts, searchQuery, filterPayment]);
  const filteredInactiveList = useMemo(() => inactiveContracts.filter(filterMatches), [inactiveContracts, searchQuery, filterPayment]);

  // Totals calculations
  const totals = useMemo(() => {
    const totalActiveClients = activeContracts.length;
    const totalPendingInstallations = pendingContracts.length;
    const totalCameras = activeContracts.reduce((sum, c) => sum + (Number(c.cameraCount) || 1), 0);
    const totalMonthly = activeContracts.reduce((sum, c) => sum + (Number(c.monthlyValue) || 0), 0);
    const totalInstallation = activeContracts.reduce((sum, c) => sum + (Number(c.installationValue) || 0), 0);
    return {
      totalActiveClients,
      totalPendingInstallations,
      totalCameras,
      totalMonthly,
      totalInstallation,
      totalInactiveClients: inactiveContracts.length
    };
  }, [activeContracts, pendingContracts, inactiveContracts]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B1221] text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
            <span className="text-xs font-bold">{toast.text}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER & SECTOR BRANDING */}
      <div className="p-4 sm:p-5 bg-[#161B2B] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Video className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Setor de Instalação de Câmeras
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Marcação, Formas de Pagamento, Aparelhos, Fotos & Conclusão
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate mt-0.5">
              Instalação & Controle de Câmeras
            </h1>
          </div>
        </div>

        {/* 4 MAIN SECTOR TABS */}
        <div className="flex items-center bg-[#0B1221] p-1 rounded-2xl border border-slate-800 shrink-0 self-start md:self-auto overflow-x-auto max-w-full gap-1">
          {/* Aba 1: Nova Instalação / Formulário */}
          <button
            type="button"
            onClick={() => setActiveSubTab('NEW_INSTALLATION')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'NEW_INSTALLATION'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingContractId ? '✏️ Editando' : '➕ Nova Instalação'}</span>
          </button>

          {/* Aba 2: Instalações Agendadas / Pendentes */}
          <button
            type="button"
            onClick={() => setActiveSubTab('PENDING_INSTALLATIONS')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'PENDING_INSTALLATIONS'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5 text-amber-300" />
            <span>Agendadas / Pendentes</span>
            {totals.totalPendingInstallations > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/80 border border-amber-500/40 text-amber-300 font-black ml-0.5">
                {totals.totalPendingInstallations}
              </span>
            )}
          </button>

          {/* Aba 3: Clientes Ativos (Concluídas) */}
          <button
            type="button"
            onClick={() => setActiveSubTab('ACTIVE_CLIENTS')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'ACTIVE_CLIENTS'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Clientes Ativos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-black ml-0.5">
              {totals.totalActiveClients}
            </span>
          </button>

          {/* Aba 4: Clientes Inativos */}
          <button
            type="button"
            onClick={() => setActiveSubTab('INACTIVE_CLIENTS')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'INACTIVE_CLIENTS'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-700/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-slate-400" />
            <span>Clientes Inativos</span>
            {totals.totalInactiveClients > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-bold ml-0.5">
                {totals.totalInactiveClients}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {/* ========================================================================= */}
        {/* ABA 1: FORMULÁRIO COMPLETO DE NOVA INSTALAÇÃO / MARCAÇÃO                  */}
        {/* ========================================================================= */}
        {activeSubTab === 'NEW_INSTALLATION' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-[#161B2B] to-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/30 shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {editingContractId ? 'Alterar Dados da Instalação de Câmeras' : 'Ficha de Marcação & Instalação de Câmeras'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Preencha os dados. Você pode <strong>Salvar como Agendada</strong> ou <strong>Concluir Instalação e Ativar Cliente</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                {/* BOTÃO PARA VISUALIZAR / BAIXAR CONTRATO PREENCHIDO */}
                <button
                  type="button"
                  onClick={() => setContractModalData(getCurrentFormContract())}
                  className="px-3.5 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Visualizar e Baixar Contrato de Locação Preenchido em PDF"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Baixar Contrato PDF</span>
                </button>

                {/* BOTÃO PARA VISUALIZAR TEXTO FORMATADO PARA WHATSAPP */}
                <button
                  type="button"
                  onClick={() => setWhatsAppModalData({
                    contract: getCurrentFormContract(),
                    activeTab: 'FULL'
                  })}
                  className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Pré-visualizar texto formatado com emojis para enviar no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Texto para WhatsApp</span>
                </button>

                {editingContractId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={(e) => handleSaveContractWithStatus('ACTIVE', e)} className="space-y-6">
              {/* SEÇÃO 1: DADOS DO CLIENTE */}
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <User className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    1. Dados do Cliente
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Nome Completo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nome Completo do Cliente <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono font-medium"
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>

                  {/* Número WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Número WhatsApp</span>
                      {whatsapp && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppDirect(whatsapp, `Olá ${clientName || 'Cliente'}, tudo bem? Entramos em contato referente à instalação e suporte das suas câmeras de segurança.`)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> Testar Zap
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhoneNumber(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Cidade
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo / SP"
                        className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Localidade ou Rua */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Localidade ou Rua (Endereço Completo, Bairro, Nº e Referência)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: Rua das Flores, 123 - Centro (Próximo à praça)"
                        className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: COBRANÇA, VALORES E OPÇÕES CLICÁVEIS DE PAGAMENTO */}
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    2. Cobrança, Valores & Formas de Pagamento
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Número Responsável de Receber Cobranças */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Número Responsável por Receber Cobranças</span>
                      {whatsapp && (
                        <button
                          type="button"
                          onClick={() => setBillingPhone(whatsapp)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                        >
                          Usar o mesmo WhatsApp do cliente
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(formatPhoneNumber(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Quantidade de Câmeras */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Quantidade de Câmeras
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={cameraCount}
                        onChange={(e) => setCameraCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-black text-center"
                      />
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 4, 8].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCameraCount(num)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              cameraCount === num 
                                ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOCO ESPECÍFICO: VALOR DA INSTALAÇÃO & FORMA DE PAGAMENTO DA INSTALAÇÃO */}
                <div className="bg-[#0B1221] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>Valor da Instalação (R$) & Forma de Pagamento</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    {/* Campo Valor Instalação */}
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 mb-1">Valor da Instalação</span>
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                        <input
                          type="text"
                          value={installationValue}
                          onChange={(e) => setInstallationValue(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-[#161B2B] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Opções Clicáveis: Dinheiro, PIX, Cartão, Outros */}
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Forma de Pagamento da Instalação (Clique para selecionar)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* DINHEIRO */}
                        <button
                          type="button"
                          onClick={() => setInstallationPaymentMethod('DINHEIRO')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            installationPaymentMethod === 'DINHEIRO'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Banknote className="w-4 h-4 text-emerald-400" />
                          <span>Dinheiro</span>
                        </button>

                        {/* PIX */}
                        <button
                          type="button"
                          onClick={() => setInstallationPaymentMethod('PIX')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            installationPaymentMethod === 'PIX'
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <QrCode className="w-4 h-4 text-teal-400" />
                          <span>PIX</span>
                        </button>

                        {/* CARTÃO */}
                        <button
                          type="button"
                          onClick={() => setInstallationPaymentMethod('CARTAO')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            installationPaymentMethod === 'CARTAO'
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span>Cartão</span>
                        </button>

                        {/* OUTROS */}
                        <button
                          type="button"
                          onClick={() => setInstallationPaymentMethod('OUTROS')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            installationPaymentMethod === 'OUTROS'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4 text-purple-400" />
                          <span>Outros</span>
                        </button>
                      </div>

                      {/* Campo para digitar a opção quando "OUTROS" for selecionado */}
                      {installationPaymentMethod === 'OUTROS' && (
                        <div className="mt-2 animate-in fade-in">
                          <input
                            type="text"
                            value={installationPaymentMethodOther}
                            onChange={(e) => setInstallationPaymentMethodOther(e.target.value)}
                            placeholder="Digite a forma de pagamento da instalação (ex: 2x no boleto, permuta, etc.)"
                            className="w-full bg-[#161B2B] border border-purple-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BLOCO MENSALIDADE, DIA DO VENCIMENTO & FORMA DE PAGAMENTO DA MENSALIDADE */}
                <div className="bg-[#0B1221] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Valor da Mensalidade */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Valor da Mensalidade (R$)
                      </label>
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                        <input
                          type="text"
                          value={monthlyValue}
                          onChange={(e) => setMonthlyValue(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-[#161B2B] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Dia do Vencimento */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Dia do Vencimento (Todo mês)
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={dueDay}
                          onChange={(e) => setDueDay(Number(e.target.value))}
                          className="w-full bg-[#161B2B] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold cursor-pointer"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day} className="bg-[#161B2B]">
                              Dia {day < 10 ? `0${day}` : day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Opção de Pagamento da Mensalidade Clicável */}
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Opção de Pagamento da Mensalidade (Clique para selecionar)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {/* PIX */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('PIX')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            paymentMethod === 'PIX'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                          <span>PIX</span>
                          {paymentMethod === 'PIX' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>

                        {/* CARTÃO */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CARTAO')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            paymentMethod === 'CARTAO'
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span>Cartão</span>
                          {paymentMethod === 'CARTAO' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </button>

                        {/* BOLETO */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('BOLETO')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            paymentMethod === 'BOLETO'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>Boleto</span>
                          {paymentMethod === 'BOLETO' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        {/* DINHEIRO */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('DINHEIRO')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            paymentMethod === 'DINHEIRO'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Banknote className="w-4 h-4 text-emerald-400" />
                          <span>Dinheiro</span>
                          {paymentMethod === 'DINHEIRO' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>

                        {/* OUTROS */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('OUTROS')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            paymentMethod === 'OUTROS'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4 text-purple-400" />
                          <span>Outros</span>
                          {paymentMethod === 'OUTROS' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      </div>

                      {/* Campo para digitar opção quando "OUTROS" for selecionado na mensalidade */}
                      {paymentMethod === 'OUTROS' && (
                        <div className="mt-2 animate-in fade-in">
                          <input
                            type="text"
                            value={paymentMethodOther}
                            onChange={(e) => setPaymentMethodOther(e.target.value)}
                            placeholder="Digite a forma de pagamento da mensalidade (ex: Transferência, Débito em conta, etc.)"
                            className="w-full bg-[#161B2B] border border-purple-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* FORMATO DE ASSINATURA NO CONTRATO (ASSINATURA, POLEGAR OU AMBOS) */}
                    <div className="pt-3 border-t border-slate-800/80">
                      <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Tipo de Assinatura no Contrato</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Define o espaço do cliente no contrato
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Assinatura */}
                        <button
                          type="button"
                          onClick={() => setSignatureType('SIGNATURE')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
                            signatureType === 'SIGNATURE'
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <PenTool className="w-4 h-4 text-cyan-400" />
                          <span>Assinatura Tradicional</span>
                          {signatureType === 'SIGNATURE' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>

                        {/* Polegar / Digital */}
                        <button
                          type="button"
                          onClick={() => setSignatureType('THUMBPRINT')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
                            signatureType === 'THUMBPRINT'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Fingerprint className="w-4 h-4 text-amber-400" />
                          <span>Polegar (Digital)</span>
                          {signatureType === 'THUMBPRINT' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        {/* Ambos */}
                        <button
                          type="button"
                          onClick={() => setSignatureType('BOTH')}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
                            signatureType === 'BOTH'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                              : 'bg-[#161B2B] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center -space-x-1">
                            <PenTool className="w-3.5 h-3.5 text-purple-400" />
                            <Fingerprint className="w-3.5 h-3.5 text-purple-300" />
                          </div>
                          <span>Assinatura + Polegar</span>
                          {signatureType === 'BOTH' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: APARELHOS QUE VAI SER INSTALADO OS APPS (NOME, EMAIL, SENHA & COPIAR) */}
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        3. Aparelhos / Usuários para Instalar os Apps
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Adicione as pessoas/aparelhos que terão acesso ao aplicativo de câmeras. Use o botão na frente para copiar rapidamente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDevice}
                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Adicionar Outra Pessoa / Aparelho
                  </button>
                </div>

                <div className="space-y-3">
                  {devices.map((device, index) => {
                    const isPassVisible = !!showDevicePasswords[device.id];
                    const fullCopyString = `Login: ${device.email} | Senha: ${device.password}`;

                    return (
                      <div 
                        key={device.id} 
                        className="bg-[#0B1221] border border-slate-800 p-3.5 sm:p-4 rounded-xl space-y-3 transition-all hover:border-slate-700/80"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black flex items-center justify-center border border-purple-500/30">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {device.name ? device.name : `Aparelho / Usuário #${index + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* BOTÃO COPIAR TODOS (LOGIN E SENHA) */}
                            {(device.email || device.password) && (
                              <CopyButton 
                                text={fullCopyString} 
                                label="Copiar Todos" 
                                title="Copiar Login e Senha deste aparelho" 
                              />
                            )}

                            {devices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDevice(device.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Remover este aparelho"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Nome da Pessoa */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Nome da Pessoa
                            </label>
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={device.name}
                                onChange={(e) => handleUpdateDevice(device.id, 'name', e.target.value)}
                                placeholder="Ex: Maria (Esposa), Filho, etc."
                                className="w-full bg-[#161B2B] border border-slate-700/70 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                              />
                            </div>
                          </div>

                          {/* Email ou Usuário do App */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                              <span>Email ou Login do App</span>
                              {device.email && (
                                <CopyButton text={device.email} label="Copiar Login" title="Copiar login de acesso" />
                              )}
                            </label>
                            <div className="relative">
                              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={device.email}
                                onChange={(e) => handleUpdateDevice(device.id, 'email', e.target.value)}
                                placeholder="usuario@email.com"
                                className="w-full bg-[#161B2B] border border-slate-700/70 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-medium"
                              />
                            </div>
                          </div>

                          {/* Senha do App */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                              <span>Senha de Acesso</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleShowDevicePassword(device.id)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                  title={isPassVisible ? "Ocultar senha" : "Ver senha"}
                                >
                                  {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                {device.password && (
                                  <CopyButton text={device.password} label="Copiar Senha" title="Copiar senha de acesso" />
                                )}
                              </div>
                            </label>
                            <div className="relative">
                              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type={isPassVisible ? "text" : "password"}
                                value={device.password}
                                onChange={(e) => handleUpdateDevice(device.id, 'password', e.target.value)}
                                placeholder="Senha do app"
                                className="w-full bg-[#161B2B] border border-slate-700/70 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 4: ANEXO DE MÚLTIPLAS IMAGENS / FOTOS DOS DOCUMENTOS */}
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        4. Fotos / Imagens dos Documentos ({documentImages.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Anexe quantas fotos precisar (RG Frente, RG Verso, CNH, Comprovante de Residência, Contrato, etc.)
                      </p>
                    </div>
                  </div>

                  {documentImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Anexar Mais Fotos
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFilesChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {documentImages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {documentImages.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="relative group bg-[#0B1221] rounded-xl border border-slate-700/80 hover:border-indigo-500/70 p-2 flex flex-col items-center gap-2 transition-all shadow-md"
                        >
                          <div 
                            className="relative w-full h-28 cursor-pointer rounded-lg overflow-hidden bg-slate-900"
                            onClick={() => setPreviewImageState({ images: documentImages, currentIndex: index })}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Documento ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Foto {index + 1}
                            </span>
                          </div>

                          <div className="w-full flex items-center justify-between gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => setPreviewImageState({ images: documentImages, currentIndex: index })}
                              className="text-[10px] text-indigo-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Maximize2 className="w-3 h-3" /> Ver Foto
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImageAtIndex(index)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remover esta foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Card to add more pictures */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-36 border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-[#0B1221] hover:bg-[#0D1527] rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-300"
                      >
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">+ Anexar Mais Fotos</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Total de {documentImages.length} {documentImages.length === 1 ? 'foto anexada' : 'fotos anexadas'}</span>
                      <button
                        type="button"
                        onClick={handleClearAllImages}
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-bold cursor-pointer"
                      >
                        Remover Todas as Fotos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-[#0B1221] hover:bg-[#0D1527] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      Clique aqui para anexar fotos dos documentos (Permite selecionar várias fotos)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Suporta RG Frente e Verso, CNH, Comprovante de Residência ou Contrato Assinado (JPG, PNG, WEBP)
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 5: OBSERVAÇÕES ADICIONAIS */}
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Observações Adicionais da Instalação (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Ponto de energia nos fundos, DVR instalado no quarto, cliente prefere contato após as 14h..."
                  className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* BOTÕES DE AÇÃO: SALVAR AGENDADA vs CONCLUIR E ATIVAR */}
              <div className="pt-2 flex flex-col md:flex-row items-stretch gap-3">
                {/* Botão Ver Texto WhatsApp */}
                <button
                  type="button"
                  onClick={() => setWhatsAppModalData({
                    contract: getCurrentFormContract(),
                    activeTab: 'FULL'
                  })}
                  className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Ver Texto Zap</span>
                </button>

                {/* BOTÃO 1: SALVAR INSTALAÇÃO (AGENDADA / PENDENTE) */}
                <button
                  type="button"
                  onClick={(e) => handleSaveContractWithStatus('PENDING', e)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer hover:scale-[1.01] active:scale-99"
                >
                  <Save className="w-5 h-5 text-amber-200" />
                  <span>{editingContractId ? 'SALVAR COMO AGENDADA / PENDENTE' : 'SALVAR INSTALAÇÃO AGENDADA'}</span>
                </button>

                {/* BOTÃO 2: CONCLUIR INSTALAÇÃO E ATIVAR CLIENTE */}
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer hover:scale-[1.01] active:scale-99"
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>CONCLUIR INSTALAÇÃO E ATIVAR CLIENTE</span>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: INSTALAÇÕES AGENDADAS / PENDENTES (COM BOTÃO DE CONCLUIR E ATIVAR)   */}
        {/* ========================================================================= */}
        {activeSubTab === 'PENDING_INSTALLATIONS' && (
          <div className="space-y-5 pb-20 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="bg-[#161B2B] p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Instalações Agendadas & Em Andamento</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      {filteredPendingList.length} aguardando
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Assim que o serviço for concluído no local, clique em <strong>"✅ Concluir Instalação"</strong> para mover o cliente automaticamente para a aba de <strong>Clientes Ativos</strong>!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveSubTab('NEW_INSTALLATION');
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Nova Instalação
              </button>
            </div>

            {/* List of Pending Contracts */}
            {filteredPendingList.length === 0 ? (
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
                <Hourglass className="w-14 h-14 text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">Nenhuma Instalação Pendente ou Agendada</h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Todas as suas instalações estão concluídas ou você pode agendar uma nova agora mesmo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveSubTab('NEW_INSTALLATION');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agendar Nova Instalação
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPendingList.map((contract) => {
                  const docImgs = getContractDocumentImages(contract);

                  return (
                    <div
                      key={contract.id}
                      className="bg-[#161B2B] border-2 border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Hourglass className="w-3 h-3 text-amber-400" /> Instalação Pendente
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                <Video className="w-3 h-3" /> {contract.cameraCount} {contract.cameraCount === 1 ? 'Câmera' : 'Câmeras'}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-white truncate" title={contract.clientName}>
                              {contract.clientName}
                            </h3>

                            {contract.cpf && (
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                CPF: <strong className="text-slate-300">{contract.cpf}</strong>
                              </div>
                            )}
                          </div>

                          {/* Photos Thumbnails */}
                          {docImgs.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {docImgs.slice(0, 2).map((img, idx) => (
                                <img 
                                  key={idx}
                                  src={img} 
                                  alt={`Documento ${idx + 1}`} 
                                  className="w-12 h-9 object-cover rounded-xl border border-indigo-500/40 shadow-md cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => setPreviewImageState({ images: docImgs, currentIndex: idx })}
                                />
                              ))}
                              {docImgs.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageState({ images: docImgs, currentIndex: 2 })}
                                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-indigo-300 flex items-center justify-center cursor-pointer"
                                >
                                  +{docImgs.length - 2}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Location & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(contract.city || contract.address) && (
                            <div className="flex items-start gap-1.5 text-slate-300 bg-[#0B1221] p-2.5 rounded-xl border border-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{contract.city || 'Cidade não informada'}</div>
                                <div className="text-[11px] text-slate-400 truncate">{contract.address || 'Endereço não informado'}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-1 bg-[#0B1221] p-2.5 rounded-xl border border-slate-800">
                            {contract.whatsapp ? (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppDirect(contract.whatsapp, generateWhatsAppFormattedText(contract))}
                                className="flex items-center justify-between text-emerald-400 font-bold cursor-pointer text-left"
                              >
                                <span className="flex items-center gap-1 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /> {contract.whatsapp}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">WhatsApp</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Sem WhatsApp cadastrado</span>
                            )}
                          </div>
                        </div>

                        {/* Values */}
                        <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Instalação</span>
                            <span className="text-xs sm:text-sm font-black text-white">
                              R$ {contract.installationValue.toFixed(2).replace('.', ',')} ({contract.installationPaymentMethod || 'PIX'})
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase block">Mensalidade</span>
                            <span className="text-xs sm:text-sm font-black text-emerald-400">
                              R$ {contract.monthlyValue.toFixed(2).replace('.', ',')} ({contract.paymentMethod || 'PIX'})
                            </span>
                          </div>
                        </div>

                        {/* Installed App Users / Devices for Pending Cards */}
                        {contract.devices && contract.devices.length > 0 && (
                          <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> Aparelhos / Acessos ({contract.devices.length})
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setWhatsAppModalData({ contract, activeTab: 'DEVICES' })}
                                  className="text-[10px] font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30"
                                >
                                  <Share2 className="w-2.5 h-2.5" /> Enviar Logins
                                </button>
                                <CopyButton 
                                  text={generateDevicesOnlyText(contract)} 
                                  label="Copiar Todos"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              {contract.devices.map((dev, i) => (
                                <div key={dev.id || i} className="bg-[#161B2B] p-2.5 rounded-xl border border-slate-800/90 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      <span className="font-black text-white text-xs truncate">{dev.name || `Aparelho / Usuário ${i+1}`}</span>
                                    </div>
                                    {(dev.email || dev.password) && (
                                      <CopyButton 
                                        text={`Login: ${dev.email || 'Não informado'} | Senha: ${dev.password || 'Não informada'}`}
                                        title="Copiar Login e Senha deste aparelho"
                                        label="Copiar Todos"
                                      />
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                                    {/* Login / Email */}
                                    <div className="flex items-center justify-between gap-1.5 bg-[#0B1221] px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                        <span className="text-[11px] text-slate-300 font-mono truncate">{dev.email || 'Sem login'}</span>
                                      </div>
                                      {dev.email && (
                                        <CopyButton text={dev.email} title="Copiar login" label="Copiar Login" />
                                      )}
                                    </div>

                                    {/* Senha */}
                                    <div className="flex items-center justify-between gap-1.5 bg-[#0B1221] px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                        <span className="text-[11px] text-slate-300 font-mono truncate">{dev.password || 'Sem senha'}</span>
                                      </div>
                                      {dev.password && (
                                        <CopyButton text={dev.password} title="Copiar senha" label="Copiar Senha" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer with CONCLUDE Button */}
                      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        {/* Botão de Concluir com 1 clique */}
                        <button
                          type="button"
                          onClick={() => handleQuickConcludeContract(contract)}
                          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>CONCLUIR INSTALAÇÃO E ATIVAR CLIENTE</span>
                        </button>

                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setContractModalData(contract)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer border border-cyan-500/30"
                            title="Visualizar e Baixar Contrato Preenchido em PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setWhatsAppModalData({ contract, activeTab: 'FULL' })}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer border border-emerald-500/30"
                            title="Ver texto do WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(contract)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer border border-cyan-500/20"
                            title="Editar Instalação"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setContractToDelete(contract)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-slate-800"
                            title="Excluir Instalação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: CLIENTES ATIVOS (CONCLUÍDOS)                                       */}
        {/* ========================================================================= */}
        {activeSubTab === 'ACTIVE_CLIENTS' && (
          <div className="space-y-5 pb-20 animate-in fade-in duration-200">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#161B2B] p-4 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Clientes Ativos</div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{totals.totalActiveClients}</div>
                </div>
              </div>

              <div className="bg-[#161B2B] p-4 rounded-2xl border border-cyan-500/30 shadow-lg flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Câmeras Instaladas</div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">{totals.totalCameras} <span className="text-xs text-slate-400 font-bold">unidades</span></div>
                </div>
              </div>

              <div className="bg-[#161B2B] p-4 rounded-2xl border border-indigo-500/30 shadow-lg flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Mensalidades / Mês</div>
                  <div className="text-lg sm:text-xl font-black text-indigo-300 mt-0.5">R$ {totals.totalMonthly.toFixed(2).replace('.', ',')}</div>
                </div>
              </div>

              <div className="bg-[#161B2B] p-4 rounded-2xl border border-purple-500/30 shadow-lg flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Total de Instalações</div>
                  <div className="text-lg sm:text-xl font-black text-purple-300 mt-0.5">R$ {totals.totalInstallation.toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-[#161B2B] p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, CPF, telefone, cidade ou rua..."
                  className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Payment Method */}
                <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-xl border border-slate-700/80 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 px-1.5">Pagamento:</span>
                  {(['ALL', 'PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'OUTROS'] as const).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setFilterPayment(pm)}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        filterPayment === pm
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pm === 'ALL' ? 'Todos' : pm}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveSubTab('NEW_INSTALLATION');
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Instalação
                </button>
              </div>
            </div>

            {/* List of Active Contracts */}
            {filteredActiveList.length === 0 ? (
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Nenhum Cliente Ativo Encontrado</h3>
                <p className="text-xs text-slate-400 max-w-md mb-5">
                  {searchQuery ? 'Nenhum resultado corresponde à busca realizada.' : 'Cadastre sua primeira instalação de câmeras clicando no botão abaixo.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveSubTab('NEW_INSTALLATION');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Primeira Instalação
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredActiveList.map((contract) => {
                  const docImgs = getContractDocumentImages(contract);

                  return (
                    <div
                      key={contract.id}
                      className="bg-[#161B2B] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-4 transition-all"
                    >
                      {/* Card Top: Client Header & Badges */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Ativo
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                <Video className="w-3 h-3" /> {contract.cameraCount} {contract.cameraCount === 1 ? 'Câmera' : 'Câmeras'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                                {contract.paymentMethod === 'PIX' ? <QrCode className="w-3 h-3" /> : contract.paymentMethod === 'CARTAO' ? <CreditCard className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                {contract.paymentMethod === 'OUTROS' ? (contract.paymentMethodOther || 'Outros') : contract.paymentMethod}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-white truncate" title={contract.clientName}>
                              {contract.clientName}
                            </h3>

                            {contract.cpf && (
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                CPF: <strong className="text-slate-300">{contract.cpf}</strong>
                                {contract.birthDate && <span className="ml-2 font-sans text-[11px]">• Nasc: {new Date(contract.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                              </div>
                            )}
                          </div>

                          {/* Multiple Document Photos Thumbnails */}
                          {docImgs.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end max-w-[170px]">
                              {docImgs.slice(0, 3).map((img, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => setPreviewImageState({ images: docImgs, currentIndex: idx })}
                                  className="relative group cursor-pointer"
                                  title={`Ver documento ${idx + 1} de ${docImgs.length}`}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Documento ${idx + 1}`} 
                                    className="w-12 h-9 sm:w-14 sm:h-10 object-cover rounded-xl border border-indigo-500/40 shadow-md group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              ))}
                              {docImgs.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageState({ images: docImgs, currentIndex: 3 })}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 text-[10px] font-black text-indigo-300 flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                                  title="Ver mais fotos"
                                >
                                  +{docImgs.length - 3}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Location & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(contract.city || contract.address) && (
                            <div className="flex items-start gap-1.5 text-slate-300 bg-[#0B1221] p-2.5 rounded-xl border border-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{contract.city || 'Cidade não informada'}</div>
                                <div className="text-[11px] text-slate-400 truncate">{contract.address || 'Rua / Endereço não informado'}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 bg-[#0B1221] p-2.5 rounded-xl border border-slate-800">
                            {/* WhatsApp Cliente */}
                            {contract.whatsapp ? (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppDirect(contract.whatsapp, generateWhatsAppFormattedText(contract))}
                                className="flex items-center justify-between gap-1 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer text-left"
                              >
                                <span className="flex items-center gap-1 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /> {contract.whatsapp}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">WhatsApp</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Sem WhatsApp cadastrado</span>
                            )}

                            {/* Cobrança WhatsApp */}
                            {contract.billingPhone && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppDirect(contract.billingPhone, generateBillingQuickText(contract))}
                                className="flex items-center justify-between gap-1 text-indigo-300 hover:text-indigo-200 font-bold cursor-pointer text-left pt-1 border-t border-slate-800/80"
                              >
                                <span className="flex items-center gap-1 truncate"><DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Cobrança: {contract.billingPhone}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">Lembrar Pagamento</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Values and Due Date Bar */}
                        <div className="bg-gradient-to-r from-slate-950 via-[#0D1527] to-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Instalação</span>
                            <span className="text-xs sm:text-sm font-black text-white">
                              R$ {contract.installationValue.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate">
                              {contract.installationPaymentMethod || 'PIX'}
                            </span>
                          </div>

                          <div className="border-x border-slate-800">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase block">Mensalidade</span>
                            <span className="text-xs sm:text-sm font-black text-emerald-400">
                              R$ {contract.monthlyValue.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[9px] text-emerald-400/80 block truncate">
                              {contract.paymentMethod === 'OUTROS' ? (contract.paymentMethodOther || 'Outros') : contract.paymentMethod}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-cyan-400 uppercase block">Vencimento</span>
                            <span className="text-xs sm:text-sm font-black text-cyan-300">
                              Todo dia {contract.dueDay}
                            </span>
                            <span className="text-[9px] text-cyan-400/70 block">
                              Recorrente
                            </span>
                          </div>
                        </div>

                        {/* Installed App Users / Devices */}
                        {contract.devices && contract.devices.length > 0 && (
                          <div className="bg-[#0B1221] p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> Aparelhos / Acessos dos Apps ({contract.devices.length})
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setWhatsAppModalData({ contract, activeTab: 'DEVICES' })}
                                  className="text-[10px] font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30"
                                >
                                  <Share2 className="w-2.5 h-2.5" /> Enviar Logins
                                </button>
                                <CopyButton 
                                  text={generateDevicesOnlyText(contract)} 
                                  label="Copiar Todos"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              {contract.devices.map((dev, i) => (
                                <div key={dev.id || i} className="bg-[#161B2B] p-2.5 rounded-xl border border-slate-800/90 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      <span className="font-black text-white text-xs truncate">{dev.name || `Aparelho / Usuário ${i+1}`}</span>
                                    </div>
                                    {(dev.email || dev.password) && (
                                      <CopyButton 
                                        text={`Login: ${dev.email || 'Não informado'} | Senha: ${dev.password || 'Não informada'}`}
                                        title="Copiar Login e Senha deste aparelho"
                                        label="Copiar Todos"
                                      />
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                                    {/* Login / Email */}
                                    <div className="flex items-center justify-between gap-1.5 bg-[#0B1221] px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                        <span className="text-[11px] text-slate-300 font-mono truncate">{dev.email || 'Sem login'}</span>
                                      </div>
                                      {dev.email && (
                                        <CopyButton text={dev.email} title="Copiar login" label="Copiar Login" />
                                      )}
                                    </div>

                                    {/* Senha */}
                                    <div className="flex items-center justify-between gap-1.5 bg-[#0B1221] px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                        <span className="text-[11px] text-slate-300 font-mono truncate">{dev.password || 'Sem senha'}</span>
                                      </div>
                                      {dev.password && (
                                        <CopyButton text={dev.password} title="Copiar senha" label="Copiar Senha" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                        {/* BOTÕES DE WHATSAPP FORMATADO */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Botão para abrir o modal completo de visualização e cópia do texto do WhatsApp */}
                          <button
                            type="button"
                            onClick={() => setWhatsAppModalData({ contract, activeTab: 'FULL' })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                            title="Visualizar e copiar texto completo formatado com emojis para o WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Texto para Zap</span>
                          </button>

                          {/* Botão de cópia rápida direta */}
                          <button
                            type="button"
                            onClick={() => handleQuickCopyWhatsAppFull(contract)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Copiar texto do WhatsApp com 1 clique"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Zap</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Botão Baixar Contrato PDF */}
                          <button
                            type="button"
                            onClick={() => setContractModalData(contract)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer border border-cyan-500/30"
                            title="Visualizar e Baixar Contrato Preenchido em PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Mover para Inativo */}
                          <button
                            type="button"
                            onClick={() => {
                              setContractToInactivate(contract);
                              setInactivationReason('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                            title="Mover este cliente para a aba de Clientes Inativos"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-400" />
                            <span className="hidden sm:inline">Inativar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(contract)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer border border-cyan-500/20"
                            title="Editar Dados da Instalação"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setContractToDelete(contract)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-slate-800"
                            title="Excluir Instalação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: CLIENTES INATIVOS                                                  */}
        {/* ========================================================================= */}
        {activeSubTab === 'INACTIVE_CLIENTS' && (
          <div className="space-y-5 pb-20 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="bg-[#161B2B] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-slate-400 rounded-xl border border-slate-700">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Histórico de Clientes Inativos</h3>
                  <p className="text-[11px] text-slate-400">
                    Clientes desativados ou com contrato pausado. Você pode reativá-los a qualquer momento com um clique.
                  </p>
                </div>
              </div>

              <div className="relative max-w-xs">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar inativo..."
                  className="w-full bg-[#0B1221] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Inactive List */}
            {filteredInactiveList.length === 0 ? (
              <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
                <UserX className="w-14 h-14 text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">Nenhum Cliente Inativo</h3>
                <p className="text-xs text-slate-400">
                  Quando desativar um cliente na aba <strong>Clientes Ativos</strong>, ele ficará guardado aqui com todo o histórico intacto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredInactiveList.map((contract) => {
                  const docImgs = getContractDocumentImages(contract);

                  return (
                    <div
                      key={contract.id}
                      className="bg-[#161B2B]/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-4 opacity-90 hover:opacity-100 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <UserX className="w-3 h-3" /> Inativo
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {contract.inactivatedAt && `Desativado em: ${new Date(contract.inactivatedAt).toLocaleDateString('pt-BR')}`}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-slate-300">
                              {contract.clientName}
                            </h3>
                            {contract.inactivationReason && (
                              <p className="text-xs text-rose-400/80 italic mt-0.5">
                                Motivo: {contract.inactivationReason}
                              </p>
                            )}
                          </div>

                          {docImgs.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {docImgs.slice(0, 2).map((img, idx) => (
                                <img 
                                  key={idx}
                                  src={img} 
                                  alt={`Documento ${idx + 1}`} 
                                  className="w-12 h-9 object-cover rounded-lg border border-slate-700 opacity-60 hover:opacity-100 cursor-pointer"
                                  onClick={() => setPreviewImageState({ images: docImgs, currentIndex: idx })}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 grid grid-cols-2 gap-2">
                          <div>Câmeras: <strong className="text-slate-300">{contract.cameraCount}</strong></div>
                          <div>Mensalidade: <strong className="text-slate-300">R$ {contract.monthlyValue.toFixed(2).replace('.', ',')}</strong></div>
                          <div>WhatsApp: <strong className="text-slate-300">{contract.whatsapp || 'Não informado'}</strong></div>
                          <div>Cidade: <strong className="text-slate-300">{contract.city || 'Não informada'}</strong></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleReactivateClient(contract)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reativar Cliente
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setContractModalData(contract)}
                            className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-cyan-500/40 flex items-center gap-1"
                            title="Baixar Contrato PDF"
                          >
                            <FileText className="w-3.5 h-3.5" /> Contrato PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => setWhatsAppModalData({ contract, activeTab: 'FULL' })}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-500/30 flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Texto Zap
                          </button>

                          <button
                            type="button"
                            onClick={() => setContractToDelete(contract)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Excluir Definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAÇÃO E DOWNLOAD DO CONTRATO DE LOCAÇÃO PREENCHIDO           */}
      {/* ========================================================================= */}
      {contractModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto custom-scrollbar animate-in fade-in"
          onClick={() => setContractModalData(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#0B1221] rounded-2xl border border-cyan-500/40 p-3 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <CameraContractDocument 
              contract={contractModalData}
              onClose={() => setContractModalData(null)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAÇÃO & CÓPIA DE TEXTO FORMATADO PARA WHATSAPP               */}
      {/* ========================================================================= */}
      {whatsAppModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setWhatsAppModalData(null)}
        >
          <div 
            className="bg-[#161B2B] border border-emerald-500/50 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Texto Formatado para WhatsApp</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold uppercase">
                      Com Emojis & Seções
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {whatsAppModalData.contract.clientName || 'Cliente'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWhatsAppModalData(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs for WhatsApp Text */}
            <div className="flex items-center bg-[#0B1221] p-1 rounded-xl border border-slate-800 shrink-0 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setWhatsAppModalData(prev => prev ? { ...prev, activeTab: 'FULL' } : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  whatsAppModalData.activeTab === 'FULL'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 Ficha Completa</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppModalData(prev => prev ? { ...prev, activeTab: 'BILLING' } : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  whatsAppModalData.activeTab === 'BILLING'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>🔔 Mensagem de Cobrança</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppModalData(prev => prev ? { ...prev, activeTab: 'DEVICES' } : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  whatsAppModalData.activeTab === 'DEVICES'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 Apenas Logins / Senhas</span>
              </button>
            </div>

            {/* Formatted Text Box Preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B1221] p-4 rounded-xl border border-slate-800 text-xs font-mono whitespace-pre-wrap text-emerald-300/90 leading-relaxed shadow-inner select-all selection:bg-emerald-500/40">
              {whatsAppModalData.activeTab === 'FULL' && generateWhatsAppFormattedText(whatsAppModalData.contract)}
              {whatsAppModalData.activeTab === 'BILLING' && generateBillingQuickText(whatsAppModalData.contract)}
              {whatsAppModalData.activeTab === 'DEVICES' && generateDevicesOnlyText(whatsAppModalData.contract)}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Texto organizado com divisões, dados completos e emojis para o cliente</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão Copiar Texto */}
                <button
                  type="button"
                  onClick={() => {
                    let text = '';
                    if (whatsAppModalData.activeTab === 'FULL') text = generateWhatsAppFormattedText(whatsAppModalData.contract);
                    if (whatsAppModalData.activeTab === 'BILLING') text = generateBillingQuickText(whatsAppModalData.contract);
                    if (whatsAppModalData.activeTab === 'DEVICES') text = generateDevicesOnlyText(whatsAppModalData.contract);
                    
                    if (copyToClipboard(text)) {
                      showToast('✅ Texto copiado com sucesso! Agora é só colar no WhatsApp.');
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto Formatado</span>
                </button>

                {/* Botão Enviar Direto no WhatsApp */}
                {(whatsAppModalData.contract.whatsapp || whatsAppModalData.contract.billingPhone) && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetPhone = (whatsAppModalData.activeTab === 'BILLING'
                        ? (whatsAppModalData.contract.billingPhone || whatsAppModalData.contract.whatsapp)
                        : (whatsAppModalData.contract.whatsapp || whatsAppModalData.contract.billingPhone)) || '';
                      
                      let text = '';
                      if (whatsAppModalData.activeTab === 'FULL') text = generateWhatsAppFormattedText(whatsAppModalData.contract);
                      if (whatsAppModalData.activeTab === 'BILLING') text = generateBillingQuickText(whatsAppModalData.contract);
                      if (whatsAppModalData.activeTab === 'DEVICES') text = generateDevicesOnlyText(whatsAppModalData.contract);

                      handleOpenWhatsAppDirect(targetPhone, text);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/30 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir no Zap</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAÇÃO DE FOTOS DOS DOCUMENTOS EM TELA CHEIA                 */}
      {/* ========================================================================= */}
      {previewImageState && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImageState(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] w-full bg-[#161B2B] rounded-2xl border border-slate-700 p-3 sm:p-4 shadow-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  Documento {previewImageState.currentIndex + 1} de {previewImageState.images.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  Foto {previewImageState.currentIndex + 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImageState.images[previewImageState.currentIndex]}
                  download={`documento-${previewImageState.currentIndex + 1}.jpg`}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-700"
                  title="Baixar Foto"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageState(null)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Image with Prev / Next */}
            <div className="relative w-full flex-1 flex items-center justify-center min-h-[300px] max-h-[72vh] py-2">
              {previewImageState.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewImageState(prev => prev ? {
                    ...prev,
                    currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
                  } : null)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition-all cursor-pointer z-10"
                  title="Foto Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img 
                src={previewImageState.images[previewImageState.currentIndex]} 
                alt={`Documento ${previewImageState.currentIndex + 1}`} 
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
              />

              {previewImageState.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewImageState(prev => prev ? {
                    ...prev,
                    currentIndex: (prev.currentIndex + 1) % prev.images.length
                  } : null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition-all cursor-pointer z-10"
                  title="Próxima Foto"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Thumbnails bottom carousel */}
            {previewImageState.images.length > 1 && (
              <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 shrink-0 border-t border-slate-800">
                {previewImageState.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImageState(prev => prev ? { ...prev, currentIndex: idx } : null)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      previewImageState.currentIndex === idx
                        ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-12 h-10 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO PARA MOVER CLIENTE PARA INATIVO                        */}
      {/* ========================================================================= */}
      {contractToInactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <UserX className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Mover para Clientes Inativos</h3>
                <p className="text-xs text-slate-400">{contractToInactivate.clientName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O cliente será movido para a aba de <strong>Clientes Inativos</strong>. Todos os dados e acessos ficarão salvos caso ele queira reativar futuramente.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Motivo da Inativação (Opcional):
              </label>
              <input
                type="text"
                value={inactivationReason}
                onChange={(e) => setInactivationReason(e.target.value)}
                placeholder="Ex: Cancelou plano, mudou de endereço, falta de pagamento..."
                className="w-full bg-[#0B1221] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setContractToInactivate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmInactivate}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <UserX className="w-4 h-4" /> Confirmar Inativação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA                                 */}
      {/* ========================================================================= */}
      {contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-rose-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-white">
                Excluir Instalação de Câmeras?
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente excluir permanentemente a instalação do cliente <strong>"{contractToDelete.clientName}"</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
