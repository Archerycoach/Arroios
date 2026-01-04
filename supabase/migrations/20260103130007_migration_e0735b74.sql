-- Drop ALL policies on rooms table (complete cleanup)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'rooms' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.rooms';
    END LOOP;
END $$;

-- Create fresh policies for rooms table
CREATE POLICY "rooms_select_available_public"
ON rooms FOR SELECT
USING (is_available = true);

CREATE POLICY "rooms_select_all_authenticated"
ON rooms FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "rooms_insert_admin_staff"
ON rooms FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'staff')
);

CREATE POLICY "rooms_update_admin_staff"
ON rooms FOR UPDATE
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'staff')
);

CREATE POLICY "rooms_delete_admin"
ON rooms FOR DELETE
USING (
  public.get_user_role(auth.uid()) = 'admin'
);