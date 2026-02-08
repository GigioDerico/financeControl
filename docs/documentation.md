# FinControl - Documentacao Tecnica

## 1. Visao geral do app

O **FinControl** e um aplicativo web para controle financeiro **pessoal** e **empresarial**.
Atualmente, ele opera com persistencia local (`localStorage`), mas esta em processo de migracao para uma arquitetura robusta com backend **Supabase**.

Objetivo principal:
- Registrar receitas e despesas
- Acompanhar saldo de contas bancarias
- Controlar cartoes de credito e faturas (incluindo compras parceladas)
- Visualizar indicadores e graficos financeiros
- Organizar categorias e configuracoes basicas do usuario
- **[NOVO]** Sincronizacao em nuvem e autenticacao via Supabase

## 2. Stack e tecnologias

Stack principal:
- **Framework:** Next.js (`next@16.1.6`) com App Router
- **Linguagem:** TypeScript (`strict: true`)
- **UI:** React 19 + Tailwind CSS + shadcn/ui
- **Estado Local:** SWR (com estrategia de `mutate`)
- **Backend (Alvo):** Supabase (PostgreSQL, Auth, Edge Functions)
- **Legado (Atual):** `localStorage` (via `lib/store.ts`)

Arquivos de configuracao relevantes:
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `tailwind.config.ts`

## 3. Arquitetura da aplicacao

### 3.1 Estrutura de alto nivel

- `app/`: entrada do Next (layout, pagina principal, endpoint API)
- `components/app-shell.tsx`: shell principal com navegacao
- `components/views/*`: telas do produto (Dashboard, Transacoes, Cartoes, etc.)
- `hooks/use-financeiro.ts`: hooks de dominio (camada de abstracao dos dados)
- `lib/store.ts`: impementacao atual de persistencia local (a ser substituda por cliente Supabase)
- `lib/supabase/`: (Futuro) cliente e funcoes de acesso a dados
- `lib/types.ts`: tipos e modelos de dados

### 3.2 Fluxo de dados (Hibrido/Migracao)

**Estado Atual (Local):**
1. UI chama hooks (`useTransacoes`, etc.)
2. Hooks acessam `lib/store.ts`
3. Dados lidos/gravados em `localStorage`

**Estado Futuro (Supabase):**
1. UI chama hooks
2. Hooks utilizam Supabase Client (`@supabase/ssr`)
3. Autenticacao valida sessao do usuario
4. Dados lidos/gravados no PostgreSQL remoto com RLS (Row Level Security)

## 4. Modelo de dados

### 4.1 Tipos TypeScript (`lib/types.ts`)
- `ContaBancaria`: id, nome, tipo (pessoal/empresa), saldo
- `CartaoCredito`: id, nome, banco, limite, fechamento, vencimento
- `Transacao`: tipo, origem, categoria, valor, data, conta/cartao, parcelas
- `FaturaCartao`: estrutura virtual calculada
- `Categoria`: nome e tipo
- `ConfigUsuario`: preferencias

### 4.2 Esquema de Banco de Dados (Supabase/SQL)

A migracao para o Supabase utilizara as seguintes tabelas (mapeamento preliminar):

- **users** (gerenciado pelo Supabase Auth)
- **public.contas**
  - `id` (uuid, pk)
  - `user_id` (uuid, fk users)
  - `nome` (text)
  - `tipo` (text: 'pessoal' | 'empresa')
  - `saldo` (numeric)
- **public.cartoes**
  - `id` (uuid, pk)
  - `user_id` (uuid, fk users)
  - `nome`, `banco` (text)
  - `limite` (numeric)
  - `dia_fechamento`, `dia_vencimento` (int)
- **public.transacoes**
  - `id` (uuid, pk)
  - `user_id` (uuid, fk users)
  - `tipo` (text: 'receita' | 'despesa')
  - `valor` (numeric)
  - `data` (date)
  - `descricao` (text)
  - `conta_id` (uuid, fk contas, nullable)
  - `cartao_id` (uuid, fk cartoes, nullable)
  - `parcelas_total` (int)
  - `parcela_atual` (int)
- **public.categorias**
  - `id` (uuid, pk)
  - `user_id` (uuid, fk users)
  - `nome` (text)
  - `tipo` (text)

## 5. Regras de negocio

### 5.1 Transacoes e saldo
- Atualizacao atomica: Ao criar transacao, o saldo da conta deve ser atualizado via *Database function* ou *Trigger* no PostgreSQL para garantir consistencia.

### 5.2 Parcelamento
- O calculo de faturas (`calcularFaturas`) migrará de logica no frontend para uma View SQL ou Edge Function para performance.

## 6. Funcionalidades por tela

(Mantem-se inalterado em relacao a UX, apenas mudando a fonte de dados)
- **Dashboard:** Resumo financeiro
- **Transacoes:** Listagem e filtros
- **Cartoes:** Gestao de limite e faturas
- **Graficos:** Analise visual
- **Configuracoes:** Perfil e preferencias

## 7. Integracoes

### 7.1 Endpoint `/api/n8n`
- Recebe JSON/Texto para processamento via IA/Automacao.
- Devera ser protegido via API Key segura (armazenada em Vault/Env Var).

## 8. Roadmap de Migracao Supabase

1. **Configuracao Inicial:** Criar projeto Supabase, configurar variaveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. **Modelagem:** Criar tabelas e politicas RLS (Row Level Security).
3. **Auth:** Implementar fluxo de Login/Cadastro na UI.
4. **Adaptacao de Hooks:** Refatorar `hooks/use-financeiro.ts` para usar Supabase Client ao inves de `store.ts`.
5. **Migracao de Dados:** Criar script para migrar dados do `localStorage` para o Supabase no primeiro login do usuario.

## 9. Como rodar o projeto

- `pnpm install`
- `pnpm dev`
- **Configurar variaveis de ambiente (.env.local) para conectar ao Supabase.**

---

## 10. Status do Projeto

- **Fase:** MVP em processo de migracao para Backend-as-a-Service (BaaS).
- **Backend:** Supabase definido como padrao.
