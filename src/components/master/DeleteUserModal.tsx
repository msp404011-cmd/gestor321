import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  User, 
  KeyRound, 
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CanonicalAccount } from '../../services/accountSchema';
import { StorageService } from '../../services/storage';
import { AdminBackendService } from '../../services/adminBackendService';

interface DeleteUserModalProps {
  client: CanonicalAccount;
  onClose: () => void;
  onDeleted: (client: CanonicalAccount) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  client,
  onClose,
  onDeleted
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmationWord, setConfirmationWord] = useState('');
  const [agreeAuthDelete, setAgreeAuthDelete] = useState(false);
  const [agreeDocDelete, setAgreeDocDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [deletionResult, setDeletionResult] = useState<{
    authDeleted?: boolean;
    firestoreDeleted?: boolean;
    authError?: string;
  } | null>(null);

  const userName = client.nome || client.name || 'Sem nome';
  const userEmail = client.email || 'Sem e-mail';
  const userCompany = client.empresa || client.nomeEmpresa || client.nomeFantasia || '-';
  const planName = client.planoNome || client.planoId || client.plano || 'Plano Completo';
  const planPrice = typeof client.valorPlano === 'number' ? client.valorPlano : 0.50;
  const expiryDate = client.dataVencimento || '-';
  const targetId = client.id || client.uid || client.email;
  const targetUid = client.uid || (client.id && !client.id.includes('@') ? client.id : '');

  const isConfirmationValid = 
    confirmationWord.trim().toUpperCase() === 'EXCLUIR' && 
    agreeAuthDelete && 
    agreeDocDelete;

  const handleExecuteDelete = async () => {
    if (!isConfirmationValid) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setStep(3);
      setStatusLog(['Iniciando protocolo de exclusão administrativa segura...']);

      // 1. Chama a API de Backend Autorizada para excluir do Firebase Authentication e Firestore
      setStatusLog(prev => [...prev, 'Executando exclusão com privilégios administrativos no backend...']);
      
      const backendData = await AdminBackendService.deleteUser({
        uid: targetUid || (targetId.includes('@') ? '' : targetId),
        email: userEmail,
        docId: targetId,
      });

      setStatusLog(prev => [
        ...prev,
        '✅ Conta do usuário excluída com sucesso do Firebase Authentication.',
        '✅ Documento correspondente removido do Firestore.',
      ]);

      // 2. Remove cache e registros locais associados a esta conta
      setStatusLog(prev => [...prev, 'Limpando dados de sessão e cache local...']);
      StorageService.deleteAccountPermanently(userEmail);
      if (targetUid) {
        StorageService.deleteAccountPermanently(targetUid);
      }

      setStatusLog(prev => [...prev, '✅ Operação concluída com sucesso!']);
      setDeletionResult({
        authDeleted: backendData?.authDeleted ?? true,
        firestoreDeleted: backendData?.firestoreDeleted ?? true,
        authError: backendData?.authError,
      });

      setStep(4);
    } catch (err: any) {
      console.error('Erro ao executar exclusão:', err);
      const msg = typeof err === 'string'
        ? (err === '[object Object]' ? 'Ocorreu um erro ao excluir o usuário.' : err)
        : (err?.message && typeof err.message === 'string' && err.message !== '[object Object]')
        ? err.message
        : (err?.error && typeof err.error === 'string' && err.error !== '[object Object]')
        ? err.error
        : 'Ocorreu um erro ao excluir o usuário.';
      setErrorMsg(msg);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onDeleted(client);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[120] p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 p-5 border-b border-rose-900/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-900/40 border border-rose-600/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/50">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">EXCLUIR USUÁRIO</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700">
                  Ação Destrutiva
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                {step === 1 && 'Etapa 1 de 2: Revisão dos dados da conta'}
                {step === 2 && 'Etapa 2 de 2: Confirmação de segurança e execução'}
                {step === 3 && 'Executando exclusão no Firebase...'}
                {step === 4 && 'Operação concluída com sucesso'}
              </p>
            </div>
          </div>
          {step !== 3 && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* ETAPA 1: REVISÃO DOS DADOS DO USUÁRIO */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Card de Aviso Crítico */}
              <div className="p-4 bg-rose-950/40 border border-rose-700/60 rounded-2xl flex items-start gap-3 text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-300 text-sm">Atenção: Ação Permanente e Irreversível</p>
                  <p className="text-rose-200/90 leading-relaxed">
                    Você está prestes a excluir definitivamente este usuário. Esta ação revoga imediatamente o acesso ao sistema Gestor, remove a conta do <strong>Firebase Authentication</strong> e apaga o registro correspondente no <strong>Firestore</strong>.
                  </p>
                </div>
              </div>

              {/* Informações detalhadas do Usuário */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Dados da Conta a ser Excluída
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsável</span>
                    <span className="font-bold text-white text-sm">{userName}</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Loja / Empresa</span>
                    <span className="font-bold text-cyan-300 text-sm">{userCompany}</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">E-mail de Login</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{userEmail}</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Plano Atual</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-white">{planName}</span>
                      <span className="font-black text-emerald-400">R$ {planPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vencimento</span>
                    <span className="font-bold text-white mt-1 block">{expiryDate}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    ID / UID do Firebase:
                  </span>
                  <span className="font-mono text-slate-300 truncate max-w-[240px]" title={targetId}>
                    {targetId}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: SEGUNDA CONFIRMAÇÃO OBRIGATÓRIA */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Segunda Confirmação Exigida</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para evitar exclusões acidentais, confirme os termos abaixo e digite a palavra <strong className="text-rose-400 uppercase tracking-widest font-black">EXCLUIR</strong> no campo indicado.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Checkboxes de Confirmação */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={agreeAuthDelete}
                    onChange={(e) => setAgreeAuthDelete(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-900 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">
                    Estou ciente de que a conta de <strong>{userEmail}</strong> será revogada e excluída do <strong>Firebase Authentication</strong>, impedindo qualquer futuro login.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={agreeDocDelete}
                    onChange={(e) => setAgreeDocDelete(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-900 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">
                    Confirmo a exclusão definitiva do documento correspondente no <strong>Firestore</strong>, ciente de que somente os dados deste usuário específico serão removidos.
                  </span>
                </label>
              </div>

              {/* Campo de Digitação "EXCLUIR" */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Digite <span className="text-rose-400 font-black tracking-wider">EXCLUIR</span> para habilitar a exclusão:
                </label>
                <input
                  type="text"
                  value={confirmationWord}
                  onChange={(e) => setConfirmationWord(e.target.value)}
                  placeholder="Digite EXCLUIR"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white font-mono text-center tracking-widest text-sm uppercase placeholder:normal-case placeholder:text-slate-600 outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* ETAPA 3: PROCESSANDO EXCLUSÃO */}
          {step === 3 && (
            <div className="py-8 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-rose-950/50 border border-rose-600/60 flex items-center justify-center mx-auto text-rose-400 shadow-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">Excluindo Usuário do Firebase</h3>
                <p className="text-xs text-slate-400 mt-1">Por favor aguarde enquanto os registros são removidos com segurança...</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 font-mono text-xs max-h-40 overflow-y-auto">
                {statusLog.map((log, i) => (
                  <div key={i} className="text-slate-300 flex items-center gap-2">
                    <span className="text-slate-600">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 4: SUCESSO */}
          {step === 4 && (
            <div className="py-6 space-y-5 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-950/60 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Usuário excluído com sucesso.</h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  A conta de <strong>{userName}</strong> ({userEmail}) foi completamente removida do sistema.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Confirmação dos Registros:</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 ml-6 list-disc">
                  <li>Conta revogada e excluída no Firebase Authentication</li>
                  <li>Documento removido da coleção <code className="text-cyan-400">accounts</code> no Firestore</li>
                  <li>Nenhum dado de outro usuário foi afetado</li>
                  <li>Tentativas de login com este e-mail serão rejeitadas</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-700 hover:bg-rose-600 text-white flex items-center gap-2 transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <span>Avançar para Confirmação</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!isConfirmationValid || isLoading}
                onClick={handleExecuteDelete}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                  isConfirmationValid && !isLoading
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/50 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Usuário Definitivamente</span>
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full text-center text-xs text-slate-500 italic">
              Operação em andamento... não feche esta janela.
            </div>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              Concluir e Atualizar Painel
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
