"use client"

import React, { useState, useEffect } from "react"
import { X, Trash2, Pencil, Check, ArrowLeft } from "lucide-react"
import { useTransacoes, useContas, useCartoes, useCategorias } from "@/hooks/use-financeiro"
import { formatCurrency, formatDate } from "@/lib/store"
import type { Transacao, TipoTransacao, Perfil } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

function formatBRLFromDigits(value: string) {
    const digits = value.replace(/\D/g, "")
    const cents = Number(digits || "0")
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(cents / 100)
}

function formatBRLFromNumber(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

function parseBRLToNumber(value: string) {
    const normalized = value
        .replace(/[^\d,]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    return Number.parseFloat(normalized || "0")
}

interface DetalhesTransacaoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transacao: Transacao | null
}

export function DetalhesTransacaoDialog({
    open,
    onOpenChange,
    transacao,
}: DetalhesTransacaoDialogProps) {
    const supabase = createClient()
    const { editar, remover, revalidarTransacoes } = useTransacoes()
    const { contas } = useContas()
    const { cartoes } = useCartoes()
    const { receita: categoriasReceita, despesa: categoriasDespesa } = useCategorias()

    const [isEditing, setIsEditing] = useState(false)

    // Estados de edição
    const [tipo, setTipo] = useState<TipoTransacao>("despesa")
    const [origem, setOrigem] = useState<Perfil>("pessoal")
    const [categoria, setCategoria] = useState("")
    const [valor, setValor] = useState("R$ 0,00")
    const [data, setData] = useState("")
    const [contaId, setContaId] = useState("")
    const [cartaoId, setCartaoId] = useState("")
    const [parcelas, setParcelas] = useState("1")
    const [observacoes, setObservacoes] = useState("")
    const [usarCartao, setUsarCartao] = useState(false)
    const [recorrenciaMensal, setRecorrenciaMensal] = useState(false)

    useEffect(() => {
        if (transacao && open) {
            setTipo(transacao.tipo)
            setOrigem(transacao.origem || "pessoal")
            setCategoria(transacao.categoria)
            setValor(formatBRLFromNumber(transacao.valor))
            setData(transacao.data.slice(0, 10))
            setContaId(transacao.contaId || "")
            setCartaoId(transacao.cartaoId || "")
            setParcelas(transacao.parcelas.toString())
            setObservacoes(transacao.observacoes || "")
            setUsarCartao(!!transacao.cartaoId)
            setRecorrenciaMensal(Boolean(transacao.recorrenciaMensal && transacao.recorrenciaAtiva))
            setIsEditing(false)
        }
    }, [transacao, open])

    if (!open || !transacao) return null

    const handleDelete = () => {
        if (confirm("Tem certeza que deseja excluir esta transaçao?")) {
            remover(transacao.id)
            onOpenChange(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (usarCartao && !cartaoId) return
            if (!usarCartao && !contaId) return

            const valorNumero = parseBRLToNumber(valor)
            const atualizaBase = {
                tipo,
                origem,
                categoria,
                valor: valorNumero,
                data,
                contaId: usarCartao ? null : contaId || null,
                cartaoId: usarCartao ? cartaoId || null : null,
                observacoes,
            }

            const { error: recorrenciaColsError } = await supabase
                .from("transacoes")
                .select("id,recorrente_mensal,recorrencia_ativa,recorrencia_grupo_id")
                .limit(1)
            const recorrenciaDisponivel = !recorrenciaColsError

            // Se for parcelado (grupo_id existe), editar todas as parcelas do grupo
            if (transacao.parcelas > 1 && transacao.grupoId) {
                // Buscar todas as transações do mesmo grupo
                const { data: grupoTransacoes } = await supabase
                    .from('transacoes')
                    .select('id')
                    .eq('grupo_id', transacao.grupoId)

                // Atualizar todas as parcelas
                if (grupoTransacoes) {
                    for (const t of grupoTransacoes) {
                        await editar(t.id, {
                            tipo,
                            origem,
                            categoria,
                            // NÃO atualizar valor (cada parcela pode ter valor diferente por centavos)
                            // NÃO atualizar data (cada parcela tem sua data)
                            contaId: usarCartao ? null : contaId || null,
                            cartaoId: usarCartao ? cartaoId || null : null,
                            observacoes
                        })
                    }
                }
                revalidarTransacoes()
            } else {
                const recorrenciaAtivaAntes = Boolean(transacao.recorrenciaMensal && transacao.recorrenciaAtiva)
                const recorrenciaGrupoId = transacao.recorrenciaGrupoId || crypto.randomUUID()
                const querRecorrencia = !usarCartao && recorrenciaMensal && recorrenciaDisponivel

                if (querRecorrencia) {
                    await editar(transacao.id, {
                        ...atualizaBase,
                        recorrenciaMensal: true,
                        recorrenciaAtiva: true,
                        recorrenciaGrupoId,
                    })

                    const { data: authData } = await supabase.auth.getUser()
                    if (authData.user) {
                        const { data: cat } = await supabase
                            .from("categorias")
                            .select("id")
                            .eq("nome", categoria)
                            .single()

                        const { data: existentes } = await supabase
                            .from("transacoes")
                            .select("data")
                            .eq("recorrencia_grupo_id", recorrenciaGrupoId)

                        const datasExistentes = new Set(
                            (existentes || []).map((e: any) => e.data as string)
                        )

                        const baseDate = new Date(`${data}T12:00:00`)
                        const inserts: any[] = []

                        // Garante janela de 12 meses futuros para essa serie.
                        for (let i = 1; i <= 12; i++) {
                            const dataVencimento = new Date(baseDate)
                            dataVencimento.setMonth(baseDate.getMonth() + i)
                            const dataIso = dataVencimento.toISOString().split("T")[0]

                            if (datasExistentes.has(dataIso)) continue
                            datasExistentes.add(dataIso)

                            inserts.push({
                                user_id: authData.user.id,
                                descricao: observacoes || "Sem descrição",
                                valor: valorNumero,
                                tipo,
                                origem,
                                data: dataIso,
                                conta_id: contaId || null,
                                cartao_id: null,
                                categoria_id: cat?.id || null,
                                parcelas_total: 1,
                                parcela_atual: 1,
                                grupo_id: null,
                                efetivado: false,
                                recorrente_mensal: true,
                                recorrencia_ativa: true,
                                recorrencia_grupo_id: recorrenciaGrupoId,
                            })
                        }

                        if (inserts.length > 0) {
                            const { error: insertError } = await supabase.from("transacoes").insert(inserts)
                            if (insertError) throw insertError
                        }
                    }
                } else {
                    if (recorrenciaMensal && !recorrenciaDisponivel) {
                        alert("Recorrencia mensal indisponivel no banco. Aplique a migration de recorrencia para ativar esse recurso.")
                    }

                    const payloadSemRecorrencia = recorrenciaAtivaAntes
                        ? {
                            ...atualizaBase,
                            recorrenciaMensal: false,
                            recorrenciaAtiva: false,
                            recorrenciaGrupoId: null,
                        }
                        : atualizaBase

                    await editar(transacao.id, payloadSemRecorrencia)

                    // Se estava recorrente antes e foi desativada, remove próximas ocorrências.
                    if (recorrenciaAtivaAntes && transacao.recorrenciaGrupoId) {
                        await supabase
                            .from("transacoes")
                            .delete()
                            .eq("recorrencia_grupo_id", transacao.recorrenciaGrupoId)
                            .gt("data", data)

                        await supabase
                            .from("transacoes")
                            .update({ recorrencia_ativa: false })
                            .eq("recorrencia_grupo_id", transacao.recorrenciaGrupoId)
                    }
                }
                revalidarTransacoes()
            }

            setIsEditing(false)
            onOpenChange(false)
        } catch (error) {
            console.error("Erro ao salvar transacao:", error)
            const message = error instanceof Error ? error.message : "erro desconhecido"
            alert(`Nao foi possivel salvar a transacao: ${message}`)
        }
    }

    const categorias = tipo === "receita" ? categoriasReceita : categoriasDespesa

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <div
                className="fixed inset-0 bg-foreground/40"
                onClick={() => onOpenChange(false)}
                onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
            />
            <div className="relative z-50 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border bg-card sm:rounded-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-secondary/50">
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="rounded-full p-1 hover:bg-secondary"
                            >
                                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                        <h2 className="text-base font-semibold text-card-foreground">
                            {isEditing ? "Editar Transaçao" : "Detalhes da Transaçao"}
                        </h2>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                {isEditing ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
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

                        {/* Origem (Visual apenas por enquanto ou editavel?) */}
                        {/* Vamos manter editável para consistencia com NovaTransacaoDialog */}
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
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-blue-600 text-white"
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
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Categoria
                            </label>
                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            >
                                <option value="">Selecione...</option>
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Valor e Data */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Valor (R$)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={valor}
                                    onChange={(e) => setValor(formatBRLFromDigits(e.target.value))}
                                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Data</label>
                                <input
                                    type="date"
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>
                        </div>

                        {/* Conta/Cartão Toggle */}
                        <div className="flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-card-foreground">
                                <input
                                    type="checkbox"
                                    checked={usarCartao}
                                    onChange={(e) => {
                                        const checked = e.target.checked
                                        setUsarCartao(checked)
                                        if (checked) setRecorrenciaMensal(false)
                                    }}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                                />
                                Pagar com cartao de credito
                            </label>
                        </div>

                        {!usarCartao && (
                            <div className="flex items-center gap-3">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-card-foreground">
                                    <input
                                        type="checkbox"
                                        checked={recorrenciaMensal}
                                        onChange={(e) => setRecorrenciaMensal(e.target.checked)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                                    />
                                    Recorrencia mensal
                                </label>
                            </div>
                        )}

                        {usarCartao ? (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cartao</label>
                                <select
                                    value={cartaoId}
                                    onChange={(e) => setCartaoId(e.target.value)}
                                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {cartoes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Conta</label>
                                <select
                                    value={contaId}
                                    onChange={(e) => setContaId(e.target.value)}
                                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {contas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Observacoes */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Observacoes</label>
                            <input
                                type="text"
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <Check className="h-4 w-4" />
                            Salvar Alteraçoes
                        </button>
                    </form>
                ) : (
                    <div className="p-6 flex flex-col gap-6">
                        {/* Resumo Visual */}
                        <div className="flex flex-col items-center gap-2">
                            <span className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium uppercase",
                                transacao.tipo === "receita" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                            )}>
                                {transacao.tipo}
                            </span>
                            <h1 className={cn(
                                "text-3xl font-bold",
                                transacao.tipo === "receita" ? "text-income" : "text-expense"
                            )}>
                                {formatCurrency(transacao.valor)}
                            </h1>
                            {transacao.parcelas > 1 && (
                                <span className="text-sm font-medium text-muted-foreground">
                                    Parcela {transacao.parcelaAtual} de {transacao.parcelas}
                                </span>
                            )}
                            <span className="text-sm text-muted-foreground">{formatDate(transacao.data)}</span>
                        </div>

                        <div className="rounded-xl border bg-secondary/20 p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Categoria</span>
                                <span className="font-medium text-card-foreground">{transacao.categoria}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Origem</span>
                                <span className={cn(
                                    "font-medium uppercase text-xs px-2 py-0.5 rounded-full",
                                    transacao.origem === "pessoal" ? "bg-emerald-600/10 text-emerald-600" : "bg-blue-600/10 text-blue-600"
                                )}>
                                    {transacao.origem}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Metodo</span>
                                <span className="font-medium text-card-foreground">
                                    {transacao.cartaoId
                                        ? `Cartao ${cartoes.find(c => c.id === transacao.cartaoId)?.nome || ''}`
                                        : transacao.contaId
                                            ? `Conta ${contas.find(c => c.id === transacao.contaId)?.nome || ''}`
                                            : 'Nao informado'
                                    }
                                </span>
                            </div>
                            {transacao.observacoes && (
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-muted-foreground">Obs</span>
                                    <span className="font-medium text-card-foreground text-right max-w-[60%]">{transacao.observacoes}</span>
                                </div>
                            )}
                            {transacao.parcelas > 1 && (
                                <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                    <span className="text-muted-foreground">Valor Total (Aprox.)</span>
                                    <span className="font-bold text-card-foreground">
                                        {formatCurrency(transacao.valor * transacao.parcelas)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg border bg-card py-3 text-sm font-medium transition-colors hover:bg-secondary"
                            >
                                <Pencil className="h-4 w-4" />
                                Editar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
