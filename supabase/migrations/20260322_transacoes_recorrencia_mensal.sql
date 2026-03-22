-- Recorrencia mensal para transacoes
ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS recorrente_mensal BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS recorrencia_ativa BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS recorrencia_grupo_id UUID;

CREATE INDEX IF NOT EXISTS idx_transacoes_recorrencia_grupo_id
ON public.transacoes(recorrencia_grupo_id);
