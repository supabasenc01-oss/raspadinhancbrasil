
CREATE TABLE public.winners (
    id uuid primary key default gen_random_uuid(),
    scratch_card_id uuid references public.scratch_cards(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    winner_name text not null,
    prize_title text not null,
    prize_value numeric(12,2) not null,
    created_at timestamp with time zone default now() not null
);

GRANT SELECT ON public.winners TO authenticated, anon;
GRANT ALL ON public.winners TO service_role;

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view winners"
ON public.winners FOR SELECT
TO authenticated, anon
USING (true);
