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

    const rawStr = String(planoId + ' ' + planoNome).toUpperCase();
    const isTrial = rawStr.includes('TRIAL') || rawStr.includes('TESTE') || rawStr.includes('FREE') || rawStr.includes('7 DIAS');

    let calcVencimento = dataVencimento;
    if (isTrial && (!calcVencimento || calcVencimento === '')) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      calcVencimento = d.toISOString().split('T')[0];
    } else if (!calcVencimento) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      calcVencimento = d.toISOString().split('T')[0];
    }

    const finalValor = isTrial ? 0 : Number(valorPlano || 0);
    const finalPlanoId = isTrial ? 'TRIAL' : planoId;
    const finalPlanoNome = planoNome || (isTrial ? 'Teste Grátis (7 Dias)' : 'Plano Completo');

    const nowIso = new Date().toISOString();
    const planUpdate = {
      plano: finalPlanoId,
      planoId: finalPlanoId,
      planoNome: finalPlanoNome,
      planName: finalPlanoNome,
      plan: finalPlanoId,
      planType: finalPlanoId,
      valorPlano: finalValor,
      valorMensalidade: finalValor,
      mensalidade: finalValor,
      amount: finalValor,
      dataVencimento: calcVencimento,
      vencimento: calcVencimento,
      dueDate: calcVencimento,
      expiryDate: calcVencimento,
      trialEndsAt: isTrial ? calcVencimento : null,
      status: 'ativo',
      situacao: 'active',
      userStatus: 'ativo',
      bloqueado: false,
      blocked: false,
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: `Plano alterado para ${finalPlanoNome} (R$ ${finalValor.toFixed(2)}) via Painel Master`,
    };

    await saveAccountDocREST(targetDocId, planUpdate, [uid, email, docId]);

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
