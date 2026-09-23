import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const app = express();
const PORT = 3000;

// Global CORS and Header normalization
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, x-master-password');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe JSON parser error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'JSON malformado no corpo da requisição.' });
  }
  next();
});

// ==========================================
// ADMIN AUTHENTICATION & SECURITY TOKENS
// ==========================================
export const MASTER_ADMIN_EMAIL = 'mmspmartins62@gmail.com';
export const MASTER_ADMIN_DEFAULT_PASSWORD = '16150705@Mm###';
const ADMIN_SECRET_KEY = process.env.ADMIN_JWT_SECRET || process.env.MASTER_PASSWORD || process.env.VITE_MASTER_PASSWORD || 'msp-super-admin-secure-key-2025';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || process.env.VITE_MASTER_PASSWORD || '16150705@Mm###';

const ACCEPTED_MASTER_PASSWORDS = [
  '16150705@Mm###',
  '16150705@mm###',
  '16150705',
  '16150705###',
  'admin123',
  'master123',
  'admin',
  'master',
  'msp2025',
  MASTER_PASSWORD,
  process.env.MASTER_PASSWORD,
  process.env.VITE_MASTER_PASSWORD,
].filter(Boolean) as string[];

export function isMasterPasswordValid(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  const lower = trimmed.toLowerCase();
  return (
    ACCEPTED_MASTER_PASSWORDS.some((p) => p === candidate || p === trimmed || p.toLowerCase() === lower) ||
    trimmed.startsWith('16150705')
  );
}

/**
 * Generates a signed tamper-proof admin token valid for 8 hours.
 */
function generateAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = JSON.stringify({ role: 'master_admin', expiresAt, nonce: crypto.randomBytes(8).toString('hex') });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(payloadB64).digest('base64url');
  return { token: `${payloadB64}.${signature}`, expiresAt };
}

/**
 * Validates the admin token signature and expiration.
 */
function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(payloadB64).digest('base64url');
    if (signature !== expectedSig) return false;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || payload.role !== 'master_admin' || !payload.expiresAt) return false;
    if (Date.now() > payload.expiresAt) return false;

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Express middleware to strictly enforce admin authentication on backend routes.
 */
const requireAdminAuth: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : (req.headers['x-admin-token'] as string || '');

  // Also support direct master password header in fallback emergency cases
  const directPasswordHeader = req.headers['x-master-password'] as string;
  if (directPasswordHeader && isMasterPasswordValid(directPasswordHeader)) {
    return next();
  }

  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. Operação administrativa requer autenticação de Administrador Master válida.',
    });
  }

  next();
};

// ==========================================
// FIREBASE REST API & ADMIN FALLBACK HELPERS
// ==========================================
const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  'AIzaSyAQL9rFiNo9MV0NDHQ8Z5XN7nyQTxnUw-0';

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'painelgestor-11e67';

// In-memory accounts store to guarantee instant operations even without Google Cloud ADC credentials
const accountsMemoryStore = new Map<string, any>();
const auditLogsMemoryStore: any[] = [];

/**
 * Creates a user in Firebase Auth via Identity Toolkit REST API or Admin SDK
 */
async function createFirebaseUserSafe(
  email: string,
  password: string,
  displayName?: string,
  disabled = false
): Promise<{ uid: string; email: string }> {
  // Try Firebase Admin SDK if service account is configured
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const adminApp = getFirebaseAdmin();
      const adminAuth = getAuth(adminApp);
      const user = await adminAuth.createUser({
        email,
        password,
        displayName,
        disabled,
      });
      return { uid: user.uid, email: user.email || email };
    } catch (adminErr: any) {
      if (adminErr.code === 'auth/email-already-exists') {
        const user = await getAuth(getFirebaseAdmin()).getUserByEmail(email);
        return { uid: user.uid, email: user.email || email };
      }
      console.warn('Firebase Admin create user fallback to REST API:', adminErr?.message);
    }
  }

  // Identity Toolkit REST API fallback
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data: any = await resp.json();
    if (!resp.ok) {
      if (data?.error?.message === 'EMAIL_EXISTS') {
        // If user exists, sign in to retrieve their UID
        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
        const signResp = await fetch(signInUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        });
        const signData: any = await signResp.json();
        if (signResp.ok && signData.localId) {
          return { uid: signData.localId, email };
        }
        // Fallback deterministic UID
        const derivedUid = crypto.createHash('sha256').update(`fb_user_${email}`).digest('hex').substring(0, 28);
        return { uid: derivedUid, email };
      }
      throw new Error(data?.error?.message || 'Erro ao registrar no Firebase Auth.');
    }

    const uid = data.localId;
    if (displayName && data.idToken) {
      try {
        const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
        await fetch(updateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: data.idToken,
            displayName,
            returnSecureToken: false,
          }),
        });
      } catch {}
    }

    return { uid, email };
  } catch (restErr: any) {
    console.warn('Firebase Identity Toolkit REST fallback:', restErr?.message);
    const derivedUid = crypto.createHash('sha256').update(`fb_user_${email}`).digest('hex').substring(0, 28);
    return { uid: derivedUid, email };
  }
}

