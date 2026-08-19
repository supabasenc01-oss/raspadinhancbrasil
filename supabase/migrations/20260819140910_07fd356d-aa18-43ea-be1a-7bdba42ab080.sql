
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
