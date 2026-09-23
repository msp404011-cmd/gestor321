import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Configuração de cabeçalhos CORS
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
        error: 'MERCADOPAGO_ACCESS_TOKEN não configurado nas variáveis de ambiente da Vercel.',
      });
    }

    // Inicializa o Mercado Pago usando o Token salvo nas variáveis de ambiente da Vercel
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    });

    const payment = new Payment(client);
    const { transaction_amount, amount, description, email, firstName, first_name } = req.body || {};

    const finalAmount = Number(transaction_amount || amount) || 1.00;
    const finalEmail = email || 'cliente@email.com';

    // Cria a cobrança PIX
    const body = {
      transaction_amount: Number(finalAmount.toFixed(2)),
      description: description || 'Assinatura do Sistema',
      payment_method_id: 'pix',
      payer: {
        email: finalEmail,
      },
    };

    const response = await payment.create({ body });

    // Extrai o texto Copia e Cola e o QR Code em imagem Base64
    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;

    return res.status(200).json({
      success: true,
      payment_id: response.id,
      status: response.status,
      qr_code: qrCode, // Código no formato 000201...
      qr_code_base64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX Mercado Pago:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar requisição',
    });
  }
}
