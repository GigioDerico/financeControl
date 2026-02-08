import type {
  ContaBancaria,
  CartaoCredito,
  Transacao,
  FaturaCartao,
  Categoria,
  ConfigUsuario,
} from "./types"
import {
  DEFAULT_CATEGORIAS_RECEITA,
  DEFAULT_CATEGORIAS_DESPESA,
  DEFAULT_CONFIG,
} from "./types"

const KEYS = {
  contas: "fincontrol_contas",
  cartoes: "fincontrol_cartoes",
  transacoes: "fincontrol_transacoes",
  faturas: "fincontrol_faturas",
  categorias: "fincontrol_categorias",
  config: "fincontrol_config",
} as const

function getItem<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Contas bancarias
export function getContas(): ContaBancaria[] {
  return getItem<ContaBancaria>(KEYS.contas, [])
}

export function addConta(conta: Omit<ContaBancaria, "id">): ContaBancaria {
  const contas = getContas()
  const newConta = { ...conta, id: generateId() }
  contas.push(newConta)
  setItem(KEYS.contas, contas)
  return newConta
}

export function updateConta(id: string, updates: Partial<ContaBancaria>) {
  const contas = getContas().map((c) => (c.id === id ? { ...c, ...updates } : c))
  setItem(KEYS.contas, contas)
}

export function deleteConta(id: string) {
  setItem(KEYS.contas, getContas().filter((c) => c.id !== id))
}

// Cartoes de credito
export function getCartoes(): CartaoCredito[] {
  return getItem<CartaoCredito>(KEYS.cartoes, [])
}

export function addCartao(cartao: Omit<CartaoCredito, "id">): CartaoCredito {
  const cartoes = getCartoes()
  const newCartao = { ...cartao, id: generateId() }
  cartoes.push(newCartao)
  setItem(KEYS.cartoes, cartoes)
  return newCartao
}

export function updateCartao(id: string, updates: Partial<CartaoCredito>) {
  const cartoes = getCartoes().map((c) =>
    c.id === id ? { ...c, ...updates } : c
  )
  setItem(KEYS.cartoes, cartoes)
}

export function deleteCartao(id: string) {
  setItem(KEYS.cartoes, getCartoes().filter((c) => c.id !== id))
}

// Transacoes
export function getTransacoes(): Transacao[] {
  return getItem<Transacao>(KEYS.transacoes, [])
}

export function addTransacao(transacao: Omit<Transacao, "id">): Transacao {
  const transacoes = getTransacoes()
  const newTransacao = { ...transacao, id: generateId() }
  transacoes.push(newTransacao)
  setItem(KEYS.transacoes, transacoes)

  // Update account balance if linked to an account
  if (transacao.contaId) {
    const contas = getContas()
    const conta = contas.find((c) => c.id === transacao.contaId)
    if (conta) {
      const delta =
        transacao.tipo === "receita" ? transacao.valor : -transacao.valor
      updateConta(transacao.contaId, { saldo: conta.saldo + delta })
    }
  }

  return newTransacao
}

export function deleteTransacao(id: string) {
  const transacoes = getTransacoes()
  const transacao = transacoes.find((t) => t.id === id)
  if (transacao?.contaId) {
    const contas = getContas()
    const conta = contas.find((c) => c.id === transacao.contaId)
    if (conta) {
      const delta =
        transacao.tipo === "receita" ? -transacao.valor : transacao.valor
      updateConta(transacao.contaId, { saldo: conta.saldo + delta })
    }
  }
  setItem(KEYS.transacoes, transacoes.filter((t) => t.id !== id))
}

// Faturas
export function getFaturas(): FaturaCartao[] {
  return getItem<FaturaCartao>(KEYS.faturas, [])
}

export function updateFaturaStatus(
  id: string,
  status: "pendente" | "pago"
) {
  const faturas = getFaturas().map((f) =>
    f.id === id ? { ...f, statusPagamento: status } : f
  )
  setItem(KEYS.faturas, faturas)
}

export function calcularFaturas(
  cartaoId: string,
  mes: number,
  ano: number
): { transacoes: Transacao[]; total: number } {
  const todas = getTransacoes()
  const transacoesDoCartao = todas.filter((t) => {
    if (t.cartaoId !== cartaoId) return false
    const dataTransacao = new Date(t.data)

    if (t.parcelas > 1) {
      const mesInicio = dataTransacao.getMonth()
      const anoInicio = dataTransacao.getFullYear()
      const mesesDesdeInicio =
        (ano - anoInicio) * 12 + (mes - mesInicio)
      return mesesDesdeInicio >= 0 && mesesDesdeInicio < t.parcelas
    }

    return (
      dataTransacao.getMonth() === mes &&
      dataTransacao.getFullYear() === ano
    )
  })

  const total = transacoesDoCartao.reduce((sum, t) => {
    if (t.parcelas > 1) {
      return sum + t.valor / t.parcelas
    }
    return sum + t.valor
  }, 0)

  return { transacoes: transacoesDoCartao, total }
}

