DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','OPERADOR','FINANCEIRO','SUPORTE','USER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_status') THEN
        CREATE TYPE public.profile_status AS ENUM ('ACTIVE','INACTIVE','BLOCKED','PENDING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scratch_card_status') THEN
        CREATE TYPE public.scratch_card_status AS ENUM ('DRAFT','ACTIVE','PAUSED','FINISHED','ARCHIVED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status public.profile_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_full_name_len CHECK (full_name IS NULL OR char_length(full_name) <= 120)
);
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_status ON public.profiles (status);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key public.app_role NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.roles TO authenticated, anon;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.roles (key, name, description, is_staff) VALUES
  ('SUPER_ADMIN','Super Administrador','Acesso total ao sistema', true),
  ('ADMIN','Administrador','Gestão da plataforma', true),
  ('OPERADOR','Operador','Operação de raspadinhas e prêmios', true),
  ('FINANCEIRO','Financeiro','Acesso a dados financeiros', true),
  ('SUPORTE','Suporte','Atendimento ao usuário', true),
  ('USER','Usuário','Usuário final da plataforma', false)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles (user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','OPERADOR','FINANCEIRO','SUPORTE')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('SUPER_ADMIN','ADMIN')
  );
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "roles_select_all" ON public.roles FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_staff" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.scratch_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  background_url TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  status public.scratch_card_status NOT NULL DEFAULT 'DRAFT',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  badge TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scratch_cards_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT scratch_cards_price_positive CHECK (price >= 0),
  CONSTRAINT scratch_cards_period CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX idx_scratch_cards_status ON public.scratch_cards (status);
CREATE INDEX idx_scratch_cards_featured ON public.scratch_cards (is_featured);

GRANT SELECT ON public.scratch_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scratch_cards TO authenticated;
GRANT ALL ON public.scratch_cards TO service_role;
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_scratch_cards_updated BEFORE UPDATE ON public.scratch_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "scratch_cards_public_read" ON public.scratch_cards FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "scratch_cards_staff_read" ON public.scratch_cards FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "scratch_cards_staff_write" ON public.scratch_cards FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.scratch_card_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_total INTEGER NOT NULL DEFAULT 0,
  quantity_remaining INTEGER NOT NULL DEFAULT 0,
  probability NUMERIC(8,6) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prizes_value_positive CHECK (value >= 0),
  CONSTRAINT prizes_qty CHECK (quantity_total >= 0 AND quantity_remaining >= 0 AND quantity_remaining <= quantity_total),
  CONSTRAINT prizes_probability_range CHECK (probability >= 0 AND probability <= 1)
);
CREATE INDEX idx_prizes_card ON public.scratch_card_prizes (scratch_card_id);
GRANT SELECT ON public.scratch_card_prizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scratch_card_prizes TO authenticated;
GRANT ALL ON public.scratch_card_prizes TO service_role;
ALTER TABLE public.scratch_card_prizes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_prizes_updated BEFORE UPDATE ON public.scratch_card_prizes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "prizes_public_read" ON public.scratch_card_prizes FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM public.scratch_cards c WHERE c.id = scratch_card_id AND c.status = 'ACTIVE'));
CREATE POLICY "prizes_staff_read" ON public.scratch_card_prizes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "prizes_staff_write" ON public.scratch_card_prizes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'HOME_HERO',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT banners_period CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX idx_banners_position ON public.banners (position, sort_order);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "banners_public_read" ON public.banners FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "banners_staff_read" ON public.banners FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "banners_staff_write" ON public.banners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_logs_actor ON public.admin_logs (actor_id);
CREATE INDEX idx_admin_logs_created ON public.admin_logs (created_at DESC);
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_logs_admin_read" ON public.admin_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin_logs_staff_insert" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "settings_public_read" ON public.system_settings FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "settings_staff_read" ON public.system_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "settings_admin_write" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('site_name', '"Raspa Premium"', 'Nome exibido da plataforma', true),
  ('support_email', '"suporte@exemplo.com"', 'E-mail de suporte', true),
  ('maintenance_mode', 'false', 'Modo manutencao', true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'USER')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "storage_platform_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('avatars','scratch-cards','scratch-cards-backgrounds','prizes','banners','logos'));

