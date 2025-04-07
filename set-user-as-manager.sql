-- Script to directly set a user as manager in the database
-- Replace 'user@example.com' with the actual email of the user you want to make a manager

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'manager')
WHERE email = 'user@example.com';

-- Verify the change
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'user@example.com';
