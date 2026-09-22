import { AdminBackendService, CreateUserInput } from './adminBackendService';

export interface CreateUserData {
  nome: string;
  empresa: string;
  email: string;
  password: string;
  telefone?: string;
  planoId: string;
  planoNome: string;
  valorPlano: number;
  dataVencimento: string;
  bloqueado?: boolean;
}

export interface CreatedUserResult {
  uid: string;
  nome: string;
  email: string;
  empresa: string;
  planoNome: string;
  valorPlano: number;
  dataVencimento: string;
  status: string;
  createdAt: string;
}

export const AdminAuthService = {
  /**
   * Cria o usuário no Firebase Authentication e no Firestore através do endpoint seguro
   * do backend com Firebase Admin SDK.
   */
  async adminCreateUser(data: CreateUserData): Promise<CreatedUserResult> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanNome = data.nome.trim();
    const cleanEmpresa = data.empresa.trim() || cleanNome;
    const cleanPhone = data.telefone?.trim() || '';

    if (!cleanNome) {
      throw new Error('O nome do usuário/responsável é obrigatório.');
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Informe um endereço de e-mail válido.');
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('A senha inicial deve ter no mínimo 6 caracteres.');
    }

    const payload: CreateUserInput = {
      nome: cleanNome,
      empresa: cleanEmpresa,
      email: cleanEmail,
      password: data.password,
      telefone: cleanPhone,
      planoId: data.planoId,
      planoNome: data.planoNome,
      valorPlano: Number(data.valorPlano || 0),
      dataVencimento: data.dataVencimento,
      bloqueado: Boolean(data.bloqueado),
    };

    const result = await AdminBackendService.createUser(payload);
    return result;
  },
};

