-- Now recreate ALL policies using the helper function to avoid recursion

-- 1. DROP ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- 2. CREATE NEW policies on users table using the helper function
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);