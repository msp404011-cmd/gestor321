import {
  Customer,
  Device,
  ServiceOrder,
  Product,
  Sale,
  CashSession,
  CashMovement,
  Expense,
  Employee,
  Purchase,
  StockMovement,
  AccountReceivable,
  AuditLog,
  CompanySettings,
  OrderStatus,
  PaymentMethod,
  Supplier,
  Reseller,
  ResellerTransaction,
  SubscriptionPlanInfo,
  AuthSession,
  GoogleUserProfile,
  UserAccount,
} from '../types';
import { FirestoreSyncService } from './firestoreService';
import {
  initialCustomers,
  initialDevices,
  initialEmployees,
  initialOrders,
  initialProducts,
  initialSales,
  initialCashSession,
  initialExpenses,
  initialPurchases,
  initialStockMovements,
  initialReceivables,
  initialAuditLogs,
  initialCompanySettings,
  initialResellers,
  initialResellerTransactions,
} from './mockData';

const STORAGE_KEYS = {
  CUSTOMERS: 'msp_customers_v1',
  DEVICES: 'msp_devices_v1',
  PRODUCTS: 'msp_products_v1',
  ORDERS: 'msp_orders_v2',
  SALES: 'msp_sales_v1',
  CASH_SESSION: 'msp_cash_session_v1',
  CASH_MOVEMENTS: 'msp_cash_movements_v1',
  EXPENSES: 'msp_expenses_v1',
  EMPLOYEES: 'msp_employees_v1',
  PURCHASES: 'msp_purchases_v1',
  STOCK_MOVEMENTS: 'msp_stock_movements_v1',
  RECEIVABLES: 'msp_receivables_v1',
  AUDIT_LOGS: 'msp_audit_logs_v1',
  SETTINGS: 'msp_settings_v1',
  CURRENT_USER: 'msp_current_user_v1',
  CUSTOM_CATEGORIES: 'msp_custom_categories_v1',
  CUSTOM_BRANDS: 'msp_custom_brands_v1',
  CUSTOM_OS_STATUSES: 'msp_custom_os_statuses_v1',
  CUSTOM_DEVICE_TYPES: 'msp_custom_device_types_v1',
  CUSTOM_ACCESSORIES: 'msp_custom_accessories_v4',
  CUSTOM_PAYMENT_METHODS: 'msp_custom_payment_methods_v1',
  SUPPLIERS: 'msp_suppliers_v1',
  PURCHASES_CONFIG: 'msp_purchases_config_v1',
  RESELLERS: 'msp_resellers_v1',
  RESELLER_TRANSACTIONS: 'msp_reseller_transactions_v1',
  SUBSCRIPTION_PLAN: 'msp_subscription_plan_v1',
  USER_SUBSCRIPTIONS: 'msp_user_subscriptions_v1',
  AUTH_SESSION: 'msp_auth_session_v1',
  SAVED_ACCOUNTS: 'msp_saved_accounts_v1',
  USER_ACCOUNTS: 'msp_user_accounts_v1',
  INITIALIZED: 'msp_system_initialized_v2',
};

export const initialSubscriptionPlan: SubscriptionPlanInfo = {
  planType: 'LOJA',
  planName: 'Plano Loja',
  planPrice: 69.90,
  billingCycle: 'monthly',
  billingPeriod: 'MENSAL',
  expiryDate: '2026-10-15',
  status: 'active',
  clientName: 'TechNova Informática & Celulares',
  autoRenew: true,
  contractNumber: 'MSP-7842-LOJA',
  paymentMethod: 'PIX / Cartão Mensal',
  notes: 'Ordens de Serviço ilimitadas, PDV, Gestão de Estoque e Múltiplos Usuários.',
  startDate: '2026-01-15',
};

export interface CustomDeviceType {
  id: string;
  name: string;
  iconName?: string;
  isDefault?: boolean;
}

export const defaultCustomDeviceTypes: CustomDeviceType[] = [
  { id: 'dev-1', name: 'Smartphone / Celular', iconName: 'Smartphone', isDefault: true },
  { id: 'dev-2', name: 'Notebook / Laptop', iconName: 'Laptop', isDefault: true },
  { id: 'dev-3', name: 'Desktop / PC', iconName: 'Monitor', isDefault: true },
  { id: 'dev-4', name: 'Tablet / iPad', iconName: 'Tablet', isDefault: true },
  { id: 'dev-5', name: 'Console / Game', iconName: 'Gamepad', isDefault: true },
  { id: 'dev-6', name: 'Smartwatch / Relógio', iconName: 'Watch', isDefault: true },
  { id: 'dev-7', name: 'TV / Monitor', iconName: 'Tv', isDefault: true },
  { id: 'dev-8', name: 'Impressora / Multifuncional', iconName: 'Printer', isDefault: true },
  { id: 'dev-9', name: 'Caixa de Som / Áudio', iconName: 'Speaker', isDefault: true },
  { id: 'dev-10', name: 'Outro Equipamento', iconName: 'Cpu', isDefault: true },
];

export interface CustomAccessoryItem {
  id: string;
  name: string;
  category?: string;
  defaultPresent?: boolean;
  hasDetails?: boolean;
  iconName?: string;
  placeholder?: string;
  deviceTypes?: string[]; // Array of device type names or 'ALL'
}