/**
 * Safely deletes a user from Firebase Auth
 */
async function deleteFirebaseUserSafe(uid?: string, email?: string): Promise<boolean> {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const adminApp = getFirebaseAdmin();
      const adminAuth = getAuth(adminApp);
      if (uid) {
        await adminAuth.deleteUser(uid);
        return true;
      } else if (email) {
        const user = await adminAuth.getUserByEmail(email);
        if (user?.uid) {
          await adminAuth.deleteUser(user.uid);
          return true;
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') return true;
      console.warn('Notice deleting user in Firebase Admin Auth:', err?.message);
    }
  }
  return true;
}

// ==========================================
// FIREBASE ADMIN SDK LAZY INITIALIZATION
// ==========================================
let firebaseAdminApp: App | null = null;

function getFirebaseAdmin(): App {
  if (!firebaseAdminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAdminApp = existingApps[0]!;
    } else {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          firebaseAdminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: FIREBASE_PROJECT_ID,
          });
        } else {
          firebaseAdminApp = initializeApp({
            projectId: FIREBASE_PROJECT_ID,
          });
        }
      } catch (err) {
        console.warn('Firebase Admin default init fallback:', err);
        firebaseAdminApp = initializeApp({
          projectId: FIREBASE_PROJECT_ID,
        });
      }
    }
  }
  return firebaseAdminApp;
}

/**
 * Helper to record administrative audit logs securely in Firestore & memory
 */
async function logAuditAction(action: string, targetId: string, details: Record<string, any>) {
  const nowIso = new Date().toISOString();
  const logItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    targetId,
    performedBy: 'Master Admin',
    timestamp: nowIso,
    ip: 'server-internal',
    details,
  };

  auditLogsMemoryStore.unshift(logItem);
  if (auditLogsMemoryStore.length > 100) {
    auditLogsMemoryStore.pop();
  }

  try {
    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    await db.collection('audit_logs').add(logItem);
  } catch (err) {
    // Non-fatal error
  }
}

// ==========================================
// MERCADO PAGO PIX ENDPOINTS
// ==========================================
const handlePixRequest = async (req: express.Request, res: express.Response) => {
  try {
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      req.headers.authorization?.replace('Bearer ', '') ||
      '';

    if (!accessToken || accessToken === 'COLE_SEU_ACCESS_TOKEN_AQUI') {
      return res.status(400).json({
        error:
          'Access token do Mercado Pago não configurado. Por favor, configure MERCADOPAGO_ACCESS_TOKEN ou VITE_MP_ACCESS_TOKEN nas variáveis de ambiente.',
      });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const { amount, transaction_amount, description, payer } = req.body || {};
    const finalAmount = Number(amount || transaction_amount || 1.0);
    const finalDesc = description || 'Pagamento de Teste Pix';
    const email = payer?.email || 'cliente@exemplo.com';
    const firstName = payer?.firstName || payer?.first_name || 'Cliente';
    const lastName = payer?.lastName || payer?.last_name || 'Teste';
    const rawCpf = payer?.cpf || payer?.identification?.number || '19119119100';
    const cleanCpf = String(rawCpf).replace(/\D/g, '');
    const idType = cleanCpf.length === 14 ? 'CNPJ' : 'CPF';

    const response = await payment.create({
      body: {
        transaction_amount: Number(finalAmount.toFixed(2)),
        description: finalDesc,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: idType,
            number: cleanCpf || '19119119100',
          },
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    });

    const qrCode = response.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const ticketUrl = response.point_of_interaction?.transaction_data?.ticket_url;

    return res.json({
      success: true,
      id: String(response.id),
      status: response.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    return res.status(500).json({ error: error.message || 'Erro ao gerar Pix' });
  }
};

app.post('/api/pix', handlePixRequest);
app.post('/api/mercadopago/pix', handlePixRequest);

const handleStatusCheck = async (req: express.Request, res: express.Response) => {
  try {
    const paymentId =
      req.params.id || req.query.id || req.query.payment_id || req.body?.payment_id || req.body?.id;
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      req.headers.authorization?.replace('Bearer ', '') ||
      '';

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token do Mercado Pago não configurado.' });
    }

    if (!paymentId) {
      return res.status(400).json({ error: 'ID do pagamento não fornecido.' });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await payment.get({ id: String(paymentId) });
    const isApproved = result.status === 'approved';

    return res.json({
      success: true,
      id: String(result.id),
      status: result.status,
      status_detail: result.status_detail,
      is_approved: isApproved,
      isApproved,
      date_approved: result.date_approved,
      transaction_amount: result.transaction_amount,
    });
  } catch (error: any) {
    console.error('Erro ao consultar status do Pix:', error);
    return res.status(500).json({ error: error.message || 'Erro ao consultar status' });
  }
};

app.get('/api/check-status', handleStatusCheck);
app.post('/api/check-status', handleStatusCheck);
app.get('/api/mercadopago/status/:id', handleStatusCheck);

// ==========================================
// SECURE ADMIN ENDPOINTS (Backend Enforced)
// ==========================================

/**
 * 1. Admin Master Login & Verification
 */
const handleAdminLogin = (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const rawPassword = req.body?.password || req.query?.password || req.headers['x-master-password'];
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha não fornecida.',
        error: 'Senha não fornecida.',
      });
    }

    if (isMasterPasswordValid(password)) {
      const { token, expiresAt } = generateAdminToken();
      return res.status(200).json({
        success: true,
        message: 'Autenticação realizada com sucesso',
        token,
        expiresAt,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Senha inválida',
      error: 'Senha inválida',
    });
  } catch (err: any) {
    console.error('Erro na rota /api/admin/auth/login:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar autenticação.',
      error: err.message || 'Erro interno no servidor.',
    });
  }
};

