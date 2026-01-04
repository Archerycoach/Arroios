-- Create SUPER SIMPLE policies for debugging
-- Policy 1: Anyone authenticated can SELECT
CREATE POLICY "rooms_select_all"
ON rooms FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Anyone authenticated can UPDATE (for testing)
CREATE POLICY "rooms_update_all"
ON rooms FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 3: Anyone authenticated can INSERT (for testing)
CREATE POLICY "rooms_insert_all"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 4: Anyone authenticated can DELETE (for testing)
CREATE POLICY "rooms_delete_all"
ON rooms FOR DELETE
TO authenticated
USING (true);

COMMENT ON POLICY "rooms_select_all" ON rooms IS 'TEMPORARY: Allow all authenticated users to test';
COMMENT ON POLICY "rooms_update_all" ON rooms IS 'TEMPORARY: Allow all authenticated users to test';