export const defaultCustomAccessories: CustomAccessoryItem[] = [
  // --- PADRÃO ESSENCIAL: SMARTPHONE / TABLET / GERAL ---
  { id: 'acc-sp-8', name: 'Gaveta de Chip', defaultPresent: false, hasDetails: true, iconName: 'SimCard', placeholder: 'Presente / Avaria', deviceTypes: ['Smartphone / Celular', 'Smartphone', 'Tablet / iPad', 'Tablet', 'ALL'] },
  { id: 'acc-sp-1', name: 'Chip 1', defaultPresent: false, hasDetails: true, iconName: 'SimCard', placeholder: 'Operadora / Detalhes', deviceTypes: ['Smartphone / Celular', 'Smartphone', 'Tablet / iPad', 'Tablet', 'ALL'] },
  { id: 'acc-sp-2', name: 'Chip 2', defaultPresent: false, hasDetails: true, iconName: 'SimCard', placeholder: 'Operadora / Detalhes', deviceTypes: ['Smartphone / Celular', 'Smartphone', 'Tablet / iPad', 'Tablet', 'ALL'] },
  { id: 'acc-sp-3', name: 'Cartão de Memória', defaultPresent: false, hasDetails: true, iconName: 'HardDrive', placeholder: 'Capacidade / Marca', deviceTypes: ['Smartphone / Celular', 'Tablet / iPad', 'Smartphone', 'Tablet', 'ALL'] },
  { id: 'acc-sp-5', name: 'Carregador', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Marca / Potência (W)', deviceTypes: ['Smartphone / Celular', 'Tablet / iPad', 'Notebook / Laptop', 'Smartphone', 'Tablet', 'Notebook', 'ALL'] },

  // --- NOTEBOOK / LAPTOP ---
  { id: 'acc-nb-1', name: 'Carregador / Fonte de Alimentação', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Marca / Voltagem / Potência', deviceTypes: ['Notebook / Laptop', 'Notebook'] },
  { id: 'acc-nb-2', name: 'Cabo de Força da Fonte', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'Tripolar / Bipolar', deviceTypes: ['Notebook / Laptop', 'Desktop / PC', 'Notebook', 'Desktop'] },
  { id: 'acc-nb-3', name: 'Bateria', defaultPresent: false, hasDetails: true, iconName: 'BatteryCharging', placeholder: 'Interna / Removível / Estado', deviceTypes: ['Notebook / Laptop', 'Notebook'] },
  { id: 'acc-nb-4', name: 'Mouse / Dongle USB', defaultPresent: false, hasDetails: true, iconName: 'Mouse', placeholder: 'Sem fio / Com fio / Marca', deviceTypes: ['Notebook / Laptop', 'Desktop / PC', 'Notebook', 'Desktop'] },
  { id: 'acc-nb-5', name: 'Mochila / Capa de Transporte', defaultPresent: false, hasDetails: true, iconName: 'Package', placeholder: 'Cor / Modelo da capa', deviceTypes: ['Notebook / Laptop', 'Notebook'] },
  { id: 'acc-nb-6', name: 'Adaptador de Vídeo / Dongle Type-C', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'HDMI / VGA / Type-C', deviceTypes: ['Notebook / Laptop', 'Notebook'] },
  { id: 'acc-nb-7', name: 'Pendrive / HD Externo', defaultPresent: false, hasDetails: true, iconName: 'HardDrive', placeholder: 'Capacidade / Marca', deviceTypes: ['Notebook / Laptop', 'Desktop / PC', 'Notebook', 'Desktop'] },

  // --- DESKTOP / PC ---
  { id: 'acc-pc-1', name: 'Cabo de Força', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'Padrão novo / antigo', deviceTypes: ['Desktop / PC', 'Desktop'] },
  { id: 'acc-pc-2', name: 'Cabo de Vídeo (HDMI / VGA / DP)', defaultPresent: false, hasDetails: true, iconName: 'Monitor', placeholder: 'Tipo e tamanho do cabo', deviceTypes: ['Desktop / PC', 'TV / Monitor', 'Desktop', 'TV', 'Monitor'] },
  { id: 'acc-pc-3', name: 'Teclado', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Marca / USB ou Sem fio', deviceTypes: ['Desktop / PC', 'Desktop'] },
  { id: 'acc-pc-4', name: 'Adaptador / Antena Wi-Fi / Bluetooth', defaultPresent: false, hasDetails: true, iconName: 'Cpu', placeholder: 'USB / Antena rosqueável', deviceTypes: ['Desktop / PC', 'Desktop'] },
  { id: 'acc-pc-5', name: 'Estabilizador / No-Break / Filtro', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Marca / Potência (VA)', deviceTypes: ['Desktop / PC', 'Desktop'] },

  // --- TABLET / IPAD ---
  { id: 'acc-tb-1', name: 'Caneta Touch / Apple Pencil / Stylus', defaultPresent: false, hasDetails: true, iconName: 'Edit2', placeholder: 'Modelo da caneta / Ponta', deviceTypes: ['Tablet / iPad', 'Tablet'] },
  { id: 'acc-tb-2', name: 'Smart Cover / Teclado Cover', defaultPresent: false, hasDetails: true, iconName: 'Shield', placeholder: 'Com teclado magnético / Normal', deviceTypes: ['Tablet / iPad', 'Tablet'] },

  // --- CONSOLE / GAME ---
  { id: 'acc-cs-1', name: 'Fonte de Alimentação / Cabo de Força', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Interna / Externa / 110V-220V', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-2', name: 'Cabo HDMI', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'Original / 4K / Alta velocidade', deviceTypes: ['Console / Game', 'TV / Monitor', 'Console', 'TV', 'Monitor'] },
  { id: 'acc-cs-3', name: 'Controle / Joystick 1', defaultPresent: false, hasDetails: true, iconName: 'Gamepad', placeholder: 'Cor / Original / Paralelo', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-4', name: 'Controle / Joystick 2', defaultPresent: false, hasDetails: true, iconName: 'Gamepad', placeholder: 'Cor / Original / Paralelo', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-5', name: 'Cabo de Carregamento dos Controles', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'USB-C / Micro-USB', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-6', name: 'Jogo em Mídia Física no Leitor', defaultPresent: false, hasDetails: true, iconName: 'Package', placeholder: 'Nome do jogo inserido', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-7', name: 'Base Vertical / Suporte com Cooler', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Original / Paralelo', deviceTypes: ['Console / Game', 'Console'] },
  { id: 'acc-cs-8', name: 'Headset Gamer', defaultPresent: false, hasDetails: true, iconName: 'Headphones', placeholder: 'Marca / Conexão P2 ou USB', deviceTypes: ['Console / Game', 'Console'] },

  // --- SMARTWATCH / RELÓGIO ---
  { id: 'acc-sw-1', name: 'Pulseira Instalada', defaultPresent: false, hasDetails: true, iconName: 'Watch', placeholder: 'Silicone / Metal / Couro / Cor', deviceTypes: ['Smartwatch / Relógio', 'Smartwatch'] },
  { id: 'acc-sw-2', name: 'Base / Cabo Carregador Magnético', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Original / Paralelo', deviceTypes: ['Smartwatch / Relógio', 'Smartwatch'] },
  { id: 'acc-sw-3', name: 'Bumper / Case de Proteção', defaultPresent: false, hasDetails: true, iconName: 'Shield', placeholder: 'Presente / Avaria', deviceTypes: ['Smartwatch / Relógio', 'Smartwatch'] },
  { id: 'acc-sw-4', name: 'Pulseira Extra', defaultPresent: false, hasDetails: true, iconName: 'Watch', placeholder: 'Cor / Material', deviceTypes: ['Smartwatch / Relógio', 'Smartwatch'] },

  // --- TV / MONITOR ---
  { id: 'acc-tv-1', name: 'Cabo de Força / Fonte Externa', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Fonte externa / Cabo bipolar', deviceTypes: ['TV / Monitor', 'TV', 'Monitor'] },
  { id: 'acc-tv-2', name: 'Controle Remoto com Pilhas', defaultPresent: false, hasDetails: true, iconName: 'Tv', placeholder: 'Original / Paralelo / Com pilhas', deviceTypes: ['TV / Monitor', 'TV', 'Monitor'] },
  { id: 'acc-tv-3', name: 'Base / Pés de Apoio', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Pés originais instalados / Sem pés', deviceTypes: ['TV / Monitor', 'TV', 'Monitor'] },
  { id: 'acc-tv-4', name: 'Suporte de Parede / Articulado', defaultPresent: false, hasDetails: true, iconName: 'Shield', placeholder: 'Instalado atrás da TV', deviceTypes: ['TV / Monitor', 'TV', 'Monitor'] },

  // --- IMPRESSORA / MULTIFUNCIONAL ---
  { id: 'acc-pr-1', name: 'Cabo de Força / Fonte', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: '110V / 220V / Bivolt', deviceTypes: ['Impressora / Multifuncional', 'Impressora'] },
  { id: 'acc-pr-2', name: 'Cabo USB da Impressora', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'Cabo USB A-B', deviceTypes: ['Impressora / Multifuncional', 'Impressora'] },
  { id: 'acc-pr-3', name: 'Cartuchos / Toner Instalados', defaultPresent: false, hasDetails: true, iconName: 'Package', placeholder: 'Preto / Colorido / Modelo', deviceTypes: ['Impressora / Multifuncional', 'Impressora'] },
  { id: 'acc-pr-4', name: 'Bandeja de Papel / Tampa Frontal', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Presente / Avaria', deviceTypes: ['Impressora / Multifuncional', 'Impressora'] },
  { id: 'acc-pr-5', name: 'Bulk Ink / Tanque Externo', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Nível das tintas / Travas', deviceTypes: ['Impressora / Multifuncional', 'Impressora'] },

  // --- CAIXA DE SOM / ÁUDIO ---
  { id: 'acc-au-1', name: 'Cabo de Carga / Carregador', defaultPresent: false, hasDetails: true, iconName: 'Zap', placeholder: 'Type-C / V8 / Fonte', deviceTypes: ['Caixa de Som / Áudio', 'Áudio'] },
  { id: 'acc-au-2', name: 'Cabo Auxiliar P2 / RCA', defaultPresent: false, hasDetails: true, iconName: 'Cable', placeholder: 'Cabo de áudio', deviceTypes: ['Caixa de Som / Áudio', 'Áudio'] },
  { id: 'acc-au-3', name: 'Microfone com Fio / Sem Fio', defaultPresent: false, hasDetails: true, iconName: 'Speaker', placeholder: 'Quantidade / Marca', deviceTypes: ['Caixa de Som / Áudio', 'Áudio'] },
  { id: 'acc-au-4', name: 'Alça de Transporte / Suporte', defaultPresent: false, hasDetails: true, iconName: 'Layers', placeholder: 'Alça de ombro / Fixação', deviceTypes: ['Caixa de Som / Áudio', 'Áudio'] },

  // --- ITENS GERAIS / OUTROS APARELHOS ---
  { id: 'acc-all-1', name: 'Caixa Original / Embalagem', defaultPresent: false, hasDetails: true, iconName: 'Package', placeholder: 'Embalagem original / Sacola', deviceTypes: ['ALL'] },
  { id: 'acc-all-2', name: 'Outros Acessórios Deixados', defaultPresent: false, hasDetails: true, iconName: 'PlusCircle', placeholder: 'Descreva outros itens e detalhes...', deviceTypes: ['ALL'] },
];

export function isAccessoryForDeviceType(
  acc: CustomAccessoryItem,
  targetDeviceType: string
): boolean {
  if (!acc.deviceTypes || acc.deviceTypes.length === 0) return true;
  if (acc.deviceTypes.includes('ALL') || acc.deviceTypes.includes('Todos') || acc.deviceTypes.includes('Geral')) return true;
  if (!targetDeviceType) return true;

  const normTarget = targetDeviceType.toLowerCase().trim();
  const targetPrefix = normTarget.split('/')[0].trim();

  return acc.deviceTypes.some((dt) => {
    const normDt = dt.toLowerCase().trim();
    if (normDt === 'all' || normDt === 'todos' || normDt === 'geral') return true;
    const dtPrefix = normDt.split('/')[0].trim();
    return (
      normTarget === normDt ||
      normTarget.includes(normDt) ||
      normDt.includes(normTarget) ||
      targetPrefix === dtPrefix ||
      (targetPrefix && dtPrefix && (targetPrefix.includes(dtPrefix) || dtPrefix.includes(targetPrefix)))
    );
  });
}

export interface CustomPaymentMethodItem {
  id: string;
  code: string;
  name: string;
  isSystem?: boolean;
  isActive?: boolean;
}

export const defaultCustomPaymentMethods: CustomPaymentMethodItem[] = [
  { id: 'pay-1', code: 'PIX', name: 'PIX', isSystem: true, isActive: true },
  { id: 'pay-2', code: 'DINHEIRO', name: 'Dinheiro à Vista', isSystem: true, isActive: true },
  { id: 'pay-3', code: 'CARTAO_DEBITO', name: 'Cartão de Débito', isSystem: true, isActive: true },
  { id: 'pay-4', code: 'CARTAO_CREDITO', name: 'Cartão de Crédito', isSystem: true, isActive: true },
  { id: 'pay-5', code: 'TRANSFERENCIA', name: 'Transferência Bancária / TED', isSystem: false, isActive: true },
  { id: 'pay-6', code: 'BOLETO', name: 'Boleto Bancário', isSystem: false, isActive: true },
  { id: 'pay-7', code: 'FIADO', name: 'Fiado / A Prazo (Conta a Receber)', isSystem: false, isActive: true },
  { id: 'pay-8', code: 'LINK_PAGTO', name: 'Link de Pagamento / Online', isSystem: false, isActive: true },
  { id: 'pay-9', code: 'NAO_INFORMADO', name: 'A Combinar / Não informado', isSystem: true, isActive: true },
];

export interface CustomCategory {
  id: string;
  name: string;
  iconName?: string;
  count?: number;
}

export const defaultCustomCategories: CustomCategory[] = [
  { id: 'cat-1', name: 'Celulares', iconName: 'Smartphone' },
  { id: 'cat-2', name: 'Acessórios', iconName: 'Headphones' },
  { id: 'cat-3', name: 'Informática', iconName: 'Laptop' },
  { id: 'cat-4', name: 'Peças', iconName: 'Layers' },
  { id: 'cat-5', name: 'TV / Streaming', iconName: 'Tv' },
  { id: 'cat-6', name: 'Câmeras', iconName: 'Camera' },
  { id: 'cat-7', name: 'Cabos', iconName: 'Cable' },
  { id: 'cat-8', name: 'Carregadores', iconName: 'Zap' },
  { id: 'cat-9', name: 'Capinhas', iconName: 'Shield' },
  { id: 'cat-10', name: 'Películas', iconName: 'Smartphone' },
  { id: 'cat-11', name: 'Armazenamento', iconName: 'HardDrive' },
  { id: 'cat-12', name: 'Áudio', iconName: 'Speaker' },
];

export const defaultCustomBrands: string[] = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'Asus',
  'LG',
  'Lenovo',
  'Dell',
  'HP',
  'Positivo',
  'JBL',
  'SanDisk',
  'Anker',
  'Baseus',
  'Hrebos',
  'It-Blue',
  'Gold',
  'Inova',
  'Kaidi',
  'Realme',
  'Nokia',
  'Sony',
  'Generico',
];

export interface CustomOSStatusItem {
  id: string;
  code: string;
  label: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  colorDot: string;
  isSystem?: boolean;
}

export const defaultCustomOSStatuses: CustomOSStatusItem[] = [
  { id: 'os-1', code: 'ORCAMENTO', label: 'Orçamento', colorBg: 'bg-amber-500/15', colorText: 'text-amber-400', colorBorder: 'border-amber-500/40', colorDot: 'bg-amber-400' },
  { id: 'os-2', code: 'AGUARDANDO_PECA', label: 'Aguardando Peça', colorBg: 'bg-[#ff7b00]/15', colorText: 'text-[#ff9100]', colorBorder: 'border-[#ff7b00]/40', colorDot: 'bg-[#ff9100]' },
  { id: 'os-3', code: 'EM_MANUTENCAO', label: 'Em Manutenção', colorBg: 'bg-blue-500/15', colorText: 'text-blue-400', colorBorder: 'border-blue-500/40', colorDot: 'bg-blue-400' },
  { id: 'os-4', code: 'PRONTO', label: 'Pronto / Aguardando Retirada', colorBg: 'bg-emerald-500/15', colorText: 'text-emerald-400', colorBorder: 'border-emerald-500/40', colorDot: 'bg-emerald-400' },
  { id: 'os-5', code: 'ENTREGUE', label: 'Entregue / Concluído', colorBg: 'bg-teal-500/15', colorText: 'text-teal-400', colorBorder: 'border-teal-500/40', colorDot: 'bg-teal-400' },
  { id: 'os-6', code: 'GARANTIA', label: 'Retorno em Garantia', colorBg: 'bg-purple-500/15', colorText: 'text-purple-400', colorBorder: 'border-purple-500/40', colorDot: 'bg-purple-400' },
  { id: 'os-7', code: 'CANCELADA', label: 'Cancelado pelo Cliente', colorBg: 'bg-rose-500/15', colorText: 'text-rose-400', colorBorder: 'border-rose-500/40', colorDot: 'bg-rose-400' },
];

export interface SystemFormatOptions {
  orders: boolean;
  sales: boolean;
  cash: boolean;
  expenses: boolean;
  receivables: boolean;
  purchases: boolean;
  stockMovements: boolean;
  products: boolean;
  customers: boolean;
  devices: boolean;
  suppliers: boolean;
  resellers: boolean;
  auditLogs: boolean;
  resetCompanySettings: boolean;
  resetCustomConfigs: boolean;
  resetEmployeesToAdminOnly: boolean;
}

export const defaultSystemFormatOptions: SystemFormatOptions = {
  orders: true,
  sales: true,
  cash: true,
  expenses: true,
  receivables: true,
  purchases: true,
  stockMovements: true,
  products: false,
  customers: false,
  devices: false,
  suppliers: false,
  resellers: false,
  auditLogs: true,
  resetCompanySettings: false,
  resetCustomConfigs: false,
  resetEmployeesToAdminOnly: false,
};

export const completeFactoryResetOptions: SystemFormatOptions = {
  orders: true,
  sales: true,
  cash: true,
  expenses: true,
  receivables: true,
  purchases: true,
  stockMovements: true,
  products: true,
  customers: true,
  devices: true,
  suppliers: true,
  resellers: true,
  auditLogs: true,
  resetCompanySettings: true,
  resetCustomConfigs: true,
  resetEmployeesToAdminOnly: true,
};

export interface SystemStatsSummary {
  ordersCount: number;
  salesCount: number;
  customersCount: number;
  devicesCount: number;
  productsCount: number;
  expensesCount: number;
  receivablesCount: number;
  purchasesCount: number;
  stockMovementsCount: number;
  cashMovementsCount: number;
  auditLogsCount: number;
  suppliersCount: number;
  resellersCount: number;
  hasOpenCashSession: boolean;
}

// Simple event emitter for React subscriptions
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying listener', e);
    }
  });
}

const GLOBAL_KEYS = new Set([
  STORAGE_KEYS.USER_ACCOUNTS,
  STORAGE_KEYS.AUTH_SESSION,
  STORAGE_KEYS.SAVED_ACCOUNTS,
  STORAGE_KEYS.USER_SUBSCRIPTIONS,
  STORAGE_KEYS.INITIALIZED,
]);

export function getActiveTenantScope(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session && session.email) {
          const cleanEmail = session.email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (cleanEmail) return `tenant_${cleanEmail}`;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'tenant_default';
}

function getScopedKey(key: string): string {
  if (GLOBAL_KEYS.has(key)) {
    return key;
  }
  const tenant = getActiveTenantScope();
  return `${tenant}__${key}`;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const scopedKey = getScopedKey(key);
    let raw = localStorage.getItem(scopedKey);

    // Self-healing migration for legacy un-scoped data:
    // If tenant key has no data yet, but un-scoped legacy key exists, copy legacy data once to tenant
    if (!raw && scopedKey !== key) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) {
        localStorage.setItem(scopedKey, legacyRaw);
        localStorage.removeItem(key);
        raw = legacyRaw;
      }
    }

    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    const scopedKey = getScopedKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

export const StorageService = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  // Reset to default demo dataset for current active tenant
  resetToDemoData(): void {
    setItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    setItem(STORAGE_KEYS.DEVICES, initialDevices);
    setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
    setItem(STORAGE_KEYS.ORDERS, initialOrders);
    setItem(STORAGE_KEYS.SALES, initialSales);
    setItem(STORAGE_KEYS.CASH_SESSION, initialCashSession);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, initialCashSession?.movements || []);
    setItem(STORAGE_KEYS.EXPENSES, initialExpenses);
    setItem(STORAGE_KEYS.EMPLOYEES, initialEmployees);
    setItem(STORAGE_KEYS.PURCHASES, initialPurchases);
    setItem(STORAGE_KEYS.STOCK_MOVEMENTS, initialStockMovements);
    setItem(STORAGE_KEYS.RECEIVABLES, initialReceivables);
    setItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    setItem(STORAGE_KEYS.SUPPLIERS, [
      { id: 'sup-1', name: 'Distribuidora Tech Brasil' },
      { id: 'sup-2', name: 'Mega Telas & Touch' },
      { id: 'sup-3', name: 'Importadora Gold Parts' }
    ]);
    setItem(STORAGE_KEYS.RESELLERS, initialResellers);
    setItem(STORAGE_KEYS.RESELLER_TRANSACTIONS, initialResellerTransactions);
    setItem(STORAGE_KEYS.SETTINGS, initialCompanySettings);
    setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, initialSubscriptionPlan);
    setItem(STORAGE_KEYS.CURRENT_USER, initialEmployees[0]);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.logAction('Dados de demonstração restaurados com sucesso.');
    notifyListeners();
  },

  getSystemStatsSummary(): SystemStatsSummary {
    return {
      ordersCount: this.getOrders().length,
      salesCount: this.getSales().length,
      customersCount: this.getCustomers().length,
      devicesCount: this.getDevices().length,
      productsCount: this.getProducts().length,
      expensesCount: this.getExpenses().length,
      receivablesCount: this.getReceivables().length,
      purchasesCount: this.getPurchases().length,
      stockMovementsCount: this.getStockMovements().length,
      cashMovementsCount: this.getCashMovements().length,
      auditLogsCount: this.getAuditLogs().length,
      suppliersCount: this.getSuppliers().length,
      resellersCount: this.getResellers().length,
      hasOpenCashSession: !!this.getCashSession()?.isOpen,
    };
  },

  formatSystem(options: Partial<SystemFormatOptions>): void {
    if (options.orders) {
      setItem(STORAGE_KEYS.ORDERS, []);
    }
    if (options.sales) {
      setItem(STORAGE_KEYS.SALES, []);
    }
    if (options.cash) {
      setItem(STORAGE_KEYS.CASH_SESSION, null);
      setItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
    }
    if (options.expenses) {
      setItem(STORAGE_KEYS.EXPENSES, []);
    }
    if (options.receivables) {
      setItem(STORAGE_KEYS.RECEIVABLES, []);
    }
    if (options.purchases) {
      setItem(STORAGE_KEYS.PURCHASES, []);
    }
    if (options.stockMovements) {
      setItem(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    }
    if (options.products) {
      setItem(STORAGE_KEYS.PRODUCTS, []);
    }
    if (options.customers) {
      setItem(STORAGE_KEYS.CUSTOMERS, []);
    }
    if (options.devices) {
      setItem(STORAGE_KEYS.DEVICES, []);
    }
    if (options.suppliers) {
      setItem(STORAGE_KEYS.SUPPLIERS, []);
    }
    if (options.resellers) {
      setItem(STORAGE_KEYS.RESELLERS, []);
      setItem(STORAGE_KEYS.RESELLER_TRANSACTIONS, []);
    }
    if (options.auditLogs) {
      setItem(STORAGE_KEYS.AUDIT_LOGS, []);
    }
    if (options.resetCompanySettings) {
      setItem(STORAGE_KEYS.SETTINGS, initialCompanySettings);
    }
    if (options.resetCustomConfigs) {
      setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, defaultCustomCategories);
      setItem(STORAGE_KEYS.CUSTOM_BRANDS, defaultCustomBrands);
      setItem(STORAGE_KEYS.CUSTOM_OS_STATUSES, defaultCustomOSStatuses);
      setItem(STORAGE_KEYS.CUSTOM_DEVICE_TYPES, defaultCustomDeviceTypes);
      setItem(STORAGE_KEYS.CUSTOM_ACCESSORIES, defaultCustomAccessories);
      setItem(STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, defaultCustomPaymentMethods);
      setItem(STORAGE_KEYS.PURCHASES_CONFIG, { historyLimitMonths: 12, autoDeleteExpired: true });
    }
    if (options.resetEmployeesToAdminOnly) {
      setItem(STORAGE_KEYS.EMPLOYEES, [initialEmployees[0]]);
      setItem(STORAGE_KEYS.CURRENT_USER, initialEmployees[0]);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } catch (_) {}

    this.logAction('Formatação do sistema realizada com sucesso.');
    notifyListeners();
  },

  clearAllData(): void {
    this.formatSystem({
      orders: true,
      sales: true,
      cash: true,
      expenses: true,
      receivables: true,
      purchases: true,
      stockMovements: true,
      products: true,
      customers: true,
      devices: true,
      suppliers: true,
      resellers: true,
      auditLogs: true,
      resetCompanySettings: false,
      resetCustomConfigs: false,
      resetEmployeesToAdminOnly: true,
    });
  },

  exportBackup(): string {
    const data = {
      customers: this.getCustomers(),
      devices: this.getDevices(),
      products: this.getProducts(),
      orders: this.getOrders(),
      sales: this.getSales(),
      cashSession: this.getCashSession(),
      cashMovements: this.getCashMovements(),
      expenses: this.getExpenses(),
      employees: this.getEmployees(),
      purchases: this.getPurchases(),
      stockMovements: this.getStockMovements(),
      receivables: this.getReceivables(),
      auditLogs: this.getAuditLogs(),
      resellers: this.getResellers(),
      resellerTransactions: this.getResellerTransactions(),
      settings: this.getCompanySettings(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers) setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.devices) setItem(STORAGE_KEYS.DEVICES, data.devices);
      if (data.products) setItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.orders) setItem(STORAGE_KEYS.ORDERS, data.orders);
      if (data.sales) setItem(STORAGE_KEYS.SALES, data.sales);
      if (data.cashSession !== undefined) setItem(STORAGE_KEYS.CASH_SESSION, data.cashSession);
      if (data.cashMovements) setItem(STORAGE_KEYS.CASH_MOVEMENTS, data.cashMovements);
      if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.employees) setItem(STORAGE_KEYS.EMPLOYEES, data.employees);
      if (data.purchases) setItem(STORAGE_KEYS.PURCHASES, data.purchases);
      if (data.stockMovements) setItem(STORAGE_KEYS.STOCK_MOVEMENTS, data.stockMovements);
      if (data.receivables) setItem(STORAGE_KEYS.RECEIVABLES, data.receivables);
      if (data.resellers) setItem(STORAGE_KEYS.RESELLERS, data.resellers);
      if (data.resellerTransactions) setItem(STORAGE_KEYS.RESELLER_TRANSACTIONS, data.resellerTransactions);
      if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
      this.logAction('Backup importado com sucesso.');
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Falha ao importar backup', e);
      return false;
    }
  },

  // Current User & Employees
  getEmployees(): Employee[] {
    const list = getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
    
    // Auto-inject Benny if missing by phone
    if (!list.find((e) => e.phone === '88988323081')) {
      const benny: Employee = {
        id: 'emp-benny',
        name: 'Benny',
        phone: '88988323081',
        email: 'benny@assistencia.com',
        role: 'VENDEDOR',
        status: 'ATIVO',
        commissionRate: 5,
        permissions: {
          canAccessAdminSettings: false,
          canViewFinancialReports: false,
          canViewProductCost: false,
          canManageEmployees: false,
          canManageProducts: false,
          canManageCustomers: true,
          canManageOrders: true,
          canOperatePos: true,
          canOperateCash: true,
          canManageExpenses: false,
          canDeleteRecords: false,
        },
        createdAt: new Date().toISOString()
      };
      list.push(benny);
      setItem(STORAGE_KEYS.EMPLOYEES, list);
    }
    
    return list;
  },

  saveEmployee(employee: Employee): void {
    const list = this.getEmployees();
    const idx = list.findIndex((e) => e.id === employee.id);
    if (idx >= 0) {
      list[idx] = employee;
      this.logAction(`Funcionário atualizado: ${employee.name}`);
    } else {
      list.push(employee);
      this.logAction(`Novo funcionário cadastrado: ${employee.name} (${employee.role})`);
    }
    setItem(STORAGE_KEYS.EMPLOYEES, list);
    FirestoreSyncService.saveEmployee(employee);
  },

  deleteEmployee(id: string): void {
    const list = this.getEmployees();
    const target = list.find((e) => e.id === id);
    const filtered = list.filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EMPLOYEES, filtered);
    if (target) {
      this.logAction(`Funcionário excluído: ${target.name}`);
    }
  },

  getCurrentUser(): Employee {
    const fallback = this.getEmployees()[0] || initialEmployees[0];
    return getItem(STORAGE_KEYS.CURRENT_USER, fallback);
  },

  setCurrentUser(employee: Employee): void {
    setItem(STORAGE_KEYS.CURRENT_USER, employee);
    this.logAction(`Operador ativo alterado para ${employee.name}`);
  },

  // Customers
  getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  saveCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === customer.id);
    const oldCustomer = idx >= 0 ? { ...list[idx] } : null;

    const normalizedCustomer: Customer = {
      ...customer,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      list[idx] = normalizedCustomer;
      this.logAction(`Cliente atualizado: ${normalizedCustomer.name}`);
    } else {
      list.unshift(normalizedCustomer);
      this.logAction(`Novo cliente cadastrado: ${normalizedCustomer.name}`);
    }
    setItem(STORAGE_KEYS.CUSTOMERS, list);

    // Cascade update to all sectors in the system (Orders, Receivables/A Prazo, Devices, Sales, Cash)
    this.cascadeUpdateCustomerAcrossSystem(normalizedCustomer, oldCustomer);

    return normalizedCustomer;
  },

  cascadeUpdateCustomerAcrossSystem(customer: Customer, oldCustomer: Customer | null): void {
    const cleanDoc = (doc?: string) => (doc ? doc.replace(/\D/g, '') : '');
    const cleanPhone = (ph?: string) => (ph ? ph.replace(/\D/g, '') : '');
    const normalizeStr = (str?: string) => (str ? str.trim().toLowerCase() : '');

    const oldNameNorm = oldCustomer ? normalizeStr(oldCustomer.name) : '';
    const oldPhoneClean = oldCustomer ? cleanPhone(oldCustomer.phone) : '';
    const oldDocClean = oldCustomer ? cleanDoc(oldCustomer.document) : '';
    const targetId = customer.id;

    // Helper to determine if a record matches the target customer using ID, Phone, CPF/CNPJ or Name
    const isMatch = (entityCustId?: string, entityCustName?: string, entityCustPhone?: string, entityCustDoc?: string) => {
      if (entityCustId && entityCustId === targetId) return true;

      const cleanEntityPhone = cleanPhone(entityCustPhone);
      const currentPhoneClean = cleanPhone(customer.phone);
      if (cleanEntityPhone && (cleanEntityPhone === currentPhoneClean || (oldPhoneClean && cleanEntityPhone === oldPhoneClean))) {
        return true;
      }

      const cleanEntityDoc = cleanDoc(entityCustDoc);
      const currentDocClean = cleanDoc(customer.document);
      if (cleanEntityDoc && (cleanEntityDoc === currentDocClean || (oldDocClean && cleanEntityDoc === oldDocClean))) {
        return true;
      }

      if (entityCustName) {
        const normEntityName = normalizeStr(entityCustName);
        const normCurrentName = normalizeStr(customer.name);
        
        if (normEntityName === normCurrentName) return true;
        if (oldNameNorm && normEntityName === oldNameNorm) return true;

        if (normCurrentName.length > 5 && (normEntityName.includes(normCurrentName) || normCurrentName.includes(normEntityName))) {
          return true;
        }
        if (oldNameNorm && oldNameNorm.length > 5 && (normEntityName.includes(oldNameNorm) || oldNameNorm.includes(normEntityName))) {
          return true;
        }
      }

      return false;
    };

    // 1. ORDERS CASCADE
    const orders = this.getOrders();
    let ordersModified = false;
    const updatedOrders = orders.map((o) => {
      if (isMatch(o.customerId, o.customerName, o.customerPhone, o.customerDocument)) {
        ordersModified = true;
        return {
          ...o,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerWhatsapp: customer.whatsapp || customer.phone,
          customerDocument: customer.document || o.customerDocument,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    if (ordersModified) {
      setItem(STORAGE_KEYS.ORDERS, updatedOrders);
    }

    // 2. RECEIVABLES CASCADE (A Prazo / Crediário)
    const receivables = this.getReceivables();
    let receivablesModified = false;
    const updatedReceivables = receivables.map((r) => {
      const entityDoc = (r as any).customerDocument || (r as any).cpfCnpj;
      if (isMatch(r.customerId, r.customerName, r.customerPhone, entityDoc)) {
        receivablesModified = true;
        return {
          ...r,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerDocument: customer.document || (r as any).customerDocument,
          cpfCnpj: customer.document || (r as any).cpfCnpj,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    if (receivablesModified) {
      setItem(STORAGE_KEYS.RECEIVABLES, updatedReceivables);
    }

    // 3. DEVICES CASCADE
    const devices = this.getDevices();
    let devicesModified = false;
    const updatedDevices = devices.map((d) => {
      if (isMatch(d.customerId, d.customerName, (d as any).customerPhone)) {
        devicesModified = true;
        return {
          ...d,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
        };
      }
      return d;
    });

    if (devicesModified) {
      setItem(STORAGE_KEYS.DEVICES, updatedDevices);
    }

    // 4. SALES CASCADE (PDV / Vendas)
    const sales = this.getSales();
    let salesModified = false;
    const updatedSales = sales.map((s) => {
      if (isMatch(s.customerId, s.customerName, (s as any).customerPhone, (s as any).customerCpf)) {
        salesModified = true;
        return {
          ...s,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCpf: customer.document || (s as any).customerCpf,
          customerEmail: customer.email || (s as any).customerEmail,
        };
      }
      return s;
    });

    if (salesModified) {
      setItem(STORAGE_KEYS.SALES, updatedSales);
    }

    // 5. CASH MOVEMENTS CASCADE
    if (oldCustomer && oldCustomer.name && oldCustomer.name !== customer.name) {
      const cashMovements = this.getCashMovements();
      let movementsModified = false;
      const updatedMovements = cashMovements.map((m) => {
        if (m.description && m.description.includes(oldCustomer.name)) {
          movementsModified = true;
          return {
            ...m,
            description: m.description.replaceAll(oldCustomer.name, customer.name),
          };
        }
        return m;
      });
      if (movementsModified) {
        setItem(STORAGE_KEYS.CASH_MOVEMENTS, updatedMovements);
      }

      const activeSession = this.getCashSession();
      if (activeSession && activeSession.movements) {
        let sessionModified = false;
        const sessionMovements = activeSession.movements.map((m) => {
          if (m.description && m.description.includes(oldCustomer.name)) {
            sessionModified = true;
            return {
              ...m,
              description: m.description.replaceAll(oldCustomer.name, customer.name),
            };
          }
          return m;
        });
        if (sessionModified) {
          activeSession.movements = sessionMovements;
          setItem(STORAGE_KEYS.CASH_SESSION, activeSession);
        }
      }
    }

    // Recalculate customer total debt balance from receivables
    const activeDebt = (receivablesModified ? updatedReceivables : this.getReceivables())
      .filter((r) => r.customerId === customer.id && r.status !== 'PAGO' && (Number(r.remainingAmount ?? r.amount) > 0))
      .reduce((sum, r) => sum + Number(r.remainingAmount ?? r.amount), 0);

    // Sync debt balance if changed
    if (customer.debtBalance !== activeDebt) {
      customer.debtBalance = activeDebt;
      const currentCustomers = this.getCustomers();
      const cIdx = currentCustomers.findIndex((c) => c.id === customer.id);
      if (cIdx >= 0) {
        currentCustomers[cIdx].debtBalance = activeDebt;
        setItem(STORAGE_KEYS.CUSTOMERS, currentCustomers);
      }
    }
  },

  deleteCustomer(id: string): void {
    const list = this.getCustomers();
    const target = list.find((c) => c.id === id);
    const filtered = list.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);
    if (target) {
      this.logAction(`Cliente removido: ${target.name}`);
    }
  },

  // Devices
  getDevices(): Device[] {
    return getItem<Device[]>(STORAGE_KEYS.DEVICES, []);
  },

  saveDevice(device: Device): Device {
    const list = this.getDevices();
    const idx = list.findIndex((d) => d.id === device.id);
    if (idx >= 0) {
      list[idx] = device;
      this.logAction(`Aparelho atualizado: ${device.brand} ${device.model}`);
    } else {
      list.unshift(device);
      this.logAction(`Novo aparelho vinculado: ${device.brand} ${device.model} (${device.customerName || 'Cliente'})`);
    }
    setItem(STORAGE_KEYS.DEVICES, list);
    return device;
  },

  deleteDevice(id: string): void {
    const list = this.getDevices();
    const target = list.find((d) => d.id === id);
    const filtered = list.filter((d) => d.id !== id);
    setItem(STORAGE_KEYS.DEVICES, filtered);
    if (target) {
      this.logAction(`Aparelho excluído: ${target.brand} ${target.model}`);
    }
  },

  // Products & Inventory
  getProducts(): Product[] {
    const list = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return list;
  },

  saveProduct(product: Product): Product {
    const list = this.getProducts();
    // Auto recalculate margin & gross profit
    const cost = Number(product.costPrice) || 0;
    const sell = Number(product.sellingPrice) || 0;
    const reseller = Number(product.resellerPrice) || 0;
    const gross = sell - cost;
    const margin = cost > 0 ? (gross / cost) * 100 : 0;
    
    const computed: Product = {
      ...product,
      costPrice: cost,
      sellingPrice: sell,
      resellerPrice: reseller,
      profitGrossAmount: Number(gross.toFixed(2)),
      profitMarginPercent: Number(margin.toFixed(2)),
    };

    const idx = list.findIndex((p) => p.id === computed.id);
    if (idx >= 0) {
      list[idx] = computed;
      this.logAction(`Produto atualizado: ${computed.name} (Varejo: R$ ${computed.sellingPrice}, Revenda: R$ ${computed.resellerPrice})`);
    } else {
      list.unshift(computed);
      this.logAction(`Novo produto cadastrado: ${computed.name}`);
    }
    setItem(STORAGE_KEYS.PRODUCTS, list);
    return computed;
  },

  deleteProduct(id: string): void {
    const list = this.getProducts();
    const target = list.find((p) => p.id === id);
    const filtered = list.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, filtered);
    if (target) {
      this.logAction(`Produto excluído: ${target.name}`);
    }
  },

  updateProductStock(productId: string, qtyDelta: number, reason: string, type: StockMovement['type'], refId?: string): boolean {
    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return false;

    const prevStock = prod.stockQuantity;
    const newStock = Math.max(0, prevStock + qtyDelta);
    prod.stockQuantity = newStock;
    setItem(STORAGE_KEYS.PRODUCTS, products);

    // Register Stock Movement
    const user = this.getCurrentUser();
    const sm: StockMovement = {
      id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: prod.id,
      productName: prod.name,
      type,
      quantity: qtyDelta,
      previousStock: prevStock,
      newStock,
      unitCost: prod.costPrice,
      date: new Date().toISOString(),
      userName: user.name,
      reason,
      referenceId: refId,
    };
    const movements = this.getStockMovements();
    movements.unshift(sm);
    setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    this.logAction(`Estoque alterado: ${prod.name} (${qtyDelta > 0 ? '+' : ''}${qtyDelta}) -> Novo: ${newStock}`);
    return true;
  },

  getStockMovements(): StockMovement[] {
    return getItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  },

  // Service Orders
  getOrders(): ServiceOrder[] {
    return getItem<ServiceOrder[]>(STORAGE_KEYS.ORDERS, []);
  },

  getOrderById(id: string): ServiceOrder | undefined {
    return this.getOrders().find((o) => o.id === id);
  },

  getNextOrderNumber(): number {
    const orders = this.getOrders();
    if (orders.length === 0) return 1001;
    const max = Math.max(...orders.map((o) => o.orderNumber || 1000));
    return max + 1;
  },

  saveOrder(order: ServiceOrder): ServiceOrder {
    const orders = this.getOrders();
    const user = this.getCurrentUser();
    const idx = orders.findIndex((o) => o.id === order.id);

    if (idx >= 0) {
      const prev = orders[idx];
      orders[idx] = order;
      this.logAction(`OS #${order.orderNumber} atualizada (${order.status})`, `Cliente: ${order.customerName}`);

      // If status changed to PRONTA or ENTREGUE, handle cash / receivables
      if (prev.status !== order.status) {
        order.statusHistory.push({
          status: order.status,
          changedAt: new Date().toISOString(),
          changedBy: user.name,
          notes: `Status alterado de ${prev.status} para ${order.status}`,
        });
      }
    } else {
      orders.unshift(order);
      this.logAction(`Nova OS criada: #${order.orderNumber}`, `Cliente: ${order.customerName}, Aparelho: ${order.brand} ${order.model}`);
    }

    setItem(STORAGE_KEYS.ORDERS, orders);
    FirestoreSyncService.saveOrder(order);
    return order;
  },

  updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): boolean {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const user = this.getCurrentUser();
    const prevStatus = order.status;
    order.status = newStatus;

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date().toISOString(),
      changedBy: user.name,
      notes: notes || `Status alterado de ${prevStatus} para ${newStatus}`,
    });

    if (newStatus === 'ENTREGUE') {
      order.deliveredAt = new Date().toISOString();
      // If paid on delivery and cash is open, record cash inflow
      if (order.paymentStatus === 'PAGO' && order.paymentMethod) {
        this.addCashMovement({
          type: 'SERVICO_OS',
          description: `Recebimento da OS #${order.orderNumber} - ${order.customerName}`,
          amount: order.totalPrice,
          paymentMethod: order.paymentMethod,
          referenceId: order.id,
        });
      }
    }

    setItem(STORAGE_KEYS.ORDERS, orders);
    FirestoreSyncService.saveOrder(order);
    this.logAction(`OS #${order.orderNumber}: Status alterado para ${newStatus}`, notes);
    return true;
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders();
    const target = orders.find((o) => o.id === id);
    const filtered = orders.filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.ORDERS, filtered);
    if (target) {
      this.logAction(`OS #${target.orderNumber} excluída.`);
    }
  },

  // Sales (PDV)
  getSales(): Sale[] {
    return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  },

  getNextSaleNumber(): number {
    const sales = this.getSales();
    if (sales.length === 0) return 501;
    const max = Math.max(...sales.map((s) => s.saleNumber || 500));
    return max + 1;
  },

  finalizeSale(saleData: Omit<Sale, 'id' | 'saleNumber' | 'date'>): Sale {
    const sales = this.getSales();
    const nextNumber = this.getNextSaleNumber();
    const now = new Date().toISOString();

    const sale: Sale = {
      ...saleData,
      id: 'sale-' + Date.now(),
      saleNumber: nextNumber,
      date: now,
    };

    // 1. Deduct product stock automatically
    sale.items.forEach((item) => {
      this.updateProductStock(item.productId, -item.quantity, `Venda PDV #${nextNumber}`, 'VENDA', sale.id);
    });

    // 2. Register in active cash session if open
    const activeCash = this.getCashSession();
    if (activeCash && activeCash.status === 'ABERTO') {
      sale.cashSessionId = activeCash.id;
      this.addCashMovement({
        type: 'VENDA',
        description: `Venda #${nextNumber} - ${sale.customerName}`,
        amount: sale.total,
        paymentMethod: sale.paymentMethod,
        referenceId: sale.id,
      });
    }

    // 3. If FIADO (on credit), add to Accounts Receivable
    if (sale.paymentMethod === 'FIADO') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const rec: AccountReceivable = {
        id: 'rec-' + Date.now(),
        customerId: sale.customerId || 'anon',
        customerName: sale.customerName,
        originType: 'VENDA',
        referenceNumber: `Venda #${nextNumber}`,
        referenceId: sale.id,
        amount: sale.total,
        dueDate: dueDate.toISOString().slice(0, 10),
        status: 'PENDENTE',
        paymentMethod: 'FIADO',
        createdAt: now,
      };
      const recs = this.getReceivables();
      recs.unshift(rec);
      setItem(STORAGE_KEYS.RECEIVABLES, recs);

      // If priceTable === 'ATACADO' or resellerId specified, register in Revenda
      if (sale.priceTable === 'ATACADO' || sale.resellerId) {
        const resellers = this.getResellers();
        let reseller = resellers.find((r) => 
          (sale.resellerId && r.id === sale.resellerId) ||
          (sale.customerId && r.id === sale.customerId) ||
          (r.name.toLowerCase() === sale.customerName.toLowerCase())
        );

        if (!reseller) {
          reseller = resellers.find((r) => r.name.includes('Revenda PDV') || r.id === 'res-pdv-default');
        }

        if (!reseller) {
          reseller = {
            id: sale.resellerId || (sale.customerId && sale.customerId !== 'anon' ? sale.customerId : 'res-pdv-' + Date.now()),
            name: sale.customerName && sale.customerName !== 'CLIENTE PADRÃO' ? sale.customerName : 'Cliente Revenda PDV',
            document: '00.000.000/0001-00',
            phone: '(00) 00000-0000',
            email: 'revenda@loja.com',
            address: 'Venda PDV Revenda',
            status: 'Ativo',
            creditLimit: 5000,
            balance: 0,
            totalPurchased: 0,
            totalPaid: 0,
            createdAt: now,
          };
          this.saveReseller(reseller);
        }

        const invoiceNum = `REV-${sale.saleNumber || Math.floor(1000 + Math.random() * 9000)}`;
        const rTransaction: ResellerTransaction = {
          id: `rtx-pdv-${sale.id}`,
          resellerId: reseller.id,
          resellerName: reseller.name,
          type: 'SALE',
          date: now,
          items: sale.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
          totalAmount: sale.total,
          paidAmount: 0,
          paymentMethod: 'FIADO',
          discount: sale.discount,
          notes: sale.notes ? `Venda PDV #${sale.saleNumber}: ${sale.notes}` : `Venda PDV #${sale.saleNumber} (Atacado / Fiado)`,
          invoiceNumber: invoiceNum,
          status: 'CONCLUIDO',
          userName: sale.sellerName || 'Sistema',
        };

        this.saveResellerTransaction(rTransaction);

        // Update reseller balance & total purchased
        reseller.balance = (Number(reseller.balance) || 0) + sale.total;
        reseller.totalPurchased = (Number(reseller.totalPurchased) || 0) + sale.total;
        reseller.updatedAt = now;
        this.saveReseller(reseller);
      }
    }

    // 4. Save sale
    sales.unshift(sale);
    setItem(STORAGE_KEYS.SALES, sales);

    // 5. Audit Log
    this.logAction(
      `Venda #${nextNumber} finalizada com sucesso`,
      `Total: R$ ${sale.total.toFixed(2)} (${sale.paymentMethod}) - Vendedor: ${sale.sellerName}`
    );

    return sale;
  },

  // Cash Register
  getCashMovements(): CashMovement[] {
    const list = getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
    return list || [];
  },

  getCashSession(): CashSession | null {
    const session = getItem<CashSession | null>(STORAGE_KEYS.CASH_SESSION, null);
    if (!session) return null;
    const allMovements = this.getCashMovements();
    const sessionMovements = allMovements.filter(
      (m) => m.cashSessionId === session.id || !m.cashSessionId || session.id === 'cash-sess-active'
    );
    session.movements = sessionMovements;

    if (session.initialBalance === undefined) session.initialBalance = session.openingBalance || 0;

    if (session.status === 'ABERTO') {
      const opening = session.openingBalance || session.initialBalance || 0;
      let cashInflows = 0;
      let cashOutflows = 0;

      sessionMovements.forEach((m) => {
        const isCash = !m.paymentMethod || m.paymentMethod === 'DINHEIRO';
        if (m.type === 'SUPRIMENTO' || m.type === 'ENTRADA_AVULSA') {
          cashInflows += m.amount;
        } else if ((m.type === 'VENDA' || m.type === 'SERVICO_OS' || m.type === 'ORDEM_SERVICO' || m.type === 'ORDEM SERVIÇO') && isCash) {
          cashInflows += m.amount;
        } else if (m.type === 'SANGRIA' || m.type === 'DESPESA') {
          cashOutflows += m.amount;
        }
      });

      session.currentBalance = opening + cashInflows - cashOutflows;
    }
    return session;
  },

  openCashSession(openingBalance: number, notes?: string): CashSession {
    const user = this.getCurrentUser();
    const sessionId = 'cash-sess-' + Date.now();
    const session: CashSession = {
      id: sessionId,
      openedAt: new Date().toISOString(),
      openedBy: user.name,
      openingBalance,
      initialBalance: openingBalance,
      currentBalance: openingBalance,
      status: 'ABERTO',
      notes: notes || 'Abertura de caixa realizada.',
      movements: [],
    };
    setItem(STORAGE_KEYS.CASH_SESSION, session);

    const aberturaMov: CashMovement = {
      id: 'cm-' + Date.now(),
      cashSessionId: sessionId,
      type: 'ABERTURA',
      description: 'Abertura de caixa - Troco inicial',
      amount: openingBalance,
      paymentMethod: 'DINHEIRO',
      date: new Date().toISOString(),
      userName: user.name,
    };
    const list = this.getCashMovements();
    list.unshift(aberturaMov);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, list);
    session.movements = [aberturaMov];
    setItem(STORAGE_KEYS.CASH_SESSION, session);

    this.logAction(`Caixa aberto por ${user.name}`, `Saldo inicial: R$ ${openingBalance.toFixed(2)}`);
    return session;
  },

  openCash(openingBalance: number, notes?: string, userName?: string): CashSession {
    return this.openCashSession(openingBalance, notes);
  },

  closeCash(reportedBalance: number, notes?: string, userName?: string): CashSession {
    return this.closeCashSession(reportedBalance, notes);
  },

  closeCashSession(reportedBalance: number, notes?: string): CashSession {
    const current = this.getCashSession();
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const movements = this.getCashMovements().filter((m) => m.cashSessionId === (current?.id || ''));
    const opening = current ? current.openingBalance : 0;

    let totalSales = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let totalOther = 0;
    let totalInflows = 0;
    let totalOutflows = 0;

    movements.forEach((m) => {
      if (m.type === 'VENDA' || m.type === 'SERVICO_OS' || m.type === 'ORDEM_SERVICO' || m.type === 'ORDEM SERVIÇO' || m.type === 'SUPRIMENTO' || m.type === 'ENTRADA_AVULSA') {
        totalInflows += m.amount;
        if (m.type === 'VENDA' || m.type === 'SERVICO_OS' || m.type === 'ORDEM_SERVICO' || m.type === 'ORDEM SERVIÇO') totalSales += m.amount;
        if (!m.paymentMethod || m.paymentMethod === 'DINHEIRO') totalCash += m.amount;
        else if (m.paymentMethod === 'PIX') totalPix += m.amount;
        else if (m.paymentMethod === 'CARTAO_DEBITO') totalDebit += m.amount;
        else if (m.paymentMethod === 'CARTAO_CREDITO') totalCredit += m.amount;
        else totalOther += m.amount;
      } else if (m.type === 'SANGRIA' || m.type === 'DESPESA') {
        totalOutflows += m.amount;
      }
    });

    // In cash register, only physical cash matters for drawer balance
    const expectedDrawerCash = opening + totalCash - totalOutflows;
    const difference = reportedBalance - expectedDrawerCash;

    const closed: CashSession = {
      id: current?.id || 'cash-sess-closed',
      openedAt: current?.openedAt || now,
      openedBy: current?.openedBy || user.name,
      openingBalance: opening,
      closedAt: now,
      closedBy: user.name,
      closingBalanceExpected: Number(expectedDrawerCash.toFixed(2)),
      closingBalanceReported: Number(reportedBalance.toFixed(2)),
      difference: Number(difference.toFixed(2)),
      status: 'FECHADO',
      notes,
      totalSales: Number(totalSales.toFixed(2)),
      totalCash: Number(totalCash.toFixed(2)),
      totalPix: Number(totalPix.toFixed(2)),
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      totalOther: Number(totalOther.toFixed(2)),
      totalInflows: Number(totalInflows.toFixed(2)),
      totalOutflows: Number(totalOutflows.toFixed(2)),
    };

    setItem(STORAGE_KEYS.CASH_SESSION, closed);
    this.logAction(
      `Caixa fechado por ${user.name}`,
      `Esperado: R$ ${expectedDrawerCash.toFixed(2)}, Informado: R$ ${reportedBalance.toFixed(2)}, Diferença: R$ ${difference.toFixed(2)}`
    );
    return closed;
  },

  addCashMovement(data: Omit<CashMovement, 'id' | 'cashSessionId' | 'date' | 'userName'>): CashMovement {
    const session = getItem<CashSession | null>(STORAGE_KEYS.CASH_SESSION, initialCashSession);
    const user = this.getCurrentUser();
    const mov: CashMovement = {
      ...data,
      id: 'cm-' + Date.now(),
      cashSessionId: session ? session.id : 'cash-sess-active',
      date: new Date().toISOString(),
      userName: user.name,
    };
    const list = this.getCashMovements();
    list.unshift(mov);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, list);

    if (session) {
      if (!session.movements) session.movements = [];
      session.movements.unshift(mov);

      if (session.status === 'ABERTO') {
        const isCash = !mov.paymentMethod || mov.paymentMethod === 'DINHEIRO';
        if (mov.type === 'SUPRIMENTO' || mov.type === 'ENTRADA_AVULSA') {
          session.currentBalance = (session.currentBalance ?? session.openingBalance ?? 0) + mov.amount;
        } else if ((mov.type === 'VENDA' || mov.type === 'SERVICO_OS' || (mov.type as string) === 'ORDEM_SERVICO' || (mov.type as string) === 'ORDEM SERVIÇO') && isCash) {
          session.currentBalance = (session.currentBalance ?? session.openingBalance ?? 0) + mov.amount;
        } else if (mov.type === 'SANGRIA' || mov.type === 'DESPESA') {
          session.currentBalance = Math.max(0, (session.currentBalance ?? session.openingBalance ?? 0) - mov.amount);
        }
      }
      setItem(STORAGE_KEYS.CASH_SESSION, session);
    }

    this.logAction(`Movimentação de caixa: ${mov.type} de R$ ${mov.amount.toFixed(2)} (${mov.description})`);
    return mov;
  },

  zeroCashAndFinancialData(): void {
    const zeroSession: CashSession = {
      id: 'cash-sess-active',
      openedAt: new Date().toISOString(),
      openedBy: this.getCurrentUser()?.name || 'Juliana Costa',
      openingBalance: 0,
      initialBalance: 0,
      currentBalance: 0,
      status: 'ABERTO',
      notes: 'Caixa aberto com saldo inicial zerado.',
      movements: [],
    };
    setItem(STORAGE_KEYS.CASH_SESSION, zeroSession);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
    setItem(STORAGE_KEYS.SALES, []);

    // Set any delivered order to not generate inflows
    const orders = this.getOrders();
    let modifiedOrders = false;
    const updatedOrders = orders.map((o) => {
      if (o.status === 'ENTREGUE') {
        modifiedOrders = true;
        return {
          ...o,
          status: 'PRONTA' as OrderStatus,
          paymentStatus: 'PENDENTE' as any,
          deliveredAt: '',
        };
      }
      return o;
    });
    if (modifiedOrders) {
      setItem(STORAGE_KEYS.ORDERS, updatedOrders);
    }

    // Set any paid expenses to pending so totalPaidExpenses = 0
    const expenses = this.getExpenses();
    let modifiedExpenses = false;
    const updatedExpenses = expenses.map((e) => {
      if (e.status === 'PAGO') {
        modifiedExpenses = true;
        return {
          ...e,
          status: 'PENDENTE' as const,
          paidFromCash: false,
          paymentDate: undefined,
        };
      }
      return e;
    });
    if (modifiedExpenses) {
      setItem(STORAGE_KEYS.EXPENSES, updatedExpenses);
    }

    this.logAction('Financeiro e Caixa zerados com sucesso.', 'Saldo atual, entradas do período e resultado líquido zerados.');
    notifyListeners();
  },

  // Purchases / Compras
  getPurchases(): Purchase[] {
    const raw = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
    const config = this.getPurchasesConfig();
    if (config.autoDeleteExpired) {
      const limitMonths = config.historyLimitMonths || 12;
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() - limitMonths);
      const limitTime = limitDate.getTime();
      
      const filtered = raw.filter((p) => new Date(p.date).getTime() >= limitTime);
      if (filtered.length !== raw.length) {
        setItem(STORAGE_KEYS.PURCHASES, filtered);
        this.logAction('Histórico de compras rotativo', `Registros com mais de ${limitMonths} meses apagados automaticamente.`);
        return filtered;
      }
    }
    return raw;
  },

  addPurchase(purchaseData: Omit<Purchase, 'id' | 'userName'>): Purchase {
    const user = this.getCurrentUser();
    const purchase: Purchase = {
      ...purchaseData,
      id: 'pur-' + Date.now(),
      userName: user.name,
    };

    // Update stock and cost for each purchased item
    purchase.items.forEach((item) => {
      this.updateProductStock(item.productId, item.quantity, `Entrada NF #${purchase.invoiceNumber} (${purchase.supplier})`, 'COMPRA', purchase.id);
      // Update product cost
      const products = this.getProducts();
      const p = products.find((prod) => prod.id === item.productId);
      if (p) {
        p.costPrice = item.unitCost;
        const gross = p.sellingPrice - p.costPrice;
        p.profitGrossAmount = Number(gross.toFixed(2));
        p.profitMarginPercent = p.costPrice > 0 ? Number(((gross / p.costPrice) * 100).toFixed(2)) : 0;
        setItem(STORAGE_KEYS.PRODUCTS, products);
      }
    });

    const list = this.getPurchases();
    list.unshift(purchase);
    setItem(STORAGE_KEYS.PURCHASES, list);
    this.logAction(`Compra registrada: NF ${purchase.invoiceNumber} de ${purchase.supplier}`, `Total: R$ ${purchase.totalAmount.toFixed(2)}`);
    return purchase;
  },

  deletePurchase(id: string): void {
    const list = this.getPurchases();
    const purchase = list.find((p) => p.id === id);
    const filtered = list.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PURCHASES, filtered);
    if (purchase) {
      this.logAction(`Entrada/Compra removida: NF ${purchase.invoiceNumber}`, `Fornecedor: ${purchase.supplier}`);
    }
  },

  // Expenses / Despesas
  getExpenses(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },

  addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const expense: Expense = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const list = this.getExpenses();
    list.unshift(expense);
    setItem(STORAGE_KEYS.EXPENSES, list);

    // If paid from cash drawer, record cash movement
    if (expense.paidFromCash) {
      this.addCashMovement({
        type: 'DESPESA',
        description: `Despesa: ${expense.description} (${expense.category})`,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        referenceId: expense.id,
      });
    }

    this.logAction(`Despesa registrada: ${expense.description}`, `R$ ${expense.amount.toFixed(2)} (${expense.category})`);
    return expense;
  },

  deleteExpense(id: string): void {
    const list = this.getExpenses();
    const target = list.find((e) => e.id === id);
    const filtered = list.filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, filtered);
    if (target) {
      this.logAction(`Despesa excluída: ${target.description}`);
    }
  },

  // Receivables / Contas a Receber (Setor A Prazo)
  getReceivables(): AccountReceivable[] {
    return getItem<AccountReceivable[]>(STORAGE_KEYS.RECEIVABLES, []);
  },

  deliverOrderOnCredit(params: {
    orderId: string;
    downPayment?: number;
    downPaymentMethod?: PaymentMethod;
    dueDate?: string;
    notes?: string;
    userName?: string;
  }): { success: boolean; receivable: AccountReceivable } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === params.orderId);
    if (!order) throw new Error('Ordem de serviço não encontrada.');

    const user = this.getCurrentUser();
    const userName = params.userName || user?.name || 'Operador';
    const totalPrice = Number(order.totalPrice) || 0;
    const downPayment = Math.max(0, Math.min(totalPrice, Number(params.downPayment) || 0));
    const remainingAmount = Math.max(0, totalPrice - downPayment);
    const dueDate = params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. If there's an immediate down payment, record cash movement
    if (downPayment > 0 && params.downPaymentMethod) {
      this.addCashMovement({
        type: 'SERVICO_OS',
        description: `Entrada da OS #${order.orderNumber} (A Prazo) - ${order.customerName}`,
        amount: downPayment,
        paymentMethod: params.downPaymentMethod,
        referenceId: order.id,
        userName,
      });
    }

    // 2. Create the Receivable record
    const receivables = this.getReceivables();
    const receivable: AccountReceivable = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      originType: 'ORDEM_SERVICO',
      referenceNumber: `OS #${order.orderNumber}`,
      referenceId: order.id,
      amount: remainingAmount,
      originalAmount: totalPrice,
      paidAmount: downPayment,
      remainingAmount: remainingAmount,
      downPayment: downPayment > 0 ? downPayment : undefined,
      downPaymentMethod: downPayment > 0 ? params.downPaymentMethod : undefined,
      deviceInfo: `${order.brand || ''} ${order.model || ''}`.trim() || 'Aparelho',
      serviceDescription: order.performedService || order.requestedService || order.clientDefect || 'Serviço técnico',
      dueDate,
      status: remainingAmount === 0 ? 'PAGO' : 'PENDENTE',
      payments:
        downPayment > 0
          ? [
              {
                id: 'pay-' + Date.now(),
                amount: downPayment,
                paymentMethod: params.downPaymentMethod || 'DINHEIRO',
                date: new Date().toISOString(),
                userName,
                notes: 'Entrada inicial no ato da entrega',
              },
            ]
          : [],
      paidAt: remainingAmount === 0 ? new Date().toISOString() : undefined,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    receivables.unshift(receivable);
    setItem(STORAGE_KEYS.RECEIVABLES, receivables);
    FirestoreSyncService.saveReceivable(receivable);

    // 3. Update Order status to ENTREGUE
    order.status = 'ENTREGUE';
    order.deliveredAt = new Date().toISOString();
    order.paymentMethod = downPayment > 0 ? params.downPaymentMethod : 'A_PRAZO';
    order.paymentStatus = remainingAmount === 0 ? 'PAGO' : downPayment > 0 ? 'PARCIAL' : 'PENDENTE';

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'ENTREGUE',
      changedAt: new Date().toISOString(),
      changedBy: userName,
      notes: `Aparelho entregue A PRAZO. Total: R$ ${totalPrice.toFixed(2)} | Entrada: R$ ${downPayment.toFixed(2)} | Restante: R$ ${remainingAmount.toFixed(2)} (Venc: ${dueDate})`,
    });

    setItem(STORAGE_KEYS.ORDERS, orders);
    this.logAction(
      `OS #${order.orderNumber} entregue A PRAZO para ${order.customerName}`,
      `Total: R$ ${totalPrice.toFixed(2)}, Entrada: R$ ${downPayment.toFixed(2)}, Saldo A Prazo: R$ ${remainingAmount.toFixed(2)}`
    );

    return { success: true, receivable };
  },

  payReceivable(params: {
    receivableId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    userName?: string;
  }): { success: boolean; receivable: AccountReceivable } {
    const list = this.getReceivables();
    const rec = list.find((r) => r.id === params.receivableId);
    if (!rec) throw new Error('Título de cobrança não encontrado.');

    const user = this.getCurrentUser();
    const userName = params.userName || user?.name || 'Operador';
    const payAmount = Math.max(0, Math.min(Number(rec.amount) || Number(rec.remainingAmount) || 0, Number(params.amount) || 0));

    if (payAmount <= 0) throw new Error('Informe um valor de pagamento válido.');

    const currentPaid = (Number(rec.paidAmount) || 0) + payAmount;
    const original = Number(rec.originalAmount) || Number(rec.amount) + (Number(rec.paidAmount) || 0);
    const newRemaining = Math.max(0, original - currentPaid);

    rec.paidAmount = currentPaid;
    rec.remainingAmount = newRemaining;
    rec.amount = newRemaining;
    rec.updatedAt = new Date().toISOString();
    rec.status = newRemaining <= 0 ? 'PAGO' : 'PENDENTE';
    if (newRemaining <= 0) {
      rec.paidAt = new Date().toISOString();
    }

    const newPayment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      amount: payAmount,
      paymentMethod: params.paymentMethod,
      date: new Date().toISOString(),
      userName,
      notes: params.notes || 'Baixa de conta a prazo',
    };

    if (!rec.payments) rec.payments = [];
    rec.payments.unshift(newPayment);

    // Record cash inflow
    this.addCashMovement({
      type: rec.originType === 'ORDEM_SERVICO' ? 'SERVICO_OS' : 'VENDA',
      description: `Baixa A Prazo: ${rec.referenceNumber} - ${rec.customerName}`,
      amount: payAmount,
      paymentMethod: params.paymentMethod,
      referenceId: rec.id,
      userName,
    });

    // If originating from OS and now fully paid, update OS payment status
    if (rec.originType === 'ORDEM_SERVICO' && rec.referenceId) {
      const orders = this.getOrders();
      const order = orders.find((o) => o.id === rec.referenceId);
      if (order) {
        order.paymentStatus = newRemaining <= 0 ? 'PAGO' : 'PARCIAL';
        if (newRemaining <= 0) {
          order.paymentMethod = params.paymentMethod;
        }
        setItem(STORAGE_KEYS.ORDERS, orders);
      }
    }

    setItem(STORAGE_KEYS.RECEIVABLES, list);
    this.logAction(
      `Baixa de R$ ${payAmount.toFixed(2)} em ${rec.referenceNumber} (${rec.customerName})`,
      `Saldo restante: R$ ${newRemaining.toFixed(2)} (${params.paymentMethod})`
    );

    return { success: true, receivable: rec };
  },

  deleteReceivable(id: string): void {
    const list = this.getReceivables();
    const target = list.find((r) => r.id === id);
    const filtered = list.filter((r) => r.id !== id);
    setItem(STORAGE_KEYS.RECEIVABLES, filtered);
    if (target) {
      this.logAction(`Conta a receber ${target.referenceNumber} (${target.customerName}) excluída.`);
    }
  },

  updateReceivableStatus(id: string, status: AccountReceivable['status'], paymentMethod?: PaymentMethod): void {
    const list = this.getReceivables();
    const rec = list.find((r) => r.id === id);
    if (!rec) return;

    rec.status = status;
    if (status === 'PAGO') {
      rec.paidAt = new Date().toISOString();
      if (paymentMethod) rec.paymentMethod = paymentMethod;
      rec.amount = 0;
      rec.remainingAmount = 0;
      rec.paidAmount = rec.originalAmount || rec.amount;

      // Register in cash
      if (paymentMethod) {
        this.addCashMovement({
          type: rec.originType === 'ORDEM_SERVICO' ? 'SERVICO_OS' : 'VENDA',
          description: `Quitação A Prazo ${rec.referenceNumber} - ${rec.customerName}`,
          amount: rec.originalAmount || rec.amount,
          paymentMethod,
          referenceId: rec.id,
        });
      }
    }

    setItem(STORAGE_KEYS.RECEIVABLES, list);
    this.logAction(`Conta a receber ${rec.referenceNumber} atualizada para ${status}`);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  logAction(action: string, details?: string, entityType?: string, entityId?: string): void {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userName: user ? user.name : 'Sistema',
      userRole: user ? user.role : 'ADMINISTRADOR',
      action,
      details,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
    };
    const logs = this.getAuditLogs();
    logs.unshift(log);
    // Keep max 200 logs
    if (logs.length > 200) logs.length = 200;
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Settings
  getCompanySettings(): CompanySettings {
    const saved = getItem<CompanySettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!saved || saved.name === 'MSP INFORMATICA') {
      setItem(STORAGE_KEYS.SETTINGS, initialCompanySettings);
      return initialCompanySettings;
    }
    const merged = { ...initialCompanySettings, ...saved };
    // User requested signatures removed from thermal print
    if (saved.osShowSignatures === undefined) {
      merged.osShowSignatures = false;
    }
    if (!merged.managerPassword) {
      merged.managerPassword = '1507';
    }
    return merged;
  },

  getManagerPassword(): string {
    return this.getCompanySettings().managerPassword || '1507';
  },

  verifyManagerPassword(passwordInput: string): boolean {
    const current = (this.getCompanySettings().managerPassword || '1507').trim();
    return current === (passwordInput || '').trim();
  },

  getSettings(): CompanySettings {
    return this.getCompanySettings();
  },

  saveCompanySettings(settings: CompanySettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    this.logAction('Configurações da empresa atualizadas.');
    FirestoreSyncService.saveCompanySettings(settings);
  },

  // Subscription & Plan info (Painel Ativo)
  getSubscriptionPlan(): SubscriptionPlanInfo {
    const saved = getItem<SubscriptionPlanInfo | null>(STORAGE_KEYS.SUBSCRIPTION_PLAN, null);
    if (!saved) {
      setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, initialSubscriptionPlan);
      return initialSubscriptionPlan;
    }
    return { ...initialSubscriptionPlan, ...saved };
  },

  saveSubscriptionPlan(plan: SubscriptionPlanInfo): void {
    const session = this.getAuthSession();
    const targetEmail = plan.accountEmail || session?.email || '';
    const fullPlan: SubscriptionPlanInfo = {
      ...plan,
      accountEmail: targetEmail || plan.accountEmail,
    };

    setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, fullPlan);
    if (targetEmail) {
      this.saveSubscriptionForEmail(targetEmail, fullPlan);
    }
    this.logAction(`Plano de assinatura atualizado: ${fullPlan.planName} (${fullPlan.planPrice})`);
    try {
      FirestoreSyncService.saveSubscriptionPlan(fullPlan);
    } catch (e) {
      console.warn('Sync subscription error:', e);
    }
    notifyListeners();
  },

  // Per-Email Subscriptions Database
  getUserSubscriptions(): Record<string, SubscriptionPlanInfo> {
    return getItem<Record<string, SubscriptionPlanInfo>>(STORAGE_KEYS.USER_SUBSCRIPTIONS, {});
  },

  getSubscriptionForEmail(email: string): SubscriptionPlanInfo | null {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const subs = this.getUserSubscriptions();
    return subs[cleanEmail] || null;
  },

  saveSubscriptionForEmail(email: string, plan: SubscriptionPlanInfo): void {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const subs = this.getUserSubscriptions();
    subs[cleanEmail] = {
      ...plan,
      accountEmail: cleanEmail,
    };
    setItem(STORAGE_KEYS.USER_SUBSCRIPTIONS, subs);
  },

  // Auth Session
  getAuthSession(): AuthSession | null {
    return getItem<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
  },

  setAuthSession(session: AuthSession | null): void {
    if (!session) {
      this.clearAuthSession();
      return;
    }
    setItem(STORAGE_KEYS.AUTH_SESSION, session);
    notifyListeners();
  },

  clearAuthSession(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    notifyListeners();
  },

  loginWithGoogle(profile: GoogleUserProfile): {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess: boolean;
    isExpiredOrCanceled: boolean;
  } {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    const cleanName = profile.name || cleanEmail.split('@')[0] || 'Usuário Google';
    const avatar =
      profile.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=ffffff`;

    // 1. Locate or create Employee in local directory
    const employees = this.getEmployees();
    let employee = employees.find(
      (e) => (e.email && e.email.toLowerCase() === cleanEmail) || e.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (!employee) {
      // Create new Admin employee for this shop owner
      employee = {
        id: `emp-google-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: 'ADMINISTRADOR',
        avatarUrl: avatar,
        active: true,
        permissions: {
          canManageOrders: true,
          canOperatePos: true,
          canManageProducts: true,
          canViewFinancialReports: true,
          canManageCustomers: true,
          canAccessAdminSettings: true,
          canOperateCash: true,
          canAdjustStock: true,
          canManageEmployees: true,
        },
      };
      this.saveEmployee(employee);
    } else {
      // Update avatar if newer
      if (profile.picture && employee.avatarUrl !== profile.picture) {
        employee.avatarUrl = profile.picture;
        this.saveEmployee(employee);
      }
    }

    // Set current active employee
    this.setCurrentUser(employee);

    // 2. Check subscription for this email
    let userPlan = this.getSubscriptionForEmail(cleanEmail);
    let isFirstAccess = false;

    if (!userPlan) {
      // First access for this Google account: automatically start 7-day Free Trial!
      isFirstAccess = true;
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 7);
      const expiryStr = trialExpiry.toISOString().split('T')[0];

      userPlan = {
        planType: 'TRIAL',
        planName: 'Teste Grátis (7 Dias)',
        planPrice: 0,
        billingCycle: 'monthly',
        billingPeriod: 'MENSAL',
        expiryDate: expiryStr,
        status: 'active',
        clientName: cleanName,
        accountEmail: cleanEmail,
        autoRenew: false,
        contractNumber: `MSP-TRIAL-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentMethod: 'Teste Grátis de Boas-Vindas (7 Dias)',
        notes: 'Período de avaliação de 7 dias com todos os recursos liberados.',
        startDate: new Date().toISOString().split('T')[0],
        isTrial: true,
        trialDaysRemaining: 7,
      };

      this.saveSubscriptionForEmail(cleanEmail, userPlan);
    }

    // Apply this plan to active workspace
    this.saveSubscriptionPlan(userPlan);

    // 3. Determine if subscription is expired or canceled
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let isExpiredOrCanceled = userPlan.status === 'expired' || userPlan.status === 'canceled' || userPlan.status === 'VENCIDO';

    if (userPlan.expiryDate) {
      const [y, m, d] = userPlan.expiryDate.split('-').map(Number);
      const expDate = new Date(y, (m || 1) - 1, d || 1);
      if (expDate.getTime() < now.getTime()) {
        isExpiredOrCanceled = true;
        userPlan.status = 'expired';
        this.saveSubscriptionPlan(userPlan);
      }
    }

    // 4. Save active auth session
    const session: AuthSession = {
      isAuthenticated: true,
      provider: 'google',
      email: cleanEmail,
      name: cleanName,
      avatarUrl: avatar,
      loggedAt: new Date().toISOString(),
    };
    this.setAuthSession(session);

    this.logAction(
      `Login com Google efetuado (${cleanEmail})`,
      isFirstAccess
        ? 'Primeiro acesso: Teste Grátis de 7 Dias ativado automaticamente.'
        : `Plano atual: ${userPlan.planName} (${userPlan.status})`
    );

    // Also save in remembered accounts list
    this.saveAccountProfile(profile);

    return {
      user: employee,
      plan: userPlan,
      isFirstAccess,
      isExpiredOrCanceled,
    };
  },

  getSavedAccounts(): GoogleUserProfile[] {
    return getItem<GoogleUserProfile[]>(STORAGE_KEYS.SAVED_ACCOUNTS, []);
  },

  saveAccountProfile(profile: GoogleUserProfile): void {
    if (!profile.email) return;
    const cleanEmail = profile.email.trim().toLowerCase();
    const accounts = this.getSavedAccounts();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
    const updated: GoogleUserProfile = {
      ...profile,
      email: cleanEmail,
      name: profile.name || cleanEmail.split('@')[0],
      picture:
        profile.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || cleanEmail)}&background=0284c7&color=ffffff`,
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = updated;
    } else {
      accounts.unshift(updated);
    }
    setItem(STORAGE_KEYS.SAVED_ACCOUNTS, accounts.slice(0, 10)); // Keep up to 10 accounts
  },

  removeSavedAccount(email: string): void {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getSavedAccounts().filter((a) => a.email.toLowerCase() !== cleanEmail);
    setItem(STORAGE_KEYS.SAVED_ACCOUNTS, accounts);
    notifyListeners();
  },

  getUserAccounts(): UserAccount[] {
    return getItem<UserAccount[]>(STORAGE_KEYS.USER_ACCOUNTS, []);
  },

  saveUserAccount(account: UserAccount): void {
    const list = this.getUserAccounts();
    const idx = list.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.unshift(account);
    }
    setItem(STORAGE_KEYS.USER_ACCOUNTS, list);
    notifyListeners();
    FirestoreSyncService.saveUserAccount(account);
  },

  registerUserAccount(params: {
    shopName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    securityQuestion?: string;
    securityAnswer?: string;
  }): {
    user: Employee;
    plan: SubscriptionPlanInfo;
    account: UserAccount;
  } {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanShop = params.shopName.trim() || 'Minha Assistência Técnica';
    const cleanOwner = params.ownerName.trim() || cleanShop;

    // Check if email is already registered
    const accounts = this.getUserAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      throw new Error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
    }

    // 1. Create UserAccount object
    const newAccount: UserAccount = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shopName: cleanShop,
      ownerName: cleanOwner,
      email: cleanEmail,
      phone: params.phone?.trim() || '',
      passwordHash: params.password, // In-browser client storage
      securityQuestion: params.securityQuestion?.trim() || 'Qual o telefone de cadastro da loja?',
      securityAnswer: params.securityAnswer?.trim().toLowerCase() || (params.phone ? params.phone.replace(/\D/g, '') : ''),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.saveUserAccount(newAccount);

    // 2. Set active auth session immediately so subsequent saves are scoped to this new tenant
    const session: AuthSession = {
      isAuthenticated: true,
      provider: 'email',
      email: cleanEmail,
      name: cleanOwner,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanOwner)}&background=0284c7&color=ffffff`,
      loggedAt: new Date().toISOString(),
    };
    this.setAuthSession(session);

    // 3. Configure company settings with shop name
    const currentSettings = this.getCompanySettings();
    this.saveCompanySettings({
      ...currentSettings,
      name: cleanShop,
      tradeName: cleanShop,
      responsibleName: cleanOwner,
      email: cleanEmail,
      phone: params.phone || currentSettings.phone,
      whatsapp: params.phone || currentSettings.whatsapp,
    });

    // 3. Create administrator employee
    const employees = this.getEmployees();
    let adminEmp = employees.find((e) => e.email?.toLowerCase() === cleanEmail);
    if (!adminEmp) {
      adminEmp = {
        id: `emp-adm-${Date.now()}`,
        name: cleanOwner,
        email: cleanEmail,
        phone: params.phone,
        role: 'ADMINISTRADOR',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanOwner)}&background=0284c7&color=ffffff`,
        active: true,
        permissions: {
          canManageOrders: true,
          canOperatePos: true,
          canManageProducts: true,
          canViewFinancialReports: true,
          canManageCustomers: true,
          canAccessAdminSettings: true,
          canOperateCash: true,
          canAdjustStock: true,
          canManageEmployees: true,
        },
      };
      this.saveEmployee(adminEmp);
    }
    this.setCurrentUser(adminEmp);

    // 4. Activate 7-day Free Trial
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 7);
    const expiryStr = trialExpiry.toISOString().split('T')[0];

    const trialPlan: SubscriptionPlanInfo = {
      planType: 'TRIAL',
      planName: 'Teste Grátis (7 Dias)',
      planPrice: 0,
      billingCycle: 'monthly',
      billingPeriod: 'MENSAL',
      expiryDate: expiryStr,
      status: 'active',
      clientName: cleanShop,
      accountEmail: cleanEmail,
      autoRenew: false,
      contractNumber: `MSP-TRIAL-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: 'Teste Grátis de Boas-Vindas (7 Dias)',
      notes: 'Período de avaliação de 7 dias com todos os módulos liberados.',
      startDate: new Date().toISOString().split('T')[0],
      isTrial: true,
      trialDaysRemaining: 7,
    };
    this.saveSubscriptionPlan(trialPlan);
    this.saveSubscriptionForEmail(cleanEmail, trialPlan);

    // 5. Save active auth session
    session.avatarUrl = adminEmp.avatarUrl;
    this.setAuthSession(session);

    // Also register in saved accounts
    this.saveAccountProfile({
      email: cleanEmail,
      name: `${cleanOwner} (${cleanShop})`,
      picture: adminEmp.avatarUrl,
    });

    this.logAction(`Nova conta criada: ${cleanShop} (${cleanEmail})`, 'Teste Grátis de 7 dias ativado');

    return {
      user: adminEmp,
      plan: trialPlan,
      account: newAccount,
    };
  },

  loginWithEmailPassword(params: {
    email: string;
    password: string;
  }): {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess: boolean;
    isExpiredOrCanceled: boolean;
  } {
    const cleanEmail = params.email.trim().toLowerCase();
    const accounts = this.getUserAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      // If not yet in user accounts, check if there's an employee or existing google sub
      const existingEmployee = this.getEmployees().find((e) => e.email?.toLowerCase() === cleanEmail);
      if (existingEmployee) {
        // Allow fallback access for registered employee
        this.setCurrentUser(existingEmployee);
        const plan = this.getSubscriptionForEmail(cleanEmail) || this.getSubscriptionPlan();
        const session: AuthSession = {
          isAuthenticated: true,
          provider: 'email',
          email: cleanEmail,
          name: existingEmployee.name,
          avatarUrl: existingEmployee.avatarUrl,
          loggedAt: new Date().toISOString(),
        };
        this.setAuthSession(session);
        return {
          user: existingEmployee,
          plan,
          isFirstAccess: false,
          isExpiredOrCanceled: plan.status === 'expired' || plan.status === 'canceled',
        };
      }
      throw new Error('Conta não encontrada com este e-mail. Crie sua conta grátis.');
    }

    if (account.passwordHash && account.passwordHash !== params.password) {
      throw new Error('Senha incorreta. Verifique sua senha ou use a recuperação de acesso.');
    }

    // Set active auth session immediately so subsequent operations use this tenant scope
    const session: AuthSession = {
      isAuthenticated: true,
      provider: 'email',
      email: cleanEmail,
      name: account.ownerName || account.shopName,
      loggedAt: new Date().toISOString(),
    };
    this.setAuthSession(session);

    // Update last login
    account.lastLoginAt = new Date().toISOString();
    this.saveUserAccount(account);

    // Get or create employee
    const employees = this.getEmployees();
    let employee = employees.find((e) => e.email?.toLowerCase() === cleanEmail);
    if (!employee) {
      employee = {
        id: `emp-adm-${Date.now()}`,
        name: account.ownerName || account.shopName,
        email: cleanEmail,
        phone: account.phone,
        role: 'ADMINISTRADOR',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.ownerName)}&background=0284c7&color=ffffff`,
        active: true,
        permissions: {
          canManageOrders: true,
          canOperatePos: true,
          canManageProducts: true,
          canViewFinancialReports: true,
          canManageCustomers: true,
          canAccessAdminSettings: true,
          canOperateCash: true,
          canAdjustStock: true,
          canManageEmployees: true,
        },
      };
      this.saveEmployee(employee);
    }
    this.setCurrentUser(employee);

    // Check subscription
    let userPlan = this.getSubscriptionForEmail(cleanEmail) || this.getSubscriptionPlan();
    this.saveSubscriptionPlan(userPlan);

    // Check expiration
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let isExpiredOrCanceled = userPlan.status === 'expired' || userPlan.status === 'canceled' || userPlan.status === 'VENCIDO';
    if (userPlan.expiryDate) {
      const [y, m, d] = userPlan.expiryDate.split('-').map(Number);
      const expDate = new Date(y, (m || 1) - 1, d || 1);
      if (expDate.getTime() < now.getTime()) {
        isExpiredOrCanceled = true;
        userPlan.status = 'expired';
        this.saveSubscriptionPlan(userPlan);
      }
    }

    // Set active auth session
    session.name = employee.name;
    session.avatarUrl = employee.avatarUrl;
    this.setAuthSession(session);

    this.saveAccountProfile({
      email: cleanEmail,
      name: `${account.ownerName} (${account.shopName})`,
      picture: employee.avatarUrl,
    });

    this.logAction(`Login efetuado com sucesso: ${cleanEmail}`);

    return {
      user: employee,
      plan: userPlan,
      isFirstAccess: false,
      isExpiredOrCanceled,
    };
  },

  resetPasswordDirect(params: {
    email: string;
    newPassword: string;
    securityAnswer?: string;
  }): boolean {
    const cleanEmail = params.email.trim().toLowerCase();
    const accounts = this.getUserAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      // Create new account entry if none existed
      const newAcc: UserAccount = {
        id: `acc-${Date.now()}`,
        shopName: 'Minha Loja',
        ownerName: cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: params.newPassword,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      this.saveUserAccount(newAcc);
      return true;
    }

    account.passwordHash = params.newPassword;
    account.lastLoginAt = new Date().toISOString();
    this.saveUserAccount(account);
    this.logAction(`Senha redefinida com sucesso para o e-mail ${cleanEmail}`);
    return true;
  },

  recoverAccount(params: {
    identifier: string; // Email or phone or master code
    method: 'email' | 'phone' | 'code';
    name?: string;
  }): {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess: boolean;
    isExpiredOrCanceled: boolean;
  } {
    const cleanIdentifier = params.identifier.trim();
    let email = '';
    let displayName = params.name || 'Operador Recuperado';

    if (params.method === 'email') {
      email = cleanIdentifier.toLowerCase();
      displayName = params.name || email.split('@')[0] || 'Usuário Recuperado';
    } else if (params.method === 'phone') {
      // Find employee with this phone or generate alias
      const employees = this.getEmployees();
      const matched = employees.find(
        (e) => (e.phone && e.phone.replace(/\D/g, '') === cleanIdentifier.replace(/\D/g, ''))
      );
      if (matched && matched.email) {
        email = matched.email.toLowerCase();
        displayName = matched.name;
      } else {
        email = `recuperado-${cleanIdentifier.replace(/\D/g, '')}@mspinformatica.com.br`;
        displayName = params.name || `Celular ${cleanIdentifier}`;
      }
    } else {
      // Master code recovery
      email = 'admin-recuperado@mspinformatica.com.br';
      displayName = 'Administrador (Chave Mestra)';
    }

    const profile: GoogleUserProfile = {
      email,
      name: displayName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=ffffff&size=128`,
    };

    const loginResult = this.loginWithGoogle(profile);

    // Override session provider to 'recovery'
    const session: AuthSession = {
      isAuthenticated: true,
      provider: 'recovery',
      email,
      name: displayName,
      avatarUrl: profile.picture,
      loggedAt: new Date().toISOString(),
    };
    this.setAuthSession(session);

    this.logAction(
      `Conta recuperada com sucesso via ${params.method.toUpperCase()}`,
      `Identificador: ${cleanIdentifier} | Operador: ${displayName}`
    );

    return loginResult;
  },

  loginAsDemo(): { user: Employee; plan: SubscriptionPlanInfo } {
    const employees = this.getEmployees();
    const demoUser = employees[0] || initialEmployees[0];
    this.setCurrentUser(demoUser);

    const plan = this.getSubscriptionPlan();
    const session: AuthSession = {
      isAuthenticated: true,
      provider: 'demo',
      email: demoUser.email || 'demo@mspinformatica.com.br',
      name: `${demoUser.name} (Demonstração)`,
      avatarUrl: demoUser.avatarUrl,
      loggedAt: new Date().toISOString(),
    };
    this.setAuthSession(session);

    this.logAction('Acesso em Modo Demonstração', `Operador ativo: ${demoUser.name}`);
    return { user: demoUser, plan };
  },


  // Helper & Alias methods for component interoperability
  getUsers(): Employee[] {
    return this.getEmployees();
  },

  adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT', reason: string, userName?: string): boolean {
    const delta = type === 'IN' ? quantity : -quantity;
    return this.updateProductStock(productId, delta, reason, type === 'IN' ? 'ENTRADA' : 'SAIDA');
  },

  deliverAndPayOrder(orderId: string, paymentMethod: PaymentMethod, userName?: string, notes?: string): boolean {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'PAGO';
    order.deliveredAt = new Date().toISOString();
    return this.updateOrderStatus(orderId, 'ENTREGUE', notes || 'Aparelho entregue e recebido pelo cliente.');
  },

  performCashMovement(type: 'SANGRIA' | 'SUPRIMENTO' | 'ENTRADA_AVULSA', amount: number, reason: string, userName?: string): CashMovement {
    const movType = type === 'SANGRIA' ? 'SANGRIA' : 'SUPRIMENTO';
    return this.addCashMovement({
      type: movType,
      description: reason,
      amount,
      paymentMethod: 'DINHEIRO',
    });
  },

  createPurchase(purchase: any, userName?: string): Purchase {
    return this.addPurchase({
      supplier: purchase.supplier || purchase.supplierName || 'Fornecedor',
      supplierName: purchase.supplier || purchase.supplierName || 'Fornecedor',
      invoiceNumber: purchase.invoiceNumber || 'S/N',
      date: purchase.date || new Date().toISOString(),
      items: purchase.items || [],
      totalAmount: purchase.totalAmount || 0,
      notes: purchase.notes || '',
    });
  },

  saveExpense(expense: any): Expense {
    const list = this.getExpenses();
    const existingIndex = expense.id ? list.findIndex((e: Expense) => e.id === expense.id) : -1;

    const formattedExpense: Expense = {
      id: expense.id || 'exp-' + Date.now(),
      description: expense.description,
      category: expense.category || 'OUTROS',
      amount: Number(expense.amount) || 0,
      date: expense.date || expense.dueDate || new Date().toISOString(),
      dueDate: expense.dueDate || expense.date || new Date().toISOString(),
      paymentDate: expense.paymentDate,
      status: expense.status || 'PENDENTE',
      paymentMethod: expense.paymentMethod || 'DINHEIRO',
      paidFromCash: expense.paidFromCash ?? (expense.paymentMethod === 'DINHEIRO'),
      responsibleName: expense.responsibleName || 'Operador',
      notes: expense.notes,
      createdAt: expense.createdAt || new Date().toISOString(),
      expenseScope: expense.expenseScope || 'LOJA',
      isInstallment: Boolean(expense.isInstallment || (expense.totalInstallments && Number(expense.totalInstallments) > 1)),
      installmentNumber: expense.installmentNumber ? Number(expense.installmentNumber) : undefined,
      totalInstallments: expense.totalInstallments ? Number(expense.totalInstallments) : undefined,
      recurringMonths: expense.recurringMonths ? Number(expense.recurringMonths) : undefined,
      currentMonthIndex: expense.currentMonthIndex ? Number(expense.currentMonthIndex) : undefined,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = formattedExpense;
    } else {
      list.unshift(formattedExpense);
    }
    setItem(STORAGE_KEYS.EXPENSES, list);

    if (formattedExpense.paidFromCash && formattedExpense.status === 'PAGO') {
      this.addCashMovement({
        type: 'DESPESA',
        description: `Despesa: ${formattedExpense.description} (${formattedExpense.category})`,
        amount: formattedExpense.amount,
        paymentMethod: formattedExpense.paymentMethod,
        referenceId: formattedExpense.id,
      });
    }

    this.logAction(
      existingIndex >= 0 ? `Despesa atualizada: ${formattedExpense.description}` : `Despesa registrada: ${formattedExpense.description}`,
      `R$ ${formattedExpense.amount.toFixed(2)} (${formattedExpense.category})`
    );

    FirestoreSyncService.saveExpense(formattedExpense);

    return formattedExpense;
  },

  exportFullBackup(): string {
    return this.exportBackup();
  },

  importFullBackup(jsonString: string): boolean {
    return this.importBackup(jsonString);
  },

  getCustomCategories(): CustomCategory[] {
    return getItem(STORAGE_KEYS.CUSTOM_CATEGORIES, defaultCustomCategories);
  },

  saveCustomCategories(cats: CustomCategory[]): void {
    setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, cats);
  },

  getCustomBrands(): string[] {
    return getItem(STORAGE_KEYS.CUSTOM_BRANDS, defaultCustomBrands);
  },

  saveCustomBrands(brands: string[]): void {
    setItem(STORAGE_KEYS.CUSTOM_BRANDS, brands);
  },

  getCustomOSStatuses(): CustomOSStatusItem[] {
    return getItem(STORAGE_KEYS.CUSTOM_OS_STATUSES, defaultCustomOSStatuses);
  },

  saveCustomOSStatuses(statuses: CustomOSStatusItem[]): void {
    setItem(STORAGE_KEYS.CUSTOM_OS_STATUSES, statuses);
  },

  getCustomDeviceTypes(): CustomDeviceType[] {
    return getItem(STORAGE_KEYS.CUSTOM_DEVICE_TYPES, defaultCustomDeviceTypes);
  },

  saveCustomDeviceTypes(types: CustomDeviceType[]): void {
    setItem(STORAGE_KEYS.CUSTOM_DEVICE_TYPES, types);
  },

  getCustomAccessories(): CustomAccessoryItem[] {
    const list = getItem<CustomAccessoryItem[]>(STORAGE_KEYS.CUSTOM_ACCESSORIES, defaultCustomAccessories);
    if (!list || list.length === 0 || !list.some((item) => item.deviceTypes && item.deviceTypes.length > 0)) {
      return defaultCustomAccessories;
    }
    return list;
  },

  saveCustomAccessories(accessories: CustomAccessoryItem[]): void {
    setItem(STORAGE_KEYS.CUSTOM_ACCESSORIES, accessories);
  },

  getCustomPaymentMethods(): CustomPaymentMethodItem[] {
    return getItem(STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, defaultCustomPaymentMethods);
  },

  saveCustomPaymentMethods(methods: CustomPaymentMethodItem[]): void {
    setItem(STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, methods);
  },

  // Suppliers & Purchases Config
  getPurchasesConfig(): { historyLimitMonths: number; autoDeleteExpired: boolean } {
    return getItem(STORAGE_KEYS.PURCHASES_CONFIG, { historyLimitMonths: 12, autoDeleteExpired: true });
  },

  savePurchasesConfig(config: { historyLimitMonths: number; autoDeleteExpired: boolean }): void {
    setItem(STORAGE_KEYS.PURCHASES_CONFIG, config);
  },

  getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  },

  saveSupplier(supplier: Supplier): Supplier {
    const stored = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const idx = stored.findIndex((s) => s.id === supplier.id || s.name.toLowerCase() === supplier.name.toLowerCase());
    
    const computed: Supplier = {
      ...supplier,
      id: supplier.id || 'sup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };

    if (idx >= 0) {
      stored[idx] = computed;
      this.logAction(`Fornecedor atualizado: ${computed.name}`);
    } else {
      stored.unshift(computed);
      this.logAction(`Fornecedor cadastrado: ${computed.name}`);
    }
    
    setItem(STORAGE_KEYS.SUPPLIERS, stored);
    return computed;
  },

  deleteSupplier(id: string): void {
    const stored = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const filtered = stored.filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SUPPLIERS, filtered);
    this.logAction('Fornecedor excluído');
  },

  getResellers(): Reseller[] {
    return getItem<Reseller[]>(STORAGE_KEYS.RESELLERS, []);
  },

  saveReseller(reseller: Reseller): Reseller {
    const list = this.getResellers();
    const idx = list.findIndex((r) => r.id === reseller.id);
    const now = new Date().toISOString();
    const computed: Reseller = {
      ...reseller,
      balance: Number(reseller.balance) || 0,
      creditLimit: Number(reseller.creditLimit) || 0,
      discountPercent: Number(reseller.discountPercent) || 0,
      totalPurchased: Number(reseller.totalPurchased) || 0,
      totalPaid: Number(reseller.totalPaid) || 0,
      status: reseller.status || 'Ativo',
      updatedAt: now,
      createdAt: reseller.createdAt || now,
    };

    if (idx >= 0) {
      list[idx] = computed;
      this.logAction(`Revendedor atualizado: ${computed.name}`);
    } else {
      list.unshift(computed);
      this.logAction(`Novo revendedor cadastrado: ${computed.name}`);
    }
    setItem(STORAGE_KEYS.RESELLERS, list);
    return computed;
  },

  deleteReseller(id: string): void {
    const list = this.getResellers();
    const target = list.find((r) => r.id === id);
    setItem(STORAGE_KEYS.RESELLERS, list.filter((r) => r.id !== id));
    if (target) {
      this.logAction(`Revendedor excluído: ${target.name}`);
    }
  },

  getResellerTransactions(resellerId?: string): ResellerTransaction[] {
    const list = getItem<ResellerTransaction[]>(STORAGE_KEYS.RESELLER_TRANSACTIONS, []);
    if (resellerId) {
      return list.filter((t) => t.resellerId === resellerId);
    }
    return list;
  },

  saveResellerTransaction(transaction: ResellerTransaction): ResellerTransaction {
    const list = this.getResellerTransactions();
    const idx = list.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      list[idx] = transaction;
    } else {
      list.unshift(transaction);
    }
    setItem(STORAGE_KEYS.RESELLER_TRANSACTIONS, list);
    return transaction;
  },

  deleteResellerTransaction(id: string): void {
    const list = this.getResellerTransactions();
    setItem(STORAGE_KEYS.RESELLER_TRANSACTIONS, list.filter((t) => t.id !== id));
    this.logAction('Transação de revenda excluída');
  },

  // Helper to record a new wholesale sale to a reseller with stock deduction and balance update
  createResellerSale(params: {
    resellerId: string;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    totalAmount: number;
    paidAmount?: number;
    paymentMethod?: string;
    discount?: number;
    notes?: string;
    userName?: string;
  }): { transaction: ResellerTransaction; reseller: Reseller } {
    const resellers = this.getResellers();
    const reseller = resellers.find((r) => r.id === params.resellerId);
    if (!reseller) {
      throw new Error('Revendedor não encontrado');
    }

    const invoiceNum = `REV-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const paid = Number(params.paidAmount) || 0;
    const remainingBalance = Math.max(0, params.totalAmount - paid);

    // 1. Create transaction record
    const newTransaction: ResellerTransaction = {
      id: `rtx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      resellerId: reseller.id,
      resellerName: reseller.name,
      type: 'SALE',
      date: now,
      items: params.items,
      totalAmount: params.totalAmount,
      paidAmount: paid,
      paymentMethod: params.paymentMethod || 'A_PRAZO',
      discount: Number(params.discount) || 0,
      notes: params.notes,
      invoiceNumber: invoiceNum,
      status: 'CONCLUIDO',
      userName: params.userName || 'Sistema',
    };

    this.saveResellerTransaction(newTransaction);

    // 2. Deduct inventory stocks
    const allProducts = this.getProducts();
    params.items.forEach((item) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      if (prod) {
        const oldStock = prod.stockQuantity ?? prod.stock ?? 0;
        const newStock = Math.max(0, oldStock - item.quantity);
        this.saveProduct({
          ...prod,
          stockQuantity: newStock,
          stock: newStock,
        });

        // Add stock movement log
        this.addStockMovement({
          productId: prod.id,
          productName: prod.name,
          type: 'SAIDA',
          quantity: item.quantity,
          previousStock: oldStock,
          newStock: newStock,
          unitCost: prod.costPrice,
          reason: `Venda Revenda #${invoiceNum} - ${reseller.name}`,
          referenceId: newTransaction.id,
          userName: params.userName || 'Sistema',
        });
      }
    });

    // 3. Update reseller balance and totals
    const updatedReseller: Reseller = {
      ...reseller,
      balance: (Number(reseller.balance) || 0) + remainingBalance,
      totalPurchased: (Number(reseller.totalPurchased) || 0) + params.totalAmount,
      totalPaid: (Number(reseller.totalPaid) || 0) + paid,
      updatedAt: now,
    };
    this.saveReseller(updatedReseller);

    this.logAction(`Venda para revendedor ${reseller.name} finalizada (#${invoiceNum} - R$ ${params.totalAmount.toFixed(2)})`);

    return { transaction: newTransaction, reseller: updatedReseller };
  },

  // Helper to record payment/settlement from a reseller
  createResellerPayment(params: {
    resellerId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    userName?: string;
  }): { transaction: ResellerTransaction; reseller: Reseller } {
    const resellers = this.getResellers();
    const reseller = resellers.find((r) => r.id === params.resellerId);
    if (!reseller) {
      throw new Error('Revendedor não encontrado');
    }

    const invoiceNum = `REC-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const paymentAmount = Number(params.amount) || 0;

    // 1. Create transaction record
    const newTransaction: ResellerTransaction = {
      id: `rtx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      resellerId: reseller.id,
      resellerName: reseller.name,
      type: 'PAYMENT',
      date: now,
      totalAmount: paymentAmount,
      paidAmount: paymentAmount,
      paymentMethod: params.paymentMethod || 'DINHEIRO',
      notes: params.notes || `Acerto de contas / Pagamento de revenda`,
      invoiceNumber: invoiceNum,
      status: 'CONCLUIDO',
      userName: params.userName || 'Sistema',
    };

    this.saveResellerTransaction(newTransaction);

    // 2. Deduct from reseller outstanding balance
    const currentBalance = Number(reseller.balance) || 0;
    const newBalance = Math.max(0, currentBalance - paymentAmount);
    const updatedReseller: Reseller = {
      ...reseller,
      balance: newBalance,
      totalPaid: (Number(reseller.totalPaid) || 0) + paymentAmount,
      updatedAt: now,
    };
    this.saveReseller(updatedReseller);

    this.logAction(`Pagamento recebido do revendedor ${reseller.name} (#${invoiceNum} - R$ ${paymentAmount.toFixed(2)})`);

    return { transaction: newTransaction, reseller: updatedReseller };
  },

  // Bulk Save Methods for Backup & Migration
  saveCustomers(customers: Customer[]): void {
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    notifyListeners();
  },

  saveDevices(devices: Device[]): void {
    setItem(STORAGE_KEYS.DEVICES, devices);
    notifyListeners();
  },

  saveProducts(products: Product[]): void {
    setItem(STORAGE_KEYS.PRODUCTS, products);
    notifyListeners();
  },

  saveOrders(orders: ServiceOrder[]): void {
    setItem(STORAGE_KEYS.ORDERS, orders);
    notifyListeners();
  },

  saveSales(sales: Sale[]): void {
    setItem(STORAGE_KEYS.SALES, sales);
    notifyListeners();
  },

  saveExpenses(expenses: Expense[]): void {
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    notifyListeners();
  },

  saveEmployees(employees: Employee[]): void {
    setItem(STORAGE_KEYS.EMPLOYEES, employees);
    notifyListeners();
  },

  saveReceivables(receivables: AccountReceivable[]): void {
    setItem(STORAGE_KEYS.RECEIVABLES, receivables);
    notifyListeners();
  },

  saveSettings(settings: CompanySettings): void {
    this.saveCompanySettings(settings);
  },

  getCustomOsStatuses(): CustomOSStatusItem[] {
    return this.getCustomOSStatuses();
  },
};

