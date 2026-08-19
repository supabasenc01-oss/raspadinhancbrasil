-- Etapa 3: Integrar Carteira com Motor de Raspadinhas (Retry without duplicate column)

-- 1. Atualizar draw_scratch_card para debitar e creditar carteira
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
    v_wallet_tx_id UUID;
BEGIN
    -- 1. Bloquear e validar raspadinha
    SELECT * INTO v_card FROM public.scratch_cards WHERE id = _card_id AND status = 'ACTIVE' FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Raspadinha não disponível ou inativa';
    END IF;

    -- 2. Idempotência: Verificar se já existe uma sessão ativa recente
    SELECT id INTO v_session_id FROM public.scratch_card_sessions 
    WHERE user_id = _user_id AND scratch_card_id = _card_id AND status = 'PENDING' AND expires_at > now();
    
    IF v_session_id IS NOT NULL THEN
        RAISE EXCEPTION 'Já existe uma jogada em processamento';
    END IF;

    -- 3. Debitar carteira se não for grátis
    IF NOT v_card.is_free AND v_card.price > 0 THEN
        -- process_wallet_transaction já faz o lock da wallet e valida saldo insuficiente
        PERFORM public.process_wallet_transaction(
            _user_id, 
            -v_card.price, 
            'PURCHASE', 
            _card_id, 
            'Compra de raspadinha: ' || v_card.title
        );
    END IF;

    -- Criar sessão
    INSERT INTO public.scratch_card_sessions (user_id, scratch_card_id, status)
    VALUES (_user_id, _card_id, 'PENDING')
    RETURNING id INTO v_session_id;

    -- 4. Sorteio
    v_random_val := random();

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
            
            UPDATE public.scratch_card_prizes 
            SET quantity_remaining = quantity_remaining - 1,
                updated_at = now()
            WHERE id = v_prize.id;

            INSERT INTO public.scratch_card_results (
                user_id, scratch_card_id, prize_id, result_type, prize_amount, configuration_version
            ) VALUES (
                _user_id, _card_id, v_prize.id, 'WIN', v_prize.value, v_card.config_version
            ) RETURNING id INTO v_result_id;

            -- Creditar carteira se houver prêmio em dinheiro
            IF v_prize.value > 0 THEN
                PERFORM public.process_wallet_transaction(
                    _user_id, 
                    v_prize.value, 
                    'PRIZE', 
                    v_result_id, 
                    'Prêmio na raspadinha: ' || v_card.title
                );
            END IF;

            SELECT COALESCE(full_name, 'Usuário') INTO v_user_name FROM public.profiles WHERE id = _user_id;
            
            INSERT INTO public.winners (
                result_id, user_id, scratch_card_id, prize_id, display_name, amount
            ) VALUES (
                v_result_id, _user_id, _card_id, v_prize.id, 
                overlay(v_user_name placing '***' from 3 for length(v_user_name)-4), 
                v_prize.value
            );

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
