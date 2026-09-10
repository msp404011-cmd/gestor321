import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(request: Request) {
  try {
    let bodyData: any = {};
    try {
      bodyData = await request.json();
    } catch {
      // Ignore body parse errors if empty
    }

    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      '';

    if (!accessToken || accessToken === 'COLE_SEU_ACCESS_TOKEN_AQUI') {
      return Response.json(
        {
          error:
            'Access token do Mercado Pago não configurado. Adicione MERCADOPAGO_ACCESS_TOKEN ou VITE_MP_ACCESS_TOKEN nas variáveis de ambiente da Vercel.',
        },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const amount = Number(bodyData.amount || bodyData.transaction_amount || 1.0);
    const description = bodyData.description || 'Pagamento de Teste Pix';
    const payer = bodyData.payer || {};
    const email = payer.email || 'cliente@exemplo.com';
    const firstName = payer.firstName || payer.first_name || 'Cliente';
    const lastName = payer.lastName || payer.last_name || 'Teste';
    const cleanCpf = (payer.cpf || payer.identification?.number || '19119119100').replace(/\D/g, '');

    const response = await payment.create({
      body: {
        transaction_amount: Number(amount.toFixed(2)),
        description,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: cleanCpf || '19119119100',
          },
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    });

    const qrCode = response.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const ticketUrl = response.point_of_interaction?.transaction_data?.ticket_url;

    return Response.json({
      success: true,
      id: String(response.id),
      status: response.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    return Response.json({ error: error.message || 'Erro ao gerar Pix' }, { status: 500 });
  }
}
