CREATE OR REPLACE FUNCTION public.admin_update_receipt(
  _receipt_id uuid,
  _status text,
  _purchase_value numeric DEFAULT NULL,
  _credits integer DEFAULT NULL,
  _notes text DEFAULT NULL,
  _store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_receipt public.receipts;
  v_store uuid;
  v_new_status text;
  v_new_credits integer;
  v_old_effective integer;
  v_delta integer;
  v_balance integer;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  v_new_status := upper(COALESCE(_status, ''));
  IF v_new_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Situação inválida: %', _status;
  END IF;

  SELECT * INTO v_receipt FROM public.receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupom não encontrado';
  END IF;

  v_store := COALESCE(_store_id, v_receipt.store_id, (SELECT id FROM public.stores ORDER BY sort_order LIMIT 1));

  v_new_credits := GREATEST(COALESCE(_credits, v_receipt.credits_granted), 0);
  IF v_new_status <> 'APPROVED' THEN
    v_new_credits := 0;
  END IF;

  v_old_effective := CASE WHEN v_receipt.status = 'APPROVED' THEN COALESCE(v_receipt.credits_granted, 0) ELSE 0 END;
  v_delta := v_new_credits - v_old_effective;

  IF v_delta <> 0 THEN
    IF v_store IS NULL THEN
      RAISE EXCEPTION 'Nenhuma filial cadastrada';
    END IF;

    INSERT INTO public.scratch_credits (user_id, store_id, balance)
    VALUES (v_receipt.user_id, v_store, GREATEST(v_delta, 0))
    ON CONFLICT (user_id, store_id) DO UPDATE
      SET balance = GREATEST(public.scratch_credits.balance + v_delta, 0);

    SELECT balance INTO v_balance FROM public.scratch_credits
    WHERE user_id = v_receipt.user_id AND store_id = v_store;
  END IF;

  UPDATE public.receipts
  SET purchase_value = COALESCE(_purchase_value, purchase_value),
      credits_granted = v_new_credits,
      status = v_new_status,
      store_id = v_store,
      review_notes = COALESCE(_notes, review_notes),
      reviewed_by = auth.uid(),
      reviewed_at = CASE WHEN v_new_status = 'PENDING' THEN NULL ELSE now() END
  WHERE id = _receipt_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_receipt.user_id,
    'Cupom fiscal atualizado',
    CASE
      WHEN v_new_status = 'APPROVED' THEN 'Seu cupom fiscal foi atualizado e você tem ' || v_new_credits || ' raspadinha(s) liberada(s).'
      WHEN v_new_status = 'REJECTED' THEN COALESCE(_notes, 'Seu cupom fiscal foi reprovado após revisão.')
      ELSE 'Seu cupom fiscal voltou para análise.'
    END,
    CASE WHEN v_new_status = 'APPROVED' THEN 'SUCCESS' ELSE 'WARNING' END
  );

  INSERT INTO public.admin_logs (actor_id, action, entity, entity_id, old_data, new_data)
  VALUES (
    auth.uid(), 'UPDATE_RECEIPT', 'receipts', _receipt_id,
    jsonb_build_object('status', v_receipt.status, 'credits', v_receipt.credits_granted, 'purchase_value', v_receipt.purchase_value),
    jsonb_build_object('status', v_new_status, 'credits', v_new_credits, 'purchase_value', COALESCE(_purchase_value, v_receipt.purchase_value), 'notes', _notes)
  );

  RETURN jsonb_build_object('success', true, 'status', v_new_status, 'credits', v_new_credits, 'balance', v_balance);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_receipt(uuid, text, numeric, integer, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_receipt(uuid, text, numeric, integer, text, uuid) TO authenticated;