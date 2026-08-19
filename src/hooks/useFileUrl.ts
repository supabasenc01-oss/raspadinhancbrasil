import { useQuery } from "@tanstack/react-query";

import { resolveFileUrl } from "@/lib/storage";

export function useFileUrl(value: string | null | undefined, cacheBust?: string) {
  const { data } = useQuery({
    queryKey: ["file-url", value, cacheBust],
    queryFn: () => resolveFileUrl(value, cacheBust),
    enabled: Boolean(value),
    staleTime: cacheBust ? 0 : 1000 * 60 * 30,
  });

  return data ?? null;
}
