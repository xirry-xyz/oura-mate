"use client"

import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, RefreshCw, ExternalLink, PartyPopper, AlertCircle, Loader2 } from "lucide-react"

interface Status {
    configured: boolean
    oura: { configured: boolean; authorized: boolean }
    telegram: { configured: boolean }
    ai: { configured: boolean; model: string }
    base_url: string
}

const AI_MODELS = [
    { provider: "OpenAI", models: [{ value: "gpt-4o", label: "GPT-4o" }, { value: "o1", label: "o1" }, { value: "o3-mini", label: "o3-mini" }, { value: "gpt-5.2", label: "GPT-5.2" }] },
    { provider: "Google Gemini", models: [{ value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" }, { value: "gemini-3.1-flash", label: "Gemini 3.1 Flash" }, { value: "gemini-3.0-pro", label: "Gemini 3.0 Pro" }, { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }] },
    { provider: "Anthropic", models: [{ value: "claude-4-6-sonnet-20260217", label: "Claude 4.6 Sonnet" }, { value: "claude-4-6-opus-20260205", label: "Claude 4.6 Opus" }, { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" }] },
]

interface Props {
    status: Status
    onRefresh: () => void
    success: string | null
    error: string | null
}

export function StatusDashboard({ status, onRefresh, success, error }: Props) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [adminPassword, setAdminPassword] = useState("")
    const [aiModel, setAiModel] = useState(status.ai.model || "gpt-4o")
    const [aiApiKey, setAiApiKey] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    const handleSaveAIConfig = async () => {
        setIsSaving(true)
        setSaveError("")
        try {
            const body: Record<string, string> = { AI_MODEL: aiModel }
            if (aiApiKey) body.AI_API_KEY = aiApiKey

            const res = await fetch("/api/config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminPassword}`
                },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to save")

            setIsEditOpen(false)
            setAdminPassword("")
            setAiApiKey("")
            onRefresh()
        } catch (e: any) {
            setSaveError(e.message)
        } finally {
            setIsSaving(false)
        }
    }

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

                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-auto flex-col py-4 gap-1">
                                    <span className="text-lg">🧠</span><span className="text-xs">Change AI Model</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Edit AI Configuration</DialogTitle>
                                    <DialogDescription>
                                        Update your AI provider and API Key. You must provide your Admin Password to authorize changes.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Admin Password</Label>
                                        <Input type="password" placeholder="Enter your setup password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>AI Model</Label>
                                        <Select value={aiModel} onValueChange={setAiModel}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AI_MODELS.map(group => (
                                                    <div key={group.provider}>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.provider}</div>
                                                        {group.models.map(m => (
                                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New API Key</Label>
                                        <Input type="password" placeholder="sk-..." value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} />
                                        <p className="text-[10px] text-muted-foreground">Leave blank to keep the existing API key.</p>
                                    </div>
                                    {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSaveAIConfig} disabled={isSaving || !adminPassword}>
                                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" className="h-auto flex-col py-4 gap-1" onClick={async () => {
                            try {
                                const btn = document.getElementById('sync-btn')
                                if (btn) btn.innerHTML = '<span class="text-xs">Syncing...</span>'
                                await fetch('/api/telegram/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setup' }) })
                                if (btn) btn.innerHTML = '<span class="text-xs text-green-500">Synced!</span>'
                                setTimeout(() => { if (btn) btn.innerHTML = '<span class="text-lg">🚀</span><span class="text-xs">Sync Webhook</span>' }, 2000)
                            } catch { }
                        }}>
                            <div id="sync-btn" className="flex flex-col items-center gap-1">
                                <span className="text-lg">🚀</span><span className="text-xs">Sync Webhook</span>
                            </div>
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
