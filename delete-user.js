import {
  isAuthorizedRequest,
  setCorsHeaders,
  deleteAccountDocREST,
} from '../adminUtils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método HTTP não permitido. Use POST.' });
  }

  if (!isAuthorizedRequest(req)) {
    return res.status(401).json({ success: false, message: 'Acesso administrativo não autorizado.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { uid, email, docId } = body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, message: 'Identificador do usuário não fornecido para exclusão.', error: 'Identificador do usuário não fornecido para exclusão.' });
    }

    await deleteAccountDocREST(targetDocId);

    return res.status(200).json({
      success: true,
      message: 'Usuário excluído com sucesso.',
      docId: targetDocId,
    });
  } catch (err) {
    console.error('[Vercel API] Erro no delete-user:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Erro ao excluir usuário.',
      error: err?.message || 'Erro ao excluir usuário.',
    });
  }
}
