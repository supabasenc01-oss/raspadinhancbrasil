// Supabase Edge Function — Mercado Pago webhook receiver.
//
// Migrated from src/routes/api/public/mercadopago-webhook.tsx: the app's
// front end is now a static SPA (deployed on Hostinger shared hosting, no
// Node.js runtime), so this webhook — which needs a server to run — lives
// here instead. Deploy with:
//   supabase functions deploy mercadopago-webhook --no-verify-jwt
// and point Mercado Pago's notification URL at:
//   https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook
//
// Required secrets (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MERCADOPAGO_ACCESS_TOKEN
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the
// Supabase platform into every edge function already.)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    console.log("Mercado Pago Webhook Received:", body);

    const eventId = body.id?.toString() || body.resource || "unknown";
    const eventType = body.type || body.action || "unknown";

    // 1. Log the received event for auditing and idempotency.
    const { data: existingEvent } = await supabaseAdmin
      .from("webhook_events")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      console.log(`Webhook event ${eventId} already processed, skipping.`);
      return new Response("OK", { status: 200 });
    }

    const { error: eventError } = await supabaseAdmin
      .from("webhook_events")
      .upsert(
        {
          provider: "MERCADOPAGO",
          event_id: eventId,
          event_type: eventType,
          payload: body,
          processed: false,
        },
        { onConflict: "event_id" },
      )
      .select()
      .single();

    if (eventError) {
      console.error("Error logging webhook event:", eventError);
      return new Response("Error logging event", { status: 500 });
    }

    // 2. Check if it's a payment notification.
    if (body.type === "payment" || body.action === "payment.updated") {
      const paymentId = body.data?.id || body.resource?.split("/").pop();

      if (paymentId) {
        console.log(`Processing payment confirmation: ${paymentId}`);

        if (!MERCADOPAGO_ACCESS_TOKEN) {
          console.warn("MERCADOPAGO_ACCESS_TOKEN not set, skipping backend verification.");
        } else {
          // SECURITY: Verify payment status directly with Mercado Pago API.
          try {
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
              headers: {
                Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            });

            if (mpResponse.ok) {
              const paymentData = await mpResponse.json();

              // 3. If approved, process the credit safely via RPC.
              if (paymentData.status === "approved") {
                const externalRef = paymentData.external_reference; // our deposit_id

                if (externalRef) {
                  const { data: deposit } = await supabaseAdmin
                    .from("deposits")
                    .select("user_id, amount, status")
                    .eq("id", externalRef)
                    .single();

                  if (deposit && deposit.status === "PENDING") {
                    // deno-lint-ignore no-explicit-any
                    await (supabaseAdmin.rpc as any)("process_wallet_transaction", {
                      _user_id: deposit.user_id,
                      _amount: deposit.amount,
                      _type: "DEPOSIT",
                      _description: `Depósito via Mercado Pago #${paymentId}`,
                      _reference_id: externalRef,
                    });

                    await supabaseAdmin
                      .from("deposits")
                      .update({
                        status: "PAID",
                        external_id: paymentId,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", externalRef);
                  }
                }
              }
            }
          } catch (verifyError) {
            console.error("Error verifying payment with MP:", verifyError);
          }
        }

        // Update event as processed.
        await supabaseAdmin
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("event_id", eventId);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook Internal Error:", error);
    return new Response("Internal Error", { status: 500 });
  }
});
