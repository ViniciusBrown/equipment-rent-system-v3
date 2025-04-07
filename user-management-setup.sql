-- Create a view to expose user information to the admin interface
-- For views, we need to use a different approach to restrict access
-- We'll create a secure view that includes the RLS check in the view definition itself

DROP VIEW IF EXISTS public.users_view;

CREATE OR REPLACE VIEW public.users_view AS
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  COALESCE(raw_user_meta_data->>'role', 'client') as role,
  created_at
FROM auth.users
WHERE
  -- Only allow managers to see this data
  (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'manager');

-- Grant select permission on the view to authenticated users
GRANT SELECT ON public.users_view TO authenticated;

-- Create a function to update a user's role
-- This function already exists from our migration script, but here it is again for reference
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the executing user is a manager
  IF (SELECT auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only managers can update user roles';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all users (for admin use)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS SETOF json AS $$
BEGIN
  -- Check if the executing user is a manager
  IF (SELECT auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.raw_user_meta_data->>'name',
      'role', COALESCE(u.raw_user_meta_data->>'role', 'client'),
      'created_at', u.created_at
    )
    FROM auth.users u;
  ELSE
    RAISE EXCEPTION 'Only managers can view all users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_users TO authenticated;

-- Grant select permission on the view to authenticated users
GRANT SELECT ON public.users_view TO authenticated;
