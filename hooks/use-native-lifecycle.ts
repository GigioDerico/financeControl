"use client"

import { useEffect } from "react"
import { App as CapApp } from "@capacitor/app"
import { isNative } from "@/lib/native"

export function useNativeLifecycle() {
    useEffect(() => {
        if (!isNative()) return

        // Handle back button on Android
        const backHandler = CapApp.addListener("backButton", ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back()
            } else {
                CapApp.exitApp()
            }
        })

        // Handle app URL open (deep links)
        const urlHandler = CapApp.addListener("appUrlOpen", ({ url }) => {
            console.log("[App] Deep link:", url)

            // Handle Supabase OAuth callback
            if (url.includes("/auth/callback")) {
                const urlObj = new URL(url)
                const code = urlObj.searchParams.get("code")
                if (code) {
                    window.location.href = `/auth/callback?code=${code}`
                }
            }
        })

        // Handle app state change (foreground/background)
        const stateHandler = CapApp.addListener("appStateChange", ({ isActive }) => {
            console.log("[App] State:", isActive ? "foreground" : "background")
        })

        return () => {
            backHandler.then(l => l.remove())
            urlHandler.then(l => l.remove())
            stateHandler.then(l => l.remove())
        }
    }, [])
}
