import React from 'react';
import {
  Users,
  Smartphone,
  Wrench,
  ShoppingCart,
  MessageCircle,
  Calendar,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  FileText,
  Plus,
} from 'lucide-react';
import { Customer } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusBadgeClasses,
  cleanPhoneForWhatsApp,
} from '../../services/formatters';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
  onOpenNewOrderForCustomer: (customer: Customer) => void;
  onOpenNewDeviceForCustomer: (customer: Customer) => void;
  onNavigateToOrder: (orderId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
  onOpenNewOrderForCustomer,
  onOpenNewDeviceForCustomer,
  onNavigateToOrder,
}) => {
  const { isDark } = useTheme();
  if (!customer) return null;

  const devices = StorageService.getDevices().filter((d) => d.customerId === customer.id);
  const orders = StorageService.getOrders().filter((o) => o.customerId === customer.id);
  const sales = StorageService.getSales().filter((s) => s.customerId === customer.id);

  // Total spent across orders and sales
  const totalOrdersSpent = orders
    .filter((o) => o.paymentStatus === 'PAGO' || o.status === 'ENTREGUE')
    .reduce((acc, o) => acc + o.totalPrice, 0);
  const totalSalesSpent = sales.reduce((acc, s) => acc + s.total, 0);
  const totalAccumulated = totalOrdersSpent + totalSalesSpent;

  // Last visit (most recent date from order or sale)
  const dates = [
    ...orders.map((o) => o.createdAt),
    ...sales.map((s) => s.date),
    customer.createdAt,
  ].filter(Boolean);
  const lastVisit = dates.sort().reverse()[0];

  const whatsappClean = cleanPhoneForWhatsApp(customer.whatsapp || customer.phone);
  const whatsappUrl = whatsappClean
    ? `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
        `Olá ${customer.name}, tudo bem? Aqui é da MSP Informática!`
      )}`
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {customer.name}
            </h3>
            <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cliente desde {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>
      }
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewOrderForCustomer(customer);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Abrir Nova OS</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Editar Cadastro
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#081226] border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Gasto na Loja</span>
            <p className="text-xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalAccumulated)}
            </p>
            <span className="text-[11px] text-slate-400">
              {orders.length} OS • {sales.length} compras
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#081226] border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-semibold text-slate-400 block">Aparelhos Vinculados</span>
            <p className="text-xl font-black text-cyan-400 mt-1">{devices.length}</p>
            <span className="text-[11px] text-slate-400">Equipamentos registrados</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#081226] border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-semibold text-slate-400 block">Última Movimentação</span>
            <p className={`text-sm font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(lastVisit)}</p>
            <span className="text-[11px] text-slate-400">Última visita registrada</span>
          </div>
        </div>

        {/* Contact & Address Grid */}
        <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
          isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className={`sm:col-span-2 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-400">WhatsApp / Celular:</span>
            <span className="font-semibold">{customer.whatsapp || customer.phone || 'Não informado'}</span>
          </div>

          <div className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium text-slate-400">CPF/CNPJ:</span>
            <span className="font-mono">{customer.document || 'Não informado'}</span>
          </div>

          <div className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium text-slate-400">E-mail:</span>
            <span>{customer.email || 'Não informado'}</span>
          </div>

          <div className={`sm:col-span-2 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium text-slate-400">Endereço:</span>
            <span>
              {customer.address
                ? `${customer.address}, ${customer.city || ''} - ${customer.state || ''}`
                : 'Endereço não cadastrado'}
            </span>
          </div>

          {customer.notes && (
            <div className={`sm:col-span-2 p-2.5 rounded-lg text-xs border ${
              isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <span className="font-bold">Observações: </span>
              {customer.notes}
            </div>
          )}
        </div>

        {/* Aparelhos Vinculados */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Aparelhos Cadastrados ({devices.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewDeviceForCustomer(customer);
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Vincular Aparelho
            </button>
          </div>

          {devices.length === 0 ? (
            <div className={`p-4 rounded-xl text-center text-xs border ${
              isDark ? 'bg-[#081226] border-slate-700/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              Nenhum aparelho vinculado a este cliente ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-3 rounded-xl text-xs border ${
                    isDark ? 'bg-[#081226] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {dev.brand} {dev.model}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {dev.type}
                    </span>
                  </div>
                  <div className={`mt-1 space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    {dev.imei && <p>IMEI: {dev.imei}</p>}
                    {dev.serialNumber && <p>Nº Série: {dev.serialNumber}</p>}
                    {dev.passwordPin && <p className="text-amber-400 font-mono">Senha: {dev.passwordPin}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Ordens de Serviço */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-700'
          }`}>
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Histórico de Serviços & Manutenções ({orders.length})</span>
          </h4>

          {orders.length === 0 ? (
            <div className={`p-4 rounded-xl text-center text-xs border ${
              isDark ? 'bg-[#081226] border-slate-700/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              Nenhuma ordem de serviço aberta para este cliente.
            </div>
          ) : (
            <div className={`divide-y rounded-xl overflow-hidden border ${
              isDark ? 'divide-slate-700/60 border-slate-700/60' : 'divide-slate-100 border-slate-200'
            }`}>
              {orders.map((os) => {
                const badge = getOrderStatusBadgeClasses(os.status);
                return (
                  <div
                    key={os.id}
                    onClick={() => {
                      onClose();
                      onNavigateToOrder(os.id);
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-blue-600/20 bg-[#081226]' : 'hover:bg-blue-50/50 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-cyan-400 text-xs">OS #{os.orderNumber}</span>
                        <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {os.brand} {os.model}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {getOrderStatusLabel(os.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{os.clientDefect}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-400 text-xs">
                        {formatCurrency(os.totalPrice)}
                      </span>
                      <p className="text-[10px] text-slate-400">{formatDate(os.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
