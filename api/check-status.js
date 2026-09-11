import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      req.headers?.authorization?.replace('Bearer ', '') ||
      '';

    if (!accessToken || accessToken === 'COLE_SEU_ACCESS_TOKEN_AQUI') {
      return res.status(400).json({
        success: false,
        error: 'MERCADOPAGO_ACCESS_TOKEN não configurado nas Variáveis de Ambiente da Vercel.',
      });
    }

    // Extract payment ID from query params or body
    const paymentId = req.query?.id || req.query?.payment_id || req.body?.payment_id || req.body?.id;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'ID do pagamento não fornecido.',
      });
    }

    // Initialize Mercado Pago SDK
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    // Consult payment details
    const result = await payment.get({ id: paymentId });

    const isApproved = result.status === 'approved';

    return res.status(200).json({
      success: true,
      id: String(result.id),
      status: result.status, // e.g., 'pending', 'approved', 'rejected', 'cancelled'
      status_detail: result.status_detail,
      is_approved: isApproved,
      transaction_amount: result.transaction_amount,
      date_approved: result.date_approved,
    });
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao consultar status no Mercado Pago',
    });
  }
}