// Categorias
export function getCategorias(): Categoria[] {
  const stored = getItem<Categoria>(KEYS.categorias, [])
  if (stored.length === 0) {
    const defaults = [...DEFAULT_CATEGORIAS_RECEITA, ...DEFAULT_CATEGORIAS_DESPESA]
    setItem(KEYS.categorias, defaults)
    return defaults
  }
  return stored
}

export function getCategoriasReceita(): string[] {
  return getCategorias()
    .filter((c) => c.tipo === "receita")
    .map((c) => c.nome)
}

export function getCategoriasDespesa(): string[] {
  return getCategorias()
    .filter((c) => c.tipo === "despesa")
    .map((c) => c.nome)
}

export function addCategoria(categoria: Omit<Categoria, "id">): Categoria {
  const categorias = getCategorias()
  const newCategoria: Categoria = {
    ...categoria,
    id: generateId(),
  }
  categorias.push(newCategoria)
  setItem(KEYS.categorias, categorias)
  return newCategoria
}

export function updateCategoria(id: string, updates: Partial<Categoria>) {
  const categorias = getCategorias().map((c) =>
    c.id === id ? { ...c, ...updates } : c
  )
  setItem(KEYS.categorias, categorias)
}

export function deleteCategoria(id: string) {
  setItem(
    KEYS.categorias,
    getCategorias().filter((c) => c.id !== id)
  )
}

// Config do usuario
function getItemSingle<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItemSingle<T>(key: string, data: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

export function getConfig(): ConfigUsuario {
  return getItemSingle<ConfigUsuario>(KEYS.config, DEFAULT_CONFIG)
}

export function updateConfig(updates: Partial<ConfigUsuario>) {
  const config = getConfig()
  setItemSingle(KEYS.config, { ...config, ...updates })
}

// Seed data for demo
export function seedDemoData() {
  if (getContas().length > 0 || getCartoes().length > 0) return

  const conta1 = addConta({
    nome: "Conta Corrente Itau",
    tipo: "pessoal",
    saldo: 5420.5,
  })
  const conta2 = addConta({
    nome: "Conta PJ Bradesco",
    tipo: "empresa",
    saldo: 18750.0,
  })

  const cartao1 = addCartao({
    nome: "Nubank Pessoal",
    banco: "Nubank",
    limite: 8000,
    fechamento: 15,
    vencimento: 25,
  })
  const cartao2 = addCartao({
    nome: "Itau Empresarial",
    banco: "Itau",
    limite: 20000,
    fechamento: 10,
    vencimento: 20,
  })

  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)

  const demoTransacoes: Omit<Transacao, "id">[] = [
    {
      tipo: "receita",
      origem: "pessoal",
      categoria: "Salario",
      valor: 8500,
      data: `${thisMonth}-05`,
      contaId: conta1.id,
      cartaoId: null,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Salario mensal",
    },
    {
      tipo: "despesa",
      origem: "pessoal",
      categoria: "Alimentacao",
      valor: 450,
      data: `${thisMonth}-10`,
      contaId: null,
      cartaoId: cartao1.id,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Supermercado",
    },
    {
      tipo: "despesa",
      origem: "pessoal",
      categoria: "Compras",
      valor: 2400,
      data: `${thisMonth}-08`,
      contaId: null,
      cartaoId: cartao1.id,
      parcelas: 3,
      parcelaAtual: 1,
      observacoes: "Notebook novo",
    },
    {
      tipo: "receita",
      origem: "empresa",
      categoria: "Vendas",
      valor: 15000,
      data: `${thisMonth}-03`,
      contaId: conta2.id,
      cartaoId: null,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Projeto cliente ABC",
    },
    {
      tipo: "despesa",
      origem: "empresa",
      categoria: "Funcionarios",
      valor: 6500,
      data: `${thisMonth}-05`,
      contaId: conta2.id,
      cartaoId: null,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Folha de pagamento",
    },
    {
      tipo: "despesa",
      origem: "empresa",
      categoria: "Marketing",
      valor: 3200,
      data: `${thisMonth}-12`,
      contaId: null,
      cartaoId: cartao2.id,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Campanha Google Ads",
    },
    {
      tipo: "despesa",
      origem: "pessoal",
      categoria: "Transporte",
      valor: 350,
      data: `${thisMonth}-14`,
      contaId: conta1.id,
      cartaoId: null,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Combustivel",
    },
    {
      tipo: "despesa",
      origem: "pessoal",
      categoria: "Lazer",
      valor: 180,
      data: `${thisMonth}-16`,
      contaId: null,
      cartaoId: cartao1.id,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Cinema e jantar",
    },
    {
      tipo: "receita",
      origem: "empresa",
      categoria: "Servicos",
      valor: 4800,
      data: `${thisMonth}-20`,
      contaId: conta2.id,
      cartaoId: null,
      parcelas: 1,
      parcelaAtual: 1,
      observacoes: "Consultoria mensal",
    },
    {
      tipo: "despesa",
      origem: "empresa",
      categoria: "Fornecedores",
      valor: 7800,
      data: `${thisMonth}-07`,
      contaId: null,
      cartaoId: cartao2.id,
      parcelas: 6,
      parcelaAtual: 1,
      observacoes: "Equipamentos de escritorio",
    },
  ]

  for (const t of demoTransacoes) {
    addTransacao(t)
  }
}

// Formatting helpers
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
