# FinControl - Controle Financeiro Pessoal e Empresarial

Bem-vindo ao **FinControl**, uma aplicação moderna desenvolvida para simplificar e organizar a gestão financeira. Este projeto permite que usuários gerenciem suas finanças pessoais e empresariais em um único ambiente, com total controle sobre transações, contas e cartões de crédito.

O projeto está em constante evolução, com foco atual na integração de um backend robusto utilizando **Supabase**.

---

## 🚀 Funcionalidades Principais

As funcionalidades atuais incluem:

*   **Dashboard Detalhado:** Visão panorâmica do seu saldo, faturas a vencer, e resumo de receitas/despesas do mês.
*   **Gestão Híbrida:** Separe facilmente transações pessoais das empresariais usando perfis distintos ("Pessoal" / "Empresa").
*   **Controle de Transações:**
    *   Registro rápido de Receitas e Despesas.
    *   Categorização inteligente (Alimentação, Transporte, Lazer, etc.).
    *   Suporte a parcelamentos automáticos.
*   **Gestão de Contas e Cartões:**
    *   Cadastro de múltiplas contas bancárias (Corrente, Poupança, PJ).
    *   Gerenciamento de cartões de crédito com dia de fechamento e vencimento.
    *   Cálculo automático de faturas e limite disponível.
*   **Visualização Gráfica:** Gráficos interativos (Barras e Pizza) para análise de fluxo de caixa e distribuição de despesas.
*   **Configurações Personalizáveis:**
    *   Gerenciamento de categorias.
    *   Formatação de moeda e datas baseada na preferência do usuário.
    *   Zona de perigo para limpeza de dados locais.
*   **Integração Externa (BETA):** Endpoint `/api/n8n` para receber transações via automação externa (ex: WhatsApp/n8n).

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as melhores práticas do desenvolvimento Web moderno:

### Frontend
-   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
-   **UI e Estilização:**
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [Shadcn/ui](https://ui.shadcn.com/) (Componentes baseados em Radix UI)
    -   [Lucide React](https://lucide.dev/) (Ícones)
-   **Gerenciamento de Estado:** [SWR](https://swr.vercel.app/) (Stale-While-Revalidate) com `localStorage`
-   **Gráficos:** [Recharts](https://recharts.org/)

### Backend & Infraestrutura (Em Desenvolvimento)
-   **Banco de Dados Realtime:** [Supabase](https://supabase.com/) (PostgreSQL)
-   **Autenticação:** Supabase Auth (Email/Senha, Google, etc.)
-   **Edge Functions:** Lógica serverless para regras de negócio complexas.

---

## 🏁 Como Rodar o Projeto

Siga os passos abaixo para executar a aplicação em seu ambiente local:

### Pré-requisitos
-   [Node.js](https://nodejs.org/) (Versão LTS recomendada, 20+)
-   [pnpm](https://pnpm.io/) (Gerenciador de pacotes recomendado)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/GigioDerico/financeControl.git
    cd financeControl
    ```

2.  **Instale as dependências:**
    ```bash
    pnpm install
    # ou se preferir npm: npm install
    ```

3.  **Execute o servidor de desenvolvimento:**
    ```bash
    pnpm dev
    # ou: npm run dev
    ```

4.  Acesse `http://localhost:3000` no seu navegador.

---

## 🔮 Roadmap de Desenvolvimento

O projeto está migrando de uma arquitetura baseada em `localStorage` para uma arquitetura baseada em nuvem com Supabase.

- [x] Interface de Usuário (UI/UX) Completa
- [x] Lógica de Negócio Local (Contas, Cartões, Transações)
- [x] Gráficos e Dashboards
- [ ] **Configuração do Projeto Supabase (DB + Auth)**
- [ ] **Migração dos Hooks para Supabase Client**
- [ ] **Implementação de Autenticação (Login/Cadastro)**
- [ ] **Sincronização de Dados na Nuvem**

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, estudar e modificar.
