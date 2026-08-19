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
