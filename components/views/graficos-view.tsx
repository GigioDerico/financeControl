"use client"

import { useMemo } from "react"
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
  const mesAtual = now.getMonth()
  const anoAtual = now.getFullYear()

  const transacoesMes = transacoes.filter((t) => {
    const d = new Date(t.data)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
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

  // Monthly trends (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { name: string; receitas: number; despesas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      let m = mesAtual - i
      let y = anoAtual
      if (m < 0) {
        m += 12
        y -= 1
      }
      const monthName = new Date(y, m).toLocaleDateString("pt-BR", {
        month: "short",
      })
      const monthTx = transacoes.filter((t) => {
        const d = new Date(t.data)
        return d.getMonth() === m && d.getFullYear() === y
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
  }, [transacoes, mesAtual, anoAtual])

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
      <h2 className="text-lg font-bold text-foreground">
        Graficos e Analises
      </h2>

      {/* Summary bar */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Receitas do mes</span>
          <p className="text-lg font-bold text-income">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="flex-1 rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Despesas do mes</span>
          <p className="text-lg font-bold text-expense">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
      </div>

      {/* Monthly trends */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Receitas vs Despesas (6 meses)
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
