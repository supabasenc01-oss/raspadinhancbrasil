import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("Mercado Pago Webhook Received:", body);

          // 1. Registrar evento do webhook
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

          if (eventError) throw eventError;

          // 2. Processar se for um pagamento
          if (body.type === 'payment' || body.action === 'payment.updated') {
             const paymentId = body.data?.id || body.resource?.split('/').pop();
             
             if (paymentId) {
                // Aqui no mundo real:
                // a. Consultar Mercado Pago API para validar status real (segurança)
                // b. Identificar o 'deposit' pelo external_reference
                // c. Se status === 'approved', chamar RPC process_wallet_transaction
                
                console.log(`Processing payment confirmation: ${paymentId}`);
                
                // Exemplo de atualização (lógica simplificada para a etapa)
                // Marcamos o evento como processado
                await supabase
                  .from('webhook_events')
                  .update({ processed: true, processed_at: new Date().toISOString() })
                  .eq('id', event.id);
             }
          }

          return new Response('OK', { status: 200 });
        } catch (error) {
          console.error("Webhook Error:", error);
          return new Response('Error', { status: 500 });
        }
      }
    }
  }
});
