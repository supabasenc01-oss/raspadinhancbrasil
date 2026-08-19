-- Fix permissions for functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Fix table permissions (explicitly grant SELECT)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.profiles TO anon;

-- If they exist, grant to is_staff and is_admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') THEN
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
    END IF;
END $$;
