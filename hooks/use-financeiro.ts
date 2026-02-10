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
    tipo: c.tipo || "pessoal",
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
    origem: (t.origem || "pessoal") as Perfil, // Agora temos a coluna origem no banco
    categoria: t.categorias?.nome || "Outros", // Join com categorias
    valor: t.valor,
    data: t.data,
    contaId: t.conta_id,
    cartaoId: t.cartao_id,
    parcelas: t.parcelas_total,
    parcelaAtual: t.parcela_atual,
    observacoes: t.descricao, // DB: descricao -> UI: observacoes (mapeamento reverso)
    grupoId: t.grupo_id, // Mapeamento do grupo_id
    comprovanteUrl: t.comprovante_url || null,
  }))
}

// --- Hooks ---

export function useContas() {
  const { data = [], error, isLoading } = useSWR<ContaBancaria[]>(SWR_KEYS.contas, fetchContas)

  const criar = useCallback(async (conta: Omit<ContaBancaria, "id">) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("contas").insert({
      user_id: user.id,
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("cartoes").insert({
      user_id: user.id,
      nome: cartao.nome,
      tipo: cartao.tipo,
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar ID da categoria pelo nome (gambiarra temp, ideal é UI passar ID)
    const { data: cats } = await supabase.from("categorias").select("id").eq("nome", transacao.categoria).single()

    // Preparar dados base
    const numParcelas = transacao.parcelas || 1
    const valorTotal = transacao.valor
    const valorParcelaBase = Math.floor((valorTotal / numParcelas) * 100) / 100
    const diferenca = Number((valorTotal - (valorParcelaBase * numParcelas)).toFixed(2)) // Centavos sobraram
    const grupoId = crypto.randomUUID() // Novo ID para agrupar parcelas
    const dataBase = new Date(transacao.data + "T12:00:00") // Force timezone safe parsing

    const inserts = []

    for (let i = 0; i < numParcelas; i++) {
      const valorFinal = i === 0 ? Number((valorParcelaBase + diferenca).toFixed(2)) : valorParcelaBase

      // Calcular data do mes i
      const dataVencimento = new Date(dataBase)
      dataVencimento.setMonth(dataBase.getMonth() + i)

      // Se o dia mudou (ex: 31/01 -> 31/02 vira 03/03), rolar para o ultimo dia do mes correto
      // Mas o JS setMonth faz overflow automatico (31 Jan + 1 mes -> 3 Março ou 2 Março).
      // Isso é ok para a maioria, mas em finanças as vezes queremos dia fixo.
      // Vou manter o default do JS por enquanto.

      inserts.push({
        user_id: user.id,
        descricao: transacao.observacoes || "Sem descrição",
        valor: valorFinal, // Valor JÁ É A PARCELA
        tipo: transacao.tipo,
        data: dataVencimento.toISOString().split('T')[0],
        conta_id: transacao.contaId || null,
        cartao_id: transacao.cartaoId || null,
        categoria_id: cats?.id || null,
        parcelas_total: numParcelas,
        parcela_atual: i + 1,
        grupo_id: grupoId,
        efetivado: true,
        comprovante_url: i === 0 ? (transacao as any).comprovanteUrl || null : null,
      })
    }

    const { error } = await supabase.from("transacoes").insert(inserts)

    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    }
  }, [])

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from("transacoes").delete().eq("id", id)
    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    }
  }, [])

  const editar = useCallback(async (id: string, updates: Partial<Transacao>) => {
    // Mapeamento de updates frontend -> backend
    const payload: any = {}

    if (updates.observacoes !== undefined) payload.descricao = updates.observacoes
    if (updates.valor !== undefined) payload.valor = updates.valor
    if (updates.data !== undefined) payload.data = updates.data
    if (updates.tipo !== undefined) payload.tipo = updates.tipo
    if (updates.origem !== undefined) payload.origem = updates.origem
    if (updates.contaId !== undefined) payload.conta_id = updates.contaId
    if (updates.cartaoId !== undefined) payload.cartao_id = updates.cartaoId
    if (updates.comprovanteUrl !== undefined) payload.comprovante_url = updates.comprovanteUrl

    // Se mudou categoria, buscar ID pelo nome (mesma gambiarra do criar, ideal é usar ID)
    if (updates.categoria) {
      const { data: cat } = await supabase
        .from("categorias")
        .select("id")
        .eq("nome", updates.categoria)
        .single()
      if (cat) payload.categoria_id = cat.id
    }

    const { error } = await supabase.from("transacoes").update(payload).eq("id", id)

    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    }
  }, [])

  return { transacoes: filtradas, todas: data, criar, remover, editar, isLoading, error }
}

export function useCategorias() {
  const { data = [], error, isLoading } = useSWR<Categoria[]>(SWR_KEYS.categorias, fetchCategorias)

  const receita = data.filter((c) => c.tipo === "receita").map((c) => c.nome)
  const despesa = data.filter((c) => c.tipo === "despesa").map((c) => c.nome)

  const criar = useCallback(async (cat: { nome: string; tipo: TipoTransacao }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("categorias").insert({
      user_id: user.id,
      nome: cat.nome,
      tipo: cat.tipo
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
  return { config: mockData, salvar: (updates: Partial<ConfigUsuario>) => { console.log("Salvar config (mock):", updates) } }
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