CREATE POLICY "storage_avatars_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "storage_avatars_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "storage_avatars_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('scratch-cards','scratch-cards-backgrounds','prizes','banners','logos') AND public.is_staff(auth.uid()));
CREATE POLICY "storage_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('scratch-cards','scratch-cards-backgrounds','prizes','banners','logos') AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id IN ('scratch-cards','scratch-cards-backgrounds','prizes','banners','logos') AND public.is_staff(auth.uid()));
CREATE POLICY "storage_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('scratch-cards','scratch-cards-backgrounds','prizes','banners','logos') AND public.is_staff(auth.uid()));REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;-- ETAPA 2: Motor de Raspadinhas e Prêmios

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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'winners') THEN
        CREATE TABLE public.winners (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            result_id UUID REFERENCES public.scratch_card_results(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
            prize_id UUID NOT NULL REFERENCES public.scratch_card_prizes(id) ON DELETE CASCADE,
            display_name TEXT NOT NULL,
            amount NUMERIC(12,2) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

CREATE INDEX idx_winners_created ON public.winners (created_at DESC);

GRANT SELECT ON public.winners TO anon, authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "winners_public_read" ON public.winners FOR SELECT TO anon, authenticated USING (true);

-- 2. Adição de coluna de versão na scratch_cards para rastrear mudanças de probabilidade
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scratch_cards' AND column_name = 'config_version') THEN
        ALTER TABLE public.scratch_cards ADD COLUMN config_version TEXT NOT NULL DEFAULT '1.0.0';
    END IF;
END $$;

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
-- Seed data for Stage 2
DO $$ 
DECLARE
    v_card_id UUID;
BEGIN
    -- 1. Raspadinha Grátis de Boas-vindas
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Sorte Inicial', 'sorte-inicial', 'Sua chance gratuita de ganhar prêmios todos os dias!', 0, true, 'ACTIVE', true, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'Prêmio Máximo', 50.00, 0.001, 10, 10, true),
    (v_card_id, 'Prêmio Prata', 10.00, 0.01, 100, 100, true),
    (v_card_id, 'Prêmio Bronze', 2.00, 0.1, 1000, 1000, true);

    -- 2. Raspadinha Premium Gold
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Raspadinha Gold', 'raspadinha-gold', 'Prêmios de até R$ 5.000,00!', 10.00, false, 'ACTIVE', true, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'GRANDE PRÊMIO', 5000.00, 0.0001, 1, 1, true),
    (v_card_id, 'Prêmio R$ 500', 500.00, 0.005, 50, 50, true),
    (v_card_id, 'Prêmio R$ 100', 100.00, 0.02, 200, 200, true),
    (v_card_id, 'Prêmio R$ 20', 20.00, 0.1, 1000, 1000, true);

    -- 3. Raspadinha Turbo Win
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Turbo Win', 'turbo-win', 'Resultados rápidos e muitas chances de ganhar.', 2.00, false, 'ACTIVE', false, '1.0.0')
    RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_card_prizes (scratch_card_id, title, value, probability, quantity_total, quantity_remaining, is_active)
    VALUES 
    (v_card_id, 'Turbo Max', 200.00, 0.01, 20, 20, true),
    (v_card_id, 'Turbo Pro', 20.00, 0.05, 200, 200, true),
    (v_card_id, 'Turbo Lite', 5.00, 0.2, 2000, 2000, true);
END $$;
-- Migração Etapa 3: Sistema Financeiro e Mercado Pago

-- 1. Tabelas Base Financeiras

CREATE TABLE public.wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance decimal(12,2) NOT NULL DEFAULT 0.00,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

CREATE TABLE public.deposits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount decimal(12,2) NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED')),
    payment_provider text NOT NULL DEFAULT 'MERCADOPAGO',
    external_id text, -- ID do pagamento no Mercado Pago
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deposit_id uuid REFERENCES public.deposits(id) ON DELETE SET NULL,
    provider text NOT NULL DEFAULT 'MERCADOPAGO',
    external_id text,
    amount decimal(12,2) NOT NULL,
    payment_method text, -- pix, credit_card, etc
    status text NOT NULL,
    status_detail text,
    external_reference text, -- ID de idempotência ou referência interna
    raw_response jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('DEPOSIT', 'PURCHASE', 'PRIZE', 'REFUND', 'ADJUSTMENT')),
    amount decimal(12,2) NOT NULL,
    balance_before decimal(12,2) NOT NULL,
    balance_after decimal(12,2) NOT NULL,
    reference_id uuid, -- Pode ser ID do deposit, scratch_card_result, etc
    description text,
    status text NOT NULL DEFAULT 'COMPLETED',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    event_id text,
    event_type text,
    payload jsonb,
    processed boolean DEFAULT false,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Grants

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

GRANT INSERT ON public.webhook_events TO anon, authenticated;
GRANT ALL ON public.webhook_events TO service_role;

-- 3. RLS Policies

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own deposits" ON public.deposits
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Webhook events são inseridos por sistemas externos ou handlers, leitura restrita a admin
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- 4. Funções e Triggers

-- Garantir que todo usuário tenha uma wallet
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajustar o trigger handle_new_user para incluir a wallet se ainda não existir
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_wallet();

-- Inicializar wallets para usuários existentes
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0.00 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Função para creditar/debitar carteira com atomicidade
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    _user_id uuid,
    _amount decimal(12,2),
    _type text,
    _reference_id uuid,
    _description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _current_balance decimal(12,2);
    _new_balance decimal(12,2);
    _tx_id uuid;
BEGIN
    -- Bloquear a wallet para atualização
    SELECT balance INTO _current_balance
    FROM public.wallets
    WHERE user_id = _user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user %', _user_id;
    END IF;

    _new_balance := _current_balance + _amount;

    IF _new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Atualizar saldo
    UPDATE public.wallets
    SET balance = _new_balance, updated_at = now()
    WHERE user_id = _user_id;

    -- Registrar transação
    INSERT INTO public.wallet_transactions (
        user_id, type, amount, balance_before, balance_after, reference_id, description
    )
    VALUES (
        _user_id, _type, _amount, _current_balance, _new_balance, _reference_id, _description
    )
    RETURNING id INTO _tx_id;

    RETURN _tx_id;
END;
$$;
-- Fix Security Linter Warnings

-- 1. Set search_path for SECURITY DEFINER functions to prevent search_path injection
ALTER FUNCTION public.handle_new_user_wallet() SET search_path = public;
ALTER FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) SET search_path = public;

