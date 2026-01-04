-- Final tables

-- MESSAGES
DROP POLICY IF EXISTS "Admins can send messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "messages_admin_manage" ON messages
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- EXPENSE_CATEGORIES
DROP POLICY IF EXISTS "Admins can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins can view expense categories" ON expense_categories;
CREATE POLICY "expense_categories_admin" ON expense_categories
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "expense_categories_staff_view" ON expense_categories
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

-- EXPENSES
DROP POLICY IF EXISTS "Admins can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Staff can create expenses" ON expenses;
CREATE POLICY "expenses_admin" ON expenses
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "expenses_staff_view" ON expenses
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'staff')
  );

CREATE POLICY "expenses_staff_insert" ON expenses
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'staff'
  );