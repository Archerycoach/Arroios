-- Corrigir política de INSERT para admins
-- Problema: A política atual verifica se o NOVO utilizador existe, causando deadlock
-- Solução: Verificar apenas se o utilizador ATUAL (quem está a criar) é admin

-- Remover política problemática
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Criar nova política correta
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT
  WITH CHECK (
    -- Verifica se o utilizador ATUAL (auth.uid) é admin
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Confirmar políticas atualizadas
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;