-- 2. Restrict execution of SECURITY DEFINER functions
-- These functions should only be executed by the system (triggers/service_role)
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_new_user_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, decimal, text, uuid, text) TO service_role;
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
-- Fix Security Linter Warnings for draw_scratch_card
-- Only authenticated users should call this, but PostgREST runs as the user.
-- However, we want to ensure it's not public to anon.
REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(UUID, UUID) TO authenticated;
-- Nova migração para criar 4 raspadinhas com 10 prêmios cada
DO $$ 
DECLARE
    v_card_pix UUID;
    v_card_cozinha UUID;
    v_card_lar UUID;
    v_card_tech UUID;
BEGIN
    -- 1. MEGA PIX
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Mega PIX Instantâneo', 'mega-pix', 'Prêmios em dinheiro direto na sua conta!', 5.00, false, 'ACTIVE', true, '1.0.0')
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
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Cozinha dos Sonhos', 'cozinha-sonhos', 'Equipe sua cozinha com os melhores eletrodomésticos.', 15.00, false, 'ACTIVE', true, '1.0.0')
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
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Lar Premium', 'lar-premium', 'Transforme sua casa com prêmios incríveis!', 25.00, false, 'ACTIVE', true, '1.0.0')
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
    INSERT INTO public.scratch_cards (name, slug, description, price, is_free, status, is_featured, config_version)
    VALUES ('Sorte Tech', 'sorte-tech', 'O melhor da tecnologia na sua mão.', 10.00, false, 'ACTIVE', true, '1.0.0')
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

-- A tabela winners já foi tratada anteriormente no script


-- Endurecendo RLS e garantindo GRANTs
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ajustando anon (apenas catálogo público)
GRANT SELECT ON public.scratch_cards TO anon;
GRANT SELECT ON public.scratch_card_prizes TO anon;
GRANT SELECT ON public.winners TO anon;
GRANT SELECT ON public.banners TO anon;

