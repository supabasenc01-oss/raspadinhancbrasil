
-- Garante que o usuário ncbrasil02@gmail.com tenha a role SUPER_ADMIN na tabela user_roles
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ncbrasil02@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Primeiro remove qualquer role existente para evitar conflito se não houver unique constraint ou se a lógica for simples
        DELETE FROM public.user_roles WHERE user_id = target_user_id;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'SUPER_ADMIN');
        
        UPDATE public.profiles SET status = 'ACTIVE' WHERE id = target_user_id;
    END IF;
END $$;

-- Corrige a URL do logotipo
UPDATE public.system_settings 
SET value = '""'::jsonb 
WHERE key = 'logo_url' AND (value::text = '"null"' OR value::text = 'null' OR value::text = '""');
