-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELAS (Tables)
-- ============================================================================

-- Tabela: CONTAS
CREATE TABLE public.contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL CHECK (length(nome) > 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('pessoal', 'empresa')),
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: CARTOES
CREATE TABLE public.cartoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL CHECK (length(nome) > 0),
    banco TEXT NOT NULL CHECK (length(banco) > 0),
    limite NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (limite >= 0),
    dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: CATEGORIAS
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL CHECK (length(nome) > 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    icone TEXT, -- Opcional: nome do icone Lucide
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: TRANSACOES
CREATE TABLE public.transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL CHECK (length(descricao) > 0),
    valor NUMERIC(15,2) NOT NULL CHECK (valor > 0), -- Sempre positivo
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    data DATE NOT NULL,
    conta_id UUID REFERENCES public.contas(id) ON DELETE CASCADE,
    cartao_id UUID REFERENCES public.cartoes(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    efetivado BOOLEAN DEFAULT TRUE,
    parcela_atual INTEGER DEFAULT 1 CHECK (parcela_atual >= 1),
    parcelas_total INTEGER DEFAULT 1 CHECK (parcelas_total >= 1),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Ou é Conta ou é Cartão (não ambos, não nenhum se for transferência futura)
    -- Simplificado para: Se tem cartão, não tem conta. Se tem conta, não tem cartão.
    CONSTRAINT check_origem CHECK (
        (conta_id IS NOT NULL AND cartao_id IS NULL) OR 
        (cartao_id IS NOT NULL AND conta_id IS NULL)
    )
);

-- Tabela: CONFIGURACOES DO USUARIO
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    moeda TEXT DEFAULT 'BRL',
    idioma TEXT DEFAULT 'pt-BR',
    tema TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INDICES (Indexes)
-- ============================================================================

-- Contas
CREATE INDEX idx_contas_user_id ON public.contas(user_id);

-- Cartoes
CREATE INDEX idx_cartoes_user_id ON public.cartoes(user_id);

-- Categorias
CREATE INDEX idx_categorias_user_id ON public.categorias(user_id);
CREATE INDEX idx_categorias_tipo ON public.categorias(tipo);

-- Transacoes
CREATE INDEX idx_transacoes_user_data ON public.transacoes(user_id, data DESC);
CREATE INDEX idx_transacoes_conta_id ON public.transacoes(conta_id);
CREATE INDEX idx_transacoes_cartao_id ON public.transacoes(cartao_id);
CREATE INDEX idx_transacoes_categoria_id ON public.transacoes(categoria_id);

-- ============================================================================
-- 3. SEGURANÇA (Row Level Security - RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Politicas (Policies) - CRUD completo apenas para o proprio usuario

-- CONTAS
CREATE POLICY "Users can manage own contas" ON public.contas
    FOR ALL USING (auth.uid() = user_id);

-- CARTOES
CREATE POLICY "Users can manage own cartoes" ON public.cartoes
    FOR ALL USING (auth.uid() = user_id);

-- CATEGORIAS
CREATE POLICY "Users can manage own categorias" ON public.categorias
    FOR ALL USING (auth.uid() = user_id);

-- TRANSACOES
CREATE POLICY "Users can manage own transacoes" ON public.transacoes
    FOR ALL USING (auth.uid() = user_id);

-- USER SETTINGS
CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TRIGGERS & FUNCOES (Automation)
-- ============================================================================

-- Trigger para atualizar Updated_At automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cartoes_updated_at BEFORE UPDATE ON public.cartoes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para criar Settings padrão ao criar usuário (Supabase Auth Hook pode ser melhor, mas este é SQL puro)
-- Nota: O trigger on auth.users requer permissoes especiais, entao vamos deixar que o app crie o settings
-- ou usar uma function 'handle_new_user' se tiver acesso ao schema 'auth'.

-- Função para atualizar saldo da conta ao modificar transações
CREATE OR REPLACE FUNCTION update_conta_saldo()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC(15,2);
BEGIN
    -- Se for INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.conta_id IS NOT NULL AND NEW.efetivado = TRUE THEN
            delta := CASE WHEN NEW.tipo = 'receita' THEN NEW.valor ELSE -NEW.valor END;
            UPDATE public.contas SET saldo = saldo + delta WHERE id = NEW.conta_id;
        END IF;
        RETURN NEW;
    
    -- Se for DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.conta_id IS NOT NULL AND OLD.efetivado = TRUE THEN
            delta := CASE WHEN OLD.tipo = 'receita' THEN -OLD.valor ELSE OLD.valor END; -- Inverte o sinal
            UPDATE public.contas SET saldo = saldo + delta WHERE id = OLD.conta_id;
        END IF;
        RETURN OLD;

    -- Se for UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Reverter o valor antigo
        IF OLD.conta_id IS NOT NULL AND OLD.efetivado = TRUE THEN
            delta := CASE WHEN OLD.tipo = 'receita' THEN -OLD.valor ELSE OLD.valor END;
            UPDATE public.contas SET saldo = saldo + delta WHERE id = OLD.conta_id;
        END IF;

        -- Aplicar o novo valor
        IF NEW.conta_id IS NOT NULL AND NEW.efetivado = TRUE THEN
            delta := CASE WHEN NEW.tipo = 'receita' THEN NEW.valor ELSE -NEW.valor END;
            UPDATE public.contas SET saldo = saldo + delta WHERE id = NEW.conta_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger only runs for transactions linked to BANK ACCOUNTS (not credit cards)
CREATE TRIGGER trigger_update_saldo
AFTER INSERT OR UPDATE OR DELETE ON public.transacoes
FOR EACH ROW
EXECUTE FUNCTION update_conta_saldo();
