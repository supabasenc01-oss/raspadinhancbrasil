import { useQuery } from "@tanstack/react-query";

import { resolveFileUrl } from "@/lib/storage";

export function useFileUrl(value: string | null | undefined, cacheBust?: string, preferThumbnail = false) {
  const { data } = useQuery({
    queryKey: ["file-url", value, cacheBust, preferThumbnail],
    queryFn: async () => {
      if (!value) return null;
      
      // If we prefer a thumbnail and this is a Storage path (e.g., "bucket/path/file.webp")
      // we check for the standard thumb name pattern we implemented: "file_thumb.webp"
      if (preferThumbnail && !value.includes('data:') && !value.includes('blob:') && !value.startsWith('http')) {
        const parts = value.split('.');
        if (parts.length > 1) {
          const extension = parts.pop();
          const thumbPath = `${parts.join('.')}_thumb.${extension}`;
          
          // Try to resolve the thumbnail URL
          const thumbUrl = await resolveFileUrl(thumbPath, cacheBust);
          
          // Note: resolveFileUrl currently doesn't check if the file actually exists, 
          // it just constructs the URL. In a real scenario, we might want to verify existence
          // or rely on the fact that we generate thumbnails consistently.
          if (thumbUrl) return thumbUrl;
        }
      }
      
      return resolveFileUrl(value, cacheBust);
    },
    enabled: Boolean(value),
    staleTime: cacheBust ? 0 : 1000 * 60 * 30,
  });

  return data ?? null;
}
