import React from 'react';
import {
  Menu,
  Search,
  Bell,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Store,
  Cloud,
  ShoppingCart,
} from 'lucide-react';
import { Employee, CashSession } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  cashSession?: CashSession | null;
  currentUser?: Employee;
  onQuickAction?: (action: 'new_order' | 'new_sale' | 'new_customer' | 'cash') => void;
  onOpenNewOrder?: () => void;
  onOpenNewCustomer?: () => void;
  onOpenPDV?: () => void;
  onSwitchUser?: () => void;
  onLogout?: () => void;
  onOpenPlans?: () => void;
  onOpenMaster?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount,
  currentUser: propCurrentUser,
  onOpenPDV,
  onSwitchUser,
  onLogout,
}) => {
  const currentUser = propCurrentUser || StorageService.getCurrentUser();
  const { isDark, toggleTheme } = useTheme();

  const [company, setCompany] = React.useState(() => StorageService.getCompanySettings());
  const authSession = StorageService.getAuthSession();
  const userAccounts = StorageService.getUserAccounts();
  const userAccount = authSession?.email
    ? userAccounts.find((a) => a.email.toLowerCase() === authSession.email.toLowerCase())
    : null;

  React.useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCompany(StorageService.getCompanySettings());
    });
    return unsub;
  }, []);

  const assistanceName =
    company?.commercialName && company.commercialName !== 'Painel Master Gestor'
      ? company.commercialName
      : company?.name && company.name !== 'Painel Master Gestor'
      ? company.name
      : userAccount?.shopName && userAccount.shopName !== 'Painel Master Gestor'
      ? userAccount.shopName
      : 'TechNova Informática';

  const loggedInUserName =
    currentUser?.name ||
    authSession?.name ||
    (authSession?.email ? authSession.email.split('@')[0] : 'Usuário Logado');

  const loggedInRole = currentUser?.role || 'Administrador';

  const orders = StorageService.getOrders();
  const products = StorageService.getProducts();
  const calculatedUnread =
    unreadNotificationsCount !== undefined
      ? unreadNotificationsCount
      : orders.filter((o) => o.status === 'PRONTA').length +
        products.filter((p) => p.stockQuantity <= (p.minStockQuantity || p.minStock || 0)).length || 3;

  const handleMobileMenu = () => {
    if (onOpenMobileMenu) onOpenMobileMenu();
    else if (onToggleMobileMenu) onToggleMobileMenu();
  };

  const [isSyncingCloud, setIsSyncingCloud] = React.useState(false);
  const [syncCloudSuccess, setSyncCloudSuccess] = React.useState(false);

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    setSyncCloudSuccess(false);
    try {
      await StorageService.syncTwoWayWithCloud();
      setSyncCloudSuccess(true);
      setTimeout(() => setSyncCloudSuccess(false), 3000);
    } catch (e) {
      console.warn('Sync cloud error:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleWhatsApp = () => {
    window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <header
      className={`h-13 sm:h-16 border-b-2 flex items-center justify-between px-2 sm:px-5 lg:px-8 sticky top-0 z-30 shrink-0 backdrop-blur-md transition-colors safe-top ${
        isDark
          ? 'bg-[#070b14]/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Left side: Mobile Toggle + Logged In User Badge + Search Bar */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 max-w-xl min-w-0 mr-1 sm:mr-3">
        <button
          type="button"
          onClick={handleMobileMenu}
          className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl lg:hidden flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-95 ${
            isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 bg-slate-900/80 border border-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-100 border border-slate-200'
          }`}
          title="Abrir Menu Principal"
          aria-label="Abrir Menu Principal"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        {/* Top Logged-In User Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 shadow-inner ${
          isDark ? 'bg-[#0c1427] border-cyan-500/40 text-cyan-300' : 'bg-slate-100 border-blue-300 text-blue-700'
        }`} title={`Usuário logado: ${loggedInUserName} (${loggedInRole})`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate max-w-[150px]">{loggedInUserName}</span>
          <span className="text-[9px] opacity-80 uppercase">({loggedInRole})</span>
        </div>

        <div className="relative w-full min-w-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className={`w-full text-left relative pl-8 sm:pl-10 pr-2 sm:pr-16 py-1.5 sm:py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer border-2 group truncate ${
              isDark
                ? 'bg-[#0c1427] hover:bg-[#101b33] border-slate-700/80 hover:border-cyan-500/80 text-slate-200 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-100 hover:bg-slate-200/70 border-slate-300 text-slate-700 hover:border-blue-500'
            }`}
          >
            <span className={`truncate text-[11px] sm:text-xs ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600'}`}>
              <span className="sm:hidden">Buscar no sistema...</span>
              <span className="hidden sm:inline">Pesquisar clientes, OS, produtos, IMEI...</span>
            </span>
            <span
              className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border hidden sm:inline ${
                isDark ? 'text-slate-400 bg-slate-800/80 border-slate-700' : 'text-slate-600 bg-white border-slate-300'
              }`}
            >
              Ctrl + K
            </span>
          </button>
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Right side: Notifications, WhatsApp, Theme Toggle & User Profile */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Notifications Icon with Glowing Red Counter Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
            isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Alertas e Notificações"
          aria-label="Alertas e Notificações"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {calculatedUnread > 0 && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full border border-[#070b14] shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse">
              {calculatedUnread > 9 ? '9+' : calculatedUnread}
            </span>
          )}
        </button>

        {/* WhatsApp Icon with Emerald Aura - hidden on small mobile */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          title="Abrir WhatsApp"
          aria-label="Abrir WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border active:scale-95 ${
            isDark
              ? 'text-amber-400 hover:bg-slate-800/80 border-slate-700 bg-slate-900/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-blue-600 hover:bg-slate-200 border-slate-300 bg-white shadow-xs'
          }`}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          aria-label={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
        </button>

        {/* PDV / Caixa Direct Button (visible on sm+) */}
        {onOpenPDV && (
          <button
            type="button"
            id="btn-navbar-pdv"
            onClick={onOpenPDV}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
            title="Abrir PDV - Ponto de Venda"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>PDV / Caixa</span>
          </button>
        )}





        <div className={`h-6 w-[1px] hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

        {/* User Profile / Assistance Header */}
        <div className="flex items-center gap-2 pl-1">
          <div className="relative">
            <img
              src={
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={assistanceName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#070b14] rounded-full" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className={`text-xs font-black leading-none tracking-tight truncate max-w-[190px] ${isDark ? 'text-white' : 'text-slate-900'}`} title={loggedInUserName}>
                {loggedInUserName}
              </p>
            </div>
            <p className={`text-[10px] font-semibold mt-0.5 truncate max-w-[190px] ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
              {loggedInRole} • {assistanceName}
            </p>
          </div>

          {onSwitchUser && (
            <button
              type="button"
              onClick={onSwitchUser}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Trocar Operador Ativo (PIN)"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline text-[11px]">Trocar Operador</span>
            </button>
          )}

          {(onLogout || onSwitchUser) && (
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else if (onSwitchUser) {
                  onSwitchUser();
                }
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border-rose-500/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
              title="Desconectar / Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline text-[11px]">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
