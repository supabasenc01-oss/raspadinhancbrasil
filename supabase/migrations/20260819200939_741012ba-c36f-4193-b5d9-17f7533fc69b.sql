INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('scratch_overlay_logo_url', '""', 'Logotipo personalizado para a área de raspagem'),
  ('scratch_overlay_bg_color', '"#0F172A"', 'Cor de fundo da cobertura da raspadinha'),
  ('scratch_overlay_text', '""', 'Texto de orientação na área de raspagem')
ON CONFLICT (key) DO NOTHING;