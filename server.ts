import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mercado Pago PIX Generation Endpoint (using official MercadoPago SDK)
const handlePixRequest = async (req: express.Request, res: express.Response) => {
  try {
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      req.headers.authorization?.replace('Bearer ', '') ||
      '';

    if (!accessToken || accessToken === 'COLE_SEU_ACCESS_TOKEN_AQUI') {
      return res.status(400).json({
        error:
          'Access token do Mercado Pago não configurado. Por favor, configure MERCADOPAGO_ACCESS_TOKEN ou VITE_MP_ACCESS_TOKEN nas variáveis de ambiente.',
      });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const { amount, transaction_amount, description, payer } = req.body || {};
    const finalAmount = Number(amount || transaction_amount || 1.0);
    const finalDesc = description || 'Pagamento de Teste Pix';
    const email = payer?.email || 'cliente@exemplo.com';
    const firstName = payer?.firstName || payer?.first_name || 'Cliente';
    const lastName = payer?.lastName || payer?.last_name || 'Teste';
    const cleanCpf = (payer?.cpf || payer?.identification?.number || '19119119100').replace(/\D/g, '');

    const response = await payment.create({
      body: {
        transaction_amount: Number(finalAmount.toFixed(2)),
        description: finalDesc,
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

    return res.json({
      success: true,
      id: String(response.id),
      status: response.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    return res.status(500).json({ error: error.message || 'Erro ao gerar Pix' });
  }
};

app.post('/api/pix', handlePixRequest);
app.post('/api/mercadopago/pix', handlePixRequest);

// Mercado Pago Payment Status Check Endpoint
app.get('/api/mercadopago/status/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.VITE_MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      req.headers.authorization?.replace('Bearer ', '') ||
      '';

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token do Mercado Pago não configurado.' });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await payment.get({ id });

    return res.json({
      id: String(result.id),
      status: result.status,
      statusDetail: result.status_detail,
      isApproved: result.status === 'approved',
      dateApproved: result.date_approved,
      transactionAmount: result.transaction_amount,
    });
  } catch (error: any) {
    console.error('Erro ao consultar status do Pix:', error);
    return res.status(500).json({ error: error.message || 'Erro ao consultar status' });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
