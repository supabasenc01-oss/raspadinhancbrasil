-- Add scratch_threshold setting if it doesn't exist
INSERT INTO public.system_settings (key, value)
VALUES ('scratch_threshold', '"45"')
ON CONFLICT (key) DO NOTHING;