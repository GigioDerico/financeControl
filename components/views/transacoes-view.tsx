"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Trash2,
  Plus,
} from "lucide-react"
import { useTransacoes, useContas, useCartoes } from "@/hooks/use-financeiro"
import { formatCurrency, formatDate } from "@/lib/store"
import type { Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TransacoesViewProps {
  perfil: Perfil | "todas"
  onNovaTransacao: () => void
}

export function TransacoesView({
  perfil,
  onNovaTransacao,
}: TransacoesViewProps) {
  const { transacoes, remover } = useTransacoes(perfil)
  const { contas } = useContas()
  const { cartoes } = useCartoes()
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<
    "todas" | "receita" | "despesa"
  >("todas")

  const contaMap = Object.fromEntries(contas.map((c) => [c.id, c.nome]))
  const cartaoMap = Object.fromEntries(cartoes.map((c) => [c.id, c.nome]))

  const filtradas = transacoes
    .filter((t) => {
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
      </div>

      {/* List */}
      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma transacao encontrada.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtradas.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
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
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    {t.origem}
                  </span>
                  {t.cartaoId && cartaoMap[t.cartaoId] && (
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
                onClick={() => remover(t.id)}
                className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remover transacao ${t.categoria}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
