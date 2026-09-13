import { verifyAdminToken, setCorsHeaders } from '../../adminUtils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : req.headers?.['x-admin-token'] || req.query?.token || '';

  const isValid = verifyAdminToken(token);
  return res.status(200).json({ success: isValid, valid: isValid, authenticated: isValid });
}
