"use client"

import { useState, useMemo } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Trash2,
  Plus,
  Layers,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react"
import { useTransacoes, useContas, useCartoes } from "@/hooks/use-financeiro"
import { formatCurrency, formatDate } from "@/lib/store"
import type { Perfil, Transacao, CartaoCredito } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DetalhesTransacaoDialog } from "@/components/dialogs/detalhes-transacao-dialog"

interface TransacoesViewProps {
  perfil: Perfil | "todas"
  onNovaTransacao: () => void
}

interface GrupoCartao {
  cartao: CartaoCredito | null
  transacoes: Transacao[]
  total: number
}

export function TransacoesView({
  perfil,
  onNovaTransacao,
}: TransacoesViewProps) {
  const { transacoes, remover } = useTransacoes(perfil)
  const { contas } = useContas()
  const { cartoes } = useCartoes()
  const [busca, setBusca] = useState("")
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<
    "todas" | "receita" | "despesa"
  >("todas")
  const [agruparPorCartao, setAgruparPorCartao] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const hoje = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())

  const contaMap = Object.fromEntries(contas.map((c) => [c.id, c.nome]))
  const cartaoMap = Object.fromEntries(cartoes.map((c) => [c.id, c.nome]))
  const cartaoById = Object.fromEntries(cartoes.map((c) => [c.id, c]))

  const filtradas = transacoes
    .filter((t) => {
      const [ano, mes] = t.data.split('-').map(Number)
      if (mes - 1 !== mesSelecionado || ano !== anoSelecionado) return false
      if (filtroTipo !== "todas" && t.tipo !== filtroTipo) return false
      if (busca) {
        const lower = busca.toLowerCase()
        return (
          t.categoria.toLowerCase().includes(lower) ||
          t.observacoes.toLowerCase().includes(lower)
        )
      }
      return true
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // Agrupamento por cartão
  const grupos = useMemo((): GrupoCartao[] => {
    if (!agruparPorCartao) return []

    const map = new Map<string, GrupoCartao>()

    for (const t of filtradas) {
      const key = t.cartaoId || "__sem_cartao__"

      if (!map.has(key)) {
        map.set(key, {
          cartao: t.cartaoId ? cartaoById[t.cartaoId] || null : null,
          transacoes: [],
          total: 0,
        })
      }

      const grupo = map.get(key)!
      grupo.transacoes.push(t)
      grupo.total += t.tipo === "despesa" ? t.valor : -t.valor
    }

    // Ordenar: cartões primeiro (por nome), "sem cartão" por último
    return Array.from(map.values()).sort((a, b) => {
      if (!a.cartao && b.cartao) return 1
      if (a.cartao && !b.cartao) return -1
      if (a.cartao && b.cartao) return a.cartao.nome.localeCompare(b.cartao.nome)
      return 0
    })
  }, [filtradas, agruparPorCartao, cartaoById])

  function toggleCard(id: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const avancarMes = () => {
    if (mesSelecionado === 11) {
      setMesSelecionado(0)
      setAnoSelecionado(anoSelecionado + 1)
    } else {
      setMesSelecionado(mesSelecionado + 1)
    }
  }

  const voltarMes = () => {
    if (mesSelecionado === 0) {
      setMesSelecionado(11)
      setAnoSelecionado(anoSelecionado - 1)
    } else {
      setMesSelecionado(mesSelecionado - 1)
    }
  }

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Componente de item de transação (reutilizado em ambos os modos)
  function TransacaoItem({ t }: { t: Transacao }) {
    return (
      <div
        onClick={() => setSelectedTransacao(t)}
        className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
      >
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
            t.tipo === "receita" ? "bg-income/10" : "bg-expense/10"
          )}
        >
          {t.tipo === "receita" ? (
            <ArrowUpRight className="h-4 w-4 text-income" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-expense" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium text-card-foreground">
            {t.categoria}
            {t.observacoes ? ` - ${t.observacoes}` : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(t.data)}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
                t.origem === "pessoal"
                  ? "bg-emerald-600/10 text-emerald-600"
                  : "bg-blue-600/10 text-blue-600"
              )}
            >
              {t.origem}
            </span>
            {t.cartaoId && cartaoMap[t.cartaoId] && !agruparPorCartao && (
              <span className="text-xs text-muted-foreground">
                {cartaoMap[t.cartaoId]}
              </span>
            )}
            {t.contaId && contaMap[t.contaId] && (
              <span className="text-xs text-muted-foreground">
                {contaMap[t.contaId]}
              </span>
            )}
            {t.parcelas > 1 && (
              <span className="text-xs text-muted-foreground">
                {t.parcelaAtual}/{t.parcelas}x
              </span>
            )}
          </div>
        </div>

        <span
          className={cn(
            "text-sm font-semibold whitespace-nowrap",
            t.tipo === "receita" ? "text-income" : "text-expense"
          )}
        >
          {t.tipo === "receita" ? "+" : "-"}
          {formatCurrency(t.valor)}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            remover(t.id)
          }}
          className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remover transacao ${t.categoria}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Transacoes</h2>
        <button
          type="button"
          onClick={onNovaTransacao}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova transacao</span>
        </button>
      </div>

      {/* Month/Year Navigator */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <button
          onClick={voltarMes}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-secondary"
          aria-label="Mês anterior"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-card-foreground">
            {mesesNomes[mesSelecionado]} {anoSelecionado}
          </p>
        </div>
        <button
          onClick={avancarMes}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-secondary"
          aria-label="Próximo mês"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por categoria ou observacao..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["todas", "receita", "despesa"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFiltroTipo(tipo)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filtroTipo === tipo
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tipo === "todas"
                  ? "Todas"
                  : tipo === "receita"
                    ? "Receitas"
                    : "Despesas"}
              </button>
            ))}
          </div>

          {/* Toggle agrupar por cartão */}
          <button
            type="button"
            onClick={() => {
              setAgruparPorCartao(!agruparPorCartao)
              setExpandedCards(new Set())
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              agruparPorCartao
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title={agruparPorCartao ? "Desagrupar" : "Agrupar por cartão"}
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma transacao encontrada.
          </p>
        </div>
      ) : agruparPorCartao ? (
        /* === MODO AGRUPADO === */
        <div className="flex flex-col gap-3">
          {grupos.map((grupo) => {
            const groupId = grupo.cartao?.id || "__sem_cartao__"
            const isExpanded = expandedCards.has(groupId)

            return (
              <div
                key={groupId}
                className="overflow-hidden rounded-xl border bg-card"
              >
                {/* Header do grupo */}
                <button
                  type="button"
                  onClick={() => toggleCard(groupId)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      grupo.cartao ? "bg-primary/10" : "bg-secondary"
                    )}>
                      {grupo.cartao ? (
                        <CreditCard className="h-5 w-5 text-primary" />
                      ) : (
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-card-foreground">
                          {grupo.cartao?.nome || "Sem cartão"}
                        </span>
                        {grupo.cartao && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
                              grupo.cartao.tipo === "pessoal"
                                ? "bg-emerald-600/10 text-emerald-600"
                                : "bg-blue-600/10 text-blue-600"
                            )}
                          >
                            {grupo.cartao.tipo}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {grupo.transacoes.length} transaç{grupo.transacoes.length === 1 ? "ão" : "ões"}
                        {grupo.cartao && ` • Fecha dia ${grupo.cartao.fechamento}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-expense">
                      {formatCurrency(grupo.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Transações expandidas */}
                {isExpanded && (
                  <div className="flex flex-col gap-2 border-t px-3 py-3">
                    {grupo.transacoes.map((t) => (
                      <TransacaoItem key={t.id} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* === MODO LISTA PLANA (original) === */
        <div className="flex flex-col gap-2">
          {filtradas.map((t) => (
            <TransacaoItem key={t.id} t={t} />
          ))}
        </div>
      )}

      <DetalhesTransacaoDialog
        open={!!selectedTransacao}
        onOpenChange={(open) => !open && setSelectedTransacao(null)}
        transacao={selectedTransacao}
      />
    </div>
  )
}
