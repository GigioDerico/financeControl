-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Apagar policies antigas se existirem (para evitar erro de duplicidade)
DROP POLICY IF EXISTS "Users can manage their own contas" ON public.contas;
DROP POLICY IF EXISTS "Users can manage their own cartoes" ON public.cartoes;
DROP POLICY IF EXISTS "Users can manage their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can manage their own transacoes" ON public.transacoes;

-- Política para a tabela 'contas'
CREATE POLICY "Users can manage their own contas"
ON public.contas
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para a tabela 'cartoes'
CREATE POLICY "Users can manage their own cartoes"
ON public.cartoes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para a tabela 'categorias'
CREATE POLICY "Users can manage their own categorias"
ON public.categorias
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para a tabela 'transacoes'
CREATE POLICY "Users can manage their own transacoes"
ON public.transacoes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
