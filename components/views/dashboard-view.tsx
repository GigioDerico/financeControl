"use client"

import React, { useState } from "react"

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { useConfigUsuario, useContas, useCartoes, useTransacoes } from "@/hooks/use-financeiro"
import { formatCurrency, formatDate, calcularFaturas } from "@/lib/store"
import type { Perfil, Transacao } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DetalhesTransacaoDialog } from "@/components/dialogs/detalhes-transacao-dialog"

interface DashboardViewProps {
  perfil: Perfil | "todas"
}

export function DashboardView({ perfil }: DashboardViewProps) {
  const { config } = useConfigUsuario()
  const { contas } = useContas()
  const { cartoes } = useCartoes()
  const { transacoes } = useTransacoes(perfil)
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null)

  const contasFiltradas =
    perfil === "todas" ? contas : contas.filter((c) => c.tipo === perfil)

  const totalSaldo = contasFiltradas.reduce((s, c) => s + c.saldo, 0)

  const now = new Date()
  const mesAtual = now.getMonth()
  const anoAtual = now.getFullYear()

  const transacoesMes = transacoes.filter((t) => {
    const d = new Date(t.data)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  })

  const totalReceitas = transacoesMes
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + t.valor, 0)

  const totalDespesas = transacoesMes
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + t.valor, 0)

  const totalFaturas = cartoes.reduce((sum, c) => {
    const { total } = calcularFaturas(transacoes, c.id, mesAtual, anoAtual)
    return sum + total
  }, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startOfWeek = new Date(today)
  const day = startOfWeek.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const transacoesDoDia = transacoes.filter((t) => {
    const data = new Date(`${t.data}T12:00:00`)
    return (
      data.getFullYear() === today.getFullYear() &&
      data.getMonth() === today.getMonth() &&
      data.getDate() === today.getDate()
    )
  })

  const transacoesDaSemana = transacoes.filter((t) => {
    const data = new Date(`${t.data}T12:00:00`)
    return data >= startOfWeek && data <= endOfWeek
  })

  const contasDoPeriodoBase =
    transacoesDoDia.length > 0 ? transacoesDoDia : transacoesDaSemana
  const contasDoPeriodo = [...contasDoPeriodoBase]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 8)
  const tituloContas =
    transacoesDoDia.length > 0 ? "Contas do Dia" : "Contas da Semana"

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Saldo Total"
          value={formatCurrency(totalSaldo)}
          icon={Wallet}
          variant="neutral"
        />
        <SummaryCard
          label="Receitas (mes)"
          value={`+${formatCurrency(totalReceitas)}`}
          icon={TrendingUp}
          variant="income"
        />
        <SummaryCard
          label="Despesas (mes)"
          value={`-${formatCurrency(totalDespesas)}`}
          icon={TrendingDown}
          variant="expense"
        />
        <SummaryCard
          label="Faturas Abertas"
          value={formatCurrency(totalFaturas)}
          icon={CreditCard}
          variant="neutral"
        />
      </div>

      {!config.ocultarContasInicio && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contas Bancarias
          </h2>
          {contasFiltradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conta cadastrada.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {contasFiltradas.map((conta) => (
                <div
                  key={conta.id}
                  className="flex items-center justify-between rounded-xl border bg-card p-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-card-foreground">
                      {conta.nome}
                    </span>
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        conta.tipo === "pessoal"
                          ? "bg-emerald-600/10 text-emerald-600"
                          : "bg-blue-600/10 text-blue-600"
                      )}
                    >
                      {conta.tipo}
                    </span>
                  </div>
                  <span className="text-base font-bold text-card-foreground">
                    {formatCurrency(conta.saldo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Day/Week bills */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {tituloContas}
        </h2>
        {contasDoPeriodo.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma conta encontrada para o periodo.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {contasDoPeriodo.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTransacao(t)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-secondary/50",
                  t.paga ? "border-emerald-300 bg-emerald-50/70" : "bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                    t.tipo === "receita"
                      ? "bg-income/10"
                      : "bg-expense/10"
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
                  <div className="flex items-center gap-2">
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
              </div>
            ))}
          </div>
        )}
      </section>

      <DetalhesTransacaoDialog
        open={!!selectedTransacao}
        onOpenChange={(open) => !open && setSelectedTransacao(null)}
        transacao={selectedTransacao}
      />
    </div >
  )
}

function SummaryCard({
  // ... (rest of the file)
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string
  value: string
  icon: React.ElementType
  variant: "income" | "expense" | "neutral"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            variant === "income"
              ? "bg-income/10"
              : variant === "expense"
                ? "bg-expense/10"
                : "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              variant === "income"
                ? "text-income"
                : variant === "expense"
                  ? "text-expense"
                  : "text-primary"
            )}
          />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span
        className={cn(
          "text-lg font-bold",
          variant === "income"
            ? "text-income"
            : variant === "expense"
              ? "text-expense"
              : "text-card-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}
