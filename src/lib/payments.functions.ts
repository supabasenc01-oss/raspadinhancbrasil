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
    // Aqui usaríamos o process.env.MERCADOPAGO_ACCESS_TOKEN
    // Por enquanto, simulamos uma resposta de sucesso para o fluxo de frontend
    
    return {
      success: true,
      paymentId: `mp_fake_${deposit.id}`,
      qrCode: paymentMethod === "pix" ? "00020126330014BR.GOV.BCB.PIX..." : null,
      qrCodeBase64: paymentMethod === "pix" ? "iVBORw0KGgoAAAANSUhEUgA..." : null,
      status: "pending"
    };
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
