import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Pencil, Check, X, LogOut } from "lucide-react"
import { useCategorias, useConfigUsuario, useContas, useCartoes } from "@/hooks/use-financeiro"
import type { TipoTransacao } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ConfiguracoesView() {
  const router = useRouter()
  const supabase = createClient()
  const { categorias, criar, atualizar, remover } = useCategorias()
  const { config, salvar } = useConfigUsuario()
  const { contas, remover: removerConta } = useContas()
  const { cartoes, remover: removerCartao } = useCartoes()

  const [abaCat, setAbaCat] = useState<TipoTransacao>("despesa")
  const [novaCategoria, setNovaCategoria] = useState("")
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editandoNome, setEditandoNome] = useState("")
  const [nomeUsuario, setNomeUsuario] = useState(config.nomeUsuario)

  const categoriasFiltradas = categorias.filter((c) => c.tipo === abaCat)

  function handleAdicionarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome) return
    const jaExiste = categoriasFiltradas.some(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    )
    if (jaExiste) return
    criar({ nome, tipo: abaCat })
    setNovaCategoria("")
  }

  function handleSalvarEdicao(id: string) {
    const nome = editandoNome.trim()
    if (!nome) return
    atualizar(id, { nome })
    setEditandoId(null)
    setEditandoNome("")
  }

  function handleSalvarNome() {
    salvar({ nomeUsuario: nomeUsuario.trim() })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-0">
      <h2 className="text-lg font-bold text-foreground">Configuracoes</h2>

      {/* User profile section */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Perfil do Usuario
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="nomeUsuario"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Nome
            </label>
            <div className="flex gap-2">
              <input
                id="nomeUsuario"
                type="text"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Seu nome"
                className="h-10 flex-1 rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleSalvarNome}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="moeda"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Moeda
            </label>
            <select
              id="moeda"
              value={config.moeda}
              onChange={(e) => salvar({ moeda: e.target.value })}
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dolar (US$)</option>
              <option value="EUR">Euro</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="formatoData"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Formato de Data
            </label>
            <select
              id="formatoData"
              value={config.formatoData}
              onChange={(e) =>
                salvar({
                  formatoData: e.target.value as
                    | "dd/mm/yyyy"
                    | "mm/dd/yyyy"
                    | "yyyy-mm-dd",
                })
              }
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="dd/mm/yyyy">DD/MM/AAAA</option>
              <option value="mm/dd/yyyy">MM/DD/AAAA</option>
              <option value="yyyy-mm-dd">AAAA-MM-DD</option>
            </select>
          </div>
        </div>
      </section>

      {/* Categories section */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Categorias de Transacao
        </h3>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-1 rounded-lg bg-secondary p-1">
          {(["despesa", "receita"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setAbaCat(tipo)}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                abaCat === tipo
                  ? tipo === "receita"
                    ? "bg-income text-[#fff]"
                    : "bg-expense text-[#fff]"
                  : "text-muted-foreground"
              )}
            >
              {tipo === "receita" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdicionarCategoria()}
            placeholder={`Nova categoria de ${abaCat === "receita" ? "receita" : "despesa"}...`}
            className="h-10 flex-1 rounded-lg border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleAdicionarCategoria}
            disabled={!novaCategoria.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Adicionar categoria"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1">
          {categoriasFiltradas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria cadastrada.
            </p>
          ) : (
            categoriasFiltradas.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                {editandoId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSalvarEdicao(cat.id)
                        if (e.key === "Escape") {
                          setEditandoId(null)
                          setEditandoNome("")
                        }
                      }}
                      className="h-8 flex-1 rounded-md border bg-card px-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSalvarEdicao(cat.id)}
                      className="rounded-md p-1.5 text-income transition-colors hover:bg-income/10"
                      aria-label="Confirmar edicao"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(null)
                        setEditandoNome("")
                      }}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                      aria-label="Cancelar edicao"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                        cat.tipo === "receita" ? "bg-income" : "bg-expense"
                      )}
                    />
                    <span className="flex-1 text-sm text-card-foreground">
                      {cat.nome}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(cat.id)
                        setEditandoNome(cat.nome)
                      }}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={`Editar categoria ${cat.nome}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(cat.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remover categoria ${cat.nome}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Account / Session Management */}
      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h3 className="mb-2 text-sm font-semibold text-destructive">
          Conta e Sessão
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Gerencie o acesso à sua conta.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-white px-4 py-3 text-sm font-bold text-destructive shadow-sm transition-all hover:bg-destructive hover:text-white active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </section>
    </div>
  )
}
