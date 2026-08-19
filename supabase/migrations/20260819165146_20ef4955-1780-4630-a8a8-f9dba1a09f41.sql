-- Ensure scratch_image_url exists on scratch_cards
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
