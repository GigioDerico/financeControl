-- Adicionar coluna origem (pessoal/empresa) na tabela transacoes
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS origem text CHECK (origem IN ('pessoal', 'empresa'));

-- Popular dados existentes baseado na conta/cartão
UPDATE public.transacoes t
SET origem = COALESCE(
    (SELECT tipo FROM public.contas WHERE id = t.conta_id),
    (SELECT tipo FROM public.cartoes WHERE id = t.cartao_id)
)
WHERE origem IS NULL;
