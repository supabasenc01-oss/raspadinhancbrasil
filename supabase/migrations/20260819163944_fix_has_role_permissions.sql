-- Fix permissions for has_role function
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Also ensure is_staff and is_admin (if they exist) have correct permissions
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
