/**
 * Padronização da estrutura de contas/usuários do Gestor e Painel Master.
 * Garante que qualquer registro na coleção 'accounts' contenha os campos canônicos
 * sem quebrar a compatibilidade com dados legados existentes.
 */

export interface CanonicalAccount {
  // Identificação
  uid: string;
  id: string;
  email: string;
  nome: string;
  name: string;
  empresa: string;
  telefone: string;
  senha?: string;

  // Plano e Valores
  plano: string;
  planoNome: string;
  valorPlano: number;
  valorMensalidade: number;
  mensalidade: number;

  // Datas
  dataCriacao: string;
  createdAt: string;
  dataVencimento: string;
  vencimento: string;

  // Status e Bloqueio
  status: 'ativo' | 'bloqueado' | 'vencido';
  bloqueado: boolean;
  blocked: boolean;
  ativo: boolean;
  active: boolean;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusReason?: string;

  // Financeiro
  situacaoPagamento: 'em_dia' | 'pendente' | 'atrasado';
  ultimoPagamento?: {
    data: string;
    valor: number;
    forma: string;
  };
  payments?: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    notes?: string;
  }>;

  // Demais propriedades legadas preservadas
  [key: string]: any;
}

/**
 * Normaliza qualquer documento existente do Firestore para o modelo canônico.
 */
export function normalizeAccountData(id: string, rawData: any): CanonicalAccount {
  const data = rawData || {};

  // E-mail limpo em minúsculas
  const email = (data.email || data.userEmail || data.login || data.loginUsuario || id || '').trim().toLowerCase();

  // UID consistente: usa o existente ou o ID do documento
  const uid = data.uid || data.userId || data.id || id || email;

  // Nome e Empresa
  const nome = data.nome || data.name || data.responsavel || data.empresa || data.storeName || 'Cliente';
  const empresa = data.empresa || data.nomeEmpresa || data.nomeFantasia || data.razaoSocial || data.storeName || nome;
  const telefone = data.telefone || data.phone || data.celular || data.whatsapp || '';

  // Plano e Valor
  const plano = data.plano || data.plan || data.tipoPlano || data.planoId || 'COMPLETO_50';
  const planoNome = data.planoNome || data.planName || (plano === 'TRIAL' ? 'Plano Teste Grátis' : 'Plano Completo');
  const valorPlano = Number(
    data.valorPlano ??
    data.valorMensalidade ??
    data.mensalidade ??
    data.valor ??
    data.amount ??
    data.preco ??
    data.price ??
    0
  );

  // Datas
  const nowIso = new Date().toISOString();
  const dataCriacao = data.dataCriacao || data.createdAt || data.dataCadastro || nowIso;
  
  // Se não houver data de vencimento, define 30 dias a partir de hoje
  let dataVencimento = data.dataVencimento || data.vencimento || data.dueDate || '';
  if (!dataVencimento) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    dataVencimento = futureDate.toISOString().split('T')[0];
  }

  // Status e Bloqueio
  const isBlocked = Boolean(
    data.bloqueado === true ||
    data.blocked === true ||
    data.status === 'bloqueado' ||
    data.situacao === 'bloqueado' ||
    data.userStatus === 'bloqueado'
  );

  // Cálculo de vencimento para determinar status se não estiver bloqueado
  let calculatedStatus: 'ativo' | 'bloqueado' | 'vencido' = 'ativo';
  if (isBlocked) {
    calculatedStatus = 'bloqueado';
  } else {
    try {
      const exp = new Date(dataVencimento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp.getTime() < today.getTime()) {
        calculatedStatus = 'vencido';
      }
    } catch {
      calculatedStatus = 'ativo';
    }
  }

  const status = isBlocked ? 'bloqueado' : (data.status || calculatedStatus);
  const situacaoPagamento = data.situacaoPagamento || (status === 'vencido' ? 'atrasado' : 'em_dia');

  return {
    ...data,
    // Identificação Canônica
    uid,
    id: id || uid,
    email,
    nome,
    name: nome,
    empresa,
    telefone,

    // Plano Canônico
    plano,
    planoNome,
    valorPlano,
    valorMensalidade: valorPlano,
    mensalidade: valorPlano,

    // Datas Canônicas
    dataCriacao,
    createdAt: dataCriacao,
    dataVencimento,
    vencimento: dataVencimento,

    // Status Canônico
    status,
    bloqueado: isBlocked,
    blocked: isBlocked,
    ativo: !isBlocked && status !== 'vencido',
    active: !isBlocked && status !== 'vencido',
    statusUpdatedAt: data.statusUpdatedAt || data.updatedAt,
    statusUpdatedBy: data.statusUpdatedBy || 'admin',
    statusReason: data.statusReason,

    // Financeiro Canônico
    situacaoPagamento,
    payments: Array.isArray(data.payments) ? data.payments : []
  };
}

/**
 * Prepara o payload para ser salvo no Firestore sem perder os campos esperados
 * por diferentes partes do Gestor.
 */
export function prepareAccountForSave(account: Partial<CanonicalAccount>): Record<string, any> {
  const normalized = normalizeAccountData(account.id || account.uid || account.email || '', account);

  return {
    ...account, // preserva campos adicionais pré-existentes
    uid: normalized.uid,
    id: normalized.id,
    email: normalized.email,
    userEmail: normalized.email,
    login: normalized.email,
    loginUsuario: normalized.email,
    nome: normalized.nome,
    name: normalized.nome,
    responsavel: normalized.nome,
    empresa: normalized.empresa,
    nomeEmpresa: normalized.empresa,
    nomeFantasia: normalized.empresa,
    telefone: normalized.telefone,
    phone: normalized.telefone,
    whatsapp: normalized.telefone,

    plano: normalized.plano,
    planoId: normalized.plano,
    planoNome: normalized.planoNome,
    planName: normalized.planoNome,
    valorPlano: normalized.valorPlano,
    valorMensalidade: normalized.valorPlano,
    mensalidade: normalized.valorPlano,
    amount: normalized.valorPlano,

    dataCriacao: normalized.dataCriacao,
    createdAt: normalized.dataCriacao,
    dataVencimento: normalized.dataVencimento,
    vencimento: normalized.dataVencimento,

    status: normalized.status,
    bloqueado: normalized.bloqueado,
    blocked: normalized.bloqueado,
    ativo: normalized.ativo,
    active: normalized.active,
    statusUpdatedAt: account.statusUpdatedAt || normalized.statusUpdatedAt || new Date().toISOString(),
    statusUpdatedBy: account.statusUpdatedBy || normalized.statusUpdatedBy || 'admin',
    statusReason: account.statusReason || normalized.statusReason || '',

    situacaoPagamento: normalized.situacaoPagamento,
    payments: normalized.payments || [],
    updatedAt: new Date().toISOString()
  };
}
