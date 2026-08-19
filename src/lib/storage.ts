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

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  let publicUrl = data?.publicUrl ?? null;

  // Garantir que a URL aponta para o domínio direto do Supabase se estivermos no ambiente do Lovable
  // Isso resolve problemas de resolução de proxy no sandbox
  if (publicUrl && typeof window !== 'undefined') {
    try {
      const url = new URL(publicUrl);
      // Sempre forçar o domínio direto do Supabase para o Storage se estiver no sandbox Lovable ou em qualquer domínio .lovable.app
      if (true) { // Always force direct URL for better reliability in preview/custom domains
        const projectRef = "endmonqujwhbprzprwjh";
        publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${path}`;
      }
    } catch (e) {}
  }

  if (publicUrl && cacheBust) {
    const separator = publicUrl.includes('?') ? '&' : '?';
    publicUrl = `${publicUrl}${separator}v=${cacheBust}`;
  }

  return publicUrl;
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
