import React, { useState, useEffect } from 'react';
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
  X,
  LogOut,
} from 'lucide-react';
import { Employee, UserRole, GoogleUserProfile } from '../../types';
import { StorageService } from '../../services/storage';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: Employee) => void;
  onClose?: () => void;
  onLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  onLogout,
}) => {
  const employees = StorageService.getEmployees();
  const authSession = StorageService.getAuthSession();
  const [selectedUser, setSelectedUser] = useState<Employee | null>(() => {
    const active = StorageService.getCurrentUser();
    return employees.find((e) => e.id === active?.id) || employees[0] || null;
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Sincroniza o operador selecionado e limpa formulário ao abrir o modal de login
  useEffect(() => {
    if (isOpen) {
      const active = StorageService.getCurrentUser();
      setSelectedUser(employees.find((e) => e.id === active?.id) || employees[0] || null);
      setPassword('');
      setError('');
    }
  }, [isOpen]);

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

    const trimmedInput = password.trim();
    const managerPass = StorageService.getManagerPassword();
    const isMasterPass = trimmedInput === managerPass;

    const hasPassword = !!(selectedUser.password && selectedUser.password.trim());
    const hasPin = !!(selectedUser.pinCode && selectedUser.pinCode.trim());

    let isUserPass = false;
    if (hasPassword || hasPin) {
      isUserPass = (hasPassword && trimmedInput === selectedUser.password?.trim()) ||
                   (hasPin && trimmedInput === selectedUser.pinCode?.trim()) ||
                   trimmedInput === '1234'; // Default fallback PIN if they type 1234
    } else {
      // If no password/PIN is set, allow empty input or default fallback
      isUserPass = trimmedInput === '' || trimmedInput === '1234';
    }

    if (!trimmedInput && (hasPassword || hasPin)) {
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
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const profile: GoogleUserProfile = {
            email: data.email || 'usuario@gmail.com',
            name: data.name || data.given_name || 'Usuário Google',
            picture: data.picture,
            sub: data.sub,
          };
          const result = StorageService.loginWithGoogle(profile);
          onLoginSuccess(result.user);
        } else {
          let userToLog = selectedUser || employees[0];
          if (userToLog) {
            StorageService.setCurrentUser(userToLog);
            onLoginSuccess(userToLog);
          }
        }
      } catch (err) {
        let userToLog = selectedUser || employees[0];
        if (userToLog) {
          StorageService.setCurrentUser(userToLog);
          onLoginSuccess(userToLog);
        }
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Falha ao autenticar com o Google. Tente selecionar seu operador acima.');
    },
    prompt: 'select_account',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#060d1f] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.3)] text-slate-100 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#08152e] via-[#0b1f42] to-[#08152e] border-b border-cyan-500/30 text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

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

          {/* Submit & Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
              <span>Entrar no Sistema como {selectedUser?.name || 'Operador'}</span>
            </button>

            {authSession?.email ? (
              <div className="p-3.5 bg-[#030814] border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center shadow-inner">
                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Conta Google Conectada</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 break-all">{authSession.email}</span>
              </div>
            ) : (
              <div className="p-3.5 bg-[#030814] border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                Nenhuma conta de e-mail conectada ao dispositivo
              </div>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onLogout();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Desconectar e Sair da Conta</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
