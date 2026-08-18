import { useQuery } from "@tanstack/react-query";

import { resolveFileUrl } from "@/lib/storage";

export function useFileUrl(value: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["file-url", value],
    queryFn: () => resolveFileUrl(value),
    enabled: Boolean(value),
    staleTime: 1000 * 60 * 30,
  });

  return data ?? null;
}
