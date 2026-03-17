"use client"

import { useMemo, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useTransacoes } from "@/hooks/use-financeiro"
import { formatCurrency } from "@/lib/store"
import type { Perfil } from "@/lib/types"

interface GraficosViewProps {
  perfil: Perfil | "todas"
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
]

export function GraficosView({ perfil }: GraficosViewProps) {
  const { transacoes } = useTransacoes(perfil)

  const now = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(now.getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(now.getFullYear())

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const avancarMes = () => {
    if (mesSelecionado === 11) {
      setMesSelecionado(0)
      setAnoSelecionado((a) => a + 1)
    } else {
      setMesSelecionado((m) => m + 1)
    }
  }

  const voltarMes = () => {
    if (mesSelecionado === 0) {
      setMesSelecionado(11)
      setAnoSelecionado((a) => a - 1)
    } else {
      setMesSelecionado((m) => m - 1)
    }
  }

  const transacoesMes = transacoes.filter((t) => {
    const [y, m] = t.data.split('-').map(Number)
    return m - 1 === mesSelecionado && y === anoSelecionado
  })

  // Category breakdown (expenses only)
  const categoriaData = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transacoesMes) {
      if (t.tipo === "despesa") {
        map.set(t.categoria, (map.get(t.categoria) || 0) + t.valor)
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transacoesMes])

  // Monthly trends (6 months ending at selected month)
  const monthlyData = useMemo(() => {
    const months: { name: string; receitas: number; despesas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      let m = mesSelecionado - i
      let y = anoSelecionado
      if (m < 0) {
        m += 12
        y -= 1
      }
      const monthName = new Date(y, m).toLocaleDateString("pt-BR", {
        month: "short",
      })
      const monthTx = transacoes.filter((t) => {
        const [ty, tm] = t.data.split('-').map(Number)
        return tm - 1 === m && ty === y
      })
      months.push({
        name: monthName,
        receitas: monthTx
          .filter((t) => t.tipo === "receita")
          .reduce((s, t) => s + t.valor, 0),
        despesas: monthTx
          .filter((t) => t.tipo === "despesa")
          .reduce((s, t) => s + t.valor, 0),
      })
    }
    return months
  }, [transacoes, mesSelecionado, anoSelecionado])

  // Personal vs Business
  const origemData = useMemo(() => {
    const pessoal = transacoesMes
      .filter((t) => t.origem === "pessoal" && t.tipo === "despesa")
      .reduce((s, t) => s + t.valor, 0)
    const empresa = transacoesMes
      .filter((t) => t.origem === "empresa" && t.tipo === "despesa")
      .reduce((s, t) => s + t.valor, 0)
    return [
      { name: "Pessoal", value: pessoal },
      { name: "Empresa", value: empresa },
    ].filter((d) => d.value > 0)
  }, [transacoesMes])

  const totalDespesas = transacoesMes
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + t.valor, 0)
  const totalReceitas = transacoesMes
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + t.valor, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Gráficos e Análises</h2>
      </div>

      {/* Navegador de mês — T4 */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <button
          type="button"
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
          type="button"
          onClick={avancarMes}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-secondary"
          aria-label="Próximo mês"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Receitas — {mesesNomes[mesSelecionado]}</span>
          <p className="text-lg font-bold text-income">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="flex-1 rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Despesas — {mesesNomes[mesSelecionado]}</span>
          <p className="text-lg font-bold text-expense">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
      </div>

      {/* Monthly trends */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Receitas vs Despesas (6 meses até {mesesNomes[mesSelecionado]})
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid hsl(220, 13%, 91%)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="despesas"
                name="Despesas"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By category */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Despesas por Categoria
          </h3>
          {categoriaData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados para exibir
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {categoriaData.map((_, idx) => (
                        <Cell
                          key={`cat-${
                            // biome-ignore lint: index key ok for static pie
                            idx
                          }`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(220, 13%, 91%)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {categoriaData.map((d, idx) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* By origin */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Despesas: Pessoal vs Empresa
          </h3>
          {origemData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados para exibir
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={origemData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#16a34a" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(220, 13%, 91%)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4">
                {origemData.map((d, idx) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          idx === 0 ? "#2563eb" : "#16a34a",
                      }}
                    />
                    <span className="text-muted-foreground">
                      {d.name}: {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
