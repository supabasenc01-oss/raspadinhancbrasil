
-- Revogando privilégios padrão de execução em funções críticas para segurança
REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM public, anon, authenticated;

-- Garantindo que apenas o service_role (usado pelo serverFn via supabaseAdmin) possa executar
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;

-- Configurando search_path fixo em funções que faltavam (segundo o linter)
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.mask_name(text) SET search_path = public;