-- Protegendo dados sensíveis na tabela winners
CREATE OR REPLACE FUNCTION public.mask_name(name text) RETURNS text AS $$
BEGIN
    RETURN overlay(name placing '***' from 3 for length(name)-4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verificando idempotência no processamento de webhooks
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;

-- Garantindo RLS ativo em tabelas financeiras
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Revogando privilégios padrão de execução em funções críticas para segurança
REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM public, anon, authenticated;

-- Garantindo que apenas o service_role (usado pelo serverFn via supabaseAdmin) possa executar
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;

-- Configurando search_path fixo em funções que faltavam (segundo o linter)
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.mask_name(text) SET search_path = public;

-- Revogando privilégios de execução de TODAS as funções SECURITY DEFINER para usuários normais e anônimos.
-- Elas serão executadas apenas via service_role (supabaseAdmin) em Server Functions.

REVOKE EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM public, anon, authenticated;

-- Grant apenas para service_role
GRANT EXECUTE ON FUNCTION public.draw_scratch_card(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction(uuid, numeric, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO service_role;

-- search_path para as que faltam
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_user_wallet() SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public;

INSERT INTO public.system_settings (key, value, description, is_public)
VALUES 
  ('logo_url', '"https://raspapremium.com/logo.png"'::jsonb, 'URL do logotipo da plataforma', true),
  ('favicon_url', '"/favicon.ico"'::jsonb, 'URL do favicon', true),
  ('meta_description', '"Plataforma premium de raspadinhas online."'::jsonb, 'Desc', true),
  ('og_image_url', '""'::jsonb, 'Img', true),
  ('google_analytics_id', '""'::jsonb, 'GA', true),
  ('facebook_pixel_id', '""'::jsonb, 'FB', true),
  ('friendly_urls', '"true"'::jsonb, 'Friendly', true),
  ('footer_external_link', '"https://www.ncbrasil.com.br"'::jsonb, 'Rodape', true)
ON CONFLICT (key) DO NOTHING;
-- Adicionando configurações de visibilidade da Home na tabela system_settings
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES 
  ('show_hero_banners', 'true', 'Habilitar banners rotativos na Home', true),
  ('show_winners_ticker', 'true', 'Habilitar ticker de ganhadores ao vivo na Home', true),
  ('show_scratch_demo', 'true', 'Habilitar demonstração interativa na Home', true),
  ('show_scratch_cards', 'true', 'Habilitar grade de raspadinhas na Home', true),
  ('show_how_to_play', 'true', 'Habilitar seção de como jogar na Home', true),
  ('show_latest_winners', 'true', 'Habilitar lista de últimos ganhadores na Home', true),
  ('show_testimonials', 'true', 'Habilitar seção de depoimentos na Home', true),
  ('show_app_download', 'true', 'Habilitar banner de download do app na Home', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

-- 1. Confirmar o e-mail do usuário e torná-lo administrador
DO $$ 
DECLARE 
  target_user_id UUID;
BEGIN
  -- Buscar o ID do usuário pelo e-mail
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ncbrasil02@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Confirmar o e-mail
    UPDATE auth.users 
    SET email_confirmed_at = now(), 
        updated_at = now(),
        last_sign_in_at = now()
    WHERE id = target_user_id;

    -- Garantir que ele seja 'ADMIN' na tabela user_roles
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'ADMIN');
  END IF;
END $$;

-- Garante que o usuário ncbrasil02@gmail.com tenha a role SUPER_ADMIN na tabela user_roles
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ncbrasil02@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Primeiro remove qualquer role existente para evitar conflito se não houver unique constraint ou se a lógica for simples
        DELETE FROM public.user_roles WHERE user_id = target_user_id;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'SUPER_ADMIN');
        
        UPDATE public.profiles SET status = 'ACTIVE' WHERE id = target_user_id;
    END IF;
END $$;

-- Corrige a URL do logotipo
UPDATE public.system_settings 
SET value = '""'::jsonb 
WHERE key = 'logo_url' AND (value::text = '"null"' OR value::text = 'null' OR value::text = '""');
-- Fix permissions for has_role function
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Also ensure is_staff and is_admin (if they exist) have correct permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') THEN
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
    END IF;
END $$;
-- Fix permissions for functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Fix table permissions (explicitly grant SELECT)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.profiles TO anon;

-- If they exist, grant to is_staff and is_admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') THEN
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method TEXT NOT NULL,
    pix_key TEXT,
    bank_info JSONB,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));-- Ensure scratch_image_url exists on scratch_cards
ALTER TABLE public.scratch_cards ADD COLUMN IF NOT EXISTS scratch_image_url TEXT;

-- Verify/Create withdrawals table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawals') THEN
        CREATE TABLE public.withdrawals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
            method TEXT NOT NULL,
            pix_key TEXT,
            bank_info JSONB,
            status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
            admin_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Grants
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawals TO authenticated;
        GRANT ALL ON public.withdrawals TO service_role;

        -- RLS
        ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own withdrawals"
        ON public.withdrawals FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create withdrawal requests"
        ON public.withdrawals FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Staff can manage all withdrawals"
        ON public.withdrawals FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'FINANCEIRO'));
    END IF;
END $$;
