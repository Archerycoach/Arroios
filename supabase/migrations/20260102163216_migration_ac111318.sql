-- Continue updating policies on remaining tables

-- GUESTS
DROP POLICY IF EXISTS "Admins can manage guests" ON guests;
DROP POLICY IF EXISTS "Admins can view all guests" ON guests;
CREATE POLICY "guests_admin_manage" ON guests
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- BOOKINGS
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "bookings_admin_manage" ON bookings
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "payments_admin_manage" ON payments
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );