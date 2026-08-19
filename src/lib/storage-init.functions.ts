import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const ensureStorageBuckets = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const buckets = ['avatars', 'scratch-cards', 'scratch-cards-backgrounds', 'prizes', 'banners', 'logos'];
    const results = [];

    try {
      for (const bucket of buckets) {
        // Check if bucket exists
        const { data, error: getError } = await supabaseAdmin.storage.getBucket(bucket);
        
        if (getError && getError.message.includes('not found')) {
          console.log(`Bucket ${bucket} not found, creating...`);
          const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (createError) {
            results.push({ bucket, status: 'error', message: createError.message });
          } else {
            results.push({ bucket, status: 'created' });
          }
        } else if (getError) {
          results.push({ bucket, status: 'error', message: getError.message });
        } else {
          results.push({ bucket, status: 'exists' });
        }
      }

      return { success: true, results };
    } catch (err: any) {
      console.error("Exception creating buckets:", err);
      return { success: false, error: err.message };
    }
  });
