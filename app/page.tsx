"use client"

import { useSeedData } from "@/hooks/use-financeiro"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  useSeedData()
  return <AppShell />
}
