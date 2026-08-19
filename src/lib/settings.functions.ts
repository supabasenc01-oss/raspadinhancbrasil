import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const updateSystemSettings = createServerFn({ method: "POST" })
  .inputValidator((data) => z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).parse(data))
  .handler(async ({ data }) => {
    for (const setting of data) {
      const { error } = await supabaseAdmin
        .from("system_settings")
        .upsert({ 
          key: setting.key, 
          value: JSON.parse(setting.value),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
    }
    return { success: true };
  });
