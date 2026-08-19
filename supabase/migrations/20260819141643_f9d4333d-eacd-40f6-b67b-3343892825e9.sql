
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
