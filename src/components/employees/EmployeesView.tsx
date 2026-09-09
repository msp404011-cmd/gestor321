import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Wrench,
  DollarSign,
  Package,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  Key,
  Mail,
  Phone,
  FileText,
  X,
  User,
  Percent,
  Lock,
} from 'lucide-react';
import { Employee, UserRole, UserPermissions } from '../../types';
import { StorageService } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';

export const EmployeesView: React.FC = () => {
  const { isDark } = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee>(() => StorageService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<UserRole>('TECNICO');
  const [commission, setCommission] = useState<number>(5);
  const [pinCode, setPinCode] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessAdminSettings: false,
    canViewFinancialReports: false,
    canViewProductCost: true,
    canManageEmployees: false,
    canManageProducts: true,
    canManageCustomers: true,
    canManageOrders: true,
    canOperatePos: true,
    canOperateCash: true,
    canManageExpenses: false,
    canDeleteRecords: false,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadEmployees = () => {
    setEmployees(StorageService.getEmployees());
    setCurrentUser(StorageService.getCurrentUser());
  };

  useEffect(() => {
    loadEmployees();
    const unsub = StorageService.subscribe(loadEmployees);
    return unsub;
  }, []);

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEmployeeToEdit(emp);
      setName(emp.name);
      setEmail(emp.email);
      setPhone(emp.phone || '');
      setCpf(emp.cpf || '');
      setRole(emp.role);
      setCommission(emp.commissionRate || 5);
      setPinCode(emp.pinCode || '1234');
      setPermissions(
        emp.permissions || {
          canAccessAdminSettings: emp.role === 'ADMINISTRADOR' || emp.role === 'GERENTE',
          canViewFinancialReports: emp.role === 'ADMINISTRADOR' || emp.role === 'GERENTE',
          canViewProductCost: true,
          canManageEmployees: emp.role === 'ADMINISTRADOR',
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canOperatePos: true,
          canOperateCash: true,
          canManageExpenses: emp.role === 'ADMINISTRADOR' || emp.role === 'GERENTE',
          canDeleteRecords: emp.role === 'ADMINISTRADOR',
        }
      );
    } else {
      setEmployeeToEdit(null);
      setName('');
      setEmail('');
      setPhone('');
      setCpf('');
      setRole('TECNICO');
      setCommission(5);
      setPinCode('1234');
      setPermissions({
        canAccessAdminSettings: false,
        canViewFinancialReports: false,
        canViewProductCost: true,
        canManageEmployees: false,
        canManageProducts: true,
        canManageCustomers: true,
        canManageOrders: true,
        canOperatePos: true,
        canOperateCash: true,
        canManageExpenses: false,
        canDeleteRecords: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMINISTRADOR') {
      setPermissions({
        canAccessAdminSettings: true,
        canViewFinancialReports: true,
        canViewProductCost: true,
        canManageEmployees: true,
        canManageProducts: true,
        canManageCustomers: true,
        canManageOrders: true,
        canOperatePos: true,
        canOperateCash: true,
        canManageExpenses: true,
        canDeleteRecords: true,
      });
    } else if (newRole === 'GERENTE') {
      setPermissions({
        canAccessAdminSettings: false,
        canViewFinancialReports: true,
        canViewProductCost: true,
        canManageEmployees: false,
        canManageProducts: true,
        canManageCustomers: true,
        canManageOrders: true,
        canOperatePos: true,
        canOperateCash: true,
        canManageExpenses: true,
        canDeleteRecords: false,
      });
    }
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Preencha pelo menos Nome e E-mail do funcionário.');
      return;
    }

    const emp: Employee = {
      id: employeeToEdit ? employeeToEdit.id : 'emp-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      username: email.trim().split('@')[0] || 'user',
      phone: phone.trim() || undefined,
      cpf: cpf.trim() || undefined,
      role,
      status: 'ATIVO',
      commissionRate: Number(commission) || 0,
      pinCode: pinCode.trim() || '1234',
      permissions,
      createdAt: employeeToEdit ? employeeToEdit.createdAt : new Date().toISOString(),
    };

    StorageService.saveEmployee(emp);
    setIsModalOpen(false);
    loadEmployees();
  };

  const handleSwitchUser = (emp: Employee) => {
    StorageService.setCurrentUser(emp);
    setCurrentUser(emp);
    alert(`Sessão alterada para o operador: ${emp.name} (${emp.role})`);
    window.location.reload();
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      StorageService.deleteEmployee(deleteId);
      setDeleteId(null);
      loadEmployees();
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesQuery =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.cpf && emp.cpf.includes(searchQuery));
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'GERENTE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'TECNICO':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#080d1a] border-slate-800 shadow-[0_0_25px_rgba(6,182,212,0.15)] text-white'
          : 'bg-white border-slate-200 shadow-xs text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Gestão de Funcionários & Equipe
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cadastre colaboradores, defina permissões de acesso e gerencie o operador ativo do sistema.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Colaboradores */}
        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#0b1328] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total da Equipe</p>
            <h3 className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{employees.length}</h3>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Colaboradores ativos</p>
          </div>
          <div className="p-3 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Operador Ativo */}
        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#0b1328] border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-white border-cyan-300 shadow-cyan-100'
        }`}>
          <div>
            <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">Sessão Ativa</p>
            <h3 className={`text-base font-bold mt-1 truncate max-w-[140px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</h3>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block mt-0.5">
              {currentUser.role}
            </span>
          </div>
          <div className="p-3 bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Técnicos */}
        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#0b1328] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Técnicos / Lab</p>
            <h3 className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {employees.filter((e) => e.role === 'TECNICO').length}
            </h3>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Especialistas em OS</p>
          </div>
          <div className="p-3 bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Admins & Gerentes */}
        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#0b1328] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gestores / Admin</p>
            <h3 className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {employees.filter((e) => e.role === 'ADMINISTRADOR' || e.role === 'ADMIN' || e.role === 'GERENTE').length}
            </h3>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Acesso administrativo</p>
          </div>
          <div className="p-3 bg-purple-500/20 text-purple-500 border border-purple-500/30 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isDark ? 'bg-[#080d1a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail, CPF..."
            className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 ${
              isDark ? 'bg-[#0b1328] border-slate-700/80 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cargo:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer w-full sm:w-auto ${
              isDark ? 'bg-[#0b1328] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">Todos os Cargos</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="GERENTE">Gerente</option>
            <option value="TECNICO">Técnico de Manutenção</option>
            <option value="VENDEDOR">Vendedor / Balcão</option>
            <option value="CAIXA">Caixa / Atendente</option>
          </select>
        </div>
      </div>

      {/* Employees Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isCurrent = emp.id === currentUser.id;

          return (
            <div
              key={emp.id}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all border-2 shadow-xs ${
                isCurrent
                  ? isDark
                    ? 'border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-gradient-to-b from-[#0c1a38] to-[#0b1328] text-white'
                    : 'border-cyan-500 bg-cyan-50/50 text-slate-900 shadow-sm'
                  : isDark
                  ? 'bg-[#0b1328] border-slate-800 text-white hover:border-cyan-500/60'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Card Top Header */}
                <div className={`flex items-start justify-between gap-3 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-cyan-500/20">
                      {emp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{emp.name}</h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border inline-block mt-1 ${getRoleBadgeColor(
                          emp.role
                        )}`}
                      >
                        {emp.role}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 rounded-lg flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sessão Ativa
                    </span>
                  )}
                </div>

                {/* Info List */}
                <div className="py-3.5 space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>

                  {emp.phone && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}

                  {emp.cpf && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>CPF: {emp.cpf}</span>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Percent className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Comissão sobre OS/Vendas: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{emp.commissionRate || 0}%</strong></span>
                  </div>
                </div>

                {/* Permissions Summary Badges */}
                <div className={`pt-2 border-t flex flex-wrap gap-1.5 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  {emp.permissions?.canAccessAdminSettings && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/30 px-2 py-0.5 rounded-md font-bold">
                      🛡️ Configs
                    </span>
                  )}
                  {emp.permissions?.canManageOrders && (
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
                      🔧 Ordens de Serviço
                    </span>
                  )}
                  {emp.permissions?.canViewFinancialReports && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                      💲 Financeiro
                    </span>
                  )}
                  {emp.permissions?.canManageProducts && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold">
                      📦 Estoque
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {!isCurrent ? (
                  <button
                    type="button"
                    onClick={() => handleSwitchUser(emp)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-600 border border-cyan-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Alternar operador ativo"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mudar Operador</span>
                  </button>
                ) : (
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operador Atual</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(emp)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Editar funcionário"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(emp.id)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 border border-rose-500/40 transition-colors cursor-pointer"
                    title="Excluir funcionário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastrar / Editar Funcionário */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className={`relative w-full max-w-2xl border rounded-3xl shadow-xl overflow-hidden flex flex-col my-auto cursor-default ${
              isDark ? 'bg-[#080d1a] border-cyan-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b ${
              isDark ? 'bg-[#0b1328] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/40 text-cyan-500 rounded-2xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {employeeToEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Defina os dados pessoais, perfil de acesso e permissões.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-xl cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmployee} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nome */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <User className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className={`w-full bg-transparent px-2.5 py-2 text-xs focus:outline-none ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    E-mail de Acesso <span className="text-rose-500">*</span>
                  </label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Mail className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@mspinformatica.com"
                      className={`w-full bg-transparent px-2.5 py-2 text-xs focus:outline-none ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Telefone */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Telefone</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Phone className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-8888"
                      className={`w-full bg-transparent px-2.5 py-2 text-xs focus:outline-none ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* CPF */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>CPF</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <FileText className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`w-full bg-transparent px-2.5 py-2 text-xs focus:outline-none ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Comissão % */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Comissão (%)</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Percent className="w-4 h-4 text-amber-500 ml-3 shrink-0" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className={`w-full bg-transparent px-2.5 py-2 text-xs font-bold focus:outline-none ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cargo */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cargo / Perfil</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold cursor-pointer ${
                      isDark ? 'bg-[#0b1328] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="TECNICO">Técnico de Manutenção</option>
                    <option value="ADMINISTRADOR">Administrador Geral</option>
                    <option value="GERENTE">Gerente de Loja</option>
                    <option value="VENDEDOR">Vendedor Balcão</option>
                    <option value="CAIXA">Caixa / Atendente</option>
                  </select>
                </div>

                {/* PIN Código */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PIN de Acesso Rápido</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-cyan-500 ${
                    isDark ? 'bg-[#0b1328] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Lock className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="Ex: 1234"
                      className={`w-full bg-transparent px-2.5 py-2 text-xs font-mono focus:outline-none ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Permissões Avançadas Checkboxes */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Permissões de Acesso do Usuário</span>
                </h4>

                <div className={`border rounded-2xl p-3.5 space-y-2.5 text-xs ${
                  isDark ? 'bg-[#0b1328] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Acessar Configurações do Sistema</span>
                    <input
                      type="checkbox"
                      checked={permissions.canAccessAdminSettings}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canAccessAdminSettings: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Visualizar Relatórios Financeiros & DRE</span>
                    <input
                      type="checkbox"
                      checked={permissions.canViewFinancialReports}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewFinancialReports: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Gerenciar Estoque e Cadastro de Produtos</span>
                    <input
                      type="checkbox"
                      checked={permissions.canManageProducts}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageProducts: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Lançar Despesas e Operar Caixa</span>
                    <input
                      type="checkbox"
                      checked={permissions.canManageExpenses}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageExpenses: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Permissão para Excluir Registros (OS/Vendas)</span>
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteRecords}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canDeleteRecords: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {employeeToEdit ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
          onClick={() => setDeleteId(null)}
        >
          <div 
            className={`border p-5 rounded-2xl max-w-md w-full space-y-4 cursor-default ${
              isDark ? 'bg-[#080d1a] border-rose-500/40 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Excluir Funcionário</h3>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Tem certeza que deseja excluir este colaborador da equipe? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
