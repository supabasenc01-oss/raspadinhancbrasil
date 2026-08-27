CREATE OR REPLACE FUNCTION public.draw_scratch_card(_user_id uuid, _card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_card public.scratch_cards;
  v_prize public.scratch_card_prizes;
  v_random_val numeric;
  v_current_prob numeric := 0;
  v_user_name text;
  v_used_credit boolean := false;
  v_balance integer;
BEGIN
  SELECT * INTO v_card FROM public.scratch_cards WHERE id = _card_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Raspadinha não disponível ou inativa';
  END IF;

  IF NOT v_card.is_free THEN
    SELECT balance INTO v_balance FROM public.scratch_credits WHERE user_id = _user_id FOR UPDATE;

    IF v_balance IS NULL OR v_balance < 1 THEN
      RAISE EXCEPTION 'Você não possui raspadinhas liberadas. Envie um cupom fiscal e aguarde a aprovação do administrador.';
    END IF;

    UPDATE public.scratch_credits SET balance = balance - 1 WHERE user_id = _user_id;
    v_used_credit := true;
  END IF;

  v_random_val := random();

  FOR v_prize IN
    SELECT * FROM public.scratch_card_prizes
    WHERE scratch_card_id = _card_id
      AND is_active = true
      AND quantity_remaining > 0
      AND probability > 0
    ORDER BY value DESC
  LOOP
    v_current_prob := v_current_prob + v_prize.probability;

    IF v_random_val <= v_current_prob THEN
      UPDATE public.scratch_card_prizes
      SET quantity_remaining = quantity_remaining - 1
      WHERE id = v_prize.id AND quantity_remaining > 0;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      IF v_prize.value > 0 THEN
        PERFORM public.process_wallet_transaction(
          _user_id, v_prize.value, 'PRIZE', v_prize.id,
          'Prêmio na raspadinha: ' || v_card.name
        );
      END IF;

      SELECT COALESCE(full_name, 'Usuário') INTO v_user_name FROM public.profiles WHERE id = _user_id;

      INSERT INTO public.winners (scratch_card_id, user_id, winner_name, prize_title, prize_value)
      VALUES (_card_id, _user_id, public.mask_name(COALESCE(v_user_name, 'Usuário')), v_prize.title, v_prize.value);

      RETURN jsonb_build_object(
        'success', true,
        'result_type', 'WIN',
        'used_credit', v_used_credit,
        'prize', jsonb_build_object('title', v_prize.title, 'value', v_prize.value, 'image_url', v_prize.image_url)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'result_type', 'LOSE', 'used_credit', v_used_credit);
END;
$function$;

CREATE OR REPLACE FUNCTION public.review_receipt(_receipt_id uuid, _approve boolean, _credits integer DEFAULT 0, _notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_receipt public.receipts;
  v_credits integer := GREATEST(COALESCE(_credits, 0), 0);
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  SELECT * INTO v_receipt FROM public.receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupom não encontrado';
  END IF;

  IF v_receipt.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Cupom já analisado';
  END IF;

  IF _approve THEN
    IF v_credits = 0 THEN
      v_credits := FLOOR(COALESCE(v_receipt.purchase_value, 0) / 100)::int * 2;
    END IF;

    INSERT INTO public.scratch_credits (user_id, balance)
    VALUES (v_receipt.user_id, v_credits)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.scratch_credits.balance + v_credits;

    UPDATE public.receipts
    SET status = 'APPROVED',
        credits_granted = v_credits,
        review_notes = _notes,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = _receipt_id;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_receipt.user_id, 'Cupom aprovado!',
            'Seu cupom fiscal foi aprovado e você liberou ' || v_credits || ' raspadinha(s).', 'SUCCESS');
  ELSE
    UPDATE public.receipts
    SET status = 'REJECTED',
        credits_granted = 0,
        review_notes = _notes,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = _receipt_id;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_receipt.user_id, 'Cupom reprovado',
            COALESCE(_notes, 'Seu cupom fiscal não pôde ser aprovado.'), 'WARNING');
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, entity, entity_id, new_data, ip_address)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'APPROVE_RECEIPT' ELSE 'REJECT_RECEIPT' END,
          'receipts', _receipt_id, jsonb_build_object('credits', v_credits, 'notes', _notes), NULL);

  RETURN jsonb_build_object('success', true, 'credits', v_credits);
END;
$function$;