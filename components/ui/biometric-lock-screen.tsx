"use client"

import React from "react"
import { Fingerprint, Scan, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface BiometricLockScreenProps {
    biometryType: string
    onUnlock: () => void
    isUnlocking?: boolean
}

export function BiometricLockScreen({
    biometryType,
    onUnlock,
    isUnlocking,
}: BiometricLockScreenProps) {
    const icon = biometryType === "face" ? Eye : biometryType === "fingerprint" ? Fingerprint : Scan
    const Icon = icon

    const label =
        biometryType === "face"
            ? "Face ID"
            : biometryType === "fingerprint"
                ? "Touch ID"
                : "Biometria"

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
                    $
                </div>
                <span className="text-2xl font-bold tracking-tight">FinControl</span>
            </div>

            {/* Biometric prompt */}
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={onUnlock}
                    disabled={isUnlocking}
                    className={cn(
                        "flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 transition-all",
                        "hover:bg-primary/20 hover:border-primary/50 active:scale-95",
                        isUnlocking && "animate-pulse"
                    )}
                >
                    <Icon className="h-12 w-12 text-primary" />
                </button>

                <div className="text-center">
                    <p className="text-lg font-medium text-foreground">
                        Desbloquear com {label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Toque para autenticar
                    </p>
                </div>
            </div>
        </div>
    )
}
