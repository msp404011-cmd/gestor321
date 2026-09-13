import React, { useState } from 'react';
import { Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { AdminBackendService } from '../../services/adminBackendService';

interface MasterAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterAuthModal: React.FC<MasterAuthModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, informe a senha de administrador.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await AdminBackendService.login(password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Senha de administrador incorreta.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="master-auth-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[130] p-4 animate-in fade-in duration-150">
      <div id="master-auth-modal-card" className="bg-slate-900 border border-slate-700/90 p-6 sm:p-8 rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Painel Master</h2>
            <p className="text-xs text-slate-400">Autenticação Administrativa Segura</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha de Acesso Master
            </label>
            <input
              id="master-password-input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-cyan-400 outline-none text-sm transition-colors"
              placeholder="Digite a senha master"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <span>Acessar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