function alignCustomersAcrossSectors(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (!Array.isArray(customers) || customers.length === 0) return;

    const customersMap = new Map<string, Customer>();
    customers.forEach(c => customersMap.set(c.id, c));

    // 1. Align Service Orders (OS)
    const orders = getItem<ServiceOrder[]>(STORAGE_KEYS.ORDERS, []);
    if (Array.isArray(orders) && orders.length > 0) {
      let modified = false;
      const updatedOrders = orders.map(o => {
        if (o.customerId && customersMap.has(o.customerId)) {
          const c = customersMap.get(o.customerId)!;
          if (
            o.customerName !== c.name ||
            o.customerPhone !== (c.phone || c.whatsapp) ||
            o.customerWhatsapp !== (c.whatsapp || c.phone) ||
            o.customerDocument !== c.document
          ) {
            modified = true;
            return {
              ...o,
              customerName: c.name,
              customerPhone: c.phone || c.whatsapp || '',
              customerWhatsapp: c.whatsapp || c.phone || '',
              customerDocument: c.document,
            };
          }
        } else {
          // Fuzzy search by name match
          const cleanName = o.customerName ? o.customerName.trim().toLowerCase() : '';
          if (cleanName) {
            const matchedCust = customers.find(c => {
              const cn = c.name.trim().toLowerCase();
              return cn === cleanName || cn.includes(cleanName) || cleanName.includes(cn);
            });
            if (matchedCust) {
              modified = true;
              return {
                ...o,
                customerId: matchedCust.id,
                customerName: matchedCust.name,
                customerPhone: matchedCust.phone || matchedCust.whatsapp || '',
                customerWhatsapp: matchedCust.whatsapp || matchedCust.phone || '',
                customerDocument: matchedCust.document,
              };
            }
          }
        }
        return o;
      });

      if (modified) {
        setItem(STORAGE_KEYS.ORDERS, updatedOrders);
      }
    }

    // 2. Align Receivables / A Prazo / Fiado
    const receivables = getItem<AccountReceivable[]>(STORAGE_KEYS.RECEIVABLES, []);
    if (Array.isArray(receivables) && receivables.length > 0) {
      let modified = false;
      const updatedReceivables = receivables.map(r => {
        if (r.customerId && customersMap.has(r.customerId)) {
          const c = customersMap.get(r.customerId)!;
          if (
            r.customerName !== c.name ||
            r.customerPhone !== (c.phone || c.whatsapp) ||
            (r as any).customerDocument !== c.document ||
            (r as any).cpfCnpj !== c.document
          ) {
            modified = true;
            return {
              ...r,
              customerName: c.name,
              customerPhone: c.phone || c.whatsapp || '',
              customerDocument: c.document,
              cpfCnpj: c.document,
            };
          }
        } else {
          // Fuzzy search by name match
          const cleanName = r.customerName ? r.customerName.trim().toLowerCase() : '';
          if (cleanName) {
            const matchedCust = customers.find(c => {
              const cn = c.name.trim().toLowerCase();
              return cn === cleanName || cn.includes(cleanName) || cleanName.includes(cn);
            });
            if (matchedCust) {
              modified = true;
              return {
                ...r,
                customerId: matchedCust.id,
                customerName: matchedCust.name,
                customerPhone: matchedCust.phone || matchedCust.whatsapp || '',
                customerDocument: matchedCust.document,
                cpfCnpj: matchedCust.document,
              };
            }
          }
        }
        return r;
      });

      if (modified) {
        setItem(STORAGE_KEYS.RECEIVABLES, updatedReceivables);
      }
    }

    // 3. Align Devices
    const devices = getItem<Device[]>(STORAGE_KEYS.DEVICES, []);
    if (Array.isArray(devices) && devices.length > 0) {
      let modified = false;
      const updatedDevices = devices.map(d => {
        if (d.customerId && customersMap.has(d.customerId)) {
          const c = customersMap.get(d.customerId)!;
          if (d.customerName !== c.name || (d as any).customerPhone !== (c.phone || c.whatsapp)) {
            modified = true;
            return {
              ...d,
              customerName: c.name,
              customerPhone: c.phone || c.whatsapp || '',
            };
          }
        }
        return d;
      });
      if (modified) {
        setItem(STORAGE_KEYS.DEVICES, updatedDevices);
      }
    }
  } catch (e) {
    console.error('Failed to align customers across sectors', e);
  }
}

function ensureInitialized(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      StorageService.resetToDemoData();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Auto self-heal and align legacy mock/existing data on boot
      alignCustomersAcrossSectors();
    }

    const isFinanceZeroed = localStorage.getItem('msp_finance_zeroed_v3');
    if (!isFinanceZeroed) {
      StorageService.zeroCashAndFinancialData();
      localStorage.setItem('msp_finance_zeroed_v3', 'true');
    }
  } catch (e) {
    console.error('Storage initialization check failed', e);
  }
}

ensureInitialized();

