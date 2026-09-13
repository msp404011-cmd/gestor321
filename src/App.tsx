import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { LayoutDashboard, Wrench, ShoppingCart, Users, Package } from 'lucide-react';
import { db } from './lib/firebase';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LoginModal } from './components/auth/LoginModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { CustomerModal } from './components/customers/CustomerModal';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { DeviceListView } from './components/devices/DeviceListView';
import { DeviceModal } from './components/devices/DeviceModal';
import { OrderListView } from './components/orders/OrderListView';
import { OrderModal } from './components/orders/OrderModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { OrderPrintModal } from './components/orders/OrderPrintModal';
import { PosView } from './components/pos/PosView';
import { ProductListView } from './components/products/ProductListView';
import { ProductModal } from './components/products/ProductModal';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ResellerListView } from './components/resellers/ResellerListView';
import { FinanceView } from './components/finance/FinanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { ReceivablesView } from './components/receivables/ReceivablesView';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { PaywallModal } from './components/subscription/PaywallModal';
import { BlockedAccountModal } from './components/common/BlockedAccountModal';
import { SubscriptionService, normalizePlanType } from './services/subscriptionService';
import { LoginView } from './components/auth/LoginView';
import { MasterAuthModal } from './components/master/MasterAuthModal';
import { MasterPanel } from './components/master/MasterPanel';

// Models & Services
import { NavigationTab, Customer, Device, ServiceOrder, Product, Employee, SubscriptionPlanInfo, PlanType } from './types';
import { StorageService } from './services/storage';
import { useTheme } from './context/ThemeContext';
import { GoogleDriveBackupService } from './services/googleDriveBackupService';

