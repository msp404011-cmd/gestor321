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
  Crown,
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
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount,
  currentUser: propCurrentUser,
  onSwitchUser,
  onLogout,
  onOpenPlans,
}) => {
  const currentUser = propCurrentUser || StorageService.getCurrentUser();
  const currentPlan = StorageService.getSubscriptionPlan();
  const { isDark, toggleTheme } = useTheme();

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

  const handleWhatsApp = () => {
    window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <header
      className={`h-16 border-b-2 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#070b14]/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Left side: Mobile Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={handleMobileMenu}
          className={`p-2 rounded-lg lg:hidden transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Menu Principal"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <button
            type="button"
            onClick={onOpenSearch}
            className={`w-full text-left relative pl-10 pr-16 py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer border-2 group ${
              isDark
                ? 'bg-[#0c1427] hover:bg-[#101b33] border-slate-700/80 hover:border-cyan-500/80 text-slate-200 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-100 hover:bg-slate-200/70 border-slate-300 text-slate-700 hover:border-blue-500'
            }`}
          >
            <span className={`truncate ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600'}`}>
              Pesquisar clientes, OS, produtos, IMEI...
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'text-slate-400 bg-slate-800/80 border-slate-700' : 'text-slate-600 bg-white border-slate-300'
              }`}
            >
              Ctrl + K
            </span>
          </button>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Right side: Notifications, WhatsApp, Theme Toggle & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Icon with Glowing Red Counter Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className={`relative p-2 rounded-full transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Alertas e Notificações"
        >
          <Bell className="w-5 h-5" />
          {calculatedUnread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#070b14] shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse">
              {calculatedUnread > 9 ? '9+' : calculatedUnread}
            </span>
          )}
        </button>

        {/* WhatsApp Icon with Emerald Aura */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-colors cursor-pointer drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          title="Abrir WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all cursor-pointer border ${
            isDark
              ? 'text-amber-400 hover:bg-slate-800/80 border-slate-700 bg-slate-900/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-blue-600 hover:bg-slate-200 border-slate-300 bg-white shadow-xs'
          }`}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
        </button>

        {/* Plan & Subscription Badge Button */}
        {onOpenPlans && (
          <button
            type="button"
            id="btn-navbar-plan"
            onClick={onOpenPlans}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              currentPlan.planType === 'TRIAL' || currentPlan.planType === 'FREE'
                ? isDark
                  ? 'bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border-blue-700/60'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : currentPlan.planType === 'REVENDA' || currentPlan.planType === 'ENTERPRISE'
                ? isDark
                  ? 'bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                : isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
            }`}
            title="Meu Plano / Assinatura (Gerenciar)"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[120px]">{currentPlan.planName || 'Meu Plano'}</span>
          </button>
        )}

        <div className={`h-6 w-[1px] hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="relative">
            <img
              src={
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || 'Operador'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#070b14] rounded-full" />
          </div>
          <div className="hidden md:block text-left">
            <p className={`text-xs font-bold leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentUser?.name || 'Operador'}
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
              {currentUser?.role || 'Acesso Básico'}
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
