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
export async function resolveFileUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/.test(value)) return value;

  const parts = value.split("/");
  if (parts.length < 2) return value; 

  const bucket = parts[0];
  const path = parts.slice(1).join("/");

  if (!bucket || !path) return value;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl ?? null;

  // Se estivermos em um Supabase externo, a URL pública padrão pode não funcionar devido ao proxy
  // Vamos tentar garantir que a URL aponta para o domínio do projeto se estivermos no Lovable
  if (publicUrl && typeof window !== 'undefined' && window.location.hostname.includes('lovableproject.com')) {
    try {
      const url = new URL(publicUrl);
      if (url.hostname.includes('supabase.co')) {
        // Tenta usar a URL direta do Supabase se o proxy falhar
        return publicUrl;
      }
    } catch (e) {}
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
