
-- 1. Confirmar o e-mail do usuário e torná-lo administrador
DO $$ 
DECLARE 
  target_user_id UUID;
BEGIN
  -- Buscar o ID do usuário pelo e-mail
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ncbrasil02@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Confirmar o e-mail
    UPDATE auth.users 
    SET email_confirmed_at = now(), 
        updated_at = now(),
        last_sign_in_at = now()
    WHERE id = target_user_id;

    -- Garantir que ele seja 'ADMIN' na tabela user_roles
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'ADMIN');
  END IF;
END $$;
