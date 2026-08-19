import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Tipos para Mercado Pago
const mpPaymentSchema = z.object({
  amount: z.number().min(1),
  paymentMethod: z.enum(["pix", "credit_card"]),
  cardToken: z.string().optional(),
  installments: z.number().optional(),
  issuerId: z.string().optional(),
});

export const createPayment = createServerFn({ method: "POST" })
  .inputValidator((data) => mpPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      throw new Error("Não autorizado");
    }
    
    const { amount, paymentMethod } = data;
    
    // 1. Criar depósito pendente
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: user.id,
        amount,
        status: 'PENDING',
        payment_provider: 'MERCADOPAGO'
      })
      .select()
      .single();

    if (depositError) throw depositError;

    // 2. Chamar Mercado Pago API (Server-side)
    const mpAccessToken = process.env['MERCADOPAGO_ACCESS_TOKEN'] || 
                         (await supabaseAdmin.from('system_settings').select('value').eq('key', 'mercadopago_access_token').maybeSingle()).data?.value;
    
    // Remover aspas se vier do JSONB
    const cleanToken = typeof mpAccessToken === 'string' ? mpAccessToken.replace(/^"|"$/g, '') : '';

    if (!cleanToken || cleanToken.includes('fake')) {
      console.warn("Mercado Pago Access Token não configurado ou inválido.");
      return {
        success: true,
        paymentId: `mp_fake_${deposit.id}`,
        qrCode: paymentMethod === "pix" ? "00020126330014BR.GOV.BCB.PIX..." : null,
        qrCodeBase64: paymentMethod === "pix" ? "iVBORw0KGgoAAAANSUhEUgA..." : null,
        status: "pending",
        message: "Modo de teste: Credenciais do Mercado Pago não configuradas."
      };
    }

    try {
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": deposit.id
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: `Recarga de Saldo - ${user.email}`,
          payment_method_id: paymentMethod,
          payer: {
            email: user.email,
          },
          external_reference: deposit.id,
          notification_url: `${process.env['SITE_URL'] || 'https://raspadinhancbrasil.lovable.app'}/api/public/mercadopago-webhook`
        })
      });

      const paymentData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("Erro MP API:", paymentData);
        throw new Error(paymentData.message || "Erro ao processar pagamento no Mercado Pago");
      }

      return {
        success: true,
        paymentId: paymentData.id.toString(),
        qrCode: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        status: paymentData.status
      };
    } catch (error: any) {
      console.error("Payment error:", error);
      throw error;
    }
  });

export const getWalletBalance = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return { balance: 0.00 };
    }

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    return { balance: wallet?.balance || 0.00 };
  });
