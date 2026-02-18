"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    isNative,
    checkBiometric,
    biometricAuth,
    saveCredentials,
    getCredentials,
} from "@/lib/native"

type BiometricState = "checking" | "locked" | "unlocked" | "unavailable"

export function useBiometricAuth() {
    const [state, setState] = useState<BiometricState>("checking")
    const [biometryType, setBiometryType] = useState<string>("none")

    useEffect(() => {
        checkAvailability()
    }, [])

    async function checkAvailability() {
        if (!isNative()) {
            setState("unlocked")
            return
        }

        const status = await checkBiometric()
        setBiometryType(status.biometryType)

        if (!status.available) {
            setState("unlocked")
            return
        }

        // Check if user has saved credentials (opted in to biometric)
        const creds = await getCredentials()
        if (creds) {
            setState("locked")
        } else {
            setState("unlocked")
        }
    }

    const unlock = useCallback(async (): Promise<boolean> => {
        try {
            const success = await biometricAuth()
            if (success) {
                setState("unlocked")

                // Auto-restore session from saved credentials
                const creds = await getCredentials()
                if (creds) {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()

                    // If no active session, try to re-login with stored credentials
                    if (!session) {
                        await supabase.auth.signInWithPassword({
                            email: creds.username,
                            password: creds.password,
                        })
                    }
                }
            }
            return success
        } catch {
            return false
        }
    }, [])

    const enableBiometric = useCallback(async (email: string, password: string) => {
        if (!isNative()) return false

        const status = await checkBiometric()
        if (!status.available) return false

        await saveCredentials(email, password)
        return true
    }, [])

    const disableBiometric = useCallback(async () => {
        if (!isNative()) return
        const { deleteCredentials } = await import("@/lib/native/biometrics")
        await deleteCredentials()
    }, [])

    return {
        state,
        biometryType,
        unlock,
        enableBiometric,
        disableBiometric,
        isLocked: state === "locked",
        isChecking: state === "checking",
    }
}
