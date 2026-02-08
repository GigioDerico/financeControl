"use client"

import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import type {
  ContaBancaria,
  CartaoCredito,
  Transacao,
  FaturaCartao,
  Categoria,
  ConfigUsuario,
  Perfil,
  TipoTransacao,
} from "@/lib/types"
import { useCallback, useState } from "react"

// Chaves de cache SWR
const SWR_KEYS = {
  contas: "supabase:contas",
  cartoes: "supabase:cartoes",
  transacoes: "supabase:transacoes",
  categorias: "supabase:categorias",
  config: "supabase:config",
}

// Cliente Supabase
const supabase = createClient()

// --- Fetchers (Mapeiam snake_case do DB para camelCase da UI) ---

const fetchContas = async (): Promise<ContaBancaria[]> => {
  const { data, error } = await supabase.from("contas").select("*").order("nome")
  if (error) throw error
  return data || []
}

const fetchCartoes = async (): Promise<CartaoCredito[]> => {
  const { data, error } = await supabase.from("cartoes").select("*").order("nome")
  if (error) throw error
  // Mapeamento manual de colunas diferentes
  return (data || []).map((c) => ({
    id: c.id,
    nome: c.nome,
    banco: c.banco,
    limite: c.limite,
    fechamento: c.dia_fechamento, // DB: dia_fechamento -> UI: fechamento
    vencimento: c.dia_vencimento, // DB: dia_vencimento -> UI: vencimento
  }))
}

const fetchCategorias = async (): Promise<Categoria[]> => {
  const { data, error } = await supabase.from("categorias").select("*").order("nome")
  if (error) throw error
  return (data || []) as Categoria[]
}

const fetchTransacoes = async (): Promise<Transacao[]> => {
  const { data, error } = await supabase
    .from("transacoes")
    .select(`
      *,
      categorias (nome)
    `)
    .order("data", { ascending: false })

  if (error) throw error

  return (data || []).map((t) => ({
    id: t.id,
    tipo: t.tipo as TipoTransacao,
    // No DB não temos coluna "origem" (pessoal/empresa) na transação, 
    // ela deriva da conta/cartão, mas por simplicidade no MVP assumi-se que
    // o frontend manda ou precisamos inferir. 
    // Para manter compatibilidade com UI atual, vamos usar um valor default ou buscar da conta/cartao
    origem: "pessoal", // TODO: Melhorar modelagem para trazer origem da conta/cartao via join
    categoria: t.categorias?.nome || "Outros", // Join com categorias
    valor: t.valor,
    data: t.data,
    contaId: t.conta_id,
    cartaoId: t.cartao_id,
    parcelas: t.parcelas_total,
    parcelaAtual: t.parcela_atual,
    observacoes: t.descricao, // DB: descricao -> UI: observacoes (mapeamento reverso)
  }))
}

// --- Hooks ---

export function useContas() {
  const { data = [], error, isLoading } = useSWR<ContaBancaria[]>(SWR_KEYS.contas, fetchContas)

  const criar = useCallback(async (conta: Omit<ContaBancaria, "id">) => {
    const { error } = await supabase.from("contas").insert({
      nome: conta.nome,
      tipo: conta.tipo,
      saldo: conta.saldo,
    })
    if (!error) mutate(SWR_KEYS.contas)
  }, [])

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from("contas").delete().eq("id", id)
    if (!error) mutate(SWR_KEYS.contas)
  }, [])

  return { contas: data, criar, remover, isLoading, error }
}

export function useCartoes() {
  const { data = [], error, isLoading } = useSWR<CartaoCredito[]>(SWR_KEYS.cartoes, fetchCartoes)

  const criar = useCallback(async (cartao: Omit<CartaoCredito, "id">) => {
    const { error } = await supabase.from("cartoes").insert({
      nome: cartao.nome,
      banco: cartao.banco,
      limite: cartao.limite,
      dia_fechamento: cartao.fechamento,
      dia_vencimento: cartao.vencimento,
    })
    if (!error) mutate(SWR_KEYS.cartoes)
  }, [])

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from("cartoes").delete().eq("id", id)
    if (!error) mutate(SWR_KEYS.cartoes)
  }, [])

  return { cartoes: data, criar, remover, isLoading, error }
}

export function useTransacoes(filtroOrigem?: Perfil | "todas") {
  const { data = [], error, isLoading } = useSWR<Transacao[]>(SWR_KEYS.transacoes, fetchTransacoes)

  // Filtragem no cliente por enquanto (pode ser movida para query no futuro)
  const filtradas =
    !filtroOrigem || filtroOrigem === "todas"
      ? data
      : data.filter((t) => t.origem === filtroOrigem)

  const criar = useCallback(async (transacao: Omit<Transacao, "id">) => {
    // Buscar ID da categoria pelo nome (gambiarra temp, ideal é UI passar ID)
    const { data: cats } = await supabase.from("categorias").select("id").eq("nome", transacao.categoria).single()

    // Preparar payload snake_case
    const payload = {
      descricao: transacao.observacoes || "Sem descrição",
      valor: transacao.valor,
      tipo: transacao.tipo,
      data: transacao.data,
      conta_id: transacao.contaId || null,
      cartao_id: transacao.cartaoId || null,
      categoria_id: cats?.id || null, // Se não achar ID, vai null
      parcelas_total: transacao.parcelas || 1,
      parcela_atual: transacao.parcelaAtual || 1,
      efetivado: true // Por padrão efetivado
    }

    const { error } = await supabase.from("transacoes").insert(payload)

    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas) // Saldo atualiza via trigger, precisamos recarregar contas
    }
  }, [])

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from("transacoes").delete().eq("id", id)
    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    }
  }, [])

  return { transacoes: filtradas, todas: data, criar, remover, isLoading, error }
}

export function useCategorias() {
  const { data = [], error, isLoading } = useSWR<Categoria[]>(SWR_KEYS.categorias, fetchCategorias)

  const receita = data.filter((c) => c.tipo === "receita").map((c) => c.nome)
  const despesa = data.filter((c) => c.tipo === "despesa").map((c) => c.nome)

  const criar = useCallback(async (cat: { nome: string; tipo: TipoTransacao }) => {
    const { error } = await supabase.from("categorias").insert({
      nome: cat.nome,
      tipo: cat.tipo
      // icone nao mapeado na UI ainda
    })
    if (!error) mutate(SWR_KEYS.categorias)
  }, [])

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id)
    if (!error) mutate(SWR_KEYS.categorias)
  }, [])

  const atualizar = useCallback(async (id: string, updates: Partial<Categoria>) => {
    const { error } = await supabase.from("categorias").update(updates).eq("id", id)
    if (!error) mutate(SWR_KEYS.categorias)
  }, [])

  return { categorias: data, receita, despesa, criar, atualizar, remover, isLoading, error }
}

// Config e Perfil mantidos simples/locais por enquanto ou migrados depois
export function useConfigUsuario() {
  // TODO: Migrar para tabela user_settings
  // Mock temporario para nao quebrar UI
  const mockData: ConfigUsuario = { nomeUsuario: "Usuário", moeda: "BRL", formatoData: "dd/mm/yyyy" }
  return { config: mockData, salvar: () => { } }
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | "todas">("todas")
  return { perfil, setPerfil }
}

export function useFaturas() {
  // TODO: Implementar lógica de faturas no backend (View SQL)
  // Por enquanto retorna vazio para nao quebrar
  return { faturas: [], atualizarStatus: () => { } }
}

export function useSeedData() {
  // Seed deve ser feito no backend ou via script, não no hook cliente
}