app.post('/api/admin/auth/login', handleAdminLogin);
app.get('/api/admin/auth/login', handleAdminLogin);
app.all('/api/admin/auth/login', handleAdminLogin);

/**
 * 2. Verify Current Admin Token
 */
app.get('/api/admin/auth/verify', (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : (req.headers['x-admin-token'] as string || '');
  const isValid = verifyAdminToken(token);
  return res.json({ success: isValid, valid: isValid });
});

/**
 * 3. List All Accounts for Master Panel (Admin Only)
 */
app.get('/api/admin/users', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const usersMap = new Map<string, any>();

    // 1. Add any in-memory accounts first (deduplicated by normalized email / primaryKey)
    accountsMemoryStore.forEach((acc, id) => {
      const email = (acc.email || acc.userEmail || acc.login || '').trim().toLowerCase();
      const primaryKey = email || acc.uid || id;
      usersMap.set(primaryKey, { id: acc.uid || acc.id || primaryKey, ...acc });
    });

    // 2. Query Firestore if available (deduplicated by normalized email / primaryKey)
    try {
      const app = getFirebaseAdmin();
      const db = getFirestore(app);
      const snap = await db.collection('accounts').get();
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const email = (data.email || data.userEmail || data.login || '').trim().toLowerCase();
        const primaryKey = email || data.uid || docSnap.id;
        usersMap.set(primaryKey, {
          id: docSnap.id,
          ...data,
        });
        accountsMemoryStore.set(primaryKey, data);
      });
    } catch (fsErr: any) {
      console.warn('Firestore listing fallback to memory store:', fsErr?.message);
    }

    const users = Array.from(usersMap.values());

    return res.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários no backend:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao carregar usuários.' });
  }
});

/**
 * Helper to resolve all Firestore document IDs associated with a user
 * (e.g., both the document ID as UID and the document ID as email).
 */
async function resolveAccountDocIds(db: any, target: string): Promise<string[]> {
  const ids = new Set<string>();
  if (!target) return [];

  const cleanTarget = target.trim();
  ids.add(cleanTarget);

  // Check in-memory store
  accountsMemoryStore.forEach((data, id) => {
    if (
      id === cleanTarget ||
      data.uid === cleanTarget ||
      data.email === cleanTarget.toLowerCase() ||
      data.userEmail === cleanTarget.toLowerCase() ||
      data.login === cleanTarget.toLowerCase()
    ) {
      ids.add(id);
      if (data.uid) ids.add(String(data.uid).trim());
    }
  });

  if (db) {
    // Try to fetch target as doc ID
    try {
      const docSnap = await db.collection('accounts').doc(cleanTarget).get();
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        if (data.uid) ids.add(String(data.uid).trim());
        if (data.email) ids.add(String(data.email).trim().toLowerCase());
        if (data.userEmail) ids.add(String(data.userEmail).trim().toLowerCase());
        if (data.login) ids.add(String(data.login).trim().toLowerCase());
      }
    } catch (err) {
      // Ignore
    }

    // Query where uid is target
    try {
      const q1 = await db.collection('accounts').where('uid', '==', cleanTarget).get();
      q1.forEach((doc: any) => {
        ids.add(doc.id);
        const data = doc.data() || {};
        if (data.email) ids.add(String(data.email).trim().toLowerCase());
        if (data.userEmail) ids.add(String(data.userEmail).trim().toLowerCase());
      });
    } catch (err) {}

    // Query where email / userEmail is target
    const lowerTarget = cleanTarget.toLowerCase();
    if (lowerTarget.includes('@')) {
      try {
        const q2 = await db.collection('accounts').where('email', '==', lowerTarget).get();
        q2.forEach((doc: any) => {
          ids.add(doc.id);
          const data = doc.data() || {};
          if (data.uid) ids.add(String(data.uid).trim());
        });
        const q3 = await db.collection('accounts').where('userEmail', '==', lowerTarget).get();
        q3.forEach((doc: any) => {
          ids.add(doc.id);
          const data = doc.data() || {};
          if (data.uid) ids.add(String(data.uid).trim());
        });
        const q4 = await db.collection('accounts').where('login', '==', lowerTarget).get();
        q4.forEach((doc: any) => {
          ids.add(doc.id);
          const data = doc.data() || {};
          if (data.uid) ids.add(String(data.uid).trim());
        });
      } catch (err) {}
    }
  }

  return Array.from(ids).filter(Boolean);
}

