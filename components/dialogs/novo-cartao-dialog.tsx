"use client"

import React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { useCartoes } from "@/hooks/use-financeiro"
import type { Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NovoCartaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoCartaoDialog({
  open,
  onOpenChange,
}: NovoCartaoDialogProps) {
  const { criar } = useCartoes()

  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState<Perfil>("pessoal")
  const [banco, setBanco] = useState("")
  const [limite, setLimite] = useState("")
  const [fechamento, setFechamento] = useState("15")
  const [vencimento, setVencimento] = useState("25")

  function resetForm() {
    setNome("")
    setTipo("pessoal")
    setBanco("")
    setLimite("")
    setFechamento("15")
    setVencimento("25")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !banco || !limite) return

    criar({
      nome,
      tipo,
      banco,
      limite: Number.parseFloat(limite),
      fechamento: Number.parseInt(fechamento),
      vencimento: Number.parseInt(vencimento),
    })

    resetForm()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-foreground/40"
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
      />
      <div className="relative z-50 flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-card-foreground">
            Novo cartao de credito
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-4 py-4"
        >
          <div>
            <label
              htmlFor="cartao-nome"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Nome do cartao
            </label>
            <input
              id="cartao-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nubank Pessoal"
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {(["pessoal", "empresa"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                    tipo === t
                      ? t === "pessoal"
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 text-white"
                      : "text-muted-foreground"
                  )}
                >
                  {t === "pessoal" ? "Pessoal" : "Empresa"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cartao-banco"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Banco
            </label>
            <input
              id="cartao-banco"
              type="text"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Ex: Nubank"
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label
              htmlFor="cartao-limite"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Limite (R$)
            </label>
            <input
              id="cartao-limite"
              type="number"
              min="1"
              step="0.01"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="10000"
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cartao-fechamento"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Dia de fechamento
              </label>
              <input
                id="cartao-fechamento"
                type="number"
                min="1"
                max="31"
                value={fechamento}
                onChange={(e) => setFechamento(e.target.value)}
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label
                htmlFor="cartao-vencimento"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Dia de vencimento
              </label>
              <input
                id="cartao-vencimento"
                type="number"
                min="1"
                max="31"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Cadastrar cartao
          </button>
        </form>
      </div>
    </div>
  )
}
