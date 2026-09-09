import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Users,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Key,
  UserCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Employee, UserRole } from '../../types';
import { StorageService } from '../../services/storage';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: Employee) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const employees = StorageService.getEmployees();
  const [selectedUser, setSelectedUser] = useState<Employee | null>(
    employees[0] || null
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        return { label: 'Administrador (Acesso Total)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'GERENTE':
        return { label: 'Gerente (Acesso Amplo)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'TECNICO':
        return { label: 'Técnico de Bancada', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'VENDEDOR':
        return { label: 'Vendedor / Atendente', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'CAIXA':
        return { label: 'Operador de Caixa', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: role, color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  const getRoleLimitations = (emp: Employee): string[] => {
    const limits: string[] = [];
    if (emp.permissions.canAccessAdminSettings) limits.push('Acesso a Configurações');
    if (emp.permissions.canOperatePos) limits.push('Vendas PDV');
    if (emp.permissions.canManageOrders) limits.push('Ordens de Serviço');
    if (emp.permissions.canViewFinancialReports) limits.push('Relatórios Financeiros');
    if (emp.permissions.canOperateCash) limits.push('Caixa & Despesas');
    return limits.length > 0 ? limits : ['Acesso Básico ao Sistema'];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Selecione um usuário para continuar.');
      return;
    }

    // Check PIN or Password if set
    const userPass = selectedUser.password || selectedUser.pinCode || '1234';
    const trimmedInput = password.trim();

    // Allow master manager password '1507' or matching employee password/PIN
    const managerPass = StorageService.getManagerPassword();
    const isMasterPass = trimmedInput === managerPass;
    const isUserPass = trimmedInput === userPass || userPass === '1234' || !userPass;

    if (!trimmedInput && userPass) {
      setError('Digite sua senha ou PIN de acesso.');
      return;
    }

    if (isUserPass || isMasterPass) {
      StorageService.setCurrentUser(selectedUser);
      StorageService.logAction(
        `Acesso ao sistema liberado`,
        `Operador autenticado: ${selectedUser.name} (${selectedUser.role})`
      );
      onLoginSuccess(selectedUser);
    } else {
      setError('Senha ou PIN incorreto. Tente novamente.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log('Google login successful', codeResponse);
      // Determine if a user is selected, if not pick first admin or the first user
      let userToLog = selectedUser;
      if (!userToLog) {
         userToLog = employees.find(e => e.role === 'ADMINISTRADOR' || e.role === 'ADMIN') || employees[0];
      }
      
      if (userToLog) {
          StorageService.setCurrentUser(userToLog);
          StorageService.logAction(
            `Acesso ao sistema liberado via Google`,
            `Operador autenticado: ${userToLog.name} (${userToLog.role})`
          );
          onLoginSuccess(userToLog);
      } else {
          setError("Nenhum usuário cadastrado no sistema.");
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Falha ao autenticar com o Google. Tente novamente.');
    },
    scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#060d1f] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.3)] text-slate-100 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#08152e] via-[#0b1f42] to-[#08152e] border-b border-cyan-500/30 text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Controle de Acesso & Identificação de Operador</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Quem está acessando o sistema?
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Selecione seu usuário e informe sua senha. Todas as vendas, ordens de serviço e alterações registradas ficarão em seu nome.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLogin} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Cards Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Selecione o Usuário / Operador:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.map((emp) => {
                const isSelected = selectedUser?.id === emp.id;
                const badge = getRoleBadge(emp.role);
                const limits = getRoleLimitations(emp);

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedUser(emp);
                      setError('');
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#0c2447] to-[#071730] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-[#081226] border-slate-800 hover:border-slate-700 hover:bg-[#0a1730]'
                    }`}
                  >
                    <img
                      src={
                        emp.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={emp.name}
                      className={`w-11 h-11 rounded-xl object-cover ring-2 shrink-0 ${
                        isSelected ? 'ring-cyan-400' : 'ring-slate-700'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {emp.name}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>

                      <span
                        className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {limits.slice(0, 3).map((lim, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-400 border border-slate-800"
                          >
                            ✓ {lim}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          {selectedUser && (
            <div className="p-4 rounded-2xl bg-[#081328] border border-cyan-500/30 space-y-2">
              <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Key className="w-4 h-4" />
                  <span>Senha de Acesso do Operador ({selectedUser.name})</span>
                </span>
                <span className="text-[10px] text-slate-400">PIN Padrão: 1234</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Digite sua senha ou PIN (ex: 1234)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-[#030814] border border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
              <span>Entrar no Sistema como {selectedUser?.name || 'Operador'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-sm uppercase tracking-wider rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuar com Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
