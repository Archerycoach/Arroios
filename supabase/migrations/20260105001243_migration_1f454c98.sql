-- Also create policy to allow admins to delete any user
CREATE POLICY "Admins can delete any user"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);