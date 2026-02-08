"use client"

import React from "react"

import { useState } from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Perfil } from "@/lib/types"
import { DashboardView } from "@/components/views/dashboard-view"
import { TransacoesView } from "@/components/views/transacoes-view"
import { CartoesView } from "@/components/views/cartoes-view"
import { GraficosView } from "@/components/views/graficos-view"
import { ConfiguracoesView } from "@/components/views/configuracoes-view"
import { NovaTransacaoDialog } from "@/components/dialogs/nova-transacao-dialog"

type Tab = "dashboard" | "transacoes" | "cartoes" | "graficos" | "configuracoes"

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { key: "transacoes", label: "Transacoes", icon: ArrowLeftRight },
  { key: "cartoes", label: "Cartoes", icon: CreditCard },
  { key: "graficos", label: "Graficos", icon: BarChart3 },
  { key: "configuracoes", label: "Config", icon: Settings },
]

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [perfil, setPerfil] = useState<Perfil | "todas">("todas")
  const [showNovaTransacao, setShowNovaTransacao] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            FinControl
          </h1>
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["todas", "pessoal", "empresa"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPerfil(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  perfil === p
                    ? p === "pessoal"
                      ? "bg-primary text-primary-foreground"
                      : p === "empresa"
                        ? "bg-accent text-accent-foreground"
                        : "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p === "todas" ? "Todas" : p === "pessoal" ? "Pessoal" : "Empresa"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {activeTab === "dashboard" && <DashboardView perfil={perfil} />}
          {activeTab === "transacoes" && (
            <TransacoesView
              perfil={perfil}
              onNovaTransacao={() => setShowNovaTransacao(true)}
            />
          )}
          {activeTab === "cartoes" && <CartoesView perfil={perfil} />}
          {activeTab === "graficos" && <GraficosView perfil={perfil} />}
          {activeTab === "configuracoes" && <ConfiguracoesView />}
        </div>
      </main>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowNovaTransacao(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Adicionar nova transacao"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom nav (mobile) */}
      <nav className="sticky bottom-0 z-40 border-t bg-card md:hidden">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-56 border-r bg-card p-4 md:block">
        <div className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Adjust main content for desktop sidebar */}
      <style>{`
        @media (min-width: 768px) {
          main {
            margin-left: 14rem;
          }
        }
      `}</style>

      <NovaTransacaoDialog
        open={showNovaTransacao}
        onOpenChange={setShowNovaTransacao}
      />
    </div>
  )
}
