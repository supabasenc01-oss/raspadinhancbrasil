
-- Revogando privilégios de execução de TODAS as funções SECURITY DEFINER para usuários normais e anônimos.
-- Elas serão executadas apenas via service_role (supabaseAdmin) em Server Functions.

REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM public, anon, authenticated;

-- Grant apenas para service_role
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO service_role;

-- search_path para as que faltam
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_user_wallet() SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public;
