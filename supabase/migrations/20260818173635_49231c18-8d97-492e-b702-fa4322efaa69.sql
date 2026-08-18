CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','OPERADOR','FINANCEIRO','SUPORTE','USER');
CREATE TYPE public.profile_status AS ENUM ('ACTIVE','INACTIVE','BLOCKED','PENDING');
CREATE TYPE public.scratch_card_status AS ENUM ('DRAFT','ACTIVE','PAUSED','FINISHED','ARCHIVED');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
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

CREATE TABLE public.roles (
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
  ('USER','Usuário','Usuário final da plataforma', false);

CREATE TABLE public.user_roles (
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

CREATE TABLE public.scratch_cards (
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

CREATE TABLE public.scratch_card_prizes (
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

CREATE TABLE public.banners (
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

CREATE TABLE public.notifications (
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

CREATE TABLE public.admin_logs (
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
  USING (bucket_id IN ('scratch-cards','scratch-cards-backgrounds','prizes','banners','logos') AND public.is_staff(auth.uid()));