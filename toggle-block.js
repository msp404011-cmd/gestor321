import {
  isAuthorizedRequest,
  setCorsHeaders,
  saveAccountDocREST,
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

    const { uid, email, docId, block, reason } = body || {};
    const shouldBlock = Boolean(block);
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, message: 'Identificador do usuário não informado.', error: 'Identificador do usuário não informado.' });
    }

    const nowIso = new Date().toISOString();
    const updatePayload = {
      status: shouldBlock ? 'bloqueado' : 'ativo',
      situacao: shouldBlock ? 'bloqueado' : 'ativo',
      userStatus: shouldBlock ? 'bloqueado' : 'ativo',
      bloqueado: shouldBlock,
      blocked: shouldBlock,
      ativo: !shouldBlock,
      active: !shouldBlock,
      inadimplente: shouldBlock,
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: reason || (shouldBlock ? 'Bloqueio administrativo aplicado pelo Painel Master' : 'Desbloqueio autorizado pelo Master Admin'),
    };

    await saveAccountDocREST(targetDocId, updatePayload, [uid, email, docId]);

    return res.status(200).json({
      success: true,
      message: `Usuário ${shouldBlock ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      status: updatePayload.status,
      bloqueado: shouldBlock,
    });
  } catch (err) {
    console.error('[Vercel API] Erro no toggle-block:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Erro ao alterar status do usuário.',
      error: err?.message || 'Erro ao alterar status do usuário.',
    });
  }
}