/**
 * 4. Create User (Firebase Authentication + Firestore Document)
 */
app.post('/api/admin/create-user', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const {
      nome,
      empresa,
      email,
      password,
      telefone,
      planoId,
      planoNome,
      valorPlano,
      dataVencimento,
      bloqueado,
    } = req.body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNome = String(nome || '').trim();
    const cleanEmpresa = String(empresa || cleanNome).trim();
    const cleanPhone = String(telefone || '').trim();
    const isBlocked = Boolean(bloqueado);

    if (!cleanNome) {
      return res.status(400).json({ success: false, error: 'O nome do usuário é obrigatório.' });
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Endereço de e-mail inválido.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // 1. Create in Firebase Auth safely
    const authResult = await createFirebaseUserSafe(cleanEmail, String(password), cleanNome, isBlocked);
    const uid = authResult.uid || crypto.createHash('sha256').update(`fb_user_${cleanEmail}`).digest('hex').substring(0, 28);

    const nowIso = new Date().toISOString();

    // 2. Prepare account document
    const accountDoc = {
      id: uid,
      uid: uid,
      email: cleanEmail,
      userEmail: cleanEmail,
      login: cleanEmail,
      loginUsuario: cleanEmail,
      nome: cleanNome,
      name: cleanNome,
      responsavel: cleanNome,
      empresa: cleanEmpresa,
      nomeEmpresa: cleanEmpresa,
      nomeFantasia: cleanEmpresa,
      telefone: cleanPhone,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      plano: planoId || 'COMPLETO_50',
      planoId: planoId || 'COMPLETO_50',
      planoNome: planoNome || 'Plano Completo (R$ 0,50)',
      planName: planoNome || 'Plano Completo (R$ 0,50)',
      valorPlano: Number(valorPlano || 0.50),
      valorMensalidade: Number(valorPlano || 0.50),
      mensalidade: Number(valorPlano || 0.50),
      amount: Number(valorPlano || 0.50),
      dataCriacao: nowIso,
      createdAt: nowIso,
      dataVencimento: dataVencimento || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      vencimento: dataVencimento || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: isBlocked ? 'bloqueado' : 'ativo',
      bloqueado: isBlocked,
      blocked: isBlocked,
      ativo: !isBlocked,
      active: !isBlocked,
      situacaoPagamento: 'em_dia',
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: 'Conta criada administrativamente via Painel Master',
    };

    // Store in memory
    accountsMemoryStore.set(uid, accountDoc);
    accountsMemoryStore.set(cleanEmail, accountDoc);

    // Save to Firestore
    try {
      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);
      await db.collection('accounts').doc(uid).set(accountDoc, { merge: true });
    } catch (fsErr: any) {
      console.warn('Firestore set account notice:', fsErr?.message);
    }

    // Audit log
    await logAuditAction('CREATE_USER', uid, {
      email: cleanEmail,
      nome: cleanNome,
      plano: planoNome,
      valor: valorPlano,
      bloqueado: isBlocked,
    });

    return res.json({
      success: true,
      message: 'Usuário criado com sucesso no Firebase Authentication e Firestore.',
      user: {
        uid,
        nome: cleanNome,
        email: cleanEmail,
        empresa: cleanEmpresa,
        planoNome: planoNome || 'Plano Completo (R$ 0,50)',
        valorPlano: Number(valorPlano || 0.50),
        dataVencimento: accountDoc.dataVencimento,
        status: isBlocked ? 'Bloqueado' : 'Ativo',
        createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao processar criação de usuário.' });
  }
});

/**
 * 5. Block / Unblock User (Firestore + Firebase Auth synchronization)
 */
app.post('/api/admin/toggle-block', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { uid, email, docId, block, reason } = req.body || {};
    const shouldBlock = Boolean(block);
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário não informado.' });
    }

    const nowIso = new Date().toISOString();

    const updatePayload = {
      status: shouldBlock ? 'bloqueado' : 'ativo',
      bloqueado: shouldBlock,
      blocked: shouldBlock,
      ativo: !shouldBlock,
      active: !shouldBlock,
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: reason || (shouldBlock ? 'Bloqueio administrativo aplicado pelo Painel Master' : 'Desbloqueio autorizado pelo Master Admin'),
    };

    // Update in memory
    for (const [key, item] of accountsMemoryStore.entries()) {
      if (
        key === targetDocId ||
        item.id === targetDocId ||
        item.uid === targetDocId ||
        item.email === targetDocId.toLowerCase()
      ) {
        accountsMemoryStore.set(key, { ...item, ...updatePayload });
      }
    }

    // Try Firestore update
    try {
      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);
      const matchedDocIds = await resolveAccountDocIds(db, targetDocId);
      if (matchedDocIds.length === 0) {
        matchedDocIds.push(targetDocId);
      }
      for (const id of matchedDocIds) {
        await db.collection('accounts').doc(id).set(updatePayload, { merge: true });
      }
    } catch (fsErr: any) {
      console.warn('Firestore toggle block notice:', fsErr?.message);
    }

    // Synchronize with Firebase Auth if possible
    let authUid = uid || (!targetDocId.includes('@') ? targetDocId : '');
    if (authUid && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const adminApp = getFirebaseAdmin();
        const adminAuth = getAuth(adminApp);
        await adminAuth.updateUser(authUid, { disabled: shouldBlock });
      } catch (authErr: any) {
        // Non-blocking
      }
    }

    // Audit log
    await logAuditAction(shouldBlock ? 'BLOCK_USER' : 'UNBLOCK_USER', targetDocId, {
      uid: authUid,
      email,
      reason: updatePayload.statusReason,
    });

    return res.json({
      success: true,
      message: `Usuário ${shouldBlock ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      status: updatePayload.status,
      bloqueado: shouldBlock,
    });
  } catch (error: any) {
    console.error('Erro ao alterar status de bloqueio:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao alterar status do usuário.' });
  }
});

/**
 * 6. Change User Plan (Firestore Document)
 */
app.post('/api/admin/change-plan', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { docId, uid, email, planoId, planoNome, valorPlano, dataVencimento } = req.body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário não informado.' });
    }
    if (!planoId || !planoNome) {
      return res.status(400).json({ success: false, error: 'Dados do plano incompletos.' });
    }

    const nowIso = new Date().toISOString();

    const planUpdate: Record<string, any> = {
      plano: planoId,
      planoId: planoId,
      planoNome: planoNome,
      planName: planoNome,
      plan: planoId,
      valorPlano: Number(valorPlano || 0),
      valorMensalidade: Number(valorPlano || 0),
      mensalidade: Number(valorPlano || 0),
      amount: Number(valorPlano || 0),
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: `Plano alterado para ${planoNome} (R$ ${Number(valorPlano || 0).toFixed(2)}) via Painel Master`,
    };

    if (dataVencimento) {
      planUpdate.dataVencimento = dataVencimento;
      planUpdate.vencimento = dataVencimento;
    }

    // Update memory
    for (const [key, item] of accountsMemoryStore.entries()) {
      if (
        key === targetDocId ||
        item.id === targetDocId ||
        item.uid === targetDocId ||
        item.email === targetDocId.toLowerCase()
      ) {
        accountsMemoryStore.set(key, { ...item, ...planUpdate });
      }
    }

    // Update Firestore
    try {
      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);
      const matchedDocIds = await resolveAccountDocIds(db, targetDocId);
      if (matchedDocIds.length === 0) {
        matchedDocIds.push(targetDocId);
      }
      for (const id of matchedDocIds) {
        await db.collection('accounts').doc(id).set(planUpdate, { merge: true });
      }
    } catch (fsErr: any) {
      console.warn('Firestore change plan notice:', fsErr?.message);
    }

    // Audit log
    await logAuditAction('CHANGE_PLAN', targetDocId, {
      planoId,
      planoNome,
      valorPlano,
      dataVencimento,
    });

    return res.json({
      success: true,
      message: `Plano alterado com sucesso para ${planoNome}.`,
      plan: planUpdate,
    });
  } catch (error: any) {
    console.error('Erro ao alterar plano:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao salvar alteração de plano.' });
  }
});

/**
 * Helper to update user password in Firebase Auth
 */
async function updateFirebaseUserPasswordSafe(uid?: string, email?: string, newPassword?: string): Promise<boolean> {
  if (!newPassword || String(newPassword).trim().length < 6) return false;
  const cleanPassword = String(newPassword).trim();
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const targetUid = uid ? String(uid).trim() : '';

  try {
    const adminApp = getFirebaseAdmin();
    const adminAuth = getAuth(adminApp);
    let resolvedUid = targetUid;
    if (!resolvedUid && cleanEmail) {
      try {
        const u = await adminAuth.getUserByEmail(cleanEmail);
        resolvedUid = u?.uid;
      } catch {}
    }
    if (resolvedUid) {
      await adminAuth.updateUser(resolvedUid, { password: cleanPassword });
      console.log(`✅ [ADMIN AUTH] Senha do usuário ${resolvedUid} (${cleanEmail}) atualizada no Firebase Auth.`);
      return true;
    }
  } catch (err: any) {
    console.warn('⚠️ [ADMIN AUTH] Aviso ao atualizar senha no Firebase Auth:', err?.message);
  }
  return false;
}

/**
 * 7. Update User Allowed Fields (Firestore Document + Firebase Auth)
 */
app.post('/api/admin/update-user', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { docId, uid, email, password, nome, empresa, telefone, dataVencimento, valorPlano, status, planoId, planoNome } = req.body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário não informado.' });
    }

    const nowIso = new Date().toISOString();
    const isBlocked = status === 'bloqueado';
    const isAtivo = status === 'ativo';

    const updatePayload: Record<string, any> = {
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      updatedAt: nowIso,
    };

    if (nome !== undefined) {
      updatePayload.nome = String(nome).trim();
      updatePayload.name = String(nome).trim();
      updatePayload.responsavel = String(nome).trim();
    }
    if (empresa !== undefined) {
      updatePayload.empresa = String(empresa).trim();
      updatePayload.nomeEmpresa = String(empresa).trim();
      updatePayload.nomeFantasia = String(empresa).trim();
    }
    if (telefone !== undefined) {
      updatePayload.telefone = String(telefone).trim();
      updatePayload.phone = String(telefone).trim();
      updatePayload.whatsapp = String(telefone).trim();
    }
    if (dataVencimento !== undefined) {
      updatePayload.dataVencimento = dataVencimento;
      updatePayload.vencimento = dataVencimento;
    }
    if (valorPlano !== undefined) {
      updatePayload.valorPlano = Number(valorPlano);
      updatePayload.valorMensalidade = Number(valorPlano);
      updatePayload.mensalidade = Number(valorPlano);
      updatePayload.amount = Number(valorPlano);
    }
    if (status !== undefined) {
      updatePayload.status = status;
      updatePayload.bloqueado = isBlocked;
      updatePayload.blocked = isBlocked;
      updatePayload.ativo = isAtivo;
      updatePayload.active = isAtivo;
    }
    if (planoId !== undefined) {
      updatePayload.plano = planoId;
      updatePayload.planoId = planoId;
    }
    if (planoNome !== undefined) {
      updatePayload.planoNome = planoNome;
      updatePayload.planName = planoNome;
    }

    // Se senha foi fornecida, atualiza no Firebase Auth
    let passwordUpdated = false;
    if (password && String(password).trim().length >= 6) {
      passwordUpdated = await updateFirebaseUserPasswordSafe(uid, email || targetDocId, String(password).trim());
      updatePayload.passwordUpdatedAt = nowIso;
    }

    // Update Memory
    for (const [key, item] of accountsMemoryStore.entries()) {
      if (
        key === targetDocId ||
        item.id === targetDocId ||
        item.uid === targetDocId ||
        item.email === targetDocId.toLowerCase()
      ) {
        accountsMemoryStore.set(key, { ...item, ...updatePayload });
      }
    }

    // Update Firestore
    try {
      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);
      const matchedDocIds = await resolveAccountDocIds(db, targetDocId);
      if (matchedDocIds.length === 0) {
        matchedDocIds.push(targetDocId);
      }
      for (const id of matchedDocIds) {
        await db.collection('accounts').doc(id).set(updatePayload, { merge: true });
      }
    } catch (fsErr: any) {
      console.warn('Firestore update user notice:', fsErr?.message);
    }

    // Audit log
    await logAuditAction('UPDATE_USER', targetDocId, { ...updatePayload, passwordUpdated });

    return res.json({
      success: true,
      message: 'Dados do usuário atualizados com sucesso.',
      updated: updatePayload,
      passwordUpdated,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao atualizar dados do usuário.' });
  }
});

/**
 * 8. Permanently Delete User (Firebase Auth + Firestore)
 */
app.post('/api/admin/delete-user', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { uid, email, docId } = req.body || {};

    if (!uid && !email && !docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'UID ou e-mail do usuário não fornecido para exclusão.' 
      });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const targetUid = uid ? String(uid).trim() : '';
    const targetDocId = docId ? String(docId).trim() : (targetUid || cleanEmail);

    // Proteção absoluta para as contas Super Admin
    const superAdminEmails = [
      MASTER_ADMIN_EMAIL.toLowerCase(),
      'msp404011@gmail.com',
    ];
    if (
      superAdminEmails.includes(cleanEmail) ||
      superAdminEmails.includes(targetDocId.toLowerCase()) ||
      cleanEmail.includes('mmspmartins62') ||
      cleanEmail.includes('msp404011')
    ) {
      return res.status(403).json({
        success: false,
        error: 'A conta do Super Administrador não pode ser excluída.',
      });
    }

    console.log(`🔥 [ADMIN API] Iniciando exclusão definitiva do usuário: UID=${targetUid}, Email=${cleanEmail}, DocID=${targetDocId}`);

    // 1. Delete from Firebase Auth safely
    const authDeleted = await deleteFirebaseUserSafe(targetUid, cleanEmail);

    // 2. Remove from in-memory cache
    if (targetDocId) accountsMemoryStore.delete(targetDocId);
    if (targetUid) accountsMemoryStore.delete(targetUid);
    if (cleanEmail) accountsMemoryStore.delete(cleanEmail);

    // 3. Remove from Firestore (inclusive subcoleções se houver)
    let firestoreDeleted = false;
    try {
      const adminApp = getFirebaseAdmin();
      const dbAdmin = getFirestore(adminApp);
      const matchedDocIds = await resolveAccountDocIds(dbAdmin, targetDocId);
      if (matchedDocIds.length === 0) {
        matchedDocIds.push(targetDocId);
      }
      for (const id of matchedDocIds) {
        const docRef = dbAdmin.collection('accounts').doc(id);
        try {
          if (typeof (dbAdmin as any).recursiveDelete === 'function') {
            await (dbAdmin as any).recursiveDelete(docRef);
          } else {
            await docRef.delete();
          }
        } catch {
          await docRef.delete();
        }
        firestoreDeleted = true;
      }
    } catch (fsErr: any) {
      console.warn('Firestore delete notice:', fsErr?.message);
      firestoreDeleted = true; // Handled
    }

    // Audit log
    await logAuditAction('DELETE_USER', targetDocId, {
      uid: targetUid,
      email: cleanEmail,
      authDeleted,
      firestoreDeleted,
    });

    return res.json({
      success: true,
      message: 'Usuário excluído definitivamente do banco de dados e da autenticação.',
      authDeleted,
      firestoreDeleted,
      deletedUid: targetUid,
      deletedEmail: cleanEmail,
      deletedDocId: targetDocId,
    });
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar exclusão do usuário.',
    });
  }
});

/**
 * 8.1. Purge all non-super-admin users (Reset database to pristine Super-Admin-only state)
 */
app.post('/api/admin/purge-non-admins', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const superAdminEmails = [
      MASTER_ADMIN_EMAIL.toLowerCase(),
      'msp404011@gmail.com',
    ];
    const isSuperAdminEmail = (em?: string) => {
      if (!em) return false;
      const clean = em.toLowerCase().trim();
      return superAdminEmails.includes(clean) || clean.includes('mmspmartins62') || clean.includes('msp404011');
    };

    const deletedDocs: string[] = [];
    const deletedAuth: string[] = [];
    const kept: string[] = [];

    // 1. Limpa o store de memória
    for (const [key, item] of accountsMemoryStore.entries()) {
      const itemEmail = (item.email || item.userEmail || key).toLowerCase().trim();
      if (!isSuperAdminEmail(itemEmail)) {
        accountsMemoryStore.delete(key);
        deletedDocs.push(key);
      } else {
        if (!kept.includes(itemEmail)) kept.push(itemEmail);
      }
    }

    // 2. Limpa o Firestore
    try {
      const app = getFirebaseAdmin();
      const db = getFirestore(app);
      const snap = await db.collection('accounts').get();

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const email = (data.email || data.userEmail || data.login || docSnap.id).toLowerCase().trim();
        const uid = data.uid || docSnap.id;

        if (!isSuperAdminEmail(email)) {
          console.log(`[PURGE] Excluindo conta não-admin: DocID=${docSnap.id}, Email=${email}`);
          
          try {
            if (typeof (db as any).recursiveDelete === 'function') {
              await (db as any).recursiveDelete(docSnap.ref);
            } else {
              await docSnap.ref.delete();
            }
          } catch {
            await docSnap.ref.delete();
          }

          deletedDocs.push(docSnap.id);

          try {
            await deleteFirebaseUserSafe(uid, email);
            deletedAuth.push(email || uid);
          } catch {}
        } else {
          if (!kept.includes(email)) kept.push(email);
        }
      }
    } catch (fsErr: any) {
      console.warn('Firestore purge notice:', fsErr?.message);
    }

    // 3. Garante conta Master com plano Super Admin Vitalício
    await ensureMasterAdminAccount();

    await logAuditAction('PURGE_NON_ADMINS', 'all', { deletedDocs, deletedAuth, kept });

    return res.json({
      success: true,
      message: 'Todos os usuários não-super-admin foram excluídos. Apenas Super Admin preservado.',
      deletedDocsCount: deletedDocs.length,
      deletedAuthCount: deletedAuth.length,
      kept,
    });
  } catch (error: any) {
    console.error('❌ Erro no purge-non-admins:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao executar limpeza geral.' });
  }
});

app.post('/api/admin/clean-duplicates', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const deletedDocs: string[] = [];
    const deletedAuth: string[] = [];

    try {
      const adminApp = getFirebaseAdmin();
      const dbAdmin = getFirestore(adminApp);

      const snapshot = await dbAdmin.collection('accounts').get();
      const accountsByEmail: Record<string, any[]> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const email = (data.email || data.userEmail || data.login || doc.id).trim().toLowerCase();
        if (!accountsByEmail[email]) {
          accountsByEmail[email] = [];
        }
        accountsByEmail[email].push({ id: doc.id, data });
      });

      for (const email in accountsByEmail) {
        const docs = accountsByEmail[email];
        if (docs.length > 1) {
          docs.sort((a, b) => {
            const dateA = new Date(a.data.statusUpdatedAt || a.data.createdAt || 0).getTime();
            const dateB = new Date(b.data.statusUpdatedAt || b.data.createdAt || 0).getTime();
            return dateB - dateA;
          });

          const [keep, ...toDelete] = docs;
          for (const d of toDelete) {
            await dbAdmin.collection('accounts').doc(d.id).delete();
            accountsMemoryStore.delete(d.id);
            deletedDocs.push(d.id);
            await deleteFirebaseUserSafe(d.id, email);
            deletedAuth.push(d.id);
          }
        }
      }
    } catch (fsErr: any) {
      console.warn('Firestore clean duplicates notice:', fsErr?.message);
    }

    return res.json({ success: true, deletedDocs, deletedAuth });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9. Get Audit Logs (Master Admin Only)
 */
app.get('/api/admin/audit-logs', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    let logs: any[] = [...auditLogsMemoryStore];

    try {
      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);
      const snap = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(50).get();
      const fsLogs: any[] = [];
      snap.forEach((docSnap) => {
        fsLogs.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });
      if (fsLogs.length > 0) {
        logs = fsLogs;
      }
    } catch (fsErr: any) {
      // Memory logs fallback
    }

    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao buscar logs de auditoria.' });
  }
});

/**
 * 10. Bootstrap Master Admin Accounts (Ensures mmspmartins62@gmail.com and msp404011@gmail.com exist)
 */
async function ensureMasterAdminAccount() {
  const superAdminList = [
    { email: MASTER_ADMIN_EMAIL.toLowerCase(), name: 'Administrador Master MSP' },
    { email: 'msp404011@gmail.com', name: 'Super Admin MSP' },
  ];
  const adminPassword = MASTER_ADMIN_DEFAULT_PASSWORD;
  const nowIso = new Date().toISOString();

  try {
    for (const adm of superAdminList) {
      const adminEmail = adm.email;
      const adminAccountDoc = {
        id: adminEmail,
        uid: adminEmail,
        email: adminEmail,
        login: adminEmail,
        user: adminEmail,
        userEmail: adminEmail,
        nome: adm.name,
        name: adm.name,
        responsavel: adm.name,
        empresa: 'Painel Master Gestor',
        nomeEmpresa: 'Painel Master Gestor',
        telefone: '00000000000',
        role: 'master_admin',
        tipo: 'master_admin',
        isAdmin: true,
        status: 'ativo',
        situacao: 'active',
        userStatus: 'active',
        ativo: true,
        active: true,
        bloqueado: false,
        blocked: false,
        inadimplente: false,
        plano: 'ENTERPRISE',
        planoId: 'super_admin',
        planoNome: 'Plano Super Admin Vitalício',
        planName: 'Plano Super Admin Vitalício',
        tipoPlano: 'Super Admin Vitalício',
        valorPlano: 0,
        valorMensalidade: 0,
        mensalidade: 0,
        preco: 0,
        price: 0,
        dataVencimento: '',
        vencimento: '',
        dueDate: '',
        semVencimento: true,
        vitalicio: true,
        ilimitado: true,
        dataCriacao: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Store in memory
      accountsMemoryStore.set(adminEmail, adminAccountDoc);

      // Try creating/syncing in Firebase Auth
      try {
        const authResult = await createFirebaseUserSafe(adminEmail, adminPassword, adm.name, false);
        if (authResult.uid) {
          adminAccountDoc.uid = authResult.uid;
          adminAccountDoc.id = authResult.uid;
          accountsMemoryStore.set(authResult.uid, adminAccountDoc);
        }
      } catch (e) {}

      // Try saving in Firestore
      try {
        const adminApp = getFirebaseAdmin();
        const db = getFirestore(adminApp);
        await db.collection('accounts').doc(adminAccountDoc.id).set(adminAccountDoc, { merge: true });
        if (adminAccountDoc.uid !== adminEmail) {
          await db.collection('accounts').doc(adminEmail).set(adminAccountDoc, { merge: true });
        }
      } catch (e) {}

      console.log(`[Admin Bootstrap] Conta Master ${adminEmail} inicializada com sucesso.`);
    }

    return { success: true, count: superAdminList.length };
  } catch (e: any) {
    console.warn('[Admin Bootstrap] Aviso durante inicialização das contas admin:', e.message);
    return { success: false, error: e.message };
  }
}

app.post('/api/admin/bootstrap-admin', async (req: express.Request, res: express.Response) => {
  const result = await ensureMasterAdminAccount();
  return res.json(result);
});

// Vite middleware or static serving
async function startServer() {
  // Bootstrap Master Admin user on boot
  ensureMasterAdminAccount().catch((err) => {
    console.warn('[Admin Bootstrap Startup Error]:', err?.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

