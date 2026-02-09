"use client"

import React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useContas } from "@/hooks/use-financeiro"
import type { Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NovaContaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovaContaDialog({
  open,
  onOpenChange,
}: NovaContaDialogProps) {
  const { criar } = useContas()

  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState<Perfil>("pessoal")
  const [saldo, setSaldo] = useState("")

  function resetForm() {
    setNome("")
    setTipo("pessoal")
    setSaldo("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome) return

    criar({
      nome,
      tipo,
      saldo: Number.parseFloat(saldo) || 0,
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
            Nova conta bancaria
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
              htmlFor="conta-nome"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Nome da conta
            </label>
            <input
              id="conta-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Conta Corrente Itau"
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
              htmlFor="conta-saldo"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Saldo inicial (R$)
            </label>
            <input
              id="conta-saldo"
              type="number"
              step="0.01"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              placeholder="0,00"
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Cadastrar conta
          </button>
        </form>
      </div>
    </div>
  )
}
