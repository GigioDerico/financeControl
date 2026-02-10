"use client"

import { useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    isNative,
    getPlatform,
    registerPush,
    onPushReceived,
    onPushTapped,
    removePushListeners,
} from "@/lib/native"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function usePushNotifications() {
    const registeredRef = useRef(false)

    const registerDevice = useCallback(async () => {
        if (registeredRef.current) return
        if (!isNative()) return

        try {
            const result = await registerPush()
            if (!result) return

            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Send token to our Edge Function
            await fetch(
                `${SUPABASE_URL}/functions/v1/send-push-notifications?action=register-token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        token: result.value,
                        platform: getPlatform(),
                        device_name: `${getPlatform()}-${Date.now()}`,
                    }),
                }
            )

            registeredRef.current = true
            console.log("[Push] Device registered:", result.value.substring(0, 20) + "...")
        } catch (error) {
            console.error("[Push] Registration failed:", error)
        }
    }, [])

    useEffect(() => {
        registerDevice()

        // Listen for incoming push notifications
        onPushReceived((notification) => {
            console.log("[Push] Received:", notification.title)
            // You can show an in-app toast/banner here
        })

        // Listen for tapped push notifications
        onPushTapped((data) => {
            console.log("[Push] Tapped:", data)
            // Navigate to relevant screen based on notification data
            if (data.type === "vencimento_hoje" || data.type === "lembrete_cobranca") {
                // Could navigate to transacoes tab
            }
        })

        return () => {
            removePushListeners()
        }
    }, [registerDevice])
}
