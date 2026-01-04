-- Continue with remaining tables

-- ADDONS
DROP POLICY IF EXISTS "Admins can manage addons" ON addons;
CREATE POLICY "addons_admin_manage" ON addons
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- BOOKING_ADDONS
DROP POLICY IF EXISTS "Admins can manage booking addons" ON booking_addons;
DROP POLICY IF EXISTS "Admins can view all booking addons" ON booking_addons;
CREATE POLICY "booking_addons_admin_manage" ON booking_addons
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- SPECIAL_REQUESTS
DROP POLICY IF EXISTS "Admins can manage special requests" ON special_requests;
DROP POLICY IF EXISTS "Admins can view all special requests" ON special_requests;
CREATE POLICY "special_requests_admin_manage" ON special_requests
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );