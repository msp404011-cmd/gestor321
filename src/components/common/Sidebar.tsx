import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  Users,
  Smartphone,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  UserCheck,
  Settings,
  Crown,
  Wallet,
  Building2,
  Headphones,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Employee } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  currentUser?: Employee;
  employees?: Employee[];
  onSwitchUser?: (emp: Employee) => void;
  openOrdersCount?: number;
  lowStockCount?: number;
  isCashOpen?: boolean;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenPlans?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser: propUser,
  employees: propEmployees,
  openOrdersCount: propOrdersCount,
  lowStockCount: propLowStockCount,
  isCashOpen: propCashOpen,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile,
  onOpenPlans,
}) => {
  const { isDark } = useTheme();
  const [company, setCompany] = React.useState(() => StorageService.getCompanySettings());

  // Collapsed & Hover State (Persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_is_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_is_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isExpanded = !isCollapsed || isHovered;

  React.useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCompany(StorageService.getCompanySettings());
    });
    return unsub;
  }, []);

  const cashSession = StorageService.getCashSession();
  const orders = StorageService.getOrders();
  const products = StorageService.getProducts();
  const receivables = StorageService.getReceivables();

  const isCashOpen = propCashOpen !== undefined ? propCashOpen : cashSession?.status === 'ABERTO';
  const openOrdersCount =
    propOrdersCount !== undefined
      ? propOrdersCount
      : orders.filter((o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADA').length;
  const lowStockCount =
    propLowStockCount !== undefined
      ? propLowStockCount
      : products.filter((p) => p.stockQuantity <= (p.minStockQuantity || p.minStock || 0)).length;
  const openReceivablesCount = receivables.filter(
    (r) => (Number(r.remainingAmount ?? r.amount) || 0) > 0
  ).length;

  const mobileOpen = isMobileOpen || isOpenMobile || false;

  const menuItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ORDERS',
      label: 'Ordens de Serviço',
      icon: Wrench,
      badge: openOrdersCount > 0 ? `${openOrdersCount}` : undefined,
      badgeColor: 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.7)]',
    },
    {
      id: 'RECEIVABLES',
      label: 'A Prazo / Fiado',
      icon: Clock,
      badge: openReceivablesCount > 0 ? `${openReceivablesCount}` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.7)]',
    },
    {
      id: 'CUSTOMERS',
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'DEVICES',
      label: 'Aparelhos',
      icon: Smartphone,
    },
    {
      id: 'POS',
      label: 'Vendas / PDV',
      icon: ShoppingCart,
    },
    {
      id: 'PRODUCTS',
      label: 'Produtos / Estoque',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: 'bg-rose-600 text-white shadow-[0_0_8px_rgba(225,29,72,0.7)]',
    },
    {
      id: 'PURCHASES',
      label: 'Entrada de Estoque',
      icon: Truck,
    },
    {
      id: 'RESELLERS',
      label: 'Revenda',
      icon: UserCheck,
    },
    {
      id: 'FINANCE',
      label: 'Financeiro',
      icon: DollarSign,
    },
    {
      id: 'CASH',
      label: 'Caixa',
      icon: Wallet,
      pill: isCashOpen ? 'Aberto' : 'Fechado',
      pillColor: isCashOpen
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
        : 'bg-slate-800 text-slate-400 border border-slate-700',
    },
    {
      id: 'REPORTS',
      label: 'Relatórios',
      icon: BarChart3,
    },
    {
      id: 'EMPLOYEES',
      label: 'Funcionários',
      icon: UserCheck,
    },
    {
      id: 'SETTINGS',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  const handleSelect = (id: string) => {
    onSelectTab(id as any);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop Layout Spacer: reserves w-[76px] when collapsed or w-64 when expanded */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      />

      {/* Aside Container with Hover-to-expand, Pin toggle, and larger icons */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={`fixed top-0 left-0 z-40 h-screen border-r-2 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isDark
            ? 'bg-[#070b16] border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-md'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
          isExpanded
            ? 'w-64 shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
            : 'w-[76px]'
        }`}
      >
        {/* Brand Header with dynamic Logo or compact icon + Pin Toggle Button */}
        <div
          className={`p-3 border-b-2 shrink-0 select-none flex items-center justify-between min-h-[76px] transition-colors ${
            isDark ? 'border-slate-800 bg-[#060913]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {isExpanded ? (
            /* FULL EXPANDED HEADER */
            <div className="flex items-center justify-between w-full min-w-0">
              <div
                onClick={() => handleSelect('SETTINGS')}
                className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 group"
                title="Clique para gerenciar dados da loja"
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="max-h-10 max-w-[140px] object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="min-w-0">
                    <span className="text-base font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] block truncate">
                      {company.commercialName || company.name || 'ASSISTÊNCIA'}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase truncate block">
                      {company.slogan || 'Painel de Gestão'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pin / Collapse Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ml-1 ${
                  isCollapsed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                }`}
                title={isCollapsed ? 'Fixar menu aberto na tela' : 'Recolher menu lateral (Mais espaço)'}
              >
                {isCollapsed ? (
                  <Pin className="w-4 h-4 text-amber-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            /* COMPACT COLLAPSED HEADER (Centered Icon & Pin/Open button) */
            <div className="flex flex-col items-center justify-center w-full gap-1.5">
              <div
                onClick={() => handleSelect('SETTINGS')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] cursor-pointer hover:scale-105 transition-transform"
                title="Abrir Configurações"
              >
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                className={`p-1 rounded-lg border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                }`}
                title="Fixar menu aberto permanentemente"
              >
                <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {/* Hover/Auto Hint Banner when Hover-Expanded in Collapsed mode */}
        {isCollapsed && isHovered && (
          <div className="px-3 py-1.5 bg-blue-950/80 border-b border-blue-500/40 flex items-center justify-between text-[10px] text-blue-200 font-semibold animate-in fade-in">
            <span>Modo Automático (Passe o mouse)</span>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="text-cyan-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Pin className="w-3 h-3" /> Fixar
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 py-3 px-2 sm:px-2.5 overflow-y-auto space-y-1.5 scrollbar-thin">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isDashboard = item.id === 'DASHBOARD';
            const isActive = isDashboard
              ? activeTab === 'DASHBOARD'
              : activeTab === item.id;

            if (isExpanded) {
              /* FULL ROW ITEM */
              return (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold select-none cursor-pointer group ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] font-bold'
                        : 'bg-[#0066ff] text-white shadow-md font-bold'
                      : isDark
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : isDark
                          ? 'text-slate-400 group-hover:text-cyan-400'
                          : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badge or Pill */}
                  {item.badge && (
                    <span
                      className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.pill && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 ${item.pillColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {item.pill}
                    </span>
                  )}
                </button>
              );
            }

            /* COMPACT COLLAPSED ITEM: LARGER ICON (w-6 h-6) + Center Alignment + Tooltip */
            return (
              <div key={`${item.id}-${index}`} className="relative group/btn flex justify-center">
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.7)] scale-105'
                        : 'bg-blue-600 text-white shadow-md scale-105'
                      : isDark
                      ? 'text-slate-400 hover:bg-slate-800/80 hover:text-cyan-300 hover:scale-105'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 hover:scale-105'
                  }`}
                  aria-label={item.label}
                >
                  {/* LARGER ICON */}
                  <Icon className="w-6 h-6 shrink-0" />

                  {/* Badge Indicator on top right corner of the icon */}
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center text-[9px] font-black rounded-full border border-slate-900 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.pill && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                  )}
                </button>

                {/* Floating Tooltip to the right */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap z-50 shadow-2xl opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all duration-150 bg-slate-900 border border-slate-700 text-white flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Card / Support Button */}
        {isExpanded ? (
          <div className="p-3 shrink-0">
            <div
              className={`p-3 rounded-2xl border-2 relative overflow-hidden group ${
                isDark
                  ? 'bg-gradient-to-b from-[#0e1832] to-[#090f20] border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                  : 'bg-slate-100 border-slate-300 shadow-xs text-slate-800'
              }`}
            >
              {/* Background neon ambient blur */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/20 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                <Crown className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                <span className={`text-[11px] font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {company.commercialName || company.name || 'Assistência Técnica'}
                </span>
              </div>
              <p className={`text-[10px] font-medium leading-tight truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {company.slogan || 'Tecnologia que mantém você sempre conectado!'}
              </p>

              {/* Meu Plano & Assinatura Button */}
              {onOpenPlans && (
                <button
                  type="button"
                  id="btn-sidebar-plan"
                  onClick={onOpenPlans}
                  className={`mt-2 w-full py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isDark
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Meu Plano / Assinatura</span>
                </button>
              )}

              {/* Suporte / Ajuda Button */}
              <button
                type="button"
                onClick={() => window.open('https://web.whatsapp.com', '_blank')}
                className={`mt-1.5 w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:brightness-110'
                    : 'bg-[#0066ff] hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Suporte / Ajuda</span>
              </button>
            </div>
          </div>
        ) : (
          /* COMPACT SUPPORT ICON BUTTON */
          <div className="p-3 shrink-0 flex justify-center group/btn relative">
            <button
              type="button"
              onClick={() => window.open('https://web.whatsapp.com', '_blank')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isDark
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:scale-105'
                  : 'bg-blue-600 text-white shadow-md hover:scale-105'
              }`}
              title="Suporte / Ajuda"
            >
              <Headphones className="w-6 h-6" />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap z-50 shadow-2xl opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all bg-slate-900 border border-slate-700 text-white">
              Suporte WhatsApp
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
