import { supabase } from "@/integrations/supabase/client";

export type PlatformBucket =
  | "avatars"
  | "scratch-cards"
  | "scratch-cards-backgrounds"
  | "prizes"
  | "banners"
  | "logos";

/**
 * Os buckets são privados: valores salvos como caminho do arquivo
 * ("bucket/pasta/arquivo.png") são convertidos em URL assinada.
 * URLs completas (http/https) são retornadas como estão.
 */
export async function resolveFileUrl(value: string | null | undefined, cacheBust?: string): Promise<string | null> {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/.test(value)) return value;

  const parts = value.split("/");
  if (parts.length < 2) return value; 

  const bucket = parts[0];
  const path = parts.slice(1).join("/");

  if (!bucket || !path) return value;

  // Buckets são privados nesta plataforma: geramos uma URL assinada.
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;

  let signedUrl = data.signedUrl;
  if (cacheBust) {
    const separator = signedUrl.includes("?") ? "&" : "?";
    signedUrl = `${signedUrl}${separator}v=${cacheBust}`;
  }

  return signedUrl;
}

export async function uploadPlatformFile(
  bucket: PlatformBucket,
  file: File,
  prefix?: string,
): Promise<{ path: string | null; error: string | null }> {
  try {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const objectPath = prefix ? `${prefix}/${fileName}` : fileName;

    const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Storage upload error details:", error);
      return { path: null, error: error.message };
    }
    
    // Store as "bucket/path" for private signed URL resolution or public access
    return { path: `${bucket}/${objectPath}`, error: null };
  } catch (err: any) {
    console.error("Upload exception:", err);
    return { path: null, error: err.message };
  }
}
