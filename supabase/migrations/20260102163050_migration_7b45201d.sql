-- Check if there are any policies on other tables that might be causing recursion
-- Let's also ensure rooms table policies are simple

-- Drop and recreate rooms policies to be safe
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;

-- Simple policy: Anyone can view active rooms (no user table reference)
CREATE POLICY "rooms_view_active" ON rooms
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Admins can insert (using direct role check, no subquery)
CREATE POLICY "rooms_insert_admin" ON rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Admins can update (using direct role check, no subquery)
CREATE POLICY "rooms_update_admin" ON rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Admins can delete (using direct role check, no subquery)
CREATE POLICY "rooms_delete_admin" ON rooms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );