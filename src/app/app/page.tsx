"use client"

import { useState, useEffect } from "react"
import { SetupWizard } from "@/components/SetupWizard"
import { StatusDashboard } from "@/components/StatusDashboard"

interface AppStatus {
  configured: boolean
  oura: { configured: boolean; authorized: boolean; client_id: boolean; client_secret: boolean }
  telegram: { configured: boolean; bot_token: boolean; chat_id: boolean }
  ai: { configured: boolean; model: string; api_key: boolean }
  base_url: string
}

export default function Home() {
  const [status, setStatus] = useState<AppStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status")
      const data = await res.json()
      setStatus(data)
    } catch {
      console.error("Failed to fetch status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  const success = params.get("success")
  const error = params.get("error")

  const isFullySetup = status?.oura?.authorized && status?.telegram?.configured && status?.ai?.configured

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <span className="text-4xl">🔮</span> Oura Mate
          </h1>
          <p className="mt-2 text-muted-foreground">
            AI-Powered Daily Health Analysis
          </p>
        </div>

        {isFullySetup ? (
          <StatusDashboard status={status!} onRefresh={fetchStatus} success={success} error={error} />
        ) : (
          <SetupWizard status={status} onComplete={fetchStatus} success={success} error={error} />
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground">
          <p>Open source · Self-hosted · Your data, your control</p>
        </div>
      </div>
    </div>
  )
}
