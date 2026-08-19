-- Limpar banners existentes
DELETE FROM public.banners;

-- Inserir banners com imagens do Unsplash que funcionam via proxy
-- Colunas corretas: title, subtitle, image_url, link_url, is_active, sort_order, position
INSERT INTO public.banners (title, subtitle, image_url, link_url, is_active, sort_order, position)
VALUES 
('Mega PIX Instantâneo', 'Ganhe até R$ 50.000,00 na hora!', 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200&auto=format&fit=crop', '/raspadinhas', true, 1, 'HOME_HERO'),
('Cozinha Premiada', 'Sua cozinha completa com os melhores prêmios!', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop', '/raspadinhas', true, 2, 'HOME_HERO');

-- Restaurar imagens das raspadinhas para URLs funcionais
UPDATE public.scratch_cards 
SET image_url = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=600&auto=format&fit=crop'
WHERE slug = 'mega-pix';

UPDATE public.scratch_cards 
SET image_url = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop'
WHERE slug = 'cozinha-sonhos';

UPDATE public.scratch_cards 
SET image_url = 'https://images.unsplash.com/photo-1616489953149-8b2255428453?q=80&w=600&auto=format&fit=crop'
WHERE slug = 'lar-premium';

UPDATE public.scratch_cards 
SET image_url = 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=600&auto=format&fit=crop'
WHERE slug = 'tech-master';

-- Resetar logotipo para o padrão se a imagem estiver quebrada
-- Usando a string nua no banco conforme observado no dump
UPDATE public.system_settings 
SET value = '"Stock Atacarejo"'
WHERE key = 'site_name';

UPDATE public.system_settings 
SET value = '""'
WHERE key = 'logo_url';
