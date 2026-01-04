-- Drop ALL policies on users table (complete cleanup)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Create fresh policies for users table
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "users_select_all_admin_staff"
ON users FOR SELECT
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'staff')
);

CREATE POLICY "users_insert_own"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (auth.uid() = id);