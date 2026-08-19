import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const activateAllScratchCards = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      const { error } = await supabaseAdmin
        .from('scratch_cards')
        .update({ status: 'ACTIVE' })
        .filter('status', 'neq', 'ACTIVE');
      
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Error activating cards:", err);
      return { success: false, error: err.message };
    }
  });