import { isAuthorizedRequest, setCorsHeaders, listAccountsREST } from '../adminUtils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!isAuthorizedRequest(req)) {
    return res.status(401).json({ success: false, message: 'Acesso não autorizado', error: 'Acesso não autorizado' });
  }

  try {
    const users = await listAccountsREST();
    return res.status(200).json({ success: true, users, total: users.length });
  } catch (err) {
    console.error('[Vercel API] Erro ao listar usuários:', err);
    return res.status(500).json({ success: false, users: [], error: err?.message || 'Erro ao carregar usuários.' });
  }
}
