# FinControl - Documentacao Tecnica

## 1. Visao geral do app

O **FinControl** e um aplicativo web para controle financeiro **pessoal** e **empresarial**.
Ele roda inteiramente no cliente (browser) e persiste os dados em `localStorage`.

Objetivo principal:
- registrar receitas e despesas
- acompanhar saldo de contas bancarias
- controlar cartoes de credito e faturas (incluindo compras parceladas)
- visualizar indicadores e graficos financeiros
- organizar categorias e configuracoes basicas do usuario

## 2. Stack e tecnologias

Stack principal identificada no projeto:
- **Framework:** Next.js (`next@16.1.6`) com App Router
- **Linguagem:** TypeScript (`strict: true`)
- **UI:** React 19 + Tailwind CSS
- **Componentes:** shadcn/ui + Radix UI
- **Graficos:** Recharts
- **Estado e cache local:** SWR (com `mutate` apos operacoes CRUD)
- **Icones:** Lucide React
- **Temas:** next-themes (provider existe, mas nao esta conectado no `layout` atual)

Arquivos de configuracao relevantes:
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `tailwind.config.ts`
- `components.json`
- `postcss.config.mjs`

## 3. Arquitetura da aplicacao

### 3.1 Estrutura de alto nivel

- `app/`: entrada do Next (layout, pagina principal, endpoint API)
- `components/app-shell.tsx`: shell principal com navegacao
- `components/views/*`: telas do produto
- `components/dialogs/*`: modais de criacao (transacao, cartao, conta)
- `hooks/use-financeiro.ts`: hooks de dominio (contas, cartoes, transacoes etc.)
- `lib/store.ts`: camada de persistencia e regras de negocio sobre `localStorage`
- `lib/types.ts`: tipos e modelos de dados
- `components/ui/*`: biblioteca de componentes base (majoritariamente shadcn/ui)

### 3.2 Fluxo de dados

Fluxo principal:
1. UI chama hooks (`useTransacoes`, `useContas`, etc.)
2. hooks usam funcoes de `lib/store.ts`
3. `store.ts` le/escreve no `localStorage`
4. hooks chamam `mutate` no SWR para revalidar estado em tela

Nao ha backend persistente no estado atual (exceto endpoint utilitario `/api/n8n` para parse de texto).

## 4. Modelo de dados

Definicoes em `lib/types.ts`:
- `ContaBancaria`: id, nome, tipo (pessoal/empresa), saldo
- `CartaoCredito`: id, nome, banco, limite, fechamento, vencimento
- `Transacao`: tipo (receita/despesa), origem, categoria, valor, data, conta/cartao, parcelas
- `FaturaCartao`: estrutura de fatura (status pendente/pago)
- `Categoria`: nome e tipo
- `ConfigUsuario`: nome, moeda, formato de data

Chaves de armazenamento (`localStorage`) em `lib/store.ts`:
- `fincontrol_contas`
- `fincontrol_cartoes`
- `fincontrol_transacoes`
- `fincontrol_faturas`
- `fincontrol_categorias`
- `fincontrol_config`

## 5. Regras de negocio implementadas

### 5.1 Transacoes e saldo
- Ao criar transacao vinculada a conta, o saldo da conta e atualizado automaticamente:
  - receita soma
  - despesa subtrai
- Ao remover transacao vinculada a conta, o saldo e revertido.

### 5.2 Parcelamento e fatura
- Compras com `parcelas > 1` sao distribuidas por mes em `calcularFaturas`.
- O total da fatura considera valor integral para 1x e valor proporcional (`valor/parcelas`) para compras parceladas.
- A view de cartoes exibe fatura atual e proxima fatura.

### 5.3 Seed de dados
- `useSeedData()` chama `seedDemoData()` na carga inicial da pagina.
- O seed cria contas, cartoes e transacoes de exemplo **somente se ainda nao houver dados**.

## 6. Funcionalidades por tela

### 6.1 Dashboard (`components/views/dashboard-view.tsx`)
- cards de resumo: saldo total, receitas do mes, despesas do mes, faturas abertas
- lista de contas bancarias
- lista de transacoes recentes
- filtro por perfil (todas/pessoal/empresa)

