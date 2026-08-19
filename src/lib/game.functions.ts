import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Server function to draw a scratch card result.
 * This ensures the logic is exclusively executed on the backend.
 */
export const playScratchCard = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      cardId: z.string().uuid(),
    }).parse(data)
  )
  .handler(async ({ data, request }) => {
    // In TanStack Start, we need to ensure we have an authenticated user.
    // The middleware check should be added, but for now we rely on Supabase RPC auth context.
    
    // We import the client-server to use the service role or authenticated context correctly
    // However, the RPC call 'draw_scratch_card' is marked as SECURITY DEFINER and 
    // we need to pass the user context.
    
    // For TanStack Start, we should use the supabase server client that has the user session.
    // The integrations/supabase/client.server.ts usually provides this.
    
    const { supabase: supabaseServer } = await import("@/integrations/supabase/client.server");
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      throw new Error("Não autorizado");
    }

    const { data: result, error } = await supabaseServer.rpc("draw_scratch_card", {
      _user_id: user.id,
      _card_id: data.cardId,
    });

    if (error) {
      console.error("Game Draw Error:", error);
      throw new Error(error.message || "Falha ao processar a jogada");
    }

    return result as {
      success: boolean;
      result_type: "WIN" | "LOSE";
      prize?: {
        title: string;
        value: number;
        image_url: string | null;
      };
    };
  });
