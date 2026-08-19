-- Habilitar RLS em system_settings se não estiver habilitado
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "Permitir leitura pública das configurações" ON public.system_settings;

-- Criar política de leitura para anon e authenticated
CREATE POLICY "Permitir leitura pública das configurações"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Garantir GRANT SELECT para ambos
GRANT SELECT ON public.system_settings TO anon, authenticated;
