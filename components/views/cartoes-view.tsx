"use client"

import { useState } from "react"
import { CreditCard, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useCartoes, useTransacoes } from "@/hooks/use-financeiro"
import { formatCurrency, calcularFaturas } from "@/lib/store"
import type { Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"
import { NovoCartaoDialog } from "@/components/dialogs/novo-cartao-dialog"
import { NovaContaDialog } from "@/components/dialogs/nova-conta-dialog"
import { useContas } from "@/hooks/use-financeiro"

interface CartoesViewProps {
  perfil: Perfil | "todas"
}

export function CartoesView({ perfil }: CartoesViewProps) {
  const { cartoes, remover: removerCartao } = useCartoes()
  const { contas, remover: removerConta } = useContas()
  const { transacoes } = useTransacoes(perfil)
  const [showCartaoDialog, setShowCartaoDialog] = useState(false)
  const [showContaDialog, setShowContaDialog] = useState(false)
  const [expandedCartao, setExpandedCartao] = useState<string | null>(null)

  const now = new Date()
  const mesAtual = now.getMonth()
  const anoAtual = now.getFullYear()

  const contasFiltradas =
    perfil === "todas" ? contas : contas.filter((c) => c.tipo === perfil)

  const meses = [
    { mes: mesAtual, ano: anoAtual, label: "Fatura Atual" },
    {
      mes: mesAtual + 1 > 11 ? 0 : mesAtual + 1,
      ano: mesAtual + 1 > 11 ? anoAtual + 1 : anoAtual,
      label: "Proxima Fatura",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Contas bancarias */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Contas Bancarias
          </h2>
          <button
            type="button"
            onClick={() => setShowContaDialog(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova conta</span>
          </button>
        </div>

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
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-card-foreground">
                    {formatCurrency(conta.saldo)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerConta(conta.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remover conta ${conta.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cartoes de credito */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Cartoes de Credito
          </h2>
          <button
            type="button"
            onClick={() => setShowCartaoDialog(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo cartao</span>
          </button>
        </div>

        {cartoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum cartao cadastrado.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {cartoes.map((cartao) => {
              const isExpanded = expandedCartao === cartao.id
              return (
                <div
                  key={cartao.id}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-card-foreground">
                            {cartao.nome}
                          </span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                              cartao.tipo === "pessoal"
                                ? "bg-emerald-600/10 text-emerald-600"
                                : "bg-blue-600/10 text-blue-600"
                            )}
                          >
                            {cartao.tipo}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {cartao.banco} | Fecha dia {cartao.fechamento} |
                          Vence dia {cartao.vencimento}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Limite: {formatCurrency(cartao.limite)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCartao(
                            isExpanded ? null : cartao.id
                          )
                        }
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                        aria-label="Ver faturas"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removerCartao(cartao.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remover cartao ${cartao.nome}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3">
                      {meses.map(({ mes, ano, label }) => {
                        const { transacoes: faturaTransacoes, total } =
                          calcularFaturas(transacoes, cartao.id, mes, ano)

                        const pessoalTotal = faturaTransacoes
                          .filter((t) => t.origem === "pessoal")
                          .reduce((s, t) => s + t.valor, 0)

                        const empresaTotal = faturaTransacoes
                          .filter((t) => t.origem === "empresa")
                          .reduce((s, t) => s + t.valor, 0)

                        return (
                          <div key={`${mes}-${ano}`} className="mb-3 last:mb-0">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-card-foreground">
                                {label}
                              </span>
                              <span className="text-sm font-bold text-card-foreground">
                                {formatCurrency(total)}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>
                                Pessoal:{" "}
                                <span className="font-medium text-primary">
                                  {formatCurrency(pessoalTotal)}
                                </span>
                              </span>
                              <span>
                                Empresa:{" "}
                                <span className="font-medium text-accent">
                                  {formatCurrency(empresaTotal)}
                                </span>
                              </span>
                            </div>
                            {faturaTransacoes.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1">
                                {faturaTransacoes.map((t) => (
                                  <div
                                    key={t.id}
                                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs"
                                  >
                                    <span className="text-card-foreground">
                                      {t.categoria}
                                      {t.observacoes
                                        ? ` - ${t.observacoes}`
                                        : ""}
                                      {t.parcelas > 1 &&
                                        ` (parcela ${t.parcelaAtual}/${t.parcelas})`}
                                    </span>
                                    <span className="font-medium text-card-foreground">
                                      {formatCurrency(t.valor)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <NovoCartaoDialog
        open={showCartaoDialog}
        onOpenChange={setShowCartaoDialog}
      />
      <NovaContaDialog
        open={showContaDialog}
        onOpenChange={setShowContaDialog}
      />
    </div>
  )
}