### 6.2 Transacoes (`components/views/transacoes-view.tsx`)
- listagem de transacoes
- busca por categoria/observacao
- filtro por tipo (todas/receita/despesa)
- remocao de transacoes
- abertura do modal "Nova transacao"

### 6.3 Cartoes e contas (`components/views/cartoes-view.tsx`)
- cadastro/remocao de contas bancarias
- cadastro/remocao de cartoes
- expansao de cada cartao para visualizar composicao da fatura
- separacao dos totais de fatura entre pessoal e empresa

### 6.4 Graficos (`components/views/graficos-view.tsx`)
- resumo de receitas/despesas do mes
- barras de tendencia (ultimos 6 meses)
- pizza de despesas por categoria
- pizza de despesas por origem (pessoal vs empresa)

### 6.5 Configuracoes (`components/views/configuracoes-view.tsx`)
- perfil do usuario (nome)
- configuracao de moeda e formato de data
- CRUD de categorias (receita/despesa)
- gerenciamento rapido de contas e cartoes (remocao)
- zona de perigo para limpar todos os dados (`localStorage.clear()`)

## 7. Dialogs e UX

Dialogs implementados:
- `nova-transacao-dialog.tsx`
- `novo-cartao-dialog.tsx`
- `nova-conta-dialog.tsx`

Detalhes importantes:
- `NovaTransacaoDialog` permite alternar entre conta bancaria ou cartao de credito
- para cartao, permite escolher numero de parcelas (1x a 12x)
- layout adaptado para mobile (bottom navigation + FAB) e desktop (sidebar fixa)

## 8. Endpoint de integracao (`/api/n8n`)

Arquivo: `app/api/n8n/route.ts`

Capacidades:
- `POST /api/n8n`: recebe `{ "mensagem": "..." }`
- faz parse de texto para extrair:
  - valor
  - categoria (por palavras-chave)
  - cartao (quando citado)
  - origem (pessoal/empresa)
  - parcelas
  - tipo (receita/despesa)
- retorna objeto processado para consumo externo (ex.: automacoes n8n)

Tambem existe `GET /api/n8n` com descricao e exemplo de payload.

## 9. Como rodar o projeto

Pre-requisitos:
- Node.js atual
- pnpm (lockfile presente: `pnpm-lock.yaml`)

Comandos principais:
- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

## 10. Observacoes tecnicas importantes

1. `next.config.mjs` esta com `typescript.ignoreBuildErrors: true`.
   Isso permite build com erros de TypeScript e pode mascarar problemas.

2. Persistencia e 100% client-side (`localStorage`).
   Nao ha autenticacao, multiusuario real, sincronizacao em nuvem ou backup nativo.

3. Arquivo `styles/globals.css` existe, mas o app usa `app/globals.css` no `layout`.
   O arquivo em `styles/` parece legado/nao utilizado no fluxo atual.

4. Existe grande quantidade de componentes em `components/ui/*` (base shadcn).
   Nem todos sao necessariamente usados pelas views atuais.

5. `ConfigUsuario` salva moeda e formato de data, mas a formatacao monetaria em `formatCurrency`
   esta fixa em `pt-BR/BRL` no estado atual.

## 11. Possiveis proximos passos (evolucao)

- conectar persistencia real (ex.: Supabase/PostgreSQL)
- autenticar usuarios e separar dados por conta
- usar `config.moeda` e `config.formatoData` na formatacao real
- adicionar testes (unitarios para `store.ts` e integracao de views)
- revisar `ignoreBuildErrors` para endurecer qualidade de build
- padronizar arquivos de estilo globais (remover legado nao usado)

---

## 12. Resumo

O projeto esta em um estagio funcional de **MVP frontend** para controle financeiro,
com boa cobertura de funcionalidades basicas (contas, cartoes, transacoes, graficos e configuracoes),
arquitetura simples e rapida de iterar, e base pronta para evolucao para backend real e producao.
