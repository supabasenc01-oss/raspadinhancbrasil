ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.scratch_cards ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Re-grant permissions
GRANT UPDATE, SELECT ON public.banners TO authenticated;
GRANT UPDATE, SELECT ON public.scratch_cards TO authenticated;
GRANT UPDATE, SELECT ON public.system_settings TO authenticated;
GRANT UPDATE, SELECT ON public.banners TO service_role;
GRANT UPDATE, SELECT ON public.scratch_cards TO service_role;
GRANT UPDATE, SELECT ON public.system_settings TO service_role;
