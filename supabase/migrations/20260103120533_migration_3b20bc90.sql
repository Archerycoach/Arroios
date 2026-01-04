-- Fix RLS policies for rooms table
DROP POLICY IF EXISTS "Anyone can view available rooms" ON rooms;
DROP POLICY IF EXISTS "Admin and staff can manage rooms" ON rooms;
DROP POLICY IF EXISTS "Admin can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Admin can update rooms" ON rooms;
DROP POLICY IF EXISTS "Admin can delete rooms" ON rooms;

-- Create simplified policies for rooms table
CREATE POLICY "Anyone can view rooms"
ON rooms
FOR SELECT
USING (true);

CREATE POLICY "Admin and staff can insert rooms"
ON rooms
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Admin and staff can update rooms"
ON rooms
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Admin and staff can delete rooms"
ON rooms
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);