import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const updateSystemSettings = createServerFn({ method: "POST" })
  .inputValidator((data) => z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
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

      await supabaseAdmin.from('admin_logs').insert({
        action: 'UPDATE_SETTINGS',
        entity: 'system_settings',
        new_data: { keys: data.map(d => d.key) } as any,
        severity: 'INFO'
      });

      return { success: true };
    } catch (error: any) {
      await supabaseAdmin.from('admin_logs').insert({
        action: 'UPDATE_SETTINGS_ERROR',
        entity: 'system_settings',
        severity: 'ERROR',
        new_data: { error: error.message } as any,
        stack_trace: error.stack
      });
      throw error;
    }
  });