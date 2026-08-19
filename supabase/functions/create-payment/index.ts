// Migrated from src/lib/payments.functions.ts (createPayment).
// Calls the real Mercado Pago API when a valid access token is configured
// (MERCADOPAGO_ACCESS_TOKEN secret, falling back to the mercadopago_access_token
// system_settings row) — otherwise falls back to a simulated response so the
// frontend flow still works in test mode.
// Deploy with: supabase functions deploy create-payment
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

const bodySchema = z.object({
  amount: z.number().min(1),
  paymentMethod: z.enum(["pix", "credit_card"]),
  cardToken: z.string().optional(),
  installments: z.number().optional(),
  issuerId: z.string().optional(),
});

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseAdmin = createAdminClient();
  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { amount, paymentMethod } = data;

  const { data: deposit, error: depositError } = await supabaseAdmin
    .from("deposits")
    .insert({
      user_id: user.id,
      amount,
      status: "PENDING",
      payment_provider: "MERCADOPAGO",
    })
    .select()
    .single();

  if (depositError) {
    return new Response(JSON.stringify({ error: depositError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!mpAccessToken) {
    const { data: setting } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "mercadopago_access_token")
      .maybeSingle();
    mpAccessToken = typeof setting?.value === "string" ? setting.value.replace(/^"|"$/g, "") : undefined;
  }

  if (!mpAccessToken || mpAccessToken.includes("fake")) {
    console.warn("Mercado Pago Access Token não configurado ou inválido.");
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: `mp_fake_${deposit.id}`,
        qrCode: paymentMethod === "pix" ? "00020126330014BR.GOV.BCB.PIX..." : null,
        qrCodeBase64: paymentMethod === "pix" ? "iVBORw0KGgoAAAANSUhEUgA..." : null,
        status: "pending",
        message: "Modo de teste: Credenciais do Mercado Pago não configuradas.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": deposit.id,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: `Recarga de Saldo - ${user.email}`,
        payment_method_id: paymentMethod,
        payer: { email: user.email },
        external_reference: deposit.id,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      }),
    });

    const paymentData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro MP API:", paymentData);
      return new Response(
        JSON.stringify({ error: paymentData.message || "Erro ao processar pagamento no Mercado Pago" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id.toString(),
        qrCode: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        status: paymentData.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar pagamento" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
