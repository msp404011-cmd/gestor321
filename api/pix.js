import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Configura o CORS para permitir requisições do seu Frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
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

    // Inicializa o SDK do Mercado Pago com o Token
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    });

    const payment = new Payment(client);

    const bodyData = req.body || {};
    const { transaction_amount, amount, description, email, firstName, first_name } = bodyData;

    const finalAmount = Number(transaction_amount || amount) || 1.0;
    const finalEmail = email || 'cliente@email.com';
    const finalFirstName = firstName || first_name || 'Cliente';

    // Cria a cobrança PIX no Mercado Pago
    const body = {
      transaction_amount: Number(finalAmount.toFixed(2)),
      description: description || 'Assinatura do Sistema',
      payment_method_id: 'pix',
      payer: {
        email: finalEmail,
        first_name: finalFirstName,
      },
    };

    const response = await payment.create({ body });

    // Extrai o QR Code e a chave Copia e Cola reais gerados pelo Mercado Pago
    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;

    return res.status(200).json({
      success: true,
      payment_id: response.id,
      status: response.status,
      qr_code: qrCode, // Texto do PIX Copia e Cola (começa com 000201...)
      qr_code_base64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX Mercado Pago:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao comunicar com Mercado Pago',
      details: error.cause || null,
    });
  }
}
