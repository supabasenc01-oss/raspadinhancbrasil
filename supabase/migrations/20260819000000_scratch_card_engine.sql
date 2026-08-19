-- ETAPA 2: Motor de Raspadinhas e Prêmios

-- 1. Tabelas Adicionais e Ajustes

-- Tabela de resultados de raspadinhas (Idempotência e Histórico)
CREATE TABLE public.scratch_card_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
    prize_id UUID REFERENCES public.scratch_card_prizes(id) ON DELETE SET NULL,
    result_type TEXT NOT NULL CHECK (result_type IN ('WIN', 'LOSE')),
    prize_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    configuration_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scratch_results_user ON public.scratch_card_results (user_id);
CREATE INDEX idx_scratch_results_card ON public.scratch_card_results (scratch_card_id);

GRANT SELECT ON public.scratch_card_results TO authenticated;
GRANT ALL ON public.scratch_card_results TO service_role;
ALTER TABLE public.scratch_card_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_select_own" ON public.scratch_card_results FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "results_staff_read" ON public.scratch_card_results FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Tabela de sessões de raspadinhas (Idempotência / Pre-lock)
CREATE TABLE public.scratch_card_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
    UNIQUE(user_id, scratch_card_id, status) -- Apenas uma pendente por vez
);

GRANT SELECT, INSERT, UPDATE ON public.scratch_card_sessions TO authenticated;
GRANT ALL ON public.scratch_card_sessions TO service_role;
ALTER TABLE public.scratch_card_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.scratch_card_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON public.scratch_card_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Tabela de ganhadores (Visualização pública)
CREATE TABLE public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES public.scratch_card_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES public.scratch_card_prizes(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_winners_created ON public.winners (created_at DESC);

GRANT SELECT ON public.winners TO anon, authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "winners_public_read" ON public.winners FOR SELECT TO anon, authenticated USING (true);

-- 2. Adição de coluna de versão na scratch_cards para rastrear mudanças de probabilidade
ALTER TABLE public.scratch_cards ADD COLUMN config_version TEXT NOT NULL DEFAULT '1.0.0';

-- 3. Função de sorteio (Security Definer para rodar no servidor)
CREATE OR REPLACE FUNCTION public.draw_scratch_card(_user_id UUID, _card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_card public.scratch_cards;
    v_prize public.scratch_card_prizes;
    v_random_val NUMERIC;
    v_current_prob NUMERIC := 0;
    v_result_id UUID;
    v_session_id UUID;
    v_user_name TEXT;
BEGIN
    -- 1. Validações iniciais
    SELECT * INTO v_card FROM public.scratch_cards WHERE id = _card_id AND status = 'ACTIVE' FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Raspadinha não disponível ou inativa';
    END IF;

    -- 2. Verificar se o usuário tem saldo ou se é grátis (Lógica simplificada para Etapa 2)
    -- IF NOT v_card.is_free THEN ... END IF;

    -- 3. Idempotência: Verificar se já existe uma sessão ativa recente (prevenção de double-click)
    SELECT id INTO v_session_id FROM public.scratch_card_sessions 
    WHERE user_id = _user_id AND scratch_card_id = _card_id AND status = 'PENDING' AND expires_at > now();
    
    IF v_session_id IS NOT NULL THEN
        RAISE EXCEPTION 'Já existe uma jogada em processamento';
    END IF;

    -- Criar sessão
    INSERT INTO public.scratch_card_sessions (user_id, scratch_card_id, status)
    VALUES (_user_id, _card_id, 'PENDING')
    RETURNING id INTO v_session_id;

    -- 4. Motor de Sorteio
    v_random_val := random(); -- 0 to 1

    -- Iterar pelos prêmios ativos com estoque
    FOR v_prize IN 
        SELECT * FROM public.scratch_card_prizes 
        WHERE scratch_card_id = _card_id 
          AND is_active = true 
          AND quantity_remaining > 0
        ORDER BY value DESC
    LOOP
        v_current_prob := v_current_prob + v_prize.probability;
        
        IF v_random_val <= v_current_prob THEN
            -- GANHOU!
            
            -- Atualizar estoque com trava
            UPDATE public.scratch_card_prizes 
            SET quantity_remaining = quantity_remaining - 1,
                updated_at = now()
            WHERE id = v_prize.id;

            -- Salvar resultado
            INSERT INTO public.scratch_card_results (
                user_id, scratch_card_id, prize_id, result_type, prize_amount, configuration_version
            ) VALUES (
                _user_id, _card_id, v_prize.id, 'WIN', v_prize.value, v_card.config_version
            ) RETURNING id INTO v_result_id;

            -- Registrar ganhador (nome abreviado)
            SELECT COALESCE(full_name, 'Usuário') INTO v_user_name FROM public.profiles WHERE id = _user_id;
            
            INSERT INTO public.winners (
                result_id, user_id, scratch_card_id, prize_id, display_name, amount
            ) VALUES (
                v_result_id, _user_id, _card_id, v_prize.id, 
                overlay(v_user_name placing '***' from 3 for length(v_user_name)-4), 
                v_prize.value
            );

            -- Finalizar sessão
            UPDATE public.scratch_card_sessions SET status = 'COMPLETED' WHERE id = v_session_id;

            RETURN jsonb_build_object(
                'success', true,
                'result_type', 'WIN',
                'prize', jsonb_build_object(
                    'title', v_prize.title,
                    'value', v_prize.value,
                    'image_url', v_prize.image_url
                )
            );
        END IF;
    END LOOP;

    -- PERDEU
    INSERT INTO public.scratch_card_results (
        user_id, scratch_card_id, prize_id, result_type, prize_amount, configuration_version
    ) VALUES (
        _user_id, _card_id, NULL, 'LOSE', 0, v_card.config_version
    );

    UPDATE public.scratch_card_sessions SET status = 'COMPLETED' WHERE id = v_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'result_type', 'LOSE'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.draw_scratch_card(UUID, UUID) TO authenticated;
