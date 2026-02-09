export type Perfil = "pessoal" | "empresa"
export type TipoTransacao = "receita" | "despesa"

export interface ContaBancaria {
  id: string
  nome: string
  tipo: Perfil
  saldo: number
}

export interface CartaoCredito {
  id: string
  nome: string
  banco: string
  limite: number
  fechamento: number
  vencimento: number
  tipo: Perfil
}

export interface Transacao {
  id: string
  tipo: TipoTransacao
  origem: Perfil
  categoria: string
  valor: number
  data: string
  contaId: string | null
  cartaoId: string | null
  parcelas: number
  parcelaAtual: number
  observacoes: string
}

export interface FaturaCartao {
  id: string
  cartaoId: string
  mes: number
  ano: number
  valorTotal: number
  statusPagamento: "pendente" | "pago"
}

export interface Categoria {
  id: string
  nome: string
  tipo: TipoTransacao
  icone?: string
}

export interface ConfigUsuario {
  nomeUsuario: string
  moeda: string
  formatoData: "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd"
}

export const DEFAULT_CATEGORIAS_RECEITA: Categoria[] = [
  { id: "r-salario", nome: "Salario", tipo: "receita" },
  { id: "r-freelance", nome: "Freelance", tipo: "receita" },
  { id: "r-investimentos", nome: "Investimentos", tipo: "receita" },
  { id: "r-vendas", nome: "Vendas", tipo: "receita" },
  { id: "r-servicos", nome: "Servicos", tipo: "receita" },
  { id: "r-outros", nome: "Outros", tipo: "receita" },
]

export const DEFAULT_CATEGORIAS_DESPESA: Categoria[] = [
  { id: "d-alimentacao", nome: "Alimentacao", tipo: "despesa" },
  { id: "d-transporte", nome: "Transporte", tipo: "despesa" },
  { id: "d-moradia", nome: "Moradia", tipo: "despesa" },
  { id: "d-saude", nome: "Saude", tipo: "despesa" },
  { id: "d-educacao", nome: "Educacao", tipo: "despesa" },
  { id: "d-lazer", nome: "Lazer", tipo: "despesa" },
  { id: "d-compras", nome: "Compras", tipo: "despesa" },
  { id: "d-assinaturas", nome: "Assinaturas", tipo: "despesa" },
  { id: "d-impostos", nome: "Impostos", tipo: "despesa" },
  { id: "d-funcionarios", nome: "Funcionarios", tipo: "despesa" },
  { id: "d-fornecedores", nome: "Fornecedores", tipo: "despesa" },
  { id: "d-marketing", nome: "Marketing", tipo: "despesa" },
  { id: "d-outros", nome: "Outros", tipo: "despesa" },
]

export const DEFAULT_CONFIG: ConfigUsuario = {
  nomeUsuario: "",
  moeda: "BRL",
  formatoData: "dd/mm/yyyy",
}
