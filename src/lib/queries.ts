import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ScratchCard = Database["public"]["Tables"]["scratch_cards"]["Row"];
export type ScratchCardPrize = Database["public"]["Tables"]["scratch_card_prizes"]["Row"];
export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export const publicScratchCardsQuery = queryOptions({
  queryKey: ["scratch-cards", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("scratch_cards")
      .select("*")
      .eq("status", "ACTIVE")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data satisfies ScratchCard[];
  },
});

export const featuredScratchCardsQuery = queryOptions({
  queryKey: ["scratch-cards", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("scratch_cards")
      .select("*")
      .eq("status", "ACTIVE")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data satisfies ScratchCard[];
  },
});

export function scratchCardBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["scratch-card", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scratch_cards")
        .select("*, scratch_card_prizes(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export const heroBannersQuery = queryOptions({
  queryKey: ["banners", "home-hero"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .eq("position", "HOME_HERO")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data satisfies Banner[];
  },
});

export const adminScratchCardsQuery = queryOptions({
  queryKey: ["admin", "scratch-cards"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("scratch_cards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data satisfies ScratchCard[];
  },
});

export const adminProfilesQuery = queryOptions({
  queryKey: ["admin", "profiles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },
});

export const adminPrizesQuery = queryOptions({
  queryKey: ["admin", "prizes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("scratch_card_prizes")
      .select("*, scratch_cards(name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const adminBannersQuery = queryOptions({
  queryKey: ["admin", "banners"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data satisfies Banner[];
  },
});

export const adminLogsQuery = queryOptions({
  queryKey: ["admin", "logs"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },
});

export const systemSettingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export function userNotificationsQuery(userId: string) {
  return queryOptions({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}
