export type UserRole = 'ADMINISTRADOR' | 'ADMIN' | 'GERENTE' | 'TECNICO' | 'VENDEDOR' | 'CAIXA';

export type NavigationTab =
  | 'DASHBOARD'
  | 'CUSTOMERS'
  | 'DEVICES'
  | 'ORDERS'
  | 'POS'
  | 'PRODUCTS'
  | 'PURCHASES'
  | 'RECEIVABLES'
  | 'RESELLERS'
  | 'FINANCE'
  | 'CASH'
  | 'REPORTS'
  | 'EMPLOYEES'
  | 'SETTINGS';

export interface UserPermissions {
  canAccessAdminSettings: boolean;
  canViewFinancialReports: boolean;
  canViewProductCost: boolean;
  canManageEmployees: boolean;
  canManageProducts: boolean;
  canManageCustomers: boolean;
  canManageOrders: boolean;
  canOperatePos: boolean;
  canOperateCash: boolean;
  canManageExpenses: boolean;
  canDeleteRecords: boolean;
}

export interface Employee {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email: string;
  role: UserRole;
  username?: string;
  password?: string;
  pinCode?: string;
  commissionRate?: number;
  status: 'ATIVO' | 'INATIVO';
  permissions: UserPermissions;
  avatarUrl?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood?: string;
  zipCode?: string;
  city: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'Ativo' | 'Inativo' | 'VIP';
  birthDate?: string;
  gender?: string;
  clientType?: 'Pessoa Física' | 'Pessoa Jurídica' | 'Outro';
  avatarUrl?: string;
  lastServiceDate?: string;
  totalSpent?: number;
  creditLimit?: number; // Limite de Crediário / A Prazo
  allowCrediario?: boolean; // Se permite compras a prazo
  debtBalance?: number; // Saldo devedor total acumulado
}

export type DeviceType =
  | 'Smartphone'
  | 'Notebook'
  | 'Desktop'
  | 'Tablet'
  | 'Console'
  | 'Monitor'
  | 'Impressora'
  | 'Smartwatch'
  | 'TV'
  | 'Áudio'
  | 'Outro'
  | string;

export interface CustomDeviceType {
  id: string;
  name: string;
  iconName?: string;
  isDefault?: boolean;
}

export interface CustomAccessoryItem {
  id: string;
  name: string;
  category?: string;
  defaultPresent?: boolean;
  hasDetails?: boolean;
  iconName?: string;
  placeholder?: string;
  deviceTypes?: string[];
}

export interface CustomPaymentMethodItem {
  id: string;
  code: string;
  name: string;
  isSystem?: boolean;
  isActive?: boolean;
}

export interface Device {
  id: string;
  customerId: string;
  customerName?: string;
  type: DeviceType;
  brand: string;
  model: string;
  imei?: string;
  serialNumber?: string;
  color: string;
  physicalCondition: string;
  passwordPin?: string;
  passwordType?: 'PIN' | 'PATTERN' | 'NONE';
  passwordPattern?: number[];
  accessoriesDelivered?: string;
  notes?: string;
  photoUrl?: string;
  status?: 'Em assistência' | 'Concluído' | 'Sem movimento' | string;
  osCount?: number;
  createdAt: string;
}

export type OrderStatus =
  | 'ORCAMENTO'
  | 'AGUARDANDO_AUTORIZACAO'
  | 'AUTORIZADO'
  | 'AGUARDANDO_PECA'
  | 'ATRASADO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'PRONTO_ENTREGA'
  | 'NOVA'
  | 'ABERTA'
  | 'AGUARDANDO_DIAGNOSTICO'
  | 'EM_ANALISE'
  | 'AGUARDANDO_ORCAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'EM_MANUTENCAO'
  | 'PRONTA'
  | 'CANCELADA'
  | 'GARANTIA'
  | 'NAO_APROVADA';

export interface OrderItem {
  id: string;
  type: 'SERVICO' | 'PECA' | 'PRODUTO';
  productId?: string;
  productName?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  costPrice?: number;
  discount: number;
  total: number;
  totalPrice?: number;
}

export type OrderPartItem = OrderItem;

export interface OrderStatusHistory {
  status: OrderStatus;
  changedAt?: string;
  timestamp?: string;
  changedBy?: string;
  userName?: string;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: number;
  createdAt: string;
  updatedAt?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerDocument?: string;
  
  // Aparelho
  deviceId?: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  imei?: string;
  serialNumber?: string;
  passwordPin?: string;
  passwordType?: 'PIN' | 'PATTERN' | 'NONE';
  passwordPattern?: number[];
  physicalCondition: string;
  physicalState?: string;
  accessories: string;
  checklistAccessories?: {
    chip1?: { present: boolean; details?: string };
    chip2?: { present: boolean; details?: string };
    memoryCard?: { present: boolean; details?: string };
    caseCover?: { present: boolean; details?: string };
    charger?: { present: boolean; details?: string };
    others?: { present: boolean; details?: string };
  };

