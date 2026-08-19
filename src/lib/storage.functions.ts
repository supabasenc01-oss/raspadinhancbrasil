import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PlatformBucket } from "./storage";

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
  .handler(async ({ data }): Promise<{ path: string | null; thumbnailPath?: string | null; error: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Import sharp dynamically to avoid bundling issues in browser if this file were accidentally imported
      const sharp = (await import('sharp')).default;

      // Decode base64 to buffer
      const buffer = Buffer.from(data.base64Data, 'base64');
      const extension = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
      const uuid = crypto.randomUUID();
      const finalFileName = `${uuid}.${extension}`;
      const objectPath = data.prefix ? `${data.prefix}/${finalFileName}` : finalFileName;

      // Image processing logic
      let processedBuffer = buffer;
      let contentType = data.fileType;

      // Only process if it's a common image type and not SVG
      const isProcessableImage = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(data.fileType.toLowerCase());

      if (isProcessableImage) {
        // 1. Optimize main image (resize if too large, e.g., max 1920px width)
        processedBuffer = await sharp(buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        
        // We convert to webp for better compression
        contentType = 'image/webp';
      }

      // Upload main image
      const finalPath = isProcessableImage ? objectPath.replace(new RegExp(`\\.${extension}$`), '.webp') : objectPath;
      
      const { error } = await supabaseAdmin.storage.from(data.bucket).upload(finalPath, processedBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

      if (error) {
        console.error("Storage admin upload error details:", error);
        return { path: null, error: error.message };
      }

      let thumbnailPath = null;
      
      // 2. Generate Thumbnail (e.g., max 400px width)
      if (isProcessableImage) {
        try {
          const thumbBuffer = await sharp(buffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 70 })
            .toBuffer();

          const thumbName = `${uuid}_thumb.webp`;
          const thumbObjectPath = data.prefix ? `${data.prefix}/${thumbName}` : thumbName;

          const { error: thumbError } = await supabaseAdmin.storage.from(data.bucket).upload(thumbObjectPath, thumbBuffer, {
            contentType: 'image/webp',
            cacheControl: "31536000",
            upsert: false,
          });

          if (!thumbError) {
            thumbnailPath = `${data.bucket}/${thumbObjectPath}`;
          }
        } catch (thumbErr) {
          console.error("Thumbnail generation error:", thumbErr);
          // Don't fail the main upload if thumbnail fails
        }
      }
      
      // Store as "bucket/path" format so resolveFileUrl can handle it
      return { 
        path: `${data.bucket}/${finalPath}`, 
        thumbnailPath,
        error: null 
      };
    } catch (err: any) {
      console.error("Admin upload exception:", err);
      return { path: null, error: err.message };
    }
  });
