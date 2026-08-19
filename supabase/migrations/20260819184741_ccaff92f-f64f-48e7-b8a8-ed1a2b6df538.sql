-- Conceder permissão de execução das funções para as roles anon e authenticated
-- O PostgREST precisa dessas permissões para avaliar as políticas RLS que chamam estas funções
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Garantir acesso de leitura à tabela system_settings para usuários não logados (anon)
GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT ON public.system_settings TO authenticated;

-- Garantir que a política permita leitura pública sem depender apenas do is_staff se for configuração pública
-- Algumas configurações são necessárias para o front-end funcionar corretamente (logo, nome, etc)
DROP POLICY IF EXISTS "Public settings are readable by everyone" ON public.system_settings;
CREATE POLICY "Public settings are readable by everyone" 
ON public.system_settings 
FOR SELECT 
TO anon, authenticated 
USING (true);
