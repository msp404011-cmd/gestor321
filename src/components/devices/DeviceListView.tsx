import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  Search,
  Plus,
  Users,
  Wrench,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  History,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Copy,
  Eye,
  EyeOff,
  Check,
  Clock,
  Laptop,
  Monitor,
  Tablet as TabletIcon,
  Gamepad2,
  Package,
  Boxes,
  CheckCircle2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  FileText,
  MoreVertical,
  Calendar,
  DollarSign,
  Crown,
  Mail,
  User,
  MessageSquare,
  Briefcase,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { Device, DeviceType, Customer } from '../../types';
import { StorageService } from '../../services/storage';
import { SubscriptionService } from '../../services/subscriptionService';
import { ConfirmDialog } from '../common/Modal';
import { getOrderStatusLabel, formatCurrency, formatDate } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

const getDeviceImage = (type?: string, brand?: string): string => {
  const t = (type || '').toLowerCase();
  const b = (brand || '').toLowerCase();
  if (t.includes('notebook') || t.includes('laptop') || t.includes('computador') || t.includes('macbook')) {
    return 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('tablet') || t.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('console') || t.includes('playstation') || t.includes('xbox') || t.includes('switch') || t.includes('videogame')) {
    return 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('desktop') || t.includes('pc') || t.includes('monitor') || t.includes('gabinete')) {
    return 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('relogio') || t.includes('watch') || t.includes('wearable') || t.includes('smartwatch')) {
    return 'https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=300&auto=format&fit=crop&q=80';
  }
  if (b.includes('apple') || b.includes('iphone')) {
    return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&auto=format&fit=crop&q=80';
  }
  if (b.includes('samsung')) {
    return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80';
};

interface DeviceListViewProps {
  onOpenNewDevice: () => void;
  onEditDevice: (device: Device) => void;
  onOpenNewOrderForDevice: (device: Device) => void;
  onNavigateToOrder: (orderId: string) => void;
}

export const DeviceListView: React.FC<DeviceListViewProps> = ({
  onOpenNewDevice,
  onEditDevice,
  onOpenNewOrderForDevice,
  onNavigateToOrder,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recentes' | 'antigos' | 'nome'>('recentes');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Password visibility state per device
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Copy notification state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>(() => StorageService.getDevices());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const orders = StorageService.getOrders();
  const currentUser = StorageService.getCurrentUser();

  const isSuperAdmin = useMemo(() => {
    return SubscriptionService.isSuperAdminUser();
  }, []);

  // CRM state
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    nickname: '',
    brand: '',
    model: '',
    color: '',
    imei: '',
    serialNumber: '',
  });
  const [expandedHistoryDeviceId, setExpandedHistoryDeviceId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [addingDeviceCustomerId, setAddingDeviceCustomerId] = useState<string | null>(null);
  const [newDeviceForm, setNewDeviceForm] = useState({
    brand: '',
    model: '',
    type: 'Celular' as DeviceType,
    imei: '',
    serialNumber: '',
    nickname: '',
    color: '',
    physicalCondition: '',
  });

  // Additional CRM UI States for editing customer, notes, dropdown options and history modal
  const [editingCrmCustomer, setEditingCrmCustomer] = useState<Customer | null>(null);
  const [isCreatingCrmCustomer, setIsCreatingCrmCustomer] = useState(false);
  const [newCrmCustomerForm, setNewCrmCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    city: '',
    address: '',
    notes: '',
  });
  const [isEditingNotesId, setIsEditingNotesId] = useState<string | null>(null);
  const [tempNotesText, setTempNotesText] = useState('');
  const [dropdownActiveCustomerId, setDropdownActiveCustomerId] = useState<string | null>(null);
  const [viewingHistoryCustomerId, setViewingHistoryCustomerId] = useState<string | null>(null);

  // Sync devices on mount & listen to changes
  useEffect(() => {
    if (isSuperAdmin) {
      StorageService.syncDevicesFromDeliveredOrders();
    }
    return StorageService.subscribe(() => {
      setDevices(StorageService.getDevices());
      setCustomers(StorageService.getCustomers());
    });
  }, [isSuperAdmin]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedType, selectedBrand, selectedStatus, sortBy]);

  // Toggle password visibility
  const togglePasswordVisibility = (deviceId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  // Copy field helper
  const handleCopy = (text: string, fieldName: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Dynamic available brands from devices
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    devices.forEach((d) => {
      if (d.brand && d.brand.trim()) {
        brandsSet.add(d.brand.trim());
      }
    });
    return ['TODOS', ...Array.from(brandsSet).sort()];
  }, [devices]);

  // Dynamic available types from devices
  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>(['Smartphone', 'Notebook', 'Desktop', 'Tablet', 'Console', 'Outros']);
    devices.forEach((d) => {
      if (d.type && d.type.trim()) {
        typesSet.add(d.type.trim());
      }
    });
    return ['TODOS', ...Array.from(typesSet)];
  }, [devices]);

  // Dynamic available statuses from devices
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>(['Em assistência', 'Concluído', 'Sem movimento']);
    devices.forEach((d) => {
      if (d.status && d.status.trim()) {
        statusSet.add(d.status.trim());
      }
    });
    return ['TODOS', ...Array.from(statusSet)];
  }, [devices]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = devices.length;
    const emAssistencia = devices.filter((d) => (d.status || 'Em assistência').toLowerCase() === 'em assistência').length;
    const concluidos = devices.filter((d) => (d.status || '').toLowerCase() === 'concluído').length;
    const semMovimento = devices.filter((d) => (d.status || '').toLowerCase() === 'sem movimento').length;
    return { total, emAssistencia, concluidos, semMovimento };
  }, [devices]);

  // CRM Memo and Functions: Entra SOMENTE se tiver OS ENTREGUE/CONCLUIDO, for cadastro manual no CRM, ou tiver aparelhos vinculados
  const crmCustomers = useMemo(() => {
    const allCustomers = customers;
    const allDevices = devices;
    const allOrders = orders;
    
    // Set of customer IDs that have delivered or completed orders
    const deliveredCustomerIds = new Set<string>();
    allOrders.forEach((o) => {
      const s = (o.status || '').toUpperCase();
      if (s === 'ENTREGUE' || s === 'CONCLUIDO' || s === 'CONCLUÍDO' || s === 'FINALIZADO') {
        if (o.customerId) deliveredCustomerIds.add(o.customerId);
      }
    });

    const customerGroups: Record<string, Device[]> = {};
    allDevices.forEach((d) => {
      if (!customerGroups[d.customerId]) {
        customerGroups[d.customerId] = [];
      }
      customerGroups[d.customerId].push(d);
    });
    
    return allCustomers
      .filter((c) => {
        const hasDeliveredOrder = deliveredCustomerIds.has(c.id);
        const isManual = Boolean(c.isManualEntry || c.manualCrm);
        const hasLinkedDevices = (customerGroups[c.id] || []).length > 0;
        return hasDeliveredOrder || isManual || hasLinkedDevices;
      })
      .map((c) => {
        const clientDevices = customerGroups[c.id] || [];
        return {
          customer: c,
          devices: clientDevices,
        };
      });
  }, [customers, devices, orders]);

  const filteredCrmCustomers = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return crmCustomers;
    
    return crmCustomers.filter((item) => {
      const matchCustomer = 
        item.customer.name.toLowerCase().includes(searchLower) ||
        (item.customer.phone || '').toLowerCase().includes(searchLower) ||
        (item.customer.email || '').toLowerCase().includes(searchLower) ||
        (item.customer.document || '').toLowerCase().includes(searchLower);
        
      const matchDevice = item.devices.some((d) => 
        (d.brand || '').toLowerCase().includes(searchLower) ||
        (d.model || '').toLowerCase().includes(searchLower) ||
        (d.imei || '').toLowerCase().includes(searchLower) ||
        (d.serialNumber || '').toLowerCase().includes(searchLower) ||
        (d.nickname || '').toLowerCase().includes(searchLower)
      );
      
      return matchCustomer || matchDevice;
    });
  }, [crmCustomers, search]);

  const expandedDeviceOrders = useMemo(() => {
    if (!expandedHistoryDeviceId) return [];
    const targetDev = devices.find((d) => d.id === expandedHistoryDeviceId);
    if (!targetDev) return [];
    
    return orders.filter(
      (o) =>
        o.customerId === targetDev.customerId &&
        (o.brand || '').trim().toLowerCase() === (targetDev.brand || '').trim().toLowerCase() &&
        (o.model || '').trim().toLowerCase() === (targetDev.model || '').trim().toLowerCase()
    );
  }, [expandedHistoryDeviceId, devices, orders]);

  const handleSaveDeviceDetails = (deviceId: string) => {
    const updatedDevices = devices.map((d) => {
      if (d.id === deviceId) {
        return {
          ...d,
          nickname: editingForm.nickname,
          brand: editingForm.brand,
          model: editingForm.model,
          color: editingForm.color,
          imei: editingForm.imei,
          serialNumber: editingForm.serialNumber,
        };
      }
      return d;
    });
    StorageService.saveDevices(updatedDevices);
    setEditingDeviceId(null);
  };

  const handleAddDeviceToCustomer = (customerId: string, customerName: string) => {
    if (!newDeviceForm.brand || !newDeviceForm.model) {
      alert('Por favor, preencha a marca e o modelo do aparelho.');
      return;
    }
    const newDev: Device = {
      id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      customerId,
      customerName,
      type: newDeviceForm.type,
      brand: newDeviceForm.brand,
      model: newDeviceForm.model,
      imei: newDeviceForm.imei,
      serialNumber: newDeviceForm.serialNumber,
      color: newDeviceForm.color || '',
      physicalCondition: newDeviceForm.physicalCondition || 'Sem avarias',
      notes: '',
      nickname: newDeviceForm.nickname,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveDevice(newDev);
    setAddingDeviceCustomerId(null);
    setNewDeviceForm({
      brand: '',
      model: '',
      type: 'Celular',
      imei: '',
      serialNumber: '',
      nickname: '',
      color: '',
      physicalCondition: '',
    });
  };

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selBrandNorm = selectedBrand.trim().toLowerCase();
    const selTypeNorm = selectedType.trim().toLowerCase();
    const selStatusNorm = selectedStatus.trim().toLowerCase();

    return devices.filter((d) => {
      // Type filter
      if (selTypeNorm !== 'todos') {
        const dType = (d.type || '').trim().toLowerCase();
        if (selTypeNorm === 'outros') {
          if (['smartphone', 'notebook', 'desktop', 'tablet', 'console'].includes(dType)) return false;
        } else if (dType !== selTypeNorm) {
          return false;
        }
      }

      // Brand filter
      if (selBrandNorm !== 'todos') {
        const dBrand = (d.brand || '').trim().toLowerCase();
        if (dBrand !== selBrandNorm) return false;
      }

      // Status filter
      if (selStatusNorm !== 'todos') {
        const dStatus = (d.status || 'em assistência').trim().toLowerCase();
        if (dStatus !== selStatusNorm) return false;
      }

      // Search query
      if (!q) return true;
      const brand = (d.brand || '').toLowerCase();
      const model = (d.model || '').toLowerCase();
      const imei = (d.imei || '').toLowerCase();
      const serial = (d.serialNumber || '').toLowerCase();
      const customer = (d.customerName || '').toLowerCase();

      return (
        brand.includes(q) ||
        model.includes(q) ||
        imei.includes(q) ||
        serial.includes(q) ||
        customer.includes(q)
      );
    });
  }, [devices, search, selectedType, selectedBrand, selectedStatus]);

  // Sorted Devices
  const sortedDevices = useMemo(() => {
    const list = [...filteredDevices];
    if (sortBy === 'recentes') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === 'antigos') {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === 'nome') {
      list.sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    }
    return list;
  }, [filteredDevices, sortBy]);

  // Paginated Devices
  const totalPages = Math.max(1, Math.ceil(sortedDevices.length / itemsPerPage));
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDevices.slice(start, start + itemsPerPage);
  }, [sortedDevices, currentPage, itemsPerPage]);

  const handleDeleteConfirm = () => {
    if (deviceToDelete) {
      StorageService.deleteDevice(deviceToDelete.id);
      setDeviceToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('TODOS');
    setSelectedBrand('TODOS');
    setSelectedStatus('TODOS');
    setSortBy('recentes');
  };

  // Type Icon Helper
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Smartphone':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'Notebook':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Desktop':
        return <Monitor className="w-3.5 h-3.5" />;
      case 'Tablet':
        return <TabletIcon className="w-3.5 h-3.5" />;
      case 'Console':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: devices.length,
      Smartphone: 0,
      Notebook: 0,
      Desktop: 0,
      Tablet: 0,
      Console: 0,
      Outros: 0,
    };
    devices.forEach((d) => {
      const t = d.type || '';
      if (['Smartphone', 'Notebook', 'Desktop', 'Tablet', 'Console'].includes(t)) {
        counts[t] = (counts[t] || 0) + 1;
      } else {
        counts['Outros'] = (counts['Outros'] || 0) + 1;
      }
    });
    return counts;
  }, [devices]);

  const typePills = [
    { label: 'Todos', count: typeCounts.TODOS, value: 'TODOS' },
    { label: 'Smartphone', count: typeCounts.Smartphone || 0, value: 'Smartphone' },
    { label: 'Notebook', count: typeCounts.Notebook || 0, value: 'Notebook' },
    { label: 'Desktop', count: typeCounts.Desktop || 0, value: 'Desktop' },
    { label: 'Tablet', count: typeCounts.Tablet || 0, value: 'Tablet' },
    { label: 'Console', count: typeCounts.Console || 0, value: 'Console' },
    { label: 'Outros', count: typeCounts.Outros || 0, value: 'Outros' },
  ];

  if (isSuperAdmin) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Toast Notification for Copied Fields */}
        {copiedField && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-cyan-950 border border-cyan-500/50 rounded-xl text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{copiedField} copiado para a área de transferência!</span>
          </div>
        )}

        {/* CRM VIEW */}
        <div className="space-y-6">
          {/* CRM HEADER */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_25px_rgba(2,132,199,0.15)] text-white'
                : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CRM • Clientes & Aparelhos
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Controle de relacionamento. Os clientes e seus aparelhos entram automaticamente aqui ao entregar uma OS.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingCrmCustomer(true)}
              className="bg-[#00bbf9] hover:bg-sky-400 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,187,249,0.35)] cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Card Cliente</span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div
            className={`p-3 border rounded-2xl flex items-center gap-3 transition-all ${
              isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200/80 shadow-sm'
            }`}
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por cliente, contato, marca, modelo ou apelido..."
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#040a17] border-blue-900/80 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={`px-3 py-2 text-xs font-bold border rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'bg-[#040a17] hover:bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                Limpar
              </button>
            )}
          </div>

          {/* CRM CARDS GRID */}
          {filteredCrmCustomers.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center text-slate-400 ${
              isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Nenhum cliente CRM encontrado</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Clientes e aparelhos vinculados aparecem automaticamente quando a Ordem de Serviço é entregue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredCrmCustomers.map(({ customer, devices: clientDevices }) => {
                const isAdding = addingDeviceCustomerId === customer.id;
                
                // Real data analytics per customer
                const clientOrders = orders.filter(o => o.customerId === customer.id);
                const totalSpent = clientOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
                
                // Find most recent order to get last service date & status
                const sortedClientOrders = [...clientOrders].sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const lastOrder = sortedClientOrders[0] || null;
                const lastServiceDate = lastOrder ? formatDate(lastOrder.createdAt) : 'N/A';
                
                // Initials helper
                const initials = customer.name
                  ? customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'MM';
                  
                return (
                  <div
                    key={customer.id}
                    className="border-2 border-[#00bbf9]/15 rounded-xl p-4 transition-all flex flex-col justify-between bg-gradient-to-b from-[#06142a] to-[#020712] text-white shadow-[0_0_20px_rgba(2,132,199,0.12)] hover:border-[#00bbf9]/45 hover:shadow-[0_0_25px_rgba(2,132,199,0.22)] duration-300 relative"
                  >
                    <div>
                      {/* Top Header section */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-blue-950/60">
                        <div className="flex items-center gap-3">
                          {/* Avatar with cyan neon glow - compressed size */}
                          <div className="w-14 h-14 rounded-full border-2 border-[#00bbf9] bg-gradient-to-tr from-[#020815] to-[#0c234a] flex items-center justify-center font-black text-lg text-white shadow-[0_0_12px_rgba(0,187,249,0.3)] shrink-0 select-none">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase truncate max-w-[180px] sm:max-w-[220px]">
                                {customer.name}
                              </h3>
                              {/* STATUS: ATIVO */}
                              <span className="bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                🟢 ATIVO
                              </span>
                            </div>
                            
                            {/* Cliente Desde */}
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-blue-950/40 border border-blue-900/40 rounded-md text-slate-300 text-[10px] font-semibold">
                              <User className="w-3 h-3 text-sky-400" />
                              <span>Cliente desde {formatDate(customer.createdAt)}</span>
                            </div>
 
                            {/* Contact Details with copy options */}
                            <div className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <a 
                                  href={`https://wa.me/55${(customer.phone || '').replace(/\D/g, '')}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-bold hover:text-emerald-400 hover:underline transition-colors"
                                >
                                  {customer.phone || 'Sem telefone'}
                                </a>
                                {customer.phone && (
                                  <button
                                    onClick={() => handleCopy(customer.phone, 'Telefone')}
                                    className="p-0.5 text-slate-400 hover:text-white transition-colors"
                                    title="Copiar Telefone"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-sky-400" />
                                <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                                  {customer.email || 'Sem e-mail'}
                                </span>
                                {customer.email && (
                                  <button
                                    onClick={() => handleCopy(customer.email, 'E-mail')}
                                    className="p-0.5 text-slate-400 hover:text-white transition-colors"
                                    title="Copiar E-mail"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
 
                        {/* Right side: loyal client and dropdown */}
                        <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 self-stretch sm:self-auto shrink-0">
                          {/* Card Actions Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setDropdownActiveCustomerId(dropdownActiveCustomerId === customer.id ? null : customer.id)}
                              className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-900/40 hover:bg-blue-950/80 transition-all text-slate-300 hover:text-white cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {dropdownActiveCustomerId === customer.id && (
                              <div className="absolute right-0 mt-1 w-48 rounded-lg border border-blue-900 bg-[#06142a] shadow-[0_0_20px_rgba(0,187,249,0.25)] z-30 overflow-hidden py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDropdownActiveCustomerId(null);
                                    setEditingCrmCustomer(customer);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-blue-950 text-sky-300 font-bold transition-colors flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Editar Cadastro</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDropdownActiveCustomerId(null);
                                    setAddingDeviceCustomerId(customer.id);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-blue-950 text-sky-300 font-bold transition-colors flex items-center gap-2"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar Aparelho</span>
                                </button>
                                <hr className="border-blue-950" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDropdownActiveCustomerId(null);
                                    setDeleteDialog({
                                      isOpen: true,
                                      title: 'Excluir Cliente do CRM',
                                      message: `Deseja realmente excluir o cliente "${customer.name}" e TODOS os seus aparelhos do CRM?`,
                                      onConfirm: () => {
                                        StorageService.deleteCustomer(customer.id);
                                        const updatedDevices = devices.filter((d) => d.customerId !== customer.id);
                                        StorageService.saveDevices(updatedDevices);
                                        setDevices(updatedDevices);
                                        setCustomers(StorageService.getCustomers());
                                        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
                                        setCopiedField('Cliente removido do CRM!');
                                        setTimeout(() => setCopiedField(null), 2000);
                                      },
                                    });
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-rose-950/60 text-rose-400 font-bold transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir de CRM</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Loyal Client Box */}
                          {clientOrders.length > 0 && (
                            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-2 flex flex-col items-center justify-center text-center max-w-[130px] shadow-[0_0_15px_rgba(245,158,11,0.08)]">
                              <div className="flex items-center gap-1 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                                <Crown className="w-3.5 h-3.5" />
                                <span>Cliente Fiel</span>
                              </div>
                              <span className="text-[9px] text-slate-300 font-bold mt-1">
                                {clientOrders.length} atendimentos
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
 
                      {/* Indicators Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-blue-900/60 bg-[#051329]/50 mt-3.5 divide-x-0 divide-y sm:divide-y-0 sm:divide-x divide-blue-900/40 overflow-hidden">
                        {/* Indicator 1 */}
                        <div className="p-2 sm:p-2.5 flex flex-col items-center text-center justify-center gap-1">
                          <Smartphone className="w-4 h-4 text-sky-400" />
                          <span className="text-sm sm:text-base font-black text-white">{clientDevices.length}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Aparelhos</span>
                        </div>
                        {/* Indicator 2 */}
                        <div className="p-2 sm:p-2.5 flex flex-col items-center text-center justify-center gap-1">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span className="text-sm sm:text-base font-black text-white">{clientOrders.length}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Ordens</span>
                        </div>
                        {/* Indicator 3 */}
                        <div className="p-2 sm:p-2.5 flex flex-col items-center text-center justify-center gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm sm:text-base font-black text-[#10b981]">{formatCurrency(totalSpent)}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Total Gasto</span>
                        </div>
                        {/* Indicator 4 */}
                        <div className="p-2 sm:p-2.5 flex flex-col items-center text-center justify-center gap-1">
                          <Calendar className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-black text-white py-1">{lastServiceDate}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Último Atend.</span>
                        </div>
                      </div>
 
                      {/* Aparelhos Do Cliente section */}
                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-blue-950/60">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                            <span>Aparelhos do Cliente ({clientDevices.length})</span>
                          </h4>
                          
                          <button
                            type="button"
                            onClick={() => setAddingDeviceCustomerId(addingDeviceCustomerId === customer.id ? null : customer.id)}
                            className="bg-sky-500/10 hover:bg-sky-500/20 text-[#00bbf9] border border-[#00bbf9]/40 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar Aparelho</span>
                          </button>
                        </div>

                        {/* Inline Adding form */}
                        {isAdding && (
                          <div className="p-4 rounded-2xl border border-[#00bbf9]/30 bg-[#040d1f] space-y-3.5 shadow-[0_0_15px_rgba(0,187,249,0.1)]">
                            <p className="text-[11px] font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Plus className="w-4 h-4" /> Novo Aparelho para {customer.name}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Marca *</label>
                                <input
                                  type="text"
                                  value={newDeviceForm.brand}
                                  onChange={(e) => setNewDeviceForm({...newDeviceForm, brand: e.target.value})}
                                  placeholder="Ex: Apple"
                                  className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Modelo *</label>
                                <input
                                  type="text"
                                  value={newDeviceForm.model}
                                  onChange={(e) => setNewDeviceForm({...newDeviceForm, model: e.target.value})}
                                  placeholder="Ex: iPhone 13"
                                  className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">IMEI / Serial</label>
                                <input
                                  type="text"
                                  value={newDeviceForm.imei}
                                  onChange={(e) => setNewDeviceForm({...newDeviceForm, imei: e.target.value})}
                                  placeholder="Opcional"
                                  className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Cor</label>
                                <input
                                  type="text"
                                  value={newDeviceForm.color}
                                  onChange={(e) => setNewDeviceForm({...newDeviceForm, color: e.target.value})}
                                  placeholder="Ex: Preto"
                                  className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Nome / Apelido do Dono</label>
                              <input
                                type="text"
                                value={newDeviceForm.nickname}
                                onChange={(e) => setNewDeviceForm({...newDeviceForm, nickname: e.target.value})}
                                placeholder="Ex: Celular da Dona Maria"
                                className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                              />
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setAddingDeviceCustomerId(null)}
                                className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                              >
                                Voltar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddDeviceToCustomer(customer.id, customer.name)}
                                className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-[#00bbf9] hover:bg-sky-400 text-white cursor-pointer transition-colors"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        )}

                        {clientDevices.length === 0 ? (
                          <div className="p-4 border border-dashed border-blue-900/60 rounded-xl text-center text-slate-400 text-xs italic">
                            Nenhum aparelho vinculado ao cliente ainda.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {clientDevices.map((dev) => {
                              const isEditingDevice = editingDeviceId === dev.id;
                              
                              // Calculate metrics for this specific device
                              const devOrders = orders.filter(
                                (o) =>
                                  o.customerId === dev.customerId &&
                                  (o.brand || '').trim().toLowerCase() === (dev.brand || '').trim().toLowerCase() &&
                                  (o.model || '').trim().toLowerCase() === (dev.model || '').trim().toLowerCase()
                              );
                              
                              const devOrdersCount = devOrders.length;
                              const devLastOrder = devOrdersCount > 0 
                                ? [...devOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] 
                                : null;
                              const devLastDate = devLastOrder ? formatDate(devLastOrder.createdAt) : 'N/A';
                              const devTotalValue = devOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
                              
                              // Image generator based on device properties
                              const devImgUrl = getDeviceImage(dev.type, dev.brand);

                              return (
                                <div
                                  key={dev.id}
                                  className="p-3 rounded-xl border border-blue-950/80 bg-[#030a17]/70 flex flex-col gap-2.5 shadow-xs hover:border-[#00bbf9]/30 transition-all duration-200"
                                >
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                      {/* Smartphone image - compressed */}
                                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border border-blue-900/40 bg-[#040a17] relative flex items-center justify-center">
                                        <img
                                          src={devImgUrl}
                                          alt={`${dev.brand} ${dev.model}`}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00bbf9]/15 via-transparent to-transparent pointer-events-none" />
                                      </div>

                                      {/* Brand & details */}
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-baseline gap-1">
                                          {dev.nickname && (
                                            <span className="text-[9px] bg-sky-500/20 text-[#00bbf9] font-black px-1 py-0.5 rounded leading-none">
                                              {dev.nickname.toUpperCase()}
                                            </span>
                                          )}
                                          <h5 className="font-bold text-xs sm:text-sm text-white truncate">
                                            {dev.brand} {dev.model}
                                          </h5>
                                          {dev.color && (
                                            <span className="text-[10px] text-slate-400 font-semibold">
                                              ({dev.color})
                                            </span>
                                          )}
                                        </div>

                                        {/* IMEI copyable */}
                                        <div className="flex items-center gap-1.5 text-[10px]">
                                          <span className="text-slate-400 font-medium">IMEI:</span>
                                          <span className="text-slate-200 font-bold tracking-wider">{dev.imei || 'Não informado'}</span>
                                          {dev.imei && (
                                            <button
                                              onClick={() => handleCopy(dev.imei || '', 'IMEI')}
                                              className="p-0.5 text-slate-500 hover:text-white transition-colors"
                                              title="Copiar IMEI"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>

                                        {/* OS réalisées */}
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold flex-wrap">
                                          <span>{devOrdersCount} OS {devOrdersCount === 1 ? 'realizada' : 'realizadas'}</span>
                                          <span>•</span>
                                          <span>Última: {devLastDate}</span>
                                        </div>

                                        {/* Current Defect or Service */}
                                        <div className="text-[10px]">
                                          {devLastOrder ? (
                                            devLastOrder.status === 'ENTREGUE' || devLastOrder.status === 'PRONTO' || devLastOrder.status === 'PRONTA' ? (
                                              <div className="flex items-center gap-1">
                                                <span className="text-[#10b981] font-bold">Serviço:</span>
                                                <span className="text-slate-200 truncate font-semibold">{devLastOrder.performedService || 'Não detalhado'}</span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <span className="text-rose-400 font-bold">Defeito atual:</span>
                                                <span className="text-slate-200 truncate font-semibold">{devLastOrder.clientDefect || 'Sem defeito'}</span>
                                              </div>
                                            )
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <span className="text-slate-400 font-bold">Físico:</span>
                                              <span className="text-slate-300 font-semibold">{dev.physicalCondition || 'Sem avarias'}</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Valor relacionado */}
                                        <div className="text-[10px] font-black flex items-center gap-1 mt-0.5">
                                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Valor:</span>
                                          <span className="text-[#10b981] text-xs">
                                            {formatCurrency(devTotalValue)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action buttons inside device block */}
                                    <div className="flex sm:flex-col items-center justify-end gap-1.5 shrink-0 w-full sm:w-auto">
                                      {/* Ver detalhes Button toggles history collapsible */}
                                      <button
                                        type="button"
                                        onClick={() => setExpandedHistoryDeviceId(expandedHistoryDeviceId === dev.id ? null : dev.id)}
                                        className="w-full sm:w-auto px-2.5 py-1 bg-blue-950/40 hover:bg-blue-950/80 border border-blue-900 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all text-[#00bbf9] hover:text-[#00bbf9]/85 cursor-pointer"
                                      >
                                        <span>Ver detalhes</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedHistoryDeviceId === dev.id ? 'rotate-180' : ''}`} />
                                      </button>

                                      {/* Quick Edit and Delete device */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingDeviceId(dev.id);
                                            setEditingForm({
                                              nickname: dev.nickname || '',
                                              brand: dev.brand || '',
                                              model: dev.model || '',
                                              color: dev.color || '',
                                              imei: dev.imei || '',
                                              serialNumber: dev.serialNumber || '',
                                            });
                                          }}
                                          className="p-1.5 rounded-md bg-blue-950/30 border border-blue-900/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors cursor-pointer"
                                          title="Editar Aparelho"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteDialog({
                                              isOpen: true,
                                              title: 'Excluir Aparelho',
                                              message: `Deseja realmente excluir o aparelho "${dev.brand} ${dev.model}" do CRM?`,
                                              onConfirm: () => {
                                                StorageService.deleteDevice(dev.id);
                                                setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
                                              },
                                            });
                                          }}
                                          className="p-1.5 rounded-md bg-blue-950/30 border border-blue-900/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                                          title="Excluir Aparelho"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Collapsible history section */}
                                  {expandedHistoryDeviceId === dev.id && (
                                    <div className="mt-2 p-2.5 border border-dashed border-blue-900 rounded-lg bg-[#020815] transition-all space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                      <div className="flex justify-between items-center pb-1.5 border-b border-blue-950">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                                          <History className="w-4 h-4" /> Histórico de Consertos
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-400">Clique na OS para abri-la</span>
                                      </div>

                                      {devOrders.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Sem registros de consertos anteriores.</p>
                                      ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                          {devOrders.map((o) => (
                                            <div
                                              key={o.id}
                                              onClick={() => onNavigateToOrder(o.id)}
                                              className="p-3 rounded-xl border border-blue-950 bg-[#040d1f] hover:border-sky-500/40 hover:bg-blue-950/10 cursor-pointer transition-all flex flex-col gap-1.5"
                                            >
                                              <div className="flex justify-between items-center font-bold text-xs">
                                                <span className="text-[#00bbf9]">
                                                  OS #{o.orderNumber}
                                                </span>
                                                <span className="text-slate-400 text-[10px]">
                                                  {formatDate(o.createdAt)}
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-blue-950/40 pt-1.5">
                                                <div>
                                                  <span className="text-slate-500 block text-[9px] font-black uppercase">Defeito:</span>
                                                  <span className="font-semibold text-slate-200 line-clamp-1">{o.clientDefect || 'Sem defeito'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 block text-[9px] font-black uppercase">Conserto:</span>
                                                  <span className="font-semibold text-slate-200 line-clamp-1">{o.performedService || 'Não realizado'}</span>
                                                </div>
                                              </div>
                                              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-bold bg-[#051329]/40 p-2 rounded-lg">
                                                <span>Valor:</span>
                                                <span className="text-[#10b981] font-black text-xs">
                                                  {formatCurrency(o.totalPrice)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* In-place device edit form */}
                                  {isEditingDevice && (
                                    <div className="mt-3 pt-3 border-t border-blue-950 space-y-3">
                                      <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Edit2 className="w-3.5 h-3.5" /> Editar Aparelho
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Nome / Apelido</label>
                                          <input
                                            type="text"
                                            value={editingForm.nickname}
                                            onChange={(e) => setEditingForm({ ...editingForm, nickname: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Cor</label>
                                          <input
                                            type="text"
                                            value={editingForm.color}
                                            onChange={(e) => setEditingForm({ ...editingForm, color: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Marca *</label>
                                          <input
                                            type="text"
                                            value={editingForm.brand}
                                            onChange={(e) => setEditingForm({ ...editingForm, brand: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Modelo *</label>
                                          <input
                                            type="text"
                                            value={editingForm.model}
                                            onChange={(e) => setEditingForm({ ...editingForm, model: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">IMEI</label>
                                          <input
                                            type="text"
                                            value={editingForm.imei}
                                            onChange={(e) => setEditingForm({ ...editingForm, imei: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">S/N</label>
                                          <input
                                            type="text"
                                            value={editingForm.serialNumber}
                                            onChange={(e) => setEditingForm({ ...editingForm, serialNumber: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex justify-end gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => setEditingDeviceId(null)}
                                          className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                                        >
                                          Voltar
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!editingForm.brand.trim() || !editingForm.model.trim()}
                                          onClick={() => handleSaveDeviceDetails(dev.id)}
                                          className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors"
                                        >
                                          Salvar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Observações do Cliente */}
                      <div className="mt-4 border border-blue-900/40 bg-[#051329]/20 rounded-xl p-3 shadow-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-blue-950/60">
                          <h5 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Observações do Cliente</span>
                          </h5>
                          
                          {isEditingNotesId !== customer.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingNotesId(customer.id);
                                setTempNotesText(customer.notes || '');
                              }}
                              className="bg-blue-950 hover:bg-blue-900 text-slate-300 hover:text-white border border-blue-900 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>

                        <div className="mt-2">
                          {isEditingNotesId === customer.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={tempNotesText}
                                onChange={(e) => setTempNotesText(e.target.value)}
                                placeholder="Insira observações importantes sobre o cliente..."
                                className="w-full px-2.5 py-1.5 text-[11px] border border-blue-900 rounded-lg focus:outline-none bg-[#051329] text-white min-h-[60px] resize-y"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingNotesId(null)}
                                  className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedCust = { ...customer, notes: tempNotesText };
                                    StorageService.saveCustomer(updatedCust);
                                    setIsEditingNotesId(null);
                                    setCopiedField('Observações salvas');
                                    setTimeout(() => setCopiedField(null), 1500);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#00bbf9] hover:bg-sky-400 text-white cursor-pointer"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold italic">
                              {customer.notes || 'Nenhuma observação informada.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-blue-950/40 pt-3 mt-4 shrink-0">
                      {/* WhatsApp Trigger */}
                      <a
                        href={`https://wa.me/55${(customer.phone || '').replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(customer.name || '')}!%20Gostaríamos%20de%20conversar%20sobre%20suas%20ordens%20de%20serviço.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#128c7e] hover:bg-[#075e54] text-white text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(18,140,126,0.15)] flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">WhatsApp</span>
                      </a>

                      {/* Ver Histórico Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => setViewingHistoryCustomerId(customer.id)}
                        className="bg-blue-950/40 hover:bg-blue-950 border border-blue-900 rounded-lg text-[10px] sm:text-xs font-bold py-2 transition-all text-sky-400 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="truncate">Histórico</span>
                      </button>

                      {/* Editar Cadastro Trigger */}
                      <button
                        type="button"
                        onClick={() => setEditingCrmCustomer(customer)}
                        className="bg-blue-950/40 hover:bg-blue-950 border border-blue-900 rounded-lg text-[10px] sm:text-xs font-bold py-2 transition-all text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">Editar</span>
                      </button>

                      {/* Excluir do CRM Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteDialog({
                            isOpen: true,
                            title: 'Excluir Cliente do CRM',
                            message: `Deseja realmente excluir o cliente "${customer.name}" e todos os seus aparelhos do CRM?`,
                            onConfirm: () => {
                              StorageService.deleteCustomer(customer.id);
                              const updatedDevices = devices.filter((d) => d.customerId !== customer.id);
                              StorageService.saveDevices(updatedDevices);
                              setDevices(updatedDevices);
                              setCustomers(StorageService.getCustomers());
                              setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
                              setCopiedField('Cliente removido do CRM!');
                              setTimeout(() => setCopiedField(null), 2000);
                            },
                          });
                        }}
                        className="bg-rose-950/30 hover:bg-rose-900/60 border border-rose-900/60 rounded-lg text-[10px] sm:text-xs font-bold py-2 transition-all text-rose-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="truncate">Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Delete Confirmation for CRM Actions */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={deleteDialog.onConfirm}
          title={deleteDialog.title}
          message={deleteDialog.message}
        />

        {/* CRM CUSTOMER CREATE MODAL */}
        {isCreatingCrmCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-xl border-2 border-[#00bbf9]/40 bg-gradient-to-b from-[#06142a] to-[#020712] rounded-[24px] p-6 text-white shadow-[0_0_40px_rgba(2,132,199,0.4)] space-y-4 max-h-[90vh] overflow-y-auto animate-in scale-in duration-150">
              <div className="flex justify-between items-center border-b border-blue-950 pb-3">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00bbf9]" />
                  <span>Cadastrar Novo Cliente</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingCrmCustomer(false)}
                  className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-900/40 hover:bg-red-500/10 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={newCrmCustomerForm.name}
                    onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, name: e.target.value })}
                    placeholder="Nome completo do cliente"
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      value={newCrmCustomerForm.phone}
                      onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, phone: e.target.value })}
                      placeholder="Ex: (88) 99999-9999"
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">E-mail</label>
                    <input
                      type="text"
                      value={newCrmCustomerForm.email}
                      onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, email: e.target.value })}
                      placeholder="exemplo@email.com"
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">CPF / CNPJ (Documento)</label>
                    <input
                      type="text"
                      value={newCrmCustomerForm.document}
                      onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, document: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Cidade / Estado</label>
                    <input
                      type="text"
                      value={newCrmCustomerForm.city}
                      onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, city: e.target.value })}
                      placeholder="Ex: Juazeiro do Norte - CE"
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={newCrmCustomerForm.address}
                    onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, address: e.target.value })}
                    placeholder="Rua, número, bairro..."
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Observações Privadas</label>
                  <textarea
                    value={newCrmCustomerForm.notes}
                    onChange={(e) => setNewCrmCustomerForm({ ...newCrmCustomerForm, notes: e.target.value })}
                    placeholder="Escreva anotações importantes..."
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-blue-950">
                <button
                  type="button"
                  onClick={() => setIsCreatingCrmCustomer(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newCrmCustomerForm.name.trim() || !newCrmCustomerForm.phone.trim()}
                  onClick={() => {
                    const newCust: Customer = {
                      id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                      name: newCrmCustomerForm.name.trim(),
                      phone: newCrmCustomerForm.phone.trim(),
                      whatsapp: newCrmCustomerForm.phone.trim(),
                      email: newCrmCustomerForm.email.trim(),
                      document: newCrmCustomerForm.document.trim(),
                      city: newCrmCustomerForm.city.trim(),
                      address: newCrmCustomerForm.address.trim(),
                      notes: newCrmCustomerForm.notes.trim(),
                      createdAt: new Date().toISOString(),
                      status: 'Ativo',
                      isManualEntry: true,
                      manualCrm: true,
                    };
                    StorageService.saveCustomer(newCust);
                    setCustomers(StorageService.getCustomers());
                    setIsCreatingCrmCustomer(false);
                    setNewCrmCustomerForm({
                      name: '',
                      phone: '',
                      email: '',
                      document: '',
                      city: '',
                      address: '',
                      notes: '',
                    });
                    setCopiedField('Cliente cadastrado com sucesso!');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#00bbf9] hover:bg-sky-400 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(0,187,249,0.3)] disabled:opacity-50"
                >
                  Salvar Cadastro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CRM CUSTOMER EDIT MODAL */}
        {editingCrmCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-xl border-2 border-[#00bbf9]/40 bg-gradient-to-b from-[#06142a] to-[#020712] rounded-[24px] p-6 text-white shadow-[0_0_40px_rgba(2,132,199,0.4)] space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-blue-950 pb-3">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00bbf9]" />
                  <span>Editar Cadastro do Cliente</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCrmCustomer(null)}
                  className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-900/40 hover:bg-red-500/10 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={editingCrmCustomer.name || ''}
                    onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      value={editingCrmCustomer.phone || ''}
                      onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">E-mail</label>
                    <input
                      type="text"
                      value={editingCrmCustomer.email || ''}
                      onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">CPF / CNPJ (Documento)</label>
                    <input
                      type="text"
                      value={editingCrmCustomer.document || ''}
                      onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, document: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Cidade / Estado</label>
                    <input
                      type="text"
                      value={editingCrmCustomer.city || ''}
                      onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={editingCrmCustomer.address || ''}
                    onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Observações Privadas</label>
                  <textarea
                    value={editingCrmCustomer.notes || ''}
                    onChange={(e) => setEditingCrmCustomer({ ...editingCrmCustomer, notes: e.target.value })}
                    placeholder="Alguma observação relevante..."
                    className="w-full px-3 py-2 text-xs border border-blue-900 rounded-xl focus:outline-none focus:border-[#00bbf9]/60 bg-[#051329] text-white font-semibold min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-blue-950">
                <button
                  type="button"
                  onClick={() => setEditingCrmCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!editingCrmCustomer.name?.trim() || !editingCrmCustomer.phone?.trim()}
                  onClick={() => {
                    const updatedCustomer: Customer = {
                      ...editingCrmCustomer,
                      name: editingCrmCustomer.name.trim(),
                      phone: editingCrmCustomer.phone.trim(),
                      whatsapp: editingCrmCustomer.whatsapp?.trim() || editingCrmCustomer.phone.trim(),
                      email: editingCrmCustomer.email?.trim() || '',
                      document: editingCrmCustomer.document?.trim() || '',
                      city: editingCrmCustomer.city?.trim() || '',
                      address: editingCrmCustomer.address?.trim() || '',
                      notes: editingCrmCustomer.notes?.trim() || '',
                    };
                    StorageService.saveCustomer(updatedCustomer);
                    const updatedDevs = devices.map(d => d.customerId === updatedCustomer.id ? { ...d, customerName: updatedCustomer.name } : d);
                    StorageService.saveDevices(updatedDevs);
                    setDevices(updatedDevs);
                    setCustomers(StorageService.getCustomers());
                    setEditingCrmCustomer(null);
                    setCopiedField('Cadastro atualizado com sucesso!');
                    setTimeout(() => setCopiedField(null), 1500);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#00bbf9] hover:bg-sky-400 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(0,187,249,0.3)] disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CRM CUSTOMER COMPLETE REPAIR HISTORY MODAL */}
        {viewingHistoryCustomerId && (() => {
          const currentCust = StorageService.getCustomers().find(c => c.id === viewingHistoryCustomerId);
          if (!currentCust) return null;
          const custOrders = orders.filter(o => o.customerId === viewingHistoryCustomerId);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-2xl border-2 border-[#00bbf9]/40 bg-gradient-to-b from-[#06142a] to-[#020712] rounded-[24px] p-6 text-white shadow-[0_0_40px_rgba(2,132,199,0.4)] space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-blue-950 pb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <History className="w-5 h-5 text-[#00bbf9]" />
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Histórico Geral de Consertos
                      </h3>
                      <p className="text-[11px] text-[#00bbf9] font-bold uppercase tracking-wider">
                        {currentCust.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingHistoryCustomerId(null)}
                    className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-900/40 hover:bg-red-500/10 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {custOrders.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-blue-900/50 rounded-2xl text-slate-400 italic text-sm">
                      Nenhum registro de Ordem de Serviço encontrado para este cliente.
                    </div>
                  ) : (
                    custOrders.map((o) => (
                      <div
                        key={o.id}
                        className="p-4 rounded-2xl border border-blue-950 bg-[#030a17] hover:border-sky-500/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[#00bbf9] text-sm font-black">
                              OS #{o.orderNumber}
                            </span>
                            <span className="text-[10px] bg-blue-950 text-sky-400 font-bold px-2 py-0.5 rounded-md">
                              {o.brand} {o.model}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-blue-950/50 pt-2 text-slate-300">
                            <div>
                              <span className="text-slate-500 block text-[9px] font-black uppercase tracking-wider">Defeito Relatado</span>
                              <span className="font-semibold text-xs text-white line-clamp-2">{o.clientDefect || 'Sem defeito'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] font-black uppercase tracking-wider">Serviço Realizado</span>
                              <span className="font-semibold text-xs text-white line-clamp-2">{o.performedService || 'Não realizado'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1.5">
                            <span className="font-semibold">Data: {formatDate(o.createdAt)}</span>
                            <span>•</span>
                            <span className="font-semibold uppercase text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/20 rounded">
                              Valor: {formatCurrency(o.totalPrice)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingHistoryCustomerId(null);
                            onNavigateToOrder(o.id);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-900 text-xs font-black text-[#00bbf9] hover:text-white transition-all text-center cursor-pointer shrink-0"
                        >
                          Ver OS Completa
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-blue-950 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingHistoryCustomerId(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification for Copied Fields */}
      {copiedField && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-cyan-950 border border-cyan-500/50 rounded-xl text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{copiedField} copiado para a área de transferência!</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_25px_rgba(2,132,199,0.15)] text-white'
            : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aparelhos Cadastrados
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie todos os aparelhos vinculados aos clientes, com histórico de serviços, IMEI e senhas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewDevice}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Aparelho</span>
        </button>
      </div>

      {/* 4 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Aparelhos (Blue) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-blue-950/40 via-[#09152a] to-blue-950/20 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
              : 'bg-blue-50/60 border-blue-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-blue-600/30 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-100 border-blue-300 text-blue-600'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>Total de Aparelhos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.total}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Total
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>Cadastrados no sistema</p>
            </div>
          </div>
        </div>

        {/* Card 2: Em Assistência (Amber) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/40 via-[#09152a] to-amber-950/20 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              : 'bg-amber-50/60 border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-600/30 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-amber-100 border-amber-300 text-amber-600'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>Em Assistência</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.emAssistencia}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Ativos
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-amber-300/70' : 'text-amber-600'}`}>Aguardando ou em serviço</p>
            </div>
          </div>
        </div>

        {/* Card 3: Concluídos (Purple) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-purple-950/40 via-[#09152a] to-purple-950/20 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
              : 'bg-purple-50/60 border-purple-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-purple-600/30 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-purple-100 border-purple-300 text-purple-600'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-purple-200/80' : 'text-purple-700'}`}>Concluídos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.concluidos}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Prontos
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>Entregues aos clientes</p>
            </div>
          </div>
        </div>

        {/* Card 4: Sem Movimento (Rose) */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-rose-950/40 via-[#09152a] to-rose-950/20 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
              : 'bg-rose-50/60 border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-rose-600/30 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-rose-100 border-rose-300 text-rose-600'
            }`}>
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-rose-200/80' : 'text-rose-700'}`}>Sem Movimento</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.semMovimento}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> Parados
                </span>
              </div>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-rose-300/70' : 'text-rose-600'}`}>Sem movimentação recente</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div
        className={`p-3 border rounded-2xl flex flex-col md:flex-row items-center gap-3 transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80'
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar marca, modelo, IMEI, nº de série ou cliente..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
              isDark
                ? 'bg-[#040a17] border-blue-900/80 text-white placeholder-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Filtros Button */}
          <button
            type="button"
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Filtros</span>
          </button>

          {/* Marca Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b === 'TODOS' ? 'Todas as Marcas' : b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Categoria Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'TODOS' ? 'Todas as Categorias' : t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'TODOS' ? 'Todos os Status' : s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Limpar Filters */}
          <button
            type="button"
            onClick={handleClearFilters}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#040a17] hover:bg-rose-950/80 border-blue-900/80 text-slate-300 hover:text-rose-300'
                : 'bg-slate-100 hover:bg-rose-50 border-slate-300 text-slate-700 hover:text-rose-600'
            }`}
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* CATEGORY PILLS & VIEW MODE ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {typePills.map((item) => {
            const isActive = selectedType === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedType(item.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-md'
                    : isDark
                    ? 'bg-[#09152a] hover:bg-blue-950/80 text-slate-300 border border-blue-900/80'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[11px] opacity-80 ${isActive ? 'text-cyan-200' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ({item.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode & Sort */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`pl-3 pr-8 py-2 border rounded-xl text-xs font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#09152a] border-blue-900/80 text-slate-300 focus:border-cyan-400'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grid/List Toggle */}
          <div className={`flex items-center p-1 border rounded-xl ${
            isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border border-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border border-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DEVICE GRID CARDS */}
      {filteredDevices.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center text-slate-400 ${
          isDark ? 'bg-[#09152a] border-blue-900/80' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Smartphone className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Nenhum aparelho encontrado</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tente mudar os filtros de busca ou cadastre um novo equipamento.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {paginatedDevices.map((device) => {
            const isPasswordVisible = visiblePasswords[device.id] || false;
            const status = device.status || 'Em assistência';

            // Status Styling
            let statusStyle = isDark
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-300';
            if (status === 'Concluído') {
              statusStyle = isDark
                ? 'bg-blue-950/80 text-cyan-300 border-cyan-500/50'
                : 'bg-blue-50 text-blue-700 border-blue-300';
            } else if (status === 'Sem movimento') {
              statusStyle = isDark
                ? 'bg-slate-900/80 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-300';
            }

            return (
              <div
                key={device.id}
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between group ${
                  isDark
                    ? 'bg-[#09152a] border-blue-900/80 shadow-[0_0_20px_rgba(2,132,199,0.12)] hover:border-cyan-500/50'
                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Card Header: Photo + Badge + Title + Customer + Menu */}
                  <div className="flex items-start gap-3">
                    {/* Device Thumbnail */}
                    <div className="relative shrink-0">
                      <img
                        src={
                          device.photoUrl ||
                          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={device.model}
                        className={`w-14 h-14 rounded-xl object-cover border ${
                          isDark ? 'border-blue-900/80 bg-[#040a17]' : 'border-slate-200 bg-slate-100'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Right Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Category Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border flex items-center gap-1 ${
                            isDark
                              ? 'bg-blue-900/80 text-cyan-300 border-blue-700/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {getTypeIcon(device.type)}
                            <span>{device.type}</span>
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${statusStyle} flex items-center gap-1`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            <span>{status}</span>
                          </span>
                        </div>

                        {/* Three Dots Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCardMenu(activeCardMenu === device.id ? null : device.id)
                            }
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isDark
                                ? 'text-slate-400 hover:text-white hover:bg-blue-950'
                                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeCardMenu === device.id && (
                            <div className={`absolute right-0 top-7 z-20 w-36 border rounded-xl shadow-xl py-1 text-xs ${
                              isDark
                                ? 'bg-[#060e1d] border-blue-900 text-slate-300'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCardMenu(null);
                                  onEditDevice(device);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 cursor-pointer ${
                                  isDark ? 'hover:text-white hover:bg-blue-900/60' : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Editar</span>
                              </button>

                              {currentUser.permissions.canDeleteRecords && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCardMenu(null);
                                    setDeviceToDelete(device);
                                  }}
                                  className="w-full px-3 py-2 text-left text-rose-500 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Device Title */}
                      <h3 className={`font-black text-sm truncate leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {device.brand} {device.model}
                      </h3>

                      {/* Customer Name */}
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Cliente: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{device.customerName || 'Lucas Almeida Santos'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Device Specs & Secret Codes Table */}
                  <div className={`mt-3.5 p-2.5 rounded-xl border space-y-2 text-xs ${
                    isDark
                      ? 'bg-[#040a17] border-blue-900/60'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    {/* IMEI */}
                    {device.imei && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IMEI</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{device.imei}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(device.imei!, 'IMEI')}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title="Copiar IMEI"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nº Série */}
                    {device.serialNumber && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nº Série</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{device.serialNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(device.serialNumber!, 'Número de Série')}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title="Copiar Número de Série"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Senha/PIN */}
                    {device.passwordPin && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Senha/PIN</span>
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span>{isPasswordVisible ? device.passwordPin : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(device.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                            title={isPasswordVisible ? 'Ocultar Senha' : 'Mostrar Senha'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-cyan-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Acessórios */}
                    {device.accessoriesDelivered && (
                      <div className={`flex items-center justify-between pt-0.5 border-t ${
                        isDark ? 'border-blue-900/40' : 'border-slate-200'
                      }`}>
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Acessórios</span>
                        <div className={`flex items-center gap-1.5 text-[11px] font-medium truncate max-w-[170px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <span className="truncate">{device.accessoriesDelivered}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(device.id)}
                            className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-blue-950' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-blue-900/60' : 'border-slate-100'
                }`}>
                  {/* Left: OS Counter badge */}
                  <button
                    type="button"
                    onClick={() => setHistoryDevice(device)}
                    className={`flex items-center gap-1 text-xs font-black transition-colors cursor-pointer ${
                      isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-blue-600'
                    }`}
                    title="Ver Histórico de Ordens"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{device.osCount || 3} OS</span>
                  </button>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Ver Histórico */}
                    <button
                      type="button"
                      onClick={() => setHistoryDevice(device)}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-300 hover:text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Ver Histórico</span>
                    </button>

                    {/* Nova OS */}
                    <button
                      type="button"
                      onClick={() => onOpenNewOrderForDevice(device)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Nova OS</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER PAGINATION BAR */}
      <div
        className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-all ${
          isDark
            ? 'bg-[#09152a] border-blue-900/80 text-slate-400'
            : 'bg-white border-slate-200 shadow-xs text-slate-600'
        }`}
      >
        <div>
          <span>Mostrando </span>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>
            {filteredDevices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, filteredDevices.length)}
          </strong>
          <span> de </span>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>
            {filteredDevices.length} aparelhos
          </strong>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={`p-2 border rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-400 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-xl font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white border border-cyan-400 shadow-xs'
                    : isDark
                    ? 'bg-[#040a17] hover:bg-blue-950 text-slate-300 border border-blue-900/80'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={`p-2 border rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-slate-400 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Items Per Page Select */}
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`pl-3 pr-7 py-1.5 border rounded-xl font-bold appearance-none focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#040a17] hover:bg-blue-950 border-blue-900/80 text-white focus:border-cyan-400'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History Modal for Device */}
      {historyDevice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setHistoryDevice(null)}
        >
          <div 
            className="w-full max-w-lg bg-[#09152a] border border-blue-900/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(2,132,199,0.25)] text-white relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setHistoryDevice(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#040a17] border border-blue-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  Histórico: {historyDevice.brand} {historyDevice.model}
                </h3>
                <p className="text-xs text-slate-400">Cliente: {historyDevice.customerName}</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-blue-900/40 max-h-72 overflow-y-auto pr-1">
              {orders
                .filter((o) => o.deviceId === historyDevice.id)
                .map((os) => (
                  <div
                    key={os.id}
                    onClick={() => {
                      setHistoryDevice(null);
                      onNavigateToOrder(os.id);
                    }}
                    className="py-3 flex items-center justify-between hover:bg-blue-950/60 p-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-cyan-400 text-xs">OS #{os.orderNumber}</span>
                      <span className="ml-2 text-xs font-semibold text-slate-300">
                        {getOrderStatusLabel(os.status)}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{os.clientDefect}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-xs">
                        {formatCurrency(os.totalPrice)}
                      </span>
                      <p className="text-[10px] text-slate-500">{formatDate(os.createdAt)}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryDevice(null)}
                className="px-5 py-2 bg-[#040a17] hover:bg-blue-950 border border-blue-900/80 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Aparelho"
        message={`Deseja realmente excluir o aparelho "${deviceToDelete?.brand} ${deviceToDelete?.model}" do cliente "${deviceToDelete?.customerName}"?`}
      />
    </div>
  );
};
