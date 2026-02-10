"use client"

import React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useTransacoes, useContas, useCartoes, useCategorias } from "@/hooks/use-financeiro"
import type { TipoTransacao, Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ComprovanteCapture } from "@/components/ui/comprovante-capture"

interface NovaTransacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovaTransacaoDialog({
  open,
  onOpenChange,
}: NovaTransacaoDialogProps) {
  const { criar } = useTransacoes()
  const { contas } = useContas()
  const { cartoes } = useCartoes()
  const { receita: categoriasReceita, despesa: categoriasDespesa } = useCategorias()

  const [tipo, setTipo] = useState<TipoTransacao>("despesa")
  const [origem, setOrigem] = useState<Perfil>("pessoal")
  const [categoria, setCategoria] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [contaId, setContaId] = useState("")
  const [cartaoId, setCartaoId] = useState("")
  const [parcelas, setParcelas] = useState("1")
  const [observacoes, setObservacoes] = useState("")
  const [usarCartao, setUsarCartao] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)

  const categorias =
    tipo === "receita" ? categoriasReceita : categoriasDespesa

  function resetForm() {
    setTipo("despesa")
    setOrigem("pessoal")
    setCategoria("")
    setValor("")
    setData(new Date().toISOString().slice(0, 10))
    setContaId("")
    setCartaoId("")
    setParcelas("1")
    setObservacoes("")
    setUsarCartao(false)
    setComprovanteUrl(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || !valor || !data) return

    criar({
      tipo,
      origem,
      categoria,
      valor: Number.parseFloat(valor),
      data,
      contaId: usarCartao ? null : contaId || null,
      cartaoId: usarCartao ? cartaoId || null : null,
      parcelas: usarCartao ? Number.parseInt(parcelas) || 1 : 1,
      parcelaAtual: 1,
      observacoes,
      comprovanteUrl,
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
      <div className="relative z-50 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border bg-card sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-card-foreground">
            Adicionar nova transacao
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          {/* Tipo */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["receita", "despesa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  setCategoria("")
                }}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  tipo === t
                    ? t === "receita"
                      ? "bg-income text-[#fff]"
                      : "bg-expense text-[#fff]"
                    : "text-muted-foreground"
                )}
              >
                {t === "receita" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          {/* Origem */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Origem
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {(["pessoal", "empresa"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrigem(o)}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                    origem === o
                      ? o === "pessoal"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {o === "pessoal" ? "Pessoal" : "Empresa"}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label
              htmlFor="categoria"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Categoria
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="valor"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Valor (R$)
              </label>
              <input
                id="valor"
                type="number"
                min="0.01"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label
                htmlFor="data"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Data
              </label>
              <input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* Cartao toggle */}
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-card-foreground">
              <input
                type="checkbox"
                checked={usarCartao}
                onChange={(e) => setUsarCartao(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              Pagar com cartao de credito
            </label>
          </div>

          {/* Conta ou Cartao */}
          {usarCartao ? (
            <>
              <div>
                <label
                  htmlFor="cartao"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Cartao de credito
                </label>
                <select
                  id="cartao"
                  value={cartaoId}
                  onChange={(e) => setCartaoId(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="parcelas"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Parcelar em quantas vezes?
                </label>
                <select
                  id="parcelas"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}x
                        {n > 1
                          ? ` de R$ ${(
                            Number.parseFloat(valor || "0") / n
                          ).toFixed(2)}`
                          : " (a vista)"}
                      </option>
                    )
                  )}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="conta"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Conta bancaria
              </label>
              <select
                id="conta"
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Nenhuma (sem vincular)</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Observacoes */}
          <div>
            <label
              htmlFor="observacoes"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Observacoes
            </label>
            <input
              id="observacoes"
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Supermercado, Restaurante..."
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Comprovante */}
          <ComprovanteCapture
            value={comprovanteUrl}
            onChange={setComprovanteUrl}
          />

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Adicionar transacao
          </button>
        </form>
      </div>
    </div>
  )
}
