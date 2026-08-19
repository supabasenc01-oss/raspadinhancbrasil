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
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      throw new Error("Não autorizado");
    }

    const { data: result, error } = await supabaseAdmin.rpc("draw_scratch_card", {
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
