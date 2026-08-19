-- Seed data for Stage 2
DO $$ 
DECLARE
    v_card_id UUID;
BEGIN
    -- 1. Raspadinha Grátis de Boas-vindas
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, featured, config_version)
    VALUES ('Sorte Inicial', 'sorte-inicial', 'Sua chance gratuita de ganhar prêmios todos os dias!', 0, true, 'ACTIVE', true, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'Prêmio Máximo', 50.00, 0.001, 10, 10, true),
    (v_card_id, 'Prêmio Prata', 10.00, 0.01, 100, 100, true),
    (v_card_id, 'Prêmio Bronze', 2.00, 0.1, 1000, 1000, true);

    -- 2. Raspadinha Premium Gold
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, featured, config_version)
    VALUES ('Raspadinha Gold', 'raspadinha-gold', 'Prêmios de até R$ 5.000,00!', 10.00, false, 'ACTIVE', true, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'GRANDE PRÊMIO', 5000.00, 0.0001, 1, 1, true),
    (v_card_id, 'Prêmio R$ 500', 500.00, 0.005, 50, 50, true),
    (v_card_id, 'Prêmio R$ 100', 100.00, 0.02, 200, 200, true),
    (v_card_id, 'Prêmio R$ 20', 20.00, 0.1, 1000, 1000, true);

    -- 3. Raspadinha Turbo Win
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, featured, config_version)
    VALUES ('Turbo Win', 'turbo-win', 'Resultados rápidos e muitas chances de ganhar.', 2.00, false, 'ACTIVE', false, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'Turbo Max', 200.00, 0.01, 20, 20, true),
    (v_card_id, 'Turbo Pro', 20.00, 0.05, 200, 200, true),
    (v_card_id, 'Turbo Lite', 5.00, 0.2, 2000, 2000, true);
END $$;
