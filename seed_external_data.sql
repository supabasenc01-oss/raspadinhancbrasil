
-- SCRIPT DE CORREÇÃO E POPULAÇÃO DE DADOS (DATABASE EXTERNO)
-- Execute este script no SQL Editor do seu Supabase Externo

DO $$ 
BEGIN
    -- 1. Inserir raspadinhas iniciais com a coluna correta (is_featured)
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, image_url, scratch_image_url)
    VALUES 
    (
        'Sorte Inicial', 
        'sorte-inicial', 
        'Sua chance gratuita de ganhar prêmios todos os dias!', 
        0, 
        true, 
        'ACTIVE', 
        true,
        'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'
    ),
    (
        'Mega PIX Instantâneo', 
        'mega-pix-instantaneo', 
        'O maior prêmio em dinheiro direto na sua conta!', 
        10.00, 
        false, 
        'ACTIVE', 
        true,
        'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'
    ),
    (
        'Cozinha dos Sonhos', 
        'cozinha-dos-sonhos', 
        'Equipe sua cozinha com os melhores eletrodomésticos.', 
        5.00, 
        false, 
        'ACTIVE', 
        false,
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'
    )
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Inserir prêmios para a raspadinha 'Sorte Inicial'
    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, description, value, quantity_total, quantity_remaining, probability)
    SELECT id, 'R$ 50 no PIX', 'Receba 50 reais instantaneamente', 50.00, 10, 10, 0.05
    FROM public.scratch_cards WHERE slug = 'sorte-inicial'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, description, value, quantity_total, quantity_remaining, probability)
    SELECT id, 'Batedeira Elétrica', 'Batedeira profissional Stock Atacarejo', 250.00, 5, 5, 0.02
    FROM public.scratch_cards WHERE slug = 'sorte-inicial'
    ON CONFLICT DO NOTHING;

    -- 3. Garantir que o usuário administrador tenha a role correta
    -- Substitua pelo seu ID se necessário, mas o handle_new_user já deve ter criado o perfil
    -- Este bloco tenta localizar o usuário pelo email
    DECLARE
        v_user_id UUID;
    BEGIN
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'ncbrasil02@gmail.com';
        IF v_user_id IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (v_user_id, 'SUPER_ADMIN')
            ON CONFLICT (user_id, role) DO NOTHING;
            
            UPDATE public.profiles SET status = 'ACTIVE' WHERE id = v_user_id;
        END IF;
    END;

END $$;
