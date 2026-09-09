import React, { useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, PackageX, Wallet, ArrowRight, X } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const notifications = useMemo(() => {
    const orders = StorageService.getOrders();
    const products = StorageService.getProducts();
    const receivables = StorageService.getReceivables();
    const cash = StorageService.getCashSession();
    const now = new Date();

    const items: Array<{
      id: string;
      title: string;
      description: string;
      type: 'warning' | 'danger' | 'success' | 'info';
      tab: string;
      itemId?: string;
      time?: string;
    }> = [];

    // 1. OS Atrasadas
    orders.forEach((o) => {
      if (
        o.status !== 'ENTREGUE' &&
        o.status !== 'CANCELADA' &&
        o.status !== 'NAO_APROVADA' &&
        o.estimatedCompletionDate
      ) {
        const est = new Date(o.estimatedCompletionDate);
        if (est < now) {
          items.push({
            id: `os-late-${o.id}`,
            title: `OS #${o.orderNumber} Atrasada!`,
            description: `${o.customerName} (${o.brand} ${o.model}) - Prazo expirou em ${formatDate(o.estimatedCompletionDate)}`,
            type: 'danger',
            tab: 'orders',
            itemId: o.id,
          });
        }
      }
    });

    // 2. OS Prontas aguardando retirada
    orders
      .filter((o) => o.status === 'PRONTA')
      .forEach((o) => {
        items.push({
          id: `os-ready-${o.id}`,
          title: `OS #${o.orderNumber} Pronta para Retirada`,
          description: `${o.customerName} (${o.brand} ${o.model}) - Aguardando entrega e pagamento de ${formatCurrency(o.totalPrice)}`,
          type: 'success',
          tab: 'orders',
          itemId: o.id,
        });
      });

    // 3. Produtos sem estoque
    products
      .filter((p) => p.stockQuantity <= 0 && p.isActive)
      .forEach((p) => {
        items.push({
          id: `prod-zero-${p.id}`,
          title: `Produto Esgotado!`,
          description: `${p.name} (SKU: ${p.sku}) está com estoque ZERO.`,
          type: 'danger',
          tab: 'products',
          itemId: p.id,
        });
      });

    // 4. Produtos com estoque baixo
    products
      .filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockQuantity && p.isActive)
      .forEach((p) => {
        items.push({
          id: `prod-low-${p.id}`,
          title: `Estoque Baixo: ${p.name}`,
          description: `Apenas ${p.stockQuantity} un em estoque (Mínimo: ${p.minStockQuantity}).`,
          type: 'warning',
          tab: 'products',
          itemId: p.id,
        });
      });


    // 6. Alerta de Caixa
    if (cash && cash.status === 'ABERTO') {
      items.push({
        id: 'cash-open',
        title: 'Caixa da Loja Aberto',
        description: `Operador: ${cash.openedBy} • Saldo inicial: ${formatCurrency(cash.openingBalance)}`,
        type: 'info',
        tab: 'cash',
      });
    } else {
      items.push({
        id: 'cash-closed',
        title: 'Atenção: Caixa Fechado',
        description: 'Abra o caixa para habilitar vendas no balcão e conferência do turno.',
        type: 'warning',
        tab: 'cash',
      });
    }

    return items;
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md h-full shadow-2xl border-l-2 flex flex-col animate-in slide-in-from-right duration-200 transition-all ${
          isDark
            ? 'bg-[#0c1626] border-slate-700/80 shadow-[0_0_35px_rgba(6,182,212,0.25)] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
          isDark ? 'bg-[#070e1d] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base whitespace-nowrap">Notificações e Alertas</h3>
            <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 rounded-full">
              {notifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
              <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Tudo em dia!</p>
              <p className="text-xs text-slate-400 mt-1">Nenhum alerta pendente no momento.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const borderColors = isDark
                ? {
                    danger: 'border-l-4 border-l-rose-500 bg-rose-950/25 border-rose-500/40 text-rose-200',
                    warning: 'border-l-4 border-l-amber-500 bg-amber-950/25 border-amber-500/40 text-amber-200',
                    success: 'border-l-4 border-l-emerald-500 bg-emerald-950/25 border-emerald-500/40 text-emerald-200',
                    info: 'border-l-4 border-l-cyan-500 bg-cyan-950/25 border-cyan-500/40 text-cyan-200',
                  }[n.type]
                : {
                    danger: 'border-l-4 border-l-rose-500 bg-rose-50/70 border-rose-200 text-rose-900',
                    warning: 'border-l-4 border-l-amber-500 bg-amber-50/70 border-amber-200 text-amber-900',
                    success: 'border-l-4 border-l-emerald-500 bg-emerald-50/70 border-emerald-200 text-emerald-900',
                    info: 'border-l-4 border-l-blue-500 bg-blue-50/70 border-blue-200 text-blue-900',
                  }[n.type];

              const icon = {
                danger: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
                warning: <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
                info: <Wallet className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />,
              }[n.type];

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    onNavigate(n.tab, n.itemId);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border-2 shadow-xs cursor-pointer hover:shadow-md transition-all group ${borderColors}`}
                >
                  <div className="flex items-start gap-2.5">
                    {icon}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-semibold transition-colors ${
                          isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-850 group-hover:text-blue-600'
                        }`}>
                          {n.title}
                        </h4>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{n.description}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
