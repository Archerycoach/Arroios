-- Drop all existing policies on settings table
DROP POLICY IF EXISTS "Admin can manage settings" ON settings;
DROP POLICY IF EXISTS "Staff can manage settings" ON settings;
DROP POLICY IF EXISTS "Public can read settings" ON settings;
DROP POLICY IF EXISTS "Users can read settings" ON settings;

-- Create comprehensive policies for settings table
-- 1. Admin/Staff can do everything (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Admin and staff can manage all settings"
ON settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

-- 2. Everyone can read settings (for frontend display)
CREATE POLICY "Anyone can read settings"
ON settings
FOR SELECT
USING (true);