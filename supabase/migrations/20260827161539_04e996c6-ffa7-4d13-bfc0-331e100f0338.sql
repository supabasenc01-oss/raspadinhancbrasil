CREATE TABLE public.scratch_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scratch_card_id uuid NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  result_type text NOT NULL CHECK (result_type IN ('WIN','LOSE')),
  prize_id uuid,
  prize_title text,
  prize_value numeric NOT NULL DEFAULT 0,
  used_credit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scratch_plays TO authenticated;
GRANT ALL ON public.scratch_plays TO service_role;

ALTER TABLE public.scratch_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plays" ON public.scratch_plays
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all plays" ON public.scratch_plays
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE INDEX idx_scratch_plays_card ON public.scratch_plays(scratch_card_id);
CREATE INDEX idx_scratch_plays_user ON public.scratch_plays(user_id);
CREATE INDEX idx_scratch_plays_created ON public.scratch_plays(created_at DESC);

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

CREATE OR REPLACE FUNCTION public.scratch_card_stats()
RETURNS TABLE (
  scratch_card_id uuid,
  card_name text,
  total_plays bigint,
  total_wins bigint,
  total_prize_value numeric,
  prizes_total bigint,
  prizes_remaining bigint,
  last_play_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.id,
    c.name,
    COALESCE(p.total_plays, 0),
    COALESCE(p.total_wins, 0),
    COALESCE(p.total_prize_value, 0),
    COALESCE(pr.prizes_total, 0),
    COALESCE(pr.prizes_remaining, 0),
    p.last_play_at
  FROM public.scratch_cards c
  LEFT JOIN (
    SELECT scratch_card_id,
           count(*) AS total_plays,
           count(*) FILTER (WHERE result_type = 'WIN') AS total_wins,
           SUM(prize_value) AS total_prize_value,
           MAX(created_at) AS last_play_at
    FROM public.scratch_plays GROUP BY scratch_card_id
  ) p ON p.scratch_card_id = c.id
  LEFT JOIN (
    SELECT scratch_card_id,
           SUM(quantity_total)::bigint AS prizes_total,
           SUM(quantity_remaining)::bigint AS prizes_remaining
    FROM public.scratch_card_prizes GROUP BY scratch_card_id
  ) pr ON pr.scratch_card_id = c.id
  WHERE public.is_staff(auth.uid())
  ORDER BY COALESCE(p.total_plays, 0) DESC, c.name;
$$;

CREATE OR REPLACE FUNCTION public.scratch_user_stats()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  total_plays bigint,
  total_wins bigint,
  total_prize_value numeric,
  last_play_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    pl.user_id,
    pf.full_name,
    pf.email,
    count(*) AS total_plays,
    count(*) FILTER (WHERE pl.result_type = 'WIN') AS total_wins,
    SUM(pl.prize_value) AS total_prize_value,
    MAX(pl.created_at) AS last_play_at
  FROM public.scratch_plays pl
  LEFT JOIN public.profiles pf ON pf.id = pl.user_id
  WHERE public.is_staff(auth.uid())
  GROUP BY pl.user_id, pf.full_name, pf.email
  ORDER BY count(*) DESC;
$$;

REVOKE ALL ON FUNCTION public.scratch_card_stats() FROM public;
REVOKE ALL ON FUNCTION public.scratch_user_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.scratch_card_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.scratch_user_stats() TO authenticated;