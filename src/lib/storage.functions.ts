import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PlatformBucket } from "./storage";

export const uploadPlatformFileFn = createServerFn({ method: "POST" })
  .inputValidator((data: any) => 
    z.object({
      bucket: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      base64Data: z.string(),
      prefix: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }): Promise<{ path: string | null; error: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Decode base64 to buffer
      const buffer = Buffer.from(data.base64Data, 'base64');
      const extension = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
      const finalFileName = `${crypto.randomUUID()}.${extension}`;
      const objectPath = data.prefix ? `${data.prefix}/${finalFileName}` : finalFileName;

      const { error } = await supabaseAdmin.storage.from(data.bucket).upload(objectPath, buffer, {
        contentType: data.fileType,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Storage admin upload error details:", error);
        return { path: null, error: error.message };
      }
      
      // Store as "bucket/path" format so resolveFileUrl can handle it
      return { path: `${data.bucket}/${objectPath}`, error: null };
    } catch (err: any) {
      console.error("Admin upload exception:", err);
      return { path: null, error: err.message };
    }
  });
