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

    const { docId, uid, email, nome, empresa, telefone, dataVencimento, valorPlano, status, planoId, planoNome } = body || {};
    const targetDocId = String(docId || uid || email || '').trim();

    if (!targetDocId) {
      return res.status(400).json({ success: false, message: 'Identificador do usuário não informado.', error: 'Identificador do usuário não informado.' });
    }

    const nowIso = new Date().toISOString();
    const isBlocked = status === 'bloqueado';
    const isAtivo = status === 'ativo';

    const updatePayload = {
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

    await saveAccountDocREST(targetDocId, updatePayload);

    return res.status(200).json({
      success: true,
      message: 'Dados do usuário atualizados com sucesso.',
      updated: updatePayload,
    });
  } catch (err) {
    console.error('[Vercel API] Erro no update-user:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Erro ao atualizar dados do usuário.',
      error: err?.message || 'Erro ao atualizar dados do usuário.',
    });
  }
}
