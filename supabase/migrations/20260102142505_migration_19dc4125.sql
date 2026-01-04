-- Drop all existing policies on users table to prevent conflicts
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Recreate simple, non-recursive policies
-- Allow users to read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert (for registration)
CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);