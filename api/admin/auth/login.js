import { isMasterPasswordValid, generateAdminToken, setCorsHeaders } from '../../adminUtils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let password = '';

    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          password = parsed.password || '';
        } catch {
          password = req.body;
        }
      } else if (typeof req.body === 'object') {
        password = req.body.password || '';
      }
    }

    if (!password) {
      password = req.query?.password || req.headers?.['x-master-password'] || '';
    }

    const cleanPassword = String(password || '').trim();

    if (!cleanPassword) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        message: 'Senha não fornecida.',
        error: 'Senha não fornecida.',
      });
    }

    if (isMasterPasswordValid(cleanPassword)) {
      const { token, expiresAt } = generateAdminToken();
      return res.status(200).json({
        success: true,
        authenticated: true,
        message: 'Autenticação realizada com sucesso',
        token,
        expiresAt,
      });
    }

    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Senha inválida',
      error: 'Senha inválida',
    });
  } catch (err) {
    console.error('[Vercel API] Erro no login master:', err);
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: 'Erro interno ao processar autenticação.',
      error: err?.message || 'Erro interno',
    });
  }
}
