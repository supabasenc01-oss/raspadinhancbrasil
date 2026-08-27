REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_receipt(uuid, boolean, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mask_name(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;