-- Create policy to allow admins to insert new users
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);