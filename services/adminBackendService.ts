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
   * Helper function to safely read and parse HTTP responses as JSON.
   */
  async parseSafeResponse<T = any>(
    response: Response,
    fallbackErrorMessage = 'Erro na comunicação com o servidor'
  ): Promise<{ ok: boolean; status: number; data: T }> {
    let rawText = '';
    try {
      rawText = await response.text();
    } catch (readErr: any) {
      console.error('[AdminBackendService] Erro ao ler corpo da resposta HTTP:', readErr);
      throw new Error(`${fallbackErrorMessage} (não foi possível ler a resposta do servidor).`);
    }

    let parsedData: any = null;
    if (rawText && rawText.trim().length > 0) {
      const trimmed = rawText.trim();
      if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
        console.error('[AdminBackendService] Servidor retornou HTML em vez de JSON:', {
          status: response.status,
          contentType: response.headers.get('content-type'),
          preview: rawText.slice(0, 200),
        });
        throw new Error('O servidor de API retornou uma página HTML em vez de JSON. Verifique a implantação da rota no Vercel.');
      }

      try {
        parsedData = JSON.parse(rawText);
      } catch (jsonErr: any) {
        console.error('[AdminBackendService] Resposta não-JSON recebida:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          preview: rawText.slice(0, 300),
          parseError: jsonErr?.message,
        });

        if (response.status === 400) {
          throw new Error('Requisição inválida (HTTP 400).');
        }
        if (response.status === 401) {
          throw new Error('Senha ou credencial administrativa inválida (HTTP 401).');
        }
        if (response.status === 403) {
          throw new Error('Acesso restrito a administradores autorizados (HTTP 403).');
        }
        if (response.status === 404) {
          throw new Error('Endpoint administrativo não encontrado no servidor (HTTP 404).');
        }
        if (response.status === 405) {
          throw new Error('Método HTTP não permitido pelo servidor (HTTP 405).');
        }
        if (response.status >= 500) {
          throw new Error('Erro interno no servidor administrativo (HTTP 500).');
        }
        throw new Error(`Resposta inválida retornada pelo servidor (HTTP ${response.status}).`);
      }
    } else {
      // Empty response body
      parsedData = {};
    }

    if (!response.ok) {
      let rawMsg = parsedData?.message || parsedData?.error;
      let serverMessage = '';

      if (typeof rawMsg === 'string') {
        serverMessage = rawMsg;
      } else if (rawMsg && typeof rawMsg === 'object') {
        serverMessage = rawMsg.message || rawMsg.error || rawMsg.code || JSON.stringify(rawMsg);
      }

      if (!serverMessage || serverMessage === '[object Object]') {
        switch (response.status) {
          case 400:
            serverMessage = 'Requisição inválida. Verifique os dados enviados.';
            break;
          case 401:
            serverMessage = 'Senha inválida ou sessão expirada.';
            break;
          case 403:
            serverMessage = 'Acesso administrativo não autorizado.';
            break;
          case 404:
            serverMessage = 'Endpoint de administração não encontrado (HTTP 404).';
            break;
          case 405:
            serverMessage = 'Método de requisição não suportado pelo servidor (HTTP 405).';
            break;
          case 500:
          default:
            serverMessage = `${fallbackErrorMessage} (HTTP ${response.status})`;
            break;
        }
      }
      console.warn('[AdminBackendService] Resposta com erro da API:', {
        status: response.status,
        message: serverMessage,
      });
      throw new Error(serverMessage);
    }

    return { ok: true, status: response.status, data: parsedData as T };
  },

  /**
   * Helper to perform authenticated admin requests.
   */
  request: async function<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = AdminBackendService.getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('x-admin-token', token);
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      console.error(`[AdminBackendService] Erro de rede ao conectar em ${endpoint}:`, networkErr);
      throw new Error(`Falha de conexão com o servidor (${networkErr.message || 'Verifique sua conexão de internet'}).`);
    }

    if (response.status === 401) {
      AdminBackendService.clearToken();
      let errorMsg = 'Sessão de Administrador expirada ou inválida. Por favor, autentique-se novamente.';
      try {
        const text = await response.text();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed?.message || parsed?.error) {
            errorMsg = parsed.message || parsed.error;
          }
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const { data } = await AdminBackendService.parseSafeResponse<T>(
      response,
      `Erro ao processar requisição em ${endpoint}`
    );
    return data;
  },

  /**
   * Authenticates Master Admin via backend password verification.
   */
  async login(password: string): Promise<{ success: boolean; token: string; message?: string }> {
    if (!password || typeof password !== 'string' || !password.trim()) {
      throw new Error('Por favor, informe a senha de administrador.');
    }

    const cleanPassword = password.trim();

    let response: Response | null = null;
    let lastError: Error | null = null;

    // 1. Primary Attempt: Standard POST request with JSON payload
    try {
      response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-master-password': cleanPassword,
        },
        body: JSON.stringify({ password: cleanPassword }),
      });
    } catch (networkErr: any) {
      console.warn('[AdminBackendService] Falha no POST primário de login:', networkErr);
      lastError = networkErr;
    }

    // 2. Fallback Attempt: If 405 Method Not Allowed was received from intermediate proxy, retry via GET
    if (response && response.status === 405) {
      console.warn('[AdminBackendService] Recebido HTTP 405 no POST, executando fallback compatível...');
      try {
        response = await fetch(`/api/admin/auth/login?password=${encodeURIComponent(cleanPassword)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'x-master-password': cleanPassword,
          },
        });
      } catch (getErr: any) {
        console.error('[AdminBackendService] Erro no fallback GET:', getErr);
      }
    }

    if (!response) {
      throw new Error(`Falha de conexão com o servidor (${lastError?.message || 'servidor indisponível'}).`);
    }

    const { data } = await AdminBackendService.parseSafeResponse<{
      success: boolean;
      token?: string;
      message?: string;
      error?: string;
    }>(response, 'Falha na autenticação do Administrador Master');

    if (!data.success || !data.token) {
      const errorMsg = data.message || data.error || 'Senha de Administrador Master incorreta.';
      throw new Error(errorMsg);
    }

    AdminBackendService.setToken(data.token);
    return {
      success: true,
      token: data.token,
      message: data.message || 'Autenticação realizada com sucesso',
    };
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
    password?: string;
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
   * Purges all non-super-admin users from database and leaves only Super Admin.
   */
  async purgeNonAdmins(): Promise<{ success: boolean; deletedDocsCount: number; deletedAuthCount: number; kept: string[] }> {
    return AdminBackendService.request('/api/admin/purge-non-admins', {
      method: 'POST',
      body: JSON.stringify({}),
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
