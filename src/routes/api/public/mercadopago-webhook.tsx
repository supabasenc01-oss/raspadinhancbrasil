import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

/**
 * Webhook Route for Mercado Pago.
 * This route is public (/api/public/*) to allow receiving notifications.
 * Security is guaranteed by validating the payment status directly on the MP API.
 */
export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("Mercado Pago Webhook Received:", body);

          // 1. Log the received event for auditing and idempotency
          const { data: event, error: eventError } = await supabase
            .from('webhook_events')
            .insert({
              provider: 'MERCADOPAGO',
              event_id: body.id?.toString() || body.resource || 'unknown',
              event_type: body.type || body.action || 'unknown',
              payload: body
            })
            .select()
            .single();

          if (eventError) {
            console.error("Error logging webhook event:", eventError);
            return new Response('Error logging event', { status: 500 });
          }

          // 2. Check if it's a payment notification
          if (body.type === 'payment' || body.action === 'payment.updated') {
            const paymentId = body.data?.id || body.resource?.split('/').pop();
            
            if (paymentId) {
              console.log(`Processing payment confirmation: ${paymentId}`);
              
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const mpAccessToken = process.env['MERCADOPAGO_ACCESS_TOKEN'];

              if (!mpAccessToken) {
                console.warn("MERCADOPAGO_ACCESS_TOKEN not set, skipping backend verification.");
              } else {
                // SECURITY: Verify payment status directly with Mercado Pago API
                try {
                  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 
                      'Authorization': `Bearer ${mpAccessToken}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (mpResponse.ok) {
                    const paymentData = await mpResponse.json();
                    
                    // 3. If approved, process the credit safely via RPC
                    if (paymentData.status === 'approved') {
                      const externalRef = paymentData.external_reference; // This should be our deposit_id
                      
                      if (externalRef) {
                        // Use process_wallet_transaction to credit the user
                        // We need the user_id associated with the deposit
                        const { data: deposit } = await supabaseAdmin
                          .from('deposits')
                          .select('user_id, amount, status')
                          .eq('id', externalRef)
                          .single();

                        if (deposit && deposit.status === 'PENDING') {
                          await (supabaseAdmin.rpc as any)('process_wallet_transaction', {
                            _user_id: deposit.user_id,
                            _amount: deposit.amount,
                            _type: 'DEPOSIT',
                            _description: `Depósito via Mercado Pago #${paymentId}`,
                            _reference_id: externalRef
                          });

                          await supabaseAdmin
                            .from('deposits')
                            .update({ 
                              status: 'PAID', 
                              external_id: paymentId,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', externalRef);
                        }
                      }
                    }
                  }
                } catch (verifyError) {
                  console.error("Error verifying payment with MP:", verifyError);
                }
              }

              // Update event as processed
              await supabaseAdmin
                .from('webhook_events')
                .update({ 
                  processed: true, 
                  processed_at: new Date().toISOString() 
                })
                .eq('id', event.id);
            }
          }

          return new Response('OK', { status: 200 });
        } catch (error) {
          console.error("Webhook Internal Error:", error);
          return new Response('Internal Error', { status: 500 });
        }
      }
    }
  }
});
