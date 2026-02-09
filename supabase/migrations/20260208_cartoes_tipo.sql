-- Adicionar coluna 'tipo' na tabela 'cartoes' para distinguir Pessoal/Empresa
ALTER TABLE public.cartoes 
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'pessoal' CHECK (tipo IN ('pessoal', 'empresa'));