export default function App() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<NavigationTab>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Authentication & Session State
  const [authSession, setAuthSession] = useState(() => StorageService.getAuthSession());
  const [currentUser, setCurrentUser] = useState(() => StorageService.getCurrentUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Storage state tick to trigger reactive updates across all components
  const [tick, setTick] = useState(0);

  // Modals state
  const [customerModalState, setCustomerModalState] = useState<{
    isOpen: boolean;
    customerToEdit?: Customer | null;
  }>({ isOpen: false });

  const [customerDetailState, setCustomerDetailState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
  }>({ isOpen: false, customer: null });

  const [deviceModalState, setDeviceModalState] = useState<{
    isOpen: boolean;
    deviceToEdit?: Device | null;
    initialCustomerId?: string;
  }>({ isOpen: false });

  const [orderModalState, setOrderModalState] = useState<{
    isOpen: boolean;
    orderToEdit?: ServiceOrder | null;
    initialCustomerId?: string;
    initialDeviceId?: string;
  }>({ isOpen: false });

  const [orderDetailState, setOrderDetailState] = useState<{
    isOpen: boolean;
    order: ServiceOrder | null;
  }>({ isOpen: false, order: null });

  const [orderPrintState, setOrderPrintState] = useState<{
    isOpen: boolean;
    order: ServiceOrder | null;
  }>({ isOpen: false, order: null });

  const [globalOrderToDelete, setGlobalOrderToDelete] = useState<ServiceOrder | null>(null);

  const [productModalState, setProductModalState] = useState<{
    isOpen: boolean;
    productToEdit?: Product | null;
  }>({ isOpen: false });

  // Subscription and Paywall Modals State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);
  const [blockedAccountInfo, setBlockedAccountInfo] = useState<{ name?: string; email?: string }>({});
  const [paywallModalState, setPaywallModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    feature: 'ORDERS_LIMIT' | 'PRODUCTS_LIMIT' | 'ADVANCED_REPORTS' | 'EXPORT_PDF';
  }>({
    isOpen: false,
    title: '',
    description: '',
    feature: 'ORDERS_LIMIT',
  });
  
  // Master Panel State
  const MASTER_ADMIN_EMAIL = 'mmspmartins62@gmail.com';
  const [showMasterAuth, setShowMasterAuth] = useState(false);
  const [showMasterPanel, setShowMasterPanel] = useState(false);

  const isMasterAdmin = Boolean(
    (authSession?.email && authSession.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL) ||
    (currentUser?.email && currentUser.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL)
  );

  const handleLogoClick = () => {
    if (!isMasterAdmin) return;
    setShowMasterAuth(true);
  };

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Sincroniza o operador e a sessão de forma reativa quando o storage muda
  useEffect(() => {
    setCurrentUser(StorageService.getCurrentUser());
    setAuthSession(StorageService.getAuthSession());
  }, [tick]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update order detail reference if orders change in storage
  useEffect(() => {
    if (orderDetailState.order) {
      const orders = StorageService.getOrders();
      const updated = orders.find((o) => o.id === orderDetailState.order?.id);
      if (updated) {
        setOrderDetailState((prev) => ({ ...prev, order: updated }));
      }
    }
  }, [tick]);

  // Enforce plan-based tab permissions automatically (PDV & VENDAS / ASSISTENCIA modes)
  useEffect(() => {
    if (authSession?.isAuthenticated && !SubscriptionService.isTabAllowed(activeTab)) {
      console.warn(`🔒 Acesso negado à aba "${activeTab}" para o plano atual.`);
      const currentSub = StorageService.getSubscriptionPlan();
      const planType = currentSub.planType;
      
      const fallbackTab = SubscriptionService.isTabAllowed('DASHBOARD')
        ? 'DASHBOARD'
        : SubscriptionService.isTabAllowed('ORDERS')
        ? 'ORDERS'
        : 'POS';

      setActiveTab(fallbackTab);

      let modalTitle = 'Módulo Indisponível no seu Plano';
      let modalDescription = 'Esta funcionalidade pertence a um plano superior. Faça upgrade no Painel Master ou na aba Assinatura para liberar o acesso.';

      if (planType === 'PDV_VENDAS') {
        modalTitle = 'Módulo Indisponível no Plano PDV & Vendas';
        modalDescription = 'O Plano PDV & Vendas é focado em Frente de Caixa (PDV), Vendas Balcão, Estoque, Clientes, Crédito/A Prazo e Controle de Caixa. As funcionalidades de Assistência Técnica (OS e Aparelhos) e Revenda exigem o Plano Assistência Técnica ou Revenda.';
      } else if (planType === 'ASSISTENCIA') {
        modalTitle = 'Módulo Exclusivo do Plano Revenda / Atacado';
        modalDescription = 'O Plano Assistência Técnica contempla Ordens de Serviço, Aparelhos, Checklists, PDV, Peças/Estoque, DRE e Relatórios. A gestão de Revenda e Atacado de Aparelhos é exclusiva do Plano Revenda / Atacado.';
      }

      setPaywallModalState({
        isOpen: true,
        title: modalTitle,
        description: modalDescription,
        feature: 'ORDERS_LIMIT',
      });
    }
  }, [activeTab, authSession, tick]);

  // Subscription-gated order and product openers
  const handleOpenNewOrder = (initialCustomerId?: string, initialDeviceId?: string) => {
    if (!SubscriptionService.isTabAllowed('ORDERS')) {
      setPaywallModalState({
        isOpen: true,
        title: 'Módulo Indisponível no Plano PDV & Vendas',
        description:
          'O Plano PDV & Vendas não inclui o módulo de Ordens de Serviço. Para registrar equipamentos e gerenciar assistência técnica, faça o upgrade para o Plano Assistência Técnica.',
        feature: 'ORDERS_LIMIT',
      });
      return;
    }
    const limits = SubscriptionService.checkSubscriptionLimits();
    if (!limits.canCreateOrder) {
      setPaywallModalState({
        isOpen: true,
        title: 'Recurso Bloqueado',
        description:
          limits.orderLimitReason ||
          'Seu plano atual não permite criar novas Ordens de Serviço.',
        feature: 'ORDERS_LIMIT',
      });
      return;
    }
    setOrderModalState({
      isOpen: true,
      orderToEdit: null,
      initialCustomerId,
      initialDeviceId,
    });
  };

  const handleOpenNewProduct = () => {
    const limits = SubscriptionService.checkSubscriptionLimits();
    if (!limits.canCreateProduct) {
      setPaywallModalState({
        isOpen: true,
        title: 'Limite de Estoque Atingido',
        description:
          limits.productLimitReason ||
          'Você atingiu o limite de 20 produtos cadastrados no Plano Gratuito. Faça upgrade para o Plano Pro para ter estoque ilimitado!',
        feature: 'PRODUCTS_LIMIT',
      });
      return;
    }
    setProductModalState({ isOpen: true, productToEdit: null });
  };

  // Real-time synchronization of the subscription plan from Firestore
  useEffect(() => {
    if (!authSession?.email || !db) return;

    const emailKey = authSession.email.trim().toLowerCase();
    const uidKey = authSession.uid?.trim();

    const targets = Array.from(new Set([emailKey, uidKey].filter(Boolean) as string[]));
    const unsubscribes: Array<() => void> = [];

    const handleDocSnap = (docSnap: any) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      // Extract status fields
      const isBlocked = Boolean(
        data.bloqueado === true || 
        data.blocked === true || 
        data.status === 'bloqueado' || 
        data.situacao === 'bloqueado' || 
        data.userStatus === 'bloqueado' ||
        data.inadimplente === true
      );
      const panelStatus = String(data.status || data.situacao || data.userStatus || '').toLowerCase();
      
      const isPanelActive = (panelStatus === 'ativo' || panelStatus === 'active' || data.ativo === true || data.active === true) && !isBlocked;
      const mappedStatus = isPanelActive ? 'active' : 'expired';
      
      const mappedExpiry = data.dataVencimento || data.vencimento || data.dueDate || data.trialEndsAt || data.expiryDate || new Date().toISOString().split('T')[0];
      
      // Extract raw planType and normalize to known PlanType
      const rawPlanId = String(
        data.planoId || data.plano || data.plan || data.planType || data.planoNome || data.planName || ''
      );
      const normalizedPlanType: PlanType = normalizePlanType(rawPlanId);

      const isTrial = normalizedPlanType === 'TRIAL';
      const rawPrice = Number(data.valorPlano ?? data.valorMensalidade ?? data.mensalidade ?? data.amount ?? 0.50);
      const planPrice = isTrial ? 0 : rawPrice;
      const planName = data.planoNome || data.planName || (isTrial ? 'Teste Grátis (7 Dias)' : 'Plano Completo');

      const updatedPlan: SubscriptionPlanInfo = {
        ...StorageService.getSubscriptionPlan(),
        planType: normalizedPlanType,
        planName: planName,
        planPrice: planPrice,
        status: mappedStatus,
        expiryDate: mappedExpiry,
        isTrial: isTrial,
      };

      console.log('🔥 Nova atualização de assinatura recebida em tempo real do Firestore:', updatedPlan.planName, updatedPlan.planType, 'R$', updatedPlan.planPrice, 'Status:', updatedPlan.status, 'Bloqueado:', isBlocked);
      
      // Update local cache and notify listeners so Gestor updates permissions and tabs immediately
      StorageService.saveSubscriptionPlanOnlyLocal(updatedPlan);
      
      // Re-trigger re-renders
      setTick((prev) => prev + 1);

      // Atualiza estado de conta bloqueada
      if (isBlocked) {
        setIsAccountBlocked(true);
        setBlockedAccountInfo({
          name: data.nome || data.name || data.empresa || authSession.name || 'Cliente',
          email: data.email || authSession.email
        });
        setIsSubscriptionModalOpen(false);
      } else {
        setIsAccountBlocked(false);

        // Check for expiration/lock
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        
        // Assuming expiryDate is in YYYY-MM-DD format
        const [y, m, d] = (updatedPlan.expiryDate || '').split('-').map(Number);
        const expDate = new Date(y, (m || 1) - 1, d || 1);
        expDate.setHours(0, 0, 0, 0);

        const isExpired = updatedPlan.status === 'expired' || 
                          updatedPlan.status === 'canceled' || 
                          expDate < now;

        if (isExpired) {
           console.log('🔥 Assinatura expirada detectada. Bloqueando acesso.');
           setIsSubscriptionModalOpen(true);
        } else {
           setIsSubscriptionModalOpen(false);
        }
      }
    };

    targets.forEach((tId) => {
      const docRef = doc(db, 'accounts', tId);
      console.log(`🔥 Ativando listener onSnapshot do Firestore para a assinatura do tenant: ${tId}`);
      const unsub = onSnapshot(docRef, handleDocSnap);
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [authSession?.email, authSession?.uid]);

  // Customer Actions
  const handleSaveCustomer = (customer: Customer) => {
    StorageService.saveCustomer(customer);
    setCustomerModalState({ isOpen: false });
    if (orderModalState.isOpen) {
      setOrderModalState((prev) => ({
        ...prev,
        initialCustomerId: customer.id,
      }));
    }
  };

  // Device Actions
  const handleSaveDevice = (device: Device) => {
    StorageService.saveDevice(device);
    setDeviceModalState({ isOpen: false });
  };

  // Order Actions (With Gating Protection)
  const handleSaveOrder = (order: ServiceOrder) => {
    const existingOrders = StorageService.getOrders();
    const isNew = !existingOrders.some((o) => o.id === order.id);
    if (isNew) {
      const limits = SubscriptionService.checkSubscriptionLimits();
      if (!limits.canCreateOrder) {
        setPaywallModalState({
          isOpen: true,
          title: 'Limite de Ordens de Serviço Atingido',
          description:
            limits.orderLimitReason ||
            'Você atingiu o limite de 10 Ordens de Serviço deste mês no Plano Gratuito.',
          feature: 'ORDERS_LIMIT',
        });
        return;
      }
    }
    StorageService.saveOrder(order);
    setOrderModalState({ isOpen: false });
  };

  // Product Actions (With Gating Protection)
  const handleSaveProduct = (product: Product) => {
    const existingProducts = StorageService.getProducts();
    const isNew = !existingProducts.some((p) => p.id === product.id);
    if (isNew) {
      const limits = SubscriptionService.checkSubscriptionLimits();
      if (!limits.canCreateProduct) {
        setPaywallModalState({
          isOpen: true,
          title: 'Limite de Estoque Atingido',
          description:
            limits.productLimitReason ||
            'Você atingiu o limite de 20 produtos cadastrados no Plano Gratuito.',
          feature: 'PRODUCTS_LIMIT',
        });
        return;
      }
    }
    StorageService.saveProduct(product);
    setProductModalState({ isOpen: false });
  };

  const handleGlobalDeleteConfirm = () => {
    if (globalOrderToDelete) {
      StorageService.deleteOrder(globalOrderToDelete.id);
      setGlobalOrderToDelete(null);
    }
  };

  const handleLoginSuccess = (result: {
    user: Employee;
    plan: SubscriptionPlanInfo;
    isFirstAccess?: boolean;
    isExpiredOrCanceled?: boolean;
  }) => {
    setCurrentUser(result.user);
    setAuthSession(StorageService.getAuthSession());
    setTick((prev) => prev + 1);

    if (result.isExpiredOrCanceled) {
      setIsSubscriptionModalOpen(true);
    }
  };

  const handleLogout = () => {
    // Attempt non-blocking backup if account is connected
    try {
      const session = StorageService.getAuthSession();
      if (session?.email && GoogleDriveBackupService.getAccessToken()) {
        GoogleDriveBackupService.uploadBackupToGoogleDrive(session.email).catch((e) => {
          console.warn('Backup on logout non-blocking warning:', e);
        });
      }
    } catch (e) {
      console.warn('Backup on logout error:', e);
    }

    // Immediately clear tokens and auth session synchronously
    GoogleDriveBackupService.setAccessToken(null);
    StorageService.clearAuthSession();
    setAuthSession(null);
    setIsLoginOpen(false);
    setActiveTab('DASHBOARD');
  };

  // If user is not authenticated, render Login/Landing View
  if (!authSession || !authSession.isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`flex h-screen w-full font-sans antialiased overflow-hidden selection:bg-cyan-500 selection:text-white transition-colors duration-300 ${
      isDark ? 'bg-[#050814] text-slate-100' : 'bg-[#f0f4fa] text-slate-900'
    }`}>
      {/* Sidebar Navigation */}
      {activeTab !== 'POS' && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          isMasterAdmin={isMasterAdmin}
          onLogoClick={isMasterAdmin ? handleLogoClick : undefined}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenPlans={() => setIsSubscriptionModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-colors duration-300 ${
        isDark ? 'bg-[#050814]' : 'bg-[#f0f4fa]'
      }`}>
        {/* Navbar */}
        {activeTab !== 'POS' && (
          <Navbar
            currentUser={currentUser}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenNewOrder={() => handleOpenNewOrder()}
            onOpenNewCustomer={() => setCustomerModalState({ isOpen: true, customerToEdit: null })}
            onOpenPDV={() => setActiveTab('POS')}
            onSwitchUser={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
            onOpenPlans={() => setIsSubscriptionModalOpen(true)}
            onOpenMaster={isMasterAdmin ? () => setShowMasterAuth(true) : undefined}
          />
        )}

        {/* Dynamic Main View */}
        <main className={
          activeTab === 'POS'
            ? "flex-1 h-screen w-screen overflow-hidden p-0 flex flex-col"
            : "flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 lg:pb-6 max-w-[1780px] w-full mx-auto scrollbar-thin"
        }>
          {/* Master Panel */}
          {showMasterAuth && (
            <MasterAuthModal onClose={() => setShowMasterAuth(false)} onSuccess={() => {setShowMasterAuth(false); setShowMasterPanel(true);}} />
          )}
          {showMasterPanel && <MasterPanel onClose={() => setShowMasterPanel(false)} />}

          {/* Dynamic Main View Components */}
          {activeTab === 'DASHBOARD' && (
            <DashboardView
              onOpenNewOrder={() => handleOpenNewOrder()}
              onOpenPDV={() => setActiveTab('POS')}
              onViewOrder={(order) => setOrderDetailState({ isOpen: true, order })}
              onNavigate={(tab) => setActiveTab(tab as NavigationTab)}
              onOpenNewProduct={() => handleOpenNewProduct()}
              onOpenPlans={() => setIsSubscriptionModalOpen(true)}
            />
          )}

          {activeTab === 'CUSTOMERS' && (
            <CustomerListView
              onOpenNewCustomer={() =>
                setCustomerModalState({ isOpen: true, customerToEdit: null })
              }
              onEditCustomer={(customer) =>
                setCustomerModalState({ isOpen: true, customerToEdit: customer })
              }
              onViewCustomer={(customer) =>
                setCustomerDetailState({ isOpen: true, customer })
              }
              onOpenNewOrderForCustomer={(customer) =>
                handleOpenNewOrder(customer.id)
              }
            />
          )}

          {activeTab === 'DEVICES' && (
            <DeviceListView
              onOpenNewDevice={() =>
                setDeviceModalState({ isOpen: true, deviceToEdit: null })
              }
              onEditDevice={(device) =>
                setDeviceModalState({ isOpen: true, deviceToEdit: device })
              }
              onOpenNewOrderForDevice={(device) =>
                handleOpenNewOrder(device.customerId, device.id)
              }
            />
          )}

          {activeTab === 'ORDERS' && (
            <OrderListView
              onOpenNewOrder={() => handleOpenNewOrder()}
              onEditOrder={(order) =>
                setOrderModalState({ isOpen: true, orderToEdit: order })
              }
              onViewOrderDetail={(order) =>
                setOrderDetailState({ isOpen: true, order })
              }
              onOpenPrint={(order) =>
                setOrderPrintState({ isOpen: true, order })
              }
            />
          )}

          {activeTab === 'RECEIVABLES' && (
            <ReceivablesView
              onOpenOrder={(orderId) => {
                const order = StorageService.getOrderById(orderId);
                if (order) {
                  setOrderDetailState({ isOpen: true, order });
                }
              }}
            />
          )}

          {activeTab === 'POS' && (
            <PosView
              onOpenNewCustomer={() =>
                setCustomerModalState({ isOpen: true, customerToEdit: null })
              }
              onOpenCash={() => setActiveTab('CASH')}
              onClose={() => setActiveTab('DASHBOARD')}
            />
          )}

          {activeTab === 'PRODUCTS' && (
            <ProductListView
              onOpenNewProduct={() => handleOpenNewProduct()}
              onEditProduct={(product) =>
                setProductModalState({ isOpen: true, productToEdit: product })
              }
            />
          )}

          {activeTab === 'PURCHASES' && (
            <PurchasesView
              onOpenNewProduct={() => handleOpenNewProduct()}
            />
          )}

          {activeTab === 'RESELLERS' && <ResellerListView />}

          {activeTab === 'CASH' && <FinanceView initialTab="CASH" key="cash-view" />}

          {activeTab === 'FINANCE' && <FinanceView initialTab="EXPENSES" key="finance-view" />}

          {activeTab === 'REPORTS' && <ReportsView onOpenPlans={() => setIsSubscriptionModalOpen(true)} />}

          {activeTab === 'EMPLOYEES' && <EmployeesView />}

          {activeTab === 'SETTINGS' && <SettingsView />}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {activeTab !== 'POS' && (
          <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t flex items-center justify-around px-2 transition-colors ${
            isDark ? 'bg-[#070b14]/95 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]'
          }`}>
            {[
              { id: 'DASHBOARD', label: 'Início', icon: LayoutDashboard },
              { id: 'ORDERS', label: 'OS', icon: Wrench },
              { id: 'POS', label: 'PDV', icon: ShoppingCart },
              { id: 'CUSTOMERS', label: 'Clientes', icon: Users },
              { id: 'PRODUCTS', label: 'Estoque', icon: Package },
            ]
              .filter((item) => SubscriptionService.isTabAllowed(item.id as NavigationTab))
              .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'POS') {
                      setActiveTab('POS');
                    } else {
                      setActiveTab(item.id as NavigationTab);
                    }
                  }}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-cyan-400 font-bold'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : ''}`} />
                  <span className="text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Global Modals */}

      {/* Customer Modal */}
      <CustomerModal
        isOpen={customerModalState.isOpen}
        onClose={() => setCustomerModalState({ isOpen: false })}
        onSave={handleSaveCustomer}
        customerToEdit={customerModalState.customerToEdit}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={customerDetailState.isOpen}
        onClose={() => setCustomerDetailState({ isOpen: false, customer: null })}
        customer={customerDetailState.customer}
        onEdit={(customer) =>
          setCustomerModalState({ isOpen: true, customerToEdit: customer })
        }
        onOpenNewOrder={(customer) =>
          handleOpenNewOrder(customer.id)
        }
      />

      {/* Device Modal */}
      <DeviceModal
        isOpen={deviceModalState.isOpen}
        onClose={() => setDeviceModalState({ isOpen: false, deviceToEdit: null })}
        onSave={handleSaveDevice}
        deviceToEdit={deviceModalState.deviceToEdit}
        initialCustomerId={deviceModalState.initialCustomerId}
        onOpenNewCustomer={() =>
          setCustomerModalState({ isOpen: true, customerToEdit: null })
        }
      />

      {/* Order Modal */}
      <OrderModal
        isOpen={orderModalState.isOpen}
        onClose={() => setOrderModalState({ isOpen: false })}
        onSave={handleSaveOrder}
        orderToEdit={orderModalState.orderToEdit}
        initialCustomerId={orderModalState.initialCustomerId}
        initialDeviceId={orderModalState.initialDeviceId}
        onOpenNewCustomer={() =>
          setCustomerModalState({ isOpen: true, customerToEdit: null })
        }
        onOpenNewDevice={(customerId) =>
          setDeviceModalState({
            isOpen: true,
            deviceToEdit: null,
            initialCustomerId: customerId,
          })
        }
        onOpenPrint={(order) => setOrderPrintState({ isOpen: true, order })}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={orderDetailState.isOpen}
        onClose={() => setOrderDetailState({ isOpen: false, order: null })}
        order={orderDetailState.order}
        onEdit={(order) => setOrderModalState({ isOpen: true, orderToEdit: order })}
        onOpenPrint={(order) => setOrderPrintState({ isOpen: true, order })}
        onDelete={(order) => setGlobalOrderToDelete(order)}
      />

      {/* Order Print Modal */}
      <OrderPrintModal
        isOpen={orderPrintState.isOpen}
        onClose={() => setOrderPrintState({ isOpen: false, order: null })}
        order={orderPrintState.order}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={productModalState.isOpen}
        onClose={() => setProductModalState({ isOpen: false })}
        onSave={handleSaveProduct}
        productToEdit={productModalState.productToEdit}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCustomer={(c) => {
          setActiveTab('CUSTOMERS');
          setCustomerDetailState({ isOpen: true, customer: c });
        }}
        onSelectOrder={(o) => {
          setActiveTab('ORDERS');
          setOrderDetailState({ isOpen: true, order: o });
        }}
        onSelectProduct={() => {
          setActiveTab('PRODUCTS');
        }}
        onSelectDevice={() => {
          setActiveTab('DEVICES');
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onSelectOrder={(order) => {
          setActiveTab('ORDERS');
          setOrderDetailState({ isOpen: true, order });
        }}
        onSelectProduct={() => {
          setActiveTab('PRODUCTS');
        }}
      />

      {/* Login / Switch User Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthSession(StorageService.getAuthSession());
          setIsLoginOpen(false);
          setTick((prev) => prev + 1);
        }}
        onClose={() => setIsLoginOpen(false)}
        onLogout={handleLogout}
      />

      {/* Blocked Account Modal (Immediate lockout when blocked in Firebase) */}
      <BlockedAccountModal
        isOpen={isAccountBlocked}
        email={blockedAccountInfo.email || authSession?.email}
        name={blockedAccountInfo.name || authSession?.name}
        onLogout={handleLogout}
      />

      {/* Subscription Plans Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen && !isAccountBlocked}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Paywall Blocking Modal */}
      <PaywallModal
        isOpen={paywallModalState.isOpen}
        onClose={() => setPaywallModalState((prev) => ({ ...prev, isOpen: false }))}
        title={paywallModalState.title}
        description={paywallModalState.description}
        feature={paywallModalState.feature}
        onOpenPlans={() => {
          setPaywallModalState((prev) => ({ ...prev, isOpen: false }));
          setIsSubscriptionModalOpen(true);
        }}
      />

      {/* Global Order Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!globalOrderToDelete}
        title="Excluir Ordem de Serviço"
        message={`Deseja realmente excluir a OS #${globalOrderToDelete?.orderNumber} do cliente "${globalOrderToDelete?.customerName}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir OS"
        cancelText="Cancelar"
        onConfirm={handleGlobalDeleteConfirm}
        onClose={() => setGlobalOrderToDelete(null)}
      />
    </div>
  );
}
