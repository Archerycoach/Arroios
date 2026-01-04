-- Drop all existing policies on rooms table
DROP POLICY IF EXISTS "Anyone can view available rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Admin and staff can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Admin and staff can update rooms" ON rooms;
DROP POLICY IF EXISTS "Only admin can delete rooms" ON rooms;

-- Create simple, efficient policies for rooms table
-- 1. Anyone can view available rooms (public access)
CREATE POLICY "Public can view available rooms"
ON rooms FOR SELECT
USING (is_available = true);

-- 2. Authenticated users can view all rooms
CREATE POLICY "Authenticated can view all rooms"
ON rooms FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Admin and staff can insert rooms (uses simple subquery, no recursion)
CREATE POLICY "Admin and staff can insert rooms"
ON rooms FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);

-- 4. Admin and staff can update rooms (uses simple subquery, no recursion)
CREATE POLICY "Admin and staff can update rooms"
ON rooms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);

-- 5. Only admin can delete rooms
CREATE POLICY "Admin can delete rooms"
ON rooms FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);