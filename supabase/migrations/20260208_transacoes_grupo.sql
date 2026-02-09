-- Adicionar coluna 'grupo_id' para agrupar transações parceladas
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS grupo_id uuid DEFAULT gen_random_uuid();

-- Criar indice para facilitar busca por grupo
CREATE INDEX IF NOT EXISTS idx_transacoes_grupo_id ON public.transacoes(grupo_id);
