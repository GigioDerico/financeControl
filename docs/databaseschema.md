# Database Schema - FinControl (Supabase/PostgreSQL)

## 1. Visão Geral

Este documento define a arquitetura de banco de dados para o **FinControl**. O sistema utiliza **PostgreSQL** hospedado no **Supabase**.

### Princípios de Design
-   **Segurança (RLS):** Isolamento total de dados por usuário (`user_id`).
-   **Integridade:** Uso estrito de Foreign Keys (FK) e Constraints.
-   **Performance:** Índices estratégicos e funções nativas (PL/pgSQL) para operações de leitura pesada ou atômicas.
-   **Escalabilidade:** Estrutura normalizada pronta para milhões de linhas.

---

## 2. Diagrama Entidade-Relacionamento (ERD Resumido)

-   **users** (auth.users): Gerenciado pelo Supabase.
-   **contas**: Contas bancárias (N:1 user).
-   **cartoes**: Cartões de crédito (N:1 user).
-   **categorias**: Categorias de transações (N:1 user).
-   **transacoes**: Registro financeiro central (N:1 user, N:1 conta, N:1 cartao, N:1 categoria).

---

## 3. Definição das Tabelas (DDL)

Todas as tabelas pertencem ao esquema `public` e devem ter RLS habilitado.

### 3.1. Tabela `contas`
Armazena contas bancárias (corrente, poupança, caixa).

| Coluna | Tipo | Constraint | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Identificador único |
| `user_id` | `uuid` | FK `auth.users(id)`, NOT NULL | Dono da conta |
| `nome` | `text` | NOT NULL | Nome da conta (ex: Nubank) |
| `tipo` | `text` | NOT NULL, CHECK (`tipo` IN ('pessoal', 'empresa')) | Tipo de uso |
| `saldo` | `numeric(15,2)` | NOT NULL, DEFAULT 0 | Saldo atual (calculado/cache) |
| `created_at` | `timestamptz` | DEFAULT `now()` | Data de criação |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Data de atualização |

**Índices:**
-   `idx_contas_user_id` em `user_id` (Filtro base).

---

### 3.2. Tabela `cartoes`
Armazena cartões de crédito.

| Coluna | Tipo | Constraint | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Identificador único |
| `user_id` | `uuid` | FK `auth.users(id)`, NOT NULL | Dono do cartão |
| `nome` | `text` | NOT NULL | Nome (ex: Visa Infinite) |
| `banco` | `text` | NOT NULL | Instituição financeira |
| `limite` | `numeric(15,2)` | NOT NULL, DEFAULT 0 | Limite total |
| `dia_fechamento` | `int` | NOT NULL, CHECK (1-31) | Dia de corte |
| `dia_vencimento` | `int` | NOT NULL, CHECK (1-31) | Dia de pagamento |
| `created_at` | `timestamptz` | DEFAULT `now()` | - |
| `updated_at` | `timestamptz` | DEFAULT `now()` | - |

**Índices:**
-   `idx_cartoes_user_id` em `user_id`.

---

### 3.3. Tabela `categorias`
Categorias para classificação. O sistema pode criar categorias padrão no signup.

| Coluna | Tipo | Constraint | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | - |
| `user_id` | `uuid` | FK `auth.users(id)`, NOT NULL | - |
| `nome` | `text` | NOT NULL | Ex: Alimentação |
| `tipo` | `text` | NOT NULL, CHECK IN ('receita', 'despesa') | - |
| `icone` | `text` | NULL | Identificador de ícone (lucide) |
| `created_at` | `timestamptz` | DEFAULT `now()` | - |

**Índices:**
-   `idx_categorias_user_id` em `user_id`.
-   `idx_categorias_tipo` em `tipo`.

---

### 3.4. Tabela `transacoes`
Tabela central de movimentações.

