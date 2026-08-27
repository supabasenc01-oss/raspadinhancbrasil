-- 1. STORES ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS stores_code_unique ON public.stores (lower(code));

GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stores_public_read ON public.stores;
CREATE POLICY stores_public_read ON public.stores FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS stores_staff_read ON public.stores;
CREATE POLICY stores_staff_read ON public.stores FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS stores_staff_write ON public.stores;
CREATE POLICY stores_staff_write ON public.stores TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS trg_stores_updated ON public.stores;
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.stores (name, code, sort_order)
VALUES ('Loja A', 'LOJA-A', 1), ('Loja B', 'LOJA-B', 2), ('Loja C', 'LOJA-C', 3)
ON CONFLICT DO NOTHING;

-- 2. LINK SCRATCH CARDS / RECEIPTS -------------------------------------------
ALTER TABLE public.scratch_cards ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scratch_cards_store ON public.scratch_cards (store_id);

ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_store ON public.receipts (store_id);

-- normalized unique receipt number (global: same coupon can never be reused)
DROP INDEX IF EXISTS public.receipts_number_unique;
CREATE UNIQUE INDEX receipts_number_unique
  ON public.receipts (regexp_replace(lower(receipt_number), '[^a-z0-9]', '', 'g'))
  WHERE receipt_number IS NOT NULL AND btrim(receipt_number) <> '';

-- 3. CREDITS PER STORE --------------------------------------------------------
ALTER TABLE public.scratch_credits ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.scratch_credits
SET store_id = (SELECT id FROM public.stores ORDER BY sort_order LIMIT 1)
WHERE store_id IS NULL;

ALTER TABLE public.scratch_credits DROP CONSTRAINT IF EXISTS scratch_credits_pkey;
ALTER TABLE public.scratch_credits ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.scratch_credits ADD CONSTRAINT scratch_credits_pkey PRIMARY KEY (user_id, store_id);

-- 4. REVIEW RECEIPT ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_receipt(_receipt_id uuid, _approve boolean, _credits integer DEFAULT 0, _notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_receipt public.receipts;
  v_credits integer := GREATEST(COALESCE(_credits, 0), 0);
  v_cfg jsonb;
  v_step numeric;
  v_per_step integer;
  v_max integer;
  v_store uuid;
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
    SELECT value INTO v_cfg FROM public.system_settings WHERE key = 'receipts';
    v_step := GREATEST(COALESCE((v_cfg->>'valuePerCredit')::numeric, 100), 1);
    v_per_step := GREATEST(COALESCE((v_cfg->>'creditsPerStep')::int, 2), 1);
    v_max := GREATEST(COALESCE((v_cfg->>'maxCreditsPerReceipt')::int, 50), 1);

    IF v_credits = 0 THEN
      v_credits := LEAST(FLOOR(COALESCE(v_receipt.purchase_value, 0) / v_step)::int * v_per_step, v_max);
    END IF;

    v_store := COALESCE(v_receipt.store_id, (SELECT id FROM public.stores ORDER BY sort_order LIMIT 1));
    IF v_store IS NULL THEN
      RAISE EXCEPTION 'Nenhuma filial cadastrada';
    END IF;

    INSERT INTO public.scratch_credits (user_id, store_id, balance)
    VALUES (v_receipt.user_id, v_store, v_credits)
    ON CONFLICT (user_id, store_id) DO UPDATE SET balance = public.scratch_credits.balance + v_credits;

    UPDATE public.receipts
    SET status = 'APPROVED',
        store_id = v_store,
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

-- 5. DRAW (per-store credits) -----------------------------------------------
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
  v_store uuid;
BEGIN
  SELECT * INTO v_card FROM public.scratch_cards WHERE id = _card_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Raspadinha não disponível ou inativa';
  END IF;

  IF NOT v_card.is_free THEN
    v_store := COALESCE(v_card.store_id, (SELECT id FROM public.stores ORDER BY sort_order LIMIT 1));

    SELECT balance INTO v_balance FROM public.scratch_credits
    WHERE user_id = _user_id AND store_id = v_store FOR UPDATE;

    IF v_balance IS NULL OR v_balance < 1 THEN
      RAISE EXCEPTION 'Você não possui raspadinhas liberadas nesta filial. Envie um cupom fiscal desta loja e aguarde a aprovação.';
    END IF;

    UPDATE public.scratch_credits SET balance = balance - 1
    WHERE user_id = _user_id AND store_id = v_store;
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

      INSERT INTO public.scratch_plays (user_id, scratch_card_id, result_type, prize_id, prize_title, prize_value, used_credit)
      VALUES (_user_id, _card_id, 'WIN', v_prize.id, v_prize.title, v_prize.value, v_used_credit);

      RETURN jsonb_build_object(
        'success', true,
        'result_type', 'WIN',
        'used_credit', v_used_credit,
        'prize', jsonb_build_object('title', v_prize.title, 'value', v_prize.value, 'image_url', v_prize.image_url)
      );
    END IF;
  END LOOP;

  INSERT INTO public.scratch_plays (user_id, scratch_card_id, result_type, used_credit)
  VALUES (_user_id, _card_id, 'LOSE', v_used_credit);

  RETURN jsonb_build_object('success', true, 'result_type', 'LOSE', 'used_credit', v_used_credit);
END;
$function$;

-- 6. SETTINGS ----------------------------------------------------------------
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES ('show_public_prizes', 'true'::jsonb, 'Exibir lista de prêmios disponíveis para visitantes', true)
ON CONFLICT (key) DO NOTHING;

UPDATE public.system_settings
SET value = value || jsonb_build_object('creditsPerStep', COALESCE(value->'creditsPerStep', '2'::jsonb), 'maxCreditsPerReceipt', COALESCE(value->'maxCreditsPerReceipt', '50'::jsonb))
WHERE key = 'receipts';