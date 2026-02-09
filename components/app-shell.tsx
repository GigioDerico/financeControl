"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
// import type { Perfil } from "@/lib/types"
import { DashboardView } from "@/components/views/dashboard-view"
import { TransacoesView } from "@/components/views/transacoes-view"
import { CartoesView } from "@/components/views/cartoes-view"
import { GraficosView } from "@/components/views/graficos-view"
import { ConfiguracoesView } from "@/components/views/configuracoes-view"
import { NovaTransacaoDialog } from "@/components/dialogs/nova-transacao-dialog"

type Tab = "dashboard" | "transacoes" | "cartoes" | "graficos" | "configuracoes"
type Perfil = "pessoal" | "empresa" | "todas"

const tabs = [
  { key: "dashboard", label: "Início", icon: LayoutDashboard },
  { key: "transacoes", label: "Transações", icon: ArrowLeftRight },
  { key: "cartoes", label: "Cartões", icon: CreditCard },
  { key: "graficos", label: "Gráficos", icon: BarChart3 },
  { key: "configuracoes", label: "Config", icon: Settings },
] as const

import { useContas, useCartoes } from "@/hooks/use-financeiro"

export function AppShell() {
  const router = useRouter()
  const supabase = createClient()

  const { contas } = useContas()
  const { cartoes } = useCartoes()

  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [perfil, setPerfil] = useState<Perfil>("todas")
  const [showNovaTransacao, setShowNovaTransacao] = useState(false)
  const [loading, setLoading] = useState(true)

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleNovaTransacao = () => {
    if (contas.length === 0 && cartoes.length === 0) {
      alert("Você precisa cadastrar uma conta bancária ou cartão de crédito antes de criar uma transação.")
      setActiveTab("configuracoes")
      return
    }
    setShowNovaTransacao(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:flex-row md:pb-0">

      {/* Sidebar (Desktop) */}
      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-64 flex-col border-r bg-card p-6 md:flex">
        <div className="mb-14 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            $
          </div>
          <span className="text-xl font-bold tracking-tight">FinControl</span>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t pt-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              $
            </div>
            <span className="font-bold tracking-tight">FinControl</span>
          </div>

          <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">

            {/* Perfil Filter */}
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
              {(["todas", "pessoal", "empresa"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPerfil(p)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    perfil === p
                      ? p === "pessoal"
                        ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        : p === "empresa"
                          ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                          : "bg-slate-800 text-white shadow-sm hover:bg-slate-900"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {p === "todas" ? "Todas" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="container py-10 px-8">
          {activeTab === "dashboard" && <DashboardView perfil={perfil} />}
          {activeTab === "transacoes" && (
            <TransacoesView
              perfil={perfil}
              onNovaTransacao={handleNovaTransacao}
            />
          )}
          {activeTab === "cartoes" && <CartoesView perfil={perfil} />}
          {activeTab === "graficos" && <GraficosView perfil={perfil} />}
          {activeTab === "configuracoes" && <ConfiguracoesView />}
        </div>
      </main>

      {/* FAB - Floating Action Button */}
      <button
        onClick={handleNovaTransacao}
        className="fixed bottom-20 right-4 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-all hover:scale-110 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <NovaTransacaoDialog
        open={showNovaTransacao}
        onOpenChange={setShowNovaTransacao}
      />
    </div>
  )
}
