"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function AuthCallbackInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code")

            if (code) {
                const supabase = createClient()
                const { error } = await supabase.auth.exchangeCodeForSession(code)

                if (!error) {
                    router.replace("/")
                    return
                }
            }

            setError("Erro na autenticação. Redirecionando...")
            setTimeout(() => router.replace("/login?error=auth-code-error"), 2000)
        }

        handleCallback()
    }, [router, searchParams])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                {error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : (
                    <>
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Autenticando...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            }
        >
            <AuthCallbackInner />
        </Suspense>
    )
}
