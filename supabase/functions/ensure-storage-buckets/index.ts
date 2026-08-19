// Migrated from src/lib/storage-init.functions.ts (ensureStorageBuckets).
// Idempotent bucket-creation helper — no input body required.
// NOTE: preserves the original's lack of an admin-role/auth check — not
// adding one here without confirmation (see get-admin-stats for details).
// Deploy with: supabase functions deploy ensure-storage-buckets
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const BUCKETS = ["avatars", "scratch-cards", "scratch-cards-backgrounds", "prizes", "banners", "logos"];

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseAdmin = createAdminClient();
  const results: { bucket: string; status: string; message?: string }[] = [];

  try {
    for (const bucket of BUCKETS) {
      const { error: getError } = await supabaseAdmin.storage.getBucket(bucket);

      if (getError && getError.message.includes("not found")) {
        console.log(`Bucket ${bucket} not found, creating...`);
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) {
          results.push({ bucket, status: "error", message: createError.message });
        } else {
          results.push({ bucket, status: "created" });
        }
      } else if (getError) {
        results.push({ bucket, status: "error", message: getError.message });
      } else {
        results.push({ bucket, status: "exists" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Exception creating buckets:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
