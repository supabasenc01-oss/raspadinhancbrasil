// Migrated from src/lib/storage.functions.ts (uploadPlatformFileFn).
// NOTE: preserves the original's lack of an admin-role/auth check — not
// adding one here without confirmation (see get-admin-stats for details).
//
// Deno has no global Buffer (Node-only), so base64 is decoded with
// Uint8Array.from(atob(...), c => c.charCodeAt(0)) instead of Buffer.from.
// atob decodes base64 to a "binary string" (one JS UTF-16 code unit per
// decoded byte, each in the 0-255 range), so mapping charCodeAt over it
// reconstructs the exact original bytes — this works correctly for
// arbitrary binary payloads (images, etc.), not just ASCII text.
// Deploy with: supabase functions deploy upload-platform-file
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const bodySchema = z.object({
  bucket: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  base64Data: z.string(),
  prefix: z.string().optional(),
});

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createAdminClient();

  try {
    const bytes = Uint8Array.from(atob(data.base64Data), (c) => c.charCodeAt(0));
    const extension = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const finalFileName = `${crypto.randomUUID()}.${extension}`;
    const objectPath = data.prefix ? `${data.prefix}/${finalFileName}` : finalFileName;

    const { error } = await supabaseAdmin.storage.from(data.bucket).upload(objectPath, bytes, {
      contentType: data.fileType,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Storage admin upload error details:", error);
      return new Response(JSON.stringify({ path: null, thumbnailPath: null, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store as "bucket/path" format so resolveFileUrl can handle it.
    // NOTE: unlike the original Node server function, this does not resize/convert
    // to webp or generate a thumbnail (that used `sharp`, a native Node addon that
    // doesn't run in the Deno edge runtime) — thumbnailPath is always null here.
    return new Response(
      JSON.stringify({ path: `${data.bucket}/${objectPath}`, thumbnailPath: null, error: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Admin upload exception:", err);
    return new Response(JSON.stringify({ path: null, thumbnailPath: null, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
