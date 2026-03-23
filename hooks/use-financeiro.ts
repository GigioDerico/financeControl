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
import { DEFAULT_CONFIG } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"

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
const RECORRENCIA_MESES_FUTUROS = 12
let suporteRecorrenciaCache: boolean | null = null
let expansaoRecorrenciaEmAndamento = false

async function suportaColunasRecorrencia(): Promise<boolean> {
  if (suporteRecorrenciaCache !== null) return suporteRecorrenciaCache

  const { error } = await supabase
    .from("transacoes")
    .select("id,recorrente_mensal,recorrencia_ativa,recorrencia_grupo_id")
    .limit(1)

  suporteRecorrenciaCache = !error
  return suporteRecorrenciaCache
}

function parseDateSafe(date: string): Date {
  return new Date(`${date}T12:00:00`)
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

async function expandirRecorrenciasMensaisSeNecessario(transacoes: Transacao[]) {
  if (expansaoRecorrenciaEmAndamento || transacoes.length === 0) return
  expansaoRecorrenciaEmAndamento = true

  try {
    const recorrenciaDisponivel = await suportaColunasRecorrencia()
    if (!recorrenciaDisponivel) return

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return

    const recorrentesAtivas = transacoes.filter(
      (t) => t.recorrenciaMensal && t.recorrenciaAtiva && t.recorrenciaGrupoId
    )
    if (recorrentesAtivas.length === 0) return

    const grupos = new Map<string, Transacao[]>()
    for (const t of recorrentesAtivas) {
      const key = t.recorrenciaGrupoId!
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key)!.push(t)
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const inserts: any[] = []

    for (const [grupoId, items] of grupos.entries()) {
      const ordenadas = [...items].sort(
        (a, b) => parseDateSafe(a.data).getTime() - parseDateSafe(b.data).getTime()
      )
      const ultima = ordenadas[ordenadas.length - 1]
      const datasExistentes = new Set(ordenadas.map((t) => t.data))

      const futuras = ordenadas.filter((t) => parseDateSafe(t.data) > hoje).length
      // Só expande quando a janela recorrente está acabando.
      if (futuras > 1) continue

      const { data: cat } = await supabase
        .from("categorias")
        .select("id")
        .eq("nome", ultima.categoria)
        .single()

      let cursor = parseDateSafe(ultima.data)
      let adicionadas = 0
      let guard = 0
      while (adicionadas < RECORRENCIA_MESES_FUTUROS && guard < 120) {
        guard += 1
        cursor = new Date(cursor)
        cursor.setMonth(cursor.getMonth() + 1)
        const proximaData = formatDateISO(cursor)

        if (datasExistentes.has(proximaData)) continue
        datasExistentes.add(proximaData)
        adicionadas += 1

        inserts.push({
          user_id: authData.user.id,
          descricao: ultima.observacoes || "Sem descrição",
          valor: ultima.valor,
          tipo: ultima.tipo,
          origem: ultima.origem,
          data: proximaData,
          conta_id: ultima.contaId || null,
          cartao_id: null,
          categoria_id: cat?.id || null,
          parcelas_total: 1,
          parcela_atual: 1,
          grupo_id: null,
          efetivado: false,
          recorrente_mensal: true,
          recorrencia_ativa: true,
          recorrencia_grupo_id: grupoId,
          comprovante_url: null,
        })
      }
    }

    if (inserts.length === 0) return

    const { error } = await supabase.from("transacoes").insert(inserts)
    if (!error) {
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    }
  } finally {
    expansaoRecorrenciaEmAndamento = false
  }
}

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
    paga: Boolean(t.efetivado),
    recorrenciaMensal: Boolean(t.recorrente_mensal),
    recorrenciaAtiva: Boolean(t.recorrencia_ativa),
    recorrenciaGrupoId: t.recorrencia_grupo_id || null,
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

  useEffect(() => {
    expandirRecorrenciasMensaisSeNecessario(data)
  }, [data])

  const criar = useCallback(async (transacao: Omit<Transacao, "id">) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario nao autenticado")

    // Buscar ID da categoria pelo nome (gambiarra temp, ideal é UI passar ID)
    const { data: cats } = await supabase.from("categorias").select("id").eq("nome", transacao.categoria).single()

    // Preparar dados base
    const numParcelas = transacao.parcelas || 1
    const isRecorrenciaMensal = Boolean(
      transacao.recorrenciaMensal &&
      !transacao.cartaoId &&
      numParcelas === 1
    )
    const recorrenciaGrupoId = isRecorrenciaMensal ? crypto.randomUUID() : null
    const totalOcorrencias = isRecorrenciaMensal ? RECORRENCIA_MESES_FUTUROS + 1 : numParcelas
    const valorTotal = transacao.valor
    const valorParcelaBase = Math.floor((valorTotal / numParcelas) * 100) / 100
    const diferenca = Number((valorTotal - (valorParcelaBase * numParcelas)).toFixed(2)) // Centavos sobraram
    const grupoId = numParcelas > 1 ? crypto.randomUUID() : null // Novo ID para agrupar parcelas
    const dataBase = new Date(transacao.data + "T12:00:00") // Force timezone safe parsing

    const inserts = []

    for (let i = 0; i < totalOcorrencias; i++) {
      const valorFinal =
        numParcelas > 1
          ? i === 0
            ? Number((valorParcelaBase + diferenca).toFixed(2))
            : valorParcelaBase
          : valorTotal

      // Calcular data do mes i
      const dataVencimento = new Date(dataBase)
      dataVencimento.setMonth(dataBase.getMonth() + i)

      // Se o dia mudou (ex: 31/01 -> 31/02 vira 03/03), rolar para o ultimo dia do mes correto
      // Mas o JS setMonth faz overflow automatico (31 Jan + 1 mes -> 3 Março ou 2 Março).
      // Isso é ok para a maioria, mas em finanças as vezes queremos dia fixo.
      // Vou manter o default do JS por enquanto.

      const insertItem: any = {
        user_id: user.id,
        descricao: transacao.observacoes || "Sem descrição",
        valor: valorFinal, // Valor JÁ É A PARCELA
        tipo: transacao.tipo,
        origem: transacao.origem,
        data: dataVencimento.toISOString().split('T')[0],
        conta_id: transacao.contaId || null,
        cartao_id: transacao.cartaoId || null,
        categoria_id: cats?.id || null,
        parcelas_total: numParcelas > 1 ? numParcelas : 1,
        parcela_atual: numParcelas > 1 ? i + 1 : 1,
        grupo_id: grupoId,
        efetivado: isRecorrenciaMensal ? (i === 0 ? transacao.paga ?? false : false) : transacao.paga ?? false,
        comprovante_url: i === 0 ? (transacao as any).comprovanteUrl || null : null,
      }

      if (isRecorrenciaMensal) {
        insertItem.recorrente_mensal = true
        insertItem.recorrencia_ativa = true
        insertItem.recorrencia_grupo_id = recorrenciaGrupoId
      }

      inserts.push(insertItem)
    }

    const { error } = await supabase.from("transacoes").insert(inserts)
    if (error) throw error

    mutate(SWR_KEYS.transacoes)
    mutate(SWR_KEYS.contas)
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
    if (updates.paga !== undefined) payload.efetivado = updates.paga
    if (updates.recorrenciaMensal !== undefined) payload.recorrente_mensal = updates.recorrenciaMensal
    if (updates.recorrenciaAtiva !== undefined) payload.recorrencia_ativa = updates.recorrenciaAtiva
    if (updates.recorrenciaGrupoId !== undefined) payload.recorrencia_grupo_id = updates.recorrenciaGrupoId

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
    if (error) throw error

    mutate(SWR_KEYS.transacoes)
    mutate(SWR_KEYS.contas)
  }, [])

  const marcarComoPaga = useCallback(async (id: string, paga: boolean) => {
    const { error } = await supabase.from("transacoes").update({ efetivado: paga }).eq("id", id)
    if (!error) mutate(SWR_KEYS.transacoes)
  }, [])

  const revalidarTransacoes = useCallback(() => {
    mutate(SWR_KEYS.transacoes)
    mutate(SWR_KEYS.contas)
  }, [])

  return {
    transacoes: filtradas,
    todas: data,
    criar,
    remover,
    editar,
    marcarComoPaga,
    revalidarTransacoes,
    isLoading,
    error,
  }
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
  const STORAGE_KEY = "financecontrol:user-config"
  const [config, setConfig] = useState<ConfigUsuario>(DEFAULT_CONFIG)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<ConfigUsuario>
      const formatoData =
        parsed.formatoData === "dd/mm/yyyy" ||
        parsed.formatoData === "mm/dd/yyyy" ||
        parsed.formatoData === "yyyy-mm-dd"
          ? parsed.formatoData
          : DEFAULT_CONFIG.formatoData

      setConfig({
        nomeUsuario: typeof parsed.nomeUsuario === "string" ? parsed.nomeUsuario : DEFAULT_CONFIG.nomeUsuario,
        moeda: typeof parsed.moeda === "string" ? parsed.moeda : DEFAULT_CONFIG.moeda,
        formatoData,
        ocultarContasInicio:
          typeof parsed.ocultarContasInicio === "boolean"
            ? parsed.ocultarContasInicio
            : DEFAULT_CONFIG.ocultarContasInicio,
      })
    } catch {
      // Ignora erros de parse e usa config padrao.
    }
  }, [])

  const salvar = useCallback((updates: Partial<ConfigUsuario>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }

      return next
    })
  }, [])

  return { config, salvar }
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
