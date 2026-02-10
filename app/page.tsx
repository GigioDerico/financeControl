"use client"

import { useSeedData } from "@/hooks/use-financeiro"
import { AppShell } from "@/components/app-shell"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"
import { BiometricLockScreen } from "@/components/ui/biometric-lock-screen"
import { useState } from "react"

export default function Home() {
  useSeedData()
  const { isLocked, isChecking, biometryType, unlock } = useBiometricAuth()
  const [unlocking, setUnlocking] = useState(false)

  async function handleUnlock() {
    setUnlocking(true)
    await unlock()
    setUnlocking(false)
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isLocked) {
    return (
      <BiometricLockScreen
        biometryType={biometryType}
        onUnlock={handleUnlock}
        isUnlocking={unlocking}
      />
    )
  }

  return <AppShell />
}
