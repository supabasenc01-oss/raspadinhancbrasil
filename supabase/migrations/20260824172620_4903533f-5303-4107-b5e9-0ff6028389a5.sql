-- 1. Créditos de raspadinha
CREATE TABLE IF NOT EXISTS public.scratch_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scratch_credits TO authenticated;
GRANT ALL ON public.scratch_credits TO service_role;
ALTER TABLE public.scratch_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scratch_credits_select_own" ON public.scratch_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "scratch_credits_select_staff" ON public.scratch_credits
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_scratch_credits_updated BEFORE UPDATE ON public.scratch_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Cupons fiscais
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  store_name text,
  purchase_value numeric(12,2) NOT NULL DEFAULT 0,
  purchase_date date,
  receipt_number text,
  status text NOT NULL DEFAULT 'PENDING',
  credits_granted integer NOT NULL DEFAULT 0,
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS receipts_number_unique
  ON public.receipts (lower(receipt_number)) WHERE receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS receipts_user_idx ON public.receipts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS receipts_status_idx ON public.receipts (status, created_at DESC);

GRANT SELECT, INSERT ON public.receipts TO authenticated;
GRANT UPDATE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select_own" ON public.receipts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "receipts_insert_own" ON public.receipts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "receipts_select_staff" ON public.receipts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "receipts_update_staff" ON public.receipts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Regras configuráveis
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES (
  'receipts',
  jsonb_build_object(
    'enabled', true,
    'valuePerCredit', 100,
    'maxCreditsPerReceipt', 5,
    'instructions', 'Envie a foto do seu cupom fiscal do supermercado. A cada R$ 100,00 em compras você libera 1 raspadinha após a aprovação da nossa equipe.'
  ),
  'Regras de liberação de raspadinhas por cupom fiscal',
  true
)
ON CONFLICT (key) DO NOTHING;

-- 4. Análise do cupom (staff)
CREATE OR REPLACE FUNCTION public.review_receipt(
  _receipt_id uuid,
  _approve boolean,
  _credits integer DEFAULT 0,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.review_receipt(uuid, boolean, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.review_receipt(uuid, boolean, integer, text) TO authenticated;

-- 5. Sorteio compatível com o schema atual + consumo de créditos de cupom
CREATE OR REPLACE FUNCTION public.draw_scratch_card(_user_id uuid, _card_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card public.scratch_cards;
  v_prize public.scratch_card_prizes;
  v_random_val numeric;
  v_current_prob numeric := 0;
  v_user_name text;
  v_used_credit boolean := false;
BEGIN
  SELECT * INTO v_card FROM public.scratch_cards WHERE id = _card_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Raspadinha não disponível ou inativa';
  END IF;

  -- Consome primeiro um crédito liberado por cupom fiscal
  IF NOT v_card.is_free THEN
    UPDATE public.scratch_credits
    SET balance = balance - 1
    WHERE user_id = _user_id AND balance > 0;
    v_used_credit := FOUND;

    IF NOT v_used_credit AND v_card.price > 0 THEN
      PERFORM public.process_wallet_transaction(
        _user_id, -v_card.price, 'PURCHASE', _card_id,
        'Compra de raspadinha: ' || v_card.name
      );
    END IF;
  END IF;

  v_random_val := random();

  FOR v_prize IN
    SELECT * FROM public.scratch_card_prizes
    WHERE scratch_card_id = _card_id AND is_active = true AND quantity_remaining > 0
    ORDER BY value DESC
  LOOP
    v_current_prob := v_current_prob + v_prize.probability;

    IF v_random_val <= v_current_prob THEN
      UPDATE public.scratch_card_prizes
      SET quantity_remaining = quantity_remaining - 1
      WHERE id = v_prize.id;

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
$$;
