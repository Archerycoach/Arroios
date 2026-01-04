-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Authenticated users can read for role checks" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create simple, non-recursive policies for users table
-- 1. Any authenticated user can read ANY user record (needed for role checks)
CREATE POLICY "Enable read for authenticated users"
ON users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);