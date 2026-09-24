import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
  Tv,
  Video,
  Truck,
  ShoppingCart,
  Wrench,
  CreditCard,
  Clock,
  Package,
  Boxes,
  Users,
  Smartphone,
  TrendingUp,
  Wallet,
  BarChart3,
  Layers,
  Settings,
  Headphones,
  ShieldCheck,
  Rocket,
  Crown,
  Sparkles,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Employee, NavigationTab } from '../../types';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onLogoClick?: () => void;
  isMasterAdmin?: boolean;
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

interface MenuItemDef {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor?: string;
  badge?: string | number;
  badgeType?: 'master-purple' | 'master-blue' | 'master-green' | 'master-orange' | 'count-blue' | 'count-amber' | 'count-red' | 'genial' | 'pill-green' | 'pill-gray';
  action?: () => void;
}

interface MenuSectionDef {
  id: string;
  title: string;
  icon: any;
  colorTheme: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'magenta' | 'slate';
  items: MenuItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogoClick,
  isMasterAdmin = false,
  currentUser: propUser,
  openOrdersCount: propOrdersCount,
  lowStockCount: propLowStockCount,
  isCashOpen: propCashOpen,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile,
  onOpenPlans,
}) => {
  const { isDark } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Persisted Collapsed & Hover State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_is_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

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

  // Real-time Storage Data
  const [company, setCompany] = useState(() => StorageService.getCompanySettings());
  const cashSession = StorageService.getCashSession();
  const orders = StorageService.getOrders();
  const products = StorageService.getProducts();
  const receivables = StorageService.getReceivables();
  const authSession = StorageService.getAuthSession();
  const currentUser = propUser || StorageService.getCurrentUser();
  const currentPlan = StorageService.getSubscriptionPlan();

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCompany(StorageService.getCompanySettings());
    });
    return unsub;
  }, []);

  // Keyboard shortcut: Ctrl + / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (isCollapsed) {
          setIsCollapsed(false);
        }
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const isSuper = Boolean(
    isMasterAdmin ||
      SubscriptionService.isSuperAdminUser(currentUser?.email || authSession?.email) ||
      (authSession?.email && ['mmspmartins62@gmail.com', 'msp404011@gmail.com'].includes(authSession.email.toLowerCase().trim())) ||
      (currentUser?.email && ['mmspmartins62@gmail.com', 'msp404011@gmail.com'].includes(currentUser.email.toLowerCase().trim())) ||
      currentPlan?.planType === 'SUPER_ADMIN'
  );

  const isCashOpen = propCashOpen !== undefined ? propCashOpen : cashSession?.status === 'ABERTO';
  const openOrdersCount =
    propOrdersCount !== undefined
      ? propOrdersCount
      : orders.filter((o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADA').length;
  const lowStockCount =
    propLowStockCount !== undefined
      ? propLowStockCount
      : products.filter(
          (p) =>
            p.manageStock !== false &&
            p.stockStatus !== 'UNLIMITED' &&
            p.stockQuantity <= (p.minStockQuantity || p.minStock || 0)
        ).length;
  const openReceivablesCount = receivables.filter(
    (r) => (Number(r.remainingAmount ?? r.amount) || 0) > 0
  ).length;

  const mobileOpen = isMobileOpen || isOpenMobile || false;

  const handleSelect = (id: string) => {
    onSelectTab(id as any);
    if (onCloseMobile) onCloseMobile();
  };

  // Build Sections with Exact Styling from Image
  const sections: MenuSectionDef[] = [
    ...(isSuper
      ? [
          {
            id: 'CAMERAS_ACCESS',
            title: 'CÂMERAS E ACESSOS',
            icon: Video,
            colorTheme: 'purple' as const,
            items: [
              {
                id: 'ACCESSES',
                title: 'Controle de Acessos',
                subtitle: 'Liberações e permissões',
                icon: Tv,
                badge: 'MASTER',
                badgeType: 'master-purple' as const,
              },
              {
                id: 'CAMERAS',
                title: 'Pacote de Câmeras',
                subtitle: 'Planos e dispositivos',
                icon: Video,
                badge: 'MASTER',
                badgeType: 'master-blue' as const,
              },
            ],
          },
          {
            id: 'SUPPLIER_ORDERS_SECTION',
            title: 'PEDIDOS E COMPRAS',
            icon: Truck,
            colorTheme: 'emerald' as const,
            items: [
              {
                id: 'SUPPLIER_ORDERS',
                title: 'Pedidos Fornecedor',
                subtitle: 'Compras e reposição',
                icon: Truck,
                badge: 'MASTER',
                badgeType: 'master-green' as const,
              },
              {
                id: 'EXCLUSIVE_ORDERS',
                title: 'Pedidos Exclusivos',
                subtitle: 'Produtos exclusivos',
                icon: ShoppingCart,
                badge: 'MASTER',
                badgeType: 'master-orange' as const,
              },
            ],
          },
        ]
      : []),
    {
      id: 'TECH_SUPPORT',
      title: 'ASSISTÊNCIA TÉCNICA',
      icon: Wrench,
      colorTheme: 'rose' as const,
      items: [
        {
          id: 'ORDERS',
          title: 'Ordens de Serviço',
          subtitle: 'Abertas, em andamento e finalizadas',
          icon: Wrench,
          badge: openOrdersCount > 0 ? openOrdersCount : 13,
          badgeType: 'count-blue' as const,
        },
      ],
    },
    {
      id: 'SALES_PAYMENTS',
      title: 'VENDAS E PAGAMENTOS',
      icon: CreditCard,
      colorTheme: 'amber' as const,
      items: [
        {
          id: 'POS',
          title: 'Vendas / PDV',
          subtitle: 'Vendas e emissões',
          icon: ShoppingCart,
        },
        {
          id: 'RECEIVABLES',
          title: 'Fiado / Crediário',
          subtitle: 'Controle de vendas a prazo',
          icon: Users,
          badge: openReceivablesCount > 0 ? openReceivablesCount : 2,
          badgeType: 'count-amber' as const,
        },
        {
          id: 'RECEIVABLES_TERMS',
          title: 'A Prazo',
          subtitle: 'Parcelas e contas em aberto',
          icon: Clock,
          badge: openReceivablesCount > 0 ? openReceivablesCount : 2,
          badgeType: 'count-red' as const,
          action: () => handleSelect('RECEIVABLES'),
        },
      ],
    },
    {
      id: 'STOCK_PRODUCTS',
      title: 'ESTOQUE E PRODUTOS',
      icon: Boxes,
      colorTheme: 'cyan' as const,
      items: [
        {
          id: 'PRODUCTS',
          title: 'Produtos / Estoque',
          subtitle: 'Cadastro e controle',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : 1,
          badgeType: 'count-red' as const,
        },
        {
          id: 'PURCHASES',
          title: 'Entrada de Estoque',
          subtitle: 'Recebimento de produtos',
          icon: Truck,
        },
      ],
    },
    {
      id: 'RELATIONSHIP',
      title: 'RELACIONAMENTO',
      icon: Users,
      colorTheme: 'purple' as const,
      items: [
        {
          id: 'CUSTOMERS',
          title: 'Clientes',
          subtitle: 'Cadastro e histórico',
          icon: Users,
        },
        {
          id: 'DEVICES',
          title: 'CRM',
          subtitle: 'Leads e oportunidades',
          icon: Smartphone,
        },
      ],
    },
    {
      id: 'FINANCIAL',
      title: 'FINANCEIRO',
      icon: TrendingUp,
      colorTheme: 'emerald' as const,
      items: [
        {
          id: 'FINANCE',
          title: 'Financeiro',
          subtitle: 'Contas, receitas e despesas',
          icon: CreditCard,
        },
        {
          id: 'CASH',
          title: 'Caixa',
          subtitle: 'Movimentação do caixa',
          icon: Wallet,
          badge: isCashOpen ? 'Aberto' : 'Fechado',
          badgeType: isCashOpen ? 'pill-green' : 'pill-gray',
        },
        {
          id: 'FINANCIAL_REPORTS',
          title: 'Relatórios Financeiros',
          subtitle: 'Fluxo de caixa e resultados',
          icon: BarChart3,
          action: () => handleSelect('FINANCE'),
        },
      ],
    },
    {
      id: 'REPORTS_ANALYSIS',
      title: 'RELATÓRIOS E ANÁLISES',
      icon: BarChart3,
      colorTheme: 'amber' as const,
      items: [
        {
          id: 'REPORTS',
          title: 'Relatórios',
          subtitle: 'Vendas, serviços e financeiro',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'SUPPLIERS',
      title: 'FORNECEDORES',
      icon: Truck,
      colorTheme: 'rose' as const,
      items: [
        {
          id: 'RESELLERS',
          title: 'Revenda',
          subtitle: 'Gestão de revendedores',
          icon: Users,
        },
      ],
    },
    {
      id: 'TEAM_PERMISSIONS',
      title: 'EQUIPE E PERMISSÕES',
      icon: Users,
      colorTheme: 'cyan' as const,
      items: [
        {
          id: 'EMPLOYEES',
          title: 'Funcionários',
          subtitle: 'Usuários e permissões',
          icon: Users,
        },
      ],
    },
    {
      id: 'SYSTEM_INTEGRATIONS',
      title: 'SISTEMA E INTEGRAÇÕES',
      icon: Layers,
      colorTheme: 'magenta' as const,
      items: [
        {
          id: 'COMPATIBILITY',
          title: 'Compatibilidades',
          subtitle: 'Aparelhos e peças',
          icon: Layers,
          badge: 'GENIAL',
          badgeType: 'genial' as const,
        },
        {
          id: 'SETTINGS',
          title: 'Configurações',
          subtitle: 'Ajustes do sistema',
          icon: Settings,
        },
        {
          id: 'MONTHLY_DEBITS',
          title: 'Débitos Mensais',
          subtitle: 'Controle de contas e parcelas',
          icon: CreditCard,
        },
      ],
    },
    {
      id: 'SUPPORT_SECTION',
      title: 'SUPORTE',
      icon: Headphones,
      colorTheme: 'slate' as const,
      items: [
        {
          id: 'HELP_SUPPORT',
          title: 'Precisa de Ajuda?',
          subtitle: 'Suporte e tutoriais do sistema',
          icon: Headphones,
          action: () => window.open('https://web.whatsapp.com', '_blank'),
        },
      ],
    },
  ];

  // Filter sections by permissions and search term
  const filteredSections = sections
    .map((section) => {
      const allowedItems = section.items.filter((item) => {
        if (item.id === 'MONTHLY_DEBITS' && !isSuper) return false;
        if (isSuper) return true;
        const normalizedTab = item.id.replace('_SECTION', '').replace('_TERMS', '').replace('_REPORTS', '');
        if (['HELP_SUPPORT'].includes(item.id)) return true;
        return SubscriptionService.isTabAllowed(normalizedTab as NavigationTab);
      });

      if (!searchTerm.trim()) return { ...section, items: allowedItems };

      const term = searchTerm.toLowerCase();
      const matchedItems = allowedItems.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.subtitle.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term)
      );

      return { ...section, items: matchedItems };
    })
    .filter((section) => section.items.length > 0);

  // Helper for Theme Glow Colors
  const getSectionBorderAndGlow = (theme: MenuSectionDef['colorTheme']) => {
    switch (theme) {
      case 'purple':
        return 'border-purple-500/80 shadow-[0_0_18px_rgba(168,85,247,0.35)] bg-gradient-to-b from-[#150724] to-[#080210] text-purple-400';
      case 'emerald':
        return 'border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.35)] bg-gradient-to-b from-[#051a14] to-[#020b08] text-emerald-400';
      case 'rose':
        return 'border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.35)] bg-gradient-to-b from-[#1a0710] to-[#0a0206] text-rose-400';
      case 'amber':
        return 'border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.35)] bg-gradient-to-b from-[#1a1204] to-[#0a0701] text-amber-400';
      case 'cyan':
        return 'border-cyan-500/80 shadow-[0_0_18px_rgba(6,182,212,0.35)] bg-gradient-to-b from-[#061722] to-[#020b12] text-cyan-400';
      case 'magenta':
        return 'border-pink-500/80 shadow-[0_0_18px_rgba(236,72,153,0.35)] bg-gradient-to-b from-[#1c0817] to-[#0a020d] text-pink-400';
      case 'slate':
      default:
        return 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.25)] bg-gradient-to-b from-[#09152a] to-[#040a16] text-blue-300';
    }
  };

  const renderBadge = (badge: string | number | undefined, type?: MenuItemDef['badgeType']) => {
    if (!badge && badge !== 0) return null;

    switch (type) {
      case 'master-purple':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.7)] uppercase">
            {badge}
          </span>
        );
      case 'master-blue':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.7)] uppercase">
            {badge}
          </span>
        );
      case 'master-green':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.7)] uppercase">
            {badge}
          </span>
        );
      case 'master-orange':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.7)] uppercase">
            {badge}
          </span>
        );
      case 'count-blue':
        return (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.8)]">
            {badge}
          </span>
        );
      case 'count-amber':
        return (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.8)]">
            {badge}
          </span>
        );
      case 'count-red':
        return (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.8)]">
            {badge}
          </span>
        );
      case 'genial':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.6)] uppercase">
            {badge}
          </span>
        );
      case 'pill-green':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {badge}
          </span>
        );
      case 'pill-gray':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            {badge}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-xs">
            {badge}
          </span>
        );
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop Layout Spacer: reserves w-[76px] when collapsed or w-[300px] when expanded */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-[300px]'
        }`}
      />

      {/* Main Sidebar Aside */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={`fixed top-0 left-0 z-40 h-screen border-r-2 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isDark
            ? 'bg-[#030712] border-blue-950 text-slate-100 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
            : 'bg-[#f8fafc] border-slate-300 text-slate-800 shadow-xl'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
          isExpanded
            ? 'w-[300px] shadow-[0_10px_40px_rgba(0,0,0,0.7)]'
            : 'w-[76px]'
        }`}
      >
        {/* TOP HEADER: MENU PRINCIPAL & COLLAPSE BUTTON */}
        <div
          className={`p-3 border-b-2 shrink-0 select-none flex items-center justify-between min-h-[64px] transition-colors ${
            isDark ? 'border-blue-950/80 bg-[#040916]' : 'border-slate-200 bg-white'
          }`}
        >
          {isExpanded ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <div
                onClick={() => {
                  if (isMasterAdmin && onLogoClick) {
                    onLogoClick();
                  } else {
                    handleSelect('DASHBOARD');
                  }
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] shrink-0 group-hover:scale-105 transition-transform">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-black tracking-wider uppercase text-white truncate leading-none">
                    MENU PRINCIPAL
                  </h2>
                </div>
              </div>

              {/* Pin / Collapse Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-7 h-7 rounded-xl border border-blue-900/60 bg-[#08152e] hover:bg-[#0c1f44] text-cyan-400 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                title={isCollapsed ? 'Fixar menu aberto na tela' : 'Recolher menu lateral'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full gap-1">
              <button
                type="button"
                onClick={() => handleSelect('DASHBOARD')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.6)] cursor-pointer hover:scale-105 transition-transform"
                title="Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1 rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 hover:bg-slate-700 cursor-pointer transition-all"
                title="Expandir menu"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* SEARCH BAR (WHEN EXPANDED) */}
        {isExpanded && (
          <div className="px-3 pt-2.5 pb-1 shrink-0 bg-[#030712]">
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar no menu..."
                className="w-full pl-8 pr-14 py-1.5 bg-[#071022] border border-blue-900/60 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all shadow-inner font-medium"
              />
              <span className="absolute right-2 px-1.5 py-0.5 rounded-md bg-[#0b1b3a] border border-blue-800/60 text-[9px] font-bold text-slate-400 pointer-events-none">
                Ctrl + /
              </span>
            </div>
          </div>
        )}

        {/* SINGLE SCROLLABLE COLUMN WITH ALL SECTORS */}
        <nav className="flex-1 min-h-0 py-2 px-2.5 overflow-y-auto space-y-2.5 scrollbar-thin">
          {/* 1. DASHBOARD HERO CARD */}
          {isExpanded ? (
            <button
              type="button"
              onClick={() => handleSelect('DASHBOARD')}
              className={`w-full p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left group ${
                activeTab === 'DASHBOARD'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.5)]'
                  : 'border-blue-600/70 bg-gradient-to-b from-[#08152e] to-[#040b1a] hover:border-cyan-400 shadow-[0_0_18px_rgba(37,99,235,0.3)] text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.7)] shrink-0 group-hover:scale-105 transition-transform">
                  <Home className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black tracking-wide text-white leading-tight">
                    Dashboard
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium leading-tight">
                    Visão geral do sistema
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleSelect('DASHBOARD')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.7)] scale-105'
                    : 'bg-[#08152e] border border-blue-500/50 text-cyan-400 hover:scale-105'
                }`}
                title="Dashboard - Visão geral do sistema"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 2. DYNAMIC SECTOR CARDS */}
          {filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const borderAndGlowClasses = getSectionBorderAndGlow(section.colorTheme);

            if (isExpanded) {
              return (
                <div
                  key={section.id}
                  className={`p-2.5 rounded-2xl border-2 ${borderAndGlowClasses} space-y-1.5 transition-all`}
                >
                  {/* Section Title Header */}
                  <div className="flex items-center gap-1.5 px-0.5 pb-1 border-b border-white/10">
                    <SectionIcon className="w-3.5 h-3.5 shrink-0" />
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-white">
                      {section.title}
                    </h4>
                  </div>

                  {/* Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'RECEIVABLES_TERMS' && activeTab === 'RECEIVABLES') ||
                        (item.id === 'FINANCIAL_REPORTS' && activeTab === 'FINANCE');

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => (item.action ? item.action() : handleSelect(item.id))}
                          className={`w-full p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left group ${
                            isActive
                              ? 'border-cyan-400 bg-blue-600/30 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white shrink-0">
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate leading-tight">
                                {item.title}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate leading-tight">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {renderBadge(item.badge, item.badgeType)}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Collapsed view icons
            return (
              <div key={section.id} className="space-y-1.5 pt-1 border-t border-slate-800 flex flex-col items-center">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative group/btn flex justify-center">
                      <button
                        type="button"
                        onClick={() => (item.action ? item.action() : handleSelect(item.id))}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.7)] scale-105'
                            : 'bg-[#0a1224] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                        title={item.title}
                      >
                        <ItemIcon className="w-4 h-4" />
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[8px] font-black flex items-center justify-center">
                            {typeof item.badge === 'number' ? item.badge : '●'}
                          </span>
                        )}
                      </button>

                      {/* Tooltip */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap z-50 shadow-2xl opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all bg-slate-900 border border-slate-700 text-white flex items-center gap-1.5">
                        <span>{item.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 3. SISTEMA COMPLETO FOOTER BANNER CARD */}
          {isExpanded ? (
            <div className="p-3 rounded-2xl border-2 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-gradient-to-b from-[#1c1203] via-[#0d0701] to-[#040200] text-center space-y-2 mt-3">
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Crown className="w-5 h-5 fill-amber-400/40" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-amber-400 tracking-wide">
                  Sistema Completo
                </h3>
                <p className="text-[10px] text-slate-300 font-medium">
                  Tudo que você precisa, em um só lugar!
                </p>
              </div>

              {/* 3 Pills: Estabilidade, Segurança, Resultados */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className="p-1 rounded-lg bg-black/60 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 flex items-center justify-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Estabilidade</span>
                </div>
                <div className="p-1 rounded-lg bg-black/60 border border-blue-500/40 text-[9px] font-bold text-blue-300 flex items-center justify-center gap-0.5">
                  <Rocket className="w-2.5 h-2.5" />
                  <span>Segurança</span>
                </div>
                <div className="p-1 rounded-lg bg-black/60 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center justify-center gap-0.5">
                  <BarChart3 className="w-2.5 h-2.5" />
                  <span>Resultados</span>
                </div>
              </div>

              {/* Sub-divider caption */}
              <div className="pt-1 border-t border-amber-500/20">
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                  SEMPRE EVOLUINDO COM VOCÊ
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-2">
              <div
                className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                title="Sistema Completo"
              >
                <Crown className="w-4 h-4" />
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};
