import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Wrench,
  Package,
  DollarSign,
  Layers,
  Clock,
  Calendar,
  Download,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { PaywallModal } from '../subscription/PaywallModal';
import { useTheme } from '../../context/ThemeContext';

// Import distinct tab components
import { ReportsOverviewTab } from './ReportsOverviewTab';
import { ReportsSalesTab } from './ReportsSalesTab';
import { ReportsServicesTab } from './ReportsServicesTab';
import { ReportsProductsTab } from './ReportsProductsTab';
import { ReportsFinanceTab } from './ReportsFinanceTab';
import { ReportsComparativeTab } from './ReportsComparativeTab';
import { ReportsHistoryTab } from './ReportsHistoryTab';

type TabType = 'OVERVIEW' | 'SALES' | 'SERVICES' | 'PRODUCTS' | 'FINANCE' | 'COMPARATIVE' | 'HISTORY';

interface ReportsViewProps {
  onOpenPlans?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPlans }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [dateRange, setDateRange] = useState('01/09/2026 - 30/09/2026');
  const [selectedReportType, setSelectedReportType] = useState('Relatório Completo');
  const [tick, setTick] = useState(0);

  const [paywallModalState, setPaywallModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    feature: 'ADVANCED_REPORTS' | 'EXPORT_PDF';
  }>({
    isOpen: false,
    title: '',
    description: '',
    feature: 'ADVANCED_REPORTS',
  });

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const subLimits = useMemo(() => SubscriptionService.checkSubscriptionLimits(), [tick]);

  // Dynamic storage data calculation
  const sales = useMemo(() => StorageService.getSales() || [], [tick]);
  const orders = useMemo(() => StorageService.getOrders() || [], [tick]);
  const expenses = useMemo(() => StorageService.getExpenses() || [], [tick]);
  const products = useMemo(() => StorageService.getProducts() || [], [tick]);
  const purchases = useMemo(() => StorageService.getPurchases() || [], [tick]);
  const receivables = useMemo(() => StorageService.getReceivables() || [], [tick]);

  const handleExport = (type: string) => {
    if (!subLimits.canExportPdf) {
      setPaywallModalState({
        isOpen: true,
        title: 'Exportação em PDF Bloqueada',
        description:
          'A exportação de relatórios em formato PDF e relatórios executivos é um recurso exclusivo do Plano Pro.',
        feature: 'EXPORT_PDF',
      });
      return;
    }
    alert(`Exportando relatório (${type})... O arquivo em formato ${type} foi gerado com sucesso!`);
  };

  const isOrdersAllowed = SubscriptionService.isTabAllowed('ORDERS');

  const tabs = [
    { id: 'OVERVIEW', label: 'Visão Geral & DRE', icon: BarChart3, isPro: false },
    { id: 'SALES', label: 'Vendas (PDV)', icon: ShoppingCart, isPro: false },
    ...(isOrdersAllowed ? [{ id: 'SERVICES', label: 'Serviços (OS)', icon: Wrench, isPro: false }] : []),
    { id: 'PRODUCTS', label: 'Produtos / Estoque', icon: Package, isPro: false },
    { id: 'FINANCE', label: 'Financeiro & Caixa', icon: DollarSign, isPro: true },
    { id: 'COMPARATIVE', label: 'Comparativos & Metas', icon: Layers, isPro: true },
    { id: 'HISTORY', label: 'Trilha & Histórico', icon: Clock, isPro: true },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Main Header Card */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/60 shadow-xl text-white'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-500 shadow-inner">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Relatórios & Análises
            </h2>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Métricas detalhadas, demonstrativos financeiros, vendas, serviços e posição de estoque.
            </p>
          </div>
        </div>

        {/* Top Control Bar (Select, Date Picker, Export) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Report Type Selector */}
          <div className="relative">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl border appearance-none pr-9 cursor-pointer transition-colors shadow-xs ${
                isDark
                  ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
              }`}
            >
              <option value="Relatório Completo">Relatório Completo</option>
              <option value="DRE Gerencial">DRE Gerencial</option>
              <option value="Fluxo de Caixa">Fluxo de Caixa</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Date Range Selector */}
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border shadow-xs cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#0c1c38] text-slate-200 border-blue-800/80 hover:border-blue-500'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>

          {/* Export Action Button */}
          <button
            onClick={() => handleExport(activeTab)}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
              isDark
                ? 'bg-[#0c1c38] hover:bg-blue-600/30 text-white border-blue-800/80'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          const isLocked = t.isPro && !subLimits.canAccessAdvancedReports;

          return (
            <button
              key={t.id}
              onClick={() => {
                if (isLocked) {
                  setPaywallModalState({
                    isOpen: true,
                    title: `Relatório ${t.label} Bloqueado`,
                    description:
                      'Relatórios avançados, demonstrativos financeiros detalhados e análises comparativas são recursos exclusivos do Plano Pro e Enterprise.',
                    feature: 'ADVANCED_REPORTS',
                  });
                  return;
                }
                setActiveTab(t.id as TabType);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                  : isDark
                  ? 'bg-[#09152a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1c38] border border-blue-900/50'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.isPro && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                    isLocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isLocked && <Lock className="w-2.5 h-2.5" />}
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents - Distinct specific component rendered for each tab */}
      {activeTab === 'OVERVIEW' && (
        <ReportsOverviewTab
          sales={sales}
          orders={orders}
          expenses={expenses}
          onExport={handleExport}
        />
      )}

      {activeTab === 'SALES' && (
        <ReportsSalesTab
          sales={sales}
          onExport={handleExport}
        />
      )}

      {activeTab === 'SERVICES' && (
        <ReportsServicesTab
          orders={orders}
          onExport={handleExport}
        />
      )}

      {activeTab === 'PRODUCTS' && (
        <ReportsProductsTab
          products={products}
          onExport={handleExport}
        />
      )}

      {activeTab === 'FINANCE' && (
        <ReportsFinanceTab
          sales={sales}
          orders={orders}
          expenses={expenses}
          purchases={purchases}
          receivables={receivables}
          onExport={handleExport}
        />
      )}

      {activeTab === 'COMPARATIVE' && (
        <ReportsComparativeTab
          sales={sales}
          orders={orders}
          expenses={expenses}
          onExport={handleExport}
        />
      )}

      {activeTab === 'HISTORY' && (
        <ReportsHistoryTab
          sales={sales}
          orders={orders}
          expenses={expenses}
          purchases={purchases}
          onExport={handleExport}
        />
      )}

      {/* Paywall Gate Modal */}
      <PaywallModal
        isOpen={paywallModalState.isOpen}
        onClose={() => setPaywallModalState((prev) => ({ ...prev, isOpen: false }))}
        title={paywallModalState.title}
        description={paywallModalState.description}
        feature={paywallModalState.feature}
        onOpenPlans={onOpenPlans}
      />
    </div>
  );
};
