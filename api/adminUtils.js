import crypto from 'crypto';

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || process.env.ADMIN_MASTER_PASSWORD || process.env.VITE_MASTER_PASSWORD || '16150705@Mm###';
const ADMIN_SECRET_KEY = process.env.ADMIN_JWT_SECRET || process.env.MASTER_PASSWORD || 'msp-super-admin-secure-key-2025';

const ACCEPTED_PASSWORDS = [
  '16150705@Mm###',
  MASTER_PASSWORD,
  process.env.MASTER_PASSWORD,
  process.env.ADMIN_MASTER_PASSWORD,
  process.env.VITE_MASTER_PASSWORD,
  'master123',
].filter(Boolean);

export function isMasterPasswordValid(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  return ACCEPTED_PASSWORDS.some((p) => p === candidate || p === trimmed);
}

export function generateAdminToken() {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const payload = JSON.stringify({ role: 'master_admin', expiresAt, nonce: crypto.randomBytes(8).toString('hex') });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(payloadB64).digest('base64url');
  return { token: `${payloadB64}.${signature}`, expiresAt };
}

export function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(payloadB64).digest('base64url');
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return payload?.role === 'master_admin' && payload?.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-master-password, Accept');
}

export function isAuthorizedRequest(req) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : req.headers?.['x-admin-token'] || req.query?.token || '';

  if (token && verifyAdminToken(token)) return true;

  const directPassword = req.headers?.['x-master-password'] || req.query?.password;
  if (directPassword && isMasterPasswordValid(String(directPassword))) return true;

  return false;
}

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || "AIzaSyAQL9rFiNo9MV0NDHQ8Z5XN7nyQTxnUw-0";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "painelgestor-11e67";

export function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

export function fromFirestoreFields(fields) {
  const obj = {};
  if (!fields) return obj;
  for (const [key, valObj] of Object.entries(fields)) {
    if (valObj.stringValue !== undefined) obj[key] = valObj.stringValue;
    else if (valObj.doubleValue !== undefined) obj[key] = Number(valObj.doubleValue);
    else if (valObj.integerValue !== undefined) obj[key] = Number(valObj.integerValue);
    else if (valObj.booleanValue !== undefined) obj[key] = Boolean(valObj.booleanValue);
  }
  return obj;
}

export async function createAuthUserViaREST(email, password, displayName) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName,
      returnSecureToken: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || 'Erro ao criar conta no Firebase Auth';
    if (message.includes('EMAIL_EXISTS')) {
      throw new Error(`O e-mail "${email}" já está cadastrado no Firebase Authentication.`);
    }
    throw new Error(`Firebase Auth REST error: ${message}`);
  }

  return { uid: data.localId, email: data.email, idToken: data.idToken };
}

export async function saveAccountDocREST(docId, accountData) {
  const fields = toFirestoreFields(accountData);
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/accounts/${encodeURIComponent(docId)}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn('[Firestore REST] Aviso ao salvar documento:', errText);
  }
  return true;
}

export async function listAccountsREST() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/accounts?pageSize=500`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const docs = data.documents || [];
  return docs.map((docItem) => {
    const parts = docItem.name ? docItem.name.split('/') : [];
    const id = parts[parts.length - 1];
    const fieldsData = fromFirestoreFields(docItem.fields);
    return { id, ...fieldsData };
  });
}

export async function deleteAccountDocREST(docId) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/accounts/${encodeURIComponent(docId)}`;
  const res = await fetch(url, { method: 'DELETE' });
  return res.ok;
}
