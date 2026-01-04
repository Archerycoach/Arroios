-- 3. UPDATE policies on OTHER tables to use the helper function

-- ROOMS
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "rooms_admin_manage" ON rooms
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- PROPERTIES
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;
CREATE POLICY "properties_admin_manage" ON properties
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- AVAILABILITY_BLOCKS
DROP POLICY IF EXISTS "Admins can manage availability blocks" ON availability_blocks;
CREATE POLICY "availability_blocks_admin_manage" ON availability_blocks
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- DYNAMIC_PRICING
DROP POLICY IF EXISTS "Admins can manage dynamic pricing" ON dynamic_pricing;
CREATE POLICY "dynamic_pricing_admin_manage" ON dynamic_pricing
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );