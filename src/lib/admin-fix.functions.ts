import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fixDatabasePermissions = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Run SQL to grant permissions as service_role
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
          GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO anon;
          GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
          GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
        `
      });

      if (error) {
         // If exec_sql doesn't exist, we might be in a pinch.
         // Let's try direct grants if the client allows it via query but usually rpc is better for this.
         console.error("Failed to fix permissions via RPC:", error);
         return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Exception fixing permissions:", err);
      return { success: false, error: err.message };
    }
  });
