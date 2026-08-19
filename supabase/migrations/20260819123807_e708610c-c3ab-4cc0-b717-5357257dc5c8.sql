-- Fix Security Linter Warnings

-- 1. Set search_path for SECURITY DEFINER functions to prevent search_path injection
ALTER FUNCTION public.handle_new_user_wallet() SET search_path = public;
ALTER FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) SET search_path = public;

-- 2. Restrict execution of SECURITY DEFINER functions
-- These functions should only be executed by the system (triggers/service_role)
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_new_user_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) TO service_role;
