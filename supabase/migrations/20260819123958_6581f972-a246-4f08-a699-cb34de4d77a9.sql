-- Fix Security Linter Warnings for draw_scratch_card
-- Only authenticated users should call this, but PostgREST runs as the user.
-- However, we want to ensure it's not public to anon.
REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(UUID, UUID) TO authenticated;
