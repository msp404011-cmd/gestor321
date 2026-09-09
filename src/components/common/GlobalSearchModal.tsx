import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Wrench, Users, Smartphone, Package, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { formatCurrency, getOrderStatusLabel } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { orders: [], customers: [], products: [], devices: [], sales: [] };

    const orders = StorageService.getOrders().filter(
      (o) =>
        o.orderNumber.toString().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        (o.imei && o.imei.toLowerCase().includes(q)) ||
        o.clientDefect.toLowerCase().includes(q)
    );

    const customers = StorageService.getCustomers().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.whatsapp.includes(q) ||
        c.document.includes(q) ||
        c.email.toLowerCase().includes(q)
    );

    const products = StorageService.getProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    const devices = StorageService.getDevices().filter(
      (d) =>
        d.brand.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        (d.imei && d.imei.toLowerCase().includes(q)) ||
        (d.serialNumber && d.serialNumber.toLowerCase().includes(q)) ||
        (d.customerName && d.customerName.toLowerCase().includes(q))
    );

    const sales = StorageService.getSales().filter(
      (s) => s.saleNumber.toString().includes(q) || s.customerName.toLowerCase().includes(q)
    );

    return { orders, customers, products, devices, sales };
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.orders.length +
    results.customers.length +
    results.products.length +
    results.devices.length +
    results.sales.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border-2 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 transition-all ${
          isDark
            ? 'bg-[#0c1626] border-slate-700/90 shadow-[0_0_35px_rgba(6,182,212,0.25)] text-white'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b-2 ${
          isDark ? 'bg-[#070e1d] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar cliente, OS, IMEI, defeito, código de barras, produto..."
            className={`w-full bg-transparent border-none text-base focus:outline-none ${
              isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className={`hidden sm:inline-block px-2 py-0.5 text-xs rounded font-mono ${
            isDark ? 'text-slate-400 bg-slate-800 border border-slate-700' : 'text-slate-500 bg-slate-200/80'
          }`}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className={`p-4 overflow-y-auto divide-y flex-1 ${
          isDark ? 'divide-slate-800/80' : 'divide-slate-100'
        }`}>
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-500 mb-3" />
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Busca Rápida Unificada</p>
              <p className="text-xs text-slate-400 mt-1">
                Digite o número da OS, nome do cliente, CPF, IMEI, SKU ou produto
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Verifique a ortografia ou tente outro termo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Orders */}
              {results.orders.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ordens de Serviço ({results.orders.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.orders.slice(0, 4).map((os) => (
                      <div
                        key={os.id}
                        onClick={() => {
                          onNavigate('orders', os.id);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark ? 'hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30' : 'hover:bg-blue-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm font-bold text-cyan-400">OS #{os.orderNumber}</span>
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{os.customerName}</span>
                            <span className="text-xs text-slate-400">({getOrderStatusLabel(os.status)})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {os.brand} {os.model} — {os.clientDefect}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {formatCurrency(os.totalPrice)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clientes ({results.customers.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.customers.slice(0, 4).map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          onNavigate('customers', cust.id);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark ? 'hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/30' : 'hover:bg-emerald-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cust.name}</span>
                            <span className="text-xs text-slate-400">{cust.phone}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Doc: {cust.document || 'Não informado'} • {cust.city || 'Cidade não informada'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>Produtos ({results.products.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.products.slice(0, 4).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onNavigate('products', prod.id);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark ? 'hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30' : 'hover:bg-purple-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {prod.photoUrl ? (
                            <img
                              src={prod.photoUrl}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700/50"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className={`text-sm font-semibold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{prod.name}</span>
                            <p className="text-xs text-slate-400 whitespace-nowrap">
                              SKU: {prod.sku} • Estoque: {prod.stockQuantity} un
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-sm font-semibold text-emerald-400">
                            {formatCurrency(prod.sellingPrice)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devices */}
              {results.devices.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aparelhos ({results.devices.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.devices.slice(0, 3).map((dev) => (
                      <div
                        key={dev.id}
                        onClick={() => {
                          onNavigate('devices', dev.id);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark ? 'hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30' : 'hover:bg-amber-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {dev.brand} {dev.model}
                            </span>
                            <span className="text-xs text-slate-400">({dev.type})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cliente: {dev.customerName} {dev.imei ? `• IMEI: ${dev.imei}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales */}
              {results.sales.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <ShoppingCart className="w-3.5 h-3.5 text-teal-400" />
                    <span>Vendas ({results.sales.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.sales.slice(0, 3).map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          onNavigate('pos', sale.id);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark ? 'hover:bg-teal-950/40 border border-transparent hover:border-teal-500/30' : 'hover:bg-cyan-50/60'
                        }`}
                      >
                        <div>
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Venda #{sale.saleNumber} — {sale.customerName}
                          </span>
                          <p className="text-xs text-slate-400">
                            {sale.items.length} itens • Vendedor: {sale.sellerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-slate-800'}`}>{formatCurrency(sale.total)}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
