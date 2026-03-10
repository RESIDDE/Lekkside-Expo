-- Fix missing profiles for existing users
INSERT INTO public.profiles (user_id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'member'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);

-- Optional: If there is a specific admin user that needs to be admin, we might need to handle that manually
-- But 'member' is sufficient for creating booths based on the current policy.
