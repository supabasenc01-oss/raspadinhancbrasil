import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  .handler(async ({ data, context }) => {
    // 1. Validar autenticação
    // No TanStack Start, o context deve ter o supabase/user se o middleware estiver configurado
    // Como estamos implementando agora, vamos simular a validação ou usar o context se disponível
    
    const { amount, paymentMethod } = data;
    
    // TODO: Obter userId real do context
    // const userId = context.userId;
    // if (!userId) throw new Error("Unauthorized");

    console.log("Creating payment:", { amount, paymentMethod });

    // 2. Criar depósito pendente
    /*
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert({
        amount,
        status: 'PENDING',
        payment_provider: 'MERCADOPAGO'
      })
      .select()
      .single();
    */

    // 3. Chamar Mercado Pago API (Server-side)
    // Aqui usaríamos o process.env.MERCADOPAGO_ACCESS_TOKEN
    
    // Mock de resposta por enquanto para estrutura de frontend
    return {
      success: true,
      paymentId: "mp_123456",
      qrCode: paymentMethod === "pix" ? "00020126330014BR.GOV.BCB.PIX..." : null,
      qrCodeBase64: paymentMethod === "pix" ? "iVBORw0KGgoAAAANSUhEUgA..." : null,
      status: "pending"
    };
  });

export const getWalletBalance = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    // return fetchWalletBalance(context.userId);
    return { balance: 0.00 };
  });
