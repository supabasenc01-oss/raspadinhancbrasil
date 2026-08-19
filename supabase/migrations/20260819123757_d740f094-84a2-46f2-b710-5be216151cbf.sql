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
