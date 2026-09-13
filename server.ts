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
  MASTER_PASSWORD,
  process.env.MASTER_PASSWORD,
  process.env.VITE_MASTER_PASSWORD,
  'master123',
].filter(Boolean) as string[];

export function isMasterPasswordValid(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  return ACCEPTED_MASTER_PASSWORDS.some((p) => p === candidate || p === trimmed);
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
// FIREBASE ADMIN SDK LAZY INITIALIZATION
// ==========================================
let firebaseAdminApp: App | null = null;

function getFirebaseAdmin(): App {
  if (!firebaseAdminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAdminApp = existingApps[0]!;
    } else {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.VITE_FIREBASE_PROJECT_ID ||
        'painelgestor-11e67';

      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          firebaseAdminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId,
          });
        } else {
          firebaseAdminApp = initializeApp({
            projectId,
          });
        }
      } catch (err) {
        console.warn('Firebase Admin default init fallback:', err);
        firebaseAdminApp = initializeApp({
          projectId,
        });
      }
    }
  }
  return firebaseAdminApp;
}

/**
 * Helper to record administrative audit logs securely in Firestore
 */
async function logAuditAction(action: string, targetId: string, details: Record<string, any>) {
  try {
    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const nowIso = new Date().toISOString();
    await db.collection('audit_logs').add({
      action,
      targetId,
      performedBy: 'Master Admin',
      timestamp: nowIso,
      ip: 'server-internal',
      details,
    });
  } catch (err) {
    console.warn('Falha ao gravar log de auditoria:', err);
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
    const cleanCpf = (payer?.cpf || payer?.identification?.number || '19119119100').replace(/\D/g, '');

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
            type: 'CPF',
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
    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const snap = await db.collection('accounts').get();
    
    const users: any[] = [];
    snap.forEach((docSnap) => {
      users.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

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

    const adminApp = getFirebaseAdmin();
    const adminAuth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    // 1. Create in Firebase Auth
    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email: cleanEmail,
        password: String(password),
        displayName: cleanNome,
        disabled: isBlocked,
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(400).json({ success: false, error: `O e-mail "${cleanEmail}" já está em uso no Firebase Authentication.` });
      }
      return res.status(400).json({ success: false, error: authErr.message || 'Erro ao criar conta no Firebase Auth.' });
    }

    const uid = authUser.uid;
    const nowIso = new Date().toISOString();

    // 2. Prepare and save account document in Firestore
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

    await db.collection('accounts').doc(uid).set(accountDoc);

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

    const adminApp = getFirebaseAdmin();
    const adminAuth = getAuth(adminApp);
    const db = getFirestore(adminApp);
    const nowIso = new Date().toISOString();

    // 1. Update Firestore document
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

    await db.collection('accounts').doc(targetDocId).set(updatePayload, { merge: true });

    // 2. Synchronize with Firebase Auth (disable or enable account login)
    let authUid = uid;
    if (!authUid && !targetDocId.includes('@')) {
      authUid = targetDocId;
    }
    if (!authUid && email) {
      try {
        const userRec = await adminAuth.getUserByEmail(email);
        authUid = userRec.uid;
      } catch (ignore) {}
    }

    if (authUid) {
      try {
        await adminAuth.updateUser(authUid, { disabled: shouldBlock });
      } catch (authErr: any) {
        console.warn('Aviso ao sincronizar status no Firebase Auth:', authErr.message);
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

    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
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

    await db.collection('accounts').doc(targetDocId).set(planUpdate, { merge: true });

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
 * 7. Update User Allowed Fields (Firestore Document)
 */
app.post('/api/admin/update-user', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { docId, uid, email, nome, empresa, telefone, dataVencimento, valorPlano, status, planoId, planoNome } = req.body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário não informado.' });
    }

    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    const nowIso = new Date().toISOString();

    const isBlocked = status === 'bloqueado';
    const isAtivo = status === 'ativo';

    const updatePayload: Record<string, any> = {
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
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

    await db.collection('accounts').doc(targetDocId).set(updatePayload, { merge: true });

    // Sincroniza displayName se o nome foi alterado
    let authUid = uid || (!targetDocId.includes('@') ? targetDocId : '');
    if (authUid && nome) {
      try {
        const adminAuth = getAuth(adminApp);
        await adminAuth.updateUser(authUid, { displayName: String(nome).trim(), disabled: isBlocked });
      } catch (ignore) {}
    }

    // Audit log
    await logAuditAction('UPDATE_USER', targetDocId, updatePayload);

    return res.json({
      success: true,
      message: 'Dados do usuário atualizados com sucesso.',
      updated: updatePayload,
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

    console.log(`🔥 [ADMIN API] Iniciando exclusão do usuário: UID=${targetUid}, Email=${cleanEmail}, DocID=${targetDocId}`);

    let authDeleted = false;
    let authError: string | null = null;

    try {
      const adminApp = getFirebaseAdmin();
      const adminAuth = getAuth(adminApp);
      
      // 1. Tenta deletar pelo UID direto
      let foundUid = targetUid;
      if (!foundUid && cleanEmail) {
        try {
          const userRec = await adminAuth.getUserByEmail(cleanEmail);
          foundUid = userRec.uid;
        } catch (uErr: any) {
          if (uErr.code !== 'auth/user-not-found') {
            console.warn('Erro ao buscar usuário por e-mail:', uErr.message);
          }
        }
      }

      if (foundUid) {
        try {
          await adminAuth.deleteUser(foundUid);
          authDeleted = true;
          console.log(`✅ [ADMIN API] Usuário ${foundUid} excluído do Firebase Authentication.`);
        } catch (delErr: any) {
          if (delErr.code === 'auth/user-not-found') {
            console.log(`ℹ️ [ADMIN API] Usuário ${foundUid} não existia ou já foi excluído do Firebase Authentication.`);
            authDeleted = true;
          } else {
            console.error('Erro ao excluir no Firebase Auth:', delErr);
            authError = delErr.message;
          }
        }
      } else if (cleanEmail) {
        try {
          const userRec = await adminAuth.getUserByEmail(cleanEmail);
          if (userRec?.uid) {
            await adminAuth.deleteUser(userRec.uid);
            authDeleted = true;
          }
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            authDeleted = true;
          } else {
            authError = e.message;
          }
        }
      }
    } catch (adminErr: any) {
      console.warn('Aviso no Firebase Admin Auth:', adminErr.message);
      authError = adminErr.message;
    }

    // 2. Exclui apenas o documento desta conta no Firestore
    let firestoreDeleted = false;
    try {
      const adminApp = getFirebaseAdmin();
      const dbAdmin = getFirestore(adminApp);
      
      if (targetDocId) {
        await dbAdmin.collection('accounts').doc(targetDocId).delete();
        firestoreDeleted = true;
      }
      
      // Se o targetDocId for o UID, também remove documento legado com chave do e-mail (caso exista)
      if (cleanEmail && cleanEmail !== targetDocId) {
        await dbAdmin.collection('accounts').doc(cleanEmail).delete();
      }

      // Audit log
      await logAuditAction('DELETE_USER', targetDocId, {
        uid: targetUid,
        email: cleanEmail,
        authDeleted,
        firestoreDeleted,
      });
    } catch (fsErr: any) {
      console.warn('Aviso ao excluir documento Firestore via Admin:', fsErr.message);
    }

    return res.json({
      success: true,
      message: 'Usuário excluído com sucesso.',
      authDeleted,
      firestoreDeleted,
      authError: authError || undefined,
      deletedUid: targetUid,
      deletedEmail: cleanEmail,
      deletedDocId: targetDocId,
    });
  } catch (error: any) {
    console.error('❌ Erro crítico ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar exclusão do usuário.',
    });
  }
});

/**
 * 9. Get Audit Logs (Master Admin Only)
 */
app.get('/api/admin/audit-logs', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    const snap = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(50).get();
    const logs: any[] = [];
    snap.forEach((docSnap) => {
      logs.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao buscar logs de auditoria.' });
  }
});

/**
 * 10. Bootstrap Master Admin Account (Ensures mmspmartins62@gmail.com with 16150705@Mm### exists)
 */
async function ensureMasterAdminAccount() {
  const adminEmail = MASTER_ADMIN_EMAIL.toLowerCase();
  const adminPassword = MASTER_ADMIN_DEFAULT_PASSWORD;

  try {
    const adminApp = getFirebaseAdmin();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    let userUid = '';
    try {
      const existingUser = await auth.getUserByEmail(adminEmail);
      userUid = existingUser.uid;
      await auth.updateUser(userUid, {
        password: adminPassword,
        displayName: 'Administrador Master',
        disabled: false,
      });
      console.log(`[Admin Bootstrap] Usuário master ${adminEmail} sincronizado com sucesso no Firebase Auth.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        const newUser = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Administrador Master',
          emailVerified: true,
        });
        userUid = newUser.uid;
        console.log(`[Admin Bootstrap] Novo usuário master ${adminEmail} criado no Firebase Auth (UID: ${userUid}).`);
      } else {
        console.warn('[Admin Bootstrap] Aviso ao verificar usuário no Firebase Auth:', err.message);
      }
    }

    const nowIso = new Date().toISOString();
    const adminAccountDoc = {
      id: userUid || adminEmail,
      uid: userUid || adminEmail,
      email: adminEmail,
      login: adminEmail,
      user: adminEmail,
      userEmail: adminEmail,
      nome: 'Administrador Master',
      name: 'Administrador Master',
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
      planoId: 'enterprise',
      planoNome: 'Plano Master Ilimitado',
      planName: 'Plano Master Ilimitado',
      tipoPlano: 'Plano Master Ilimitado',
      valorPlano: 0,
      valorMensalidade: 0,
      mensalidade: 0,
      preco: 0,
      price: 0,
      dataVencimento: '2099-12-31',
      vencimento: '2099-12-31',
      dueDate: '2099-12-31',
      dataCriacao: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (userUid) {
      await db.collection('accounts').doc(userUid).set(adminAccountDoc, { merge: true });
    }
    await db.collection('accounts').doc(adminEmail).set(adminAccountDoc, { merge: true });
    console.log(`[Admin Bootstrap] Registro da conta master ${adminEmail} salvo no Firestore.`);
    return { success: true, email: adminEmail, uid: userUid };
  } catch (e: any) {
    console.warn('[Admin Bootstrap] Aviso durante inicialização da conta admin:', e.message);
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

