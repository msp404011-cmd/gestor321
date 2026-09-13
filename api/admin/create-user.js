import {
  isAuthorizedRequest,
  setCorsHeaders,
  createAuthUserViaREST,
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
    } = body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNome = String(nome || '').trim();
    const cleanEmpresa = String(empresa || cleanNome).trim();
    const cleanPhone = String(telefone || '').trim();
    const isBlocked = Boolean(bloqueado);

    if (!cleanNome) {
      return res.status(400).json({ success: false, message: 'O nome do usuário é obrigatório.', error: 'O nome do usuário é obrigatório.' });
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ success: false, message: 'Endereço de e-mail inválido.', error: 'Endereço de e-mail inválido.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'A senha inicial deve ter no mínimo 6 caracteres.', error: 'A senha inicial deve ter no mínimo 6 caracteres.' });
    }

    // 1. Cria usuário no Firebase Auth (gera o UID real)
    const authResult = await createAuthUserViaREST(cleanEmail, String(password), cleanNome);
    const uid = authResult.uid;
    const nowIso = new Date().toISOString();

    const rawStr = String((planoId || '') + ' ' + (planoNome || '')).toUpperCase();
    const isTrial = rawStr.includes('TRIAL') || rawStr.includes('TESTE') || rawStr.includes('FREE') || rawStr.includes('7 DIAS');

    const defaultDays = isTrial ? 7 : 30;
    const calcVencimento = dataVencimento || new Date(Date.now() + defaultDays * 86400000).toISOString().split('T')[0];
    const finalValor = isTrial ? 0 : Number(valorPlano || 0.50);
    const finalPlanoId = isTrial ? 'TRIAL' : (planoId || 'COMPLETO_50');
    const finalPlanoNome = planoNome || (isTrial ? 'Teste Grátis (7 Dias)' : 'Plano Completo (R$ 0,50)');

    // 2. Prepara e salva o documento na coleção accounts no Firestore
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
      plano: finalPlanoId,
      planoId: finalPlanoId,
      planoNome: finalPlanoNome,
      planName: finalPlanoNome,
      planType: finalPlanoId,
      valorPlano: finalValor,
      valorMensalidade: finalValor,
      mensalidade: finalValor,
      amount: finalValor,
      dataCriacao: nowIso,
      createdAt: nowIso,
      dataVencimento: calcVencimento,
      vencimento: calcVencimento,
      dueDate: calcVencimento,
      expiryDate: calcVencimento,
      trialEndsAt: isTrial ? calcVencimento : null,
      status: isBlocked ? 'bloqueado' : 'ativo',
      situacao: isBlocked ? 'bloqueado' : 'ativo',
      userStatus: isBlocked ? 'bloqueado' : 'ativo',
      bloqueado: isBlocked,
      blocked: isBlocked,
      ativo: !isBlocked,
      active: !isBlocked,
      inadimplente: isBlocked,
      situacaoPagamento: 'em_dia',
      statusUpdatedAt: nowIso,
      statusUpdatedBy: 'Master Admin',
      statusReason: 'Conta criada administrativamente via Painel Master',
    };

    // Salva tanto no documento UID quanto no documento EMAIL se diferente
    await saveAccountDocREST(uid, accountDoc, [cleanEmail]);

    return res.status(200).json({
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
  } catch (err) {
    console.error('[Vercel API] Erro ao criar usuário:', err);
    return res.status(400).json({
      success: false,
      message: err?.message || 'Erro ao criar usuário no Firebase.',
      error: err?.message || 'Erro ao criar usuário no Firebase.',
    });
  }
}