  // Defeito e diagnóstico
  clientDefect: string;
  technicalDiagnosis: string;
  requestedService?: string;
  performedService?: string;

  // Itens do orçamento / peças
  items: OrderItem[];
  parts?: OrderItem[];

  // Valores
  laborPrice: number; // Mão de obra
  partsPrice: number; // Peças
  discount: number;
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: 'PENDENTE' | 'PAGO' | 'PARCIAL';

  // Responsáveis e datas
  technicianName: string;
  attendantName: string;
  estimatedCompletionDate?: string;
  deliveredAt?: string;
  warrantyDays: number; // Ex: 90 dias

  // Observações
  internalNotes?: string;
  customerNotes?: string;

  // Fotos
  photosBefore?: string[];
  photosAfter?: string[];

  // Status
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  history?: OrderStatusHistory[];

  companyId?: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  brand: string;
  model?: string;
  supplier?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  resellerPrice: number; // New field
  profitMarginPercent?: number; // calculated: ((selling - cost) / cost) * 100
  profitGrossAmount?: number; // calculated: selling - cost
  stockQuantity: number;
  stock?: number;
  minStockQuantity: number;
  minStock?: number;
  location: string;
  description?: string;
  notes?: string;
  isActive: boolean;
  photoUrl?: string;
  createdAt: string;
  companyId?: string;
}

export interface Reseller {
  id: string;
  name: string;
  tradeName?: string;
  document: string;
  personType?: 'PF' | 'PJ';
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  creditLimit: number;
  discountPercent?: number;
  balance: number;
  totalPurchased?: number;
  totalPaid?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResellerTransaction {
  id: string;
  resellerId: string;
  resellerName?: string;
  type: 'SALE' | 'RETURN' | 'PAYMENT' | 'ADJUSTMENT';
  date: string;
  items?: {
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
  invoiceNumber?: string;
  status?: 'CONCLUIDO' | 'PENDENTE' | 'CANCELADO';
  userName?: string;
}

export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'VENDA' | 'ORDEM_SERVICO' | 'COMPRA';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  date: string;
  userName: string;
  reason: string;
  referenceId?: string; // id of sale or order
}

export type PaymentMethod = 
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO'
  | 'TRANSFERENCIA'
  | 'FIADO'
  | 'A_PRAZO'
  | 'A PRAZO'
  | 'MULTIPLO'
  | 'BOLETO';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  costPrice?: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: number;
  date: string;
  createdAt?: string;
  customerId?: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  costTotal?: number;
  amountPaid?: number;
  profit: number;
  paymentMethod: PaymentMethod;
  installments?: number; // Para cartão de crédito
  amountReceived?: number;
  change?: number; // Troco
  notes?: string;
  cashSessionId?: string;
  priceTable?: 'VAREJO' | 'ATACADO';
  resellerId?: string;
  companyId?: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  openedBy: string;
  openingBalance: number;
  initialBalance?: number;
  currentBalance?: number;
  closedAt?: string;
  closedBy?: string;
  closingBalanceExpected?: number;
  closingBalanceReported?: number;
  difference?: number;
  status: 'ABERTO' | 'FECHADO';
  notes?: string;
  movements?: CashMovement[];
  
  // Resumo ao fechar
  salesCount?: number;
  totalSales?: number;
  totalCash?: number;
  totalPix?: number;
  totalDebit?: number;
  totalCredit?: number;
  totalOther?: number;
  totalInflows?: number;
  totalOutflows?: number;
}

export type CashMovementType =
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'VENDA'
  | 'SERVICO_OS'
  | 'DESPESA'
  | 'ABERTURA'
  | 'ORDEM_SERVICO'
  | 'ENTRADA_AVULSA';

export interface CashMovement {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  timestamp?: string;
  userName: string;
  referenceId?: string;
}

export type ExpenseCategory = 
  | 'Aluguel'
  | 'Energia Elétrica'
  | 'Água'
  | 'Internet e Telefonia'
  | 'Fornecedor de Peças'
  | 'Material de Consumo'
  | 'Transporte e Frete'
  | 'Salários e Comissões'
  | 'Impostos e Taxas'
  | 'Outras Despesas'
  | 'ALUGUEL'
  | 'ENERGIA_AGUA'
  | 'INTERNET_TELEFONE'
  | 'FORNECEDORES'
  | 'FERRAMENTAS_EQUIPAMENTOS'
  | 'SALARIOS_COMISSOES'
  | 'IMPOSTOS'
  | 'SOFTWARE_SISTEMAS'
  | 'MARKETING'
  | 'OUTROS';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date?: string;
  dueDate?: string;
  paymentDate?: string;
  status?: 'PENDENTE' | 'PAGO';
  paymentMethod: PaymentMethod;
  paidFromCash?: boolean; // Retirado do caixa da loja
  responsibleName?: string;
  notes?: string;
  createdAt: string;

  // Duração e Acompanhamento de Despesas Mensais Recorrentes
  recurringMonths?: number; // Quantidade total de meses do contrato/recorrência (ex: 12, 24)
  currentMonthIndex?: number; // Número da parcela/mês atual (ex: Mês 1 de 12)

  // Origem / Âmbito
  expenseScope?: 'LOJA' | 'CASA'; // Despesa da Loja ou Despesa de Casa/Pessoal

  // Despesas Parceladas
  isInstallment?: boolean; // Se a despesa é parcelada
  installmentNumber?: number; // Número da parcela atual (ex: 1)
  totalInstallments?: number; // Total de parcelas (ex: 6)
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  supplier: string;
  supplierName?: string;
  supplierLogo?: string;
  invoiceNumber: string;
  date: string;
  status?: 'Recebida' | 'Em Trânsito' | 'Parcial' | 'Cancelada';
  items: PurchaseItem[];
  totalAmount: number;
  total?: number;
  userName: string;
  notes?: string;
}

