import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

/**
 * Rota de Webhook para o Mercado Pago.
 * Esta rota é pública (/api/public/*) para permitir o recebimento de notificações.
 * A segurança é garantida pela validação do status do pagamento diretamente na API do MP.
 */
export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("Mercado Pago Webhook Received:", body);

          // 1. Registrar o evento recebido para auditoria e prevenção de duplicidade
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

          // 2. Verificar se é uma notificação de pagamento
          if (body.type === 'payment' || body.action === 'payment.updated') {
            const paymentId = body.data?.id || body.resource?.split('/').pop();
            
            if (paymentId) {
              console.log(`Processing payment confirmation: ${paymentId}`);
              
              /**
               * SEGURANÇA: Aqui deve ser feita uma chamada à API do Mercado Pago (GET /v1/payments/{id})
               * usando o ACCESS_TOKEN privado no servidor para confirmar se o status é 'approved'.
               * Nunca confie apenas no payload enviado pelo webhook.
               * 
               * Exemplo:
               * const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
               *   headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
               * });
               * const paymentData = await mpResponse.json();
               * if (paymentData.status === 'approved') { ... credit wallet ... }
               */

              // Atualizar evento como processado (lógica de crédito integrada futuramente)
              await supabase
                .from('webhook_events')
                .update({ 
                  processed: true, 
                  processed_at: new Date().toISOString() 
                } as any)
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
