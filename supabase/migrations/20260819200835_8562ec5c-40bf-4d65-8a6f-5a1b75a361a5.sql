INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('mercadopago_public_key', '""', 'Chave Pública do Mercado Pago'),
  ('mercadopago_access_token', '""', 'Token de Acesso do Mercado Pago')
ON CONFLICT (key) DO NOTHING;