export interface ReceivablePayment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  userName: string;
  notes?: string;
}

export interface AccountReceivable {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  originType: 'ORDEM_SERVICO' | 'VENDA';
  referenceNumber: string; // Ex: OS #1002 ou Venda #54
  referenceId: string;
  amount: number; // Saldo devedor atual
  originalAmount?: number; // Valor total original
  paidAmount?: number; // Total já pago / amortizado
  remainingAmount?: number; // Saldo restante
  downPayment?: number; // Entrada inicial
  downPaymentMethod?: PaymentMethod;
  deviceInfo?: string; // Aparelho vinculado (Ex: Samsung Galaxy A54)
  serviceDescription?: string; // Serviço ou descrição
  dueDate: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
  paymentMethod?: PaymentMethod;
  payments?: ReceivablePayment[];
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole?: string;
  action: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  timestamp: string;
}

export interface CompanySettings {
  name: string;
  commercialName: string; // MSP Informática
  ownerName?: string; // Vicente Pereira Dias
  slogan?: string; // A TECNOLOGIA SIMPLIFICADA
  cnpj?: string;
  cnpjCpf: string;
  address: string;
  neighborhood?: string; // CENTRAL
  city: string; // IPAPORANGA
  state: string; // CE
  zipCode: string; // 62215-000
  phone: string; // (88) 9 8832-3089
  whatsapp: string;
  email: string;
  instagram: string;
  pixKey?: string;
  logoUrl?: string;
  warrantyText: string;
  defaultWarrantyTerms?: string;
  receiptDisclaimer?: string;
  defaultWarrantyDays: number;
  requireOpenCashForSales: boolean;
  printHeaderNote: string;
  printFooterNote: string;
  saasReady: boolean;
  managerPassword?: string; // Senha do Gerente para autorizar edição de valores e descontos na OS (Padrão: 1507)

  // Specific OS Thermal Receipt Customization (identical to physical ticket model)
  osReceiptTitle?: string; // Default: 'Ordem Servico'
  osReceiptSubtitle?: string; // Default: 'Comprovante de Recebimento'
  osChecklistText?: string; // Checklist lines with checkboxes
  osResponsibleSignLabel?: string; // Default: 'Ass. do Responsável'
  osCustomerSignLabel?: string; // Default: 'Ass. do Cliente'
  osFooterTerms?: string; // Default: "Garantia de 90 dias sobre serviços e peças\nGuarde essa OS ela é a sua garantia do serviço\nA Garantia não cobre mau uso"
  osShowProblemBox?: boolean; // Default: true
  osShowLaudoBox?: boolean; // Default: true
  osShowNotesBox?: boolean; // Default: true
  osShowSignatures?: boolean; // Default: true
  osShowCustomerAddress?: boolean; // Default: true
  osDefaultPaperFormat?: '80mm' | '58mm' | 'a4'; // Default: '80mm'
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
  notes?: string;
}

export type PlanType = 'TRIAL' | 'LOJA' | 'REVENDA' | 'FREE' | 'PRO' | 'ENTERPRISE' | 'TESTE_REAL';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'trial' | 'ATIVO' | 'EXPIRANDO' | 'VENCIDO' | 'TRIAL';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  maxMonthlyOrders: number | null; // null = unlimited
  maxProducts: number | null;     // null = unlimited
  maxCollaborators: number | null; // null = unlimited
  advancedReports: boolean;
  pdfExport: boolean;
  cloudBackup: boolean;
  auditLogs: boolean;
  prioritySupport?: boolean;
}

export interface SubscriptionPlanInfo {
  planType: PlanType;
  planName: string;
  planPrice: number;
  billingCycle: BillingCycle;
  billingPeriod: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'VITALÍCIO';
  expiryDate: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  clientName?: string;
  autoRenew?: boolean;
  contractNumber?: string;
  paymentMethod?: string;
  notes?: string;
  startDate?: string;
  canceledAt?: string;
  isTrial?: boolean;
  trialDaysRemaining?: number;
}


