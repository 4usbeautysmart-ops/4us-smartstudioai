import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  console.log("---- CHEGOU NA API VITE/Vercel -----");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  let body = req.body;

  // Vercel às vezes não parseia JSON automaticamente
  // então garantimos que body exista
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ error: "JSON inválido no body." });
    }
  }

  const { userId, userEmail, planType } = body;

  if (!userId || !userEmail || !planType) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    console.log("❌ MP_ACCESS_TOKEN não configurado");
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado." });
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    let planDetails = { title: "Plano Mensal", unit_price: 498 };

    const resposta = await preference.create({
      body: {
        items: [
          {
            title: planDetails.title,
            unit_price: planDetails.unit_price,
            quantity: 1,
          },
        ],
        payer: { email: userEmail },
        external_reference: userId,
        back_urls: {
          success: "https://engenharia-de-cortes-5d.vercel.app/",
          failure: "https://engenharia-de-cortes-5d.vercel.app/",
          pending: "https://engenharia-de-cortes-5d.vercel.app/",
        },
        auto_return: "approved",
        metadata: { planType },
      },
    });

    console.log("Preference criada:", resposta.init_point);

    return res.status(200).json({
      checkoutUrl: resposta.init_point,
    });
  } catch (err) {
    console.log("🔥 Erro Mercado Pago:", err);
    return res.status(500).json({ error: "Falha ao criar preferência." });
  }
}
