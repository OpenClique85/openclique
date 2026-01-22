-- Grant admin role to andrew.poss@openclique.net
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE LOWER(email) = LOWER('andrew.poss@openclique.net')
ON CONFLICT (user_id, role) DO NOTHING;