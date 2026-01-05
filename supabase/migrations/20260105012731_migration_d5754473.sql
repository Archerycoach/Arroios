-- Criar política que permite SELECT durante autenticação
-- Esta é a política CRÍTICA que estava faltando!
DROP POLICY IF EXISTS "Allow authentication queries" ON public.users;

CREATE POLICY "Allow authentication queries" 
ON public.users
FOR SELECT
TO public
USING (true);

-- Verificar todas as políticas após criação
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;