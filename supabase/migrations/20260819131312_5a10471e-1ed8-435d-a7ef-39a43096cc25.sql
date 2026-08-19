-- Nova migração para criar 4 raspadinhas com 10 prêmios cada
DO $$ 
DECLARE
    v_card_pix UUID;
    v_card_cozinha UUID;
    v_card_lar UUID;
    v_card_tech UUID;
BEGIN
    -- 1. MEGA PIX
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured)
    VALUES ('Mega PIX Instantâneo', 'mega-pix', 'Prêmios em dinheiro direto na sua conta!', 5.00, false, 'ACTIVE', true)
    RETURNING id INTO v_card_pix;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_pix, 'PIX R$ 5.000', 5000.00, 0.0001, 1, 1, true),
    (v_card_pix, 'PIX R$ 1.000', 1000.00, 0.0005, 5, 5, true),
    (v_card_pix, 'PIX R$ 500', 500.00, 0.001, 10, 10, true),
    (v_card_pix, 'PIX R$ 200', 200.00, 0.005, 50, 50, true),
    (v_card_pix, 'PIX R$ 100', 100.00, 0.01, 100, 100, true),
    (v_card_pix, 'PIX R$ 50', 50.00, 0.02, 200, 200, true),
    (v_card_pix, 'PIX R$ 25', 25.00, 0.04, 400, 400, true),
    (v_card_pix, 'PIX R$ 10', 10.00, 0.08, 800, 800, true),
    (v_card_pix, 'PIX R$ 5', 5.00, 0.15, 1500, 1500, true),
    (v_card_pix, 'Bônus R$ 2', 2.00, 0.2, 2000, 2000, true);

    -- 2. COZINHA DOS SONHOS
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured)
    VALUES ('Cozinha dos Sonhos', 'cozinha-sonhos', 'Equipe sua cozinha com os melhores eletrodomésticos.', 15.00, false, 'ACTIVE', true)
    RETURNING id INTO v_card_cozinha;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_cozinha, 'Micro-ondas Inox', 800.00, 0.001, 5, 5, true),
    (v_card_cozinha, 'Air Fryer Digital', 600.00, 0.002, 10, 10, true),
    (v_card_cozinha, 'Batedeira Planetária', 500.00, 0.003, 15, 15, true),
    (v_card_cozinha, 'Liquidificador Pro', 300.00, 0.005, 20, 20, true),
    (v_card_cozinha, 'Cafeteira Expresso', 400.00, 0.004, 12, 12, true),
    (v_card_cozinha, 'Jogo de Panelas', 350.00, 0.006, 18, 18, true),
    (v_card_cozinha, 'Mixer 3 em 1', 150.00, 0.01, 30, 30, true),
    (v_card_cozinha, 'Torradeira Retro', 120.00, 0.015, 40, 40, true),
    (v_card_cozinha, 'Crédito R$ 50', 50.00, 0.05, 100, 100, true),
    (v_card_cozinha, 'Crédito R$ 20', 20.00, 0.1, 200, 200, true);

    -- 3. LAR PREMIUM
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured)
    VALUES ('Lar Premium', 'lar-premium', 'Transforme sua casa com prêmios incríveis!', 25.00, false, 'ACTIVE', true)
    RETURNING id INTO v_card_lar;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_lar, 'Geladeira French Door', 6000.00, 0.0001, 1, 1, true),
    (v_card_lar, 'Smart TV 65" 4K', 4000.00, 0.0002, 2, 2, true),
    (v_card_lar, 'Lava e Seca 11kg', 3500.00, 0.0003, 3, 3, true),
    (v_card_lar, 'Ar Condicionado Dual', 2500.00, 0.0005, 5, 5, true),
    (v_card_lar, 'Sofá Retrátil VIP', 2000.00, 0.0008, 8, 8, true),
    (v_card_lar, 'Aspirador Robô', 1200.00, 0.002, 15, 15, true),
    (v_card_lar, 'Soundbar Premium', 1000.00, 0.003, 20, 20, true),
    (v_card_lar, 'Vale Compras R$ 500', 500.00, 0.005, 40, 40, true),
    (v_card_lar, 'Crédito R$ 100', 100.00, 0.02, 100, 100, true),
    (v_card_lar, 'Crédito R$ 50', 50.00, 0.05, 200, 200, true);

    -- 4. SORTE TECH
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured)
    VALUES ('Sorte Tech', 'sorte-tech', 'O melhor da tecnologia na sua mão.', 10.00, false, 'ACTIVE', true)
    RETURNING id INTO v_card_tech;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_tech, 'iPhone 15 Pro', 7000.00, 0.0001, 1, 1, true),
    (v_card_tech, 'PlayStation 5', 4000.00, 0.0003, 2, 2, true),
    (v_card_tech, 'MacBook Air M2', 8000.00, 0.0001, 1, 1, true),
    (v_card_tech, 'iPad Air', 5000.00, 0.0002, 2, 2, true),
    (v_card_tech, 'Smartwatch Series 9', 3000.00, 0.0005, 5, 5, true),
    (v_card_tech, 'Fone Noise Cancelling', 1500.00, 0.001, 10, 10, true),
    (v_card_tech, 'Kindle Paperwhite', 800.00, 0.003, 20, 20, true),
    (v_card_tech, 'Caixa de Som BT', 500.00, 0.005, 30, 30, true),
    (v_card_tech, 'Crédito R$ 50', 50.00, 0.03, 100, 100, true),
    (v_card_tech, 'Crédito R$ 20', 20.00, 0.08, 200, 200, true);

END $$;
