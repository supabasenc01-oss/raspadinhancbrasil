REVOKE ALL ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.review_receipt(uuid, boolean, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_receipt(uuid, boolean, integer, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.mask_name(text) FROM public, anon;
