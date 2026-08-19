import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


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
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      throw new Error("Não autorizado");
    }

    // Wrap in a transaction-like block (RPC draw_scratch_card already uses FOR UPDATE and transactions)
    // In Stage 3, we ensure the wallet is checked before calling draw_scratch_card if it's not a free play
    
    const { data: result, error } = await (supabaseAdmin.rpc as any)("draw_scratch_card", {
      _user_id: user.id,
      _card_id: data.cardId,
    });

    if (error) {
      console.error("Game Draw Error:", error);
      // Check for specific insufficient funds error from DB
      if (error.message?.includes("Insufficient funds")) {
        throw new Error("Saldo insuficiente na carteira.");
      }
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
