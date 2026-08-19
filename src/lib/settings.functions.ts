import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateSystemSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    
    try {
      const keys = data.map(d => d.key);
      
      // Fetch current values for audit log
      const { data: currentSettings } = await supabaseAdmin
        .from("system_settings")
        .select("key, value")
        .in("key", keys);

      const oldValues: Record<string, any> = {};
      currentSettings?.forEach(s => {
        oldValues[s.key] = s.value;
      });

      const newValues: Record<string, any> = {};
      
      for (const setting of data) {
        const parsedValue = JSON.parse(setting.value);
        newValues[setting.key] = parsedValue;

        const { error } = await supabaseAdmin
          .from("system_settings")
          .upsert({ 
            key: setting.key, 
            value: parsedValue,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        
        if (error) throw error;
      }

      // Record Audit Log
      await supabaseAdmin.from('admin_logs').insert({
        action: 'UPDATE_SETTINGS',
        entity: 'system_settings',
        actor_id: userId,
        old_data: oldValues,
        new_data: newValues,
        severity: 'INFO'
      });

      return { success: true };
    } catch (error: any) {
      await supabaseAdmin.from('admin_logs').insert({
        action: 'UPDATE_SETTINGS_ERROR',
        entity: 'system_settings',
        actor_id: userId,
        severity: 'ERROR',
        new_data: { error: error.message },
      });
      throw error;
    }
  });
