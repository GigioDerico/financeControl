-- Função para inserir categorias padrão
CREATE OR REPLACE FUNCTION public.insert_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Receitas
    INSERT INTO public.categorias (user_id, nome, tipo) VALUES
    (NEW.id, 'Salario', 'receita'),
    (NEW.id, 'Freelance', 'receita'),
    (NEW.id, 'Investimentos', 'receita'),
    (NEW.id, 'Vendas', 'receita'),
    (NEW.id, 'Servicos', 'receita'),
    (NEW.id, 'Outros', 'receita');

    -- Despesas
    INSERT INTO public.categorias (user_id, nome, tipo) VALUES
    (NEW.id, 'Alimentacao', 'despesa'),
    (NEW.id, 'Transporte', 'despesa'),
    (NEW.id, 'Moradia', 'despesa'),
    (NEW.id, 'Saude', 'despesa'),
    (NEW.id, 'Educacao', 'despesa'),
    (NEW.id, 'Lazer', 'despesa'),
    (NEW.id, 'Compras', 'despesa'),
    (NEW.id, 'Assinaturas', 'despesa'),
    (NEW.id, 'Impostos', 'despesa'),
    (NEW.id, 'Funcionarios', 'despesa'),
    (NEW.id, 'Fornecedores', 'despesa'),
    (NEW.id, 'Marketing', 'despesa'),
    (NEW.id, 'Outros', 'despesa');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.insert_default_categories();
