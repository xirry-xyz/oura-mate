"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, RefreshCw, ExternalLink, PartyPopper, AlertCircle } from "lucide-react"

interface Status {
    configured: boolean
    oura: { configured: boolean; authorized: boolean }
    telegram: { configured: boolean }
    ai: { configured: boolean; model: string }
    base_url: string
}

interface Props {
    status: Status
    onRefresh: () => void
    success: string | null
    error: string | null
}

export function StatusDashboard({ status, onRefresh, success, error }: Props) {
    return (
        <div className="space-y-6">
            {success === "oura_connected" && (
                <Alert className="border-green-500/50 bg-green-500/10">
                    <PartyPopper className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Oura Ring connected! 🎉</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Error: {error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">System Status</CardTitle>
                            <CardDescription>All services running</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { icon: "💍", name: "Oura Ring", desc: "Health data", ok: status.oura.authorized, label: ["Connected", "Not connected"] },
                            { icon: "🤖", name: "Telegram Bot", desc: "Messages", ok: status.telegram.configured, label: ["Active", "Not configured"] },
                            { icon: "🧠", name: "AI Analysis", desc: status.ai.model, ok: status.ai.configured, label: ["Ready", "Not configured"] },
                        ].map(s => (
                            <div key={s.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{s.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className={s.ok ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    {s.ok ? s.label[0] : s.label[1]}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-auto flex-col py-4 gap-1" asChild>
                            <a href="https://t.me" target="_blank"><span className="text-lg">💬</span><span className="text-xs">Open Telegram</span><ExternalLink className="h-3 w-3 text-muted-foreground" /></a>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col py-4 gap-1" asChild>
                            <a href="https://cloud.ouraring.com" target="_blank"><span className="text-lg">💍</span><span className="text-xs">Oura Dashboard</span><ExternalLink className="h-3 w-3 text-muted-foreground" /></a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Telegram Commands</CardTitle>
                    <CardDescription>Available commands</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        {[
                            { cmd: "/today", desc: "AI health analysis" },
                            { cmd: "/sleep", desc: "Sleep data" },
                            { cmd: "/activity", desc: "Activity summary" },
                            { cmd: "/week", desc: "7-day trend" },
                            { cmd: "/ask", desc: "Ask about your health" },
                        ].map(({ cmd, desc }) => (
                            <div key={cmd} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{cmd}</code>
                                <span className="text-xs text-muted-foreground">{desc}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
