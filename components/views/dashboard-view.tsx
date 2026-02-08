"use client"

import React from "react"

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { useContas, useCartoes, useTransacoes } from "@/hooks/use-financeiro"
import { formatCurrency, formatDate, calcularFaturas } from "@/lib/store"
import type { Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DashboardViewProps {
  perfil: Perfil | "todas"
}

export function DashboardView({ perfil }: DashboardViewProps) {
  const { contas } = useContas()
  const { cartoes } = useCartoes()
  const { transacoes } = useTransacoes(perfil)

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
    const { total } = calcularFaturas(c.id, mesAtual, anoAtual)
    return sum + total
  }, 0)

  const recentes = [...transacoes]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 8)

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
          value={formatCurrency(totalReceitas)}
          icon={TrendingUp}
          variant="income"
        />
        <SummaryCard
          label="Despesas (mes)"
          value={formatCurrency(totalDespesas)}
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

      {/* Accounts */}
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
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
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

      {/* Recent transactions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Transacoes Recentes
        </h2>
        {recentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma transacao encontrada.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentes.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
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
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
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
    </div>
  )
}

function SummaryCard({
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
      <span className="text-lg font-bold text-card-foreground">{value}</span>
    </div>
  )
}
