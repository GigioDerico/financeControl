"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Fallback for missing icon
const DefaultIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 2v20" />
        <path d="M2 12h20" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get("error")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(errorMsg ? "Erro na autenticação" : "")
    const [mode, setMode] = useState<"login" | "signup">("login")

    const supabase = createClient()

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setErrorMessage("")

        if (mode === "login") {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                setErrorMessage(error.message)
                setLoading(false)
            } else {
                router.push("/") // Redireciona para home apos login
                router.refresh()
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) {
                setErrorMessage(error.message)
                setLoading(false)
            } else {
                setErrorMessage("Verifique seu email para confirmar o cadastro!") // Mensagem de sucesso no lugar do erro
                setLoading(false) // Nao redireciona, espera confirmar email
            }
        }
    }

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground overflow-hidden">

            {/* Visual Side (Left) */}
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />

                {/* Generative Gradient Mesh */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 30%, #10b981 0%, transparent 40%), 
                                 radial-gradient(circle at 80% 80%, #059669 0%, transparent 40%)`
                    }}
                />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
                    <div className="mr-2 h-6 w-6 rounded bg-emerald-500 flex items-center justify-center">
                        <span className="font-bold text-black text-xs">$</span>
                    </div>
                    FinControl
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Controle financeiro preciso, sem planilhas complexas. A clareza que sua empresa precisava.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">Giorgio Derico</footer>
                    </blockquote>
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="lg:p-8 relative">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {mode === "login"
                                ? "Digite seu email e senha para entrar"
                                : "Preencha os dados abaixo para começar"}
                        </p>
                    </div>

                    <div className={cn("grid gap-6")}>
                        <form onSubmit={handleAuth}>
                            <div className="grid gap-4">
                                <div className="grid gap-1">
                                    <Label className="sr-only" htmlFor="email">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        placeholder="nome@exemplo.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={loading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 bg-background/50 border-input hover:border-emerald-500/50 transition-colors"
                                        required
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="sr-only" htmlFor="password">
                                        Senha
                                    </Label>
                                    <Input
                                        id="password"
                                        placeholder="Sua senha segura"
                                        type="password"
                                        autoCapitalize="none"
                                        autoComplete="current-password"
                                        disabled={loading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 bg-background/50 border-input hover:border-emerald-500/50 transition-colors"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <Button disabled={loading} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium mt-2">
                                    {loading && (
                                        <DefaultIcon className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {mode === "login" ? "Entrar" : "Criar Conta"}
                                </Button>
                            </div>
                        </form>

                        {errorMessage && (
                            <p className={cn("px-8 text-center text-sm", errorMessage.includes("Verifique") ? "text-emerald-500" : "text-red-500")}>
                                {errorMessage}
                            </p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Ou
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
                                onClick={() => {
                                    setMode(mode === "login" ? "signup" : "login")
                                    setErrorMessage("")
                                }}
                            >
                                {mode === "login" ? "Não tem uma conta? Crie agora" : "Já tem uma conta? Faça login"}
                            </button>
                        </div>

                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Ao clicar em continuar, você concorda com nossos{" "}
                        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                            Termos de Serviço
                        </a>{" "}
                        e{" "}
                        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            Privacidade
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
