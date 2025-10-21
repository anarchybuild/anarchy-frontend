-- Grant necessary permissions on profiles table to fix 401 errors

-- Grant SELECT permission to public role (for unauthenticated access)
GRANT SELECT ON public.profiles TO public;

-- Grant INSERT, UPDATE, DELETE permissions to authenticated and anon roles
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO anon;

-- Ensure RLS is enabled (should already be enabled but let's be sure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;