| Coluna | Tipo | Constraint | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | - |
| `user_id` | `uuid` | FK `auth.users(id)`, NOT NULL | - |
| `descricao` | `text` | NOT NULL | Descrição da transação |
| `valor` | `numeric(15,2)` | NOT NULL | Valor (sempre positivo, o tipo define o sinal) |
| `tipo` | `text` | NOT NULL, CHECK IN ('receita', 'despesa') | - |
| `data` | `date` | NOT NULL | Data da competência |
| `conta_id` | `uuid` | FK `contas(id)`, NULL | Se movimentou conta |
| `cartao_id` | `uuid` | FK `cartoes(id)`, NULL | Se foi no crédito |
| `categoria_id` | `uuid` | FK `categorias(id)`, NULL | Classificação |
| `efetivado` | `boolean` | DEFAULT true | Se já impactou saldo |
| `parcela_atual` | `int` | DEFAULT 1 | Número da parcela |
| `parcelas_total`| `int` | DEFAULT 1 | Total de parcelas |
| `observacao` | `text` | NULL | Notas adicionais |
| `created_at` | `timestamptz` | DEFAULT `now()` | - |

**Constraints de Negócio:**
-   Uma transação **não pode** ter `conta_id` E `cartao_id` preenchidos simultaneamente (ou é débito em conta ou é crédito). `CHECK (conta_id IS NULL OR cartao_id IS NULL)`.

**Índices:**
-   `idx_transacoes_user_data`: `(user_id, data DESC)` - Para queries de extrato/dashboard.
-   `idx_transacoes_conta`: `(conta_id)` - Para calcular saldo.
-   `idx_transacoes_cartao`: `(cartao_id, data)` - Para calcular faturas.

---

## 4. Segurança (Row Level Security - RLS)

Todas as tabelas terão RLS ativado. A política padrão será "Usuário vê e edita apenas seus dados".

**Política Padrão (Exemplo para `transacoes`):**
```sql
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can fully manage their own transactions"
ON transacoes
FOR ALL
USING (auth.uid() = user_id);
```
*Replicar lógica para `contas`, `cartoes`, `categorias`.*

---

## 5. Automação e Triggers

Para garantir a integridade do saldo das contas sem depender do frontend, usaremos Triggers.

### 5.1. Trigger: Atualizar Saldo da Conta
Sempre que uma transação vinculada a uma `conta` for inserida, atualizada ou deletada, o saldo da `conta` será recalculado ou atualizado incrementalmente.

**Lógica (Simplificada):**
-   INSERT: `saldo = saldo + (valor * sinal)`
-   DELETE: `saldo = saldo - (valor * sinal)`
-   UPDATE: Reverter valor antigo e aplicar novo.

*Nota: O sinal depende do `tipo` (receita = +, despesa = -).*

---

## 6. Configurações e Preferências
Tabela única para configurações do usuário.

### 6.1. Tabela `user_settings`
| Coluna | Tipo | Constraint | Descrição |
| :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | PK, FK `auth.users(id)` | 1:1 com usuário |
| `moeda` | `text` | DEFAULT 'BRL' | - |
| `idioma` | `text` | DEFAULT 'pt-BR' | - |
| `tema` | `text` | DEFAULT 'system' | dark/light/system |

---

## 7. Performance & Escalabilidade

-   **Numeric(15,2):** Usado para valores monetários para evitar erros de ponto flutuante.
-   **Timestamptz:** Sempre usar UTC para evitar problemas de fuso horário.
-   **Vacuum e Analyze:** O Supabase gerencia, mas chaves estrangeiras indexadas ajudam na performance de deleção em cascata (se houver).
-   **Paginação:** Queries no dashboard devem ser sempre limitadas (`LIMIT 20`) ou paginadas por data.

## 8. Migração do LocalStorage

Um script cliente deve rodar no primeiro login:
1.  Ler dados do `localStorage`.
2.  Mapear para a estrutura acima.
3.  Enviar via `supabase.from('table').insert()`.
4.  Limpar `localStorage` após sucesso.
