import { CanonicalAccount } from './accountSchema';

const ADMIN_TOKEN_STORAGE_KEY = 'msp_master_admin_token_v1';

export interface AdminUserRecord {
  id: string;
  uid?: string;
  email: string;
  nome?: string;
  name?: string;
  empresa?: string;
  telefone?: string;
  phone?: string;
  plano?: string;
  planoId?: string;
  planoNome?: string;
  valorPlano?: number;
  valorMensalidade?: number;
  dataVencimento?: string;
  vencimento?: string;
  status?: string;
  bloqueado?: boolean;
  blocked?: boolean;
  ativo?: boolean;
  active?: boolean;
  situacaoPagamento?: string;
  [key: string]: any;
}

export interface CreateUserInput {
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

export interface AuditLogItem {
  id: string;
  action: string;
  targetId: string;
  performedBy: string;
  timestamp: string;
  details?: Record<string, any>;
}

export const AdminBackendService = {
  /**
   * Retrieves the stored admin session token.
   */
  getToken(): string | null {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Saves the admin session token.
   */
  setToken(token: string): void {
    try {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } catch {}
  },

  /**
   * Clears the admin session token on logout.
   */
  clearToken(): void {
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {}
  },

  /**
   * Helper to perform authenticated admin requests.
   */
  request: async function<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = AdminBackendService.getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        AdminBackendService.clearToken();
        throw new Error(data.error || 'Sessão de Administrador expirada ou inválida. Por favor, autentique-se novamente.');
      }
      throw new Error(data.error || `Erro na requisição administrativa (${response.status})`);
    }

    return data as T;
  },

  /**
   * Authenticates Master Admin via backend password verification.
   */
  async login(password: string): Promise<{ success: boolean; token: string }> {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Senha de administrador incorreta.');
    }

    AdminBackendService.setToken(data.token);
    return data;
  },

  /**
   * Verifies if current session is authenticated as admin.
   */
  async verifySession(): Promise<boolean> {
    const token = AdminBackendService.getToken();
    if (!token) return false;
    try {
      const res = await AdminBackendService.request<{ success: boolean; valid: boolean }>('/api/admin/auth/verify', {
        method: 'GET',
      });
      return Boolean(res.valid);
    } catch {
      return false;
    }
  },

  /**
   * Lists all accounts from Firestore via secure backend.
   */
  async listUsers(): Promise<AdminUserRecord[]> {
    const res = await AdminBackendService.request<{ success: boolean; users: AdminUserRecord[] }>('/api/admin/users', {
      method: 'GET',
    });
    return res.users || [];
  },

  /**
   * Creates user in Firebase Auth and Firestore via secure backend.
   */
  async createUser(input: CreateUserInput): Promise<any> {
    const res = await AdminBackendService.request<{ success: boolean; user: any }>('/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.user;
  },

  /**
   * Blocks or Unblocks user in both Firestore and Firebase Auth.
   */
  async toggleBlock(params: { uid?: string; email?: string; docId?: string; block: boolean; reason?: string }): Promise<any> {
    return AdminBackendService.request('/api/admin/toggle-block', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Changes user plan in Firestore via secure backend.
   */
  async changePlan(params: {
    docId?: string;
    uid?: string;
    email?: string;
    planoId: string;
    planoNome: string;
    valorPlano: number;
    dataVencimento?: string;
  }): Promise<any> {
    return AdminBackendService.request('/api/admin/change-plan', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Updates allowed client fields in Firestore via secure backend.
   */
  async updateUser(params: {
    docId?: string;
    uid?: string;
    email?: string;
    nome?: string;
    empresa?: string;
    telefone?: string;
    dataVencimento?: string;
    valorPlano?: number;
    status?: string;
    planoId?: string;
    planoNome?: string;
  }): Promise<any> {
    return AdminBackendService.request('/api/admin/update-user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Permanently deletes user from Firebase Auth and Firestore via secure backend.
   */
  async deleteUser(params: { uid?: string; email?: string; docId?: string }): Promise<any> {
    return AdminBackendService.request('/api/admin/delete-user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Gets audit logs from secure backend.
   */
  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await AdminBackendService.request<{ success: boolean; logs: AuditLogItem[] }>('/api/admin/audit-logs', {
      method: 'GET',
    });
    return res.logs || [];
  },
};
