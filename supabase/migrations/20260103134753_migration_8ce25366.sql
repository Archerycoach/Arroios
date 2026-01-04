-- Drop and recreate UPDATE policy with simpler logic
DROP POLICY IF EXISTS "rooms_update_admin_staff" ON rooms;

CREATE POLICY "rooms_update_admin_staff"
ON rooms FOR UPDATE
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User must have admin or staff role
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'staff')
  )
);

COMMENT ON POLICY "rooms_update_admin_staff" ON rooms IS 'Admin and staff can update rooms';