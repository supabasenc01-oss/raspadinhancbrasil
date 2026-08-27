import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Store = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  sort_order: number;
};

export const storesQuery = queryOptions({
  queryKey: ["stores"],
  staleTime: 1000 * 60,
  queryFn: async (): Promise<Store[]> => {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, code, is_active, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Store[];
  },
});

export function storeName(stores: Store[] | undefined, id: string | null | undefined) {
  if (!id) return "—";
  return stores?.find((store) => store.id === id)?.name ?? "—";
}

/** Normaliza o número do cupom para comparação (mesma regra do índice único no banco). */
export function normalizeReceiptNumber(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
