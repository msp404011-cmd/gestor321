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

    const { docId, uid, email, planoId, planoNome, valorPlano, dataVencimento } = body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, message: 'Identificador do usuário não informado.', error: 'Identificador do usuário não informado.' });
    }
    if (!planoId || !planoNome) {
      return res.status(400).json({ success: false, message: 'Dados do plano incompletos.', error: 'Dados do plano incompletos.' });
    }

    const nowIso = new Date().toISOString();
    const planUpdate = {
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

    await saveAccountDocREST(targetDocId, planUpdate);

    return res.status(200).json({
      success: true,
      message: `Plano alterado com sucesso para ${planoNome}.`,
      plan: planUpdate,
    });
  } catch (err) {
    console.error('[Vercel API] Erro no change-plan:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Erro ao alterar plano do usuário.',
      error: err?.message || 'Erro ao alterar plano do usuário.',
    });
  }
}
