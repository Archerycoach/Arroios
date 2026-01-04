-- Fix RLS policies for users table to allow role checks
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON users;

-- Create comprehensive policies for users table
CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin and staff can read all users"
ON users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admin can manage all users"
ON users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);